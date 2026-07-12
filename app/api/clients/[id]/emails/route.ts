import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MockClientEmail } from "@/lib/mock-db";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER || "",
    pass: process.env.GMAIL_APP_PASSWORD || "",
  },
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const emails = await MockClientEmail.find({ clientId: id });
    return NextResponse.json(emails);
  } catch (error) {
    console.error("Error fetching client emails:", error);
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

    // Envoyer l'email via Gmail SMTP
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const mailOptions: any = {
          from: `"AgencyFlow" <${process.env.GMAIL_USER}>`,
          to: body.receiverEmail,
          subject: body.subject,
          text: body.message,
          html: body.message.replace(/\n/g, "<br>"),
        };
        if (body.attachmentUrl) {
          const attachmentPath = path.join(process.cwd(), "public", body.attachmentUrl);
          if (fs.existsSync(attachmentPath)) {
            mailOptions.attachments = [{
              filename: body.attachmentName || path.basename(body.attachmentUrl),
              path: attachmentPath,
            }];
          }
        }
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error("SMTP error (email will still be saved):", emailError);
      }
    }

    const email = await MockClientEmail.create({
      clientId: id,
      ...body,
      sentBy: session?.user?.id || "",
      sentByName: session?.user?.name || "",
      sentByEmail: session?.user?.email || "",
    });
    return NextResponse.json(email, { status: 201 });
  } catch (error) {
    console.error("Error creating client email:", error);
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
    const updated = await MockClientEmail.findByIdAndUpdate(body._id, { clientId: id, ...body });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating client email:", error);
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
    await MockClientEmail.findByIdAndDelete(body._id);
    return NextResponse.json({ message: "Supprimé" });
  } catch (error) {
    console.error("Error deleting client email:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}