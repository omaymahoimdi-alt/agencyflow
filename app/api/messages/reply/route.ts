import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject, message } = body;

    if (!to || !subject || !message) {
      return NextResponse.json({ message: "Les champs obligatoires sont manquants" }, { status: 400 });
    }

    // In a real app, you would send an email here using a service like:
    // - Nodemailer
    // - SendGrid
    // - Resend
    // - etc.

    console.log(`Sending email to ${to}: ${subject}`);
    console.log(`Message: ${message}`);

    return NextResponse.json({ message: "Réponse envoyée avec succès" }, { status: 200 });
  } catch (error) {
    console.error("Error sending reply:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
