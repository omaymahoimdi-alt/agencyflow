import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { MockTask } from "@/lib/mock-db";

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
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const projetId = searchParams.get("projetId") || undefined;
    let tasks;
    try {
      await connectDB();
      const filter: any = { userId: session.user.id };
      if (projetId) filter.projetId = projetId;
      tasks = await Task.find(filter)
        .populate("projetId", "titre")
        .populate("employeId", "nom prenom")
        .sort({ createdAt: -1 });
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB for tasks");
      tasks = await MockTask.find({ projetId, userId: session.user.id });
    }
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const body = await request.json();
    console.log("Creating task with body:", body);
    const validationErrors = validateTaskServer(body);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ message: "Erreur de validation", errors: validationErrors }, { status: 400 });
    }
    
    const { titre, description, statut, priorite, dateDebut, dateFin, projetId, employeId } = body;
    let task;
    try {
      await connectDB();
      console.log("Trying MongoDB...");
      task = await Task.create({ titre, description, statut, priorite, dateDebut, dateFin, projetId, employeId, userId: session.user.id });
      const populated = await task.populate([
        { path: "projetId", select: "titre" },
        { path: "employeId", select: "nom prenom" },
      ]);
      task = populated;
    } catch (dbError) {
      console.log("MongoDB failed, error:", dbError);
      console.log("Using mock DB to create task");
      try {
        task = await MockTask.create({ titre, description, statut, priorite, dateDebut, dateFin, projetId, employeId, userId: session.user.id });
        console.log("Mock task created successfully:", task);
      } catch (mockError) {
        console.error("Mock DB create failed:", mockError);
        throw mockError;
      }
    }
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task (full stack):", error);
    return NextResponse.json({ message: "Erreur serveur", error: String(error) }, { status: 500 });
  }
}
