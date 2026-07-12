"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  Check,
  Plus,
  X,
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
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("Chargement...");
  const [workspaces, setWorkspaces] = useState<Array<{ workspaceId: string; role: string; nom: string }>>([]);
  const [switching, setSwitching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [creating, setCreating] = useState(false);
  const { data: session, update } = useSession();
  const user = session?.user;
  const displayName = user?.name || user?.email || "Utilisateur";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const userRole = (user as any)?.role || "Membre";
  const workspaceId = (user as any)?.workspaceId;
  const workspaceIds: Array<{ workspaceId: string; role: string; nom: string }> = (user as any)?.workspaceIds || [];

  useEffect(() => {
    if (!workspaceId) return;
    const raw = workspaceIds;
    if (raw && raw.length > 0) {
      setWorkspaces(raw);
      const active = raw.find((w: any) => w.workspaceId === workspaceId);
      if (active) {
        setWorkspaceName(active.nom || "Mon agence");
      } else {
        setWorkspaceName("Mon agence");
      }
    } else {
      fetch(`/api/workspace`)
        .then((res) => res.json())
        .then((data) => {
          if (data.nom) setWorkspaceName(data.nom);
        })
        .catch(() => setWorkspaceName("Mon agence"));
      fetch(`/api/workspace/member`)
        .then((res) => res.json())
        .then((data) => {
          if (data.workspaces) setWorkspaces(data.workspaces);
        })
        .catch(() => {});
    }
  }, [workspaceId, workspaceIds]);

  const createWorkspace = async () => {
    if (!newWsName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newWsName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.workspaceId) {
        setShowCreate(false);
        setNewWsName("");
        // Switch to the new workspace
        await fetch("/api/workspace/active", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: data.workspaceId }),
        });
        await update();
        window.location.reload();
      }
    } catch (e) {
      console.error("Create workspace failed:", e);
    } finally {
      setCreating(false);
    }
  };

  const switchWorkspace = async (wsId: string) => {
    if (wsId === workspaceId) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/workspace/active", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: wsId }),
      });
      if (res.ok) {
        await update();
        window.location.reload();
      } else {
        const data = await res.json();
        console.error("Switch failed:", data.message);
      }
    } catch (e) {
      console.error("Switch failed:", e);
    } finally {
      setSwitching(false);
      setWorkspaceOpen(false);
    }
  };

  return (
    <aside className="sidebar fixed left-0 top-0 z-20 hidden h-screen w-72 border-r border-slate-800 bg-slate-950 text-white lg:flex flex-col">
      {/* Logo + Workspace Switcher */}
      <div className="relative border-b border-slate-800 px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-2 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">AgencyFlow</span>
          </div>
        </Link>
        <button
          onClick={() => setWorkspaceOpen(!workspaceOpen)}
          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all"
        >
          <Building2 size={12} />
          <span className="flex-1 text-left truncate">{workspaceName}</span>
          {switching ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-white" />
          ) : (
            <ChevronDown size={12} className={`transition-transform ${workspaceOpen ? "rotate-180" : ""}`} />
          )}
        </button>
        {workspaceOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setWorkspaceOpen(false)} />
            <div className="absolute left-3 right-3 z-20 mt-1 rounded-xl border border-slate-700 bg-slate-900 py-1 shadow-xl">
              {workspaces.map((ws) => (
                <button
                  key={ws.workspaceId}
                  onClick={() => switchWorkspace(ws.workspaceId)}
                  disabled={switching}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-slate-800 ${
                    ws.workspaceId === workspaceId ? "text-indigo-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Building2 size={12} />
                  <span className="flex-1 text-left truncate">{ws.nom}</span>
                  {ws.workspaceId === workspaceId && <Check size={12} />}
                </button>
              ))}
              <hr className="mx-3 my-1 border-slate-700" />
              <button
                onClick={() => { setWorkspaceOpen(false); setShowCreate(true); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-indigo-400 hover:bg-slate-800 transition"
              >
                <Plus size={12} />
                <span>Nouvel espace</span>
              </button>
            </div>
          </>
        )}
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
      {/* Create workspace modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setShowCreate(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-96 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Nouvel espace de travail</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white transition">
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="Nom de l'espace"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
              onKeyDown={(e) => { if (e.key === "Enter") createWorkspace(); }}
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-xl border border-slate-700 py-3 text-sm text-slate-400 hover:bg-slate-800 transition"
              >
                Annuler
              </button>
              <button
                onClick={createWorkspace}
                disabled={creating || !newWsName.trim()}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-50 transition"
              >
                {creating ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
