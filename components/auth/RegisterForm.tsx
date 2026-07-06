"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { validateRegister } from "@/lib/validation";
import Recaptcha from "@/components/Recaptcha";
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle2 } from "lucide-react";

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [invitation, setInvitation] = useState<{
    email: string; prenom: string; nom: string; role: string; equipe: string;
  } | null>(null);
  const [invitationLoading, setInvitationLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setInvitationLoading(false);
      return;
    }

    fetch(`/api/invitations/verify?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setInvitation(data);
          setEmail(data.email);
          setName(`${data.prenom} ${data.nom}`);
        } else {
          setError(data.message || "Lien d'invitation invalide ou expiré.");
        }
      })
      .catch(() => setError("Erreur de vérification de l'invitation."))
      .finally(() => setInvitationLoading(false));
  }, [token]);

  function validateForm(): boolean {
    const newErrors = validateRegister({ name, email, password });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    if (!recaptchaToken) {
      setRecaptchaError(true);
      setLoading(false);
      return;
    }

    try {
      const body: Record<string, string> = { name, email, password };
      if (token) {
        body.invitationToken = token;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "Inscription impossible.");
      }

      router.push("/login?registered=1");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  }

  if (invitationLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-[#6D28FF]" />
        <span className="ml-3 text-sm text-[#64748B]">Vérification de votre invitation...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {invitation && (
        <div className="rounded-[12px] bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Invitation confirmée</p>
            <p className="text-xs text-green-700 mt-0.5">
              Rôle : <strong>{invitation.role}</strong>
              {invitation.equipe ? ` · Équipe : ${invitation.equipe}` : ""}
            </p>
          </div>
        </div>
      )}

      {!invitation && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full h-[52px] rounded-[12px] border border-[#E5E7EB] bg-white text-[#111827] font-medium flex items-center justify-center gap-3 hover:bg-[#F8FAFC] transition-all duration-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>
        </div>
      )}

      {!invitation && (
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-[#E5E7EB]"></div>
          <span className="text-sm text-[#64748B]">OU</span>
          <div className="flex-1 h-px bg-[#E5E7EB]"></div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#111827]">Nom complet</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
              <User size={20} />
            </div>
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }}
              className={`w-full h-[52px] pl-12 pr-4 rounded-[12px] border text-[#111827] placeholder:text-[#94A3B8] outline-none transition-all duration-300 ${
                errors.name 
                  ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200" 
                  : "border-[#E5E7EB] bg-white focus:border-[#6D28FF] focus:ring-2 focus:ring-[#6D28FF]/20"
              }`}
              placeholder="Prénom Nom"
            />
          </div>
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#111827]">Adresse e-mail</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
              <Mail size={20} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              readOnly={!!invitation}
              className={`w-full h-[52px] pl-12 pr-4 rounded-[12px] border text-[#111827] placeholder:text-[#94A3B8] outline-none transition-all duration-300 ${
                errors.email 
                  ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200" 
                  : invitation
                    ? "border-[#BBF7D0] bg-[#F0FDF4] text-green-800 cursor-not-allowed"
                    : "border-[#E5E7EB] bg-white focus:border-[#6D28FF] focus:ring-2 focus:ring-[#6D28FF]/20"
              }`}
              placeholder="nom@entreprise.com"
            />
          </div>
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#111827]">Mot de passe</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
              <Lock size={20} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
              }}
              className={`w-full h-[52px] pl-12 pr-12 rounded-[12px] border text-[#111827] placeholder:text-[#94A3B8] outline-none transition-all duration-300 ${
                errors.password 
                  ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200" 
                  : "border-[#E5E7EB] bg-white focus:border-[#6D28FF] focus:ring-2 focus:ring-[#6D28FF]/20"
              }`}
              placeholder="Minimum 6 caractères"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#6D28FF] transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        </div>

        {error ? (
          <div className="rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Recaptcha onVerify={(token) => { setRecaptchaToken(token); setRecaptchaError(false); }} error={recaptchaError} />

        <button
          type="submit"
          disabled={loading}
          className={`w-full h-[54px] rounded-[12px] text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
            loading 
              ? "bg-[#6D28FF]/70 cursor-not-allowed" 
              : "bg-gradient-to-r from-[#6D28FF] to-purple-600 hover:shadow-lg hover:shadow-[#6D28FF]/20 hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Création en cours...
            </>
          ) : (
            "Créer mon compte"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-[#64748B] flex items-center justify-center gap-1.5">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 7V11.09C3 16.14 6.84 20.85 12 22C17.16 20.85 21 16.14 21 11.09V7L12 2Z" fill="#10B981"/>
          <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Vos informations sont protégées par un chiffrement sécurisé.
      </p>
    </div>
  );
}

export default function RegisterForm() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-[#6D28FF]" />
      </div>
    }>
      <RegisterFormContent />
    </Suspense>
  );
}
