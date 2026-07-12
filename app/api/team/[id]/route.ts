import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockTeam } from "@/lib/mock-db";
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