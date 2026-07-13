import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Document from "@/models/Document";
import FileStore from "@/models/FileStore";
import { MockDocument } from "@/lib/mock-db";
import fs from "fs";
import path from "path";

async function deleteFileStore(url: string) {
  const match = url.match(/^\/api\/files\/([a-f0-9]+)$/i);
  if (!match) return;
  try {
    await connectDB();
    await FileStore.findByIdAndDelete(match[1]);
  } catch (e) {
    console.warn("Could not delete from FileStore:", e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    
    try {
      await connectDB();
      const document = await Document.findById(id);
      if (!document) return NextResponse.json({ message: "Document non trouvé" }, { status: 404 });

      if (document.url) await deleteFileStore(document.url);

      await Document.findByIdAndDelete(id);
      return NextResponse.json({ message: "Document supprimé" });
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB to delete document");
      const deleted = await MockDocument.findByIdAndDelete(id);
      if (!deleted) return NextResponse.json({ message: "Document non trouvé" }, { status: 404 });
      
      if (deleted.url) await deleteFileStore(deleted.url);
      
      // Delete local file if needed
      if (deleted.url && deleted.url.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), "public", deleted.url);
        if (fs.existsSync(localPath)) {
          try {
            fs.unlinkSync(localPath);
          } catch (e) {
            console.warn("Could not delete local file:", e);
          }
        }
      }
      
      return NextResponse.json({ message: "Document supprimé" });
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    
    let document;
    try {
      await connectDB();
      document = await Document.findById(id)
        .populate("projectId", "titre")
        .populate("uploadedBy", "nom prenom");
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB for document");
      document = await MockDocument.findById(id);
    }
    
    if (!document) return NextResponse.json({ message: "Document non trouvé" }, { status: 404 });
    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
