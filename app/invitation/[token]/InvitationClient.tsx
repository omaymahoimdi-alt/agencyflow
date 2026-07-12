"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { CheckCircle2, XCircle, Loader2, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface InvitationData {
  valid: boolean;
  email: string;
  prenom: string;
  nom: string;
  role: string;
  equipe: string;
  workspaceId: string;
  invitePar?: string;
  inviterEmail?: string;
  message?: string;
}

export default function InvitationClient({ invitation, isLoggedIn, sessionEmail, token }: { invitation: InvitationData; isLoggedIn: boolean; sessionEmail?: string; token: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const emailMismatch = isLoggedIn && sessionEmail && sessionEmail.toLowerCase() !== invitation.email.toLowerCase();

  const handleAccept = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: new URL(window.location.href).pathname.split("/").pop() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDone(true);
      await update();
      setTimeout(() => router.push("/dashboard"), 600);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!invitation.valid) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-md w-full rounded-[20px] border border-red-200 bg-red-50 p-8 text-center">
          <XCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold text-red-800 mb-2">Invitation invalide</h1>
          <p className="text-red-700">{invitation.message || "Cette invitation n'est pas valide."}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-[#6D28FF] hover:underline">Retour à l'accueil</Link>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-md w-full rounded-[20px] border border-green-200 bg-green-50 p-8 text-center">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
          <h1 className="text-xl font-bold text-green-800 mb-2">Invitation acceptée !</h1>
          <p className="text-green-700">Vous faites maintenant partie de l'équipe.</p>
          <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-[12px] bg-gradient-to-r from-[#6D28FF] to-purple-600 text-white font-semibold">
            Accéder au Dashboard <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-6">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-[#6D28FF]/10 via-purple-500/10 to-pink-400/10 rounded-full blur-3xl" />
        <div className="max-w-md w-full relative z-10">
          <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-8 shadow-sm text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D28FF] to-purple-600 shadow-lg shadow-[#6D28FF]/20">
                <Building2 size={28} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#111827] mb-2">Vous êtes invité(e) !</h1>
            <p className="text-[#64748B] mb-4">
              <strong>{invitation.invitePar || `${invitation.prenom} ${invitation.nom}`}</strong> vous invite à rejoindre l'agence.
            </p>
            {invitation.inviterEmail && (
              <p className="text-xs text-[#94A3B8] mb-4">Email de l'invitant : {invitation.inviterEmail}</p>
            )}
            <div className="bg-[#F8FAFC] rounded-[12px] p-4 mb-6 text-left">
              <p className="text-sm text-[#64748B]">Rôle proposé : <span className="font-semibold text-[#111827]">{invitation.role}</span></p>
              {invitation.equipe && (
                <p className="text-sm text-[#64748B] mt-1">Équipe : <span className="font-semibold text-[#111827]">{invitation.equipe}</span></p>
              )}
            </div>
            <p className="text-sm text-[#64748B] mb-6">Connectez-vous ou créez un compte pour accepter l'invitation.</p>
            <div className="space-y-3">
              <button
                onClick={() => signIn("google", { callbackUrl: `/invitation/${new URL(window.location.href).pathname.split("/").pop()}` })}
                className="w-full h-[52px] rounded-[12px] border border-[#E5E7EB] bg-white text-[#111827] font-medium flex items-center justify-center gap-3 hover:bg-[#F8FAFC] transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continuer avec Google
              </button>
              <Link
                href={`/login?callbackUrl=/invitation/${new URL(window.location.href).pathname.split("/").pop()}`}
                className="block w-full h-[52px] rounded-[12px] bg-gradient-to-r from-[#6D28FF] to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                Se connecter par email
              </Link>
              <p className="text-sm text-[#64748B]">
                Pas encore de compte ?{" "}
                <Link href={`/register?token=${new URL(window.location.href).pathname.split("/").pop()}`} className="text-[#6D28FF] font-medium hover:underline">
                  Créer un compte
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (emailMismatch) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-6">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-[#6D28FF]/10 via-purple-500/10 to-pink-400/10 rounded-full blur-3xl" />
        <div className="max-w-md w-full relative z-10">
          <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-8 shadow-sm text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-amber-100">
                <Building2 size={28} className="text-amber-600" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-[#111827] mb-2">Invitation pour un autre compte</h1>
            <p className="text-[#64748B] mb-4">
              Cette invitation est destinée à <strong>{invitation.email}</strong>. Vous êtes connecté(e) avec <strong>{sessionEmail}</strong>.
            </p>
            <div className="bg-[#FEF3C7] rounded-[12px] p-4 mb-6 text-left">
              <p className="text-sm text-amber-800">
                Veuillez vous <strong>déconnecter</strong> puis cliquer sur le lien d'invitation, ou créer un compte avec l'adresse {invitation.email}.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="flex-1 h-[52px] rounded-[12px] border border-[#E5E7EB] text-[#64748B] font-medium flex items-center justify-center hover:bg-[#F8FAFC] transition-all"
              >
                Aller au Dashboard
              </Link>
              <Link
                href={`/register?token=${token}`}
                className="flex-1 h-[52px] rounded-[12px] bg-gradient-to-r from-[#6D28FF] to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                Créer un compte
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-6">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-[#6D28FF]/10 via-purple-500/10 to-pink-400/10 rounded-full blur-3xl" />
      <div className="max-w-md w-full relative z-10">
        <section className="rounded-[20px] border border-[#E5E7EB] bg-white p-8 shadow-sm text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D28FF] to-purple-600 shadow-lg shadow-[#6D28FF]/20">
              <Building2 size={28} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#111827] mb-2">Invitation à rejoindre l'agence</h1>
          <div className="bg-[#F0FDF4] rounded-[12px] border border-[#BBF7D0] p-4 mb-6 text-left">
            <p className="text-sm text-green-800">
              Invité par <strong>{invitation.invitePar || `${invitation.prenom} ${invitation.nom}`}</strong>
            </p>
            {invitation.inviterEmail && <p className="text-sm text-green-700 mt-1">Email : {invitation.inviterEmail}</p>}
            <hr className="my-2 border-green-200" />
            <p className="text-sm text-green-700 mt-1">Rôle proposé : <strong>{invitation.role}</strong></p>
            {invitation.equipe && <p className="text-sm text-green-700 mt-1">Équipe : <strong>{invitation.equipe}</strong></p>}
            <p className="text-sm text-green-700 mt-1">Invité : {invitation.email}</p>
          </div>
          {error && (
            <div className="rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
          )}
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 h-[52px] rounded-[12px] border border-[#E5E7EB] text-[#64748B] font-medium flex items-center justify-center hover:bg-[#F8FAFC] transition-all"
            >
              Refuser
            </Link>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 h-[52px] rounded-[12px] bg-gradient-to-r from-[#6D28FF] to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Traitement...</> : "Accepter"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
