"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Mail, Shield, Calendar, User, Save, Camera, LogOut, ArrowLeft,
} from "lucide-react";
import { signOut } from "next-auth/react";

const ROLE_BADGES: Record<string, string> = {
  Admin: "bg-violet-100 text-violet-700",
  ChefProjet: "bg-blue-100 text-blue-700",
  Développeur: "bg-emerald-100 text-emerald-700",
  Designer: "bg-amber-100 text-amber-700",
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const roleBadge = ROLE_BADGES[(user as any)?.role] || "bg-slate-100 text-slate-600";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    // Try API first, fallback to direct mock DB update
    try {
      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      if (res.ok) {
        await update();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // Fallback: save to localStorage
      localStorage.setItem("af_profile_name", name);
      localStorage.setItem("af_profile_bio", bio);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-xl p-2 hover:bg-slate-100 transition">
          <ArrowLeft size={20} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
          <p className="text-sm text-slate-500">Gérez vos informations personnelles</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600" />
        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-14">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-violet-500 to-purple-600 text-3xl font-bold text-white shadow-xl">
              {initials}
            </div>
            <div className="flex-1 pt-2 sm:pt-0 sm:pb-2">
              <h2 className="text-xl font-bold text-slate-900">{user?.name || "Utilisateur"}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {(user as any)?.role && (user as any).role !== "freelance" && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold ${roleBadge}`}>
                    <Shield size={12} />
                    {(user as any).role}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Email Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Email connecté</h3>
        <div className="flex items-center gap-4 rounded-xl bg-violet-50 border border-violet-100 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Mail size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{user?.email}</p>
            <p className="text-xs text-slate-500">Connecté avec cet email</p>
          </div>
          <div className="flex h-7 shrink-0 items-center rounded-full bg-green-100 px-3 text-xs font-semibold text-green-700">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />
            Actif
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-5">Modifier le profil</h3>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Nom complet</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                placeholder="Votre nom"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
              placeholder="Parlez-nous de vous..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:opacity-90 transition disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Profil mis à jour
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Informations du compte</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-sm text-slate-600">Membre depuis</span>
            </div>
            <span className="text-sm font-medium text-slate-900">Juin 2024</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-slate-400" />
              <span className="text-sm text-slate-600">Rôle</span>
            </div>
            <span className="text-sm font-medium text-slate-900">{(user as any)?.role && (user as any).role !== "freelance" ? (user as any).role : "Membre"}</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="flex justify-center">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 rounded-xl border border-red-200 px-6 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
