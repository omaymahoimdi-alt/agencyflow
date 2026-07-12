import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockTask } from "@/lib/mock-db";
import { logActivity } from "@/lib/activity";
import { createNotification } from "@/lib/notifications";

const STATUTS = ["À faire", "En cours", "Terminée", "Bloquée"] as const;
const PRIORITES = ["Faible", "Moyenne", "Haute", "Urgente"] as const;

const validateTaskServer = (data: any) => {
  const errors: any = {};
  if (!data.titre?.trim()) errors.titre = "Titre obligatoire";
  else if (data.titre.trim().length < 3) errors.titre = "Minimum 3 caractères";
  else if (data.titre.length > 100) errors.titre = "Maximum 100 caractères";
  
  if (!data.description?.trim()) errors.description = "Description obligatoire";
  else if (data.description.trim().length < 10) errors.description = "Minimum 10 caractères";
  else if (data.description.length > 500) errors.description = "Maximum 500 caractères";
  
  if (!data.projetId) errors.projetId = "Projet obligatoire";
  
  if (data.statut && !STATUTS.includes(data.statut as any)) errors.statut = "Statut invalide";
  if (data.priorite && !PRIORITES.includes(data.priorite as any)) errors.priorite = "Priorité invalide";
  
  return errors;
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const projetId = searchParams.get("projetId") || undefined;
    const tasks = await MockTask.find({ projetId, workspaceId: session.user.workspaceId });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const body = await request.json();
    console.log("Creating task with body:", body);
    const validationErrors = validateTaskServer(body);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ message: "Erreur de validation", errors: validationErrors }, { status: 400 });
    }
    
    const { titre, description, statut, priorite, dateDebut, dateFin, projetId, employeId } = body;
    const task = await MockTask.create({ titre, description, statut, priorite, dateDebut, dateFin, projetId, employeId, workspaceId: session.user.workspaceId });
    await logActivity({
      workspaceId: session.user.workspaceId,
      userId: session.user.id,
      userName: session.user.name || "",
      userEmail: session.user.email || "",
      entityType: "task",
      entityId: task._id.toString(),
      entityName: titre,
      action: "created",
    });
    if (employeId && employeId !== session.user.id) {
      await createNotification({
        workspaceId: session.user.workspaceId,
        userId: employeId,
        type: "task_assigned",
        title: `Nouvelle tâche : ${titre}`,
        message: `${session.user.name || "Quelqu'un"} vous a assigné "${titre}"`,
        link: `/dashboard/tasks/${task._id}`,
        entityType: "task",
        entityId: task._id.toString(),
        fromUserId: session.user.id,
        fromUserName: session.user.name || "",
      });
    }
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task (full stack):", error);
    return NextResponse.json({ message: "Erreur serveur", error: String(error) }, { status: 500 });
  }
}
