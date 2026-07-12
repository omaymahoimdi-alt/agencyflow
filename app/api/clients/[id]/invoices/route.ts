import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockClientInvoice } from "@/lib/mock-db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const invoices = await MockClientInvoice.find({ clientId: id });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching client invoices:", error);
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
    const invoice = await MockClientInvoice.create({ clientId: id, ...body });
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating client invoice:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
