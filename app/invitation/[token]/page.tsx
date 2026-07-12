import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import { MockInvitation, MockUser } from "@/lib/mock-db";
import InvitationClient from "./InvitationClient";

async function resolveInviter(invitation: any) {
  if (!invitation) return {};
  const userId = invitation.userId?.toString();
  if (!userId) return { invitePar: invitation.invitePar };
  try {
    await connectDB();
    const User = (await import("@/models/User")).default;
    const inviter = await User.findById(userId);
    if (inviter) {
      return {
        invitePar: `${inviter.prenom || ""} ${inviter.nom || ""}`.trim() || inviter.name || invitation.invitePar,
        inviterEmail: inviter.email,
      };
    }
  } catch {}
  const mockUser = await MockUser.findById(userId);
  if (mockUser) {
    return {
      invitePar: `${mockUser.prenom || ""} ${mockUser.nom || ""}`.trim() || mockUser.name || invitation.invitePar,
      inviterEmail: mockUser.email,
    };
  }
  return { invitePar: invitation.invitePar };
}

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getServerSession(authOptions);

  let invitationData: {
    valid: boolean; email: string; prenom: string; nom: string;
    role: string; equipe: string; workspaceId: string; invitePar?: string; inviterEmail?: string; message?: string;
  } = { valid: false, email: "", prenom: "", nom: "", role: "", equipe: "", workspaceId: "" };

  try {
    await connectDB();
    const invitation = await Invitation.findOne({ token });
    if (invitation && invitation.statut === "En attente" && new Date(invitation.expiration) >= new Date()) {
      const inviter = await resolveInviter(invitation);
      invitationData = {
        valid: true,
        email: invitation.email,
        prenom: invitation.prenom,
        nom: invitation.nom,
        role: invitation.role || "Développeur",
        equipe: invitation.equipe || "",
        workspaceId: invitation.workspaceId?.toString() || "",
        ...inviter,
      };
    } else if (!invitation) {
      const mockInv = await MockInvitation.findOne({ token });
      if (mockInv && mockInv.statut === "En attente" && new Date(mockInv.expiration) >= new Date()) {
        const inviter = await resolveInviter(mockInv);
        invitationData = {
          valid: true,
          email: mockInv.email,
          prenom: mockInv.prenom,
          nom: mockInv.nom,
          role: mockInv.role || "Développeur",
          equipe: mockInv.equipe || "",
          workspaceId: mockInv.workspaceId || "",
          ...inviter,
        };
      } else {
        invitationData.message = "Invitation introuvable";
      }
    } else if (invitation.statut !== "En attente") {
      invitationData.message = "Cette invitation a déjà été utilisée";
    } else {
      invitationData.message = "Cette invitation a expiré";
    }
  } catch {
    const mockInv = await MockInvitation.findOne({ token });
    if (mockInv && mockInv.statut === "En attente" && new Date(mockInv.expiration) >= new Date()) {
      const inviter = await resolveInviter(mockInv);
      invitationData = {
        valid: true,
        email: mockInv.email,
        prenom: mockInv.prenom,
        nom: mockInv.nom,
        role: mockInv.role || "Développeur",
        equipe: mockInv.equipe || "",
        workspaceId: mockInv.workspaceId || "",
        ...inviter,
      };
    } else {
      invitationData.message = "Invitation invalide ou expirée";
    }
  }

  return <InvitationClient invitation={invitationData} isLoggedIn={!!session?.user?.id} sessionEmail={session?.user?.email || undefined} token={token} />;
}
