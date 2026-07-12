import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockEvent } from "@/lib/mock-db";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId;
    console.log("Using mock DB for events");
    const events = await MockEvent.find(workspaceId);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId || "mock-workspace";
    const userId = session?.user?.id || "mock-user";
    const userName = session?.user?.name || "Utilisateur";
    const userEmail = session?.user?.email || "";

    const body = await request.json();
    const { titre, description, type, dateDebut, dateFin, employeId, projectId, statut } = body;

    if (!titre?.trim() || !dateDebut) {
      return NextResponse.json({ message: "Titre et date début obligatoires" }, { status: 400 });
    }

    const event = await MockEvent.create({
      workspaceId, titre: titre.trim(), description: description?.trim() || "",
      type: type || "Autre", dateDebut, dateFin: dateFin || dateDebut,
      employeId: employeId || undefined, userId, projectId: projectId || undefined, statut: statut || "Planifié",
    });

    await logActivity({
      workspaceId, userId, userName, userEmail,
      entityType: "event", entityId: event._id, entityName: titre,
      action: "created",
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
