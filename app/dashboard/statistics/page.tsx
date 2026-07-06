"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { TrendingUp, Users, CheckSquare, Building2 } from "lucide-react";

interface Stats {
  totalClients: number;
  totalProjects: number;
  totalTasks: number;
  totalEmployes: number;
  totalDocuments: number;
  projectsByStatut: { _id: string; count: number }[];
  tasksByStatut: { _id: string; count: number }[];
  projectsPerClient: { nomSociete: string; count: number }[];
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) return <p className="text-red-500">Erreur de chargement.</p>;

  const projectStatutData = stats.projectsByStatut.map((s, i) => ({
    name: s._id, value: s.count, fill: COLORS[i % COLORS.length],
  }));

  const taskStatutData = stats.tasksByStatut.map((s, i) => ({
    name: s._id, value: s.count, fill: COLORS[i % COLORS.length],
  }));

  const clientData = stats.projectsPerClient.map((c) => ({
    name: c.nomSociete, projets: c.count,
  }));

  // Completion rate
  const completedTasks = stats.tasksByStatut.find((t) => t._id === "Terminée")?.count || 0;
  const completionRate = stats.totalTasks ? Math.round((completedTasks / stats.totalTasks) * 100) : 0;
  const completedProjects = stats.projectsByStatut.find((p) => p._id === "Terminé")?.count || 0;
  const projectCompletionRate = stats.totalProjects ? Math.round((completedProjects / stats.totalProjects) * 100) : 0;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Statistiques</h1>
        <p className="mt-1 text-sm text-slate-500">Analyse détaillée de votre agence</p>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Taux de complétion tâches", value: `${completionRate}%`, icon: CheckSquare, color: "from-emerald-500 to-teal-600", sub: `${completedTasks} / ${stats.totalTasks} tâches` },
          { label: "Taux de complétion projets", value: `${projectCompletionRate}%`, icon: TrendingUp, color: "from-indigo-500 to-violet-600", sub: `${completedProjects} / ${stats.totalProjects} projets` },
          { label: "Clients actifs", value: stats.totalClients, icon: Building2, color: "from-blue-500 to-blue-600", sub: "Total clients" },
          { label: "Membres équipe", value: stats.totalEmployes, icon: Users, color: "from-orange-500 to-red-500", sub: "Total employés" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.color} shadow-lg`}>
                <Icon size={22} className="text-white" />
              </div>
              <p className="text-sm text-slate-500">{kpi.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{kpi.value}</p>
              <p className="mt-1 text-xs text-slate-400">{kpi.sub}</p>
            </div>
          );
        })}
      </section>

      {/* Charts Row 1 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Répartition des projets par statut</h2>
          {projectStatutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={projectStatutData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine>
                  {projectStatutData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="py-20 text-center text-sm text-slate-400">Aucune donnée</p>}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Tâches par statut</h2>
          {taskStatutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={taskStatutData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {taskStatutData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="py-20 text-center text-sm text-slate-400">Aucune donnée</p>}
        </div>
      </section>

      {/* Charts Row 2 */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Projets par client (Top 5)</h2>
          {clientData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={clientData} layout="vertical" barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip />
                <Bar dataKey="projets" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="py-20 text-center text-sm text-slate-400">Aucune donnée</p>}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Résumé global</h2>
          <div className="space-y-4">
            {[
              { label: "Total clients", value: stats.totalClients, color: "bg-blue-500" },
              { label: "Total projets", value: stats.totalProjects, color: "bg-indigo-500" },
              { label: "Total tâches", value: stats.totalTasks, color: "bg-emerald-500" },
              { label: "Total employés", value: stats.totalEmployes, color: "bg-orange-500" },
              { label: "Total documents", value: stats.totalDocuments, color: "bg-violet-500" },
            ].map((item) => {
              const max = Math.max(stats.totalClients, stats.totalProjects, stats.totalTasks, stats.totalEmployes, stats.totalDocuments, 1);
              const pct = Math.round((item.value / max) * 100);
              return (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
