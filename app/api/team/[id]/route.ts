import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Corbeille from "@/models/Corbeille";
import { MockTeam, MockCorbeille } from "@/lib/mock-db";
import { logActivity } from "@/lib/activity";
import { hash } from "bcryptjs";

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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;

    const existing = await MockTeam.findById(id);
    if (!existing) return NextResponse.json({ message: "Membre non trouvé" }, { status: 404 });
    if (existing.workspaceId !== session.user.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const validationErrors = validateTeamMemberServer(body, true);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ message: "Erreur de validation", errors: validationErrors }, { status: 400 });
    }

    const updateData = { ...body };
    if (updateData.photo) {
      updateData.avatar = updateData.photo;
      delete updateData.photo;
    }
    if (updateData.password) {
      updateData.password = await hash(updateData.password, 12);
    } else {
      delete updateData.password;
    }
    const user = await MockTeam.findByIdAndUpdate(id, updateData);

    if (!user) return NextResponse.json({ message: "Membre non trouvé" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;

    const existing = await MockTeam.findById(id);
    if (!existing) return NextResponse.json({ message: "Membre non trouvé" }, { status: 404 });
    if (existing.workspaceId !== session.user.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 403 });
    }

    const deleted = await MockTeam.findByIdAndDelete(id);

    // Add to corbeille (server-side, reliable)
    const userName = session.user.name || "Utilisateur inconnu";
    const userEmail = session.user.email || "—";
    const userAvatar = userName.split(" ").map((w: string) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
    const corbeilleItem = {
      id: "corbeille-membre-" + Date.now(),
      type: "Membre",
      nom: deleted ? `${deleted.prenom} ${deleted.nom}` : "Membre supprimé",
      supprimePar: { nom: userName, email: userEmail, fonction: (session.user as any).role || "Utilisateur", avatar: userAvatar },
      supprimeLe: new Date().toISOString(),
      supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      sourceData: deleted || null,
    };
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        await Corbeille.findOneAndUpdate(
          { corbeilleId: corbeilleItem.id },
          {
            corbeilleId: corbeilleItem.id,
            workspaceId: session.user.workspaceId,
            deletedBy: session.user.id,
            type: "Membre",
            nom: corbeilleItem.nom,
            supprimePar: corbeilleItem.supprimePar,
            supprimeLe: new Date(corbeilleItem.supprimeLe),
            supprimeDefinitivementLe: new Date(corbeilleItem.supprimeDefinitivementLe),
            sourceData: corbeilleItem.sourceData,
          },
          { upsert: true }
        );
      } catch (dbError) {
        console.error("Corbeille MongoDB POST failed:", dbError);
      }
    }
    try {
      await MockCorbeille.create({ ...corbeilleItem, workspaceId: session.user.workspaceId, deletedBy: session.user.id });
    } catch (e) {
      console.error("Corbeille MockCorbeille POST failed:", e);
    }

    await logActivity({
      workspaceId: session.user.workspaceId,
      userId: session.user.id,
      userName: session.user.name || "",
      userEmail: session.user.email || "",
      entityType: "team",
      entityId: id,
      entityName: deleted ? `${deleted.prenom} ${deleted.nom}` : "",
      action: "deleted",
    });

    return NextResponse.json({ message: "Membre supprimé" });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}