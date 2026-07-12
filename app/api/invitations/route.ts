import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import { MockInvitation } from "@/lib/mock-db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    let invitations;
    try {
      await connectDB();
      invitations = await Invitation.find({ workspaceId: session.user.workspaceId })
        .sort({ createdAt: -1 }).lean();
    } catch {
      invitations = await MockInvitation.find(session.user.workspaceId);
    }
    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
