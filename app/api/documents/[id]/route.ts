import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Document from "@/models/Document";
import { MockDocument } from "@/lib/mock-db";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

      // Delete from Cloudinary if publicId exists
      if (document.publicId) {
        try {
          await cloudinary.uploader.destroy(document.publicId, { resource_type: "auto" });
        } catch (e) {
          console.warn("Could not delete from Cloudinary:", e);
        }
      }

      await Document.findByIdAndDelete(id);
      return NextResponse.json({ message: "Document supprimé" });
    } catch (dbError) {
      console.log("MongoDB not available, using mock DB to delete document");
      const deleted = await MockDocument.findByIdAndDelete(id);
      if (!deleted) return NextResponse.json({ message: "Document non trouvé" }, { status: 404 });
      
      // Delete local file if needed
      if (deleted.url && deleted.url.startsWith('/')) {
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
