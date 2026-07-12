import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockClientComment } from "@/lib/mock-db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const comments = await MockClientComment.find({ clientId: id });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching client comments:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const comment = await MockClientComment.create({
      clientId: id,
      userId: session.user.id,
      userName: session.user.name || "",
      userEmail: session.user.email || "",
      comment: body.comment,
      workspaceId: session.user.workspaceId || "",
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating client comment:", error);
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
    if (!body._id) {
      return NextResponse.json({ message: "ID requis" }, { status: 400 });
    }
    const updated = await MockClientComment.findByIdAndUpdate(body._id, {
      clientId: id,
      comment: body.comment,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating client comment:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    if (!body._id) {
      return NextResponse.json({ message: "ID requis" }, { status: 400 });
    }
    await MockClientComment.findByIdAndDelete(body._id);
    return NextResponse.json({ message: "Supprimé" });
  } catch (error) {
    console.error("Error deleting client comment:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}