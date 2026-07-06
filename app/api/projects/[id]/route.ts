import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import { MockProject } from "@/lib/mock-db";

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    let project;
    const { id } = await params;
    try {
      await connectDB();
      project = await Project.findById(id)
        .populate("clientId", "nomSociete responsable")
        .populate("chefProjetId", "nom prenom");
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB for project");
      project = await MockProject.findById(id);
    }
    if (!project) return NextResponse.json({ message: "Projet non trouvé" }, { status: 404 });
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    
    const validationErrors = validateProjectServer(body);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ message: "Erreur de validation", errors: validationErrors }, { status: 400 });
    }
    
    let project;
    try {
      await connectDB();
      project = await Project.findByIdAndUpdate(id, body, { new: true })
        .populate("clientId", "nomSociete responsable")
        .populate("chefProjetId", "nom prenom");
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB to update project");
      project = await MockProject.findByIdAndUpdate(id, body);
    }
    if (!project) return NextResponse.json({ message: "Projet non trouvé" }, { status: 404 });
    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    let project;
    const { id } = await params;
    try {
      await connectDB();
      project = await Project.findByIdAndDelete(id);
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB to delete project");
      project = await MockProject.findByIdAndDelete(id);
    }
    if (!project) return NextResponse.json({ message: "Projet non trouvé" }, { status: 404 });
    return NextResponse.json({ message: "Projet supprimé" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
