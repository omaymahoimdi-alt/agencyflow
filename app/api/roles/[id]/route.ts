import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Role from "@/models/Role";
import { MockRole } from "@/lib/mock-db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();

    // Verify ownership
    let existing;
    try {
      await connectDB();
      existing = await Role.findById(id).lean();
    } catch {
      existing = await MockRole.findById(id);
    }
    if (!existing || existing.workspaceId.toString() !== session.user.workspaceId) {
      return NextResponse.json({ message: "Rôle non trouvé" }, { status: 404 });
    }

    let role;
    try {
      await connectDB();
      role = await Role.findByIdAndUpdate(
        id, { ...updates, updatedAt: new Date().toISOString() }, { new: true }
      ).lean();
    } catch {
      role = await MockRole.findByIdAndUpdate(id, updates);
    }
    return NextResponse.json({ ...role, id: role._id });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    let existing;
    try {
      await connectDB();
      existing = await Role.findById(id).lean();
    } catch {
      existing = await MockRole.findById(id);
    }
    if (!existing || existing.workspaceId.toString() !== session.user.workspaceId) {
      return NextResponse.json({ message: "Rôle non trouvé" }, { status: 404 });
    }

    try {
      await connectDB();
      await Role.findByIdAndDelete(id);
    } catch {
      await MockRole.findByIdAndDelete(id);
    }
    return NextResponse.json({ message: "Rôle supprimé" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
