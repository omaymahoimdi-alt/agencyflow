import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const PROJECT_FOLDERS_KEY_PREFIX = "project_folders_";

async function getFoldersFromStore(projectId: string) {
  const { default: DataStore } = await import("@/models/DataStore");
  const { connectDB } = await import("@/lib/mongodb");
  await connectDB();
  const doc = await DataStore.findOne({ key: PROJECT_FOLDERS_KEY_PREFIX + projectId });
  return doc?.value || null;
}

async function saveFoldersToStore(projectId: string, data: any) {
  const { default: DataStore } = await import("@/models/DataStore");
  const { connectDB } = await import("@/lib/mongodb");
  await connectDB();
  await DataStore.findOneAndUpdate(
    { key: PROJECT_FOLDERS_KEY_PREFIX + projectId },
    { key: PROJECT_FOLDERS_KEY_PREFIX + projectId, value: data },
    { upsert: true }
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    let folders = null;

    if (process.env.MONGODB_URI) {
      try {
        folders = await getFoldersFromStore(id);
      } catch {
        // MongoDB failed, fall through to file read
      }
    }
    if (folders === null) {
      const foldersPath = path.join(process.cwd(), "data", `project_folders_${id}.json`);
      if (fs.existsSync(foldersPath)) {
        folders = JSON.parse(fs.readFileSync(foldersPath, "utf8"));
      }
    }

    return NextResponse.json(folders || []);
  } catch (error) {
    console.error("Error loading folders:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const data = await request.json();

    if (process.env.MONGODB_URI) {
      try {
        await saveFoldersToStore(id, data);
      } catch (e) {
        console.error("MongoDB save failed, writing to file:", e);
      }
    }
    // Always write to file as well (fails silently on Vercel read-only fs)
    try {
      const dir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `project_folders_${id}.json`), JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("File write failed (expected on Vercel):", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving folders:", error);
    return NextResponse.json({ message: "Erreur lors de la sauvegarde" }, { status: 500 });
  }
}
