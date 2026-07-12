import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockCorbeille } from "@/lib/mock-db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId;
    const items = await MockCorbeille.find(workspaceId);
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
