import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Document from "@/models/Document";
import FileStore from "@/models/FileStore";
import Corbeille from "@/models/Corbeille";
import { MockDocument, MockCorbeille } from "@/lib/mock-db";
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

async function addDocToCorbeille(doc: any, session: any) {
  const userName = session?.user?.name || "Utilisateur inconnu";
  const userEmail = session?.user?.email || "—";
  const userAvatar = userName.split(" ").map((w: string) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
  const item = {
    id: "corbeille-fichier-" + Date.now(),
    type: "Fichier" as const,
    nom: `${doc.nomDocument || "document"}.${doc.type || "pdf"}`,
    supprimePar: { nom: userName, email: userEmail, fonction: (session?.user as any)?.role || "Utilisateur", avatar: userAvatar },
    supprimeLe: new Date().toISOString(),
    supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    sourceData: doc,
  };
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      await Corbeille.findOneAndUpdate(
        { corbeilleId: item.id },
        {
          corbeilleId: item.id, workspaceId: session.user.workspaceId, deletedBy: session.user.id,
          type: "Fichier", nom: item.nom, supprimePar: item.supprimePar,
          supprimeLe: new Date(item.supprimeLe), supprimeDefinitivementLe: new Date(item.supprimeDefinitivementLe),
          sourceData: item.sourceData,
        },
        { upsert: true }
      );
    } catch (dbError) {
      console.error("Corbeille MongoDB POST failed:", dbError);
    }
  }
  try {
    await MockCorbeille.create({ ...item, workspaceId: session.user.workspaceId, deletedBy: session.user.id });
  } catch (e) {
    console.error("Corbeille MockCorbeille POST failed:", e);
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
      await addDocToCorbeille(document.toObject?.() || document, session);

      await Document.findByIdAndDelete(id);
      return NextResponse.json({ message: "Document supprimé" });
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB to delete document");
      const deleted = await MockDocument.findByIdAndDelete(id);
      if (!deleted) return NextResponse.json({ message: "Document non trouvé" }, { status: 404 });
      
      if (deleted.url) await deleteFileStore(deleted.url);
      await addDocToCorbeille(deleted, session);
      
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
