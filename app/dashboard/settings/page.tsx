"use client";

import { useEffect, useRef, useState } from "react";
import {
  Save, Upload, Sun, Moon, Building2, Mail, Phone, MapPin,
  Bell, Clock, CalendarDays, MessageSquare, Lock, LogOut,
  Download, Upload as ImportIcon, Check, Palette, Eye,
} from "lucide-react";
import Image from "next/image";

interface Settings {
  _id?: string;
  nomAgence: string;
  emailAgence: string;
  telephoneAgence: string;
  adresse: string;
  logo: string;
  theme: "light" | "dark";
  couleur: string;
  notifEmail: boolean;
  notifRappels: boolean;
  notifEcheances: boolean;
  notifCommentaires: boolean;
}

const COULEURS = [
  { nom: "Violet", code: "#7C3AED" },
  { nom: "Bleu", code: "#3B82F6" },
  { nom: "Vert", code: "#10B981" },
  { nom: "Orange", code: "#F59E0B" },
  { nom: "Rouge", code: "#EF4444" },
  { nom: "Turquoise", code: "#06B6D4" },
  { nom: "Gris", code: "#64748B" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    nomAgence: "AgencyFlow",
    emailAgence: "contact@agencyflow.com",
    telephoneAgence: "+212 5 22 12 34 56",
    adresse: "123 Avenue Mohammed V, Casablanca, Maroc",
    logo: "",
    theme: "light",
    couleur: "#7C3AED",
    notifEmail: true,
    notifRappels: true,
    notifEcheances: false,
    notifCommentaires: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function applyTheme(theme: string, couleur: string) {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.style.setProperty("--primary", couleur);
  }

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setSettings({ ...settings, ...data });
          applyTheme(data.theme || "light", data.couleur || "#7C3AED");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    applyTheme(settings.theme, settings.couleur);
  }, [settings.theme, settings.couleur]);

  async function handleLogoUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "agencyflow/logos");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) setSettings((s) => ({ ...s, logo: data.url }));
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  function toggleSwitch(key: keyof Settings) {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const mainColor = settings.couleur || "#7C3AED";

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Paramètres</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Gérez les paramètres de votre agence</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Card 1: Agency Info */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
          <h2 className="text-base font-bold text-slate-900 mb-6 dark:text-white">Informations de l'agence</h2>
          {/* Logo */}
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
            {settings.logo ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-slate-100 shadow-sm dark:border-slate-700">
                <Image src={settings.logo} alt="Logo" fill className="object-contain" />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-600 dark:bg-slate-700/50">
                <Building2 size={28} />
              </div>
            )}
            <div>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                <Upload size={15} />
                {uploading ? "Upload..." : "Changer le logo"}
              </button>
              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">PNG, JPG ou SVG — recommandé 200×200px</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" />
            </div>
          </div>
          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 flex items-center gap-1.5 dark:text-slate-300">
                <Building2 size={13} className="text-slate-400 dark:text-slate-500" /> Nom de l'agence
              </label>
              <input value={settings.nomAgence} onChange={(e) => setSettings({ ...settings, nomAgence: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-20 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 flex items-center gap-1.5 dark:text-slate-300">
                <Mail size={13} className="text-slate-400 dark:text-slate-500" /> Email de contact
              </label>
              <input type="email" value={settings.emailAgence} onChange={(e) => setSettings({ ...settings, emailAgence: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-20 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 flex items-center gap-1.5 dark:text-slate-300">
                <Phone size={13} className="text-slate-400 dark:text-slate-500" /> Téléphone
              </label>
              <input value={settings.telephoneAgence} onChange={(e) => setSettings({ ...settings, telephoneAgence: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-20 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 flex items-center gap-1.5 dark:text-slate-300">
                <MapPin size={13} className="text-slate-400 dark:text-slate-500" /> Adresse
              </label>
              <input value={settings.adresse} onChange={(e) => setSettings({ ...settings, adresse: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-20 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white" />
            </div>
          </div>
        </div>

        {/* Card 2: Appearance */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2 dark:text-white">
            <Palette size={16} className="text-primary" /> Apparence
          </h2>
          {/* Theme */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 dark:text-slate-400">Thème</p>
            <div className="flex gap-4">
              {(["light", "dark"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setSettings({ ...settings, theme: t })}
                  className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-4 text-sm font-medium transition ${
                    settings.theme === t
                      ? "border-primary bg-primary-10 text-primary-dark shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                  }`}>
                  {t === "light" ? <Sun size={18} /> : <Moon size={18} />}
                  {t === "light" ? "Clair" : "Sombre"}
                  {settings.theme === t && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                      <Check size={11} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {/* Primary Color */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 dark:text-slate-400">Couleur principale</p>
            <div className="flex gap-3 flex-wrap">
              {COULEURS.map((c) => (
                <button key={c.code} type="button" onClick={() => setSettings({ ...settings, couleur: c.code })}
                  className="relative flex flex-col items-center gap-1.5">
                  <div className={`h-8 w-8 rounded-full transition-all ${settings.couleur === c.code ? "ring-2 ring-offset-2 ring-primary scale-110 dark:ring-offset-slate-800" : "hover:scale-105"}`}
                    style={{ backgroundColor: c.code }} />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{c.nom}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Preview */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 dark:text-slate-400">
              <Eye size={13} /> Aperçu
            </p>
            <div className="rounded-xl border border-slate-200 overflow-hidden dark:border-slate-600">
              <div className="h-3" style={{ backgroundColor: mainColor }} />
              <div className="p-4 space-y-2 bg-white dark:bg-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md" style={{ backgroundColor: mainColor }} />
                  <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-600" />
                </div>
                <div className="h-2 w-full rounded bg-slate-100 dark:bg-slate-600" />
                <div className="h-2 w-3/4 rounded bg-slate-100 dark:bg-slate-600" />
                <div className="flex gap-2 mt-2">
                  <div className="h-6 flex-1 rounded-md" style={{ backgroundColor: mainColor, opacity: 0.9 }} />
                  <div className="h-6 flex-1 rounded-md border border-slate-200 dark:border-slate-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Notifications */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2 dark:text-white">
            <Bell size={16} className="text-primary" /> Notifications
          </h2>
          <div className="space-y-1">
            {[
              { key: "notifEmail" as keyof Settings, icon: Mail, label: "Notifications par email", desc: "Recevez des notifications par email" },
              { key: "notifRappels" as keyof Settings, icon: Clock, label: "Rappels", desc: "Recevez des rappels pour les échéances à venir" },
              { key: "notifEcheances" as keyof Settings, icon: CalendarDays, label: "Échéances", desc: "Soyez notifié des échéances dépassées" },
              { key: "notifCommentaires" as keyof Settings, icon: MessageSquare, label: "Commentaires", desc: "Notifications lorsqu'un commentaire est ajouté" },
            ].map(({ key, icon: Icon, label, desc }) => (
              <div key={key} className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-slate-50 transition dark:hover:bg-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-10 text-primary">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p>
                  </div>
                </div>
                <button type="button" onClick={() => toggleSwitch(key)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${settings[key] ? "bg-primary" : "bg-slate-200 dark:bg-slate-600"}`}>
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-slate-200 ${settings[key] ? "translate-x-5" : ""}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Security */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2 dark:text-white">
            <Lock size={16} className="text-primary" /> Sécurité
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3.5 hover:border-slate-200 transition dark:border-slate-700 dark:hover:border-slate-600">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-10 text-primary">
                  <Lock size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Changer le mot de passe</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Mettez à jour votre mot de passe régulièrement.</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3.5 hover:border-slate-200 transition dark:border-slate-700 dark:hover:border-slate-600">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-900/30">
                  <LogOut size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Déconnexion de tous les appareils</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Déconnecter toutes les sessions actives.</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            </div>
          </div>
        </div>

        {/* Card 5: Backup & Export */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2 dark:text-white">
            <Download size={16} className="text-primary" /> Sauvegarde & Export
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-100 p-5 hover:border-slate-200 transition dark:border-slate-700 dark:hover:border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-10 text-primary">
                  <Download size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Exporter les données</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Télécharger une copie de vos données.</p>
                </div>
              </div>
              <button type="button" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                <Download size={13} className="inline mr-1.5" /> Exporter
              </button>
            </div>
            <div className="rounded-xl border border-slate-100 p-5 hover:border-slate-200 transition dark:border-slate-700 dark:hover:border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-10 text-primary">
                  <ImportIcon size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Importer les données</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Importer des données depuis un fichier.</p>
                </div>
              </div>
              <button type="button" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                <ImportIcon size={13} className="inline mr-1.5" /> Importer
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3 pt-4">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-8 py-3 text-sm font-medium text-white shadow-lg shadow-primary-25 hover:opacity-90 disabled:opacity-60 transition">
            <Save size={16} />
            {saving ? "Enregistrement..." : "Sauvegarder les modifications"}
          </button>
          {saved && (
            <div className="flex items-center justify-center gap-1.5 text-sm text-emerald-600 font-medium">
              <Check size={16} /> Dernière sauvegarde : aujourd'hui à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>

      </form>
    </div>
  );
}

function ChevronRight({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
