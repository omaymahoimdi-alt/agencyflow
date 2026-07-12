import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Role from "@/models/Role";
import { MockRole } from "@/lib/mock-db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    let roles;
    try {
      await connectDB();
      roles = await Role.find({ workspaceId: session.user.workspaceId }).sort({ createdAt: -1 }).lean();
    } catch {
      roles = await MockRole.findByWorkspace(session.user.workspaceId);
    }
    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.workspaceId) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { nom, description, type, permissions } = await request.json();
    if (!nom?.trim()) {
      return NextResponse.json({ message: "Nom du rôle requis" }, { status: 400 });
    }

    let role;
    try {
      await connectDB();
      role = await Role.create({
        workspaceId: session.user.workspaceId,
        nom: nom.trim(),
        description: description || "",
        type: type || "Personnalisé",
        creePar: session.user.name || "",
        creeParEmail: session.user.email || "",
        permissions: permissions || {},
      });
      role = role.toObject();
    } catch {
      role = await MockRole.create({
        workspaceId: session.user.workspaceId,
        nom: nom.trim(),
        description: description || "",
        type: type || "Personnalisé",
        creePar: session.user.name || "",
        creeParEmail: session.user.email || "",
        permissions: permissions || {},
      });
    }
    return NextResponse.json({ ...role, id: role._id }, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
