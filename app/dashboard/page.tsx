"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from "recharts";
import {
  Building2, FolderKanban, CheckSquare, Users, FileText,
  TrendingUp, Bot, Sparkles, ArrowRight, Clock, DollarSign,
  CalendarDays, AlertCircle, Target, Briefcase, ChevronRight,
  Star, Activity, Settings, BarChart3,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  totalClients: number;
  totalProjects: number;
  totalTasks: number;
  totalEmployes: number;
  totalDocuments: number;
  totalBudget: number;
  projectsByStatut: { _id: string; count: number }[];
  tasksByStatut: { _id: string; count: number }[];
  projectsPerClient: { nomSociete: string; count: number }[];
  recentProjects: {
    _id: string; titre: string; statut: string; priorite: string;
    budget?: number; dateDebut?: string; dateFin?: string;
    clientId?: { nomSociete: string };
  }[];
}

const STATUT_COLORS: Record<string, string> = {
  "En attente": "#f59e0b", "En cours": "#6366f1",
  "En test": "#8b5cf6", "Terminé": "#10b981", "Suspendu": "#ef4444",
};
const TASK_COLORS: Record<string, string> = {
  "À faire": "#94a3b8", "En cours": "#6366f1",
  "Terminée": "#10b981", "Bloquée": "#ef4444",
};
const PRIORITE_BADGE: Record<string, string> = {
  Faible: "bg-slate-100 text-slate-600", Moyenne: "bg-blue-100 text-blue-700",
  Haute: "bg-orange-100 text-orange-700", Urgente: "bg-red-100 text-red-700",
};
const STATUT_BADGE: Record<string, string> = {
  "En attente": "bg-amber-100 text-amber-700", "En cours": "bg-indigo-100 text-indigo-700",
  "En test": "bg-violet-100 text-violet-700", "Terminé": "bg-emerald-100 text-emerald-700",
  "Suspendu": "bg-red-100 text-red-700",
};

