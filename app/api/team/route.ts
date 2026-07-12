import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import WorkspaceMember from "@/models/WorkspaceMember";
import { MockTeam, MockWorkspaceMember, MockUser } from "@/lib/mock-db";
import { hash } from "bcryptjs";
import { logActivity } from "@/lib/activity";
import { notifyWorkspaceMembers } from "@/lib/notifications";

function generateTempPassword(): string {
  return "Temp" + Math.random().toString(36).slice(2, 10) + "1!";
}

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

  if (!isEditing && data.password && data.password.trim().length > 0 && data.password.length < 6) errors.password = "Minimum 6 caractères";

  if (data.telephone && !/^\d{8,}$/.test(data.telephone.replace(/\s/g, ''))) {
    errors.telephone = "Téléphone invalide (8+ chiffres)";
  }

  return errors;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId;
    let team: any[] = await MockTeam.find({ workspaceId });
    if (team.length === 0 && workspaceId) {
      const members = await MockWorkspaceMember.find({ workspaceId });
      const seen = new Set<string>();
      for (const m of members) {
        if (seen.has(m.userId)) continue;
        seen.add(m.userId);
        const user = await MockUser.findById(m.userId);
        let nom = user?.nom || "";
        let prenom = user?.prenom || "";
        if (!user) {
          try {
            await connectDB();
            const mongoUser = await User.findById(m.userId);
            if (mongoUser) {
              nom = mongoUser.nom || mongoUser.name || "";
              prenom = mongoUser.prenom || "";
            }
          } catch {}
        }
        team.push({
          _id: m.userId,
          nom,
          prenom,
          email: "",
          role: m.role || "Membre",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
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
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const body = await request.json();
    const validationErrors = validateTeamMemberServer(body, false);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ message: "Erreur de validation", errors: validationErrors }, { status: 400 });
    }

    // Check duplicate email in mock-db
    const existingMock = await MockTeam.find({ workspaceId: session.user.workspaceId }).then(team => team.find(m => m.email.toLowerCase() === body.email.toLowerCase()));
    let existingMongo = false;
    try {
      await connectDB();
      const mongoUser = await User.findOne({ email: body.email.toLowerCase() });
      if (mongoUser) {
        const wsMember = await WorkspaceMember.findOne({ workspaceId: session.user.workspaceId, userId: mongoUser._id });
        if (wsMember) existingMongo = true;
      }
    } catch { /* ignore */ }

    if (existingMock || existingMongo) {
      return NextResponse.json({ message: "Email déjà utilisé" }, { status: 409 });
    }

    // Generate password if not provided
    const password = body.password || generateTempPassword();
    const hashedPassword = await hash(password, 12);

    // Create in mock-db (always)
    const mockUser = await MockTeam.create({ ...body, password: hashedPassword, photo: body.photo, avatar: body.photo, workspaceId: session.user.workspaceId });

    // Create in MongoDB (dual-write: User + WorkspaceMember)
    let mongoUserId: string | null = null;
    try {
      await connectDB();
      const newUser = await User.create({
        nom: body.nom,
        prenom: body.prenom,
        name: `${body.prenom} ${body.nom}`,
        email: body.email.toLowerCase(),
        password: hashedPassword,
        telephone: body.telephone || "",
        role: body.role || "Développeur",
        provider: "credentials",
      });
      mongoUserId = newUser._id.toString();
      await WorkspaceMember.create({
        workspaceId: session.user.workspaceId,
        userId: newUser._id,
        role: body.role || "Développeur",
        status: body.statut || "Actif",
      });
    } catch { /* mongo write failed, mock-db entry already saved */ }

    await logActivity({
      workspaceId: session.user.workspaceId,
      userId: session.user.id,
      userName: session.user.name || "",
      userEmail: session.user.email || "",
      entityType: "team",
      entityId: mockUser._id.toString(),
      entityName: `${body.prenom} ${body.nom}`,
      action: "created",
    });
    await notifyWorkspaceMembers(
      session.user.workspaceId,
      session.user.id,
      "activity",
      `Nouveau membre : ${body.prenom} ${body.nom}`,
      `${session.user.name || "Quelqu'un"} a ajouté ${body.prenom} ${body.nom} à l'équipe`,
      `/dashboard/team`,
      "team", mockUser._id.toString(),
      session.user.name || "",
    );
    return NextResponse.json(mockUser, { status: 201 });
  } catch (error) {
    console.error("Error creating team member:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
