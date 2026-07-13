import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockCorbeille } from "@/lib/mock-db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId;
    let items = await MockCorbeille.find(workspaceId);
    // Fallback direct DataStore query if mock-db returned empty
    if (items.length === 0 && process.env.MONGODB_URI) {
      try {
        const { default: DataStore } = await import("@/models/DataStore");
        const { connectDB } = await import("@/lib/mongodb");
        await connectDB();
        const doc = await DataStore.findOne({ key: "data/corbeille.json" }).lean();
        if (doc && Array.isArray(doc.value)) {
          let all = doc.value;
          if (workspaceId) all = all.filter((i: any) => i.workspaceId === workspaceId);
          items = all.sort((a: any, b: any) => new Date(b.supprimeLe).getTime() - new Date(a.supprimeLe).getTime());
        }
      } catch (e) {
        console.error("Corbeille DataStore fallback failed:", e);
      }
    }
    return NextResponse.json(items);
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
    const created = await MockCorbeille.create(item);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
