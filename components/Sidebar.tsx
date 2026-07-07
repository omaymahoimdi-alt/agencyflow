"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  UserCircle2,
  Settings,
  Building2,
  ChevronDown,
  LogOut,
  BarChart3,
  Clock,
  Bot,
  Trash2,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Gestion clients", icon: Building2 },
  { href: "/dashboard/projects", label: "Gestion projets", icon: FolderKanban },
  { href: "/dashboard/team", label: "Gestion équipe", icon: Users },
  { href: "/dashboard/productivite", label: "Productivité", icon: BarChart3 },
  { href: "/dashboard/corbeille", label: "Corbeille", icon: Trash2 },
  { href: "/dashboard/chatbot", label: "Assistant IA", icon: Bot },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;
  const displayName = user?.name || user?.email || "Utilisateur";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const userRole = (user as any)?.role || "Membre";

  return (
    <aside className="sidebar fixed left-0 top-0 z-20 hidden h-screen w-72 border-r border-slate-800 bg-slate-950 text-white lg:flex flex-col">
      {/* Logo */}
      <div className="border-b border-slate-800 px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">AgencyFlow</span>
            <p className="text-xs text-slate-400">Gestion d&apos;agence</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="relative border-t border-slate-800">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex w-full items-center gap-3 px-5 py-4 transition hover:bg-slate-800/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
            {initials}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{userRole}</p>
          </div>
          <ChevronDown size={15} className={`text-slate-500 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
        </button>
        {profileOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
            <div className="absolute bottom-full left-3 right-3 z-20 mb-2 rounded-xl border border-slate-700 bg-slate-900 py-2 shadow-xl">
              <Link href="/dashboard/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
                <UserCircle2 size={16} /> Mon profil
              </Link>
              <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">
                <Settings size={16} /> Paramètres
              </Link>
              <hr className="mx-3 my-1.5 border-slate-700" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800"
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
