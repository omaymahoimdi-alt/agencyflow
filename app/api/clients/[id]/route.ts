import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Corbeille from "@/models/Corbeille";
import { MockClient, MockCorbeille } from "@/lib/mock-db";
import { logActivity } from "@/lib/activity";

const validateClientServer = (data: any, existingClients: any[] = [], editingId?: string) => {
  const errors: any = {};
  const SECTEURS = ["E-commerce", "Santé", "Education", "Informatique", "Finance", "Immobilier"];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.nomSociete?.trim()) errors.nomSociete = "Nom société obligatoire";
  else if (data.nomSociete.trim().length < 3) errors.nomSociete = "Minimum 3 caractères";
  else if (data.nomSociete.length > 100) errors.nomSociete = "Maximum 100 caractères";
  else if (!/^[A-Za-z0-9À-ÿ\s]+$/.test(data.nomSociete)) errors.nomSociete = "Uniquement lettres, chiffres, espaces";

  if (!data.responsable?.trim()) errors.responsable = "Responsable obligatoire";
  else if (data.responsable.trim().length < 3) errors.responsable = "Minimum 3 caractères";
  else if (data.responsable.length > 50) errors.responsable = "Maximum 50 caractères";
  else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(data.responsable)) errors.responsable = "Uniquement lettres et espaces";

  if (!data.email?.trim()) errors.email = "Email obligatoire";
  else if (!emailRegex.test(data.email)) errors.email = "Email invalide";
  else {
    const existingEmail = existingClients.find((c: any) =>
      c.email.toLowerCase() === data.email.toLowerCase() && c._id !== editingId
    );
    if (existingEmail) errors.email = "Email déjà utilisé";
  }

  if (data.telephone?.trim() && !/^\d{8}$/.test(data.telephone.trim())) {
    errors.telephone = "8 chiffres exactement";
  }

  if (data.adresse && data.adresse.length > 200) {
    errors.adresse = "Maximum 200 caractères";
  }

  if (!data.secteurActivite?.trim()) {
    errors.secteurActivite = "Secteur obligatoire";
  } else if (!SECTEURS.includes(data.secteurActivite)) {
    errors.secteurActivite = "Secteur invalide";
  }

  return errors;
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const client = await MockClient.findById(id);
    if (!client) return NextResponse.json({ message: "Client non trouvé" }, { status: 404 });
    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();

    const existingClients = await MockClient.find(session.user.workspaceId);

    const validationErrors = validateClientServer(body, existingClients, id);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({
        message: "Erreur de validation",
        errors: validationErrors
      }, { status: 400 });
    }

    const old = await MockClient.findById(id);
    const oldName = old ? old.nomSociete : "";
    const client = await MockClient.findByIdAndUpdate(id, body);
    if (!client) return NextResponse.json({ message: "Client non trouvé" }, { status: 404 });
    await logActivity({
      workspaceId: session.user.workspaceId,
      userId: session.user.id,
      userName: session.user.name || "",
      userEmail: session.user.email || "",
      entityType: "client",
      entityId: id,
      entityName: oldName || body.nomSociete || client.nomSociete,
      action: "updated",
    });
    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

async function addToCorbeilleServer(session: any, body: { id: string; type: string; nom: string; sourceData?: any }) {
  const userName = session?.user?.name || "Utilisateur inconnu";
  const userEmail = session?.user?.email || "—";
  const userAvatar = userName.split(" ").map((w: string) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
  const item = {
    id: body.id,
    type: body.type,
    nom: body.nom,
    supprimePar: { nom: userName, email: userEmail, fonction: (session?.user as any)?.role || "Utilisateur", avatar: userAvatar },
    supprimeLe: new Date().toISOString(),
    supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    sourceData: body.sourceData || null,
  };
  if (process.env.MONGODB_URI) {
    try {
      await connectDB();
      await Corbeille.findOneAndUpdate(
        { corbeilleId: item.id },
        {
          corbeilleId: item.id, workspaceId: session.user.workspaceId, deletedBy: session.user.id,
          type: item.type, nom: item.nom, supprimePar: item.supprimePar,
          supprimeLe: new Date(item.supprimeLe), supprimeDefinitivementLe: new Date(item.supprimeDefinitivementLe),
          sourceData: item.sourceData,
        },
        { upsert: true }
      );
    } catch (dbError) {
      console.error("Corbeille MongoDB POST failed:", dbError);
    }
  }
  try {
    await MockCorbeille.create({ ...item, workspaceId: session.user.workspaceId, deletedBy: session.user.id });
  } catch (e) {
    console.error("Corbeille MockCorbeille POST failed:", e);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const client = await MockClient.findByIdAndDelete(id);
    if (!client) return NextResponse.json({ message: "Client non trouvé" }, { status: 404 });
    const deletedName = (client as any).nomSociete || "";

    await addToCorbeilleServer(session, {
      id: "corbeille-client-" + Date.now(),
      type: "Client",
      nom: deletedName,
      sourceData: client,
    });

    await logActivity({
      workspaceId: session.user.workspaceId,
      userId: session.user.id,
      userName: session.user.name || "",
      userEmail: session.user.email || "",
      entityType: "client",
      entityId: id,
      entityName: deletedName,
      action: "deleted",
    });
    return NextResponse.json({ message: "Client supprimé" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}