import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockProject } from "@/lib/mock-db";
import { logActivity } from "@/lib/activity";
import { notifyWorkspaceMembers } from "@/lib/notifications";

const STATUTS = ["En attente", "En cours", "En test", "Terminé", "Suspendu"] as const;
const PRIORITES = ["Faible", "Moyenne", "Haute", "Urgente"] as const;

const validateProjectServer = (data: any) => {
  const errors: any = {};
  if (!data.titre?.trim()) errors.titre = "Titre obligatoire";
  else if (data.titre.trim().length < 5) errors.titre = "Minimum 5 caractères";
  else if (data.titre.length > 100) errors.titre = "Maximum 100 caractères";
  
  if (!data.description?.trim()) errors.description = "Description obligatoire";
  else if (data.description.trim().length < 20) errors.description = "Minimum 20 caractères";
  else if (data.description.length > 1000) errors.description = "Maximum 1000 caractères";
  
  if (!data.budget || isNaN(data.budget) || Number(data.budget) <= 0) errors.budget = "Budget doit être > 0";
  if (!data.dateDebut) errors.dateDebut = "Date début obligatoire";
  if (!data.dateFin) errors.dateFin = "Date fin obligatoire";
  else if (data.dateDebut && new Date(data.dateFin) <= new Date(data.dateDebut)) errors.dateFin = "Date fin > date début";
  if (!data.clientId) errors.clientId = "Client obligatoire";
  
  if (data.statut && !STATUTS.includes(data.statut as any)) errors.statut = "Statut invalide";
  if (data.priorite && !PRIORITES.includes(data.priorite as any)) errors.priorite = "Priorité invalide";
  
  return errors;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId;
    console.log("Using mock DB for projects");
    const projects = await MockProject.find(workspaceId);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId || "mock-workspace";
    const userId = session?.user?.id || "mock-user";
    const userName = session?.user?.name || "Utilisateur";
    const userEmail = session?.user?.email || "";
    const body = await request.json();
    const validationErrors = validateProjectServer(body);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ message: "Erreur de validation", errors: validationErrors }, { status: 400 });
    }
    
    const { titre, description, dateDebut, dateFin, budget, statut, priorite, clientId, chefProjet } = body;
    console.log("Using mock DB to create project");
    const project = await MockProject.create({ titre, description, dateDebut, dateFin, budget, statut, priorite, clientId, chefProjet, workspaceId });
    await logActivity({
      workspaceId, userId, userName, userEmail,
      entityType: "project",
      entityId: project._id.toString(),
      entityName: titre,
      action: "created",
    });
    await notifyWorkspaceMembers(
      workspaceId,
      userId,
      "activity",
      `Nouveau projet : ${titre}`,
      `${userName || "Quelqu'un"} a créé le projet "${titre}"`,
      `/dashboard/projects/${project._id}`,
      "project", project._id.toString(),
      userName,
    );
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
