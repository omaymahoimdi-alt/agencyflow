"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Search, X, Building2, Filter, ArrowUpDown,
  AlertCircle, Star, Eye, Mail, ClipboardList,
  List, Grid, ChevronLeft, ChevronRight, Download, Users,
  Briefcase, DollarSign, Heart, Activity, TrendingUp, Award,
  Phone, MapPin, Clock, CheckSquare, UserCircle2,
} from "lucide-react";
import { addToCorbeille } from "@/lib/corbeille";

const SECTEURS = ["E-commerce", "Santé", "Education", "Informatique", "Finance", "Immobilier"] as const;

interface Client {
  _id: string;
  nomSociete: string;
  responsable: string;
  email: string;
  telephone: string;
  adresse: string;
  secteurActivite: string;
  dateCreation: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ClientDisplay extends Client {
  status: "Actif" | "Prospect" | "Inactif" | "VIP";
  score: number;
  health: "Excellent" | "Moyen" | "Risque";
  projectsCount: number;
  totalBudget: number;
  lastActivity: string;
  favorite: boolean;
}

const emptyForm = {
  nomSociete: "",
  responsable: "",
  email: "",
  telephone: "",
  adresse: "",
  secteurActivite: "",
};

const validateClient = (data: typeof emptyForm, editingId?: string, allClients: Client[] = []) => {
  const errors: Record<string, string> = {};

  if (!data.nomSociete.trim()) errors.nomSociete = "Nom société obligatoire";
  else if (data.nomSociete.trim().length < 3) errors.nomSociete = "Minimum 3 caractères";
  else if (data.nomSociete.length > 100) errors.nomSociete = "Maximum 100 caractères";
  else if (!/^[A-Za-z0-9À-ÿ\s]+$/.test(data.nomSociete)) errors.nomSociete = "Uniquement lettres, chiffres, espaces";

  if (!data.responsable.trim()) errors.responsable = "Responsable obligatoire";
  else if (data.responsable.trim().length < 3) errors.responsable = "Minimum 3 caractères";
  else if (data.responsable.length > 50) errors.responsable = "Maximum 50 caractères";
  else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(data.responsable)) errors.responsable = "Uniquement lettres et espaces";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email.trim()) errors.email = "Email obligatoire";
  else if (!emailRegex.test(data.email)) errors.email = "Email invalide";
  else {
    const existingEmail = allClients.find(c => c.email.toLowerCase() === data.email.toLowerCase() && c._id !== editingId);
    if (existingEmail) errors.email = "Email déjà utilisé";
  }

  if (data.telephone.trim()) {
    if (!/^\d{8}$/.test(data.telephone.trim())) errors.telephone = "8 chiffres exactement";
  }

  if (data.adresse.length > 200) errors.adresse = "Maximum 200 caractères";

  if (!data.secteurActivite.trim()) errors.secteurActivite = "Secteur obligatoire";

  return errors;
};

function getClientInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function getRelativeTime(dateStr: string) {
  if (!dateStr) return "—";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} ans`;
}

function hashId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function enhanceClient(client: Client): ClientDisplay {
  const h = hashId(client._id);
  const statuses: ClientDisplay["status"][] = ["Actif", "Actif", "Actif", "Prospect", "Inactif", "VIP"];
  const status = client.secteurActivite === "Informatique" ? "Actif"
    : client.secteurActivite === "E-commerce" ? "VIP"
    : client.secteurActivite === "Finance" ? "Prospect"
    : statuses[h % statuses.length];

  const score = 30 + (h % 70);
  const health: ClientDisplay["health"] = score >= 75 ? "Excellent" : score >= 55 ? "Moyen" : "Risque";
  const projectsCount = 1 + (h % 15);
  const totalBudget = (5 + (h % 50)) * 5000;

  return {
    ...client,
    status,
    score,
    health,
    projectsCount,
    totalBudget,
    lastActivity: getRelativeTime(client.updatedAt || client.createdAt || client.dateCreation || ""),
    favorite: h % 5 === 0,
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientDisplay[]>([]);
  const [filtered, setFiltered] = useState<ClientDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [filterSecteur, setFilterSecteur] = useState("");
  const [sortBy, setSortBy] = useState("nomSociete");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);


  const stats = useMemo(() => ({
    total: clients.length,
    favorites: clients.filter(c => c.favorite).length,
    actifs: clients.filter(c => c.status === "Actif" || c.status === "VIP").length,
    budget: clients.reduce((sum, c) => sum + c.totalBudget, 0),
  }), [clients]);

  useEffect(() => {
    let result = [...clients];

    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (c) =>
          c.nomSociete.toLowerCase().includes(q) ||
          c.responsable.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    if (activeFilter === "Favoris") result = result.filter(c => c.favorite);
    else if (activeFilter === "Actifs") result = result.filter(c => c.status === "Actif");
    else if (activeFilter === "Prospects") result = result.filter(c => c.status === "Prospect");
    else if (activeFilter === "Inactifs") result = result.filter(c => c.status === "Inactif");
    else if (activeFilter === "VIP") result = result.filter(c => c.status === "VIP");

    if (filterSecteur) {
      result = result.filter(c => c.secteurActivite === filterSecteur);
    }

    result.sort((a, b) => {
      if (sortBy === "nomSociete") return a.nomSociete.localeCompare(b.nomSociete);
      if (sortBy === "responsable") return a.responsable.localeCompare(b.responsable);
      if (sortBy === "dateCreation") return new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime();
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "budget") return b.totalBudget - a.totalBudget;
      return 0;
    });

    setFiltered(result);
    setCurrentPage(1);
  }, [search, clients, activeFilter, filterSecteur, sortBy]);

  async function fetchClients() {
    setLoading(true);
    const res = await fetch("/api/clients");
    const data = await res.json();
    const raw: Client[] = Array.isArray(data) ? data : [];
    const enhanced = raw.map(enhanceClient);
    setClients(enhanced);
    setFiltered(enhanced);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setError("");
    setShowModal(true);
  }

  function openEdit(client: ClientDisplay) {
    setEditing(client);
    setForm({
      nomSociete: client.nomSociete,
      responsable: client.responsable,
      email: client.email,
      telephone: client.telephone || "",
      adresse: client.adresse || "",
      secteurActivite: client.secteurActivite || "",
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

    const validationErrors = validateClient(form, editing?._id, clients);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSaving(false);
      return;
    }

    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/clients/${editing._id}` : "/api/clients";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowModal(false);
      fetchClients();
    } else {
      const d = await res.json();
      setError(d.message || "Erreur serveur");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce client ?")) return;
    const client = clients.find(c => c._id === id);
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    fetchClients();
    if (client) {
      addToCorbeille({
        id: "corbeille-client-" + Date.now(),
        type: "Client",
        nom: client.nomSociete,
        supprimePar: { nom: "Moi", fonction: "Utilisateur", avatar: "M" },
        supprimeLe: new Date().toISOString(),
        supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        sourceData: client,
      });
    }
  }

  function toggleFavorite(id: string) {
    setClients(prev => prev.map(c =>
      c._id === id ? { ...c, favorite: !c.favorite } : c
    ));
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedClients = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusBadges: Record<string, { bg: string; text: string; dot: string }> = {
    Actif: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    Prospect: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    Inactif: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    VIP: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  };

  const sectorBadges: Record<string, string> = {
    "Informatique": "bg-blue-50 text-blue-700 border-blue-200",
    "E-commerce": "bg-cyan-50 text-cyan-700 border-cyan-200",
    "Immobilier": "bg-amber-50 text-amber-700 border-amber-200",
    "Santé": "bg-rose-50 text-rose-700 border-rose-200",
    "Finance": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Education": "bg-violet-50 text-violet-700 border-violet-200",
  };

  function getScoreBadge(score: number) {
    if (score >= 75) return { icon: "🏆", label: "Excellent", color: "text-emerald-600" };
    if (score >= 55) return { icon: "🥈", label: "Bon", color: "text-amber-600" };
    return { icon: "🥉", label: "Faible", color: "text-red-500" };
  }

  function formatBudget(amount: number) {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
  }

  function PageButton({ page, current, onClick }: { page: number; current: number; onClick: (p: number) => void }) {
    return (
      <button
        onClick={() => onClick(page)}
        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
          page === current
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
            : "text-slate-500 hover:bg-slate-100"
        }`}
      >
        {page}
      </button>
    );
  }

  // Unused action menu removed - using inline icons instead

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">Gérez et suivez tous vos clients et entreprises</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 shadow-sm">
            <Download size={16} /> Export
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90"
          >
            <Plus size={16} /> Ajouter client
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Users size={20} className="text-indigo-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp size={12} /> +12%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500">Total clients</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Star size={20} className="text-amber-500" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">{stats.favorites}</p>
          <p className="text-xs text-slate-500">Favoris</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Activity size={20} className="text-emerald-600" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">{stats.actifs}</p>
          <p className="text-xs text-slate-500">Clients actifs</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
              <DollarSign size={20} className="text-violet-600" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">{formatBudget(stats.budget)}</p>
          <p className="text-xs text-slate-500">Budget total</p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {["Tous", "Favoris", "Actifs", "Prospects", "Inactifs", "VIP"].map((pill) => (
          <button
            key={pill}
            onClick={() => setActiveFilter(pill)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeFilter === pill
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm"
            }`}
          >
            {pill === "Favoris" && <Star size={13} className="inline mr-1 -mt-0.5" />}
            {pill === "VIP" && <Award size={13} className="inline mr-1 -mt-0.5" />}
            {pill}
          </button>
        ))}
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterSecteur}
            onChange={(e) => setFilterSecteur(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm outline-none shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Tous les secteurs</option>
            {SECTEURS.map((secteur) => (
              <option key={secteur} value={secteur}>{secteur}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm outline-none shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="nomSociete">Société</option>
            <option value="responsable">Responsable</option>
            <option value="dateCreation">Date</option>
            <option value="score">Score</option>
            <option value="budget">Budget</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-2 transition ${viewMode === "list" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
            title="Vue liste"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`rounded-lg p-2 transition ${viewMode === "cards" ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
            title="Vue cartes"
          >
            <Grid size={18} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-16 shadow-sm">
          <Building2 size={48} className="mb-3 text-slate-300" />
          <p className="text-lg font-medium text-slate-400">Aucun client trouvé</p>
          <p className="mt-1 text-sm text-slate-400">Essayez de modifier vos filtres ou ajoutez un nouveau client</p>
        </div>
      ) : viewMode === "list" ? (
        <>
          {/* Table View */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="w-10 px-4 py-3.5 text-left" />
                    <th className="px-3 py-3.5 text-left font-semibold text-slate-700">Client</th>
                    <th className="px-3 py-3.5 text-left font-semibold text-slate-700">Responsable</th>
                    <th className="px-3 py-3.5 text-left font-semibold text-slate-700">Secteur</th>
                    <th className="px-3 py-3.5 text-center font-semibold text-slate-700">Projets</th>
                    <th className="px-3 py-3.5 text-right font-semibold text-slate-700">Budget</th>
                    <th className="px-3 py-3.5 text-center font-semibold text-slate-700">Score</th>
                    <th className="px-3 py-3.5 text-center font-semibold text-slate-700">Statut</th>
                    <th className="px-3 py-3.5 text-left font-semibold text-slate-700 hidden lg:table-cell">Activité</th>
                    <th className="w-14 px-4 py-3.5 text-right font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedClients.map((client) => {
                    const scoreBadge = getScoreBadge(client.score);
                    return (
                      <tr key={client._id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => toggleFavorite(client._id)}
                            className={`transition ${client.favorite ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}`}
                          >
                            <Star size={15} fill={client.favorite ? "currentColor" : "none"} />
                          </button>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
                              {getClientInitials(client.nomSociete)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{client.nomSociete}</p>
                              <p className="text-xs text-slate-400">{client.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            <UserCircle2 size={14} className="text-slate-400" />
                            <span className="text-slate-600">{client.responsable}</span>
                          </div>
                          {client.telephone && (
                            <p className="mt-0.5 text-xs text-slate-400">{client.telephone}</p>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className={`inline-block rounded-md border px-2.5 py-1 text-xs font-medium ${sectorBadges[client.secteurActivite] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                            {client.secteurActivite || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <ClipboardList size={14} className="text-slate-400" />
                            <span className="font-medium text-slate-700">{client.projectsCount}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-right font-medium text-slate-700">
                          {formatBudget(client.totalBudget)}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <span className="text-lg">{scoreBadge.icon}</span>
                              <span className={`font-bold text-lg ${scoreBadge.color}`}>{client.score}</span>
                              <span className="text-xs text-slate-400">/100</span>
                            </div>
                            <span className={`text-xs font-medium ${scoreBadge.color}`}>{scoreBadge.label}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusBadges[client.status].bg} ${statusBadges[client.status].text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusBadges[client.status].dot}`} />
                            {client.status}
                          </span>
                        </td>
                        <td className="hidden px-3 py-3.5 lg:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock size={12} />
                            <span>{client.lastActivity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => router.push(`/dashboard/clients/${client._id}`)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                              title="Voir détails"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => openEdit(client)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                              title="Modifier"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(client._id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
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
          </div>
        </>
      ) : (
        <>
          {/* Card View */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedClients.map((client) => {
              const scoreBadge = getScoreBadge(client.score);
              return (
                <div
                  key={client._id}
                  className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
                        {getClientInitials(client.nomSociete)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{client.nomSociete}</h3>
                          <button
                            onClick={() => toggleFavorite(client._id)}
                            className={`transition ${client.favorite ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}`}
                          >
                            <Star size={14} fill={client.favorite ? "currentColor" : "none"} />
                          </button>
                        </div>
                        <span className={`inline-block mt-0.5 rounded-md border px-2 py-0.5 text-xs font-medium ${sectorBadges[client.secteurActivite] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          {client.secteurActivite || "—"}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadges[client.status].bg} ${statusBadges[client.status].text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusBadges[client.status].dot}`} />
                      {client.status}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <UserCircle2 size={14} className="text-slate-400 shrink-0" />
                      <span>{client.responsable}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.telephone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone size={14} className="text-slate-400 shrink-0" />
                        <span>{client.telephone}</span>
                      </div>
                    )}
                    {client.adresse && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{client.adresse}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                    <div>
                      <p className="text-xs text-slate-400">Projets</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-700">{client.projectsCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Budget</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-700">{formatBudget(client.totalBudget)}</p>
                    </div>
                  </div>

                  {/* Score & Health */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">
                      <span className="text-base">{scoreBadge.icon}</span>
                      <div>
                        <p className="text-xs text-slate-400">Score</p>
                        <p className={`text-sm font-bold ${scoreBadge.color}`}>{client.score}/100</p>
                      </div>
                    </div>

                  </div>

                  {/* Last Activity */}
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock size={11} />
                    <span>Dernière activité : {client.lastActivity}</span>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/clients/${client._id}`)}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      <Eye size={14} className="inline mr-1 -mt-0.5" /> Voir détails
                    </button>
                    <button
                      onClick={() => openEdit(client)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      title="Modifier"
                    >
                      <Pencil size={14} className="inline mr-1 -mt-0.5" /> Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(client._id)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 size={14} className="inline mr-1 -mt-0.5" /> Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filtered.length)} sur {filtered.length} clients
            </span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <span>Afficher</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-indigo-400"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>par page</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PageButton key={page} page={page} current={currentPage} onClick={setCurrentPage} />
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? "Modifier client" : "Ajouter client"}
              </h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 flex items-center gap-2"><AlertCircle size={14} /> {error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Nom société *</label>
                  <input
                    type="text"
                    value={form.nomSociete}
                    onChange={(e) => setForm({ ...form, nomSociete: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 ${errors.nomSociete ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`}
                  />
                  {errors.nomSociete && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.nomSociete}</p>}
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Responsable *</label>
                  <input
                    type="text"
                    value={form.responsable}
                    onChange={(e) => setForm({ ...form, responsable: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 ${errors.responsable ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`}
                  />
                  {errors.responsable && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.responsable}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 ${errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.email}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Téléphone</label>
                  <input
                    type="text"
                    maxLength={8}
                    value={form.telephone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                      setForm({ ...form, telephone: val });
                    }}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 ${errors.telephone ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`}
                  />
                  {errors.telephone && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.telephone}</p>}
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Adresse</label>
                  <textarea
                    value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    maxLength={200}
                    rows={2}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 ${errors.adresse ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`}
                  />
                  {errors.adresse && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.adresse}</p>}
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Secteur d'activité *</label>
                  <select
                    value={form.secteurActivite}
                    onChange={(e) => setForm({ ...form, secteurActivite: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 ${errors.secteurActivite ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`}
                  >
                    <option value="">Sélectionner un secteur</option>
                    {SECTEURS.map((secteur) => <option key={secteur} value={secteur}>{secteur}</option>)}
                  </select>
                  {errors.secteurActivite && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.secteurActivite}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2 text-sm font-medium text-white disabled:opacity-60 hover:opacity-90"
                >
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
