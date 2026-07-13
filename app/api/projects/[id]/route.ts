import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Corbeille from "@/models/Corbeille";
import { MockProject, MockCorbeille } from "@/lib/mock-db";
import { logActivity } from "@/lib/activity";

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
  
  if (data.budget !== undefined && (isNaN(data.budget) || Number(data.budget) <= 0)) errors.budget = "Budget doit être > 0";
  if (!data.dateDebut) errors.dateDebut = "Date début obligatoire";
  if (!data.dateFin) errors.dateFin = "Date fin obligatoire";
  else if (data.dateDebut && new Date(data.dateFin) <= new Date(data.dateDebut)) errors.dateFin = "Date fin > date début";
  if (!data.clientId) errors.clientId = "Client obligatoire";
  
  if (data.statut && !STATUTS.includes(data.statut)) errors.statut = "Statut invalide";
  if (data.priorite && !PRIORITES.includes(data.priorite)) errors.priorite = "Priorité invalide";
  
  return errors;
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log("Using mock DB for project detail");
    const project = await MockProject.findById(id);
    if (!project) return NextResponse.json({ message: "Projet non trouvé" }, { status: 404 });
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId || "mock-workspace";
    const userId = session?.user?.id || "mock-user";
    const userName = session?.user?.name || "Utilisateur";
    const userEmail = session?.user?.email || "";
    const { id } = await params;
    const body = await request.json();
    
    const validationErrors = validateProjectServer(body);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ message: "Erreur de validation", errors: validationErrors }, { status: 400 });
    }
    
    let project;
    let oldTitle = "";
    try { const old = await MockProject.findById(id); if (old) oldTitle = old.titre; } catch {}
    console.log("Using mock DB to update project");
    project = await MockProject.findByIdAndUpdate(id, body);
    if (!project) return NextResponse.json({ message: "Projet non trouvé" }, { status: 404 });
    await logActivity({
      workspaceId, userId, userName, userEmail,
      entityType: "project",
      entityId: id,
      entityName: oldTitle || project.titre,
      action: "updated",
    });
    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId || "mock-workspace";
    const userId = session?.user?.id || "mock-user";
    const userName = session?.user?.name || "Utilisateur";
    const userEmail = session?.user?.email || "";
    let project;
    const { id } = await params;
    console.log("Using mock DB to delete project");
    project = await MockProject.findByIdAndDelete(id);
    if (!project) return NextResponse.json({ message: "Projet non trouvé" }, { status: 404 });
    const deletedTitle = project.titre || "";

    // Add to corbeille server-side
    const corbeilleItem = {
      id: "corbeille-projet-" + Date.now(),
      type: "Projet",
      nom: deletedTitle,
      supprimePar: { nom: userName, email: userEmail, fonction: (session?.user as any)?.role || "Utilisateur", avatar: (userName.split(" ").map((w: string) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?") },
      supprimeLe: new Date().toISOString(),
      supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      sourceData: project,
    };
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        await Corbeille.findOneAndUpdate(
          { corbeilleId: corbeilleItem.id },
          {
            corbeilleId: corbeilleItem.id, workspaceId, deletedBy: userId,
            type: "Projet", nom: corbeilleItem.nom, supprimePar: corbeilleItem.supprimePar,
            supprimeLe: new Date(corbeilleItem.supprimeLe), supprimeDefinitivementLe: new Date(corbeilleItem.supprimeDefinitivementLe),
            sourceData: corbeilleItem.sourceData,
          },
          { upsert: true }
        );
      } catch (dbError) {
        console.error("Corbeille MongoDB POST failed:", dbError);
      }
    }
    try {
      await MockCorbeille.create({ ...corbeilleItem, workspaceId, deletedBy: userId });
    } catch (e) {
      console.error("Corbeille MockCorbeille POST failed:", e);
    }

    await logActivity({
      workspaceId, userId, userName, userEmail,
      entityType: "project",
      entityId: id,
      entityName: deletedTitle,
      action: "deleted",
    });
    return NextResponse.json({ message: "Projet supprimé" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
