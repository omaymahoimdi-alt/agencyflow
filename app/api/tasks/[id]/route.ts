import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockTask, MockCorbeille } from "@/lib/mock-db";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

const STATUTS = ["À faire", "En cours", "Terminée", "Bloquée"] as const;
const PRIORITES = ["Faible", "Moyenne", "Haute", "Urgente"] as const;

const validateTaskServer = (data: any) => {
  const errors: any = {};
  if (data.titre) {
    if (!data.titre.trim()) errors.titre = "Titre obligatoire";
    else if (data.titre.trim().length < 3) errors.titre = "Minimum 3 caractères";
    else if (data.titre.length > 100) errors.titre = "Maximum 100 caractères";
  }
  if (data.description) {
    if (!data.description.trim()) errors.description = "Description obligatoire";
    else if (data.description.trim().length < 10) errors.description = "Minimum 10 caractères";
    else if (data.description.length > 500) errors.description = "Maximum 500 caractères";
  }
  if (data.statut && !STATUTS.includes(data.statut as any)) errors.statut = "Statut invalide";
  if (data.priorite && !PRIORITES.includes(data.priorite as any)) errors.priorite = "Priorité invalide";
  return errors;
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const task = await MockTask.findById(id);
    if (!task) return NextResponse.json({ message: "Tâche non trouvée" }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const validationErrors = validateTaskServer(body);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ message: "Erreur de validation", errors: validationErrors }, { status: 400 });
    }
    const oldTask = await MockTask.findById(id);
    const task = await MockTask.findByIdAndUpdate(id, body);
    if (!task) return NextResponse.json({ message: "Tâche non trouvée" }, { status: 404 });
    const oldTitle = oldTask?.titre || task.titre;
    await logActivity({
      workspaceId: session.user.workspaceId,
      userId: session.user.id,
      userName: session.user.name || "",
      userEmail: session.user.email || "",
      entityType: "task",
      entityId: id,
      entityName: oldTitle,
      action: body.statut && body.statut !== oldTask?.statut ? `status_${body.statut}` : "updated",
    });
    if (body.employeId && body.employeId !== session.user.id && body.employeId !== oldTask?.employeId) {
      await createNotification({
        workspaceId: session.user.workspaceId,
        userId: body.employeId,
        type: "task_assigned",
        title: `Tâche assignée : ${task.titre}`,
        fromUserId: session.user.id,
        fromUserName: session.user.name || "",
      });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
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
    const task = await MockTask.findByIdAndDelete(id);
    if (!task) return NextResponse.json({ message: "Tâche non trouvée" }, { status: 404 });
    const deletedTitle = task.titre || "";

    // Add to corbeille server-side
    const userName = session.user.name || "Utilisateur inconnu";
    const userEmail = session.user.email || "—";
    const userAvatar = userName.split(" ").map((w: string) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
    const corbeilleItem = {
      id: "corbeille-tache-" + Date.now(),
      type: "Tâche",
      nom: deletedTitle,
      supprimePar: { nom: userName, email: userEmail, fonction: (session.user as any).role || "Utilisateur", avatar: userAvatar },
      supprimeLe: new Date().toISOString(),
      supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      sourceData: task,
      workspaceId: session.user.workspaceId,
      deletedBy: session.user.id,
    };
    try {
      await MockCorbeille.create(corbeilleItem);
    } catch (e) {
      console.error("Corbeille MockCorbeille POST failed:", e);
    }

    await logActivity({
      workspaceId: session.user.workspaceId,
      userId: session.user.id,
      userName: session.user.name || "",
      userEmail: session.user.email || "",
      entityType: "task",
      entityId: id,
      entityName: deletedTitle,
      action: "deleted",
    });
    return NextResponse.json({ message: "Tâche supprimée" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}