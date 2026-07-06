import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Client from "@/models/Client";
import { MockClient } from "@/lib/mock-db";

// Validation serveur
const validateClientServer = (data: any, existingClients: any[] = [], editingId?: string) => {
  const errors: any = {};
  const SECTEURS = ["E-commerce", "Santé", "Education", "Informatique", "Finance", "Immobilier"];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Nom société
  if (!data.nomSociete?.trim()) errors.nomSociete = "Nom société obligatoire";
  else if (data.nomSociete.trim().length < 3) errors.nomSociete = "Minimum 3 caractères";
  else if (data.nomSociete.length > 100) errors.nomSociete = "Maximum 100 caractères";
  else if (!/^[A-Za-z0-9À-ÿ\s]+$/.test(data.nomSociete)) errors.nomSociete = "Uniquement lettres, chiffres, espaces";

  // Responsable
  if (!data.responsable?.trim()) errors.responsable = "Responsable obligatoire";
  else if (data.responsable.trim().length < 3) errors.responsable = "Minimum 3 caractères";
  else if (data.responsable.length > 50) errors.responsable = "Maximum 50 caractères";
  else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(data.responsable)) errors.responsable = "Uniquement lettres et espaces";

  // Email
  if (!data.email?.trim()) errors.email = "Email obligatoire";
  else if (!emailRegex.test(data.email)) errors.email = "Email invalide";
  else {
    const existingEmail = existingClients.find((c: any) =>
      c.email.toLowerCase() === data.email.toLowerCase() && c._id !== editingId
    );
    if (existingEmail) errors.email = "Email déjà utilisé";
  }

  // Téléphone
  if (data.telephone?.trim() && !/^\d{8}$/.test(data.telephone.trim())) {
    errors.telephone = "8 chiffres exactement";
  }

  // Adresse
  if (data.adresse && data.adresse.length > 200) {
    errors.adresse = "Maximum 200 caractères";
  }

  // Secteur activité
  if (!data.secteurActivite?.trim()) {
    errors.secteurActivite = "Secteur obligatoire";
  } else if (!SECTEURS.includes(data.secteurActivite)) {
    errors.secteurActivite = "Secteur invalide";
  }

  return errors;
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    let client;
    try {
      await connectDB();
      client = await Client.findById(id);
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB");
      client = await MockClient.findById(id);
    }
    if (!client) return NextResponse.json({ message: "Client non trouvé" }, { status: 404 });
    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
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

    // Récupérer tous les clients pour vérifier l'unicité de l'email
    let existingClients;
    try {
      await connectDB();
      existingClients = await Client.find({ userId: session.user.id });
    } catch (dbError) {
      existingClients = await MockClient.find(session.user.id);
    }

    // Validation serveur
    const validationErrors = validateClientServer(body, existingClients, id);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({
        message: "Erreur de validation",
        errors: validationErrors
      }, { status: 400 });
    }

    let client;
    try {
      await connectDB();
      client = await Client.findByIdAndUpdate(id, body, { new: true });
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB to update client");
      client = await MockClient.findByIdAndUpdate(id, body);
    }
    if (!client) return NextResponse.json({ message: "Client non trouvé" }, { status: 404 });
    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
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
    let client;
    try {
      await connectDB();
      client = await Client.findByIdAndDelete(id);
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB to delete client");
      client = await MockClient.findByIdAndDelete(id);
    }
    if (!client) return NextResponse.json({ message: "Client non trouvé" }, { status: 404 });
    return NextResponse.json({ message: "Client supprimé" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
