"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Clock, Play, Square, Download, Search, Filter, MoreHorizontal,
  Users, BarChart3, FolderKanban, CheckCircle, ChevronLeft, ChevronRight,
  FileText, TrendingUp, Pencil, X, AlertCircle, Pause, StopCircle, Trash2,
  UserCheck, Briefcase, Loader2,
} from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// --- Types ---
interface ChronoEntry {
  id: string;
  tache: string;
  projet: string;
  membre: { prenom: string; nom: string; email: string; role: string };
  startTime: string;
  endTime: string | null;
  dureeMinutes: number;
  description: string;
  date: string;
  paused?: boolean;
  frozenAt?: string;
}

interface Membre {
  id: string; prenom: string; nom: string; email: string; role: string;
}

interface ProjectItem { _id: string; titre: string }
interface TaskItem { _id: string; titre: string; projetId?: { _id: string; titre: string } | null }

const INITIAL_ENTRIES: ChronoEntry[] = [];

const TABS = ["Chronomètres actifs", "Temps enregistrés", "Par projet", "Rapports"];


const ACTIVITES = [
  { id: "a1", user: "Ahmed Ben Ali", action: "a démarré un chronomètre sur \"Optimisation API\"", time: "Il y a 2h" },
  { id: "a2", user: "Omayma Hoimdi", action: "a arrêté le suivi sur \"Documentation API\"", time: "Il y a 4h" },
  { id: "a3", user: "Lina Ben Amor", action: "a modifié le temps de la tâche \"Maquette UI\"", time: "Il y a 6h" },
  { id: "a4", user: "Mohamed Salah", action: "a enregistré 3h sur \"Tests unitaires\"", time: "Il y a 1j" },
  { id: "a5", user: "Jane Smith", action: "a démarré le chronomètre sur \"Revue de code\"", time: "Il y a 2j" },
  { id: "a6", user: "Karim Aouadi", action: "a terminé l'audit sécurité", time: "Il y a 3j" },
];

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function getInitials(p: string, n: string): string {
  return ((p?.[0] ?? "") + (n?.[0] ?? "")).toUpperCase() || "?";
}

