"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Plus, Pencil, Trash2, X, User, Users, Search, Filter, ArrowUpDown, AlertCircle,
  Upload, Download, UserPlus, Mail, Bell, UserCheck, Clock, Briefcase,
  Shield, UserCog, BarChart3, FolderKanban, LayoutList, LayoutGrid,
  ChevronDown, ChevronRight, MoreHorizontal, Eye, Star, Calendar,
  Activity, UserCircle2, Hash, MessageSquare, FileText,
  CheckCircle, XCircle, Building2, RefreshCw, HelpCircle, Send, Ban,
  ChevronLeft, ChevronRight as ChevronRightIcon, FileSpreadsheet,
  Copy, Archive, Lock, Sparkles, AlertTriangle,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import Recaptcha from "@/components/Recaptcha";
import { useSession } from "next-auth/react";
import { addToCorbeille } from "@/lib/corbeille";

// --- Types ---
interface TeamMember {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  equipe: string;
  telephone: string;
  photo: string;
  statut: string;
  projets: number;
  dateEmbauche: string;
  derniereActivite: string;
  favori?: boolean;
  addedBy?: string;
  addedByEmail?: string;
}

interface Invitation {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  equipe: string;
  invitePar: string;
  inviteParEmail?: string;
  dateEnvoi: string;
  statut: "En attente" | "Acceptée" | "Expirée" | "Annulée";
  expiration: string;
}

interface ActivityItem {
  id: string;
  type: "new_member" | "active" | "invitation" | "role_created";
  user: string;
  action: string;
  time: string;
}

// --- Mock Data ---

// --- Équipes ---
interface EquipeItem {
  id: string;
  nom: string;
  description: string;
  responsable: { prenom: string; nom: string; fonction: string };
  membres: { prenom: string; nom: string; email: string; photo?: string }[];
  projetsCount: number;
  chargeTravail: number;
  statut: "Actif" | "En pause";
  dateCreation: string;
  couleur: string;
  creePar?: string;
  creeParEmail?: string;
}

interface ActivityEntry {
  id: string;
  type: string;
  message: string;
  userNom: string;
  userEmail: string;
  userRole: string;
  project: string;
  priority: "haute" | "moyenne" | "basse";
  date: string;
}

const MOCK_EQUIPES: EquipeItem[] = [
  { id: "e1", nom: "Développement", description: "Développement front-end, back-end et infrastructure.", responsable: { prenom: "John", nom: "Doe", fonction: "Lead Développeur" }, membres: [ { prenom: "Mohamed", nom: "Salah", email: "m.salah@esprit.tn" }, { prenom: "Hassan", nom: "Tazi", email: "hassan.tazi@esprit.tn" }, { prenom: "Ahmed", nom: "Bennani", email: "ahmed.bennani@esprit.tn" }, { prenom: "Sara", nom: "El Fassi", email: "sara.elfassi@esprit.tn" } ], projetsCount: 12, chargeTravail: 78, statut: "Actif", dateCreation: "2023-01-10", couleur: "emerald" },
  { id: "e2", nom: "Design", description: "Design UX/UI, maquettes et prototypes interactifs.", responsable: { prenom: "Jane", nom: "Smith", fonction: "UX Designer" }, membres: [ { prenom: "Sara", nom: "Benali", email: "sara.benali@esprit.tn" }, { prenom: "Leila", nom: "Khalid", email: "leila.khalid@esprit.tn" }, { prenom: "Nadia", nom: "Mouline", email: "nadia.mouline@esprit.tn" } ], projetsCount: 8, chargeTravail: 65, statut: "Actif", dateCreation: "2023-01-10", couleur: "violet" },
  { id: "e3", nom: "Gestion de projet", description: "Planification, suivi et coordination des projets.", responsable: { prenom: "Omayma", nom: "Hoimdi", fonction: "Chef de projet" }, membres: [ { prenom: "Nadia", nom: "Mouline", email: "nadia.mouline@esprit.tn" } ], projetsCount: 15, chargeTravail: 92, statut: "Actif", dateCreation: "2023-06-01", couleur: "indigo" },
  { id: "e4", nom: "Qualité", description: "Tests, assurance qualité et rapports de bugs.", responsable: { prenom: "Karim", nom: "Aouadi", fonction: "Lead Testeur" }, membres: [ { prenom: "Omar", nom: "Rami", email: "omar.rami@esprit.tn" }, { prenom: "Rachid", nom: "Cherkaoui", email: "rachid.cherkaoui@esprit.tn" } ], projetsCount: 6, chargeTravail: 45, statut: "En pause", dateCreation: "2024-02-20", couleur: "amber" },
  { id: "e5", nom: "Marketing", description: "Stratégie marketing, campagnes et réseaux sociaux.", responsable: { prenom: "Leila", nom: "Mansouri", fonction: "Marketing Manager" }, membres: [ { prenom: "Fatima", nom: "Idrissi", email: "fatima.idrissi@esprit.tn" } ], projetsCount: 4, chargeTravail: 30, statut: "Actif", dateCreation: "2025-01-15", couleur: "rose" },
  { id: "e6", nom: "Administration", description: "Gestion administrative, RH et finances.", responsable: { prenom: "Youssef", nom: "El Amrani", fonction: "Admin Système" }, membres: [ { prenom: "Fatima", nom: "Idrissi", email: "fatima.idrissi@esprit.tn" } ], projetsCount: 2, chargeTravail: 55, statut: "Actif", dateCreation: "2023-01-10", couleur: "sky" },
];

const EQUIPE_COLORS: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-600",
  violet: "bg-violet-100 text-violet-600",
  indigo: "bg-indigo-100 text-indigo-600",
  amber: "bg-amber-100 text-amber-600",
  rose: "bg-rose-100 text-rose-600",
  sky: "bg-sky-100 text-sky-600",
};

const ROLES = ["Administrateur", "Chef de projet", "Développeur", "Designer", "Testeur", "Client"];
const EQUIPES = ["Développement", "Design", "Gestion de projet", "Qualité", "Marketing", "Administration"];
const STATUTS_LIST = ["Actif", "Invité", "En pause", "Inactif"];

const ROLE_COLORS: Record<string, string> = {
  "Administrateur": "bg-rose-100 text-rose-700 border-rose-200",
  "Chef de projet": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Développeur": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Designer": "bg-violet-100 text-violet-700 border-violet-200",
  "Testeur": "bg-amber-100 text-amber-700 border-amber-200",
  "Client": "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUT_BADGES: Record<string, string> = {
  "Actif": "bg-emerald-100 text-emerald-700",
  "En pause": "bg-orange-100 text-orange-700",
  "Invité": "bg-slate-100 text-slate-600",
  "Inactif": "bg-red-100 text-red-700",
};

const STATUT_DOTS: Record<string, string> = {
  "Actif": "bg-emerald-500",
  "En pause": "bg-orange-500",
  "Invité": "bg-slate-400",
  "Inactif": "bg-red-500",
};

const DONUT_COLORS = ["#10b981", "#8b5cf6", "#6366f1", "#f59e0b", "#94a3b8"];

const TABS = ["Membres", "Invitations", "Rôles & Permissions", "Équipes", "Rapports", "Activité"];

// --- Roles & Permissions ---
interface RoleItem {
  id: string;
  nom: string;
  description: string;
  type: "Système" | "Personnalisé";
  dateCreation: string;
  creePar: string;
  creeParEmail?: string;
  membreCount: number;
  projetsCount: number;
  derniereModification: string;
  membres: { prenom: string; nom: string; email: string }[];
}

interface PermissionMatrix {
  [roleId: string]: {
    [itemId: string]: {
      voir: boolean; creer: boolean; modifier: boolean; supprimer: boolean; gerer: boolean;
    };
  };
}

interface PermCategory {
  name: string;
  icon: string;
  items: { id: string; label: string }[];
}

const PERMISSION_CATEGORIES: PermCategory[] = [
  {
    name: "Projets", icon: "FolderKanban",
    items: [
      { id: "projets_voir", label: "Voir les projets" },
      { id: "projets_creer", label: "Créer des projets" },
      { id: "projets_modifier", label: "Modifier les projets" },
      { id: "projets_supprimer", label: "Supprimer les projets" },
      { id: "projets_gerer", label: "Gérer les membres des projets" },
    ],
  },
  {
    name: "Tâches", icon: "ListTodo",
    items: [
      { id: "taches_voir", label: "Voir les tâches" },
      { id: "taches_creer", label: "Créer des tâches" },
      { id: "taches_modifier", label: "Modifier les tâches" },
      { id: "taches_supprimer", label: "Supprimer les tâches" },
      { id: "taches_assigner", label: "Assigner des tâches" },
    ],
  },
  {
    name: "Clients", icon: "Users",
    items: [
      { id: "clients_voir", label: "Voir les clients" },
      { id: "clients_creer", label: "Créer des clients" },
      { id: "clients_modifier", label: "Modifier les clients" },
      { id: "clients_supprimer", label: "Supprimer les clients" },
    ],
  },
  {
    name: "Documents", icon: "FileText",
    items: [
      { id: "docs_voir", label: "Voir les documents" },
      { id: "docs_ajouter", label: "Ajouter des documents" },
      { id: "docs_telecharger", label: "Télécharger" },
      { id: "docs_supprimer", label: "Supprimer" },
    ],
  },
  {
    name: "Facturation", icon: "BarChart3",
    items: [
      { id: "factures_voir", label: "Voir les factures" },
      { id: "factures_creer", label: "Créer des factures" },
      { id: "factures_paiements", label: "Gérer les paiements" },
    ],
  },
  {
    name: "Messages", icon: "MessageSquare",
    items: [
      { id: "messages_envoyer", label: "Envoyer des messages" },
      { id: "messages_supprimer", label: "Supprimer des messages" },
    ],
  },
  {
    name: "Équipe", icon: "Shield",
    items: [
      { id: "equipe_voir", label: "Voir l'équipe" },
      { id: "equipe_gerer", label: "Gérer les membres" },
      { id: "equipe_roles", label: "Gérer les rôles" },
    ],
  },
];





const ROLE_ICONS: Record<string, string> = {
  Administrateur: "text-purple-600",
  "Chef de projet": "text-emerald-600",
  Développeur: "text-orange-600",
  Designer: "text-pink-600",
  Testeur: "text-blue-600",
  Client: "text-amber-600",
};

const ROLE_BG: Record<string, string> = {
  Administrateur: "bg-rose-50",
  "Chef de projet": "bg-indigo-50",
  Développeur: "bg-emerald-50",
  Designer: "bg-violet-50",
  Testeur: "bg-amber-50",
  Client: "bg-slate-50",
};

function formatActivity(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return `Aujourd'hui ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  if (days === 1) return `Hier ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  return `${d.toLocaleDateString("fr-FR")}`;
}

function getInitials(p: string, n: string) { return ((p?.[0] ?? "") + (n?.[0] ?? "")).toUpperCase() || "?"; }

function formatDiscussionShortDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Il y a " + sec + " s";
  const min = Math.floor(sec / 60);
  if (min < 60) return "Il y a " + min + " min";
  const h = Math.floor(min / 60);
  if (h < 24) return "Il y a " + h + " h";
  const d = Math.floor(h / 24);
  if (d === 1) return "Hier";
  if (d < 7) return "Il y a " + d + " jours";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(dateStr));
}

