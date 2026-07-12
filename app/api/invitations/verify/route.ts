import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import User from "@/models/User";
import { MockInvitation, MockUser } from "@/lib/mock-db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, message: "Token manquant" }, { status: 400 });
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

    if (!invitation) {
      return NextResponse.json({ valid: false, message: "Invitation introuvable ou déjà utilisée" }, { status: 404 });
    }

    if (invitation.statut !== "En attente") {
      return NextResponse.json({ valid: false, message: "Cette invitation a déjà été utilisée ou annulée" }, { status: 410 });
    }

    if (new Date(invitation.expiration) < new Date()) {
      return NextResponse.json({ valid: false, message: "Cette invitation a expiré" }, { status: 410 });
    }

    // Look up inviter's name and email
    let inviterName = invitation.invitePar || "Un administrateur";
    let inviterEmail = "";
    try {
      const inviter = await User.findById(invitation.userId);
      if (inviter) {
        inviterName = inviter.name || `${inviter.prenom || ""} ${inviter.nom || ""}`.trim() || inviter.email;
        inviterEmail = inviter.email;
      } else {
        const mockInviter = await MockUser.findById(invitation.userId);
        if (mockInviter) {
          inviterName = mockInviter.name || `${mockInviter.prenom || ""} ${mockInviter.nom || ""}`.trim() || mockInviter.email;
          inviterEmail = mockInviter.email;
        }
      }
    } catch {
      try {
        const mockInviter = await MockUser.findById(invitation.userId);
        if (mockInviter) {
          inviterName = mockInviter.name || `${mockInviter.prenom || ""} ${mockInviter.nom || ""}`.trim() || mockInviter.email;
          inviterEmail = mockInviter.email;
        }
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      prenom: invitation.prenom,
      nom: invitation.nom,
      role: invitation.role,
      equipe: invitation.equipe,
      workspaceId: invitation.workspaceId,
      invitePar: inviterName,
      inviterEmail,
    });
  } catch (error) {
    console.error("Verify invitation error:", error);
    return NextResponse.json({ valid: false, message: "Erreur serveur" }, { status: 500 });
  }
}
