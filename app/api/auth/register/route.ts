import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { slugify } from "@/lib/slug";
import Portfolio from "@/models/Portfolio";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import WorkspaceMember from "@/models/WorkspaceMember";
import Invitation from "@/models/Invitation";
import { MockUser, MockPortfolio, MockInvitation, MockTeam, MockWorkspace, MockWorkspaceMember } from "@/lib/mock-db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      invitationToken?: string;
    };

    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ message: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    let role = "Développeur";
    let invitationData: { workspaceId?: string; equipe?: string } = {};

    if (body.invitationToken) {
      let invitation;
      try {
        await connectDB();
        invitation = await Invitation.findOne({ token: body.invitationToken });
        if (!invitation) {
          invitation = await MockInvitation.findOne({ token: body.invitationToken });
        }
      } catch {
        invitation = await MockInvitation.findOne({ token: body.invitationToken });
      }

      if (!invitation || invitation.statut !== "En attente") {
        return NextResponse.json({ message: "Invitation invalide ou déjà utilisée." }, { status: 400 });
      }

      if (new Date(invitation.expiration) < new Date()) {
        return NextResponse.json({ message: "Cette invitation a expiré." }, { status: 410 });
      }

      role = invitation.role || "Développeur";
      invitationData.workspaceId = invitation.workspaceId;
      invitationData.equipe = invitation.equipe;
    }

    let existingUser;
    try {
      await connectDB();
      existingUser = await User.findOne({ email: body.email.toLowerCase() });
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB");
      existingUser = await MockUser.findOne({ email: body.email.toLowerCase() });
    }

    if (existingUser) {
      return NextResponse.json({ message: "Cet email existe deja." }, { status: 409 });
    }

    const hashedPassword = await hash(body.password, 10);
    let user;
    let slug = slugify(body.name);
    let counter = 1;
    // Try MongoDB first for user + portfolio
    try {
      await connectDB();
      user = await User.create({
        name: body.name,
        email: body.email.toLowerCase(),
        password: hashedPassword,
        role,
      });

      while (await Portfolio.exists({ slug })) {
        slug = `${slugify(body.name)}-${counter}`;
        counter += 1;
      }

      await Portfolio.create({
        userId: user._id,
        title: `Portfolio de ${body.name}`,
        slug,
        bio: "",
        theme: "light",
        primaryColor: "#6366f1",
        isPublished: false,
        views: 0,
      });
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB for registration");
    }

    // If MongoDB failed, create user + portfolio in mock DB
    if (!user) {
      try {
        user = await MockUser.create({
          name: body.name,
          email: body.email.toLowerCase(),
          password: hashedPassword,
          role,
        });

        while (await MockPortfolio.exists({ slug })) {
          slug = `${slugify(body.name)}-${counter}`;
          counter += 1;
        }

        await MockPortfolio.create({
          userId: user._id,
          title: `Portfolio de ${body.name}`,
          slug,
          bio: "",
          theme: "light",
          primaryColor: "#6366f1",
          isPublished: false,
          views: 0,
        });
      } catch (e) {
        console.error("Failed to create mock user:", e);
        return NextResponse.json({ message: "Erreur lors de l'inscription." }, { status: 500 });
      }
    }

    // Now handle workspace membership — write to BOTH DBs unconditionally
    if (body.invitationToken && invitationData.workspaceId) {
      // Write to MongoDB
      try {
        await connectDB();
        const dbUser = await User.findOne({ email: body.email.toLowerCase() });
        if (dbUser) {
          const existingMember = await WorkspaceMember.findOne({ workspaceId: invitationData.workspaceId, userId: dbUser._id });
          if (!existingMember) {
            await WorkspaceMember.create({
              workspaceId: invitationData.workspaceId,
              userId: dbUser._id,
              role,
              equipe: invitationData.equipe || "",
              status: "Actif",
            });
          }
          await Invitation.findOneAndUpdate({ token: body.invitationToken }, { statut: "Acceptée" });
        }
      } catch { /* ignore */ }
      // Write to mock DB
      try {
        const mockUser = await MockUser.findOne({ email: body.email.toLowerCase() });
        if (mockUser) {
          const existingMembers = await MockWorkspaceMember.find({ userId: mockUser._id });
          const alreadyMember = existingMembers.some((m: any) => m.workspaceId === invitationData.workspaceId);
          if (!alreadyMember) {
            await MockWorkspaceMember.create({
              workspaceId: invitationData.workspaceId,
              userId: mockUser._id,
              role,
              equipe: invitationData.equipe || "",
              status: "Actif",
            });
          }
          await MockInvitation.findOneAndUpdate({ token: body.invitationToken }, { statut: "Acceptée" });
          // Also ensure MockTeam entry
          const allTeam = await MockTeam.find();
          const inTeam = allTeam.some((m: any) => m.email.toLowerCase() === body.email!.toLowerCase());
          if (!inTeam) {
            const nameParts = (body.name || "Utilisateur").split(" ");
            await MockTeam.create({
              nom: nameParts.slice(1).join(" ") || "Inconnu",
              prenom: nameParts[0] || "Utilisateur",
              email: body.email!.toLowerCase(),
              password: hashedPassword,
              role,
              userId: mockUser._id,
              workspaceId: invitationData.workspaceId,
            });
          }
        }
      } catch { /* ignore */ }
    } else {
      // No invitation: create workspace in both DBs
      let wsId: string | undefined;

      // Create in MongoDB
      try {
        await connectDB();
        const dbUser = await User.findOne({ email: body.email.toLowerCase() });
        if (dbUser) {
          const existingWs = await Workspace.findOne({ ownerId: dbUser._id });
          if (existingWs) {
            wsId = existingWs._id.toString();
          } else {
            const ws = await Workspace.create({
              nom: `Agence de ${body.name}`,
              ownerId: dbUser._id,
              description: `Espace de travail de ${body.name}`,
            });
            wsId = ws._id.toString();
          }
          const existingMember = await WorkspaceMember.findOne({ workspaceId: wsId, userId: dbUser._id });
          if (!existingMember) {
            await WorkspaceMember.create({ workspaceId: wsId, userId: dbUser._id, role: "Owner", status: "Actif" });
          }
        }
      } catch { /* ignore */ }

      // Create in mock DB
      try {
        const mockUser = await MockUser.findOne({ email: body.email.toLowerCase() });
        if (mockUser) {
          const existingWsList = await MockWorkspace.findByOwner(mockUser._id);
          if (existingWsList.length > 0) {
            wsId = existingWsList[0]._id;
          } else {
            const ws = await MockWorkspace.create({
              nom: `Agence de ${body.name}`,
              ownerId: mockUser._id,
              description: `Espace de travail de ${body.name}`,
            });
            wsId = ws._id;
          }
          const existingMembers = await MockWorkspaceMember.find({ userId: mockUser._id });
          const alreadyMember = existingMembers.some((m: any) => m.workspaceId === wsId);
          if (!alreadyMember) {
            await MockWorkspaceMember.create({ workspaceId: wsId, userId: mockUser._id, role: "Owner", status: "Actif" });
          }
          // MockTeam entry
          const allTeam = await MockTeam.find();
          const inTeam = allTeam.some((m: any) => m.email.toLowerCase() === body.email!.toLowerCase());
          if (!inTeam) {
            const nameParts = (body.name || "Utilisateur").split(" ");
            await MockTeam.create({
              nom: nameParts.slice(1).join(" ") || "Inconnu",
              prenom: nameParts[0] || "Utilisateur",
              email: body.email!.toLowerCase(),
              password: hashedPassword,
              role: "Admin",
              userId: mockUser._id,
              workspaceId: wsId,
            });
          }
        }
      } catch { /* ignore */ }
    }

    return NextResponse.json({ message: "Compte cree avec succes." }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    let errorMessage = "Erreur lors de l'inscription. Veuillez reessayer.";
    
    if (error.message) {
      errorMessage = `Erreur: ${error.message}`;
    }
    
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
