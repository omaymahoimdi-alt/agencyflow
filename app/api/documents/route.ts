import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Document from "@/models/Document";
import { MockDocument } from "@/lib/mock-db";
import { MockProject } from "@/lib/mock-db";
import { MockTeam } from "@/lib/mock-db";

// Validation TypeScript (contrôle de saisie)
const validateDocumentServer = (data: any) => {
  const errors: Record<string, string> = {};
  
  if (!data.nomDocument?.trim()) errors.nomDocument = "Nom du document obligatoire";
  if (!data.type?.trim()) errors.type = "Type du document obligatoire";
  if (!data.url?.trim()) errors.url = "Fichier obligatoire";
  if (!data.projectId) errors.projectId = "Projet associé obligatoire";
  
  return errors;
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    
    // FORCE USING MOCK DB
    console.log("Using mock DB for documents");
    const documents = await MockDocument.find(session.user.id);
    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const body = await request.json();
    
    // Validation
    const validationErrors = validateDocumentServer(body);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({ message: "Erreur de validation", errors: validationErrors }, { status: 400 });
    }

    // FORCE USING MOCK DB
    console.log("Using mock DB to create document");
    const document = await MockDocument.create({
      ...body,
      uploadedBy: session.user.id,
      userId: session.user.id,
    });
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ message: "Erreur serveur", error: String(error) }, { status: 500 });
  }
}
