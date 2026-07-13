import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import DataStore from "@/models/DataStore";
import { MockCorbeille } from "@/lib/mock-db";

const CORBEILLE_KEY = "corbeille";

async function removeFromDataStore(id: string) {
  try {
    await connectDB();
    const doc = await DataStore.findOne({ key: CORBEILLE_KEY }).lean();
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;

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
