import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function useCloudinary(): boolean {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

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
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".zip"];
    const fileExtension = path.extname(file.name).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ message: "Type de fichier invalide (JPG, PNG, PDF, Word, Excel, ZIP)" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ message: "Fichier trop volumineux (max 5MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    if (useCloudinary()) {
      const publicId = `agencyflow/${folder}/${uniqueName.replace(/\.[^.]+$/, "")}`;
      const base64 = buffer.toString("base64");
      const dataUri = `data:${file.type || "application/octet-stream"};base64,${base64}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        public_id: publicId,
        resource_type: "auto",
      });
      return NextResponse.json({
        url: result.secure_url,
        publicId: result.public_id,
        originalName: file.name,
        type: file.type,
      });
    }

    // Fallback to local filesystem (local dev only)
    if (process.env.VERCEL) {
      return NextResponse.json({ message: "Cloudinary non configuré - ajoutez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET dans Vercel" }, { status: 500 });
    }
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
