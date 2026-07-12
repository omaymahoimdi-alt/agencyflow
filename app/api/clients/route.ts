import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockClient, MockProject } from "@/lib/mock-db";
import { logActivity } from "@/lib/activity";
import { notifyWorkspaceMembers } from "@/lib/notifications";

// Validation serveur
const validateClientServer = (data: any, existingClients: any[] = [], editingId?: string) => {
  const errors: any = {};
  const SECTEURS = ["E-commerce", "Santé", "Education", "Informatique", "Finance", "Immobilier"];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Nom société
  if (!data.nomSociete?.trim()) errors.nomSociete = "Nom société obligatoire";
  else if (data.nomSociete.trim().length < 3) errors.nomSociete = "Minimum 3 caractères";
  else if (data.nomSociete.length > 100) errors.nomSociete = "Maximum 100 caractères";
  else if (!/^[A-Za-z0-9À-ÿ\s]+$/.test(data.nomSociete)) errors.nomSociete = "Uniquement lettres, chiffres, espaces";

  // Responsable
  if (!data.responsable?.trim()) errors.responsable = "Responsable obligatoire";
  else if (data.responsable.trim().length < 3) errors.responsable = "Minimum 3 caractères";
  else if (data.responsable.length > 50) errors.responsable = "Maximum 50 caractères";
  else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(data.responsable)) errors.responsable = "Uniquement lettres et espaces";

  // Email
  if (!data.email?.trim()) errors.email = "Email obligatoire";
  else if (!emailRegex.test(data.email)) errors.email = "Email invalide";
  else {
    const existingEmail = existingClients.find((c: any) =>
      c.email.toLowerCase() === data.email.toLowerCase() && c._id !== editingId
    );
    if (existingEmail) errors.email = "Email déjà utilisé";
  }

  // Téléphone
  if (data.telephone?.trim() && !/^\d{8}$/.test(data.telephone.trim())) {
    errors.telephone = "8 chiffres exactement";
  }

  // Adresse
  if (data.adresse && data.adresse.length > 200) {
    errors.adresse = "Maximum 200 caractères";
  }

  // Secteur activité
  if (!data.secteurActivite?.trim()) {
    errors.secteurActivite = "Secteur obligatoire";
  } else if (!SECTEURS.includes(data.secteurActivite)) {
    errors.secteurActivite = "Secteur invalide";
  }

  return errors;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const clients = await MockClient.find(session.user.workspaceId);
    const projectStats = await MockProject.countByClient(session.user.workspaceId);
    const enriched = clients.map((c: any) => ({
      ...c,
      projectsCount: projectStats[c._id]?.count || 0,
      totalBudget: c.budget || 0,
    }));
    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const body = await request.json();
    const { nomSociete, responsable, email, telephone, adresse, secteurActivite, budget } = body;

    const existingClients = await MockClient.find(session.user.workspaceId);

    // Validation serveur
    const validationErrors = validateClientServer(body, existingClients);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({
        message: "Erreur de validation",
        errors: validationErrors
      }, { status: 400 });
    }

    const client = await MockClient.create({ nomSociete, responsable, email, telephone, adresse, secteurActivite, budget, workspaceId: session.user.workspaceId });
    await logActivity({
      workspaceId: session.user.workspaceId,
      userId: session.user.id,
      userName: session.user.name || "",
      userEmail: session.user.email || "",
      entityType: "client",
      entityId: client._id.toString(),
      entityName: client.nomSociete,
      action: "created",
    });
    await notifyWorkspaceMembers(
      session.user.workspaceId,
      session.user.id,
      "activity",
      `Nouveau client : ${client.nomSociete}`,
      `${session.user.name || "Quelqu'un"} a ajouté le client "${client.nomSociete}"`,
      `/dashboard/clients/${client._id}`,
      "client", client._id.toString(),
      session.user.name || "",
    );
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