export default function ProductivitePage() {
  const [entries, setEntries] = useState<ChronoEntry[]>(INITIAL_ENTRIES);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("af_chronos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((e: any) => e.id === "c1" || e.id === "h1")) {
          localStorage.removeItem("af_chronos");
        } else {
          setEntries(parsed);
        }
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (entries === INITIAL_ENTRIES) return;
    try { localStorage.setItem("af_chronos", JSON.stringify(entries)); } catch {}
  }, [entries]);
  const [activeTab, setActiveTab] = useState("Chronomètres actifs");
  const [showNewTimer, setShowNewTimer] = useState(false);
  const [newMembre, setNewMembre] = useState("");
  const [newTache, setNewTache] = useState("");
  const [newProjet, setNewProjet] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Dynamic data — sync'd with projets / tâches / équipe
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<Membre[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [pRes, tRes, teamRes] = await Promise.all([
        fetch("/api/projects").then(r => r.json()).catch(() => []),
        fetch("/api/tasks").then(r => r.json()).catch(() => []),
        fetch("/api/team").then(r => r.json()).catch(() => []),
      ]);
      setProjects(Array.isArray(pRes) ? pRes : []);
      setTasks(Array.isArray(tRes) ? tRes : []);
      const apiMembers = Array.isArray(teamRes) ? teamRes : [];
      if (apiMembers.length > 0) {
        const mapped = apiMembers.map((m: any) => ({
          id: m._id || m.id || "",
          prenom: m.prenom || m.nom || "",
          nom: m.nom || "",
          email: m.email || "",
          role: m.role || "",
        }));
        setTeamMembers(mapped);
        try { localStorage.setItem("af_team_members", JSON.stringify(mapped)); } catch {}
      }
    } catch { /* ignore */ }
    try {
      const stored = localStorage.getItem("af_team_members");
      if (stored) {
        const parsed = JSON.parse(stored);
        const seen = new Set<string>();
        const deduped = (Array.isArray(parsed) ? parsed : []).filter((m: any) => {
          const key = m.id || m.email;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setTeamMembers(deduped.map((m: any) => ({
          id: m._id || m.id,
          prenom: m.prenom,
          nom: m.nom,
          email: m.email,
          role: m.role,
        })));
      }
    } catch { /* ignore */ }
    setLoadingData(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Rapports tab state
  const [rapportPeriod, setRapportPeriod] = useState("Ce mois");
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    topPerformer: string; score: number; summary: string;
    topMembers: { name: string; score: number; role: string; badge?: string }[];
    struggling: string[]; risks: string[]; blocked: string[];
    recommendations: string[]; prediction: string; completion: number;
  } | null>(null);

  const rapportsRef = useRef<HTMLDivElement>(null);

  async function handleExportPDF() {
    if (!rapportsRef.current) return;
    try {
      const canvas = await html2canvas(rapportsRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      let heightLeft = pdfH;
      let position = 0;
      const pageH = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, position, pdfW, pdfH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfW, pdfH);
        heightLeft -= pageH;
      }
      pdf.save("rapport-performance.pdf");
    } catch { /* ignore */ }
  }

  const filteredTasks = useMemo(() => tasks, [tasks]);

  // Enregistrés filters & pagination
  const [regSearch, setRegSearch] = useState("");
  const [regMembre, setRegMembre] = useState("");
  const [regProjet, setRegProjet] = useState("");
  const [regPeriod, setRegPeriod] = useState("");
  const [regPage, setRegPage] = useState(1);
  const regPerPage = 5;

  // Computed
  const activeChronos = useMemo(() => entries.filter(e => !e.endTime), [entries]);
  const historiques = useMemo(() => entries.filter(e => e.endTime), [entries]);

  const filteredReg = useMemo(() => {
    let r = [...historiques];
    if (regSearch.trim()) { const q = regSearch.toLowerCase(); r = r.filter(e => e.tache.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)); }
    if (regMembre) r = r.filter(e => e.membre.email === regMembre);
    if (regProjet) r = r.filter(e => e.projet === regProjet);
    if (regPeriod === "today") r = r.filter(e => e.date === new Date().toISOString().split("T")[0]);
    if (regPeriod === "week") { const w = new Date(); w.setDate(w.getDate() - 7); r = r.filter(e => new Date(e.date) >= w); }
    if (regPeriod === "month") { const m = new Date(); m.setMonth(m.getMonth() - 1); r = r.filter(e => new Date(e.date) >= m); }
    return r;
  }, [historiques, regSearch, regMembre, regProjet, regPeriod]);

  const regTotalPages = Math.ceil(filteredReg.length / regPerPage);
  const regPaginated = filteredReg.slice((regPage - 1) * regPerPage, regPage * regPerPage);

  // Stats
  const totalMinutes = historiques.reduce((s, e) => s + e.dureeMinutes, 0);
  const uniqueProjets = new Set(entries.map(e => e.projet)).size;
  const uniqueTaches = new Set(entries.map(e => e.tache)).size;
  const avgPerMembre = teamMembers.length > 0 ? Math.round(totalMinutes / teamMembers.length) : 0;
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  // Per-member stats
  const memberStats = useMemo(() =>
    teamMembers.map(m => {
      const total = entries.filter(e => e.membre.email === m.email).reduce((s, e) => s + e.dureeMinutes, 0);
      return { ...m, totalMinutes: total };
    }).sort((a, b) => b.totalMinutes - a.totalMinutes), [entries, teamMembers]);

  // Task status helpers (matches real French statuses from API)
  const tTerminee = (t: any) => t.statut === "Terminée" || t.statut === "Terminé" || t.statut === "Terminee";
  const tBloquee = (t: any) => t.statut === "Bloquée" || t.statut === "Bloqué" || t.statut === "Bloquee";
  const tEnCours = (t: any) => t.statut === "En cours";
  const tAFaire = (t: any) => t.statut === "À faire" || t.statut === "A faire";

  const completedTasksCount = useMemo(() => tasks.filter(tTerminee).length, [tasks]);
  const totalTasksCount = useMemo(() => tasks.length, [tasks]);
  const productivitePct = totalTasksCount > 0 ? Math.round(completedTasksCount / totalTasksCount * 100) : 0;

  // Per-member task stats (match via employeId populated object)
  const memberTaskStats = useMemo(() => {
    return teamMembers.map(m => {
      const memberTasks = tasks.filter((t: any) => {
        const eid = t.employeId?._id || t.employeId;
        return eid && eid === m.id;
      });
      const done = memberTasks.filter(tTerminee).length;
      const blocked = memberTasks.filter(tBloquee).length;
      return { ...m, taskCount: memberTasks.length, done, blocked };
    });
  }, [tasks, teamMembers]);

  const rapportPerformanceEvolution = useMemo(() => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
    const now = new Date();
    const currentMonth = now.getMonth();
    return months.slice(0, currentMonth + 1).map((month, idx) => {
      const monthTasks = tasks.filter((t: any) => {
        const d = new Date(t.createdAt || t.dateDebut || t.dateFin);
        return !isNaN(d.getTime()) && d.getMonth() === idx;
      });
      const done = monthTasks.filter(tTerminee).length;
      const total = monthTasks.length || 1;
      return { month, val: Math.round(done / total * 100) };
    });
  }, [tasks]);

  const DONUT_COLORS = ["#7C3AED", "#6366F1", "#10B981", "#F59E0B", "#F472B6", "#94A3B8"];

  const tempsParProjet = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.projet, (map.get(e.projet) || 0) + e.dureeMinutes);
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, minutes], i) => ({
        name,
        heures: Math.round(minutes / 60),
        pct: total > 0 ? Math.round((minutes / total) * 100) : 0,
        couleur: DONUT_COLORS[i % DONUT_COLORS.length],
      }));
  }, [entries]);

  // Real-time clock for active chronos
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); }, []);
  useEffect(() => {
    if (activeChronos.length > 0) { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }
  }, [activeChronos.length]);

  function getElapsed(entry: ChronoEntry): string {
    if (now === 0) return "00:00:00";
    const endTime = entry.paused && entry.frozenAt ? new Date(entry.frozenAt).getTime() : now;
    const diff = Math.floor((endTime - new Date(entry.startTime).getTime()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function handleStartChrono() {
    if (!newMembre || !newTache || !newProjet) return;
    const membre = teamMembers.find(m => m.id === newMembre);
    if (!membre) return;
    const end = new Date();
    // Stop existing active chrono for this member (auto-stop)
    setEntries(prev => {
      const stopped = prev.map(e =>
        e.membre.email === membre.email && !e.endTime
          ? {
              ...e,
              endTime: end.toISOString(),
              dureeMinutes: Math.floor((end.getTime() - new Date(e.startTime).getTime()) / 60000),
              paused: false,
              frozenAt: undefined,
            }
          : e
      );
      return [{
        id: `c${Date.now()}`, tache: newTache, projet: newProjet,
        membre: { prenom: membre.prenom, nom: membre.nom, email: membre.email, role: membre.role },
        startTime: end.toISOString(), endTime: null, dureeMinutes: 0, description: newDesc,
        date: end.toISOString().split("T")[0],
      }, ...stopped];
    });
    setShowNewTimer(false);
    setNewMembre(""); setNewTache(""); setNewProjet(""); setNewDesc("");
  }

  function handleTogglePause(id: string) {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (e.paused) {
        const elapsed = new Date(e.frozenAt!).getTime() - new Date(e.startTime).getTime();
        return {
          ...e,
          startTime: new Date(Date.now() - elapsed).toISOString(),
          paused: false,
          frozenAt: undefined,
        };
      }
      return { ...e, paused: true, frozenAt: new Date().toISOString() };
    }));
  }

  function handleStopChrono(id: string) {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const end = new Date();
      const start = e.paused && e.frozenAt ? new Date(e.frozenAt) : new Date(e.startTime);
      return {
        ...e,
        endTime: end.toISOString(),
        dureeMinutes: Math.floor((end.getTime() - start.getTime()) / 60000),
        paused: false,
        frozenAt: undefined,
      };
    }));
  }

  function handleStopAll() {
    const end = new Date();
    setEntries(prev => prev.map(e => {
      if (e.endTime) return e;
      const start = e.paused && e.frozenAt ? new Date(e.frozenAt) : new Date(e.startTime);
      return {
        ...e,
        endTime: end.toISOString(),
        dureeMinutes: Math.floor((end.getTime() - start.getTime()) / 60000),
        paused: false,
        frozenAt: undefined,
      };
    }));
  }

  function handleDeleteChrono(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  function handleGenerateAiAnalysis() {
    setShowAiModal(true);
    setAiAnalysis(null);
    setTimeout(() => {
      const top = memberStats[0];
      const topTaskStat = memberTaskStats.find(m => m.email === top?.email);
      const topPct = topTaskStat && topTaskStat.taskCount > 0 ? Math.round(topTaskStat.done / topTaskStat.taskCount * 100) : 0;
      const blockes = tasks.filter(tBloquee).length;
      const enCours = tasks.filter(tEnCours).length;
      setAiAnalysis({
        topPerformer: top ? `${top.prenom} ${top.nom}` : "—",
        score: Math.min(100, top ? Math.round(top.totalMinutes / 10 || productivitePct) : 0),
        completion: Math.round(completedTasksCount / (totalTasksCount || 1) * 100),
        summary: `${top ? top.prenom : "L'équipe"} a ${completedTasksCount} tâches terminées sur ${totalTasksCount} (${productivitePct}% de productivité). ${blockes} tâches bloquées, ${enCours} en cours.`.substring(0, 250),
        topMembers: memberStats.slice(0, 5).map((m, i) => {
          const ts = memberTaskStats.find(mt => mt.email === m.email);
          return {
            name: `${m.prenom} ${m.nom}`,
            score: Math.min(100, ts && ts.taskCount > 0 ? Math.round(ts.done / ts.taskCount * 100) : 50),
            role: m.role,
            badge: i === 0 ? "Productivity Master" : i === 1 ? "Top Performer" : undefined,
          };
        }),
        struggling: memberStats.filter((_, i) => i >= Math.min(3, memberStats.length - 1)).slice(0, 2).map(m => `${m.prenom} ${m.nom} — Moins de temps enregistré`),
        risks: [`${totalTasksCount} tâches total — ${enCours} en cours, ${blockes} bloquées`, `${teamMembers.length} membres dans l'équipe`],
        blocked: tasks.filter(tBloquee).slice(0, 2).map((t: any) => `${t.titre} — Bloqué`),
        recommendations: [
          completedTasksCount > 0 ? `Féliciter ${top?.prenom || "l'équipe"} — ${completedTasksCount} tâches terminées` : "Commencer à assigner des tâches",
          blockes > 0 ? `Débloquer ${blockes} tâches bloquées pour améliorer la productivité` : "Aucune tâche bloquée",
          enCours > 0 ? `Suivi des ${enCours} tâches en cours` : "Planifier les prochaines tâches",
          `Optimiser la répartition de la charge entre les ${teamMembers.length} membres`,
        ],
        prediction: `Productivité actuelle de ${productivitePct}% avec ${completedTasksCount}/${totalTasksCount} tâches terminées.`,
      });
    }, 2000);
  }

  return (
    <div className="space-y-6">

      {/* ===== TOP BAR ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Suivi du temps</h1>
          <p className="mt-1.5 text-sm text-slate-500 max-w-2xl">
            Suivez le temps passé sur les tâches et projets. Analysez la productivité de votre équipe.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition shadow-sm">
            <Download size={16} /> Exporter le rapport
          </button>
          <button onClick={() => setShowNewTimer(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:opacity-90 transition">
            <Plus size={16} /> Nouveau suivi
          </button>
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Temps total cette semaine", value: `${totalHours}h ${totalMins}m`, evolution: "+12%", up: true, icon: Clock, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Moyenne par membre", value: `${Math.floor(avgPerMembre / 60)}h ${avgPerMembre % 60}m`, evolution: "+8%", up: true, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Projets actifs", value: `${uniqueProjets}`, evolution: "+2", up: true, icon: FolderKanban, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Tâches suivies", value: `${uniqueTaches}`, evolution: "+15%", up: true, icon: CheckCircle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Productivité moyenne", value: `${productivitePct}%`, evolution: `${totalTasksCount} tâches`, up: true, icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50" },
        ].map(({ label, value, evolution, up, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
            <div className={`rounded-xl ${bg} p-2.5 ${color} w-fit mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{label}</p>
            <p className={`mt-1 text-[11px] font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
              {evolution} <span>{up ? "↑" : "↓"}</span> vs semaine dernière
            </p>
          </div>
        ))}
      </div>

      {/* ===== TABS ===== */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 border-b border-slate-100 min-w-max pb-0">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}>{tab}</button>
          ))}
        </div>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ===== LEFT CONTENT ===== */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ===== CHRONOMÈTRES ACTIFS ===== */}
          {activeTab === "Chronomètres actifs" && (
            <>
              {/* Active timers table */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Chronomètres actifs</h3>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-600">{activeChronos.length}</span>
                  </div>
                  {activeChronos.length > 1 && (
                    <button onClick={handleStopAll} className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition">
                      <StopCircle size={13} /> Tout arrêter
                    </button>
                  )}
                </div>
                {activeChronos.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Clock size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Aucun chronomètre actif</p>
                    <p className="text-xs text-slate-400 mt-1">Cliquez sur "Nouveau suivi" pour démarrer le suivi du temps</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80">
                          <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Tâche</th>
                          <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Projet</th>
                          <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Membre</th>
                          <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Démarrage</th>
                          <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Durée</th>
                          <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeChronos.map(entry => (
                          <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="text-sm font-semibold text-slate-900">{entry.tache}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">{entry.projet}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-[10px] font-bold">
                                  {getInitials(entry.membre.prenom, entry.membre.nom)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{entry.membre.prenom} {entry.membre.nom}</p>
                                  <p className="text-[11px] text-slate-400">{entry.membre.role}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-700">{new Date(entry.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                              <p className="text-[11px] text-slate-400">Aujourd'hui</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center font-mono text-sm font-bold rounded-lg px-3 py-1.5 tracking-wider ${entry.paused ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50"}`}>
                                <Clock size={13} className={`mr-1.5 ${entry.paused ? "" : "animate-pulse"}`} />
                                {getElapsed(entry)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition">
                                <button onClick={() => handleTogglePause(entry.id)} className={`rounded-lg p-1.5 transition ${entry.paused ? "text-emerald-500 hover:bg-emerald-50" : "text-amber-500 hover:bg-amber-50"}`} title={entry.paused ? "Reprendre" : "Pause"}>
                                  {entry.paused ? <Play size={14} /> : <Pause size={14} />}
                                </button>
                                <button onClick={() => handleStopChrono(entry.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition" title="Arrêter">
                                  <Square size={14} />
                                </button>
                                <button onClick={() => handleDeleteChrono(entry.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500 transition" title="Supprimer">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Démarrer un nouveau suivi */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Démarrer un nouveau suivi</h3>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[160px]">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Projet</label>
                    <select value={newProjet} onChange={(e) => setNewProjet(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 text-slate-700">
                      <option value="">Sélectionner un projet</option>
                      {loadingData && <option disabled>Chargement...</option>}
                      {projects.map(p => <option key={p._id} value={p.titre}>{p.titre}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Tâche</label>
                    <select value={newTache} onChange={(e) => setNewTache(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 text-slate-700">
                      <option value="">Sélectionner une tâche</option>
                      {filteredTasks.map(t => <option key={t._id} value={t.titre}>{t.titre}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Membre</label>
                    <select value={newMembre} onChange={(e) => setNewMembre(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400 text-slate-700">
                      <option value="">Sélectionner un membre</option>
                      {teamMembers.map(m => <option key={m.id || m.email} value={m.id}>{m.prenom} {m.nom}</option>)}
                    </select>
                  </div>
                  <button onClick={handleStartChrono} disabled={!newMembre || !newTache || !newProjet}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:opacity-90 disabled:opacity-50 transition">
                    <Play size={15} /> Démarrer
                  </button>
                </div>
                {(() => {
                  const selMembre = teamMembers.find(m => m.id === newMembre);
                  return selMembre && activeChronos.some(e => e.membre.email === selMembre.email) && newMembre ? (
                    <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-indigo-50 text-indigo-700 text-xs">
                      <AlertCircle size={14} className="shrink-0" />
                      Le chrono existant pour ce membre sera automatiquement arrêté.
                    </div>
                  ) : null;
                })()}
              </div>
            </>
          )}

          {/* ===== TEMPS ENREGISTRÉS ===== */}
          {activeTab === "Temps enregistrés" && (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-100">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={regSearch} onChange={(e) => { setRegSearch(e.target.value); setRegPage(1); }}
                    placeholder="Rechercher une tâche..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                </div>
                <select value={regMembre} onChange={(e) => { setRegMembre(e.target.value); setRegPage(1); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none text-slate-600">
                  <option value="">Tous les membres</option>
                  {teamMembers.map(m => <option key={m.email} value={m.email}>{m.prenom} {m.nom}</option>)}
                </select>
                <select value={regProjet} onChange={(e) => { setRegProjet(e.target.value); setRegPage(1); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none text-slate-600">
                  <option value="">Tous les projets</option>
                  {projects.map(p => <option key={p._id} value={p.titre}>{p.titre}</option>)}
                </select>
                <select value={regPeriod} onChange={(e) => { setRegPeriod(e.target.value); setRegPage(1); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none text-slate-600">
                  <option value="">Toutes les périodes</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">7 derniers jours</option>
                  <option value="month">30 derniers jours</option>
                </select>
                <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                  <Filter size={14} /> Filtres
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Tâche</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Projet</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Membre</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Date &amp; Heure</th>
                      <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Durée</th>
                      <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {regPaginated.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-900">{entry.tache}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">{entry.projet}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-[9px] font-bold">
                              {getInitials(entry.membre.prenom, entry.membre.nom)}
                            </div>
                            <span className="text-xs text-slate-700">{entry.membre.prenom} {entry.membre.nom}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString("fr-FR")}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {entry.startTime ? new Date(entry.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "?"}
                            {" → "}
                            {entry.endTime ? new Date(entry.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "..."}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-mono text-xs font-bold text-slate-700">{formatDuration(entry.dureeMinutes)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button onClick={() => handleDeleteChrono(entry.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition" title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredReg.length > regPerPage && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    {(regPage - 1) * regPerPage + 1}&ndash;{Math.min(regPage * regPerPage, filteredReg.length)} sur {filteredReg.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setRegPage(p => Math.max(1, p - 1))} disabled={regPage <= 1}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition">
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: regTotalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setRegPage(p)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${p === regPage ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{p}</button>
                    ))}
                    <button onClick={() => setRegPage(p => Math.min(regTotalPages, p + 1))} disabled={regPage >= regTotalPages}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== PAR PROJET ===== */}
          {activeTab === "Par projet" && (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Temps par projet</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Projet</th>
                      <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Temps total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tempsParProjet.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.couleur }} />
                            <span className="text-sm font-medium text-slate-800">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono text-sm font-bold text-slate-800">{p.heures}h</span>
                          <span className="text-xs text-slate-400 ml-1">({p.pct}%)</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== RAPPORTS ===== */}
          {activeTab === "Rapports" && (
            <div ref={rapportsRef} className="space-y-6">

              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Performance &amp; Productivité</h2>
                  <p className="mt-1 text-sm text-slate-500">Analysez les performances de votre équipe et récompensez les meilleurs collaborateurs.</p>
                </div>
                <div className="flex items-center gap-3">
                  <select value={rapportPeriod} onChange={(e) => setRapportPeriod(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none text-slate-600">
                    <option>Cette semaine</option>
                    <option>Ce mois</option>
                    <option>Cette année</option>
                  </select>
                  <button onClick={handleExportPDF} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                    <Download size={15} /> Exporter
                  </button>
                  <button onClick={handleGenerateAiAnalysis}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:opacity-90 transition">
                    <BarChart3 size={15} /> Rapport IA
                  </button>
                </div>
              </div>

              {/* Row 1: 6 KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {(() => {
                  const scoreEq = teamMembers.length > 0
                    ? Math.round(teamMembers.reduce((s, m) => {
                        const mt = memberTaskStats.find(mt => mt.email === m.email);
                        return s + (mt && mt.taskCount > 0 ? Math.round(mt.done / mt.taskCount * 100) : 0);
                      }, 0) / teamMembers.length)
                    : 0;
                  const heuresStr = `${totalHours}h`;
                  const collabCount = Math.max(teamMembers.length * 2, 1);
                  return [
                    { icon: TrendingUp, value: `${scoreEq}/100`, label: "Score moyen équipe", evol: "", up: true, color: "text-violet-600", bg: "bg-violet-50" },
                    { icon: CheckCircle, value: `${completedTasksCount}`, label: "Tâches terminées", evol: `${totalTasksCount} total`, up: true, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { icon: Clock, value: heuresStr, label: "Heures travaillées", evol: `${teamMembers.length} membres`, up: true, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { icon: TrendingUp, value: `${productivitePct}%`, label: "Productivité moyenne", evol: "des tâches", up: true, color: "text-amber-600", bg: "bg-amber-50" },
                    { icon: Users, value: `${collabCount}`, label: "Collaborations", evol: `${teamMembers.length} membres`, up: true, color: "text-rose-600", bg: "bg-rose-50" },
                    { icon: FileText, value: `${uniqueProjets}`, label: "Projets actifs", evol: "ce mois", up: true, color: "text-sky-600", bg: "bg-sky-50" },
                  ];
                })().map(({ icon: Icon, value, label, evol, up, color, bg }) => (
                  <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className={`rounded-xl ${bg} p-2 ${color} w-fit mb-3`}><Icon size={16} /></div>
                    <p className="text-xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                    <p className={`mt-1 text-[10px] font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>{evol} {up ? "↑" : "↓"}</p>
                  </div>
                ))}
              </div>

              {/* Row 2: 3 big cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Card 1: Employee of the month */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp size={16} className="text-amber-500" /> Employé du mois
                    </h3>
                    <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Productivity Master</span>
                  </div>
                  {memberStats.length > 0 && (() => {
                    const top = memberStats[0];
                    return (
                      <>
                        <div className="flex items-center gap-4 mb-5">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 text-lg font-bold shadow-sm">
                            {top.prenom[0]}{top.nom[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900">{top.prenom} {top.nom}</p>
                            <p className="text-xs text-slate-500">{top.role}</p>
                            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-amber-600">★★★★★</span>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-violet-600">{Math.min(100, Math.round(top.totalMinutes / 10))}</p>
                            <p className="text-[10px] text-slate-400">/100</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-5">
                          {(() => {
                            const mt = memberTaskStats.find(m => m.email === top.email);
                            const tDone = mt?.done ?? 0;
                            const tTotal = mt?.taskCount ?? 0;
                            const prodPct = tTotal > 0 ? Math.round(tDone / tTotal * 100) : 0;
                            const heuresStr = formatDuration(top.totalMinutes);
                            return [
                              { l: "Tâches terminées", v: `${tDone}`, c: "text-emerald-600", b: "bg-emerald-50" },
                              { l: "Heures travaillées", v: heuresStr, c: "text-indigo-600", b: "bg-indigo-50" },
                              { l: "Productivité", v: `${prodPct}%`, c: "text-violet-600", b: "bg-violet-50" },
                              { l: "Tâches totales", v: `${tTotal}`, c: "text-amber-600", b: "bg-amber-50" },
                              { l: "Tâches bloquées", v: `${mt?.blocked ?? 0}`, c: "text-rose-600", b: "bg-rose-50" },
                              { l: "Rôle", v: top.role, c: "text-sky-600", b: "bg-sky-50" },
                            ];
                          })().map((s: any) => (
                            <div key={s.l} className={`rounded-xl ${s.b} px-3 py-2`}>
                              <p className={`text-sm font-bold ${s.c}`}>{s.v}</p>
                              <p className="text-[10px] text-slate-500">{s.l}</p>
                            </div>
                          ))}
                        </div>
                        <button className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                          Voir le profil complet
                        </button>
                      </>
                    );
                  })()}
                </div>

                {/* Card 2: Top Performers */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-5">
                    <TrendingUp size={16} className="text-amber-500" /> Top Performers
                  </h3>
                  <div className="space-y-3">
                    {memberStats.slice(0, 5).map((m, i) => {
                      const medals = ["🥇", "🥈", "🥉"];
                      const rankColors = ["text-amber-500", "text-slate-400", "text-orange-600", "", ""];
                      return (
                        <div key={m.id} className="flex items-center gap-3 rounded-xl bg-slate-50/60 px-4 py-2.5">
                          {i < 3 ? (
                            <span className="text-lg">{medals[i]}</span>
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{i + 1}</span>
                          )}
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-xs font-bold text-violet-600">
                            {getInitials(m.prenom, m.nom)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${i < 3 ? rankColors[i] : "text-slate-700"}`}>{m.prenom} {m.nom}</p>
                            <p className="text-[10px] text-slate-400">{m.role}</p>
                          </div>
                          <span className="text-sm font-bold text-violet-600">{Math.min(100, Math.round(m.totalMinutes / 10))} pts</span>
                        </div>
                      );
                    })}
                  </div>
                  <button className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                    Voir tout le classement
                  </button>
                </div>

                {/* Card 3: AI Analysis */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900">Pourquoi {memberStats[0]?.prenom || "—"} ?</h3>
                    <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-600">Analyse IA</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Basé sur les données du {rapportPeriod.toLowerCase()}</p>
                  <div className="space-y-2.5 mb-5">
                    {[
                      "Plus grand nombre de tâches terminées",
                      "Aucun retard",
                      "Temps moyen réduit",
                      "Collaboration élevée",
                      "Qualité excellente",
                      "Satisfaction client : 98%",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <CheckCircle size={12} />
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 p-4">
                    <p className="text-xs text-violet-700 leading-relaxed">
                      <span className="font-bold text-violet-900">⭐</span> {memberStats[0]?.prenom || "Cet employé"} est un atout majeur pour l'équipe. Continuez ainsi !
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 3: 3 cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Evolution chart */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-5">Évolution de la performance</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rapportPerformanceEvolution.length > 0 ? rapportPerformanceEvolution : [{ month: "Jan", val: 0 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                        <Line type="monotone" dataKey="val" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4, fill: "#7C3AED" }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Rewards history */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-5">Historique des récompenses</h3>
                  <div className="space-y-3">
                    {[
                      { period: "Juin 2026", rank: "🥇", label: "Premier" },
                      { period: "Mai 2026", rank: "🥇", label: "Premier" },
                      { period: "Avril 2026", rank: "🥇", label: "Premier" },
                      { period: "Mars 2026", rank: "🥈", label: "Deuxième" },
                      { period: "Février 2026", rank: "🥉", label: "Troisième" },
                      { period: "Janvier 2026", rank: "⭐", label: "Top 5" },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50/60 px-4 py-3">
                        <span className="text-lg">{r.rank}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                          <p className="text-[11px] text-slate-400">{r.period}</p>
                        </div>
                        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-semibold text-violet-600">Mensuel</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance detail */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-5">Performance complète</h3>
                  <div className="space-y-4">
                  {(() => {
                    const totalT = totalTasksCount || 1;
                    const doneT = completedTasksCount;
                    const inProgressT = tasks.filter(tEnCours).length;
                    const blockedT = tasks.filter(tBloquee).length;
                    const aFaireT = tasks.filter(tAFaire).length;
                    return [
                      { label: "Productivité globale", pct: Math.round(doneT / totalT * 100), color: "bg-violet-500" },
                      { label: "En cours", pct: Math.round(inProgressT / totalT * 100), color: "bg-indigo-500" },
                      { label: "Terminées", pct: Math.round(doneT / totalT * 100), color: "bg-emerald-500" },
                      { label: "Bloquées", pct: Math.round(blockedT / totalT * 100), color: "bg-amber-500" },
                      { label: "À faire", pct: Math.round(aFaireT / totalT * 100), color: "bg-rose-500" },
                      { label: "Total tâches", pct: 100, color: "bg-sky-500" },
                    ];
                  })().map((bar, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-600">{bar.label}</span>
                          <span className="text-xs font-bold text-slate-700">{bar.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full ${bar.color} transition-all`} style={{ width: `${bar.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Badges section */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-5">Badges obtenus</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[
                    { icon: "🏆", name: "Productivity Master", desc: "Atteindre 95% de productivité sur 3 mois" },
                    { icon: "⚡", name: "Speed Runner", desc: "Terminer 10 tâches avant la deadline" },
                    { icon: "🎯", name: "Accuracy Expert", desc: "0 erreur sur 50 tâches consécutives" },
                    { icon: "🤝", name: "Team Player", desc: "Participer à 20 collaborations" },
                    { icon: "🔥", name: "Hard Worker", desc: "150 heures travaillées en un mois" },
                    { icon: "🚀", name: "Fast Delivery", desc: "Livrer 5 projets en avance" },
                    { icon: "💬", name: "Communication Expert", desc: "100 commentaires utiles" },
                    { icon: "🧩", name: "Problem Solver", desc: "Résoudre 15 incidents critiques" },
                  ].map((badge, i) => (
                    <div key={i} className="group relative rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center hover:border-violet-200 hover:shadow-md hover:bg-white transition-all cursor-default">
                      <span className="text-3xl block mb-2">{badge.icon}</span>
                      <p className="text-xs font-semibold text-slate-700">{badge.name}</p>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="rounded-lg bg-slate-900 px-3 py-2 text-[10px] text-white whitespace-nowrap shadow-lg">
                          {badge.desc}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ===== RIGHT SIDEBAR ===== */}
        <div className="w-full lg:w-80 shrink-0 space-y-5">

          {/* Card 1: Résumé du temps */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Résumé du temps</h3>
              <span className="text-xs font-bold text-slate-700">{totalHours}h {totalMins}m</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tempsParProjet} cx="50%" cy="50%" innerRadius={26} outerRadius={40} dataKey="pct" paddingAngle={2}>
                      {tempsParProjet.map((p, i) => (
                        <Cell key={i} fill={p.couleur} strokeWidth={0} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {tempsParProjet.map(p => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.couleur }} />
                    <span className="text-[11px] text-slate-600 flex-1 truncate">{p.name}</span>
                    <span className="text-[11px] font-semibold text-slate-700">{p.heures}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Top membres */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Top membres cette semaine</h3>
            <div className="space-y-3">
              {memberStats.slice(0, 5).map((m, i) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 ${i < 3 ? "text-violet-600" : "text-slate-400"}`}>#{i + 1}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-[10px] font-bold">
                    {getInitials(m.prenom, m.nom)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{m.prenom} {m.nom}</p>
                    <p className="text-[10px] text-slate-400">{m.role}</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700">{formatDuration(m.totalMinutes)}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
              Voir tous les membres →
            </button>
          </div>

          {/* Card 3: Activité récente */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Activité récente</h3>
            <div className="space-y-3">
              {ACTIVITES.map(act => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-[9px] font-bold">
                    {getInitials(act.user.split(" ")[0], act.user.split(" ")[1] || "")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-700">
                      <span className="font-semibold text-slate-800">{act.user}</span> {act.action}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
              Voir toute l'activité
            </button>
          </div>

        </div>
      </div>

      {/* ===== MODAL ANALYSE IA ===== */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAiModal(false)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-violet-600" /> Analyse IA
              </h2>
              <button onClick={() => setShowAiModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              {aiAnalysis ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-violet-50 p-4">
                      <p className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider mb-1">Top performer</p>
                      <p className="text-lg font-bold text-slate-900">{aiAnalysis.topPerformer}</p>
                      <p className="text-xs text-slate-500">{aiAnalysis.score}/100 pts</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-1">Taux d'achèvement prévu</p>
                      <p className="text-lg font-bold text-slate-900">{aiAnalysis.completion}%</p>
                      <p className="text-xs text-slate-500">Prochains projets</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><CheckCircle size={14} className="text-violet-500" /> Résumé</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{aiAnalysis.summary}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 mb-3">🏆 Membres les plus performants</p>
                    <div className="space-y-2">
                      {aiAnalysis.topMembers.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50/60 px-4 py-2.5">
                          <span className={`text-xs font-bold w-6 ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-500" : "text-slate-400"}`}>
                            {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                          </span>
                          <span className="text-sm font-medium text-slate-700 flex-1">{m.name}</span>
                          {m.badge && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{m.badge}</span>}
                          <span className="text-sm font-bold text-violet-600">{m.score} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                      <p className="text-xs font-semibold text-red-700 mb-2">⚠ Membres en difficulté</p>
                      <ul className="space-y-1">
                        {aiAnalysis.struggling.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-400" />{s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                      <p className="text-xs font-semibold text-orange-700 mb-2">⚠ Risques de retard</p>
                      <ul className="space-y-1">
                        {aiAnalysis.risks.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-orange-400" />{s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                      <p className="text-xs font-semibold text-indigo-700 mb-2">🔒 Tâches bloquées</p>
                      <ul className="space-y-1">
                        {aiAnalysis.blocked.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-indigo-400" />{s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                      <p className="text-xs font-semibold text-violet-700 mb-2">📈 Prédiction</p>
                      <p className="text-xs text-slate-600">{aiAnalysis.prediction}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                    <p className="text-xs font-semibold text-slate-700 mb-2">💡 Recommandations</p>
                    <ul className="space-y-1.5">
                      {aiAnalysis.recommendations.map((r, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                          <span className="text-violet-500 mt-0.5">→</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3">
                    <span className="text-xs text-violet-700 font-medium">Confiance IA</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 rounded-full bg-violet-200 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-600" style={{ width: "94%" }} />
                      </div>
                      <span className="text-xs font-bold text-violet-700">94%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <Loader2 size={40} className="mx-auto mb-4 text-violet-500 animate-spin" />
                  <p className="text-sm text-slate-500">Génération de l'analyse en cours...</p>
                  <p className="text-xs text-slate-400 mt-1">Analyse des performances de l'équipe</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL NOUVEAU SUIVI ===== */}
      {showNewTimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Nouveau suivi</h2>
              <button onClick={() => setShowNewTimer(false)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Projet *</label>
                <select value={newProjet} onChange={(e) => setNewProjet(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white text-slate-700">
                  <option value="">Sélectionner un projet</option>
                  {loadingData && <option disabled>Chargement...</option>}
                  {projects.map(p => <option key={p._id} value={p.titre}>{p.titre}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Tâche *</label>
                <select value={newTache} onChange={(e) => setNewTache(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white text-slate-700">
                  <option value="">Sélectionner une tâche</option>
                  {filteredTasks.map(t => <option key={t._id} value={t.titre}>{t.titre}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Membre *</label>
                <select value={newMembre} onChange={(e) => setNewMembre(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white text-slate-700">
                  <option value="">Sélectionner un membre</option>
                  {teamMembers.map(m => <option key={m.id || m.email} value={m.id}>{m.prenom} {m.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Description (optionnelle)</label>
                <textarea rows={2} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description du travail..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 resize-none" />
              </div>
              {(() => {
                const selMembre = teamMembers.find(m => m.id === newMembre);
                return selMembre && activeChronos.some(e => e.membre.email === selMembre.email) && newMembre ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 text-indigo-700 text-xs">
                    <AlertCircle size={14} className="shrink-0" />
                    Le chrono existant pour ce membre sera automatiquement arrêté.
                  </div>
                ) : null;
              })()}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNewTimer(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                <button onClick={handleStartChrono} disabled={!newMembre || !newTache || !newProjet}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:opacity-90 disabled:opacity-50 transition">
                  <Play size={14} /> Démarrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
