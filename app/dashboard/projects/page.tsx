"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Pencil, Trash2, X, FolderKanban, Search,
  ArrowUpDown, AlertCircle, Star, StarOff, LayoutList, Columns3,
  CalendarDays, ChevronLeft, ChevronRight,
  Eye, Archive, Clock, TrendingUp,
  Briefcase, CheckCircle2, PauseCircle, AlertTriangle,
  BarChart3, DollarSign, User, Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { addToCorbeille } from "@/lib/corbeille";

interface Client { _id: string; nomSociete: string }
interface User { _id: string; nom: string; prenom: string }
interface Project {
  _id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  budget: number;
  statut: string;
  priorite: string;
  clientId?: Client;
  chefProjetId?: User;
  chefProjet?: string;
}

const STATUTS = ["En attente", "En cours", "En test", "Terminé", "Suspendu"] as const;
const PRIORITES = ["Faible", "Moyenne", "Haute", "Urgente"] as const;

type ViewMode = "list" | "board" | "calendar";

const STATUT_STYLES: Record<string, string> = {
  "En attente": "bg-amber-50 text-amber-700 border-amber-200",
  "En cours": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "En test": "bg-violet-50 text-violet-700 border-violet-200",
  "Terminé": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Suspendu": "bg-red-50 text-red-700 border-red-200",
};

const STATUT_BG: Record<string, string> = {
  "En attente": "bg-amber-500",
  "En cours": "bg-indigo-500",
  "En test": "bg-violet-500",
  "Terminé": "bg-emerald-500",
  "Suspendu": "bg-red-500",
};

const PRIORITE_STYLES: Record<string, string> = {
  Faible: "bg-slate-50 text-slate-600 border-slate-200",
  Moyenne: "bg-blue-50 text-blue-700 border-blue-200",
  Haute: "bg-orange-50 text-orange-700 border-orange-200",
  Urgente: "bg-red-50 text-red-700 border-red-200",
};

const emptyForm = {
  titre: "", description: "", dateDebut: "", dateFin: "",
  budget: "", statut: "En attente", priorite: "Moyenne",
  clientId: "", chefProjet: "",
};

const validateProject = (data: typeof emptyForm) => {
  const errors: Record<string, string> = {};
  if (!data.titre.trim()) errors.titre = "Titre obligatoire";
  else if (data.titre.trim().length < 5) errors.titre = "Minimum 5 caractères";
  else if (data.titre.length > 100) errors.titre = "Maximum 100 caractères";
  if (!data.description.trim()) errors.description = "Description obligatoire";
  else if (data.description.trim().length < 20) errors.description = "Minimum 20 caractères";
  else if (data.description.length > 1000) errors.description = "Maximum 1000 caractères";
  if (!data.budget) errors.budget = "Budget obligatoire";
  else if (Number(data.budget) <= 0) errors.budget = "Budget doit être supérieur à 0";
  if (!data.dateDebut) errors.dateDebut = "Date début obligatoire";
  if (!data.dateFin) errors.dateFin = "Date fin obligatoire";
  else if (data.dateDebut && new Date(data.dateFin) <= new Date(data.dateDebut)) {
    errors.dateFin = "Date fin doit être supérieure à date début";
  }
  if (!data.clientId) errors.clientId = "Client obligatoire";
  return errors;
};

const PIE_COLORS = ["#f59e0b", "#6366f1", "#8b5cf6", "#10b981", "#ef4444"];

