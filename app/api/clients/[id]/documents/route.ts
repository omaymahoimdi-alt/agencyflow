import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockClientDocument } from "@/lib/mock-db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const documents = await MockClientDocument.find({ clientId: id });
    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching client documents:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ message: "Fichier requis" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "clients", id);
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/clients/${id}/${fileName}`;

    const document = await MockClientDocument.create({
      clientId: id,
      documentName: file.name,
      documentType: file.type || "application/octet-stream",
      fileUrl,
      fileSize: file.size,
      uploadedBy: session.user.id,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating client document:", error);
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
    if (!body._id) {
      return NextResponse.json({ message: "ID requis" }, { status: 400 });
    }
    const updated = await MockClientDocument.findByIdAndUpdate(body._id, { clientId: id, ...body });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating client document:", error);
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
    const body = await request.json();
    if (!body._id) {
      return NextResponse.json({ message: "ID requis" }, { status: 400 });
    }
    await MockClientDocument.findByIdAndDelete(body._id);
    return NextResponse.json({ message: "Supprimé" });
  } catch (error) {
    console.error("Error deleting client document:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}