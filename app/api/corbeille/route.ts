import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import DataStore from "@/models/DataStore";
import { MockCorbeille } from "@/lib/mock-db";

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

async function addToDataStore(item: any) {
  try {
    await connectDB();
    const doc = await DataStore.findOne({ key: CORBEILLE_KEY });
    const items = (doc?.value && Array.isArray(doc.value)) ? [...doc.value] : [];
    items.unshift(item);
    await DataStore.findOneAndUpdate(
      { key: CORBEILLE_KEY },
      { key: CORBEILLE_KEY, value: items },
      { upsert: true }
    );
    return true;
  } catch (e) {
    console.error("DataStore corbeille write failed:", e);
    return false;
  }
}

async function removeFromDataStore(id: string) {
  try {
    await connectDB();
    const doc = await DataStore.findOne({ key: CORBEILLE_KEY });
    const items = (doc?.value && Array.isArray(doc.value)) ? doc.value : [];
    const filtered = items.filter((i: any) => i.id !== id);
    if (filtered.length === items.length) return false;
    await DataStore.findOneAndUpdate(
      { key: CORBEILLE_KEY },
      { key: CORBEILLE_KEY, value: filtered },
      { upsert: true }
    );
    return true;
  } catch (e) {
    console.error("DataStore corbeille remove failed:", e);
    return false;
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
    return true;
  } catch (e) {
    console.error("DataStore corbeille clear failed:", e);
    return false;
  }
}

async function restoreInDataStore(id: string) {
  return removeFromDataStore(id);
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

    // Write to DataStore directly
    const dsOk = await addToDataStore(item);

    // Also write to MockCorbeille (memoryCache for same-request reads, local dev)
    let mockOk = false;
    try {
      await MockCorbeille.create(item);
      mockOk = true;
    } catch (e) {
      console.error("MockCorbeille POST failed:", e);
    }

    if (!dsOk && !mockOk) {
      return NextResponse.json({ message: "Erreur lors de l'ajout à la corbeille" }, { status: 500 });
    }

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

    const dsOk = await removeFromDataStore(id);

    let mockOk = false;
    try {
      const deleted = await MockCorbeille.findByIdAndDelete(id);
      mockOk = !!deleted;
    } catch (e) {
      console.error("MockCorbeille DELETE failed:", e);
    }

    if (!dsOk && !mockOk) {
      return NextResponse.json({ message: "Élément non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ message: "Élément supprimé" });
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export { restoreInDataStore, clearDataStore };