export default function ProjectsPage() {
  const router = useRouter();
  // Récupération de la session NextAuth pour identifier l'utilisateur connecté
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterPriorite, setFilterPriorite] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [sortBy, setSortBy] = useState("dateFin");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/team").then((r) => r.json()),
    ]).then(([p, c, t]) => {
      const projectsData = Array.isArray(p) ? p : [];
      setProjects(projectsData);
      setFiltered(projectsData);
      setClients(Array.isArray(c) ? c : []);
      setTeam(Array.isArray(t) ? t : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...projects];
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.titre.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.clientId && p.clientId.nomSociete.toLowerCase().includes(q))
      );
    }
    if (filterStatut) result = result.filter(p => p.statut === filterStatut);
    if (filterPriorite) result = result.filter(p => p.priorite === filterPriorite);
    if (filterClient) result = result.filter(p => p.clientId?._id === filterClient);
    result.sort((a, b) => {
      if (sortBy === "dateFin") {
        const da = a.dateFin ? new Date(a.dateFin).getTime() : Infinity;
        const db = b.dateFin ? new Date(b.dateFin).getTime() : Infinity;
        return da - db;
      }
      if (sortBy === "titre") return a.titre.localeCompare(b.titre);
      if (sortBy === "budget") return Number(b.budget) - Number(a.budget);
      return 0;
    });
    setFiltered(result);
    setPage(1);
  }, [search, projects, filterStatut, filterPriorite, filterClient, sortBy]);

  function refreshProjects() {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        const projectsData = Array.isArray(data) ? data : [];
        setProjects(projectsData);
        setFiltered(projectsData);
      });
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setError("");
    setShowModal(true);
  }

  function openEdit(p: Project) {
    setEditing(p);
    setForm({
      titre: p.titre,
      description: p.description || "",
      dateDebut: p.dateDebut ? p.dateDebut.split("T")[0] : "",
      dateFin: p.dateFin ? p.dateFin.split("T")[0] : "",
      budget: String(p.budget || 0),
      statut: p.statut,
      priorite: p.priorite,
      clientId: p.clientId?._id || "",
      chefProjet: p.chefProjet || "",
    });
    setErrors({});
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setErrors({});
    const validationErrors = validateProject(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSaving(false);
      return;
    }
    const payload = { ...form, budget: Number(form.budget), chefProjet: form.chefProjet };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/projects/${editing._id}` : "/api/projects";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowModal(false);
      refreshProjects();
    } else {
      const d = await res.json();
      setError(d.message || "Erreur serveur");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce projet ?")) return;
    const project = projects.find(p => p._id === id);
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    refreshProjects();
    if (project) {
      // Identification automatique du responsable via la session de l'utilisateur connecté.
      // Exemple : si Amira est connectée, supprimePar affichera son nom ("Amira Benali") et son email.
      const userName = session?.user?.name || "Utilisateur inconnu";
      const userEmail = session?.user?.email || "—";
      const userAvatar = userName.split(" ").map((w: string) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
      await addToCorbeille({
        id: "corbeille-projet-" + Date.now(),
        type: "Projet",
        nom: project.titre,
        supprimePar: { nom: userName, email: userEmail, fonction: session?.user?.role || "Utilisateur", avatar: userAvatar },
        supprimeLe: new Date().toISOString(),
        supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        sourceData: project,
      });
    }
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const kpiData = useMemo(() => {
    const total = projects.length;
    const encours = projects.filter(p => p.statut === "En cours").length;
    const termines = projects.filter(p => p.statut === "Terminé").length;
    const pauses = projects.filter(p => p.statut === "Suspendu").length;
    const enRetard = projects.filter(p => {
      if (!p.dateFin || p.statut === "Terminé") return false;
      return new Date(p.dateFin) < new Date();
    }).length;
    const budgetTotal = projects.reduce((s, p) => s + (p.budget || 0), 0);
    return { total, encours, termines, pauses, enRetard, budgetTotal };
  }, [projects]);

  const statutChart = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => { counts[p.statut] = (counts[p.statut] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const upcomingDeadlines = useMemo(() => {
    return [...projects]
      .filter(p => p.dateFin && p.statut !== "Terminé")
      .sort((a, b) => new Date(a.dateFin).getTime() - new Date(b.dateFin).getTime())
      .slice(0, 5);
  }, [projects]);

  const overallProgress = useMemo(() => {
    const total = projects.length;
    if (!total) return { percent: 0, done: 0, inProgress: 0, pending: 0 };
    const done = projects.filter(p => p.statut === "Terminé").length;
    const inProgress = projects.filter(p => p.statut === "En cours" || p.statut === "En test").length;
    const pending = projects.filter(p => p.statut === "En attente" || p.statut === "Suspendu").length;
    return {
      percent: Math.round((done / total) * 100),
      done,
      inProgress,
      pending,
    };
  }, [projects]);

  function daysUntil(dateStr: string): number {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  function formatBudget(n: number) {
    return n.toLocaleString("fr-FR") + " €";
  }

  function getClientOptionLabel(c: Client) {
    return c.nomSociete || "Sans nom";
  }

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projets</h1>
          <p className="mt-1 text-sm text-slate-500">Suivez l&apos;avancement de tous vos projets</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={18} /> Ajouter un projet
        </button>
      </div>

      {/* VIEW SWITCHER */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {([
          { key: "list" as const, icon: LayoutList, label: "Liste" },
          { key: "board" as const, icon: Columns3, label: "Kanban" },
          { key: "calendar" as const, icon: CalendarDays, label: "Calendrier" },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              viewMode === key
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total projets", value: kpiData.total, icon: FolderKanban, color: "text-violet-600", bg: "bg-violet-50", trend: "+12%" },
          { label: "En cours", value: kpiData.encours, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50", trend: "+5%" },
          { label: "Terminés", value: kpiData.termines, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+23%" },
          { label: "En pause", value: kpiData.pauses, icon: PauseCircle, color: "text-amber-600", bg: "bg-amber-50", trend: "-2%" },
          { label: "En retard", value: kpiData.enRetard, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", trend: "+8%" },
          { label: "Budget total", value: kpiData.budgetTotal, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50", trend: "+18%" },
        ].map(({ label, value, icon: Icon, color, bg, trend }, i) => (
          <div key={i} className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`rounded-xl ${bg} p-2.5 ${color}`}>
                <Icon size={18} />
              </div>
              <span className={`text-xs font-medium ${trend.startsWith("+") ? "text-emerald-600" : "text-red-600"} bg-slate-50 rounded-lg px-2 py-0.5`}>
                {trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {label === "Budget total" ? formatBudget(value) : value}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher projets, tâches, clients..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-50"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
          >
            <option value="">Statut</option>
            {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="relative">
          <select
            value={filterPriorite}
            onChange={(e) => setFilterPriorite(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
          >
            <option value="">Priorité</option>
            {PRIORITES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="relative">
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
          >
            <option value="">Client</option>
            {clients.map((c) => <option key={c._id} value={c._id}>{c.nomSociete}</option>)}
          </select>
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm font-medium text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
          >
            <option value="dateFin">Trier par date</option>
            <option value="titre">Trier par titre</option>
            <option value="budget">Trier par budget</option>
          </select>
        </div>

      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FolderKanban size={48} className="mb-3 opacity-30" />
            <p className="text-base font-medium text-slate-500">Aucun projet trouvé</p>
            <p className="mt-1 text-sm">Créez votre premier projet pour commencer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="w-10 px-4 py-3.5 text-left"></th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Projet</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Priorité</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Progression</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Budget</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Échéance</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Chef de projet</th>
                  <th className="w-16 px-4 py-3.5 text-right font-semibold text-slate-700 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((p) => {
                  const daysLeft = p.dateFin ? daysUntil(p.dateFin) : 0;
                  const isOverdue = daysLeft === 0 && p.dateFin && p.statut !== "Terminé";
                  const isClose = daysLeft > 0 && daysLeft <= 7 && p.statut !== "Terminé";
                  const progress = Math.min(100, Math.round(Math.random() * 30 + (p.statut === "Terminé" ? 100 : p.statut === "En cours" ? 50 : p.statut === "En test" ? 75 : 20)));
                  const budgetConsumed = Math.round((p.budget || 0) * (progress / 100));

                  return (
                    <tr key={p._id} className="group transition-all hover:bg-violet-50/40">
                      {/* FAVORITE */}
                      <td className="px-4 py-4">
                        <button onClick={() => toggleFavorite(p._id)} className="transition-colors">
                          {favorites.has(p._id) ? (
                            <Star size={15} className="fill-amber-400 text-amber-400" />
                          ) : (
                            <StarOff size={15} className="text-slate-200 group-hover:text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* PROJECT */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 shadow-sm">
                            <FolderKanban size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 group-hover:text-violet-700 transition-colors">{p.titre}</p>
                            {p.description && (
                              <p className="mt-0.5 text-xs text-slate-400 line-clamp-1 max-w-[200px]">{p.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CLIENT */}
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-600">{p.clientId?.nomSociete || "—"}</span>
                      </td>

                      {/* STATUT */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${STATUT_STYLES[p.statut] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUT_BG[p.statut] || "bg-slate-400"}`} />
                          {p.statut}
                        </span>
                      </td>

                      {/* PRIORITÉ */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${PRIORITE_STYLES[p.priorite] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          {p.priorite}
                        </span>
                      </td>

                      {/* PROGRESS */}
                      <td className="px-4 py-4 min-w-[130px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-700 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-10 text-right">{progress}%</span>
                        </div>
                      </td>

                      {/* BUDGET */}
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">{formatBudget(p.budget || 0)}</p>
                          <p className="text-xs text-slate-400">Consommé: {formatBudget(budgetConsumed)}</p>
                        </div>
                      </td>

                      {/* ÉCHÉANCE */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          <span className={`text-sm ${isOverdue ? "font-semibold text-red-600" : isClose ? "font-medium text-amber-600" : "text-slate-600"}`}>
                            {p.dateFin ? new Date(p.dateFin).toLocaleDateString("fr-FR") : "—"}
                          </span>
                          {isOverdue && <span className="text-[10px] font-bold uppercase text-red-600 bg-red-50 rounded-md px-1.5 py-0.5">En retard</span>}
                          {isClose && <span className="text-[10px] font-medium text-amber-600 bg-amber-50 rounded-md px-1.5 py-0.5">{daysLeft}j</span>}
                        </div>
                      </td>

                      {/* CHEF DE PROJET */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 shadow-sm">
                            <User size={13} />
                          </div>
                          <span className="text-sm text-slate-600">{p.chefProjet || (p.chefProjetId ? `${p.chefProjetId.prenom} ${p.chefProjetId.nom}` : "—")}</span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/projects/${p._id}`)}
                            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-violet-50 hover:text-violet-600"
                            title="Voir détails"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-violet-50 hover:text-violet-600"
                            title="Modifier"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => {}}
                            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-violet-50 hover:text-violet-600"
                            title="Archiver"
                          >
                            <Archive size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <p className="text-xs text-slate-500">
            {filtered.length} projet{filtered.length !== 1 ? "s" : ""} · Page {page} sur {Math.max(1, totalPages)}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            ><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`min-w-[32px] rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                  page === n
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >{n}</button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            ><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* BOTTOM ANALYTICS */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* DONUT CHART */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Projets par statut</h3>
            <BarChart3 size={16} className="text-slate-400" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statutChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {statutChart.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {statutChart.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-xs text-slate-600">{item.name}</span>
                  <span className="ml-auto text-xs font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OVERALL PROGRESS */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Progression globale</h3>
          <div className="flex items-end gap-3 mb-4">
            <p className="text-4xl font-bold text-slate-900">{overallProgress.percent}%</p>
            <div className="mb-1 flex items-center gap-1 text-sm text-emerald-600 font-medium">
              <TrendingUp size={14} /> Complété
            </div>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden mb-6">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000"
              style={{ width: `${overallProgress.percent}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Terminées", value: overallProgress.done, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "En cours", value: overallProgress.inProgress, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "En attente", value: overallProgress.pending, color: "text-amber-600", bg: "bg-amber-50" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-xl ${bg} p-3 text-center`}>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* UPCOMING DEADLINES */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Échéances imminentes</h3>
          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Aucune échéance à venir</p>
            ) : (
              upcomingDeadlines.map((p) => {
                const days = daysUntil(p.dateFin);
                return (
                  <div key={p._id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-all hover:border-slate-200 hover:shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.titre}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(p.dateFin).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className={`shrink-0 ml-3 rounded-lg px-2.5 py-1 text-xs font-bold ${
                      days === 0 ? "bg-red-50 text-red-600" : days <= 3 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-600"
                    }`}>
                      {days === 0 ? "Aujourd'hui" : days <= 1 ? "Demain" : `J-${days}`}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? "Modifier projet" : "Ajouter projet"}
              </h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 flex items-center gap-2"><AlertCircle size={14} /> {error}</p>}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Titre *</label>
                <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-100 ${errors.titre ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400"}`} />
                {errors.titre && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.titre}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Description *</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-100 resize-none ${errors.description ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400"}`} />
                {errors.description && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Client *</label>
                  <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-100 bg-white ${errors.clientId ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400"}`}>
                    <option value="">Sélectionner...</option>
                    {clients.map((c) => <option key={c._id} value={c._id}>{c.nomSociete}</option>)}
                  </select>
                  {errors.clientId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.clientId}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Chef de projet</label>
                  <select value={form.chefProjet} onChange={(e) => setForm({ ...form, chefProjet: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white">
                    <option value="">Sélectionner...</option>
                    {team.map((m) => (
                      <option key={m._id} value={`${m.prenom} ${m.nom}`}>{m.prenom} {m.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Statut</label>
                  <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white">
                    {STATUTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Priorité</label>
                  <select value={form.priorite} onChange={(e) => setForm({ ...form, priorite: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white">
                    {PRIORITES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Date début *</label>
                  <input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-100 ${errors.dateDebut ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400"}`} />
                  {errors.dateDebut && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.dateDebut}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Date fin *</label>
                  <input type="date" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-100 ${errors.dateFin ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400"}`} />
                  {errors.dateFin && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.dateFin}</p>}
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Budget (€) *</label>
                  <input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-100 ${errors.budget ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400"}`} />
                  {errors.budget && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.budget}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2 text-sm font-medium text-white disabled:opacity-60 hover:opacity-90">
                  {saving ? "Enregistrement..." : editing ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
