import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import { MockInvitation } from "@/lib/mock-db";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;

    try {
      await connectDB();
      const deleted = await Invitation.findByIdAndDelete(id);
      if (deleted) {
        await MockInvitation.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
      }
    } catch {}

    const deleted = await MockInvitation.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Invitation introuvable" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();

    try {
      await connectDB();
      const updated = await Invitation.findByIdAndUpdate(id, body, { new: true });
      if (updated) {
        await MockInvitation.findByIdAndUpdate(id, body);
        return NextResponse.json(updated);
      }
    } catch {}

    const updated = await MockInvitation.findByIdAndUpdate(id, body);
    if (!updated) {
      return NextResponse.json({ message: "Invitation introuvable" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating invitation:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