export default function TeamPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Tab state
  const [activeTab, setActiveTab] = useState("Rôles & Permissions");

  // Members state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  useEffect(() => {
    setMembersLoading(true);
    fetch("/api/team")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          const mapped: TeamMember[] = data.map((t: any) => ({
            _id: t._id,
            nom: t.nom || "",
            prenom: t.prenom || "",
            email: t.email || "",
            role: t.role || "",
            equipe: t.equipe || "",
            telephone: t.telephone || "",
            photo: t.photo || t.avatar || "",
            statut: t.statut || "Actif",
            projets: t.projets || 0,
            dateEmbauche: t.dateEmbauche || t.createdAt || "",
            derniereActivite: t.derniereActivite || t.updatedAt || t.createdAt || "",
            favori: t.favori || false,
          }));
          setMembers(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setMembersLoading(false));
  }, []);

  // Filter states
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterEquipe, setFilterEquipe] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Member modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [memberMenu, setMemberMenu] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    prenom: "", nom: "", email: "", role: "Développeur", equipe: "Développement", telephone: "", statut: "Actif", dateEmbauche: "", derniereActivite: new Date().toISOString(),
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validateMember = (data: typeof memberForm): Record<string, string> => {
    const errors: Record<string, string> = {};
    const nameRegex = /^[A-Za-zÀ-ÿ\s]{2,30}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    if (!data.prenom.trim()) errors.prenom = "Prénom obligatoire";
    else if (!nameRegex.test(data.prenom.trim())) errors.prenom = "Le prénom doit contenir uniquement des lettres (2 à 30 caractères).";
    if (!data.nom.trim()) errors.nom = "Nom obligatoire";
    else if (!nameRegex.test(data.nom.trim())) errors.nom = "Le nom doit contenir uniquement des lettres (2 à 30 caractères).";
    if (!data.email.trim()) errors.email = "Email obligatoire";
    else if (!emailRegex.test(data.email.trim())) errors.email = "Veuillez saisir une adresse email valide.";
    else if (members.some(m => m.email.toLowerCase() === data.email.trim().toLowerCase() && m._id !== editing?._id)) errors.email = "Cet email est déjà utilisé.";
    if (!data.telephone.trim()) errors.telephone = "Téléphone obligatoire";
    else if (!phoneRegex.test(data.telephone.trim())) errors.telephone = "Veuillez saisir un numéro valide (8 chiffres ou format international).";
    else if (members.some(m => m.telephone === data.telephone.trim() && m._id !== editing?._id)) errors.telephone = "Ce numéro est déjà utilisé.";
    if (!data.dateEmbauche) errors.dateEmbauche = "Date d'embauche obligatoire";
    else if (new Date(data.dateEmbauche) > new Date()) errors.dateEmbauche = "La date d'embauche ne peut pas être dans le futur.";
    if (data.role === "Administrateur") {
      const adminCount = members.filter(m => m.role === "Administrateur" && m._id !== editing?._id).length;
      if (adminCount >= 3) errors.role = "Maximum 3 administrateurs autorisés.";
    }
    return errors;
  };

  // AI Report state
  const [generatedReport, setGeneratedReport] = useState<{
    summary: string; strengths: string[]; risks: string[]; recommendations: string[];
    productivite: number; tachesTerminees: number; tachesRetard: number; topMember: string;
    overloaded: string[]; riskyProjects: string[]; date: string;
  } | null>(null);
  const [generating, setGenerating] = useState(false);

  // Real data for Rapports
  const [reportTasks, setReportTasks] = useState<any[]>([]);
  const [reportProjects, setReportProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/tasks").then(r => r.json()).then(d => setReportTasks(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/projects").then(r => r.json()).then(d => setReportProjects(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  useEffect(() => {
    fetch("/api/activities?limit=10")
      .then(r => r.json())
      .then(data => {
        if (data?.activities) {
          setActivities(data.activities.map((a: any) => ({
            id: a._id,
            type: a.action === "created" ? "new_member" : a.action === "invited" ? "invitation" : "active",
            user: a.userName || "Système",
            action: a.description || a.action,
            time: a.createdAt || "",
          })));
        }
      })
      .catch(() => {});
  }, []);

  const taskTerminee = (t: any) => t.statut === "Terminée" || t.statut === "Terminé" || t.statut === "Terminee";
  const taskBloquee = (t: any) => t.statut === "Bloquée" || t.statut === "Bloqué" || t.statut === "Bloquee";
  const taskEnCours = (t: any) => t.statut === "En cours";
  const taskAFaire = (t: any) => t.statut === "À faire" || t.statut === "A faire";
  const projetTermine = (p: any) => p.statut === "Terminé" || p.statut === "Terminée" || p.statut === "Termine" || p.statut === "Terminee";
  const projetAnnule = (p: any) => p.statut === "Annulé" || p.statut === "Annule";

  const rapportKpi = useMemo(() => {
    const actif = members.filter(m => m.statut === "Actif").length;
    const totalTaches = reportTasks.length;
    const terminees = reportTasks.filter(taskTerminee).length;
    const projetsActifs = reportProjects.filter(p => !projetTermine(p) && !projetAnnule(p)).length;
    return [
      { label: "Membres actifs", value: String(actif), evolution: `${members.length} total`, up: true, icon: "Users", color: "text-violet-600", bg: "bg-violet-50" },
      { label: "Tâches terminées", value: String(terminees), evolution: `${totalTaches} total`, up: true, icon: "CheckCircle", color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "Projets en cours", value: String(projetsActifs), evolution: `${reportProjects.length} total`, up: true, icon: "FolderKanban", color: "text-indigo-600", bg: "bg-indigo-50" },
      { label: "Taux d'achèvement", value: totalTaches > 0 ? `${Math.round(terminees / totalTaches * 100)}%` : "0%", evolution: "des tâches", up: true, icon: "CheckCircle", color: "text-emerald-600", bg: "bg-emerald-50" },
    ];
  }, [members, reportTasks, reportProjects]);

  const rapportTasksByStatus = useMemo(() => {
    const total = reportTasks.length || 1;
    const done = reportTasks.filter(taskTerminee).length;
    const inProgress = reportTasks.filter(taskEnCours).length;
    const aFaire = reportTasks.filter(taskAFaire).length;
    const blocked = reportTasks.filter(taskBloquee).length;
    return [
      { name: "Terminées", value: done, couleur: "#10B981", pct: Math.round(done / total * 100) },
      { name: "En cours", value: inProgress, couleur: "#7C3AED", pct: Math.round(inProgress / total * 100) },
      { name: "À faire", value: aFaire, couleur: "#F59E0B", pct: Math.round(aFaire / total * 100) },
      { name: "Bloquées", value: blocked, couleur: "#EF4444", pct: Math.round(blocked / total * 100) },
    ];
  }, [reportTasks]);

  const rapportTeamProd = useMemo(() => {
    const teams = [...new Set(members.map(m => m.equipe).filter(Boolean))];
    const colors = ["#7C3AED", "#6366F1", "#10B981", "#F59E0B", "#F472B6", "#94A3B8"];
    return teams.map((name, i) => {
      const teamMembers = members.filter(m => m.equipe === name);
      const tasksForTeam = reportTasks.filter((t: any) => {
        const eid = t.employeId?._id || t.employeId;
        return eid && teamMembers.some(m => m._id === eid);
      });
      const done = tasksForTeam.filter(taskTerminee).length;
      const total = tasksForTeam.length || 1;
      return { name, value: Math.round(done / total * 100), couleur: colors[i % colors.length] };
    });
  }, [members, reportTasks]);

  const rapportPerformance = useMemo(() => {
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin"];
    const now = new Date();
    const currentMonth = now.getMonth();
    return months.slice(0, currentMonth + 1).map((month, idx) => {
      const monthTasks = reportTasks.filter((t: any) => {
        const d = new Date(t.createdAt || t.dateDebut || t.dateFin);
        return d.getMonth() === idx;
      });
      const done = monthTasks.filter(taskTerminee).length;
      const total = monthTasks.length || 1;
      return { month, productivite: Math.round(done / total * 100), taches: done };
    });
  }, [reportTasks]);

  const rapportProjects = useMemo(() => {
    return reportProjects.slice(0, 5).map((p: any) => {
      const pTasks = reportTasks.filter((t: any) => {
        const pid = t.projetId?._id || t.projetId;
        return pid === p._id;
      });
      const done = pTasks.filter(taskTerminee).length;
      const total = pTasks.length || 1;
      return {
        projet: p.titre || p.nom || "Projet",
        equipe: p.equipe || "—",
        progression: Math.round(done / total * 100),
        tachesTerminees: done,
        dateLimite: p.dateFin ? new Date(p.dateFin).toLocaleDateString("fr-FR") : "—",
      };
    });
  }, [reportProjects, reportTasks]);

  const rapportActivities = useMemo(() => {
    return members.slice(0, 6).map((m, i) => ({
      id: "ra" + i,
      user: `${m.prenom} ${m.nom}`,
      action: m.statut === "Actif" ? "est actif(ve) dans l'équipe" : "membre de l'équipe",
      time: m.derniereActivite ? `Dernière activité ${new Date(m.derniereActivite).toLocaleDateString("fr-FR")}` : "Activité récente",
      initials: (m.prenom[0] + m.nom[0]).toUpperCase(),
      icon: "UserCheck" as const,
      color: "text-emerald-500 bg-emerald-50",
    }));
  }, [members]);

  const filtered = useMemo(() => {
    let result = [...members];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.prenom.toLowerCase().includes(q) || m.nom.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      );
    }
    if (filterRole) result = result.filter(m => m.role === filterRole);
    if (filterEquipe) result = result.filter(m => m.equipe === filterEquipe);
    if (filterStatut) result = result.filter(m => m.statut === filterStatut);
    return result;
  }, [search, filterRole, filterEquipe, filterStatut, members]);

  // Role distribution for doughnut
  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach(m => { counts[m.role] = (counts[m.role] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [members]);

  // Recent members
  const recentMembers = useMemo(() =>
    [...members].sort((a, b) => new Date(b.dateEmbauche).getTime() - new Date(a.dateEmbauche).getTime()).slice(0, 4),
  [members]);

  // Computed member KPI
  const memberKpi = useMemo(() => ({
    total: members.length,
    actifs: members.filter(m => m.statut === "Actif").length,
    invites: members.filter(m => m.statut === "Invité").length,
    enPause: members.filter(m => m.statut === "En pause").length,
    roles: new Set(members.map(m => m.role)).size,
  }), [members]);

  const KPI_CARDS = useMemo(() => [
    { label: "Membres au total", value: memberKpi.total, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Membres actifs", value: memberKpi.actifs, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Invités", value: memberKpi.invites, icon: Mail, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "En pause", value: memberKpi.enPause, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Rôles différents", value: memberKpi.roles, icon: Shield, color: "text-rose-600", bg: "bg-rose-50" },
  ], [memberKpi]);

  // CRUD functions
  function openAdd() {
    setEditing(null);
    setMemberForm({ prenom: "", nom: "", email: "", role: "Développeur", equipe: "Développement", telephone: "", statut: "Actif", dateEmbauche: "", derniereActivite: new Date().toISOString() });
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(member: TeamMember) {
    setFormErrors({});
    setEditing(member);
    setMemberForm({
      prenom: member.prenom, nom: member.nom, email: member.email, role: member.role,
      equipe: member.equipe, telephone: member.telephone, statut: member.statut,
      dateEmbauche: member.dateEmbauche.split("T")[0], derniereActivite: member.derniereActivite,
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateMember(memberForm);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/team/${editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberForm),
        });
        if (res.ok) {
          const updated = await res.json();
          setMembers(prev => prev.map(m => m._id === editing._id ? { ...m, ...updated, photo: updated.photo || updated.avatar || "" } : m));
        } else {
          const errData = await res.json().catch(() => ({}));
          setFormErrors(errData.errors || { general: errData.message || "Erreur lors de la modification" });
          return;
        }
      } else {
        const res = await fetch("/api/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberForm),
        });
        if (res.ok) {
          const created = await res.json();
          const mapped: TeamMember = {
            _id: created._id,
            nom: created.nom || "",
            prenom: created.prenom || "",
            email: created.email || "",
            role: created.role || "",
            equipe: created.equipe || "",
            telephone: created.telephone || "",
            photo: created.photo || created.avatar || "",
            statut: created.statut || "Actif",
            projets: created.projets || 0,
            dateEmbauche: created.dateEmbauche || "",
            derniereActivite: created.derniereActivite || created.updatedAt || created.createdAt || "",
            favori: false,
          };
          setMembers(prev => [...prev, mapped]);
        } else {
          const errData = await res.json().catch(() => ({}));
          setFormErrors(errData.errors || { general: errData.message || "Erreur lors de l'ajout" });
          return;
        }
      }
      setShowModal(false);
      setFormErrors({});
    } catch {
      setFormErrors({ general: "Erreur réseau" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce membre ?")) return;
    const member = members.find(m => m._id === id);
    await fetch(`/api/team/${id}`, { method: "DELETE" });
    setMembers(prev => prev.filter(m => m._id !== id));
    setMemberMenu(null);
    if (member) {
      const userName = session?.user?.name || "Utilisateur inconnu";
      const userEmail = session?.user?.email || "—";
      const userAvatar = userName.split(" ").map((w: string) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
      await addToCorbeille({
        id: "corbeille-membre-" + Date.now(),
        type: "Membre",
        nom: member.prenom + " " + member.nom,
        supprimePar: { nom: userName, email: userEmail, fonction: session?.user?.role || "Utilisateur", avatar: userAvatar },
        supprimeLe: new Date().toISOString(),
        supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        sourceData: member,
      });
    }
  }

  function handleToggleFavorite(id: string) {
    setMembers(prev => prev.map(m => m._id === id ? { ...m, favori: !m.favori } : m));
    setMemberMenu(null);
  }

  // --- AI Report Generator ---
  function buildReportData() {
    const totalTaches = reportTasks.length;
    const tachesTerminees = reportTasks.filter(taskTerminee).length;
    const tachesRetard = reportTasks.filter(taskBloquee).length;
    const productivite = totalTaches > 0 ? Math.round(tachesTerminees / totalTaches * 100) : 0;
    const topMember = members.length > 0 ? members[0].prenom + " " + members[0].nom : "—";
    const overloaded: string[] = [];
    const riskyProjects: string[] = reportProjects.filter(p => !projetTermine(p) && !projetAnnule(p)).slice(0, 2).map((p: any) => p.titre || p.nom || "Projet");
    const membersCount = members.length;
    const actifCount = members.filter(m => m.statut === "Actif").length;
    return { productivite, tachesTerminees, totalTaches, tachesRetard, topMember, overloaded, riskyProjects, membersCount, actifCount };
  }

  function generateMockReport() {
    const d = buildReportData();
    const productiviteLabel = d.productivite >= 85 ? "excellente" : d.productivite >= 70 ? "bonne" : "modérée";
    const pct = d.totalTaches > 0 ? Math.round(d.tachesTerminees / d.totalTaches * 100) : 0;
    const summary = `**Rapport Équipe — ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}**\n\n` +
      `L'équipe compte **${d.actifCount} membres actifs** sur ${d.membersCount} au total. ` +
      `La productivité globale est de **${d.productivite}%** (${productiviteLabel}), avec **${d.tachesTerminees} tâches terminées** sur ${d.totalTaches} ` +
      `(${pct}% d'avancement). ` +
      `${d.tachesRetard} tâches sont en retard.`;

    const strengths = [
      `Productivité ${productiviteLabel} de ${d.productivite}% — au-dessus de la moyenne du secteur`,
      `${d.tachesTerminees} tâches accomplies ce mois-ci, soit ${pct}% du total`,
      `**${d.topMember}** est le membre le plus performant avec un taux d'achèvement de 96%`,
      `Forte collaboration inter-équipes et respect des délais sur les projets prioritaires`,
    ];

    const risks = [
      d.riskyProjects.length > 0 ? `⚠ **${d.riskyProjects.join("** et **")}** — progression inférieure à 50% avec échéance dans moins de 2 semaines` : null,
      d.overloaded.length > 0 ? `⚠ **${d.overloaded.join("** et **")}** — ${d.overloaded.length === 1 ? "a" : "ont"} plus de 10 tâches actives, risque d'épuisement` : null,
      `⚠ **${d.tachesRetard} tâches en retard** — impact potentiel sur le budget et la satisfaction client`,
    ].filter(Boolean) as string[];

    const recommendations = [
      d.overloaded.length > 0 ? `**Rééquilibrer la charge** : redistribuer les tâches de ${d.overloaded.join(" et ")} vers les membres disponibles` : null,
      d.riskyProjects.length > 0 ? `**Planifier un sprint dédié** au projet ${d.riskyProjects[0]} pour rattraper le retard accumulé` : null,
      d.riskyProjects.length > 1 ? `**Ajouter un membre** dans l'équipe ${d.riskyProjects[1]} pour accélérer la livraison` : null,
      `**Organiser une réunion hebdomadaire** de suivi des risques pour anticiper les dérives`,
      d.topMember !== "—" ? `**Féliciter et motiver** : mettre en avant ${d.topMember} comme exemple de performance` : null,
    ].filter(Boolean) as string[];

    return {
      summary, strengths, risks, recommendations,
      productivite: d.productivite, tachesTerminees: d.tachesTerminees, tachesRetard: d.tachesRetard,
      topMember: d.topMember, overloaded: d.overloaded, riskyProjects: d.riskyProjects,
      date: new Date().toISOString(),
    };
  }

  async function handleGenerateReport() {
    setGenerating(true);
    const d = buildReportData();

    try {
      const apiKey = typeof window !== "undefined"
        ? document.cookie.replace(/(?:(?:^|.*;\s*)openai_key\s*=\s*([^;]*).*$)|^.*$/, "$1") || process.env.NEXT_PUBLIC_OPENAI_KEY || ""
        : "";

      if (apiKey) {
        const prompt = `Tu es un expert en gestion de projet. Analyse ces données d'équipe et génère un rapport professionnel en français.

Données :
- Membres actifs : ${d.actifCount}/${d.membersCount}
- Productivité globale : ${d.productivite}%
- Tâches terminées : ${d.tachesTerminees}/${d.totalTaches}
- Tâches en retard : ${d.tachesRetard}
- Meilleur membre : ${d.topMember}
- Membres surchargés : ${d.overloaded.join(", ") || "Aucun"}
- Projets à risque : ${d.riskyProjects.join(", ") || "Aucun"}

Format de réponse attendu (JSON valide uniquement) :
{
  "summary": "résumé en 3-4 phrases",
  "strengths": ["point fort 1", "point fort 2", "point fort 3"],
  "risks": ["risque 1", "risque 2"],
  "recommendations": ["reco 1", "reco 2", "reco 3"]
}`;

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: "Tu es un expert en gestion de projet. Réponds uniquement en JSON." }, { role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const parsed = JSON.parse(json.choices[0].message.content);
          setGeneratedReport({ ...d, ...parsed, date: new Date().toISOString() });
          setGenerating(false);
          return;
        }
      }
    } catch {}

    const report = generateMockReport();
    await new Promise(r => setTimeout(r, 1500));
    setGeneratedReport(report);
    setGenerating(false);
  }

  // --- Invitation CRUD ---
  function openSendInvite() {
    setEditingInvite(null);
    setInvForm({ prenom: "", nom: "", email: "", role: "Développeur", equipe: "Développement", message: "" });
    setInvFormErrors({});
    setInvRecaptchaToken(null);
    setInvRecaptchaError(false);
    setShowInviteModal(true);
  }

  function openEditInvite(inv: Invitation) {
    setEditingInvite(inv);
    setInvForm({
      prenom: inv.prenom, nom: inv.nom, email: inv.email, role: inv.role, equipe: inv.equipe, message: "",
    });
    setInvFormErrors({});
    setShowInviteModal(true);
    setInvMenu(null);
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInvRecaptchaError(false);

    const errors = validateInvite(invForm);
    setInvFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!editingInvite && !invRecaptchaToken) {
      setInvRecaptchaError(true);
      return;
    }

    const now = new Date();
    const exp = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (editingInvite) {
      setInvitations(prev => prev.map(i =>
        i._id === editingInvite._id ? { ...i, ...invForm, invitePar: i.invitePar, dateEnvoi: i.dateEnvoi, statut: i.statut, expiration: i.expiration } : i
      ));
      setShowInviteModal(false);
    } else {
      setSendingInvite(true);
      try {
        const res = await fetch("/api/invitations/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prenom: invForm.prenom, nom: invForm.nom, email: invForm.email, role: invForm.role, equipe: invForm.equipe, message: invForm.message }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Erreur d'envoi");
        }
        const newInv: Invitation = {
          _id: "i" + Date.now(),
          prenom: invForm.prenom, nom: invForm.nom, email: invForm.email,
          role: invForm.role, equipe: invForm.equipe,
          invitePar: session?.user?.name || "Omayma Hoimdi",
          inviteParEmail: session?.user?.email || "",
          dateEnvoi: now.toISOString(),
          statut: "En attente",
          expiration: exp.toISOString(),
        };
        setInvitations(prev => [newInv, ...prev]);
        setInvRecaptchaToken(null);
        setInvRecaptchaError(false);
        setInvFormErrors({});
        setShowInviteModal(false);
      } catch (err: any) {
        setInviteError(err.message || "Erreur lors de l'envoi de l'invitation");
      } finally {
        setSendingInvite(false);
      }
    }
  }

  async function handleDeleteInvitation(id: string) {
    if (!confirm("Supprimer cette invitation ?")) return;
    try {
      const res = await fetch(`/api/invitations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erreur lors de la suppression");
      }
      setInvitations(prev => prev.filter(i => i._id !== id));
    } catch (err: any) {
      console.error("Delete invitation error:", err);
      setInviteError(err.message || "Erreur lors de la suppression");
    }
    setInvMenu(null);
  }

  async function handleResendInvitation(id: string) {
    const inv = invitations.find(i => i._id === id);
    if (!inv) return;
    setInviteError("");
    setSendingInvite(true);
    try {
      const res = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom: inv.prenom, nom: inv.nom, email: inv.email, role: inv.role, equipe: inv.equipe }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erreur d'envoi");
      }
      const now = new Date();
      setInvitations(prev => prev.map(i =>
        i._id === id ? {
          ...i,
          statut: "En attente" as const,
          dateEnvoi: now.toISOString(),
          expiration: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        } : i
      ));
    } catch (err: any) {
      setInviteError(err.message || "Erreur lors du renvoi de l'invitation");
    } finally {
      setSendingInvite(false);
      setInvMenu(null);
    }
  }

  async function handleCancelInvitation(id: string) {
    try {
      const res = await fetch(`/api/invitations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "Annulée" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erreur lors de l'annulation");
      }
      setInvitations(prev => prev.map(i =>
        i._id === id ? { ...i, statut: "Annulée" as const } : i
      ));
    } catch (err: any) {
      console.error("Cancel invitation error:", err);
      setInviteError(err.message || "Erreur lors de l'annulation");
    }
    setInvMenu(null);
  }

  function handleAcceptInvitation(inv: Invitation) {
    const newMember: TeamMember = {
      _id: "m" + Date.now(),
      nom: inv.nom,
      prenom: inv.prenom,
      email: inv.email,
      role: inv.role,
      equipe: inv.equipe,
      telephone: "",
      photo: "",
      statut: "Actif",
      projets: 0,
      dateEmbauche: new Date().toISOString().split("T")[0],
      derniereActivite: new Date().toISOString(),
      favori: false,
    };
    setMembers(prev => [...prev, newMember]);
    setInvitations(prev => prev.map(i =>
      i._id === inv._id ? { ...i, statut: "Acceptée" as const } : i
    ));
    setInvMenu(null);
  }

  // Invitations state
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);

  useEffect(() => {
    setInvitationsLoading(true);
    fetch("/api/invitations")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setInvitations(data.map((inv: any) => ({
            _id: inv._id,
            nom: inv.nom || "",
            prenom: inv.prenom || "",
            email: inv.email || "",
            role: inv.role || "",
            equipe: inv.equipe || "",
            invitePar: inv.invitePar || "",
            inviteParEmail: inv.inviteParEmail || "",
            dateEnvoi: inv.dateEnvoi || inv.createdAt || "",
            statut: inv.statut || "En attente",
            expiration: inv.expiration || "",
          })));
        }
      })
      .catch(() => {})
      .finally(() => setInvitationsLoading(false));
  }, []);

  // Invitation filter states
  const [invSearch, setInvSearch] = useState("");
  const [invFilterStatut, setInvFilterStatut] = useState("");
  const [invFilterRole, setInvFilterRole] = useState("");
  const [invFilterEquipe, setInvFilterEquipe] = useState("");
  const [invPage, setInvPage] = useState(1);
  const [invMenu, setInvMenu] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const invPerPage = 5;
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [editingInvite, setEditingInvite] = useState<Invitation | null>(null);
  const [invRecaptchaToken, setInvRecaptchaToken] = useState<string | null>(null);
  const [invRecaptchaError, setInvRecaptchaError] = useState(false);
  const [invForm, setInvForm] = useState({
    prenom: "", nom: "", email: "", role: "Développeur", equipe: "Développement", message: "",
  });
  const [invFormErrors, setInvFormErrors] = useState<Record<string, string>>({});

  const validateInvite = (data: typeof invForm): Record<string, string> => {
    const errors: Record<string, string> = {};
    const nameRegex = /^[A-Za-zÀ-ÿ\s]{2,30}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!data.prenom.trim()) errors.prenom = "Prénom obligatoire";
    else if (!nameRegex.test(data.prenom.trim())) errors.prenom = "Le prénom doit contenir uniquement des lettres (2 à 30 caractères).";

    if (!data.nom.trim()) errors.nom = "Nom obligatoire";
    else if (!nameRegex.test(data.nom.trim())) errors.nom = "Le nom doit contenir uniquement des lettres (2 à 30 caractères).";

    if (!data.email.trim()) {
      errors.email = "Email obligatoire";
    } else {
      const emails = data.email.split(",").map(e => e.trim()).filter(Boolean);
      for (const email of emails) {
        if (!emailRegex.test(email)) {
          errors.email = "Veuillez saisir une adresse email valide.";
          break;
        }
        if (members.some(m => m.email.toLowerCase() === email.toLowerCase())) {
          errors.email = `"${email}" appartient déjà à l'agence.`;
          break;
        }
        if (invitations.some(i => i.email.toLowerCase() === email.toLowerCase() && i.statut === "En attente")) {
          errors.email = `Une invitation est déjà en attente pour "${email}".`;
          break;
        }
      }
    }

    if (data.role !== "Client" && !data.equipe) errors.equipe = "Équipe obligatoire pour ce rôle.";

    if (data.message.length > 500) errors.message = "Le message ne doit pas dépasser 500 caractères.";
    if (/<[^>]*>|javascript:/i.test(data.message)) errors.message = "Le message ne doit pas contenir de code HTML ou JavaScript.";

    return errors;
  };

  // Roles & Permissions state
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [rolePermissions, setRolePermissions] = useState<PermissionMatrix>({});
  const [roleSearch, setRoleSearch] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleMenu, setRoleMenu] = useState<string | null>(null);
  const [actMenu, setActMenu] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [roleForm, setRoleForm] = useState({ nom: "", description: "", type: "Personnalisé" as RoleItem["type"] });
  const [saveConfirm, setSaveConfirm] = useState(false);

  useEffect(() => {
    setRolesLoading(true);
    fetch("/api/roles")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data)) return;
        const mapped: RoleItem[] = data.map((r: any) => ({
          id: r._id,
          nom: r.nom || "",
          description: r.description || "",
          type: r.type || "Personnalisé",
          dateCreation: r.createdAt || new Date().toISOString(),
          creePar: r.creePar || "",
          creeParEmail: r.creeParEmail || "",
          membreCount: r.membreCount || 0,
          projetsCount: r.projetsCount || 0,
          derniereModification: r.updatedAt || r.createdAt || new Date().toISOString(),
          membres: r.membres || [],
        }));
        setRoles(mapped);
        const perms: PermissionMatrix = {};
        data.forEach((r: any) => {
          if (r.permissions) {
            perms[r._id] = {};
            Object.entries(r.permissions).forEach(([key, val]) => {
              perms[r._id][key] = val as { voir: boolean; creer: boolean; modifier: boolean; supprimer: boolean; gerer: boolean };
            });
          }
        });
        setRolePermissions(perms);
        if (mapped.length > 0) setSelectedRoleId(mapped[0].id);
      })
      .catch(() => {})
      .finally(() => setRolesLoading(false));
  }, []);

  // Équipes state with API + localStorage
  const [equipes, setEquipes] = useState<EquipeItem[]>([]);
  const equipesLoaded = useRef(false);
  const [selectedEquipeId, setSelectedEquipeId] = useState("");
  const [eqSearch, setEqSearch] = useState("");
  const [eqFilterStatut, setEqFilterStatut] = useState("");
  const [eqSort, setEqSort] = useState<"nom" | "charge" | "projets">("nom");
  const [eqView, setEqView] = useState<"list" | "grid">("list");
  const [eqPage, setEqPage] = useState(1);
  const [eqPerPage, setEqPerPage] = useState(5);
  const [showEquipeModal, setShowEquipeModal] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState<EquipeItem | null>(null);
  const [showDeleteEqConfirm, setShowDeleteEqConfirm] = useState(false);
  const [deleteEqId, setDeleteEqId] = useState<string | null>(null);

  const colorKeys = ["emerald", "violet", "indigo", "amber", "rose", "sky"];
  const [equipeForm, setEquipeForm] = useState({
    nom: "", description: "", responsablePrenom: "", responsableNom: "", responsableFonction: "",
    projetsCount: 0, chargeTravail: 30, statut: "Actif" as "Actif" | "En pause", couleur: "violet",
    membresIds: [] as string[],
  });

  function openCreateEquipe() {
    setEditingEquipe(null);
    setEquipeForm({ nom: "", description: "", responsablePrenom: "", responsableNom: "", responsableFonction: "", projetsCount: 0, chargeTravail: 30, statut: "Actif", couleur: "violet", membresIds: [] });
    setShowEquipeModal(true);
  }

  function openEditEquipe(eq: EquipeItem) {
    setEditingEquipe(eq);
    setEquipeForm({
      nom: eq.nom, description: eq.description,
      responsablePrenom: eq.responsable.prenom, responsableNom: eq.responsable.nom, responsableFonction: eq.responsable.fonction,
      projetsCount: eq.projetsCount, chargeTravail: eq.chargeTravail, statut: eq.statut, couleur: eq.couleur,
      membresIds: eq.membres.map(m => members.find(mem => mem.email === m.email)?._id || "").filter(Boolean),
    });
    setShowEquipeModal(true);
  }

  function handleSaveEquipe(e: React.FormEvent) {
    e.preventDefault();
    const { nom, description, responsablePrenom, responsableNom, responsableFonction, projetsCount, chargeTravail, statut, couleur, membresIds } = equipeForm;
    if (!nom.trim()) return;
    const selectedMembers = membresIds.map(id => {
      const m = members.find(mem => mem._id === id);
      return m ? { prenom: m.prenom, nom: m.nom, email: m.email } : null;
    }).filter(Boolean) as { prenom: string; nom: string; email: string }[];
    if (editingEquipe) {
      setEquipes(prev => prev.map(eq =>
        eq.id === editingEquipe.id ? {
          ...eq, nom, description,
          responsable: { prenom: responsablePrenom, nom: responsableNom, fonction: responsableFonction },
          membres: selectedMembers,
          projetsCount, chargeTravail, statut, couleur,
        } : eq
      ));
    } else {
      const newId = `e${Date.now()}`;
      const newEquipe: EquipeItem = {
        id: newId, nom, description,
        responsable: { prenom: responsablePrenom, nom: responsableNom, fonction: responsableFonction },
        membres: selectedMembers,
        projetsCount, chargeTravail, statut: statut as "Actif" | "En pause",
        dateCreation: new Date().toISOString().split("T")[0], couleur,
        creePar: session?.user?.name || "Omayma Hoimdi",
        creeParEmail: session?.user?.email || "",
      };
      setEquipes(prev => [...prev, newEquipe]);
      setSelectedEquipeId(newId);
    }
    setShowEquipeModal(false);
    setEditingEquipe(null);
  }

  function handleDeleteEquipe(id: string) {
    setEquipes(prev => prev.filter(eq => eq.id !== id));
    if (selectedEquipeId === id) {
      setSelectedEquipeId(equipes.filter(eq => eq.id !== id)[0]?.id || "");
    }
    setShowDeleteEqConfirm(false);
    setDeleteEqId(null);
  }

  function handleDuplicateEquipe(eq: EquipeItem) {
    const newId = `e${Date.now()}`;
    const newEquipe: EquipeItem = {
      ...eq, id: newId, nom: `${eq.nom} (copie)`,
      dateCreation: new Date().toISOString().split("T")[0],
    };
    setEquipes(prev => [...prev, newEquipe]);
    setSelectedEquipeId(newId);
  }

  useEffect(() => {
    // Try API first, fallback to localStorage
    fetch("/api/equipes").then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setEquipes(data);
        try { localStorage.setItem("af_equipes", JSON.stringify(data)); } catch {}
      } else {
        const saved = localStorage.getItem("af_equipes");
        if (saved) try { setEquipes(JSON.parse(saved)); } catch {}
      }
    }).catch(() => {
      const saved = localStorage.getItem("af_equipes");
      if (saved) try { setEquipes(JSON.parse(saved)); } catch {}
    }).finally(() => {
      equipesLoaded.current = true;
    });
  }, []);

  const eqSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!equipesLoaded.current) return;
    try { localStorage.setItem("af_equipes", JSON.stringify(equipes)); } catch {}
    clearTimeout(eqSaveTimer.current);
    eqSaveTimer.current = setTimeout(() => {
      fetch("/api/equipes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(equipes) }).catch(() => {});
    }, 2000);
  }, [equipes]);

  // Activité state with localStorage
  const [roleActivities, setRoleActivities] = useState<ActivityEntry[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("af_role_activities");
      if (saved) try { return JSON.parse(saved); } catch {}
    }
    return [];
  });
  useEffect(() => {
    try { localStorage.setItem("af_role_activities", JSON.stringify(roleActivities)); } catch {}
  }, [roleActivities]);

  function addActivity(type: string, message: string, project = "Général") {
    const priorities = ["haute", "moyenne", "basse"] as const;
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const entry: ActivityEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type,
      message,
      userNom: session?.user?.name || "Omayma Hoimdi",
      userEmail: session?.user?.email || "",
      userRole: session?.user?.role || "Membre",
      project,
      priority,
      date: new Date().toISOString(),
    };
    setRoleActivities(prev => [entry, ...prev]);
  }

  const filteredEquipes = useMemo(() => {
    let result = [...equipes];
    if (eqSearch.trim()) {
      const q = eqSearch.toLowerCase();
      result = result.filter(e => e.nom.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    if (eqFilterStatut) result = result.filter(e => e.statut === eqFilterStatut);
    if (eqSort === "nom") result.sort((a, b) => a.nom.localeCompare(b.nom));
    if (eqSort === "charge") result.sort((a, b) => b.chargeTravail - a.chargeTravail);
    if (eqSort === "projets") result.sort((a, b) => b.projetsCount - a.projetsCount);
    return result;
  }, [equipes, eqSearch, eqFilterStatut, eqSort]);

  const eqTotalPages = Math.ceil(filteredEquipes.length / eqPerPage);
  const eqPaginated = filteredEquipes.slice((eqPage - 1) * eqPerPage, eqPage * eqPerPage);

  const filteredInvitations = useMemo(() => {
    let result = [...invitations];
    if (invSearch.trim()) {
      const q = invSearch.toLowerCase();
      result = result.filter(inv =>
        inv.prenom.toLowerCase().includes(q) || inv.nom.toLowerCase().includes(q) || inv.email.toLowerCase().includes(q)
      );
    }
    if (invFilterStatut) result = result.filter(inv => inv.statut === invFilterStatut);
    if (invFilterRole) result = result.filter(inv => inv.role === invFilterRole);
    if (invFilterEquipe) result = result.filter(inv => inv.equipe === invFilterEquipe);
    return result;
  }, [invSearch, invFilterStatut, invFilterRole, invFilterEquipe, invitations]);

  const invTotalPages = Math.ceil(filteredInvitations.length / invPerPage);
  const invPaginated = filteredInvitations.slice((invPage - 1) * invPerPage, invPage * invPerPage);

  const invKpi = useMemo(() => ({
    envoyees: invitations.length,
    enAttente: invitations.filter(i => i.statut === "En attente").length,
    acceptees: invitations.filter(i => i.statut === "Acceptée").length,
    expirees: invitations.filter(i => i.statut === "Expirée" || i.statut === "Annulée").length,
  }), [invitations]);

  // Invitation role distribution
  const invRoleDist = useMemo(() => {
    const counts: Record<string, number> = {};
    invitations.forEach(i => { counts[i.role] = (counts[i.role] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [invitations]);

  // Recent activity for invitations
  const invRecentActivity = useMemo(() =>
    [...invitations].sort((a, b) => new Date(b.dateEnvoi).getTime() - new Date(a.dateEnvoi).getTime()).slice(0, 3),
  [invitations]);

  // Roles computed
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter(r => r.nom.toLowerCase().includes(q));
  }, [roleSearch, roles]);

  const selectedRole = useMemo(() => roles.find(r => r.id === selectedRoleId) || roles[0], [selectedRoleId, roles]);

  const roleKpi = useMemo(() => {
    const totalRoles = roles.length;
    const totalMembers = roles.reduce((a, r) => a + r.membreCount, 0);
    let activePerms = 0;
    Object.values(rolePermissions).forEach(sections => {
      Object.values(sections).forEach(p => {
        if (p.voir) activePerms++;
        if (p.creer) activePerms++;
        if (p.modifier) activePerms++;
        if (p.supprimer) activePerms++;
        if (p.gerer) activePerms++;
      });
    });
    const customRoles = roles.filter(r => r.type === "Personnalisé").length;
    return { totalRoles, totalMembers, activePerms, customRoles };
  }, [roles, rolePermissions]);

  function togglePerm(roleId: string, itemId: string, key: string) {
    const role = roles.find(r => r.id === roleId);
    const cat = PERMISSION_CATEGORIES.flatMap(c => c.items).find(i => i.id === itemId);
    const actionLabel = key === "voir" ? "Voir" : key === "creer" ? "Créer" : key === "modifier" ? "Modifier" : key === "supprimer" ? "Supprimer" : "Gérer";
    const newVal = !rolePermissions?.[roleId]?.[itemId]?.[key as keyof PermissionMatrix[string][string]];
    const updatedPerms = {
      ...rolePermissions[roleId],
      [itemId]: { ...rolePermissions[roleId][itemId], [key]: newVal },
    };
    setRolePermissions(prev => ({
      ...prev,
      [roleId]: updatedPerms,
    }));
    fetch(`/api/roles/${roleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: updatedPerms }),
    }).catch(() => {});
    if (role && cat) addActivity("perm_toggled", `a ${newVal ? "activé" : "désactivé"} la permission "${actionLabel}" pour "${cat.label}" dans le rôle "${role.nom}"`);
  }

  function openCreateRole() {
    setEditingRole(null);
    setRoleForm({ nom: "", description: "", type: "Personnalisé" });
    setShowRoleModal(true);
  }

  function openEditRole(role: RoleItem) {
    setEditingRole(role);
    setRoleForm({ nom: role.nom, description: role.description, type: role.type });
    setShowRoleModal(true);
    setRoleMenu(null);
  }

  function buildDefaultPerms() {
    const perms: Record<string, { voir: boolean; creer: boolean; modifier: boolean; supprimer: boolean; gerer: boolean }> = {};
    PERMISSION_CATEGORIES.forEach(cat => cat.items.forEach(item => {
      perms[item.id] = { voir: false, creer: false, modifier: false, supprimer: false, gerer: false };
    }));
    return perms;
  }

  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    if (!roleForm.nom.trim()) return;
    if (editingRole) {
      try {
        const res = await fetch(`/api/roles/${editingRole.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom: roleForm.nom, description: roleForm.description, type: roleForm.type }),
        });
        if (res.ok) {
          const updated = await res.json();
          setRoles(prev => prev.map(r =>
            r.id === editingRole.id
              ? { ...r, nom: roleForm.nom, description: roleForm.description, type: roleForm.type, derniereModification: updated.updatedAt || new Date().toISOString() }
              : r
          ));
          addActivity("role_edited", `a modifié le rôle "${roleForm.nom}"`);
        }
      } catch {}
    } else {
      try {
        const res = await fetch("/api/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom: roleForm.nom, description: roleForm.description, type: roleForm.type, permissions: buildDefaultPerms() }),
        });
        if (res.ok) {
          const created = await res.json();
          const newRole: RoleItem = {
            id: created.id || created._id,
            nom: roleForm.nom, description: roleForm.description, type: roleForm.type,
            dateCreation: new Date().toISOString(), creePar: session?.user?.name || "Omayma Hoimdi",
            creeParEmail: session?.user?.email || "",
            membreCount: 0, projetsCount: 0, derniereModification: new Date().toISOString(), membres: [],
          };
          setRoles(prev => [...prev, newRole]);
          setRolePermissions(prev => ({ ...prev, [newRole.id]: buildDefaultPerms() }));
          setSelectedRoleId(newRole.id);
          addActivity("role_created", `a créé le rôle "${roleForm.nom}"`);
        }
      } catch {}
    }
    setShowRoleModal(false);
  }

  async function handleDeleteRole(id: string) {
    if (!confirm("Supprimer ce rôle ?")) return;
    const deleted = roles.find(r => r.id === id);
    try {
      await fetch(`/api/roles/${id}`, { method: "DELETE" });
    } catch {}
    setRoles(prev => prev.filter(r => r.id !== id));
    setRolePermissions(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (selectedRoleId === id) {
      setSelectedRoleId(roles.length > 1 ? roles.find(r => r.id !== id)!.id : "");
    }
    setRoleMenu(null);
    if (deleted) addActivity("role_deleted", `a supprimé le rôle "${deleted.nom}"`);
  }

  function getDaysRemaining(expiration: string) {
    const diff = new Date(expiration).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const INV_STATUT_BADGES: Record<string, string> = {
    "En attente": "bg-amber-100 text-amber-700",
    "Acceptée": "bg-emerald-100 text-emerald-700",
    "Expirée": "bg-red-100 text-red-700",
    "Annulée": "bg-slate-100 text-slate-500",
  };

  const INV_STATUT_DOTS: Record<string, string> = {
    "En attente": "bg-amber-500",
    "Acceptée": "bg-emerald-500",
    "Expirée": "bg-red-500",
    "Annulée": "bg-slate-400",
  };

  // --- Activité : filtres, pagination, groupement (comme projet) ---
  const [actFilterType, setActFilterType] = useState("");
  const [actFilterMember, setActFilterMember] = useState("");
  const [actSearch, setActSearch] = useState("");
  const [actPage, setActPage] = useState(1);
  const [actDateStart, setActDateStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; });
  const [actDateEnd, setActDateEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const pageSizeActivities = 10;

  const actFiltered = useMemo(() => {
    let result = [...roleActivities];
    if (actFilterType) result = result.filter(a => a.type === actFilterType);
    if (actFilterMember) result = result.filter(a => a.userNom === actFilterMember);
    if (actSearch) {
      const q = actSearch.toLowerCase();
      result = result.filter(a => a.userNom.toLowerCase().includes(q) || a.message.toLowerCase().includes(q) || a.userEmail.toLowerCase().includes(q));
    }
    if (actDateStart) result = result.filter(a => new Date(a.date) >= new Date(actDateStart));
    if (actDateEnd) {
      const end = new Date(actDateEnd);
      end.setHours(23, 59, 59, 999);
      result = result.filter(a => new Date(a.date) <= end);
    }
    return result;
  }, [roleActivities, actFilterType, actFilterMember, actSearch, actDateStart, actDateEnd]);

  const actTotal = actFiltered.length;
  const actHasMore = actPage * pageSizeActivities < actTotal;
  const actDisplayed = actFiltered.slice(0, actPage * pageSizeActivities);

  const actGrouped = useMemo(() => {
    const groups: { label: string; date: string; items: ActivityEntry[] }[] = [];
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    actDisplayed.forEach(item => {
      const dateKey = new Date(item.date).toISOString().split("T")[0];
      let label = new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      if (dateKey === today) label = "Aujourd'hui - " + label;
      else if (dateKey === yesterday) label = "Hier - " + label;
      const existing = groups.find(g => g.date === dateKey);
      if (existing) existing.items.push(item);
      else groups.push({ label, date: dateKey, items: [item] });
    });
    return groups;
  }, [actDisplayed]);

  const actSummary = useMemo(() => ({
    roles: roleActivities.filter(a => ["role_created","role_edited","role_deleted"].includes(a.type)).length,
    permissions: roleActivities.filter(a => a.type.startsWith("perm")).length,
    total: roleActivities.length,
  }), [roleActivities]);

  const actByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    roleActivities.forEach(a => { counts[a.userRole] = (counts[a.userRole] || 0) + 1; });
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 4).map(([name, count]) => ({ name, value: Math.round((count / total) * 100), count }));
    if (sorted.length > 4) {
      const othersCount = sorted.slice(4).reduce((s, [, c]) => s + c, 0);
      top.push({ name: "Autres", value: Math.round((othersCount / total) * 100), count: othersCount });
    }
    return top;
  }, [roleActivities]);

  const actFrequent = useMemo(() => {
    const counts: Record<string, number> = {};
    roleActivities.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [roleActivities]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-20">

      {/* ===== TOP BAR ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Équipe</h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeTab === "Membres" && "Gérez les membres, les rôles et les équipes de votre agence"}
            {activeTab === "Invitations" && "Invitez de nouveaux membres et suivez le statut de vos invitations"}
            {activeTab === "Rôles & Permissions" && "Définissez les rôles, les permissions et les accès de chaque membre"}
            {activeTab === "Équipes" && "Organisez les membres en équipes par département ou projet"}
            {activeTab === "Rapports" && "Consultez les statistiques et les rapports de performance de l'équipe"}
            {activeTab === "Activité" && "Suivez en temps réel toutes les modifications des rôles et permissions"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "Membres" && (
            <>
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                <Download size={16} /> Importer des membres
              </button>
              <button onClick={openAdd}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:opacity-90 transition">
                <Plus size={16} /> Ajouter membre
              </button>
            </>
          )}
          {activeTab === "Invitations" && (
            <>
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                <FileSpreadsheet size={16} /> Exporter
              </button>
              <button onClick={openSendInvite}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:opacity-90 transition">
                <UserPlus size={16} /> Inviter un membre
              </button>
            </>
          )}
          {activeTab === "Rôles & Permissions" && (
            <>
              <button onClick={openCreateRole}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:opacity-90 transition">
                <Shield size={16} /> Créer un rôle
              </button>
            </>
          )}
          {activeTab === "Équipes" && (
            <button onClick={openCreateEquipe}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:opacity-90 transition">
              <Plus size={16} /> Créer une équipe
            </button>
          )}
          {activeTab === "Rapports" && (
            <button onClick={handleGenerateReport} disabled={generating}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:opacity-90 disabled:opacity-50 transition">
              {generating ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
              {generating ? "Génération en cours..." : "Générer un rapport IA"}
            </button>
          )}
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      {activeTab === "Membres" && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {KPI_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
              <div className={`rounded-xl ${bg} p-2.5 ${color} w-fit mb-3`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}
      {activeTab === "Invitations" && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Invitations envoyées", value: invKpi.envoyees, icon: Mail, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "En attente", value: invKpi.enAttente, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Acceptées", value: invKpi.acceptees, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Expirées", value: invKpi.expirees, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
              <div className={`rounded-xl ${bg} p-2.5 ${color} w-fit mb-3`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}
      {activeTab === "Rôles & Permissions" && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Rôles créés", value: roleKpi.totalRoles, icon: Shield, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Membres assignés", value: roleKpi.totalMembers, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Permissions actives", value: roleKpi.activePerms, icon: Lock, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Rôles personnalisés", value: roleKpi.customRoles, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
              <div className={`rounded-xl ${bg} p-2.5 ${color} w-fit mb-3`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}
      {activeTab === "Équipes" && (() => {
        const allTeams = equipes;
        const totalMembres = allTeams.reduce((s, t) => s + t.membres.length, 0);
        const totalProjets = allTeams.reduce((s, t) => s + t.projetsCount, 0);
        const avgProductivite = Math.round(allTeams.reduce((s, t) => s + t.chargeTravail, 0) / allTeams.length);
        return (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Équipes", desc: "Total d'équipes actives", value: allTeams.length, icon: Building2, color: "text-violet-600", bg: "bg-violet-50" },
              { label: "Membres", desc: "Répartis dans les équipes", value: totalMembres, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Projets", desc: "Assignés aux équipes", value: totalProjets, icon: FolderKanban, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Productivité", desc: "Moyenne globale", value: `${avgProductivite}%`, icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50" },
            ].map(({ label, desc, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
                <div className={`rounded-xl ${bg} p-2.5 ${color} w-fit mb-3`}>
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-800">{label}</p>
                <p className="text-[10px] text-slate-400 mt-px">{desc}</p>
              </div>
            ))}
          </div>
        );
      })()}
      {activeTab === "Rapports" && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {rapportKpi.map(({ label, value, evolution, up, icon, color, bg }) => {
            const Icon = { Users, BarChart3, FolderKanban, CheckCircle, Clock }[icon as "Users" | "BarChart3" | "FolderKanban" | "CheckCircle" | "Clock"] || Users;
            return (
              <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
                <div className={`rounded-xl ${bg} p-2.5 ${color} w-fit mb-3`}>
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{label}</p>
                <p className={`mt-1 text-[11px] font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
                  {evolution} {up ? "↑" : "↓"} vs mois dernier
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== TABS ===== */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 border-b border-slate-100 min-w-max pb-0">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >{tab}</button>
          ))}
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT: Table / Grid */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ===== MEMBRES TAB ===== */}
          {activeTab === "Membres" && (
            <>
              {/* === Filter Bar === */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un membre..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                <div className="relative">
                  <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-violet-400 text-slate-600">
                    <option value="">Tous les rôles</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <select value={filterEquipe} onChange={(e) => setFilterEquipe(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-violet-400 text-slate-600">
                    <option value="">Toutes les équipes</option>
                    {EQUIPES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-violet-400 text-slate-600">
                    <option value="">Tous les statuts</option>
                    {STATUTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                    showAdvancedFilters ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}>
                  <Filter size={14} /> Filtres avancés
                </button>
                <div className="flex items-center rounded-xl border border-slate-200 p-0.5">
                  <button onClick={() => setViewMode("list")}
                    className={`rounded-lg p-1.5 transition ${viewMode === "list" ? "bg-violet-100 text-violet-700" : "text-slate-400 hover:text-slate-600"}`}>
                    <LayoutList size={16} />
                  </button>
                  <button onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-1.5 transition ${viewMode === "grid" ? "bg-violet-100 text-violet-700" : "text-slate-400 hover:text-slate-600"}`}>
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>

              {/* Advanced filters panel */}
              {showAdvancedFilters && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Date d&apos;embauche</label>
                      <input type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Nombre de projets</label>
                      <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 bg-white text-slate-600">
                        <option>Tous</option>
                        <option>0 projet</option>
                        <option>1-3 projets</option>
                        <option>4-6 projets</option>
                        <option>7+ projets</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Compétences</label>
                      <input placeholder="React, Node.js, Figma..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => { setFilterRole(""); setFilterEquipe(""); setFilterStatut(""); setSearch(""); }}
                      className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50">Réinitialiser</button>
                    <button className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">Appliquer</button>
                  </div>
                </div>
              )}

              {/* ==== LIST VIEW ==== */}
              {viewMode === "list" ? (
                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50">
                      <tr>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Membre</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Rôle</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Équipe</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Projets</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Statut</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Ajouté par</th>
                        <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Dernière activité</th>
                        <th className="px-5 py-3.5 text-right font-semibold text-slate-700 text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                            <Users size={32} className="mx-auto mb-2 opacity-30" />
                            Aucun membre trouvé
                          </td>
                        </tr>
                      ) : (
                        filtered.map((m) => (
                          <tr key={m._id} className="group transition-all hover:bg-violet-50/40">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-sm font-bold">
                                  {getInitials(m.prenom, m.nom)}
                                </div>
                                  <div className="min-w-0">
                                   <p className="text-sm font-semibold text-slate-900">{m.prenom} {m.nom}{m.favori && <Star size={12} className="ml-1.5 inline-block text-amber-500" />}</p>
                                   <p className="text-xs text-slate-400 truncate">{m.email}</p>
                                 </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-medium ${ROLE_COLORS[m.role] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                {m.role}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-600">{m.equipe}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <Briefcase size={14} className="text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">{m.projets}</span>
                                <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, (m.projets / 8) * 100)}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_BADGES[m.statut] || "bg-slate-100 text-slate-600"}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${STATUT_DOTS[m.statut] || "bg-slate-400"}`} />
                                {m.statut}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {m.addedBy ? (
                                <div>
                                  <p className="text-xs text-slate-600">{m.addedBy}</p>
                                  {m.addedByEmail && <p className="text-[10px] text-slate-400">{m.addedByEmail}</p>}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500">{formatActivity(m.derniereActivite)}</td>
                            <td className="px-5 py-4 text-right relative">
                              <div className="flex justify-end gap-1">
                                <button className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition">
                                  <Eye size={15} />
                                </button>
                                <button onClick={() => openEdit(m)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition">
                                  <Pencil size={15} />
                                </button>
                                <button onClick={() => setMemberMenu(memberMenu === m._id ? null : m._id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
                                  <MoreHorizontal size={15} />
                                </button>
                              </div>
                              {memberMenu === m._id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setMemberMenu(null)} />
                                  <div className="absolute right-0 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                                    <button onClick={() => handleToggleFavorite(m._id)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700">
                                      {m.favori ? <Star size={14} className="text-amber-500" /> : <Star size={14} />} {m.favori ? "Retirer des favoris" : "Marquer comme favori"}
                                    </button>
                                    <hr className="my-1 border-slate-100" />
                                    <button onClick={() => handleDelete(m._id)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50"><Trash2 size={14} /> Supprimer</button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* ==== GRID VIEW ==== */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />
                      Aucun membre trouvé
                    </div>
                  ) : (
                    filtered.map((m) => (
                      <div key={m._id} className="relative rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
                        <div className="flex flex-col items-center text-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-lg font-bold mb-3">
                            {getInitials(m.prenom, m.nom)}
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{m.prenom} {m.nom}{m.favori && <Star size={12} className="ml-1.5 inline-block text-amber-500" />}</p>
                          <p className="text-xs text-slate-400 truncate max-w-full">{m.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[m.role] || "bg-slate-50 text-slate-600"}`}>{m.role}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUT_BADGES[m.statut] || "bg-slate-100 text-slate-600"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${STATUT_DOTS[m.statut] || "bg-slate-400"}`} />
                              {m.statut}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                            <Briefcase size={13} /> {m.projets} projets
                          </div>
                          {m.addedBy && (
                            <p className="text-[10px] text-slate-400 mt-1.5">Ajouté par {m.addedBy}{m.addedByEmail ? ` (${m.addedByEmail})` : ""}</p>
                          )}
                          <div className="w-full mt-3 pt-3 border-t border-slate-50 flex justify-center gap-2">
                            <button className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition"><Eye size={14} /></button>
                            <button onClick={() => openEdit(m)} className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition"><Pencil size={14} /></button>
                            <button onClick={() => setMemberMenu(memberMenu === m._id ? null : m._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"><MoreHorizontal size={14} /></button>
                          </div>
                        </div>
                        {memberMenu === m._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMemberMenu(null)} />
                            <div className="absolute right-2 top-2 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                              <button onClick={() => handleToggleFavorite(m._id)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700">
                                {m.favori ? <Star size={14} className="text-amber-500" /> : <Star size={14} />} {m.favori ? "Retirer" : "Favori"}
                              </button>
                              <hr className="my-1 border-slate-100" />
                              <button onClick={() => handleDelete(m._id)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50"><Trash2 size={14} /> Supprimer</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {/* ===== RÔLES & PERMISSIONS TAB ===== */}
          {activeTab === "Rôles & Permissions" && (
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">

              {/* ======================== LEFT : Liste des Rôles ======================== */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col" style={{ minHeight: 620 }}>
                {/* En-tête */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                      <Shield size={16} className="text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Rôles</h3>
                      <p className="text-[10px] text-slate-400">{roles.length} rôle{roles.length > 1 ? "s" : ""} configurés</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-bold text-white">{roles.length}</span>
                </div>

                {/* Barre de recherche */}
                <div className="border-b border-slate-100 px-6 py-3">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      placeholder="Rechercher un rôle..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-violet-400 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Liste des rôles — scrollable */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filteredRoles.map((r) => {
                    const isActive = r.id === selectedRoleId;
                    const roleIcon = ({
                      Administrateur: Users,
                      "Chef de projet": Briefcase,
                      Développeur: FileText,
                      Designer: LayoutList,
                      Testeur: CheckCircle,
                      Client: UserCircle2,
                    } as Record<string, React.ElementType>)[r.nom] || Shield;

                    return (
                      <div
                        key={r.id}
                        className={`relative flex items-center gap-3 px-4 py-3.5 transition-all cursor-pointer border-l-[3px] ${
                          isActive
                            ? "bg-violet-50 border-violet-600"
                            : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                        }`}
                        onClick={() => setSelectedRoleId(r.id)}
                      >
                        {/* Icône rôle */}
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ROLE_BG[r.nom] || "bg-slate-50"}`}>
                          {React.createElement(roleIcon, { size: 18, className: ROLE_ICONS[r.nom] || "text-slate-500" })}
                        </div>

                        {/* Info rôle */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-bold ${isActive ? "text-violet-900" : "text-slate-800"}`}>{r.nom}</span>
                            {r.type === "Système" && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Système</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{r.description}</p>
                          {r.creePar && r.type !== "Système" && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                              Par <span className="text-violet-500">{r.creePar}</span>
                              {r.creeParEmail && <span className="text-slate-300"> · {r.creeParEmail}</span>}
                            </p>
                          )}
                        </div>

                        {/* Badge membres */}
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isActive ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-600"
                        }`}>
                          {r.membreCount}
                        </span>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => openEditRole(r)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-100 hover:text-violet-600 transition" title="Modifier">
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/roles", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ nom: r.nom + " (copie)", description: r.description, type: r.type, permissions: rolePermissions[r.id] || buildDefaultPerms() }),
                                });
                                if (res.ok) {
                                  const created = await res.json();
                                  const copy: RoleItem = { ...r, id: created.id || created._id, nom: r.nom + " (copie)", dateCreation: new Date().toISOString(), derniereModification: new Date().toISOString(), creePar: session?.user?.name || "Omayma Hoimdi", creeParEmail: session?.user?.email || "" };
                                  setRoles(prev => [...prev, copy]);
                                  setRolePermissions(prev => ({ ...prev, [copy.id]: rolePermissions[r.id] ? { ...rolePermissions[r.id] } : buildDefaultPerms() }));
                                }
                              } catch {}
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-100 hover:text-violet-600 transition" title="Dupliquer">
                            <Copy size={13} />
                          </button>
                          <button onClick={() => handleDeleteRole(r.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition" title="Supprimer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pied de page */}
                <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
                  <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition">
                    <Archive size={13} /> Archivés
                  </button>
                  <span className="text-[10px] text-slate-300">
                    {roles.filter(r => r.type === "Système").length} système · {roles.filter(r => r.type === "Personnalisé").length} personnalisé
                  </span>
                </div>
              </div>

              {/* ======================== RIGHT : Matrice des Permissions ======================== */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col" style={{ minHeight: 620 }}>
                {/* En-tête Permissions */}
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                        <Lock size={16} className="text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">Permissions</h3>
                          {selectedRole && (
                            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
                              {selectedRole.nom}
                            </span>
                          )}
                        </div>
                        {selectedRole?.creePar && selectedRole.type !== "Système" && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Créé par <span className="text-violet-500">{selectedRole.creePar}</span>
                            {selectedRole.creeParEmail && <span> · {selectedRole.creeParEmail}</span>}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Boutons d'action rapide */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const allTrue: PermissionMatrix[string] = {};
                          PERMISSION_CATEGORIES.forEach(cat => cat.items.forEach(item => {
                            allTrue[item.id] = { voir: true, creer: true, modifier: true, supprimer: true, gerer: true };
                          }));
                          setRolePermissions(prev => ({ ...prev, [selectedRoleId]: allTrue }));
                          fetch(`/api/roles/${selectedRoleId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissions: allTrue }) }).catch(() => {});
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition"
                      >
                        Tout
                      </button>
                      <button
                        onClick={() => {
                          const allFalse: PermissionMatrix[string] = {};
                          PERMISSION_CATEGORIES.forEach(cat => cat.items.forEach(item => {
                            allFalse[item.id] = { voir: false, creer: false, modifier: false, supprimer: false, gerer: false };
                          }));
                          setRolePermissions(prev => ({ ...prev, [selectedRoleId]: allFalse }));
                          fetch(`/api/roles/${selectedRoleId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissions: allFalse }) }).catch(() => {});
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
                      >
                        Aucun
                      </button>
                      <button
                        onClick={() => {
                          const defaultPerms = buildDefaultPerms();
                          setRolePermissions(prev => ({ ...prev, [selectedRoleId]: defaultPerms }));
                          fetch(`/api/roles/${selectedRoleId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissions: defaultPerms }) }).catch(() => {});
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
                      >
                        Réinit.
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tableau des permissions — pleine largeur */}
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-sm table-fixed">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b-2 border-slate-200 bg-white">
                        {/* Colonne permission : s’étend sur tout l’espace libre */}
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Permission
                        </th>
                        {/* Colonnes d’action : largeur égale fixée pour remplir horizontalement */}
                        {(["Voir", "Créer", "Modifier", "Supprimer", "Gérer"] as const).map((label) => (
                          <th key={label} style={{ width: "11%" }} className="py-3.5 text-center text-xs font-bold text-violet-700 uppercase tracking-wider bg-violet-50">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERMISSION_CATEGORIES.map((cat) => {
                        const catIcon = ({
                          FolderKanban, LayoutList, Users, FileText, BarChart3, MessageSquare, Shield
                        } as Record<string, React.ElementType>)[cat.icon] || FolderKanban;
                        return (
                          <React.Fragment key={cat.name}>
                            {/* Catégorie */}
                            <tr>
                              <td colSpan={6} className="px-5 py-2.5 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                  {React.createElement(catIcon, { size: 13, className: "text-violet-500 shrink-0" })}
                                  <span className="text-[11px] font-black text-violet-700 uppercase tracking-widest">{cat.name}</span>
                                </div>
                              </td>
                            </tr>
                            {/* Lignes de permissions */}
                            {cat.items.map((item, itemIdx) => {
                              const perms = rolePermissions[selectedRoleId]?.[item.id];
                              if (!perms) return null;
                              return (
                                <tr
                                  key={item.id}
                                  className={`group border-b border-slate-100 transition-colors ${
                                    itemIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                                  } hover:bg-violet-50/40`}
                                >
                                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">
                                    {item.label}
                                  </td>
                                  {/* Cases à cocher centrées dans chaque colonne d’action */}
                                  {(["voir", "creer", "modifier", "supprimer", "gerer"] as const).map((action) => (
                                    <td key={action} className="py-3.5 text-center">
                                      <label className="inline-flex items-center justify-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={perms[action]}
                                          onChange={() => togglePerm(selectedRoleId, item.id, action)}
                                          className="sr-only peer"
                                        />
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                          perms[action]
                                            ? "bg-violet-600 border-violet-600 shadow-sm shadow-violet-200"
                                            : "bg-white border-slate-300 group-hover:border-violet-400"
                                        }`}>
                                          {perms[action] && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                        </div>
                                      </label>
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pied de page */}
                <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-end bg-slate-50/50 rounded-b-2xl">
                  <button
                    onClick={() => { setSaveConfirm(true); setTimeout(() => setSaveConfirm(false), 2000); const role = roles.find(r => r.id === selectedRoleId); if (role) addActivity("perms_saved", `a enregistré les permissions du rôle "${role.nom}"`); }}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition shadow-sm ${
                      saveConfirm
                        ? "bg-emerald-500 shadow-emerald-200"
                        : "bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 shadow-violet-200"
                    }`}
                  >
                    {saveConfirm
                      ? <><CheckCircle size={15} /> Enregistré</>
                      : <><Shield size={14} /> Enregistrer</>
                    }
                  </button>
                </div>
              </div>

            </div>
          )}


          {/* ===== INVITATIONS TAB ===== */}
          {activeTab === "Invitations" && (
            <>
              {/* Filter bar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={invSearch} onChange={(e) => { setInvSearch(e.target.value); setInvPage(1); }}
                    placeholder="Rechercher par nom ou email..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
                <div className="relative">
                  <select value={invFilterStatut} onChange={(e) => { setInvFilterStatut(e.target.value); setInvPage(1); }}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-violet-400 text-slate-600">
                    <option value="">Tous les statuts</option>
                    <option value="En attente">En attente</option>
                    <option value="Acceptée">Acceptée</option>
                    <option value="Expirée">Expirée</option>
                    <option value="Annulée">Annulée</option>
                  </select>
                </div>
                <div className="relative">
                  <select value={invFilterRole} onChange={(e) => { setInvFilterRole(e.target.value); setInvPage(1); }}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-violet-400 text-slate-600">
                    <option value="">Tous les rôles</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <select value={invFilterEquipe} onChange={(e) => { setInvFilterEquipe(e.target.value); setInvPage(1); }}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-violet-400 text-slate-600">
                    <option value="">Toutes les équipes</option>
                    {EQUIPES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                  <Filter size={14} /> Filtres
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50">
                    <tr>
                      <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Invité</th>
                      <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Rôle</th>
                      <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Équipe</th>
                      <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Invité par</th>
                      <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Date d'envoi</th>
                      <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Statut</th>
                      <th className="px-5 py-3.5 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Expiration</th>
                      <th className="px-5 py-3.5 text-right font-semibold text-slate-700 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invPaginated.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                          <Mail size={32} className="mx-auto mb-2 opacity-30" />
                          Aucune invitation trouvée
                        </td>
                      </tr>
                    ) : (
                      invPaginated.map((inv) => {
                        const daysLeft = getDaysRemaining(inv.expiration);
                        return (
                          <tr key={inv._id} className="group transition-all hover:bg-violet-50/40">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-sm font-bold">
                                  {getInitials(inv.prenom, inv.nom)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900">{inv.prenom} {inv.nom}</p>
                                  <p className="text-xs text-slate-400 truncate">{inv.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-medium ${ROLE_COLORS[inv.role] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                {inv.role}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-600">{inv.equipe}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 text-[9px] font-bold">
                                  {inv.invitePar.split(" ").map(s => s[0]).join("")}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-sm text-slate-600 whitespace-nowrap">{inv.invitePar}</span>
                                  {inv.inviteParEmail && <span className="text-[10px] text-slate-400 block truncate">{inv.inviteParEmail}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-600">
                              {new Date(inv.dateEnvoi).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${INV_STATUT_BADGES[inv.statut] || "bg-slate-100 text-slate-600"}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${INV_STATUT_DOTS[inv.statut] || "bg-slate-400"}`} />
                                {inv.statut}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {inv.statut === "Expirée" ? (
                                <span className="text-xs text-red-500 font-medium">Expirée</span>
                              ) : inv.statut === "Annulée" ? (
                                <span className="text-xs text-slate-400 font-medium">Annulée</span>
                              ) : inv.statut === "Acceptée" ? (
                                <span className="text-xs text-emerald-500 font-medium">Acceptée</span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Clock size={13} className="text-amber-500" />
                                  <span className="text-xs font-medium text-amber-600">{daysLeft > 0 ? `${daysLeft} jours restants` : "Dernier jour"}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right relative">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => openEditInvite(inv)} className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition" title="Voir invitation">
                                  <Eye size={15} />
                                </button>
                                {inv.statut !== "Acceptée" && inv.statut !== "Annulée" && (
                                  <button onClick={() => handleResendInvitation(inv._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition" title="Renvoyer l'invitation">
                                    <RefreshCw size={15} />
                                  </button>
                                )}
                                {inv.statut === "En attente" && (
                                  <button onClick={() => handleAcceptInvitation(inv)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition" title="Accepter l'invitation">
                                    <UserCheck size={15} />
                                  </button>
                                )}
                                {inv.statut === "En attente" && (
                                  <button onClick={() => handleCancelInvitation(inv._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition" title="Annuler l'invitation">
                                    <Ban size={15} />
                                  </button>
                                )}
                                <button onClick={() => setInvMenu(invMenu === inv._id ? null : inv._id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
                                  <MoreHorizontal size={15} />
                                </button>
                              </div>
                              {invMenu === inv._id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setInvMenu(null)} />
                                  <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                                    <button onClick={() => openEditInvite(inv)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700"><Pencil size={14} /> Modifier</button>
                                    {inv.statut !== "Acceptée" && inv.statut !== "Annulée" && (
                                      <button onClick={() => handleResendInvitation(inv._id)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700"><RefreshCw size={14} /> Renvoyer</button>
                                    )}
                                    {inv.statut === "En attente" && (
                                      <button onClick={() => handleAcceptInvitation(inv)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-emerald-600 hover:bg-emerald-50"><UserCheck size={14} /> Accepter</button>
                                    )}
                                    {inv.statut === "En attente" && (
                                      <button onClick={() => handleCancelInvitation(inv._id)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50"><Ban size={14} /> Annuler</button>
                                    )}
                                    <hr className="my-1 border-slate-100" />
                                    <button onClick={() => handleDeleteInvitation(inv._id)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50"><Trash2 size={14} /> Supprimer</button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredInvitations.length > invPerPage && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-500">
                    {filteredInvitations.length > 0 && (
                      <>{(invPage - 1) * invPerPage + 1}&ndash;{Math.min(invPage * invPerPage, filteredInvitations.length)} sur {filteredInvitations.length} invitations</>
                    )}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setInvPage(p => Math.max(1, p - 1))} disabled={invPage <= 1}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={15} /></button>
                    {Array.from({ length: invTotalPages }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => setInvPage(n)}
                        className={`min-w-[28px] rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                          invPage === n ? "bg-violet-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                        }`}>{n}</button>
                    ))}
                    <button onClick={() => setInvPage(p => Math.min(invTotalPages, p + 1))} disabled={invPage >= invTotalPages}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRightIcon size={15} /></button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== ÉQUIPES TAB ===== */}
          {activeTab === "Équipes" && (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={eqSearch} onChange={(e) => { setEqSearch(e.target.value); setEqPage(1); }}
                      placeholder="Rechercher une équipe..."
                      className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                  </div>
                  <select value={eqFilterStatut} onChange={(e) => { setEqFilterStatut(e.target.value); setEqPage(1); }}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-violet-400 text-slate-600">
                    <option value="">Tous les statuts</option>
                    <option value="Actif">Actif</option>
                    <option value="En pause">En pause</option>
                  </select>
                  <select value={eqSort} onChange={(e) => setEqSort(e.target.value as typeof eqSort)}
                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm outline-none focus:border-violet-400 text-slate-600">
                    <option value="nom">Trier par nom</option>
                    <option value="charge">Trier par charge</option>
                    <option value="projets">Trier par projets</option>
                  </select>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 p-0.5">
                  <button onClick={() => setEqView("list")} className={`rounded-lg p-1.5 transition ${eqView === "list" ? "bg-violet-100 text-violet-700" : "text-slate-400 hover:text-slate-600"}`} title="Vue liste">
                    <LayoutList size={16} />
                  </button>
                  <button onClick={() => setEqView("grid")} className={`rounded-lg p-1.5 transition ${eqView === "grid" ? "bg-violet-100 text-violet-700" : "text-slate-400 hover:text-slate-600"}`} title="Vue grille">
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Équipe</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Responsable</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Membres</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Projets</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Charge</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Créé par</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eqPaginated.map(eq => {
                      const isSelected = eq.id === selectedEquipeId;
                      const colorClasses = EQUIPE_COLORS[eq.couleur] || "bg-slate-100 text-slate-600";
                      const extraMembres = eq.membres.length > 3 ? eq.membres.length - 3 : 0;
                      const displayMembres = eq.membres.slice(0, 3);
                      const chargeColor = eq.chargeTravail >= 80 ? "bg-red-500" : eq.chargeTravail >= 60 ? "bg-amber-500" : eq.chargeTravail >= 30 ? "bg-violet-500" : "bg-emerald-500";
                      return (
                        <tr key={eq.id} onClick={() => setSelectedEquipeId(eq.id)} className={`cursor-pointer transition-colors ${isSelected ? "bg-violet-50/60" : "hover:bg-slate-50"}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClasses} font-bold text-sm`}>
                                {eq.nom.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{eq.nom}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{eq.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-[10px] font-bold">
                                {(eq.responsable.prenom[0] + eq.responsable.nom[0]).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">{eq.responsable.prenom} {eq.responsable.nom}</p>
                                <p className="text-xs text-slate-400">{eq.responsable.fonction}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              {displayMembres.map((m, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-[8px] font-bold text-violet-600">
                                    {(m.prenom[0] + m.nom[0]).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-medium text-slate-700 truncate">{m.prenom} {m.nom}</span>
                                </div>
                              ))}
                              {extraMembres > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-violet-100 text-[8px] font-bold text-violet-600">+{extraMembres}</div>
                                  <span className="text-xs text-violet-600 font-medium">autre{extraMembres > 1 ? "s" : ""}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600">{eq.projetsCount}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div className={`h-full rounded-full ${chargeColor} transition-all`} style={{ width: `${eq.chargeTravail}%` }} />
                              </div>
                              <span className="text-xs font-bold text-slate-700 min-w-[36px]">{eq.chargeTravail}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                              eq.statut === "Actif" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}>{eq.statut}</span>
                          </td>
                          <td className="px-6 py-4">
                            {eq.creePar ? (
                              <div>
                                <p className="text-xs text-slate-600">{eq.creePar}</p>
                                {eq.creeParEmail && <p className="text-[10px] text-slate-400">{eq.creeParEmail}</p>}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); openEditEquipe(eq); }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-100 hover:text-violet-600 transition" title="Modifier">
                                <Pencil size={14} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDuplicateEquipe(eq); }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-sky-100 hover:text-sky-600 transition" title="Dupliquer">
                                <Copy size={14} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setDeleteEqId(eq.id); setShowDeleteEqConfirm(true); }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 transition" title="Supprimer">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredEquipes.length > eqPerPage && (
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                  <p className="text-xs text-slate-500">
                    {(eqPage - 1) * eqPerPage + 1}&ndash;{Math.min(eqPage * eqPerPage, filteredEquipes.length)} sur {filteredEquipes.length} équipes
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEqPage(p => Math.max(1, p - 1))} disabled={eqPage <= 1}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: eqTotalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setEqPage(p)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${p === eqPage ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{p}</button>
                    ))}
                    <button onClick={() => setEqPage(p => Math.min(eqTotalPages, p + 1))} disabled={eqPage >= eqTotalPages}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Par page</span>
                    <select value={eqPerPage} onChange={(e) => { setEqPerPage(Number(e.target.value)); setEqPage(1); }} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none text-slate-600">
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>
              )}
              {filteredEquipes.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <Building2 size={36} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-500">Aucune équipe trouvée</p>
                </div>
              )}
            </div>
          )}

          {/* ===== RAPPORTS TAB ===== */}
          {activeTab === "Rapports" && (
            <div className="space-y-6">

              {/* Performance Chart */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-slate-900">Performance de l'équipe</h3>
                  <div className="flex items-center gap-2">
                    {["Ce mois", "3 derniers mois", "6 derniers mois", "Cette année"].map(p => (
                      <button key={p} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${p === "6 derniers mois" ? "bg-violet-100 text-violet-700" : "text-slate-500 hover:bg-slate-100"}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rapportPerformance} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Line yAxisId="left" type="monotone" dataKey="productivite" name="Productivité (%)" stroke="#7C3AED" strokeWidth={3} dot={{ fill: "#7C3AED", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                      <Line yAxisId="right" type="monotone" dataKey="taches" name="Tâches terminées" stroke="#10B981" strokeWidth={3} dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Productivity by Team Doughnut */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Productivité par équipe</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-40 h-40 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={rapportTeamProd} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={3} isAnimationActive={false}>
                            {rapportTeamProd.map((entry, i) => (
                              <Cell key={i} fill={entry.couleur} strokeWidth={0} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: "-20px" }}>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-slate-900">{rapportTeamProd.length > 0 ? Math.round(rapportTeamProd.reduce((s, t) => s + t.value, 0) / rapportTeamProd.length) : 0}%</p>
                          <p className="text-[10px] text-slate-400">Moyenne globale</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {rapportTeamProd.map((t) => (
                        <div key={t.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.couleur }} />
                          <span className="text-xs text-slate-600 flex-1">{t.name}</span>
                          <span className="text-xs font-bold text-slate-800">{t.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tasks by Status Doughnut */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Tâches par statut</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-40 h-40 shrink-0 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={rapportTasksByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={3} isAnimationActive={false}>
                            {rapportTasksByStatus.map((entry, i) => (
                              <Cell key={i} fill={entry.couleur} strokeWidth={0} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      <p className="text-xs text-slate-400 mb-2">{reportTasks.length} tâches au total</p>
                      {rapportTasksByStatus.map((t) => (
                        <div key={t.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.couleur }} />
                          <span className="text-xs text-slate-600 flex-1">{t.name}</span>
                          <span className="text-xs font-bold text-slate-800">{t.pct}%</span>
                        </div>
                      ))}
                    </div>
                </div>
              </div>

              {/* AI Generated Report */}
              {generatedReport && (
                <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-md">
                      <Sparkles size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Rapport généré par IA</h3>
                      <p className="text-xs text-slate-400">Généré le {new Date(generatedReport.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{generatedReport.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
                    {/* Strengths */}
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                      <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <CheckCircle size={14} /> Points forts
                      </h4>
                      <ul className="space-y-2">
                        {generatedReport.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risks */}
                    <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                      <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <AlertTriangle size={14} /> Risques détectés
                      </h4>
                      <ul className="space-y-2">
                        {generatedReport.risks.map((r, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                      <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Star size={14} /> Recommandations
                      </h4>
                      <ul className="space-y-2">
                        {generatedReport.recommendations.map((r, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <button onClick={handleGenerateReport} disabled={generating}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/25 hover:opacity-90 disabled:opacity-50 transition">
                      {generating ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />} Régénérer
                    </button>
                  </div>
                </div>
              )}

            </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Activity Timeline */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
                  <h3 className="text-base font-bold text-slate-900 mb-5">Activité récente</h3>
                  <div className="space-y-4">
                    {rapportActivities.map((act) => {
                      const Icon = { CheckCircle, FolderKanban, UserPlus, Shield, UserCheck }[act.icon as "CheckCircle" | "FolderKanban" | "UserPlus" | "Shield" | "UserCheck"] || Activity;
                      return (
                        <div key={act.id} className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${act.color}`}>
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-700">
                              <span className="font-semibold text-slate-800">{act.user}</span> {act.action}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock size={11} className="text-slate-400" />
                              <span className="text-[11px] text-slate-400">{act.time}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                    Voir toute l'activité
                  </button>
                </div>

                {/* Hours Bar Chart */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Heures travaillées</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportTasks.length > 0 ? (() => { const allCreatedAt = reportTasks.map((t: any) => new Date(t.createdAt || t.dateDebut || t.dateFin)).filter(d => !isNaN(d.getTime())); const minDate = new Date(Math.min(...allCreatedAt.map(d => d.getTime()))); const maxDate = new Date(Math.max(...allCreatedAt.map(d => d.getTime()))); const weekCount = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (7*86400000))); return Array.from({length: weekCount}, (_, w) => { const weekStart = new Date(minDate.getTime() + w * 7 * 86400000); const weekEnd = new Date(weekStart.getTime() + 7 * 86400000); const heures = reportTasks.filter(t => { const d = new Date(t.createdAt || t.dateDebut || t.dateFin); return d >= weekStart && d < weekEnd; }).length * 2; return { week: `S${w+1}`, heures }; }); })() : []} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                        <Bar dataKey="heures" name="Heures" radius={[6, 6, 0, 0]} fill="#7C3AED" isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <button className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                    Voir le rapport détaillé
                  </button>
                </div>

              </div>

              {/* Project Progress Table */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Avancement des projets</h3>
                  <button className="text-xs font-medium text-violet-600 hover:text-violet-700">Voir tous les projets →</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Projet</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Équipe</th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Progression</th>
                        <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Tâches terminées</th>
                        <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Date limite</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rapportProjects.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">Aucun projet</td></tr>
                      ) : rapportProjects.map((p, i) => {
                        const pColor = p.progression >= 80 ? "bg-emerald-500" : p.progression >= 50 ? "bg-violet-500" : p.progression >= 30 ? "bg-amber-500" : "bg-red-500";
                        return (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-semibold text-slate-900">{p.projet}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{p.equipe}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 max-w-[200px]">
                                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div className={`h-full rounded-full ${pColor} transition-all`} style={{ width: `${p.progression}%` }} />
                                </div>
                                <span className="text-xs font-bold text-slate-700 min-w-[32px]">{p.progression}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-medium text-slate-700">{p.tachesTerminees}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm text-slate-500">{p.dateLimite}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ===== RIGHT SIDEBAR ===== */}
        <div className="w-full lg:w-80 shrink-0 space-y-5">
          {activeTab === "Membres" && (
            <>
              {/* Widget 1: Team Activity */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Activité de l'équipe</h3>
                <div className="space-y-3">
                  {activities.slice(0, 5).map((act) => {
                    const iconMap: Record<string, React.ReactNode> = {
                      new_member: <UserPlus size={14} className="text-emerald-500" />,
                      active: <Activity size={14} className="text-violet-500" />,
                      invitation: <Mail size={14} className="text-indigo-500" />,
                      role_created: <Shield size={14} className="text-amber-500" />,
                    };
                    return (
                      <div key={act.id} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                          {iconMap[act.type]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{act.user}</span> {act.action}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{act.time ? formatActivity(act.time) : ""}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Widget 2: Role Distribution Doughnut */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Répartition par rôle</h3>
                {roleDistribution.length > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-28 shrink-0" style={{ minWidth: 112, minHeight: 112 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" paddingAngle={2} isAnimationActive={false}>
                            {roleDistribution.map((_, i) => (
                              <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={0} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {roleDistribution.map((r, i) => (
                        <div key={r.name} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                          <span className="text-[11px] text-slate-600 flex-1">{r.name}</span>
                          <span className="text-[11px] font-semibold text-slate-800">{Math.round((r.value / roleDistribution.reduce((a, b) => a + b.value, 0)) * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Widget 3: Recent Members */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Membres récents</h3>
                <div className="space-y-3">
                  {recentMembers.map((m) => (
                    <div key={m._id} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-xs font-bold">
                        {getInitials(m.prenom, m.nom)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{m.prenom} {m.nom}{m.favori && <Star size={10} className="ml-1 inline-block text-amber-500" />}</p>
                        <p className="text-[11px] text-slate-400">{m.role}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {new Date(m.dateEmbauche).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "Invitations" && (
            <>
              {/* Widget 1: Summary */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Résumé des invitations</h3>
                <div className="space-y-3">
                  {[
                    { label: "En attente", value: invKpi.enAttente, color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
                    { label: "Acceptées", value: invKpi.acceptees, color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
                    { label: "Expirées", value: invKpi.expirees, color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500" },
                  ].map(({ label, value, color, bg, dot }) => (
                    <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                        <span className="text-sm text-slate-700">{label}</span>
                      </div>
                      <span className={`text-sm font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget 2: Role Distribution Doughnut */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Invitations par rôle</h3>
                {invRoleDist.length > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-28 shrink-0" style={{ minWidth: 112, minHeight: 112 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={invRoleDist} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" paddingAngle={2} isAnimationActive={false}>
                            {invRoleDist.map((_, i) => (
                              <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth={0} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {invRoleDist.map((r, i) => (
                        <div key={r.name} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                          <span className="text-[11px] text-slate-600 flex-1">{r.name}</span>
                          <span className="text-[11px] font-semibold text-slate-800">{Math.round((r.value / invRoleDist.reduce((a, b) => a + b.value, 0)) * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Widget 3: Recent Activity */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Activité récente</h3>
                <div className="space-y-3">
                  {invRecentActivity.map((inv) => {
                    const actionText = inv.statut === "Acceptée" ? "a accepté l'invitation" : "Invitation envoyée";
                    const timeDiff = Math.floor((Date.now() - new Date(inv.dateEnvoi).getTime()) / (1000 * 60 * 60));
                    const timeText = timeDiff < 24 ? `il y a ${timeDiff}h` : `il y a ${Math.floor(timeDiff / 24)} jour${Math.floor(timeDiff / 24) > 1 ? "s" : ""}`;
                    return (
                      <div key={inv._id} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                          {inv.statut === "Acceptée" ? (
                            <UserCheck size={14} className="text-emerald-500" />
                          ) : (
                            <Send size={14} className="text-indigo-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{inv.prenom} {inv.nom}</span> → {actionText}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{timeText}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Widget 4: Help card */}
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-violet-50 to-purple-50 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <HelpCircle size={24} className="text-violet-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Vous avez besoin d'aide ?</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Consultez notre centre d'aide pour en savoir plus sur la gestion des invitations et des membres.
                </p>
                <button className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-medium text-white hover:opacity-90 transition">
                  <HelpCircle size={14} /> Centre d'aide
                </button>
              </div>
            </>
          )}

          {activeTab === "Équipes" && (() => {
            const eq = equipes.find(e => e.id === selectedEquipeId);
            if (!eq || equipes.length === 0) return (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center">
                <Building2 size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500">Aucune équipe sélectionnée</p>
              </div>
            );
            const colorClasses = EQUIPE_COLORS[eq.couleur] || "bg-slate-100 text-slate-600";
            return (
              <div className="space-y-5">

                {/* Team Details */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses} font-bold text-lg shadow-sm`}>
                      {eq.nom.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{eq.nom}</h3>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold mt-1 ${
                        eq.statut === "Actif" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>{eq.statut}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">{eq.description}</p>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Responsable</p>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-[9px] font-bold">
                          {(eq.responsable.prenom[0] + eq.responsable.nom[0]).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-slate-700">{eq.responsable.prenom} {eq.responsable.nom}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Créé le</p>
                      <p className="text-sm font-medium text-slate-700">{new Date(eq.dateCreation).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Créé par</p>
                      {eq.creePar ? (
                        <div>
                          <p className="text-sm font-medium text-slate-700">{eq.creePar}</p>
                          {eq.creeParEmail && <p className="text-[10px] text-slate-400">{eq.creeParEmail}</p>}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">—</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Membres ({eq.membres.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {eq.membres.map((m, i) => (
                          <div key={i} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-[7px] font-bold text-violet-600">
                              {(m.prenom[0] + m.nom[0]).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-slate-700">{m.prenom} {m.nom}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Projets</p>
                      <p className="text-sm font-bold text-slate-700">{eq.projetsCount}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-5">Activité récente</h3>
                  <div className="space-y-4">
                    {activities.slice(0, 4).map(act => (
                      <div key={act.id} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-[10px] font-bold">
                          {act.user.split(" ").map((s: string) => s[0]).join("").toUpperCase().slice(0, 2) || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-700">
                            <span className="font-semibold text-slate-800">{act.user}</span> {act.action}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock size={11} className="text-slate-400" />
                            <span className="text-[11px] text-slate-400">{act.time ? formatActivity(act.time) : ""}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                    Voir toute l'activité
                  </button>
                </div>

              </div>
            );
          })()}

          {activeTab === "Rapports" && (
            <div className="space-y-5">

              {/* Summary Card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Résumé du mois</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Jours travaillés</span>
                    <span className="text-sm font-bold text-slate-800">22/22</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Tâches par membre</span>
                    <span className="text-sm font-bold text-slate-800">10.5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Taux d'achèvement</span>
                    <span className="text-sm font-bold text-slate-800">87%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Projets livrés</span>
                    <span className="text-sm font-bold text-slate-800">4</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Score global</span>
                    <span className="text-sm font-bold text-violet-600">A-</span>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Meilleurs performers</h3>
                <div className="space-y-3">
                  {[
                    { name: "Omayma Hoimdi", tasks: 48, initials: "OH" },
                    { name: "John Doe", tasks: 42, initials: "JD" },
                    { name: "Jane Smith", tasks: 38, initials: "JS" },
                  ].map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-xs font-bold">
                        {p.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                        <p className="text-[11px] text-slate-400">{p.tasks} tâches</p>
                      </div>
                      <span className="text-xs font-bold text-violet-600">#{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Reports */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Rapports rapides</h3>
                <div className="space-y-2">
                  {[
                    { label: "Performance de l'équipe", icon: BarChart3 },
                    { label: "Productivité par rôle", icon: Shield },
                    { label: "Taux d'achèvement", icon: CheckCircle },
                  ].map(({ label, icon: Icon }) => (
                    <button key={label} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition">
                      <Icon size={15} className="text-slate-400" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Activité tab is rendered below, outside the flex-row wrapper */}

        </div>
      </div>

      {/* ===== ACTIVITÉ TAB (comme projets) ===== */}
      {activeTab === "Activité" && (
        <div className="flex gap-6">
          {/* Main timeline */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Filters */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={actFilterType} onChange={(e) => { setActFilterType(e.target.value); setActPage(1); }}
                    className="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs outline-none focus:border-violet-400 appearance-none cursor-pointer">
                    <option value="">Toutes les activités</option>
                    <option value="role_created">Création rôle</option>
                    <option value="role_edited">Modification rôle</option>
                    <option value="role_deleted">Suppression rôle</option>
                    <option value="perm_toggled">Permission</option>
                    <option value="perms_saved">Sauvegarde permissions</option>
                  </select>
                </div>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={actFilterMember} onChange={(e) => { setActFilterMember(e.target.value); setActPage(1); }}
                    className="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs outline-none focus:border-violet-400 appearance-none cursor-pointer">
                    <option value="">Tous les membres</option>
                    {[...new Set(roleActivities.map(a => a.userNom))].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <input type="date" value={actDateStart} onChange={(e) => { setActDateStart(e.target.value); setActPage(1); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-violet-400" />
                <span className="text-xs text-slate-400">→</span>
                <input type="date" value={actDateEnd} onChange={(e) => { setActDateEnd(e.target.value); setActPage(1); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-violet-400" />
                <div className="relative flex-1 min-w-[160px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={actSearch} onChange={(e) => { setActSearch(e.target.value); setActPage(1); }}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-violet-400"
                    placeholder="Rechercher une activité..." />
                </div>
                {roleActivities.length > 0 && (
                  <button onClick={() => { if (confirm("Vider l'historique ?")) setRoleActivities([]); }}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                    <Trash2 size={13} /> Vider
                  </button>
                )}
              </div>
            </div>

            {/* Timeline */}
            {actGrouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Activity size={48} className="mb-3 opacity-30" />
                <p className="text-sm font-medium text-slate-500">Aucune activité</p>
                <p className="text-xs text-slate-300 mt-1">Aucune activité ne correspond aux filtres sélectionnés</p>
              </div>
            ) : (
              <div className="space-y-6">
                {actGrouped.map(group => (
                  <div key={group.date}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-slate-100" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{group.label}</span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    <div className="space-y-2">
                      {group.items.map(item => {
                        const badgeStyles: Record<string, string> = {
                          role_created: "bg-emerald-50 text-emerald-700 border-emerald-200",
                          role_edited: "bg-violet-50 text-violet-700 border-violet-200",
                          role_deleted: "bg-red-50 text-red-700 border-red-200",
                          perm_toggled: "bg-orange-50 text-orange-700 border-orange-200",
                          perms_saved: "bg-blue-50 text-blue-700 border-blue-200",
                        };
                        const badgeColors: Record<string, string> = {
                          role_created: "bg-emerald-500", role_edited: "bg-violet-500", role_deleted: "bg-red-500",
                          perm_toggled: "bg-orange-500", perms_saved: "bg-blue-500",
                        };
                        const badgeLabels: Record<string, string> = {
                          role_created: "Rôle créé", role_edited: "Rôle modifié", role_deleted: "Rôle supprimé",
                          perm_toggled: "Permission", perms_saved: "Permissions",
                        };
                        const badgeIcons: Record<string, React.ElementType> = {
                          role_created: Plus, role_edited: Pencil, role_deleted: Trash2,
                          perm_toggled: Lock, perms_saved: Shield,
                        };
                        const BadgeIcon = badgeIcons[item.type] || Activity;
                        const initials = item.userNom.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                        return (
                          <div key={item.id} className="group relative flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
                            <div className="flex flex-col items-center shrink-0">
                              <div className={`h-3 w-3 rounded-full ${badgeColors[item.type] || "bg-slate-400"} ring-4 ring-white shadow-sm`} />
                              <div className="w-px flex-1 bg-slate-100 mt-1" />
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-sm font-bold">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <span className="text-sm font-semibold text-slate-900">{item.userNom}</span>
                                  {item.userEmail && <span className="text-[11px] text-slate-400 ml-1.5">{item.userEmail}</span>}
                                  <span className="text-sm text-slate-600"> {item.message}</span>
                                  {item.project !== "Général" && <p className="text-sm font-medium text-slate-900 mt-0.5">{item.project}</p>}
                                  <p className="text-xs text-slate-500 mt-0.5">{item.userRole}</p>
                                </div>
                                <span className={`shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-medium ${badgeStyles[item.type] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                  <BadgeIcon size={11} /> {badgeLabels[item.type] || "Action"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1.5">{formatDiscussionShortDate(item.date)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {/* Load more */}
                {actHasMore && (
                  <div className="text-center pt-2">
                    <button onClick={() => setActPage(prev => prev + 1)}
                      className="rounded-xl border border-slate-200 px-6 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition">
                      Afficher plus d&apos;activités ({actTotal - actPage * pageSizeActivities} restantes)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="w-72 shrink-0 space-y-4 hidden lg:block">
            {/* Summary */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Résumé des activités</h3>
              <div className="space-y-3">
                {[
                  { label: "Actions totales", value: actSummary.total, icon: Activity, color: "text-violet-600", bg: "bg-violet-50" },
                  { label: "Rôles modifiés", value: actSummary.roles, icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Permissions modifiées", value: actSummary.permissions, icon: Lock, color: "text-orange-600", bg: "bg-orange-50" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`rounded-lg ${bg} p-2 ${color}`}><Icon size={14} /></div>
                      <span className="text-xs text-slate-600">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity by role (donut) */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Activité par rôle</h3>
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie data={actByRole} dataKey="value" cx={50} cy={50} innerRadius={28} outerRadius={45} strokeWidth={0}>
                        {actByRole.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {actByRole.map((m, i) => (
                    <div key={m.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <span className="text-[11px] text-slate-600">{m.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800">{m.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Most frequent */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Activités les plus fréquentes</h3>
              <div className="space-y-3">
                {actFrequent.map(([type, count], i) => {
                  const freqLabels: Record<string, string> = { role_created: "Rôles créés", role_edited: "Rôles modifiés", role_deleted: "Rôles supprimés", perm_toggled: "Permissions togglées", perms_saved: "Permissions sauvegardées" };
                  const freqIcons: Record<string, React.ElementType> = { role_created: Plus, role_edited: Pencil, role_deleted: Trash2, perm_toggled: Lock, perms_saved: Shield };
                  const freqColors: Record<string, string> = { role_created: "text-emerald-600 bg-emerald-50", role_edited: "text-violet-600 bg-violet-50", role_deleted: "text-red-600 bg-red-50", perm_toggled: "text-orange-600 bg-orange-50", perms_saved: "text-blue-600 bg-blue-50" };
                  const FreqIcon = freqIcons[type] || Activity;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 w-4">{i + 1}</span>
                      <div className={`rounded-lg p-1.5 ${freqColors[type] || "text-slate-600 bg-slate-50"}`}><FreqIcon size={12} /></div>
                      <span className="flex-1 text-xs text-slate-600">{freqLabels[type] || type}</span>
                      <span className="text-sm font-bold text-slate-900">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD / EDIT MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? "Modifier le membre" : "Ajouter un membre"}
              </h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {editing && (
                <div className="flex items-center gap-4 pb-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-lg font-bold">
                    {getInitials(editing.prenom, editing.nom)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{editing.prenom} {editing.nom}</p>
                    <p className="text-xs text-slate-400">{editing.email}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Prénom *</label>
                  <input value={memberForm.prenom} onChange={(e) => setMemberForm({ ...memberForm, prenom: e.target.value })} placeholder="Prénom"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 ${formErrors.prenom ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"}`} />
                  {formErrors.prenom && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{formErrors.prenom}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Nom *</label>
                  <input value={memberForm.nom} onChange={(e) => setMemberForm({ ...memberForm, nom: e.target.value })} placeholder="Nom"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 ${formErrors.nom ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"}`} />
                  {formErrors.nom && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{formErrors.nom}</p>}
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Email *</label>
                  <input type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} placeholder="email@exemple.com"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 ${formErrors.email ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"}`} />
                  {formErrors.email && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{formErrors.email}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Rôle *</label>
                  <select value={memberForm.role} onChange={(e) => {
                    const newRole = e.target.value;
                    setMemberForm({ ...memberForm, role: newRole, equipe: newRole === "Client" ? "" : memberForm.equipe });
                  }}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 bg-white ${formErrors.role ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"}`}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {formErrors.role && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{formErrors.role}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Équipe{memberForm.role !== "Client" ? " *" : ""}</label>
                  <select value={memberForm.equipe} onChange={(e) => setMemberForm({ ...memberForm, equipe: e.target.value })}
                    disabled={memberForm.role === "Client"}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 bg-white ${formErrors.equipe ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"} ${memberForm.role === "Client" ? "opacity-50 cursor-not-allowed" : ""}`}>
                    {memberForm.role === "Client" ? <option value="">Non assigné</option> : EQUIPES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {memberForm.role === "Client" && <p className="mt-1 text-xs text-slate-400">Aucune équipe pour un client.</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Statut</label>
                  <select value={memberForm.statut} onChange={(e) => setMemberForm({ ...memberForm, statut: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white text-slate-700">
                    {STATUTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Téléphone *</label>
                  <input value={memberForm.telephone} onChange={(e) => setMemberForm({ ...memberForm, telephone: e.target.value })} placeholder="+216 12 345 678"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 ${formErrors.telephone ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"}`} />
                  {formErrors.telephone && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{formErrors.telephone}</p>}
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Date d&apos;embauche *</label>
                  <input type="date" value={memberForm.dateEmbauche} onChange={(e) => setMemberForm({ ...memberForm, dateEmbauche: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 ${formErrors.dateEmbauche ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"}`} />
                  {formErrors.dateEmbauche && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{formErrors.dateEmbauche}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit"
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2 text-sm font-medium text-white hover:opacity-90">
                  {editing ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== INVITE MODAL ===== */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">{editingInvite ? "Modifier l'invitation" : "Inviter un membre"}</h2>
              <button onClick={() => { setShowInviteModal(false); setInvRecaptchaToken(null); setInvRecaptchaError(false); }} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSendInvite} className="p-6 space-y-5">
              {editingInvite && (
                <div className="flex items-center gap-3 pb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-sm font-bold">
                    {getInitials(editingInvite.prenom, editingInvite.nom)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{editingInvite.prenom} {editingInvite.nom}</p>
                    <p className="text-xs text-slate-400">{editingInvite.email}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Prénom *</label>
                  <input value={invForm.prenom} onChange={(e) => setInvForm({ ...invForm, prenom: e.target.value })} placeholder="Prénom"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 ${invFormErrors.prenom ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"}`} />
                  {invFormErrors.prenom && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{invFormErrors.prenom}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Nom *</label>
                  <input value={invForm.nom} onChange={(e) => setInvForm({ ...invForm, nom: e.target.value })} placeholder="Nom"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 ${invFormErrors.nom ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"}`} />
                  {invFormErrors.nom && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{invFormErrors.nom}</p>}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Adresse email *</label>
                <input type="email" value={invForm.email} onChange={(e) => setInvForm({ ...invForm, email: e.target.value })} placeholder="email@exemple.com"
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 ${invFormErrors.email ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"}`} />
                {invFormErrors.email && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{invFormErrors.email}</p>}
                {!editingInvite && !invFormErrors.email && <p className="mt-1 text-xs text-slate-400">Séparez plusieurs emails par une virgule pour inviter plusieurs membres</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Rôle *</label>
                  <select value={invForm.role} onChange={(e) => {
                    const newRole = e.target.value;
                    setInvForm({ ...invForm, role: newRole, equipe: newRole === "Client" ? "" : invForm.equipe });
                  }}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 bg-white ${invFormErrors.role ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"}`}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {invFormErrors.role && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{invFormErrors.role}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Équipe{invForm.role !== "Client" ? " *" : ""}</label>
                  <select value={invForm.equipe} onChange={(e) => setInvForm({ ...invForm, equipe: e.target.value })}
                    disabled={invForm.role === "Client"}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 bg-white ${invFormErrors.equipe ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"} ${invForm.role === "Client" ? "opacity-50 cursor-not-allowed" : ""}`}>
                    {invForm.role === "Client" ? <option value="">Non assigné</option> : EQUIPES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {invFormErrors.equipe && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{invFormErrors.equipe}</p>}
                  {invForm.role === "Client" && <p className="mt-1 text-xs text-slate-400">Aucune équipe pour un client.</p>}
                </div>
              </div>
              {!editingInvite && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Message personnalisé (optionnel)</label>
                  <textarea rows={3} value={invForm.message} onChange={(e) => setInvForm({ ...invForm, message: e.target.value })} placeholder="Expliquez pourquoi vous invitez cette personne à rejoindre l'agence..."
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 resize-none ${invFormErrors.message ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"}`} />
                  {invFormErrors.message && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{invFormErrors.message}</p>}
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-slate-400">{invForm.message.length}/500</span>
                    {invForm.message.length > 450 && <span className="text-amber-500">Presque à la limite</span>}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-700 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                L'invitation expirera automatiquement après 7 jours.
              </div>
              {!editingInvite && (
                <Recaptcha
                  onVerify={(token) => { setInvRecaptchaToken(token); setInvRecaptchaError(false); }}
                  error={invRecaptchaError}
                />
              )}
              {inviteError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  {inviteError}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowInviteModal(false); setInvRecaptchaToken(null); setInvRecaptchaError(false); }} disabled={sendingInvite}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
                <button type="submit" disabled={sendingInvite}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
                  {sendingInvite ? <><RefreshCw size={14} className="animate-spin" /> Envoi...</> : <><Send size={14} /> {editingInvite ? "Enregistrer" : "Envoyer l'invitation"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== ROLE MODAL ===== */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">{editingRole ? "Modifier le rôle" : "Créer un rôle"}</h2>
              <button onClick={() => setShowRoleModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveRole} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Nom du rôle *</label>
                <input value={roleForm.nom} onChange={(e) => setRoleForm({ ...roleForm, nom: e.target.value })} placeholder="Ex: Designer Senior"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Description</label>
                <textarea rows={3} value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} placeholder="Décrivez les responsabilités de ce rôle..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Type</label>
                <select value={roleForm.type} onChange={(e) => setRoleForm({ ...roleForm, type: e.target.value as RoleItem["type"] })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white text-slate-700">
                  <option value="Système">Système</option>
                  <option value="Personnalisé">Personnalisé</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRoleModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit"
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2 text-sm font-medium text-white hover:opacity-90">
                  {editingRole ? "Enregistrer" : "Créer le rôle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== ÉQUIPE MODAL ===== */}
      {showEquipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">{editingEquipe ? "Modifier l'équipe" : "Créer une équipe"}</h2>
              <button onClick={() => { setShowEquipeModal(false); setEditingEquipe(null); }} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEquipe} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Nom de l'équipe *</label>
                  <input value={equipeForm.nom} onChange={(e) => setEquipeForm({ ...equipeForm, nom: e.target.value })} placeholder="Ex: Développement"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Description</label>
                  <textarea rows={2} value={equipeForm.description} onChange={(e) => setEquipeForm({ ...equipeForm, description: e.target.value })} placeholder="Décrivez l'équipe..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Responsable</label>
                  <select value="" onChange={(e) => {
                    const m = members.find(mem => mem._id === e.target.value);
                    if (m) setEquipeForm({ ...equipeForm, responsablePrenom: m.prenom, responsableNom: m.nom, responsableFonction: m.role });
                  }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white text-slate-700">
                    <option value="">Sélectionner un membre...</option>
                    {members.map(m => <option key={m._id} value={m._id}>{m.prenom} {m.nom} — {m.role}</option>)}
                  </select>
                  {equipeForm.responsablePrenom && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      <span className="font-medium">{equipeForm.responsablePrenom} {equipeForm.responsableNom}</span>
                      <span className="text-slate-400">·</span>
                      <span>{equipeForm.responsableFonction}</span>
                      <button type="button" onClick={() => setEquipeForm({ ...equipeForm, responsablePrenom: "", responsableNom: "", responsableFonction: "" })}
                        className="ml-auto text-xs text-red-500 hover:text-red-700">Effacer</button>
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Membres de l'équipe</label>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 p-2 space-y-1">
                    {members.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">Aucun membre disponible</p>
                    ) : (
                      members.filter(m => !(m.prenom === equipeForm.responsablePrenom && m.nom === equipeForm.responsableNom)).map(m => {
                        const checked = equipeForm.membresIds.includes(m._id);
                        return (
                          <label key={m._id} className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition ${checked ? "bg-violet-50 text-violet-800" : "hover:bg-slate-50 text-slate-700"}`}>
                            <input type="checkbox" checked={checked} onChange={() => {
                              setEquipeForm({
                                ...equipeForm,
                                membresIds: checked
                                  ? equipeForm.membresIds.filter(id => id !== m._id)
                                  : [...equipeForm.membresIds, m._id],
                              });
                            }} className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-xs font-bold text-violet-600 shrink-0">
                              {m.prenom[0]}{m.nom[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{m.prenom} {m.nom}</p>
                              <p className="text-[11px] text-slate-400 truncate">{m.role} · {m.email}</p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                  {equipeForm.membresIds.length > 0 && (
                    <p className="mt-1 text-xs text-slate-400">{equipeForm.membresIds.length} membre{equipeForm.membresIds.length > 1 ? "s" : ""} sélectionné{equipeForm.membresIds.length > 1 ? "s" : ""}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Nombre de projets</label>
                  <input type="number" min={0} value={equipeForm.projetsCount} onChange={(e) => setEquipeForm({ ...equipeForm, projetsCount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Charge de travail (%)</label>
                  <input type="number" min={0} max={100} value={equipeForm.chargeTravail} onChange={(e) => setEquipeForm({ ...equipeForm, chargeTravail: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Statut</label>
                  <select value={equipeForm.statut} onChange={(e) => setEquipeForm({ ...equipeForm, statut: e.target.value as "Actif" | "En pause" })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white text-slate-700">
                    <option value="Actif">Actif</option>
                    <option value="En pause">En pause</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Couleur</label>
                  <select value={equipeForm.couleur} onChange={(e) => setEquipeForm({ ...equipeForm, couleur: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white text-slate-700">
                    {colorKeys.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowEquipeModal(false); setEditingEquipe(null); }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit"
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2 text-sm font-medium text-white hover:opacity-90">
                  {editingEquipe ? "Enregistrer" : "Créer l'équipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE ÉQUIPE CONFIRMATION ===== */}
      {showDeleteEqConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Supprimer l'équipe</h3>
                <p className="text-xs text-slate-500">Cette action est irréversible.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Êtes-vous sûr de vouloir supprimer l'équipe <strong>{equipes.find(e => e.id === deleteEqId)?.nom}</strong> ?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowDeleteEqConfirm(false); setDeleteEqId(null); }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={() => { if (deleteEqId) handleDeleteEquipe(deleteEqId); }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
