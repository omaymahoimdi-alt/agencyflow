import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import { MockInvitation } from "@/lib/mock-db";

// Vérifie la connectivité SMTP Gmail
async function verifySmtpConnection(transporter: nodemailer.Transporter) {
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown SMTP error" };
  }
}

function buildInvitationEmail(prenom: string, nom: string, inviter: string, role: string, equipe: string, lien: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
        <tr>
          <td style="background:linear-gradient(135deg,#7C3AED,#9333EA);padding:40px 32px;text-align:center">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">AgencyFlow</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Plateforme de gestion d'agence</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px">Bonjour ${prenom} ${nom},</h2>
            <p style="margin:0 0 12px;color:#475569;font-size:15px;line-height:1.6">
              <strong>${inviter}</strong> vous invite à rejoindre l'agence sur <strong>AgencyFlow</strong>.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:16px;margin:16px 0">
              <tr><td style="padding:4px 0"><span style="color:#64748b;font-size:13px">Rôle proposé :</span> <span style="color:#1e293b;font-size:14px;font-weight:600">${role}</span></td></tr>
              <tr><td style="padding:4px 0"><span style="color:#64748b;font-size:13px">Équipe :</span> <span style="color:#1e293b;font-size:14px;font-weight:600">${equipe}</span></td></tr>
            </table>
            <p style="margin:16px 0 24px;color:#475569;font-size:15px;line-height:1.6">
              Cliquez sur le bouton ci-dessous pour accepter l'invitation et créer votre compte :
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#7C3AED,#9333EA);border-radius:12px;padding:0">
                  <a href="${lien}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px">Accepter l'invitation</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#94a3b8;font-size:13px">Cette invitation expire dans 7 jours.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
            <p style="margin:0;color:#94a3b8;font-size:12px">Si vous n'avez pas demandé cette invitation, ignorez cet email.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#94a3b8;font-size:12px">&copy; 2026 AgencyFlow. Tous droits réservés.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      return NextResponse.json({
        message: "Erreur de configuration : GMAIL_USER ou GMAIL_APP_PASSWORD manquant. Configurez-les dans .env.local",
        error: "Missing Gmail credentials",
      }, { status: 500 });
    }

    const { prenom, nom, email, role, equipe } = await request.json();

    if (!email || !prenom || !nom) {
      return NextResponse.json({ message: "Champs obligatoires manquants" }, { status: 400 });
    }

    const inviter = session.user.name ?? "Un administrateur";
    const token = crypto.randomBytes(32).toString("hex");
    const expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    try {
      await connectDB();
      await Invitation.create({
        email: email.toLowerCase(),
        token,
        nom,
        prenom,
        role: role || "Développeur",
        equipe: equipe || "",
        invitePar: inviter,
        expiration,
        userId: session.user.id,
      });
    } catch {
      await MockInvitation.create({
        email: email.toLowerCase(),
        token,
        nom,
        prenom,
        role: role || "Développeur",
        equipe: equipe || "",
        invitePar: inviter,
        expiration,
        userId: session.user.id,
      });
    }

    const lien = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/register?token=${token}`;

    const html = buildInvitationEmail(prenom, nom, inviter, role, equipe, lien);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: gmailUser, pass: gmailPass },
    });

    // Vérifie la connexion SMTP avant d'envoyer
    const smtpCheck = await verifySmtpConnection(transporter);
    if (!smtpCheck.ok) {
      console.error("SMTP connection failed:", smtpCheck.error);
      return NextResponse.json({
        message: `Erreur SMTP : ${smtpCheck.error}`,
        error: smtpCheck.error,
      }, { status: 500 });
    }

    await transporter.sendMail({
      from: `"AgencyFlow" <${gmailUser}>`,
      to: email,
      subject: `${inviter} vous invite à rejoindre AgencyFlow`,
      html,
    });

    console.log(`Invitation email sent successfully to ${email}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send invitation error:", error);
    const msg = error instanceof Error ? error.message : "Erreur serveur inconnue";
    return NextResponse.json({ message: `Erreur d'envoi : ${msg}`, error: msg }, { status: 500 });
  }
}
