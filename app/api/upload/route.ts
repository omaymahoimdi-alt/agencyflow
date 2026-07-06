import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",
      "application/x-zip-compressed",
    ];
    // Also check file extension as fallback (since some file types don't have correct MIME types)
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip"];
    const fileExtension = path.extname(file.name).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ message: "Type de fichier invalide (JPG, PNG, PDF, Word, Excel, ZIP)" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ message: "Fichier trop volumineux (max 5MB)" }, { status: 400 });
    }

    // Generate unique filename
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    const filePath = path.join(uploadDir, uniqueName);

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    // Return URL
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
