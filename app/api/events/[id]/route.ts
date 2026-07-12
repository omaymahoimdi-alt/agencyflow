import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockEvent } from "@/lib/mock-db";
import { logActivity } from "@/lib/activity";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await MockEvent.findById(id);
    if (!event) return NextResponse.json({ message: "Événement non trouvé" }, { status: 404 });
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId || "mock-workspace";
    const userId = session?.user?.id || "mock-user";
    const userName = session?.user?.name || "Utilisateur";
    const userEmail = session?.user?.email || "";

    const { id } = await params;
    const body = await request.json();
    const existing = await MockEvent.findById(id);
    if (!existing) return NextResponse.json({ message: "Événement non trouvé" }, { status: 404 });

    const event = await MockEvent.findByIdAndUpdate(id, {
      titre: body.titre?.trim(),
      description: body.description?.trim(),
      type: body.type,
      dateDebut: body.dateDebut,
      dateFin: body.dateFin || body.dateDebut,
      employeId: body.employeId || undefined,
      statut: body.statut,
    });
    if (!event) return NextResponse.json({ message: "Événement non trouvé" }, { status: 404 });

    await logActivity({
      workspaceId, userId, userName, userEmail,
      entityType: "event", entityId: id, entityName: event.titre,
      action: "updated",
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId || "mock-workspace";
    const userId = session?.user?.id || "mock-user";
    const userName = session?.user?.name || "Utilisateur";
    const userEmail = session?.user?.email || "";

    const { id } = await params;
    const event = await MockEvent.findByIdAndDelete(id);
    if (!event) return NextResponse.json({ message: "Événement non trouvé" }, { status: 404 });

    await logActivity({
      workspaceId, userId, userName, userEmail,
      entityType: "event", entityId: id, entityName: event.titre,
      action: "deleted",
    });

    return NextResponse.json({ message: "Événement supprimé" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
