import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import fs from "fs";
import path from "path";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    const { name, bio } = (await request.json()) as { name?: string; bio?: string };

    // Try MongoDB first
    try {
      await connectDB();
      const updated = await User.findOneAndUpdate(
        { email: session.user.email },
        { $set: { name, bio } },
        { new: true }
      );
      if (updated) {
        return NextResponse.json({ message: "Profil mis à jour" });
      }
    } catch (dbError) {
      // fallback to mock DB
    }

    // Fallback: update mock DB
    const DATA_DIR = path.join(process.cwd(), "data");
    const USERS_FILE = path.join(DATA_DIR, "users.json");
    const EMAIL_TO_ID_FILE = path.join(DATA_DIR, "emailToId.json");

    if (!fs.existsSync(USERS_FILE) || !fs.existsSync(EMAIL_TO_ID_FILE)) {
      return NextResponse.json({ message: "Fichier de données introuvable" }, { status: 500 });
    }

    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    const emailToId = JSON.parse(fs.readFileSync(EMAIL_TO_ID_FILE, "utf8"));

    const userId = emailToId[session.user.email.toLowerCase()];
    if (!userId || !users[userId]) {
      return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });
    }

    if (name) users[userId].name = name;
    users[userId].updatedAt = new Date().toISOString();

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    return NextResponse.json({ message: "Profil mis à jour" });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