function formatBudget(v: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }).format(v);
}
function formatNumber(v: number) {
  return new Intl.NumberFormat("fr-FR").format(v);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats({
          totalClients: data.totalClients ?? 0,
          totalProjects: data.totalProjects ?? 0,
          totalTasks: data.totalTasks ?? 0,
          totalEmployes: data.totalEmployes ?? 0,
          totalDocuments: data.totalDocuments ?? 0,
          totalBudget: data.totalBudget ?? 0,
          projectsByStatut: Array.isArray(data.projectsByStatut) ? data.projectsByStatut : [],
          tasksByStatut: Array.isArray(data.tasksByStatut) ? data.tasksByStatut : [],
          projectsPerClient: Array.isArray(data.projectsPerClient) ? data.projectsPerClient : [],
          recentProjects: Array.isArray(data.recentProjects) ? data.recentProjects : [],
        });
        setLoading(false);
      })
      .catch(() => {
        setStats({
          totalClients: 0, totalProjects: 0, totalTasks: 0,
          totalEmployes: 0, totalDocuments: 0, totalBudget: 0,
          projectsByStatut: [], tasksByStatut: [],
          projectsPerClient: [], recentProjects: [],
        });
        setLoading(false);
      });
  }, []);

  const projectsChartData = useMemo(() => (stats?.projectsByStatut || []).map((s) => ({
    name: s._id, value: s.count, fill: STATUT_COLORS[s._id] || "#6366f1",
  })), [stats?.projectsByStatut]);
  const tasksChartData = useMemo(() => (stats?.tasksByStatut || []).map((s) => ({
    name: s._id, value: s.count, fill: TASK_COLORS[s._id] || "#94a3b8",
  })), [stats?.tasksByStatut]);
  const clientsChartData = useMemo(() => (stats?.projectsPerClient || []).map((c) => ({
    name: c.nomSociete.length > 12 ? c.nomSociete.slice(0, 12) + "…" : c.nomSociete,
    projets: c.count,
  })), [stats?.projectsPerClient]);

  const completionRate = stats && stats.totalProjects > 0
    ? Math.round(((stats.projectsByStatut.find(s => s._id === "Terminé")?.count || 0) / stats.totalProjects) * 100)
    : 0;
  const activeProjects = stats
    ? stats.projectsByStatut.filter(s => s._id === "En cours" || s._id === "En test").reduce((a, s) => a + s.count, 0)
    : 0;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="relative">
          <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BarChart3 size={18} className="text-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        <AlertCircle size={20} className="mr-2" /> Erreur de chargement
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header avec bannière gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 shadow-2xl shadow-indigo-500/25">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-white/15 p-2 backdrop-blur">
                <Sparkles size={20} className="text-yellow-300" />
              </div>
              <p className="text-sm font-medium text-violet-200">{greeting}, Admin</p>
            </div>
            <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
            <p className="mt-1 text-violet-200">
              {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/projects"
              className="flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25">
              <Briefcase size={16} /> Nouveau projet <ArrowRight size={14} />
            </Link>
            <Link href="/dashboard/chatbot"
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-indigo-700 shadow-lg transition hover:bg-violet-50">
              <Bot size={16} /> Assistant IA
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Clients", value: stats.totalClients, icon: Building2, gradient: "from-blue-500 to-blue-600", badge: `${stats.totalProjects > 0 ? Math.round(stats.totalProjects / Math.max(stats.totalClients, 1)) : 0} projets/client`, link: "/dashboard/clients" },
          { label: "Projets", value: stats.totalProjects, icon: FolderKanban, gradient: "from-indigo-500 to-violet-600", badge: `${activeProjects} en cours`, link: "/dashboard/projects" },
          { label: "Tâches", value: stats.totalTasks, icon: CheckSquare, gradient: "from-emerald-500 to-teal-600", badge: `${completionRate}% complétées`, link: "/dashboard/projects" },
          { label: "Employés", value: stats.totalEmployes, icon: Users, gradient: "from-orange-500 to-red-500", badge: "Membres actifs", link: "/dashboard/team" },
          { label: "Documents", value: stats.totalDocuments, icon: FileText, gradient: "from-violet-500 to-purple-600", badge: "Fichiers uploadés", link: "/dashboard/projects" },
          { label: "Budget", value: stats.totalBudget, icon: DollarSign, gradient: "from-rose-500 to-pink-600", badge: "Tous projets", link: "/dashboard/projects", currency: true },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.link}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-md`}>
                  <Icon size={18} className="text-white" />
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition" />
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {card.currency ? formatBudget(card.value) : formatNumber(card.value)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{card.badge}</p>
            </Link>
          );
        })}
      </section>

      {/* Mini stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Taux de complétion", value: `${completionRate}%`, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Projets actifs", value: activeProjects, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Budget moyen", value: stats.totalProjects > 0 ? formatBudget(stats.totalBudget / stats.totalProjects) : "0 €", icon: DollarSign, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Projets/client", value: stats.totalClients > 0 ? (stats.totalProjects / stats.totalClients).toFixed(1) : "0", icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg}`}>
                  <Icon size={16} className={item.color} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Graphiques */}
      <section className="grid gap-6 lg:grid-cols-3">

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <Activity size={16} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Projets par statut</h2>
              <p className="text-[11px] text-slate-400">{stats.totalProjects} projet{stats.totalProjects > 1 ? "s" : ""}</p>
            </div>
          </div>
          {projectsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={projectsChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" isAnimationActive={false}>
                  {projectsChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, "Projets"]} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-sm text-slate-400">
              <FolderKanban size={32} className="mb-2 text-slate-200" />
              Aucun projet
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <CheckSquare size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Tâches par statut</h2>
              <p className="text-[11px] text-slate-400">{stats.totalTasks} tâche{stats.totalTasks > 1 ? "s" : ""}</p>
            </div>
          </div>
          {tasksChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tasksChartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {tasksChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-sm text-slate-400">
              <CheckSquare size={32} className="mb-2 text-slate-200" />
              Aucune tâche
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Building2 size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Top clients</h2>
              <p className="text-[11px] text-slate-400">{clientsChartData.length} client{clientsChartData.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          {clientsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={clientsChartData} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="projets" fill="#6366f1" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-sm text-slate-400">
              <Building2 size={32} className="mb-2 text-slate-200" />
              Aucun client
            </div>
          )}
        </div>

      </section>

      {/* Projets récents + Sidebar */}
      <section className="grid gap-6 lg:grid-cols-5">

        <div className="lg:col-span-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <Clock size={16} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Projets récents</h2>
                <p className="text-[11px] text-slate-400">Les 5 derniers projets</p>
              </div>
            </div>
            <Link href="/dashboard/projects"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recentProjects.length > 0 ? (
              stats.recentProjects.map((p) => (
                <div key={p._id}
                  className="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 px-4 py-3 transition hover:bg-slate-100 hover:border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
                      {p.titre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.titre}</p>
                      <p className="text-xs text-slate-400 truncate">{p.clientId?.nomSociete || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${PRIORITE_BADGE[p.priorite] || "bg-slate-100 text-slate-600"}`}>
                      {p.priorite}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${STATUT_BADGE[p.statut] || "bg-slate-100 text-slate-600"}`}>
                      {p.statut}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-400">
                <FolderKanban size={36} className="mb-2 text-slate-200" />
                Aucun projet récent
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Link href="/dashboard/chatbot"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 shadow-lg shadow-violet-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5 block">
            <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
            <div className="absolute -top-8 -left-8 h-24 w-24 rounded-full bg-white/5" />
            <div className="relative z-10">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Bot size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Assistant IA</h3>
              <p className="mt-1 text-sm text-violet-200">
                Posez vos questions sur les projets, tâches et performances
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-white group-hover:gap-3 transition-all">
                <Sparkles size={16} className="text-yellow-300" />
                Essayer maintenant
                <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Star size={14} className="text-amber-500" /> Accès rapide
            </h3>
            <div className="space-y-2">
              {[
                { label: "Nouveau projet", icon: FolderKanban, href: "/dashboard/projects", color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Ajouter un client", icon: Building2, href: "/dashboard/clients", color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Gérer l'équipe", icon: Users, href: "/dashboard/team", color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Paramètres", icon: Settings, href: "/dashboard/settings", color: "text-slate-600", bg: "bg-slate-100" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} href={item.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50 group">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.bg}`}>
                      <Icon size={14} className={item.color} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-700 group-hover:text-slate-900">{item.label}</span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}