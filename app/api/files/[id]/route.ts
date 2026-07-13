import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FileStore from "@/models/FileStore";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        const fileDoc = await FileStore.findById(id).lean();
        if (!fileDoc) {
          return NextResponse.json({ message: "Fichier non trouvé" }, { status: 404 });
        }
        const buffer = Buffer.from(fileDoc.data as string, "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": fileDoc.mimeType as string,
            "Content-Disposition": `inline; filename="${fileDoc.originalName}"`,
            "Content-Length": String(buffer.length),
          },
        });
      } catch (dbError) {
        console.error("FileStore fetch failed:", dbError);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "Fichier non trouvé" }, { status: 404 });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
