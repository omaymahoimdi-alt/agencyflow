import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const EQUIPES_STORAGE_KEY = "project_equipes";

async function getEquipesFromStore(workspaceId: string) {
  const { default: DataStore } = await import("@/models/DataStore");
  const { connectDB } = await import("@/lib/mongodb");
  await connectDB();
  const doc = await DataStore.findOne({ key: EQUIPES_STORAGE_KEY + "_" + workspaceId });
  return doc?.value || [];
}

async function saveEquipesToStore(workspaceId: string, data: any) {
  const { default: DataStore } = await import("@/models/DataStore");
  const { connectDB } = await import("@/lib/mongodb");
  await connectDB();
  await DataStore.findOneAndUpdate(
    { key: EQUIPES_STORAGE_KEY + "_" + workspaceId },
    { key: EQUIPES_STORAGE_KEY + "_" + workspaceId, value: data },
    { upsert: true }
  );
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const workspaceId = session.user.workspaceId || "default";
    let equipes = [];

    if (process.env.VERCEL || process.env.MONGODB_URI) {
      equipes = await getEquipesFromStore(workspaceId);
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const fp = path.default.join(process.cwd(), "data", `equipes_${workspaceId}.json`);
      if (fs.existsSync(fp)) {
        equipes = JSON.parse(fs.readFileSync(fp, "utf8"));
      }
    }

    return NextResponse.json(equipes);
  } catch (error) {
    console.error("Error loading equipes:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const workspaceId = session.user.workspaceId || "default";
    const data = await request.json();

    if (process.env.VERCEL || process.env.MONGODB_URI) {
      await saveEquipesToStore(workspaceId, data);
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const dir = path.default.join(process.cwd(), "data");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.default.join(dir, `equipes_${workspaceId}.json`), JSON.stringify(data, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving equipes:", error);
    return NextResponse.json({ message: "Erreur lors de la sauvegarde" }, { status: 500 });
  }
}
