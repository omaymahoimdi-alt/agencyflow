import { compare, hash } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { MockUser, MockPortfolio } from "@/lib/mock-db";
import { slugify } from "@/lib/slug";

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
        } catch (dbError) {
          console.log("MongoDB not available, using mock DB for auth");
          user = await MockUser.findOne({ email: credentials.email.toLowerCase() });
        }

        if (!user) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        // Support both old schema (name) and new schema (nom+prenom)
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
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.photo = (user as { photo?: string }).photo;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role = typeof token.role === "string" ? token.role : undefined;
        (session.user as { photo?: string }).photo = typeof token.photo === "string" ? token.photo : "";
      }
      return session;
    },
  },
};
