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
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    let task;
    try {
      await connectDB();
      task = await Task.findById(id)
        .populate("projetId", "titre")
        .populate("employeId", "nom prenom");
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB");
      task = await MockTask.findById(id);
    }
    if (!task) return NextResponse.json({ message: "Tâche non trouvée" }, { status: 404 });
    return NextResponse.json(task);
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
    const validationErrors = validateTaskServer(body);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ message: "Erreur de validation", errors: validationErrors }, { status: 400 });
    }
    let task;
    try {
      await connectDB();
      task = await Task.findByIdAndUpdate(id, body, { new: true })
        .populate("projetId", "titre")
        .populate("employeId", "nom prenom");
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB to update task");
      task = await MockTask.findByIdAndUpdate(id, body);
    }
    if (!task) return NextResponse.json({ message: "Tâche non trouvée" }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    let task;
    try {
      await connectDB();
      task = await Task.findByIdAndDelete(id);
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB to delete task");
      task = await MockTask.findByIdAndDelete(id);
    }
    if (!task) return NextResponse.json({ message: "Tâche non trouvée" }, { status: 404 });
    return NextResponse.json({ message: "Tâche supprimée" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
