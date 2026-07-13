import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import FileStore from "@/models/FileStore";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "agencyflow";

    if (!file) {
      return NextResponse.json({ message: "Aucun fichier reçu" }, { status: 400 });
    }

    const allowedTypes = [
      "image/jpeg", "image/png", "image/jpg",
      "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip", "application/x-zip-compressed",
    ];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip"];
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ message: "Type de fichier invalide (JPG, PNG, PDF, Word, Excel, ZIP)" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ message: "Fichier trop volumineux (max 5MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

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
          workspaceId: session.user.workspaceId || "",
          uploadedBy: session.user.id,
        });
        return NextResponse.json({
          url: `/api/files/${fileDoc._id}`,
          originalName: file.name,
          type: file.type,
        });
      } catch (dbError) {
        console.error("FileStore upload failed:", dbError);
        return NextResponse.json({ message: "Erreur lors de l'upload" }, { status: 500 });
      }
    }

    // Fallback to local filesystem
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    const filePath = path.join(uploadDir, uniqueName);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    const fileUrl = `/uploads/${folder}/${uniqueName}`;

    return NextResponse.json({
      url: fileUrl,
      originalName: file.name,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Erreur lors de l'upload" }, { status: 500 });
  }
}
