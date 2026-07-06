import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { MockTeam } from "@/lib/mock-db";
import { hash } from "bcryptjs";

// Validation back-end TypeScript
const validateTeamMemberServer = (data: any, isEditing: boolean) => {
  const errors: Record<string, string> = {};
  
  if (!data.prenom?.trim()) errors.prenom = "Prénom obligatoire";
  else if (data.prenom.trim().length < 2) errors.prenom = "Minimum 2 caractères";
  else if (data.prenom.length > 50) errors.prenom = "Maximum 50 caractères";

  if (!data.nom?.trim()) errors.nom = "Nom obligatoire";
  else if (data.nom.trim().length < 2) errors.nom = "Minimum 2 caractères";
  else if (data.nom.length > 50) errors.nom = "Maximum 50 caractères";

  if (!data.email?.trim()) errors.email = "Email obligatoire";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Email invalide";

  if (!isEditing && !data.password?.trim()) errors.password = "Mot de passe obligatoire";
  else if (!isEditing && data.password.length < 6) errors.password = "Minimum 6 caractères";

  if (data.telephone && !/^\d{8,}$/.test(data.telephone.replace(/\s/g, ''))) {
    errors.telephone = "Téléphone invalide (8+ chiffres)";
  }

  return errors;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    let team = [];
    try {
      await connectDB();
      team = await User.find().select("-password").sort({ createdAt: -1 });
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB for team");
      team = await MockTeam.find();
    }
    return NextResponse.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const body = await request.json();
    const validationErrors = validateTeamMemberServer(body, false);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ message: "Erreur de validation", errors: validationErrors }, { status: 400 });
    }

    let user;
    try {
      await connectDB();
      const existing = await User.findOne({ email: body.email.toLowerCase() });
      if (existing) {
        return NextResponse.json({ message: "Email déjà utilisé" }, { status: 409 });
      }
      const hashedPassword = await hash(body.password, 12);
      const dbUser = await User.create({ ...body, photo: body.photo, avatar: body.photo });
      const { password: _, ...userWithoutPassword } = dbUser.toObject();
      user = userWithoutPassword;
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB to create team member");
      const hashedPassword = await hash(body.password, 12);
      user = await MockTeam.create({ ...body, password: hashedPassword, photo: body.photo, avatar: body.photo });
    }
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating team member:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
