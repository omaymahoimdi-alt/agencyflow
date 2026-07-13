import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FileStore from "@/models/FileStore";
import { MockClientDocument, MockCorbeille } from "@/lib/mock-db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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
    const { id } = await params;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ message: "Fichier requis" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ message: "Fichier trop volumineux (max 5MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Store in MongoDB via FileStore
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const base64 = buffer.toString("base64");
        const fileDoc = await FileStore.create({
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          data: base64,
          size: file.size,
          workspaceId: session?.user?.workspaceId || "",
          uploadedBy: session?.user?.id || "",
        });
        const fileUrl = `/api/files/${fileDoc._id}`;
        const document = await MockClientDocument.create({
          clientId: id,
          documentName: file.name,
          documentType: file.type || "application/octet-stream",
          fileUrl,
          fileSize: file.size,
          uploadedBy: session?.user?.id || "",
          uploadedByName: session?.user?.name || "",
          uploadedByEmail: session?.user?.email || "",
        });
        return NextResponse.json(document, { status: 201 });
      } catch (dbError) {
        console.error("FileStore upload failed:", dbError);
        return NextResponse.json({ message: "Erreur lors de l'upload" }, { status: 500 });
      }
    }

    // Fallback to local filesystem
    const uploadDir = path.join(process.cwd(), "public", "uploads", "clients", id);
    await mkdir(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/clients/${id}/${fileName}`;

    const document = await MockClientDocument.create({
      clientId: id,
      documentName: file.name,
      documentType: file.type || "application/octet-stream",
      fileUrl,
      fileSize: file.size,
      uploadedBy: session?.user?.id || "",
      uploadedByName: session?.user?.name || "",
      uploadedByEmail: session?.user?.email || "",
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating client document:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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
    const { id } = await params;
    const body = await request.json();
    if (!body._id) {
      return NextResponse.json({ message: "ID requis" }, { status: 400 });
    }
    const deleted = await MockClientDocument.findByIdAndDelete(body._id);
    if (!deleted) return NextResponse.json({ message: "Document non trouvé" }, { status: 404 });

    // Add to corbeille server-side
    const userName = session?.user?.name || "Utilisateur inconnu";
    const userEmail = session?.user?.email || "—";
    const userAvatar = userName.split(" ").map((w: string) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
    const corbeilleItem = {
      id: "corbeille-fichier-" + Date.now(),
      type: "Fichier" as const,
      nom: deleted.documentName || "document",
      supprimePar: { nom: userName, email: userEmail, fonction: (session?.user as any)?.role || "Utilisateur", avatar: userAvatar },
      supprimeLe: new Date().toISOString(),
      supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      sourceData: deleted,
      workspaceId: session?.user?.workspaceId || "",
      deletedBy: session?.user?.id || "",
    };
    try {
      await MockCorbeille.create(corbeilleItem);
    } catch (e) {
      console.error("Corbeille MockCorbeille POST failed:", e);
    }

    return NextResponse.json({ message: "Supprimé" });
  } catch (error) {
    console.error("Error deleting client document:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
