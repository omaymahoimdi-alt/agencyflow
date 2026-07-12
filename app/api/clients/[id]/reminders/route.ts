import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockClientReminder } from "@/lib/mock-db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const reminders = await MockClientReminder.find({ clientId: id });
    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Error fetching client reminders:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const body = await request.json();
    const reminder = await MockClientReminder.create({
      clientId: id,
      ...body,
      createdBy: session?.user?.id || "",
      createdByName: session?.user?.name || "",
      createdByEmail: session?.user?.email || "",
    });
    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("Error creating client reminder:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body._id) {
      return NextResponse.json({ message: "ID requis" }, { status: 400 });
    }
    const updated = await MockClientReminder.findByIdAndUpdate(body._id, { clientId: id, ...body });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating client reminder:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body._id) {
      return NextResponse.json({ message: "ID requis" }, { status: 400 });
    }
    await MockClientReminder.findByIdAndDelete(body._id);
    return NextResponse.json({ message: "Supprimé" });
  } catch (error) {
    console.error("Error deleting client reminder:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
