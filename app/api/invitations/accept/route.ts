import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import WorkspaceMember from "@/models/WorkspaceMember";
import { MockInvitation, MockWorkspace, MockWorkspaceMember, MockTeam, MockUser } from "@/lib/mock-db";

async function addUserToTeam(userId: string, email: string, name: string, role: string, workspaceId?: string) {
  try {
    await connectDB();
    const existing = await (await import("@/models/User")).default.findOne({ _id: userId });
    if (existing) return;
    const nameParts = (name || "Utilisateur").split(" ");
    await (await import("@/models/User")).default.create({
      nom: nameParts.slice(1).join(" ") || "Inconnu",
      prenom: nameParts[0] || "Utilisateur",
      email: email.toLowerCase(),
      password: "",
      role,
    });
  } catch {
    const teamMembers = await MockTeam.find({ workspaceId });
    const alreadyInTeam = teamMembers.find(m => m.email.toLowerCase() === email.toLowerCase());
    if (alreadyInTeam) return;
    const nameParts = (name || "Utilisateur").split(" ");
    await MockTeam.create({
      nom: nameParts.slice(1).join(" ") || "Inconnu",
      prenom: nameParts[0] || "Utilisateur",
      email: email.toLowerCase(),
      password: "",
      role,
      userId,
      workspaceId,
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ message: "Connectez-vous d'abord" }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ message: "Token manquant" }, { status: 400 });
    }

    let invitation;
    try {
      await connectDB();
      invitation = await Invitation.findOne({ token });
      if (!invitation) {
        invitation = await MockInvitation.findOne({ token });
      }
    } catch {
      invitation = await MockInvitation.findOne({ token });
    }

    if (!invitation || invitation.statut !== "En attente") {
      return NextResponse.json({ message: "Invitation invalide ou déjà utilisée." }, { status: 400 });
    }

    if (new Date(invitation.expiration) < new Date()) {
      return NextResponse.json({ message: "Cette invitation a expiré." }, { status: 410 });
    }

    // Convert workspaceId to string for mock DB (may be ObjectId from MongoDB)
    const rawWsId = invitation.workspaceId;
    const wsId = typeof rawWsId === "object" ? rawWsId.toString() : rawWsId;

    try {
      await connectDB();
      await WorkspaceMember.create({
        workspaceId: rawWsId,
        userId: session.user.id,
        role: invitation.role || "Développeur",
        equipe: invitation.equipe || "",
        status: "Actif",
      });
      await Invitation.findOneAndUpdate({ token }, { statut: "Acceptée" });
    } catch (e) {
      console.error("MongoDB write failed, falling back to mock DB:", e);
    }
    let mockUserId = session.user.id;
    try {
      if (session.user.email) {
        const mockUser = await MockUser.findOne({ email: session.user.email.toLowerCase() });
        if (mockUser) mockUserId = mockUser._id;
      }
    } catch { /* ignore */ }
    await MockWorkspaceMember.create({
      workspaceId: wsId,
      userId: mockUserId,
      role: invitation.role || "Développeur",
      equipe: invitation.equipe || "",
      status: "Actif",
    });
    await MockInvitation.findOneAndUpdate({ token }, { statut: "Acceptée" });

    // Ensure a mock workspace entry exists (workspace may only exist in MongoDB)
    try {
      const existingWs = await MockWorkspace.findOne({ _id: wsId });
      if (!existingWs) {
        let wsName = "Espace de travail";
        try {
          await connectDB();
          const Workspace = (await import("@/models/Workspace")).default;
          const dbWs = await Workspace.findById(rawWsId);
          if (dbWs) wsName = dbWs.nom || "Espace de travail";
        } catch {
          wsName = invitation.invitePar ? `Agence de ${invitation.invitePar}` : "Espace de travail";
        }
        await MockWorkspace.create({
          _id: wsId,
          nom: wsName,
          ownerId: mockUserId,
          description: "",
        });
      }
    } catch { /* ignore */ }

    await addUserToTeam(mockUserId, session.user.email, session.user.name || "", invitation.role || "Développeur", wsId);

    return NextResponse.json({ success: true, message: "Invitation acceptée !" });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}