import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import DataStore from "@/models/DataStore";
import { MockCorbeille } from "@/lib/mock-db";

// Must match CORBEILLE_DATASTORE_KEY in mock-db.ts
const CORBEILLE_KEY = "corbeille";

async function getDataStoreItems(workspaceId?: string) {
  try {
    await connectDB();
    const doc = await DataStore.findOne({ key: CORBEILLE_KEY }).lean();
    if (!doc?.value || !Array.isArray(doc.value)) return [];
    let items = doc.value as any[];
    if (workspaceId) items = items.filter((i: any) => i.workspaceId === workspaceId);
    return items.sort((a: any, b: any) => new Date(b.supprimeLe || 0).getTime() - new Date(a.supprimeLe || 0).getTime());
  } catch (e) {
    console.error("DataStore corbeille read failed:", e);
    return [];
  }
}

async function clearDataStore() {
  try {
    await connectDB();
    await DataStore.findOneAndUpdate(
      { key: CORBEILLE_KEY },
      { key: CORBEILLE_KEY, value: [] },
      { upsert: true }
    );
    await MockCorbeille.deleteMany();
    return true;
  } catch (e) {
    console.error("DataStore corbeille clear failed:", e);
    return false;
  }
}

async function restoreInDataStore(id: string) {
  return MockCorbeille.findByIdAndDelete(id);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId;
    const seen = new Set<string>();
    const all: any[] = [];

    // Primary: read from DataStore directly
    const dsItems = await getDataStoreItems(workspaceId);
    for (const item of dsItems) {
      seen.add(item.id);
      all.push(item);
    }

    // Secondary: merge from MockCorbeille (memoryCache / local dev)
    try {
      const mockItems = await MockCorbeille.find(workspaceId);
      for (const item of mockItems) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          all.push(item);
        }
      }
    } catch (e) {
      console.error("MockCorbeille GET failed:", e);
    }

    return NextResponse.json(all);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const body = await request.json();
    const item = {
      ...body,
      workspaceId: session.user.workspaceId,
      deletedBy: session.user.id,
    };

    // MockCorbeille.create writes to both memoryCache and DataStore
    await MockCorbeille.create(item);

    return NextResponse.json({ id: item.id, type: item.type, nom: item.nom }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "ID requis" }, { status: 400 });
    }

    let ok = false;
    try {
      const deleted = await MockCorbeille.findByIdAndDelete(id);
      ok = !!deleted;
    } catch (e) {
      console.error("MockCorbeille DELETE failed:", e);
    }

    if (!ok) {
      return NextResponse.json({ message: "Élément non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ message: "Élément supprimé" });
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export { restoreInDataStore, clearDataStore };
