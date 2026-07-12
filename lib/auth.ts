import { compare, hash } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import WorkspaceMember from "@/models/WorkspaceMember";
import { MockUser, MockPortfolio, MockWorkspace, MockWorkspaceMember, MockTeam } from "@/lib/mock-db";
import { slugify } from "@/lib/slug";

async function resolveWorkspaceId(userId: string, userEmail?: string): Promise<string | undefined> {
  // Prefer activeWorkspaceId stored on the User record (set by switching workspaces)
  let dbEmail: string | undefined = userEmail;
  try {
    await connectDB();
    const dbUser = await User.findById(userId);
    if (dbUser) {
      if (!dbEmail) dbEmail = dbUser.email;
      if ((dbUser as any).activeWorkspaceId) {
        const activeId = (dbUser as any).activeWorkspaceId.toString();
        const mongoMember = await WorkspaceMember.findOne({ userId, workspaceId: activeId });
        if (mongoMember) return activeId;
        // Membership might exist only in mock DB — check there too
        if (dbEmail) {
          const mockUser = await MockUser.findOne({ email: dbEmail });
          const memberIds = mockUser ? [mockUser._id, userId] : [userId];
          for (const mid of [...new Set(memberIds)]) {
            const mockMembers = await MockWorkspaceMember.find({ userId: mid });
            if (mockMembers.some((m: any) => m.workspaceId === activeId)) return activeId;
          }
        }
      }
    }
  } catch { /* fall through */ }
  try {
    const lookupEmail = dbEmail || userEmail;
    if (lookupEmail) {
      const mockUser = await MockUser.findOne({ email: lookupEmail });
      if (mockUser && (mockUser as any).activeWorkspaceId) {
        const activeId = (mockUser as any).activeWorkspaceId;
        const memberIds = [mockUser._id, userId];
        for (const mid of [...new Set(memberIds)]) {
          const mockMembers = await MockWorkspaceMember.find({ userId: mid });
          if (mockMembers.some((m: any) => m.workspaceId === activeId)) return activeId;
        }
        // Also check MongoDB for this activeId
        try {
          await connectDB();
          const mongoUser = await User.findOne({ email: lookupEmail });
          if (mongoUser) {
            const mongoMember = await WorkspaceMember.findOne({ userId: mongoUser._id, workspaceId: activeId });
            if (mongoMember) return activeId;
          }
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
  // Fallback: most recent membership
  try {
    await connectDB();
    const members = await WorkspaceMember.find({ userId }).sort({ createdAt: -1 });
    if (members.length > 0) return members[0].workspaceId.toString();
  } catch { /* fall through */ }
  try {
    const lookupEmail = dbEmail || userEmail;
    if (lookupEmail) {
      const mockUser = await MockUser.findOne({ email: lookupEmail });
      const memberIds = mockUser ? [mockUser._id, userId] : [userId];
      const allMembers: any[] = [];
      for (const mid of [...new Set(memberIds)]) {
        const mockMembers = await MockWorkspaceMember.find({ userId: mid });
        allMembers.push(...mockMembers);
      }
      allMembers.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (allMembers.length > 0) return allMembers[0].workspaceId;
    }
  } catch { /* ignore */ }
  return undefined;
}

async function resolveUserWorkspaces(userId: string, userEmail?: string): Promise<Array<{ workspaceId: string; role: string; nom: string }>> {
  const seen = new Set<string>();
  const workspaces: Array<{ workspaceId: string; role: string; nom: string }> = [];
  // Try MongoDB
  try {
    await connectDB();
    const members = await WorkspaceMember.find({ userId });
    for (const m of members) {
      const wsId = m.workspaceId.toString();
      if (seen.has(wsId)) continue;
      seen.add(wsId);
      const ws = await Workspace.findById(wsId);
      workspaces.push({ workspaceId: wsId, role: m.role, nom: ws ? (ws.nom || "Espace de travail") : "Espace de travail" });
    }
  } catch { /* fall through */ }
  // Also try mock DB for any memberships not in MongoDB (find mock user by email)
  try {
    const mockUserId = userEmail ? (await MockUser.findOne({ email: userEmail.toLowerCase() }))?._id : undefined;
    const mockUserIdToQuery = mockUserId || userId;
    const members = await MockWorkspaceMember.find({ userId: mockUserIdToQuery });
    for (const m of members) {
      if (seen.has(m.workspaceId)) continue;
      seen.add(m.workspaceId);
      const ws = await MockWorkspace.findOne({ _id: m.workspaceId });
      workspaces.push({ workspaceId: m.workspaceId, role: m.role, nom: ws ? (ws.nom || "Espace de travail") : "Espace de travail" });
    }
  } catch { /* ignore */ }
  return workspaces;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        let user;
        try {
          await connectDB();
          user = await User.findOne({ email: credentials.email.toLowerCase() });
          if (!user) {
            user = await MockUser.findOne({ email: credentials.email.toLowerCase() });
          }
        } catch (dbError) {
          console.log("MongoDB not available, using mock DB for auth");
          user = await MockUser.findOne({ email: credentials.email.toLowerCase() });
        }

        if (!user) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        const displayName = (user as any).nom && (user as any).prenom
          ? `${(user as any).prenom} ${(user as any).nom}`
          : (user as unknown as { name?: string }).name || user.email;

        return {
          id: user._id.toString(),
          name: displayName,
          email: user.email,
          role: (user as any).role || "Admin",
          photo: (user as any).photo || "",
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email;
        if (!email) return false;

        let user;
        try {
          await connectDB();
          user = await User.findOne({ email: email.toLowerCase() });
          if (!user) {
            user = await MockUser.findOne({ email: email.toLowerCase() });
          }
        } catch {
          user = await MockUser.findOne({ email: email.toLowerCase() });
        }

        if (user) return true;

        const googleName = (profile as { name?: string })?.name || email.split("@")[0];
        const nameParts = googleName.split(" ");
        const prenom = nameParts[0] || googleName;
        const nom = nameParts.slice(1).join(" ") || googleName;
        const hashedPassword = await hash(account.providerAccountId, 10);
        let slug = slugify(`${prenom}-${nom}`);
        let counter = 1;

        try {
          await connectDB();
          user = await User.create({
            nom,
            prenom,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "Développeur",
            photo: (profile as { picture?: string })?.picture || "",
          });

          while (await (await import("@/models/Portfolio")).default.exists({ slug })) {
            slug = `${slugify(`${prenom}-${nom}`)}-${counter}`;
            counter += 1;
          }

          const Portfolio = (await import("@/models/Portfolio")).default;
          await Portfolio.create({
            userId: user._id,
            title: `Portfolio de ${googleName}`,
            slug,
            bio: "",
            theme: "light",
            primaryColor: "#6D28FF",
            isPublished: false,
            views: 0,
          });

          // Create workspace + workspace member for new Google user
          const workspace = await Workspace.create({
            nom: `Agence de ${googleName}`,
            ownerId: user._id,
            description: `Espace de travail de ${googleName}`,
          });
          await WorkspaceMember.create({
            workspaceId: workspace._id,
            userId: user._id,
            role: "Owner",
            status: "Actif",
          });
        } catch {
          user = await MockUser.create({
            name: googleName,
            nom,
            prenom,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "Développeur",
          });

          while (await MockPortfolio.exists({ slug })) {
            slug = `${slugify(`${prenom}-${nom}`)}-${counter}`;
            counter += 1;
          }

          await MockPortfolio.create({
            userId: user._id,
            title: `Portfolio de ${googleName}`,
            slug,
            bio: "",
            theme: "light",
            primaryColor: "#6D28FF",
            isPublished: false,
            views: 0,
          });

          // Create workspace + workspace member for new Google user (mock)
          const workspace = await MockWorkspace.create({
            nom: `Agence de ${googleName}`,
            ownerId: user._id,
            description: `Espace de travail de ${googleName}`,
          });
          await MockWorkspaceMember.create({
            workspaceId: workspace._id,
            userId: user._id,
            role: "Owner",
            status: "Actif",
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // For Google, resolve Google ID to MongoDB _id via email
        if (account?.provider === "google") {
          const email = (user as { email?: string }).email;
          if (email) {
            try {
              await connectDB();
              const dbUser = await User.findOne({ email: email.toLowerCase() });
              if (dbUser) {
                token.id = dbUser._id.toString();
              } else {
                const mockUser = await MockUser.findOne({ email: email.toLowerCase() });
                if (mockUser) {
                  token.id = mockUser._id;
                }
              }
            } catch {
              const mockUser = await MockUser.findOne({ email: email.toLowerCase() });
              if (mockUser) {
                token.id = mockUser._id;
              }
            }
          }
        } else {
          token.id = user.id;
        }
        token.role = (user as { role?: string }).role;
        token.photo = (user as { photo?: string }).photo || "";
        // Populate workspaceIds on first sign-in
        if (token.id) {
          const resolvedId = await resolveWorkspaceId(token.id as string, token.email as string | undefined);
          if (resolvedId) token.workspaceId = resolvedId;
          const allWs = await resolveUserWorkspaces(token.id as string, token.email as string | undefined);
          token.workspaceIds = allWs;
        }
      }

      // Ensure workspaceId is set (resolve from membership or activeWorkspaceId)
      if (token.id && !token.workspaceId) {
        const resolvedId = await resolveWorkspaceId(token.id as string, token.email as string | undefined);
        if (resolvedId) {
          token.workspaceId = resolvedId;
        } else {
          // First-time user: create workspace + membership in BOTH DBs
          let createdWsId: string | undefined;
          let dbUser: any;
          let mockUser: any;
          try {
            await connectDB();
            dbUser = await User.findById(token.id);
          } catch { /* fall through */ }
          if (dbUser) {
            const existingWs = await (await import("@/models/Workspace")).default.findOne({ ownerId: dbUser._id });
            if (existingWs) {
              await WorkspaceMember.create({ workspaceId: existingWs._id, userId: dbUser._id, role: "Owner", status: "Actif" });
              createdWsId = existingWs._id.toString();
            } else {
              const userName = (dbUser as any).name || `${(dbUser as any).prenom || ""} ${(dbUser as any).nom || ""}`.trim() || dbUser.email;
              const ws = await Workspace.create({ nom: `Agence de ${userName}`, ownerId: dbUser._id, description: `Espace de travail de ${userName}` });
              await WorkspaceMember.create({ workspaceId: ws._id, userId: dbUser._id, role: "Owner", status: "Actif" });
              createdWsId = ws._id.toString();
            }
            // Mirror to mock DB
            try {
              mockUser = await MockUser.findOne({ email: token.email || "" });
              if (mockUser && createdWsId) {
                const existingMockMembers = await MockWorkspaceMember.find({ userId: mockUser._id });
                const alreadyMockMember = existingMockMembers.some((m: any) => m.workspaceId === createdWsId);
                if (!alreadyMockMember) {
                  await MockWorkspaceMember.create({ workspaceId: createdWsId, userId: mockUser._id, role: "Owner", status: "Actif" });
                }
              }
            } catch { /* ignore */ }
          } else {
            mockUser = await MockUser.findOne({ email: token.email || "" });
            if (mockUser) {
              const existingWsList = await MockWorkspace.findByOwner(mockUser._id);
              if (existingWsList.length > 0) {
                await MockWorkspaceMember.create({ workspaceId: existingWsList[0]._id, userId: mockUser._id, role: "Owner", status: "Actif" });
                createdWsId = existingWsList[0]._id;
              } else {
                const userName = (mockUser as any).name || `${(mockUser as any).prenom || ""} ${(mockUser as any).nom || ""}`.trim() || mockUser.email;
                const ws = await MockWorkspace.create({ nom: `Agence de ${userName}`, ownerId: mockUser._id, description: `Espace de travail de ${userName}` });
                await MockWorkspaceMember.create({ workspaceId: ws._id, userId: mockUser._id, role: "Owner", status: "Actif" });
                createdWsId = ws._id;
              }
              // Mirror to MongoDB
              try {
                await connectDB();
                dbUser = await User.findOne({ email: token.email || "" });
                if (dbUser && createdWsId) {
                  const existingDbMembers = await WorkspaceMember.find({ userId: dbUser._id });
                  const alreadyDbMember = existingDbMembers.some((m: any) => m.workspaceId.toString() === createdWsId);
                  if (!alreadyDbMember) {
                    const wsName = `Agence de ${mockUser.name || mockUser.email}`;
                    const ws = await Workspace.create({ nom: wsName, ownerId: dbUser._id, description: `Espace de travail de ${mockUser.name || mockUser.email}` });
                    await WorkspaceMember.create({ workspaceId: ws._id, userId: dbUser._id, role: "Owner", status: "Actif" });
                    createdWsId = ws._id.toString();
                  }
                }
              } catch { /* ignore */ }
            }
          }
          if (createdWsId) {
            token.workspaceId = createdWsId;
          }
        }
        // Refresh workspace list after creation
        if (token.id) {
          token.workspaceIds = await resolveUserWorkspaces(token.id as string, token.email as string | undefined);
        }
      }

      // Re-fetch workspace list + active workspace on every JWT callback call
      if (token.id && !user) {
        token.workspaceIds = await resolveUserWorkspaces(token.id as string, token.email as string | undefined);
        const activeId = await resolveWorkspaceId(token.id as string, token.email as string | undefined);
        if (activeId) token.workspaceId = activeId;
      }

      // Ensure user has a MockTeam entry for the employee count
      if (token.id && token.workspaceId) {
        try {
          const mockUser = await MockUser.findOne({ email: token.email || "" });
          if (mockUser) {
            const allTeam = await MockTeam.find({});
            const hasEntry = allTeam.some((t: any) => t.userId === mockUser._id);
            if (!hasEntry) {
              const nameParts = (mockUser.name || "Utilisateur").split(" ");
              await MockTeam.create({
                nom: nameParts.slice(1).join(" ") || "Inconnu",
                prenom: nameParts[0] || "Utilisateur",
                email: mockUser.email.toLowerCase(),
                password: mockUser.password || "",
                role: "Admin",
                userId: mockUser._id,
                workspaceId: token.workspaceId,
              });
            }
          }
        } catch { /* ignore */ }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role = typeof token.role === "string" ? token.role : undefined;
        session.user.photo = typeof token.photo === "string" ? token.photo : "";
        // Re-resolve from DB so workspace switch via PATCH /api/workspace/active is reflected immediately
        if (token.id) {
          session.user.workspaceId = await resolveWorkspaceId(token.id as string, token.email as string | undefined);
          session.user.workspaceIds = await resolveUserWorkspaces(token.id as string, token.email as string | undefined);
        }
      }
      return session;
    },
  },
};
