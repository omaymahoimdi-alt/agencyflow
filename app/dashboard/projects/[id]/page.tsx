"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Star, FolderKanban, Clock, CheckCircle2,
  MoreHorizontal, Pencil, Share2, Users, Calendar,
  DollarSign, AlertTriangle, BarChart3, FileText,
  MessageSquare, Activity, Briefcase, User, Plus,
  X, CheckSquare, ListTodo, Target, Timer,
  TrendingUp, AlertCircle, MessageCircle, Paperclip,
  LayoutGrid, Building2, Upload, Play, Flag,
  ChevronRight, ChevronLeft, Archive, Search, Filter,
  Tag, ArrowUpDown, LayoutList, Columns3,
  CalendarDays, Eye, Copy, Trash2, Check,
  ChevronDown, AlignJustify, Grid3X3, Palette,
  FlagTriangleRight, ExternalLink, Bell,
  FolderOpen, Download, Move, Star as StarIcon,
  Image, Code, FileSpreadsheet, FileType,
  GripVertical, RotateCcw, Bookmark, SlidersHorizontal,
  Hash, Phone, Pin, Reply, Smile, AtSign, Mic,
  UserCheck, CalendarCheck, UserPlus,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { addToCorbeille } from "@/lib/corbeille";

interface Client { _id: string; nomSociete: string }
interface UserData { _id: string; nom: string; prenom: string }
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
  chefProjetId?: UserData;
  chefProjet?: string;
}

interface Task {
  _id: string;
  titre: string;
  description?: string;
  statut: string;
  priorite: string;
  dateDebut?: string;
  dateFin: string;
  projetId?: string;
  employeId?: { _id: string; nom: string; prenom: string };
  tags?: string[];
  createdAt?: string;
}

interface CalendarEvent {
  _id: string;
  titre: string;
  description?: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  employeId?: string;
  statut?: string;
}

interface DiscussionMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  time: string;
  reactions: { emoji: string; users: string[] }[];
  pinned: boolean;
  edited: boolean;
  parentId?: string;
  attachments?: { type: "image" | "file" | "voice"; name: string; data: string; size?: number }[];
  mentions?: string[];
}

interface DiscussionChannel {
  id: string;
  name: string;
  members: number;
  lastMessage: string;
  lastActivity: string;
  unread: number;
  createdBy: string;
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  owner: string;
  ownerAvatar: string;
  lastModified: string;
  folderId: string;
  favorite: boolean;
  shared: boolean;
  data?: string;
}

interface FolderItem {
  id: string;
  name: string;
  files: FileItem[];
}

const TASK_STATUTS = ["À faire", "En cours", "Terminée", "Bloquée"] as const;
const TASK_STATUT_LABELS: Record<string, string> = {
  "À faire": "À faire",
  "En cours": "En cours",
  "Terminée": "Terminée",
  "Bloquée": "Bloquée",
};
const TASK_STATUT_STYLES: Record<string, string> = {
  "À faire": "bg-slate-50 text-slate-600 border-slate-200",
  "En cours": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Terminée": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Bloquée": "bg-red-50 text-red-700 border-red-200",
};
const TASK_STATUT_BG: Record<string, string> = {
  "À faire": "bg-slate-400",
  "En cours": "bg-indigo-500",
  "Terminée": "bg-emerald-500",
  "Bloquée": "bg-red-500",
};

interface TeamMember {
  _id: string;
  nom: string;
  prenom: string;
  role: string;
  status: string;
}

interface ActivityItem {
  _id: string;
  userId: string;
  action: string;
  createdAt: string;
}

interface ActivityEntry {
  id: string;
  type: "tache" | "fichier" | "commentaire" | "calendrier" | "equipe" | "budget";
  user: string;
  userAvatar: string;
  action: string;
  target: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

const STATUT_STYLES: Record<string, string> = {
  "En attente": "bg-amber-50 text-amber-700 border-amber-200",
  "En cours": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "En test": "bg-violet-50 text-violet-700 border-violet-200",
  "Terminé": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Suspendu": "bg-red-50 text-red-700 border-red-200",
  "Bloqué": "bg-red-50 text-red-700 border-red-200",
  "En pause": "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUT_BG: Record<string, string> = {
  "En attente": "bg-amber-500",
  "En cours": "bg-indigo-500",
  "En test": "bg-violet-500",
  "Terminé": "bg-emerald-500",
  "Suspendu": "bg-red-500",
  "Bloqué": "bg-red-500",
  "En pause": "bg-amber-500",
};

const PRIORITE_STYLES: Record<string, string> = {
  Faible: "bg-slate-50 text-slate-600 border-slate-200",
  Moyenne: "bg-blue-50 text-blue-700 border-blue-200",
  Haute: "bg-orange-50 text-orange-700 border-orange-200",
  Urgente: "bg-red-50 text-red-700 border-red-200",
};

const PRIORITE_BG: Record<string, string> = {
  Faible: "bg-slate-500",
  Moyenne: "bg-blue-500",
  Haute: "bg-orange-500",
  Urgente: "bg-red-500",
};

const KANBAN_COLUMNS = [
  { key: "À faire", label: "À faire", color: "border-t-slate-400" },
  { key: "En cours", label: "En cours", color: "border-t-indigo-400" },
  { key: "Validation", label: "Validation", color: "border-t-violet-400" },
  { key: "Terminé", label: "Terminé", color: "border-t-emerald-400" },
];

const TABS = [
  "Vue d'ensemble", "Tâches", "Kanban",
  "Calendrier", "Fichiers", "Discussions", "Activités",
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Vue d'ensemble");
  const [favorited, setFavorited] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Tasks tab state
  const [taskTab, setTaskTab] = useState("Toutes les tâches");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskFilterStatut, setTaskFilterStatut] = useState("");
  const [taskFilterPriorite, setTaskFilterPriorite] = useState("");
  const [taskFilterAssignee, setTaskFilterAssignee] = useState("");
  const [taskFilterTag, setTaskFilterTag] = useState("");
  const [taskSortBy, setTaskSortBy] = useState("dateFin");
  const [taskViewMode, setTaskViewMode] = useState<"table" | "kanban" | "calendar">("table");
  const [taskPage, setTaskPage] = useState(1);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [taskContextMenu, setTaskContextMenu] = useState<string | null>(null);
  const allSelected = tasks.length > 0 && selectedTasks.size === tasks.length;

  const pageSize = 10;

  const taskFiltered = useMemo(() => {
    let result = [...tasks];
    const q = taskSearch.toLowerCase();
    if (q) result = result.filter(t => t.titre.toLowerCase().includes(q));
    if (taskFilterStatut) result = result.filter(t => t.statut === taskFilterStatut);
    if (taskFilterPriorite) result = result.filter(t => t.priorite === taskFilterPriorite);
    if (taskFilterAssignee) result = result.filter(t => t.employeId?._id === taskFilterAssignee);
    if (taskFilterTag) result = result.filter(t => t.tags?.includes(taskFilterTag));
    if (taskTab === "Mes tâches") result = result.filter(t => t.employeId?._id === "me");
    if (taskTab === "Tâches terminées") result = result.filter(t => t.statut === "Terminé");
    result.sort((a, b) => {
      if (taskSortBy === "dateFin") { const da = a.dateFin ? new Date(a.dateFin).getTime() : Infinity; const db = b.dateFin ? new Date(b.dateFin).getTime() : Infinity; return da - db; }
      if (taskSortBy === "titre") return a.titre.localeCompare(b.titre);
      if (taskSortBy === "priorite") { const order = ["Faible", "Moyenne", "Haute", "Urgente"]; return order.indexOf(a.priorite) - order.indexOf(b.priorite); }
      return 0;
    });
    return result;
  }, [tasks, taskSearch, taskFilterStatut, taskFilterPriorite, taskFilterAssignee, taskFilterTag, taskSortBy, taskTab]);

  const taskTotalPages = Math.max(1, Math.ceil(taskFiltered.length / pageSize));
  const taskPaginated = taskFiltered.slice((taskPage - 1) * pageSize, taskPage * pageSize);

  const taskKpi = useMemo(() => ({
    total: tasks.length,
    aFaire: tasks.filter(t => t.statut === "À faire").length,
    enCours: tasks.filter(t => t.statut === "En cours").length,
    enRevue: tasks.filter(t => t.statut === "En test" || t.statut === "Validation").length,
    terminees: tasks.filter(t => t.statut === "Terminée").length,
    bloquees: tasks.filter(t => t.statut === "Bloquée").length,
  }), [tasks]);

  function toggleSelectAll() {
    if (allSelected) setSelectedTasks(new Set());
    else setSelectedTasks(new Set(tasks.map(t => t._id)));
  }

  function toggleSelect(id: string) {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function getTaskProgress(statut: string) {
    switch (statut) {
      case "Terminée": return 100;
      case "En test":
      case "Validation": return 75;
      case "En cours": return 40;
      case "À faire": return 0;
      case "Bloquée": return 10;
      default: return 0;
    }
  }

  function formatTaskDate(dateStr: string) {
    if (!dateStr) return { date: "—", label: "" };
    const d = new Date(dateStr);
    const now = Date.now();
    const diff = d.getTime() - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const formatted = d.toLocaleDateString("fr-FR");
    if (days < 0) return { date: formatted, label: `En retard de ${Math.abs(days)}j`, overdue: true };
    if (days === 0) return { date: formatted, label: "Aujourd'hui", urgent: true };
    if (days <= 2) return { date: formatted, label: `Dans ${days}j`, urgent: true };
    return { date: formatted, label: `Dans ${days}j` };
  }

  // Task CRUD state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [taskFormErrors, setTaskFormErrors] = useState<Record<string, string>>({});
  const emptyTaskForm = { titre: "", description: "", statut: "À faire" as const, priorite: "Moyenne" as const, dateDebut: "", dateFin: "", employeId: "" };
  const [taskForm, setTaskForm] = useState(emptyTaskForm);

  // Calendar state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calDate, setCalDate] = useState(new Date());
  const [calViewMode, setCalViewMode] = useState<"month" | "week" | "day">("month");
  const [calSelectedDate, setCalSelectedDate] = useState("");
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const emptyEventForm = { titre: "", description: "", type: "Réunion", dateDebut: "", dateFin: "", employeId: "" };
  const [eventForm, setEventForm] = useState(emptyEventForm);

  const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();
  const calendarDays = useMemo(() => {
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const result: number[] = [];
    for (let i = 0; i < offset; i++) result.push(0);
    for (let i = 1; i <= daysInMonth; i++) result.push(i);
    while (result.length % 7 !== 0) result.push(0);
    return result;
  }, [firstDayOfMonth, daysInMonth]);

  // File management state
  const [fileSearch, setFileSearch] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [fileMemberFilter, setFileMemberFilter] = useState("");
  const [fileSort, setFileSort] = useState("recent");
  const [fileViewMode, setFileViewMode] = useState<"list" | "grid">("list");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["fold-1", "fold-2"]));
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [fileContextMenu, setFileContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);
  const [fileDragOverFolder, setFileDragOverFolder] = useState<string | null>(null);
  const [filePage, setFilePage] = useState(1);
  const filePageSize = 10;
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [fileUploadFolder, setFileUploadFolder] = useState("fold-3");
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showFilePreview, setShowFilePreview] = useState<string | null>(null);
  const [fileRenameId, setFileRenameId] = useState<string | null>(null);
  const [fileRenameValue, setFileRenameValue] = useState("");
  const [extraFilterOpen, setExtraFilterOpen] = useState(false);
  const [extraFilters, setExtraFilters] = useState({ favorites: false, shared: false, recent: false, archived: false });

  const defaultChannels: DiscussionChannel[] = [
    { id: "ch-1", name: "Général", members: 8, lastMessage: "Parfait, je m'en occupe aujourd'hui", lastActivity: "2026-06-28T09:30:00", unread: 3, createdBy: "Omayma Hoimdi" },
    { id: "ch-2", name: "Développement", members: 5, lastMessage: "La PR est prête pour review", lastActivity: "2026-06-28T08:45:00", unread: 1, createdBy: "Mohamed Salah" },
    { id: "ch-3", name: "Design UI/UX", members: 4, lastMessage: "Nouveau mockup page profil", lastActivity: "2026-06-27T16:20:00", unread: 0, createdBy: "John Smith" },
    { id: "ch-4", name: "Réunion client", members: 6, lastMessage: "RDV confirmé pour jeudi 15h", lastActivity: "2026-06-27T14:00:00", unread: 5, createdBy: "Omayma Hoimdi" },
    { id: "ch-5", name: "Déploiement", members: 3, lastMessage: "Build v2.1.0 déployé sur staging", lastActivity: "2026-06-26T11:10:00", unread: 0, createdBy: "Mohamed Salah" },
  ];

  const defaultMessages: DiscussionMessage[] = [
    { id: "dm-1", channelId: "ch-1", userId: "user-1", userName: "Omayma Hoimdi", userAvatar: "OH", content: "Bonjour à tous ! Comment avance le projet ?", time: "2026-06-28T09:00:00", reactions: [{ emoji: "👍", users: ["user-2"] }, { emoji: "❤️", users: ["user-3"] }], pinned: false, edited: false },
    { id: "dm-2", channelId: "ch-1", userId: "user-2", userName: "Mohamed Salah", userAvatar: "MS", content: "La partie backend est presque terminée, il reste quelques endpoints à finaliser.", time: "2026-06-28T09:05:00", reactions: [{ emoji: "😊", users: ["user-1"] }], pinned: false, edited: false },
    { id: "dm-3", channelId: "ch-1", userId: "user-3", userName: "John Smith", userAvatar: "JS", content: "Côté design, j'ai terminé les maquettes pour la page tableau de bord.", time: "2026-06-28T09:10:00", reactions: [], pinned: false, edited: false },
    { id: "dm-4", channelId: "ch-1", userId: "user-1", userName: "Omayma Hoimdi", userAvatar: "OH", content: "Super ! Est-ce qu'on peut faire une réunion pour synchroniser tout ça ?", time: "2026-06-28T09:15:00", reactions: [{ emoji: "👍", users: ["user-2", "user-3"] }], pinned: true, edited: false },
    { id: "dm-5", channelId: "ch-1", userId: "user-2", userName: "Mohamed Salah", userAvatar: "MS", content: "Bonne idée. Je propose mercredi matin à 10h.", time: "2026-06-28T09:20:00", reactions: [], pinned: false, edited: false },
    { id: "dm-6", channelId: "ch-1", userId: "user-3", userName: "John Smith", userAvatar: "JS", content: "Ca me va. J'aurai fini les maquettes d'ici là.", time: "2026-06-28T09:25:00", reactions: [], pinned: false, edited: false },
    { id: "dm-7", channelId: "ch-1", userId: "user-1", userName: "Omayma Hoimdi", userAvatar: "OH", content: "Parfait, je m'en occupe aujourd'hui", time: "2026-06-28T09:30:00", reactions: [{ emoji: "😊", users: ["user-2", "user-3"] }], pinned: false, edited: false },
    { id: "dm-8", channelId: "ch-2", userId: "user-2", userName: "Mohamed Salah", userAvatar: "MS", content: "J'ai pushé les dernières modifications sur la branche develop.", time: "2026-06-28T08:30:00", reactions: [], pinned: false, edited: false },
    { id: "dm-9", channelId: "ch-2", userId: "user-1", userName: "Omayma Hoimdi", userAvatar: "OH", content: "Je vais review le code aujourd'hui.", time: "2026-06-28T08:35:00", reactions: [{ emoji: "👍", users: ["user-2"] }], pinned: false, edited: false },
    { id: "dm-10", channelId: "ch-2", userId: "user-2", userName: "Mohamed Salah", userAvatar: "MS", content: "La PR est prête pour review", time: "2026-06-28T08:45:00", reactions: [], pinned: false, edited: false },
    { id: "dm-11", channelId: "ch-3", userId: "user-3", userName: "John Smith", userAvatar: "JS", content: "J'ai mis à jour le design system avec les nouvelles couleurs.", time: "2026-06-27T15:00:00", reactions: [{ emoji: "❤️", users: ["user-1"] }], pinned: false, edited: false },
    { id: "dm-12", channelId: "ch-3", userId: "user-1", userName: "Omayma Hoimdi", userAvatar: "OH", content: "Très beau travail ! Les couleurs sont parfaites.", time: "2026-06-27T15:30:00", reactions: [], pinned: false, edited: false },
    { id: "dm-13", channelId: "ch-3", userId: "user-3", userName: "John Smith", userAvatar: "JS", content: "Nouveau mockup page profil", time: "2026-06-27T16:20:00", reactions: [{ emoji: "👍", users: ["user-1", "user-2"] }], pinned: true, edited: false },
    { id: "dm-14", channelId: "ch-4", userId: "user-1", userName: "Omayma Hoimdi", userAvatar: "OH", content: "Le client a confirmé la réunion de jeudi.", time: "2026-06-27T13:00:00", reactions: [], pinned: false, edited: false },
    { id: "dm-15", channelId: "ch-4", userId: "user-2", userName: "Mohamed Salah", userAvatar: "MS", content: "Je prépare la présentation pour jeudi.", time: "2026-06-27T13:30:00", reactions: [], pinned: false, edited: false },
    { id: "dm-16", channelId: "ch-4", userId: "user-3", userName: "John Smith", userAvatar: "JS", content: "RDV confirmé pour jeudi 15h", time: "2026-06-27T14:00:00", reactions: [{ emoji: "👍", users: ["user-1"] }], pinned: false, edited: false },
    { id: "dm-17", channelId: "ch-5", userId: "user-2", userName: "Mohamed Salah", userAvatar: "MS", content: "Le pipeline CI/CD est opérationnel.", time: "2026-06-26T10:00:00", reactions: [], pinned: false, edited: false },
    { id: "dm-18", channelId: "ch-5", userId: "user-1", userName: "Omayma Hoimdi", userAvatar: "OH", content: "Super ! On peut envisager un déploiement vendredi.", time: "2026-06-26T10:30:00", reactions: [{ emoji: "👍", users: ["user-2"] }], pinned: false, edited: false },
    { id: "dm-19", channelId: "ch-5", userId: "user-2", userName: "Mohamed Salah", userAvatar: "MS", content: "Build v2.1.0 déployé sur staging", time: "2026-06-26T11:10:00", reactions: [{ emoji: "🎉", users: ["user-1", "user-3"] }], pinned: false, edited: false },
  ];

  function loadChannels(): DiscussionChannel[] {
    try { const saved = localStorage.getItem("agencyflow_channels_" + id); if (saved) return JSON.parse(saved); } catch {}
    return defaultChannels;
  }
  function loadMessages(): DiscussionMessage[] {
    try { const saved = localStorage.getItem("agencyflow_messages_" + id); if (saved) return JSON.parse(saved); } catch {}
    return defaultMessages;
  }

  const [channels, setChannels] = useState<DiscussionChannel[]>(loadChannels);
  const [messages, setMessages] = useState<DiscussionMessage[]>(loadMessages);
  const [activeChannel, setActiveChannel] = useState("ch-1");
  const [channelSearch, setChannelSearch] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [channelMenu, setChannelMenu] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<{ type: "image" | "file" | "voice"; name: string; data: string; size: number }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [toxicAlert, setToxicAlert] = useState<string | null>(null);
  const [toxicityChecking, setToxicityChecking] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const defaultFolders: FolderItem[] = [
    {
      id: "fold-1", name: "01. Analyse",
      files: [
        { id: "f1", name: "Cahier des charges", type: "PDF", size: 2450000, owner: "Omayma Hoimdi", ownerAvatar: "OH", lastModified: "2026-06-25T10:30:00", folderId: "fold-1", favorite: true, shared: false },
        { id: "f2", name: "Benchmark concurrents", type: "PDF", size: 1800000, owner: "Mohamed Salah", ownerAvatar: "MS", lastModified: "2026-06-24T14:00:00", folderId: "fold-1", favorite: false, shared: true },
        { id: "f3", name: "Spécifications fonctionnelles", type: "DOCX", size: 3200000, owner: "Omayma Hoimdi", ownerAvatar: "OH", lastModified: "2026-06-23T09:15:00", folderId: "fold-1", favorite: false, shared: false },
      ],
    },
    {
      id: "fold-2", name: "02. Conception",
      files: [
        { id: "f4", name: "Maquettes Figma", type: "FIG", size: 5600000, owner: "John Smith", ownerAvatar: "JS", lastModified: "2026-06-22T16:45:00", folderId: "fold-2", favorite: true, shared: false },
        { id: "f5", name: "Design System", type: "FIG", size: 4200000, owner: "Omayma Hoimdi", ownerAvatar: "OH", lastModified: "2026-06-21T11:30:00", folderId: "fold-2", favorite: false, shared: true },
        { id: "f6", name: "Wireframes", type: "PDF", size: 1500000, owner: "John Smith", ownerAvatar: "JS", lastModified: "2026-06-20T08:00:00", folderId: "fold-2", favorite: false, shared: false },
        { id: "f7", name: "User Flow", type: "PNG", size: 890000, owner: "Mohamed Salah", ownerAvatar: "MS", lastModified: "2026-06-19T15:20:00", folderId: "fold-2", favorite: false, shared: false },
      ],
    },
    {
      id: "fold-3", name: "03. Développement",
      files: [
        { id: "f8", name: "Structure projet", type: "ZIP", size: 12000000, owner: "Mohamed Salah", ownerAvatar: "MS", lastModified: "2026-06-18T10:00:00", folderId: "fold-3", favorite: false, shared: false },
        { id: "f9", name: "API Documentation", type: "PDF", size: 980000, owner: "Omayma Hoimdi", ownerAvatar: "OH", lastModified: "2026-06-17T14:30:00", folderId: "fold-3", favorite: true, shared: true },
        { id: "f10", name: "Variables d'environnement", type: "DOCX", size: 450000, owner: "John Smith", ownerAvatar: "JS", lastModified: "2026-06-16T09:00:00", folderId: "fold-3", favorite: false, shared: false },
        { id: "f11", name: "Architecture technique", type: "PDF", size: 2100000, owner: "Omayma Hoimdi", ownerAvatar: "OH", lastModified: "2026-06-15T11:45:00", folderId: "fold-3", favorite: false, shared: false },
        { id: "f12", name: "Rapport Lighthouse", type: "PDF", size: 1200000, owner: "Mohamed Salah", ownerAvatar: "MS", lastModified: "2026-06-14T16:00:00", folderId: "fold-3", favorite: false, shared: false },
      ],
    },
    {
      id: "fold-4", name: "04. Tests",
      files: [
        { id: "f13", name: "Plan de test", type: "XLSX", size: 880000, owner: "John Smith", ownerAvatar: "JS", lastModified: "2026-06-13T08:30:00", folderId: "fold-4", favorite: false, shared: false },
        { id: "f14", name: "Rapport de bugs", type: "XLSX", size: 650000, owner: "Omayma Hoimdi", ownerAvatar: "OH", lastModified: "2026-06-12T13:15:00", folderId: "fold-4", favorite: true, shared: true },
      ],
    },
    {
      id: "fold-5", name: "05. Déploiement",
      files: [
        { id: "f15", name: "Procédure déploiement", type: "DOCX", size: 780000, owner: "Omayma Hoimdi", ownerAvatar: "OH", lastModified: "2026-06-11T10:00:00", folderId: "fold-5", favorite: false, shared: false },
        { id: "f16", name: "Build production", type: "ZIP", size: 25000000, owner: "Mohamed Salah", ownerAvatar: "MS", lastModified: "2026-06-10T17:30:00", folderId: "fold-5", favorite: false, shared: false },
      ],
    },
    {
      id: "fold-6", name: "06. Documentation",
      files: [
        { id: "f17", name: "Guide utilisateur", type: "PDF", size: 3400000, owner: "John Smith", ownerAvatar: "JS", lastModified: "2026-06-09T09:00:00", folderId: "fold-6", favorite: true, shared: false },
        { id: "f18", name: "Présentation client", type: "PPTX", size: 8700000, owner: "Omayma Hoimdi", ownerAvatar: "OH", lastModified: "2026-06-08T14:30:00", folderId: "fold-6", favorite: false, shared: true },
        { id: "f19", name: "Logo marque", type: "PNG", size: 240000, owner: "John Smith", ownerAvatar: "JS", lastModified: "2026-06-07T11:00:00", folderId: "fold-6", favorite: false, shared: false },
      ],
    },
  ];

  function loadFolders(): FolderItem[] {
    try {
      const saved = localStorage.getItem("agencyflow_folders_" + id);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultFolders;
  }

  const [folders, setFolders] = useState<FolderItem[]>(loadFolders);

  useEffect(() => {
    try { localStorage.setItem("agencyflow_folders_" + id, JSON.stringify(folders)); } catch {}
  }, [folders, id]);

  useEffect(() => {
    try { localStorage.setItem("agencyflow_channels_" + id, JSON.stringify(channels)); } catch {}
  }, [channels, id]);

  useEffect(() => {
    try { localStorage.setItem("agencyflow_messages_" + id, JSON.stringify(messages)); } catch {}
  }, [messages, id]);

  function getFileIcon(type: string) {
    const icons: Record<string, any> = { PDF: FileText, DOCX: FileText, PPTX: FileText, ZIP: FileText, JPG: Image, PNG: Image, FIG: Palette, XLSX: FileSpreadsheet };
    return icons[type] || FileText;
  }

  function getFileColor(type: string) {
    const colors: Record<string, string> = {
      PDF: "text-red-500 bg-red-50", DOCX: "text-blue-500 bg-blue-50", PPTX: "text-orange-500 bg-orange-50",
      ZIP: "text-amber-500 bg-amber-50", JPG: "text-emerald-500 bg-emerald-50", PNG: "text-emerald-500 bg-emerald-50",
      FIG: "text-violet-500 bg-violet-50", XLSX: "text-emerald-500 bg-emerald-50",
    };
    return colors[type] || "text-slate-500 bg-slate-50";
  }

  function formatFileSize(bytes: number) {
    if (bytes >= 1000000) return (bytes / 1000000).toFixed(1) + " Mo";
    if (bytes >= 1000) return (bytes / 1000).toFixed(0) + " Ko";
    return bytes + " o";
  }

  function formatFileDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return "Il y a " + Math.round(diff / 60000) + " min";
    if (diff < 86400000) return "Aujourd'hui";
    if (diff < 172800000) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function formatDiscussionTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return "Il y a " + Math.round(diff / 60000) + " min";
    if (diff < 86400000) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    if (diff < 172800000) return "Hier " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  function formatDiscussionShortDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  async function checkToxicity(text: string): Promise<{ toxic: boolean; method: string }> {
    try {
      const res = await fetch("http://127.0.0.1:5000/check_toxicity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: AbortSignal.timeout(3000),
      });
      return await res.json();
    } catch {
      return { toxic: false, method: "skip" };
    }
  }

  async function handleSendMessage() {
    const content = messageInput.trim();
    if (!content && pendingAttachments.length === 0) return;
    if (!activeChannel) return;
    if (toxicityChecking) return;

    setToxicityChecking(true);
    const result = await checkToxicity(content);
    setToxicityChecking(false);

    if (result.toxic) {
      setToxicAlert("Message bloqué : contenu toxique détecté.");
      setTimeout(() => setToxicAlert(null), 4000);
      return;
    }

    const msg: DiscussionMessage = {
      id: "dm-" + Date.now(),
      channelId: activeChannel,
      userId: "user-1",
      userName: "Omayma Hoimdi",
      userAvatar: "OH",
      content,
      time: new Date().toISOString(),
      reactions: [],
      pinned: false,
      edited: false,
      parentId: replyToId || undefined,
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
    };
    setMessages(prev => [...prev, msg]);
    const preview = content || (pendingAttachments[0]?.type === "image" ? "📷 Image" : pendingAttachments[0]?.type === "voice" ? "🎤 Message vocal" : "📎 Fichier");
    setChannels(prev => prev.map(ch => ch.id === activeChannel ? { ...ch, lastMessage: preview, lastActivity: new Date().toISOString(), unread: 0 } : ch));
    setMessageInput("");
    setReplyToId(null);
    setPendingAttachments([]);
  }

  const EMOJIS = ["😀","😂","😍","🥰","😎","🤔","😊","👍","❤️","🎉","🔥","🚀","💡","✅","❌","⭐","🎯","💪","🙏","👏","😅","🤩","😢","😡","🤗","😱","🥳","😴","🤯","😈","💀","☀️","🌈","⚡","💎","🎵","🎶","📌","💼","📁","📊","📈","📉","🗂️","📝","✏️","🖊️","📎","🔗","🔒","🔓","💬","🗨️","📧","📅","📆","⏰","🕐","🔄","🔝","📌","📍","🎯","🏆","🥇","🥈","🥉","🏅","🎖️","📚","🖥️","💻","📱","🖨️","🔧","⚙️","🛠️","🔨","🧰","📡","🎤","🔊","🔇","🎧","📷","🎥","🎬","✂️","📏","🧩","♟️","🎲","🎭","🎨","🧵","🧶","🌐","📋","📌","📎","🖇️","🔗"];

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        const type = file.type.startsWith("image/") ? "image" : "file";
        setPendingAttachments(prev => [...prev, { type: type as "image" | "file", name: file.name, data, size: file.size }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveAttachment(index: number) {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  }

  function insertEmoji(emoji: string) {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  }

  function handleMentionSelect(name: string) {
    setMessageInput(prev => {
      const atIdx = prev.lastIndexOf("@");
      if (atIdx === -1) return prev + "@" + name + " ";
      return prev.slice(0, atIdx) + "@" + name + " ";
    });
    setShowMentionPicker(false);
    setMentionSearch("");
  }

  function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) { alert("Enregistrement vocal non supporté"); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          const data = reader.result as string;
          setPendingAttachments(prev => [...prev, { type: "voice", name: "Message vocal.webm", data, size: blob.size }]);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
        setAudioBlob(null);
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }).catch(() => { alert("Permission micro nécessaire"); });
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  function formatRecordingTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  const teamForMentions = useMemo(() => {
    if (team.length > 0) return team;
    return [
      { _id: "user-1", nom: "Hoimdi", prenom: "Omayma", role: "Chef de projet", status: "actif" },
      { _id: "user-2", nom: "Salah", prenom: "Mohamed", role: "Développeur", status: "actif" },
      { _id: "user-3", nom: "Smith", prenom: "John", role: "Designer", status: "actif" },
    ];
  }, [team]);

  const filteredMentions = useMemo(() => {
    if (!mentionSearch) return teamForMentions;
    const q = mentionSearch.toLowerCase();
    return teamForMentions.filter(m => (m.prenom + " " + m.nom).toLowerCase().includes(q));
  }, [teamForMentions, mentionSearch]);

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!toxicityChecking) handleSendMessage(); return; }
    if (e.key === "@") {
      setShowMentionPicker(true);
      setMentionSearch("");
    }
    const val = (e.target as HTMLTextAreaElement).value;
    const atIdx = val.lastIndexOf("@");
    if (atIdx !== -1 && val.length > atIdx) {
      const after = val.slice(atIdx + 1);
      if (!after.includes(" ")) { setShowMentionPicker(true); setMentionSearch(after); }
      else { setShowMentionPicker(false); }
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setMessageInput(val);
    const atIdx = val.lastIndexOf("@");
    if (atIdx !== -1 && val.length > atIdx) {
      const after = val.slice(atIdx + 1);
      if (!after.includes(" ")) { setShowMentionPicker(true); setMentionSearch(after); }
      else { setShowMentionPicker(false); }
    } else if (!val.includes("@")) { setShowMentionPicker(false); }
  }

  function handleEditMessage(msgId: string) {
    const content = editMessageContent.trim();
    if (!content) { setEditingMessageId(null); return; }
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content, edited: true } : m));
    setEditingMessageId(null);
  }

  function handleDeleteMessage(msgId: string) {
    if (!confirm("Supprimer ce message ?")) return;
    setMessages(prev => prev.filter(m => m.id !== msgId));
  }

  function handleTogglePin(msgId: string) {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, pinned: !m.pinned } : m));
  }

  function handleToggleReaction(msgId: string, emoji: string) {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const existing = m.reactions.find(r => r.emoji === emoji);
      if (existing) {
        if (existing.users.includes("user-1")) {
          const updated = existing.users.filter(u => u !== "user-1");
          return { ...m, reactions: updated.length ? m.reactions.map(r => r.emoji === emoji ? { ...r, users: updated } : r) : m.reactions.filter(r => r.emoji !== emoji) };
        }
        return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, users: [...r.users, "user-1"] } : r) };
      }
      return { ...m, reactions: [...m.reactions, { emoji, users: ["user-1"] }] };
    }));
  }

  const filteredChannels = useMemo(() => {
    if (!channelSearch) return channels;
    const q = channelSearch.toLowerCase();
    return channels.filter(ch => ch.name.toLowerCase().includes(q));
  }, [channels, channelSearch]);

  const channelMessages = useMemo(() => {
    return messages.filter(m => m.channelId === activeChannel && !m.parentId);
  }, [messages, activeChannel]);

  function getReplies(msgId: string) {
    return messages.filter(m => m.parentId === msgId);
  }

  const activeChannelData = channels.find(ch => ch.id === activeChannel);

  const allFiles = useMemo(() => folders.flatMap(f => f.files.map(fi => ({ ...fi, folderName: f.name }))), [folders]);

  // Activity state
  const [activityFilterType, setActivityFilterType] = useState("");
  const [activityFilterMember, setActivityFilterMember] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [activityDateStart, setActivityDateStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; });
  const [activityDateEnd, setActivityDateEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const pageSizeActivities = 10;

  const activityEntries = useMemo((): ActivityEntry[] => {
    const entries: ActivityEntry[] = [];

    // Tasks activities
    tasks.forEach(t => {
      const user = t.employeId ? t.employeId.prenom + " " + t.employeId.nom : "Omayma Hoimdi";
      const avatar = t.employeId ? t.employeId.prenom[0] + t.employeId.nom[0] : "OH";
      entries.push({
        id: "act-task-" + t._id, type: "tache", user, userAvatar: avatar,
        action: "a créé la tâche", target: t.titre, timestamp: t.createdAt || new Date().toISOString(),
      });
      if (t.statut === "Terminée") {
        entries.push({
          id: "act-task-done-" + t._id, type: "tache", user, userAvatar: avatar,
          action: "a terminé la tâche", target: t.titre, timestamp: t.dateFin || new Date().toISOString(),
        });
      }
    });

    // File activities
    allFiles.forEach(f => {
      entries.push({
        id: "act-file-" + f.id, type: "fichier", user: f.owner, userAvatar: f.ownerAvatar,
        action: "a téléchargé le fichier", target: f.name + "." + f.type.toLowerCase(), timestamp: f.lastModified,
      });
    });

    // Event activities
    events.forEach(e => {
      const member = team.find(m => m._id === e.employeId);
      const user = member ? member.prenom + " " + member.nom : "Omayma Hoimdi";
      const avatar = member ? member.prenom[0] + member.nom[0] : "OH";
      entries.push({
        id: "act-event-" + e._id, type: "calendrier", user, userAvatar: avatar,
        action: "a planifié " + e.type.toLowerCase(), target: e.titre, timestamp: e.dateDebut,
      });
    });

    // Discussion messages as comments
    messages.forEach(m => {
      entries.push({
        id: "act-msg-" + m.id, type: "commentaire", user: m.userName, userAvatar: m.userAvatar,
        action: "a commenté dans #" + (channels.find(c => c.id === m.channelId)?.name || "discussion"),
        target: m.content.length > 60 ? m.content.slice(0, 60) + "..." : m.content, timestamp: m.time,
      });
    });

    // Team member activities
    team.forEach(t => {
      entries.push({
        id: "act-team-" + t._id, type: "equipe", user: t.prenom + " " + t.nom,
        userAvatar: t.prenom[0] + t.nom[0],
        action: "a rejoint l'équipe", target: "Membre " + t.role, timestamp: new Date().toISOString(),
      });
    });

    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return entries;
  }, [tasks, allFiles, events, messages, team, channels]);

  const filteredActivities = useMemo(() => {
    let result = [...activityEntries];
    if (activityFilterType) result = result.filter(a => a.type === activityFilterType);
    if (activityFilterMember) result = result.filter(a => a.user === activityFilterMember);
    if (activitySearch) {
      const q = activitySearch.toLowerCase();
      result = result.filter(a => a.user.toLowerCase().includes(q) || a.target.toLowerCase().includes(q) || a.action.toLowerCase().includes(q));
    }
    if (activityDateStart) result = result.filter(a => new Date(a.timestamp) >= new Date(activityDateStart));
    if (activityDateEnd) {
      const end = new Date(activityDateEnd);
      end.setHours(23, 59, 59, 999);
      result = result.filter(a => new Date(a.timestamp) <= end);
    }
    return result;
  }, [activityEntries, activityFilterType, activityFilterMember, activitySearch, activityDateStart, activityDateEnd]);

  const totalActivities = filteredActivities.length;
  const hasMoreActivities = activityPage * pageSizeActivities < totalActivities;
  const displayedActivities = filteredActivities.slice(0, activityPage * pageSizeActivities);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: { label: string; date: string; items: ActivityEntry[] }[] = [];
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    displayedActivities.forEach(item => {
      const dateKey = new Date(item.timestamp).toISOString().split("T")[0];
      let label = new Date(item.timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      if (dateKey === today) label = "Aujourd'hui - " + label;
      else if (dateKey === yesterday) label = "Hier - " + label;
      const existing = groups.find(g => g.date === dateKey);
      if (existing) existing.items.push(item);
      else groups.push({ label, date: dateKey, items: [item] });
    });
    return groups;
  }, [displayedActivities]);

  // Summary
  const activitySummary = useMemo(() => ({
    taches: activityEntries.filter(a => a.type === "tache").length,
    fichiers: activityEntries.filter(a => a.type === "fichier").length,
    commentaires: activityEntries.filter(a => a.type === "commentaire").length,
    evenements: activityEntries.filter(a => a.type === "calendrier").length,
    equipe: activityEntries.filter(a => a.type === "equipe").length,
  }), [activityEntries]);

  // Activity by member (for donut)
  const activityByMember = useMemo(() => {
    const counts: Record<string, number> = {};
    activityEntries.forEach(a => { counts[a.user] = (counts[a.user] || 0) + 1; });
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 4).map(([name, count]) => ({ name, value: Math.round((count / total) * 100), count }));
    if (sorted.length > 4) {
      const othersCount = sorted.slice(4).reduce((s, [, c]) => s + c, 0);
      top.push({ name: "Autres", value: Math.round((othersCount / total) * 100), count: othersCount });
    }
    return top;
  }, [activityEntries]);

  // Most frequent activity types
  const frequentActivities = useMemo(() => {
    const counts: Record<string, number> = { fichiers: activitySummary.fichiers, commentaires: activitySummary.commentaires, taches: activitySummary.taches, evenements: activitySummary.evenements };
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activitySummary]);

  const DONUT_COLORS = ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  const totalFiles = allFiles.length;

  const filteredFiles = useMemo(() => {
    let result = [...allFiles];
    const q = fileSearch.toLowerCase();
    if (q) result = result.filter(f => f.name.toLowerCase().includes(q) || f.owner.toLowerCase().includes(q) || f.type.toLowerCase().includes(q));
    if (fileTypeFilter) result = result.filter(f => f.type === fileTypeFilter);
    if (fileMemberFilter) result = result.filter(f => f.owner === fileMemberFilter);
    if (extraFilters.favorites) result = result.filter(f => f.favorite);
    if (extraFilters.shared) result = result.filter(f => f.shared);
    if (extraFilters.recent) result = result.filter(f => new Date(f.lastModified).getTime() > Date.now() - 86400000 * 7);
    result.sort((a, b) => {
      if (fileSort === "recent") return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      if (fileSort === "oldest") return new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
      if (fileSort === "name-asc") return a.name.localeCompare(b.name);
      if (fileSort === "name-desc") return b.name.localeCompare(a.name);
      if (fileSort === "size") return b.size - a.size;
      return 0;
    });
    return result;
  }, [allFiles, fileSearch, fileTypeFilter, fileMemberFilter, fileSort, extraFilters]);

  const fileTotalPages = Math.max(1, Math.ceil(filteredFiles.length / filePageSize));
  const filePaginated = filteredFiles.slice((filePage - 1) * filePageSize, filePage * filePageSize);

  const hasFileFilters = fileSearch || fileTypeFilter || fileMemberFilter || extraFilters.favorites || extraFilters.shared || extraFilters.recent;

  useEffect(() => { setFilePage(1); }, [fileSearch, fileTypeFilter, fileMemberFilter, fileSort, extraFilters]);

  useEffect(() => {
    if (activeTab === "Fichiers") { setFilePage(1); }
  }, [activeTab]);

  function toggleFolder(id: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleFileSelect(fileId: string) {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId); else next.add(fileId);
      return next;
    });
  }

  function handleFileDrop(e: React.DragEvent, targetFolderId: string) {
    e.preventDefault();
    setFileDragOverFolder(null);
    const fileId = e.dataTransfer.getData("fileId");
    if (fileId) {
      setFolders(prev => {
        const next = [...prev];
        const sourceFolderIdx = next.findIndex(f => f.files.some(fi => fi.id === fileId));
        if (sourceFolderIdx === -1) return prev;
        const file = next[sourceFolderIdx].files.find(fi => fi.id === fileId)!;
        const targetFolderIdx = next.findIndex(f => f.id === targetFolderId);
        if (targetFolderIdx === -1 || sourceFolderIdx === targetFolderIdx) return prev;
        next[sourceFolderIdx].files = next[sourceFolderIdx].files.filter(fi => fi.id !== fileId);
        next[targetFolderIdx].files.push({ ...file, folderId: targetFolderId });
        return next;
      });
      setExpandedFolders(prev => { const next = new Set(prev); next.add(targetFolderId); return next; });
    }
  }

  function handleFileAction(action: string, fileId: string) {
    setFileContextMenu(null);
    const isFolder = fileId.startsWith("fold-");
    if (isFolder) {
      if (action === "delete") {
        if (!confirm(`Supprimer le dossier "${folders.find(f => f.id === fileId)?.name}" et tous ses fichiers ?`)) return;
        const folder = folders.find(f => f.id === fileId);
        if (folder) {
          folder.files.forEach(fi => {
            addToCorbeille({
              id: "corbeille-file-" + Date.now() + "-" + fi.id,
              type: "Fichier",
              nom: fi.name + "." + fi.type.toLowerCase(),
              supprimePar: { nom: "Moi", fonction: "Utilisateur", avatar: "M" },
              supprimeLe: new Date().toISOString(),
              supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              sourceData: fi,
              meta: { projectId: id || "", folderId: fi.folderId, folderName: folder.name },
            });
          });
        }
        setFolders(prev => prev.filter(f => f.id !== fileId));
      } else if (action === "rename") {
        setFileRenameId(fileId);
        setFileRenameValue(folders.find(f => f.id === fileId)?.name || "");
      }
      return;
    }
    const file = allFiles.find(f => f.id === fileId);
    if (!file) return;
    switch (action) {
      case "favorite":
        setFolders(prev => prev.map(f => ({ ...f, files: f.files.map(fi => fi.id === fileId ? { ...fi, favorite: !fi.favorite } : fi) })));
        break;
      case "delete":
        if (!confirm("Supprimer ce fichier ?")) return;
        setFolders(prev => prev.map(f => ({ ...f, files: f.files.filter(fi => fi.id !== fileId) })));
        addToCorbeille({
          id: "corbeille-file-" + Date.now(),
          type: "Fichier",
          nom: file.name + "." + file.type.toLowerCase(),
          supprimePar: { nom: "Moi", fonction: "Utilisateur", avatar: "M" },
          supprimeLe: new Date().toISOString(),
          supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          sourceData: file,
          meta: { projectId: id || "", folderId: file.folderId, folderName: file.folderName },
        });
        break;
      case "rename":
        setFileRenameId(fileId);
        setFileRenameValue(file.name);
        break;
      case "duplicate":
        setFolders(prev => prev.map(f => ({
          ...f,
          files: [...f.files, ...f.files.filter(fi => fi.id === fileId).map(fi => ({ ...fi, id: fi.id + "_copy", name: fi.name + " (copie)" }))]
        })));
        break;
      case "preview":
        setShowFilePreview(fileId);
        break;
    }
  }

  function handleAddFolder() {
    if (!newFolderName.trim()) return;
    const newId = "fold-" + Date.now();
    setFolders(prev => [...prev, { id: newId, name: newFolderName.trim(), files: [] }]);
    setExpandedFolders(prev => { const next = new Set(prev); next.add(newId); return next; });
    setNewFolderName("");
    setShowNewFolderModal(false);
  }

  function handleRenameConfirm() {
    if (!fileRenameId || !fileRenameValue.trim()) { setFileRenameId(null); return; }
    if (fileRenameId.startsWith("fold-")) {
      setFolders(prev => prev.map(f => f.id === fileRenameId ? { ...f, name: fileRenameValue.trim() } : f));
    } else {
      setFolders(prev => prev.map(f => ({ ...f, files: f.files.map(fi => fi.id === fileRenameId ? { ...fi, name: fileRenameValue.trim() } : fi) })));
    }
    setFileRenameId(null);
  }

  function openTaskAdd() {
    setEditingTask(null);
    setTaskForm(emptyTaskForm);
    setTaskFormErrors({});
    setTaskError("");
    setShowTaskModal(true);
  }

  function openTaskEdit(t: Task) {
    setEditingTask(t);
    setTaskForm({
      titre: t.titre,
      description: t.description || "",
      statut: (TASK_STATUTS.includes(t.statut as any) ? t.statut : "À faire") as typeof emptyTaskForm.statut,
      priorite: (["Faible", "Moyenne", "Haute", "Urgente"].includes(t.priorite) ? t.priorite : "Moyenne") as typeof emptyTaskForm.priorite,
      dateDebut: t.dateDebut ? t.dateDebut.split("T")[0] : "",
      dateFin: t.dateFin ? t.dateFin.split("T")[0] : "",
      employeId: t.employeId?._id || "",
    });
    setTaskFormErrors({});
    setTaskError("");
    setShowTaskModal(true);
  }

  function validateTaskForm() {
    const errs: Record<string, string> = {};
    if (!taskForm.titre.trim()) errs.titre = "Titre obligatoire";
    else if (taskForm.titre.trim().length < 3) errs.titre = "Minimum 3 caractères";
    if (!taskForm.description.trim()) errs.description = "Description obligatoire";
    else if (taskForm.description.trim().length < 10) errs.description = "Minimum 10 caractères";
    return errs;
  }

  async function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTaskSaving(true);
    setTaskError("");
    const validationErrors = validateTaskForm();
    if (Object.keys(validationErrors).length > 0) {
      setTaskFormErrors(validationErrors);
      setTaskSaving(false);
      return;
    }
    const payload = { ...taskForm, projetId: id };
    const method = editingTask ? "PUT" : "POST";
    const url = editingTask ? `/api/tasks/${editingTask._id}` : "/api/tasks";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowTaskModal(false);
      refreshTasks();
    } else {
      const d = await res.json();
      setTaskError(d.message || "Erreur serveur");
    }
    setTaskSaving(false);
  }

  async function handleTaskDelete(taskId: string) {
    if (!confirm("Supprimer cette tâche ?")) return;
    const task = tasks.find(t => t._id === taskId);
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    refreshTasks();
    if (task) {
      addToCorbeille({
        id: "corbeille-tache-" + Date.now(),
        type: "Tâche",
        nom: task.titre,
        supprimePar: { nom: "Moi", fonction: "Utilisateur", avatar: "M" },
        supprimeLe: new Date().toISOString(),
        supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        sourceData: task,
      });
    }
  }

  // Calendar event handlers
  function openEventAdd() {
    setEditingEvent(null);
    setEventForm({ ...emptyEventForm, dateDebut: calSelectedDate, dateFin: calSelectedDate });
    setShowEventModal(true);
  }

  function openEventEdit(ev: CalendarEvent) {
    setEditingEvent(ev);
    setEventForm({
      titre: ev.titre,
      description: ev.description || "",
      type: ev.type,
      dateDebut: ev.dateDebut?.split("T")[0] || "",
      dateFin: ev.dateFin?.split("T")[0] || "",
      employeId: ev.employeId || "",
    });
    setShowEventModal(true);
  }

  async function handleEventSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventForm.titre.trim() || !eventForm.dateDebut) return;
    const ev: CalendarEvent = {
      _id: editingEvent?._id || `ev_${Date.now()}`,
      titre: eventForm.titre.trim(),
      description: eventForm.description.trim(),
      type: eventForm.type,
      dateDebut: eventForm.dateDebut,
      dateFin: eventForm.dateFin || eventForm.dateDebut,
      employeId: eventForm.employeId || undefined,
    };
    if (editingEvent) {
      setEvents(prev => prev.map(e => e._id === editingEvent._id ? ev : e));
    } else {
      setEvents(prev => [...prev, ev]);
    }
    setShowEventModal(false);
  }

  function handleEventDelete(eventId: string) {
    if (!confirm("Supprimer cet événement ?")) return;
    setEvents(prev => prev.filter(e => e._id !== eventId));
  }

  useEffect(() => {
    if (!calSelectedDate && calendarDays.some(d => d > 0)) {
      const today = new Date();
      if (calDate.getMonth() === today.getMonth() && calDate.getFullYear() === today.getFullYear()) {
        setCalSelectedDate(`${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
      } else {
        setCalSelectedDate(`${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, "0")}-01`);
      }
    }
  }, [calDate, calSelectedDate, calendarDays]);

  useEffect(() => {
    setTaskPage(1);
  }, [taskTab, taskSearch, taskFilterStatut, taskFilterPriorite, taskFilterAssignee, taskFilterTag, taskSortBy]);

  function refreshTasks() {
    if (!id) return;
    fetch(`/api/tasks?projetId=${id}`)
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []));
  }

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/tasks?projetId=${id}`).then((r) => r.json()).catch(() => []),
      fetch(`/api/team`).then((r) => r.json()).catch(() => []),
      fetch(`/api/activities?projectId=${id}`).then((r) => r.json()).catch(() => []),
    ]).then(([proj, taskData, teamData, actData]) => {
      if (proj?._id) setProject(proj);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setTeam(Array.isArray(teamData) ? teamData : []);
      setActivities(Array.isArray(actData) ? actData : []);
      setLoading(false);
    });
  }, [id]);

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  }

  function shortDate(dateStr: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short",
    });
  }

  function daysUntil(dateStr: string): number {
    if (!dateStr) return 0;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  function formatBudget(n: number) {
    return n.toLocaleString("fr-FR") + " €";
  }

  const progress = project
    ? Math.min(100, project.statut === "Terminé" ? 100 : project.statut === "En cours" ? 60 : project.statut === "En test" ? 80 : project.statut === "En attente" ? 10 : 35)
    : 0;
  const tasksDone = tasks.filter(t => t.statut === "Terminée").length;
  const tasksInProgress = tasks.filter(t => t.statut === "En cours").length;
  const tasksPending = tasks.filter(t => t.statut === "À faire").length;
  const budgetConsumed = project ? Math.round((project.budget || 0) * (progress / 100)) : 0;
  const budgetRemaining = project ? (project.budget || 0) - budgetConsumed : 0;

  const daysLeft = project?.dateFin ? daysUntil(project.dateFin) : 0;
  const isOverdue = daysLeft === 0 && project?.dateFin && project.statut !== "Terminé";

  const health = (() => {
    if (isOverdue || project?.statut === "Suspendu") return { label: "En danger", color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle, msg: "Des actions correctives sont nécessaires" };
    if (progress >= 70) return { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-50", icon: TrendingUp, msg: "Le projet avance parfaitement" };
    if (progress >= 40) return { label: "Bon", color: "text-indigo-600", bg: "bg-indigo-50", icon: CheckCircle2, msg: "Le projet est sur la bonne voie" };
    return { label: "À surveiller", color: "text-amber-600", bg: "bg-amber-50", icon: AlertCircle, msg: "Une attention particulière est requise" };
  })();

  const HealthIcon = health.icon;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <FolderKanban size={56} className="mb-4 opacity-30" />
        <p className="text-lg font-medium text-slate-500">Projet introuvable</p>
        <button onClick={() => router.back()} className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* BACK + HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-800">
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 shadow-sm">
            <FolderKanban size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{project.titre}</h1>
              <button onClick={() => setFavorited(!favorited)} className="transition-colors">
                <Star size={18} className={favorited ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
              </button>
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${STATUT_STYLES[project.statut] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${STATUT_BG[project.statut] || "bg-slate-400"}`} />
                {project.statut}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Building2 size={14} />{project.clientId?.nomSociete || "Client inconnu"}</span>
              <span>·</span>
              <span className="flex items-center gap-1.5"><User size={14} />{project.chefProjet || (project.chefProjetId ? `${project.chefProjetId.prenom} ${project.chefProjetId.nom}` : "Non assigné")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2">
            <Share2 size={15} /> Partager
          </button>
          <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 flex items-center gap-2">
            <Pencil size={15} /> Modifier
          </button>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition-all hover:bg-slate-50">
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                  <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-700"><Archive size={15} /> Archiver</button>
                  <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-700"><BarChart3 size={15} /> Rapports</button>
                  <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><X size={15} /> Supprimer</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Progression", value: `${progress}%`, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Tâches totales", value: tasks.length, icon: CheckSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Membres équipe", value: team.length, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Temps suivi", value: `${tasks.length * 12}h`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Budget total", value: formatBudget(project.budget || 0), icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Date fin", value: project.dateFin ? shortDate(project.dateFin) : "—", icon: Calendar, color: "text-rose-600", bg: "bg-rose-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
            <div className={`rounded-xl ${bg} p-2.5 ${color} w-fit mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-xl font-bold text-slate-900">{value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 border-b border-slate-100 min-w-max pb-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: Vue d'ensemble */}
      {activeTab === "Vue d'ensemble" && (
        <div className="space-y-6">

          {/* SECTION 1: Project Overview */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Aperçu du projet</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Description", value: project.description || "Aucune description", span: true },
                { label: "Date début", value: formatDate(project.dateDebut), icon: Calendar },
                { label: "Date fin", value: formatDate(project.dateFin), icon: Calendar },
                { label: "Priorité", value: project.priorite, icon: Flag, badge: true },
                { label: "Catégorie", value: "Développement web", icon: Briefcase },
                { label: "Budget", value: formatBudget(project.budget || 0), icon: DollarSign },
                { label: "Statut", value: project.statut, icon: Activity, badge: true },
              ].map(({ label, value, icon: Icon, span, badge }) => (
                <div key={label} className={span ? "md:col-span-2 lg:col-span-3" : ""}>
                  <div className="flex items-start gap-3">
                    {Icon && (
                      <div className="rounded-lg bg-slate-50 p-2 text-slate-400 shrink-0">
                        <Icon size={16} />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                      {badge ? (
                        <span className={`mt-1 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${STATUT_STYLES[value] || PRIORITE_STYLES[value] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUT_BG[value] || PRIORITE_BG[value] || "bg-slate-400"}`} />
                          {value}
                        </span>
                      ) : (
                        <p className="mt-0.5 text-sm text-slate-900">{value}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: Recent Tasks */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Tâches récentes</h3>
              <button onClick={openTaskAdd} className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 transition flex items-center gap-1.5">
                <Plus size={14} /> Nouvelle tâche
              </button>
            </div>
            <div className="space-y-2">
              {tasks.slice(0, 5).map((task) => (
                <div key={task._id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:border-slate-200 hover:shadow-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{task.titre}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${STATUT_STYLES[task.statut] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUT_BG[task.statut] || "bg-slate-400"}`} />
                      {task.statut}
                    </span>
                    {task.employeId && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 text-[10px] font-bold">
                        {task.employeId.prenom[0]}{task.employeId.nom[0]}
                      </div>
                    )}
                    {task.dateFin && (
                      <span className="text-[10px] text-slate-400">{shortDate(task.dateFin)}</span>
                    )}
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">Aucune tâche pour ce projet</p>
              )}
            </div>
          </div>

          {/* SECTION 3: Mini Kanban */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Kanban</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {KANBAN_COLUMNS.map((col) => {
                const colTasks = tasks.filter(t => t.statut === col.key);
                const colColors: Record<string, string> = {
                  "À faire": "border-t-slate-400 bg-slate-50/50",
                  "En cours": "border-t-indigo-400 bg-indigo-50/30",
                  "Validation": "border-t-violet-400 bg-violet-50/30",
                  "Terminé": "border-t-emerald-400 bg-emerald-50/30",
                };
                return (
                  <div key={col.key} className={`rounded-xl border border-slate-200 border-t-4 ${colColors[col.key]} p-3`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase">{col.label}</h4>
                      <span className="rounded-md bg-slate-200/60 px-2 py-0.5 text-[10px] font-medium text-slate-600">{colTasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {colTasks.slice(0, 4).map((task) => (
                        <div key={task._id} className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
                          <p className="text-xs font-medium text-slate-800 truncate">{task.titre}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PRIORITE_STYLES[task.priorite] || "bg-slate-50 text-slate-600"}`}>{task.priorite}</span>
                            {task.employeId && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 text-[8px] font-bold">
                                {task.employeId.prenom[0]}{task.employeId.nom[0]}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {colTasks.length === 0 && (
                        <p className="text-[10px] text-slate-400 text-center py-3">Aucune tâche</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Team */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Équipe projet</h3>
              <button className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
                <Plus size={14} /> Ajouter membre
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {team.slice(0, 6).map((member) => (
                <div key={member._id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:border-slate-200 hover:shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 text-sm font-bold">
                    {member.prenom[0]}{member.nom[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{member.prenom} {member.nom}</p>
                    <p className="text-xs text-slate-500">{member.role || "Membre"}</p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${member.status === "Actif" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"}`}>
                    {member.status || "Actif"}
                  </span>
                </div>
              ))}
              {team.length === 0 && (
                <div className="col-span-full text-center py-6 text-sm text-slate-400">
                  Aucun membre assigné à ce projet
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: Calendar */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Calendrier</h3>
            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                <div key={d} className="text-[10px] font-semibold text-slate-500 uppercase py-1">{d}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 2 + 1;
                const today = new Date().getDate() === day;
                const hasEvent = [5, 12, 19, 25].includes(day);
                const isDeadline = [25].includes(day);
                return (
                  <div
                    key={i}
                    className={`rounded-lg py-1.5 text-xs transition-all ${
                      today ? "bg-violet-600 text-white font-bold shadow-sm" :
                      hasEvent ? "bg-indigo-50 text-indigo-700 font-medium" :
                      isDeadline ? "bg-red-50 text-red-700 font-medium" :
                      day > 0 && day <= 31 ? "text-slate-700 hover:bg-slate-50" : "text-slate-200"
                    }`}
                  >
                    {day > 0 && day <= 31 ? day : ""}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-indigo-100" /> Réunions</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-violet-200" /> Jalons</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-200" /> Livraisons</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-red-200" /> Échéances</span>
            </div>
          </div>

          {/* SECTION 6: Activities */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Activités récentes</h3>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-1 before:h-[calc(100%-1rem)] before:w-[2px] before:bg-slate-100">
              {activities.length === 0 ? (
                [
                  { user: "Ahmed Ben Ali", action: "a créé une nouvelle tâche", time: "Il y a 2 heures", initials: "AB" },
                  { user: "Omayma Hoimdi", action: "a complété une tâche", time: "Il y a 4 heures", initials: "OH" },
                  { user: "John Smith", action: "a ajouté un fichier", time: "Hier à 14h30", initials: "JS" },
                ].map((item, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    <div className="absolute -left-[18px] flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 text-[9px] font-bold ring-2 ring-white">
                      {item.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium text-slate-900">{item.user}</span> {item.action}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                activities.map((act) => (
                  <div key={act._id} className="relative flex items-start gap-3">
                    <div className="absolute -left-[18px] flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 text-[9px] font-bold ring-2 ring-white">
                      {act.userId?.slice(0, 2) || "AF"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{act.action}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(act.createdAt).toLocaleString("fr-FR")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* BOTTOM SECTION: Progress + Health + Budget */}
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Progress globaux */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Progression globale</h3>
              <div className="flex items-end gap-3 mb-3">
                <p className="text-3xl font-bold text-slate-900">{progress}%</p>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="rounded-xl bg-emerald-50 p-3 text-center"><p className="text-lg font-bold text-emerald-600">{tasksDone}</p><p className="text-xs text-slate-500">Terminées</p></div>
                <div className="rounded-xl bg-indigo-50 p-3 text-center"><p className="text-lg font-bold text-indigo-600">{tasksInProgress}</p><p className="text-xs text-slate-500">En cours</p></div>
                <div className="rounded-xl bg-amber-50 p-3 text-center"><p className="text-lg font-bold text-amber-600">{tasksPending}</p><p className="text-xs text-slate-500">En attente</p></div>
              </div>
            </div>

            {/* Project Health */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Santé du projet</h3>
              <div className={`rounded-2xl ${health.bg} p-5 text-center`}>
                <HealthIcon size={36} className={`${health.color} mx-auto mb-2`} />
                <p className={`text-xl font-bold ${health.color}`}>{health.label}</p>
                <p className="text-sm text-slate-500 mt-1">{health.msg}</p>
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                <span>Jalons atteints: <strong className="text-slate-900">3/5</strong></span>
                <span>Tâches: <strong className="text-slate-900">{tasksDone}/{tasks.length}</strong></span>
              </div>
            </div>

            {/* Budget Consumption */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Consommation budgétaire</h3>
              <div className="flex items-end gap-3 mb-3">
                <p className="text-3xl font-bold text-slate-900">{progress}%</p>
                <p className="text-sm text-slate-500 mb-1">utilisé</p>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-4">
                <div>
                  <p className="text-xs text-slate-500">Consommé</p>
                  <p className="text-sm font-bold text-slate-900">{formatBudget(budgetConsumed)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Restant</p>
                  <p className={`text-sm font-bold ${budgetRemaining > 0 ? "text-emerald-600" : "text-red-600"}`}>{formatBudget(budgetRemaining)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Tâches */}
      {activeTab === "Tâches" && (
        <div className="space-y-5">

          {/* Tasks KPI */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Tâches totales", value: taskKpi.total, icon: CheckSquare, color: "text-violet-600", bg: "bg-violet-50" },
              { label: "À faire", value: taskKpi.aFaire, icon: ListTodo, color: "text-slate-600", bg: "bg-slate-50" },
              { label: "En cours", value: taskKpi.enCours, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "En revue", value: taskKpi.enRevue, icon: Eye, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Terminées", value: taskKpi.terminees, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Bloquées", value: taskKpi.bloquees, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
                <div className={`rounded-xl ${bg} p-2.5 ${color} w-fit mb-3`}>
                  <Icon size={18} />
                </div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>



          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={taskSearch} onChange={e => setTaskSearch(e.target.value)}
                placeholder="Rechercher une tâche..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-50 placeholder:text-slate-400"
              />
            </div>
            <div className="relative">
              <select value={taskFilterStatut} onChange={e => setTaskFilterStatut(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-7 text-xs font-medium text-slate-600 outline-none hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
              ><option value="">Statut</option>
                {["À faire", "En cours", "En revue", "Terminée", "Bloquée"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="relative">
              <select value={taskFilterPriorite} onChange={e => setTaskFilterPriorite(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-7 text-xs font-medium text-slate-600 outline-none hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
              ><option value="">Priorité</option>
                {["Faible", "Moyenne", "Haute", "Urgente"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="relative">
              <select value={taskFilterAssignee} onChange={e => setTaskFilterAssignee(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-7 text-xs font-medium text-slate-600 outline-none hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
              ><option value="">Assigné à</option>
                {team.map(m => <option key={m._id} value={m._id}>{m.prenom} {m.nom}</option>)}
              </select>
            </div>
            <div className="relative">
              <select value={taskFilterTag} onChange={e => setTaskFilterTag(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-7 text-xs font-medium text-slate-600 outline-none hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
              ><option value="">Étiquettes</option>
                {["Analyse", "Planning", "Design", "UI/UX", "Frontend", "Backend", "Tests", "Déploiement"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="relative">
              <select value={taskSortBy} onChange={e => setTaskSortBy(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-7 text-xs font-medium text-slate-600 outline-none hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
              ><option value="dateFin">Trier par date</option>
                <option value="titre">Trier par titre</option>
                <option value="priorite">Trier par priorité</option>
              </select>
            </div>
            <button onClick={openTaskAdd} className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 transition flex items-center gap-1.5">
              <Plus size={14} /> Nouvelle tâche
            </button>
            <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
              <Filter size={13} /> Filtres
            </button>
            <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
              <MoreHorizontal size={13} />
            </button>
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit shadow-sm">
            {[
              { key: "table" as const, icon: AlignJustify, label: "Tableau" },
              { key: "kanban" as const, icon: Grid3X3, label: "Kanban" },
              { key: "calendar" as const, icon: CalendarDays, label: "Calendrier" },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTaskViewMode(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  taskViewMode === key
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              ><Icon size={14} /> {label}</button>
            ))}
          </div>

          {/* Tasks Table */}
          {taskViewMode === "table" && (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm min-w-[1000px]">
                  <thead className="border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
                    <tr>
                      <th className="w-10 px-3 py-3 sticky left-0 bg-slate-50/80 z-20">
                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                      </th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Tâche</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Assigné à</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Statut</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Priorité</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Échéance</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Progression</th>
                      <th className="px-3 py-3 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider">Étiquettes</th>
                      <th className="w-14 px-3 py-3 text-right font-semibold text-slate-700 text-xs uppercase tracking-wider sticky right-0 bg-slate-50/80 z-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {taskPaginated.map((task) => {
                      const progress = getTaskProgress(task.statut);
                      const dateInfo = formatTaskDate(task.dateFin);
                      const taskTags = task.tags || ["Analyse", "Design", "Frontend"];

                      return (
                        <tr key={task._id} className={`group transition-all hover:bg-violet-50/40 ${selectedTasks.has(task._id) ? "bg-violet-50/60" : ""}`}>
                          <td className="px-3 py-3 sticky left-0 bg-inherit z-10">
                            <input type="checkbox" checked={selectedTasks.has(task._id)} onChange={() => toggleSelect(task._id)}
                              className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-sm font-medium text-slate-900 group-hover:text-violet-700 transition-colors">{task.titre}</p>
                            {task.description && <p className="text-xs text-slate-400 truncate max-w-[180px]">{task.description}</p>}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 text-[10px] font-bold shrink-0">
                                {task.employeId ? `${task.employeId.prenom[0]}${task.employeId.nom[0]}` : "AF"}
                              </div>
                              <span className="text-sm text-slate-600 truncate max-w-[100px]">
                                {task.employeId ? `${task.employeId.prenom} ${task.employeId.nom}` : "Non assigné"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${TASK_STATUT_STYLES[task.statut] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${TASK_STATUT_BG[task.statut] || "bg-slate-400"}`} />
                              {task.statut}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${PRIORITE_STYLES[task.priorite] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${PRIORITE_BG[task.priorite] || "bg-slate-400"}`} />
                              {task.priorite}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm">
                              <p className={`font-medium ${dateInfo.overdue ? "text-red-600" : dateInfo.urgent ? "text-amber-600" : "text-slate-700"}`}>
                                {dateInfo.date}
                              </p>
                              {dateInfo.label && (
                                <p className={`text-[10px] ${dateInfo.overdue ? "text-red-500" : "text-slate-400"}`}>{dateInfo.label}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 min-w-[100px]">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
                              </div>
                              <span className="text-[10px] font-semibold text-slate-600 w-7 text-right">{progress}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1 max-w-[120px]">
                              {taskTags.slice(0, 2).map(tag => (
                                <span key={tag} className={`rounded-md px-1.5 py-0.5 text-[9px] font-medium ${
                                  tag === "Analyse" ? "bg-amber-50 text-amber-700" :
                                  tag === "Design" ? "bg-pink-50 text-pink-700" :
                                  tag === "Frontend" ? "bg-blue-50 text-blue-700" :
                                  tag === "Backend" ? "bg-purple-50 text-purple-700" :
                                  tag === "Tests" ? "bg-emerald-50 text-emerald-700" :
                                  tag === "Déploiement" ? "bg-cyan-50 text-cyan-700" :
                                  tag === "UI/UX" ? "bg-rose-50 text-rose-700" :
                                  tag === "Planning" ? "bg-orange-50 text-orange-700" :
                                  "bg-slate-50 text-slate-600"
                                }`}>{tag}</span>
                              ))}
                              {taskTags.length > 2 && <span className="text-[9px] text-slate-400">+{taskTags.length - 2}</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right relative sticky right-0 bg-inherit z-10">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openTaskEdit(task)}
                                className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleTaskDelete(task._id)}
                                className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {taskPaginated.length === 0 && (
                      <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400"><ListTodo size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Aucune tâche trouvée</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <p className="text-xs text-slate-500">{taskFiltered.length} tâche{taskFiltered.length !== 1 ? "s" : ""}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setTaskPage(p => Math.max(1, p - 1))} disabled={taskPage <= 1}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={15} /></button>
                  {Array.from({ length: taskTotalPages }, (_, i) => i + 1).slice(0, 5).map(n => (
                    <button key={n} onClick={() => setTaskPage(n)}
                      className={`min-w-[28px] rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                        taskPage === n ? "bg-violet-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                      }`}>{n}</button>
                  ))}
                  <button onClick={() => setTaskPage(p => Math.min(taskTotalPages, p + 1))} disabled={taskPage >= taskTotalPages}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={15} /></button>
                </div>
              </div>
            </div>
          )}

          {/* Kanban view inside tasks tab */}
          {taskViewMode === "kanban" && (
            <div className="overflow-x-auto pb-4">
              <div className="grid grid-cols-5 gap-4 min-w-[900px]">
                {[
                  { key: "À faire", label: "À faire", color: "border-t-slate-400", bg: "bg-slate-50/40" },
                  { key: "En cours", label: "En cours", color: "border-t-indigo-400", bg: "bg-indigo-50/20" },
                  { key: "Validation", label: "En revue", color: "border-t-violet-400", bg: "bg-violet-50/20" },
                  { key: "Terminée", label: "Terminées", color: "border-t-emerald-400", bg: "bg-emerald-50/20" },
                  { key: "Bloquée", label: "Bloquées", color: "border-t-red-400", bg: "bg-red-50/20" },
                ].map((col) => {
                  const colTasks = taskFiltered.filter(t => t.statut === col.key);

                  function handleDragOver(e: React.DragEvent) { e.preventDefault(); e.currentTarget.classList.add("bg-violet-50/40", "border-violet-300"); }
                  function handleDragLeave(e: React.DragEvent) { e.currentTarget.classList.remove("bg-violet-50/40", "border-violet-300"); }
                  async function handleDrop(e: React.DragEvent) {
                    e.preventDefault();
                    e.currentTarget.classList.remove("bg-violet-50/40", "border-violet-300");
                    const taskId = e.dataTransfer.getData("taskId");
                    if (!taskId) return;
                    await fetch(`/api/tasks/${taskId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut: col.key }) });
                    refreshTasks();
                  }

                  return (
                    <div key={col.key}
                      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                      className={`rounded-xl border border-slate-200 border-t-4 ${col.color} ${col.bg} p-2.5 min-h-[250px] transition-colors`}
                    >
                      <div className="flex items-center justify-between mb-2.5 px-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-[11px] font-bold text-slate-700 uppercase">{col.label}</h4>
                          <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">{colTasks.length}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {colTasks.map((task) => {
                          const progress = getTaskProgress(task.statut);
                          const initials = task.employeId ? `${task.employeId.prenom[0]}${task.employeId.nom[0]}` : "AF";
                          return (
                            <div key={task._id} draggable
                              onDragStart={(e) => { e.dataTransfer.setData("taskId", task._id); e.currentTarget.classList.add("opacity-50"); }}
                              onDragEnd={(e) => { e.currentTarget.classList.remove("opacity-50"); }}
                              className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-violet-200 transition-all"
                            >
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <p className="text-[11px] font-semibold text-slate-800">{task.titre}</p>
                                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-medium ${PRIORITE_STYLES[task.priorite] || "bg-slate-50 text-slate-600"}`}>{task.priorite}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 text-[6px] font-bold">{initials}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-10 h-1 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500" style={{ width: `${progress}%` }} />
                                  </div>
                                  <span className="text-[8px] font-medium text-slate-500">{progress}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {colTasks.length === 0 && (
                          <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 text-center">
                            <p className="text-[9px] text-slate-400">Aucune tâche</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Calendar placeholder */}
          {taskViewMode === "calendar" && (
            <div className="text-center py-12 text-slate-400">
              <CalendarDays size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Vue Calendrier</p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Kanban */}
      {activeTab === "Kanban" && (
        <div className="space-y-5">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <button onClick={openTaskAdd} className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 transition flex items-center gap-2">
              <Plus size={16} /> Nouvelle tâche
            </button>
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={taskSearch} onChange={e => setTaskSearch(e.target.value)}
                placeholder="Rechercher une tâche..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-50 placeholder:text-slate-400"
              />
            </div>
            <div className="relative">
              <select value={taskFilterStatut} onChange={e => setTaskFilterStatut(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-xs font-medium text-slate-600 outline-none hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
              ><option value="">Statut</option>
                {["À faire", "En cours", "En revue", "Terminée", "Bloquée"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="relative">
              <select value={taskFilterPriorite} onChange={e => setTaskFilterPriorite(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-xs font-medium text-slate-600 outline-none hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
              ><option value="">Priorité</option>
                {["Faible", "Moyenne", "Haute", "Urgente"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="relative">
              <select value={taskFilterAssignee} onChange={e => setTaskFilterAssignee(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-xs font-medium text-slate-600 outline-none hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
              ><option value="">Membre</option>
                {team.map(m => <option key={m._id} value={m._id}>{m.prenom} {m.nom}</option>)}
              </select>
            </div>
            <div className="relative">
              <select value={taskSortBy} onChange={e => setTaskSortBy(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-xs font-medium text-slate-600 outline-none hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
              ><option value="dateFin">Trier par date</option>
                <option value="titre">Trier par titre</option>
                <option value="priorite">Trier par priorité</option>
              </select>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 overflow-x-auto">
            {[
              { key: "À faire", label: "À faire", color: "border-t-slate-400", bg: "bg-slate-50/40" },
              { key: "En cours", label: "En cours", color: "border-t-indigo-400", bg: "bg-indigo-50/20" },
              { key: "Validation", label: "En revue", color: "border-t-violet-400", bg: "bg-violet-50/20" },
              { key: "Terminée", label: "Terminées", color: "border-t-emerald-400", bg: "bg-emerald-50/20" },
              { key: "Bloquée", label: "Bloquées", color: "border-t-red-400", bg: "bg-red-50/20" },
            ].map((col) => {
              const colTasks = taskFiltered.filter(t => t.statut === col.key);

              function onDragOver(e: React.DragEvent) {
                e.preventDefault();
                e.currentTarget.classList.add("bg-violet-50/40", "border-violet-300");
              }
              function onDragLeave(e: React.DragEvent) {
                e.currentTarget.classList.remove("bg-violet-50/40", "border-violet-300");
              }
              async function onDrop(e: React.DragEvent) {
                e.preventDefault();
                e.currentTarget.classList.remove("bg-violet-50/40", "border-violet-300");
                const taskId = e.dataTransfer.getData("taskId");
                if (!taskId) return;
                await fetch(`/api/tasks/${taskId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ statut: col.key }),
                });
                refreshTasks();
              }

              return (
                <div
                  key={col.key}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`rounded-2xl border border-slate-200 border-t-4 ${col.color} ${col.bg} p-3 min-h-[300px] transition-colors`}
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{col.label}</h4>
                      <span className="rounded-md bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{colTasks.length}</span>
                    </div>
                    <button className="rounded p-1 text-slate-400 hover:bg-slate-200/50"><MoreHorizontal size={13} /></button>
                  </div>
                  <div className="space-y-2.5">
                    {colTasks.map((task) => {
                      const progress = getTaskProgress(task.statut);
                      const dateInfo = formatTaskDate(task.dateFin);
                      const initials = task.employeId ? `${task.employeId.prenom[0]}${task.employeId.nom[0]}` : "AF";
                      const taskTags = task.tags || [];

                      return (
                        <div
                          key={task._id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("taskId", task._id);
                            e.currentTarget.classList.add("opacity-50", "rotate-2", "scale-95");
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.classList.remove("opacity-50", "rotate-2", "scale-95");
                          }}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-violet-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-800 leading-snug">{task.titre}</p>
                            <span className={`shrink-0 ml-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium ${PRIORITE_STYLES[task.priorite] || "bg-slate-50 text-slate-600"}`}>
                              {task.priorite}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[10px] text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {taskTags.slice(0, 2).map(tag => (
                              <span key={tag} className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${
                                tag === "Analyse" ? "bg-amber-50 text-amber-700" :
                                tag === "Design" ? "bg-pink-50 text-pink-700" :
                                tag === "Frontend" ? "bg-blue-50 text-blue-700" :
                                tag === "Backend" ? "bg-purple-50 text-purple-700" :
                                tag === "Tests" ? "bg-emerald-50 text-emerald-700" :
                                tag === "UI/UX" ? "bg-rose-50 text-rose-700" :
                                "bg-slate-50 text-slate-600"
                              }`}>{tag}</span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 text-[7px] font-bold">
                                {initials}
                              </div>
                              {task.dateFin && (
                                <span className={`text-[9px] ${dateInfo.overdue ? "text-red-500 font-medium" : "text-slate-400"}`}>
                                  {shortDate(task.dateFin)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1 rounded-full bg-slate-100 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${progress === 100 ? "bg-emerald-400" : progress >= 50 ? "bg-violet-400" : "bg-amber-400"}`}
                                  style={{ width: `${progress}%` }} />
                              </div>
                              <span className="text-[9px] font-medium text-slate-500">{progress}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {colTasks.length === 0 && (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
                        <p className="text-[10px] text-slate-400">Aucune tâche</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Section */}
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Recent Activities */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Activités récentes</h3>
              <div className="space-y-3">
                {[
                  { user: "Omayma H.", action: "a déplacé la tâche 'API Login' vers En cours", time: "Il y a 1h" },
                  { user: "Ahmed B.", action: "a complété la tâche 'Page d'accueil'", time: "Il y a 3h" },
                  { user: "Sara M.", action: "a créé la tâche 'Base de données'", time: "Il y a 5h" },
                  { user: "John D.", action: "a déplacé la tâche 'Tests unitaires' vers Terminées", time: "Hier" },
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 text-[8px] font-bold mt-0.5">
                      {act.user.split(" ").map(s => s[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-600"><span className="font-medium text-slate-800">{act.user}</span> {act.action}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Donut Chart */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Projets par statut</h3>
              <div className="flex items-center gap-4">
                <div className="h-28 w-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: "À faire", value: taskKpi.aFaire },
                        { name: "En cours", value: taskKpi.enCours },
                        { name: "Terminée", value: taskKpi.terminees },
                        { name: "Bloquée", value: taskKpi.bloquees },
                      ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={3} dataKey="value">
                        {[0, 1, 2, 3].map(i => <Cell key={i} fill={["#94a3b8", "#6366f1", "#10b981", "#ef4444"][i]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: "À faire", color: "bg-slate-400", value: taskKpi.aFaire },
                    { label: "En cours", color: "bg-indigo-500", value: taskKpi.enCours },
                    { label: "Terminées", color: "bg-emerald-500", value: taskKpi.terminees },
                    { label: "Bloquées", color: "bg-red-500", value: taskKpi.bloquees },
                  ].filter(d => d.value > 0).map((d) => (
                    <div key={d.label} className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${d.color}`} />
                      <span className="text-[11px] text-slate-600">{d.label}</span>
                      <span className="text-[11px] font-semibold text-slate-800 ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Échéances imminentes</h3>
              <div className="space-y-2">
                {tasks
                  .filter(t => t.dateFin && t.statut !== "Terminée")
                  .sort((a, b) => new Date(a.dateFin).getTime() - new Date(b.dateFin).getTime())
                  .slice(0, 5)
                  .map(t => {
                    const days = daysUntil(t.dateFin);
                    return (
                      <div key={t._id} className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-800 truncate">{t.titre}</p>
                          <p className="text-[10px] text-slate-400">{shortDate(t.dateFin)}</p>
                        </div>
                        <span className={`shrink-0 ml-2 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          days === 0 ? "bg-red-50 text-red-600" : days <= 3 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-600"
                        }`}>
                          {days === 0 ? "Auj." : days === 1 ? "Demain" : `J-${days}`}
                        </span>
                      </div>
                    );
                  })}
                {tasks.filter(t => t.dateFin && t.statut !== "Terminée").length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Aucune échéance</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Calendrier */}
      {activeTab === "Calendrier" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">

            {/* Calendar top KPI */}
            <div className="w-full grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Progression", value: `${progress}%`, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Tâches en retard", value: tasks.filter(t => t.dateFin && new Date(t.dateFin) < new Date() && t.statut !== "Terminée").length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
                { label: "Événements", value: events.length, icon: CalendarDays, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Temps suivi", value: `${tasks.length * 8}h`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Budget utilisé", value: `${Math.min(100, progress)}%`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Date fin", value: project.dateFin ? shortDate(project.dateFin) : "—", icon: Calendar, color: "text-rose-600", bg: "bg-rose-50" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                  <div className={`rounded-xl ${bg} p-2 ${color} w-fit mb-2`}><Icon size={16} /></div>
                  <p className="text-lg font-bold text-slate-900">{value}</p>
                  <p className="text-[10px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">

            {/* Main Calendar */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">

              {/* Calendar toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => { setCalDate(new Date()); }} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">Aujourd&apos;hui</button>
                  <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"><ChevronLeft size={16} /></button>
                  <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"><ChevronRight size={16} /></button>
                  <h2 className="text-base font-bold text-slate-800 min-w-[160px]">
                    {calDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {[{ key: "month", label: "Mois" }, { key: "week", label: "Semaine" }, { key: "day", label: "Jour" }].map(({ key, label }) => (
                    <button key={key} onClick={() => setCalViewMode(key as any)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${calViewMode === key ? "bg-violet-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                    >{label}</button>
                  ))}
                  <button className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                    <Filter size={13} /> Filtres
                  </button>
                  <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><MoreHorizontal size={16} /></button>
                </div>
              </div>

              {/* Calendar grid: month view */}
              {calViewMode === "month" && (
                <div>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 border-b border-slate-100">
                    {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                      <div key={d} className="px-2 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center border-r border-slate-50 last:border-r-0">{d}</div>
                    ))}
                  </div>

                  {/* Calendar cells */}
                  <div className="grid grid-cols-7">
                    {calendarDays.map((day, idx) => {
                      const dayStr = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const dayEvents = events.filter(e => {
                        const eDate = e.dateDebut?.split("T")[0];
                        return eDate === dayStr || (e.dateFin?.split("T")[0] >= dayStr && e.dateDebut?.split("T")[0] <= dayStr);
                      });
                      const dayTasks = tasks.filter(t => {
                        const td = t.dateFin?.split("T")[0];
                        return td === dayStr;
                      });
                      const isToday = day === new Date().getDate() && calDate.getMonth() === new Date().getMonth() && calDate.getFullYear() === new Date().getFullYear();
                      const isCurrentMonth = day > 0 && day <= daysInMonth;

                      function onCellDragOver(e: React.DragEvent) { e.preventDefault(); e.currentTarget.classList.add("bg-violet-50/50"); }
                      function onCellDragLeave(e: React.DragEvent) { e.currentTarget.classList.remove("bg-violet-50/50"); }
                      function onCellDrop(e: React.DragEvent) {
                        e.preventDefault();
                        e.currentTarget.classList.remove("bg-violet-50/50");
                        const eventId = e.dataTransfer.getData("eventId");
                        const taskId = e.dataTransfer.getData("taskId");
                        const newDate = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        if (eventId) {
                          setEvents(prev => prev.map(ev => ev._id === eventId ? { ...ev, dateDebut: newDate, dateFin: newDate } : ev));
                        }
                        if (taskId) {
                          fetch(`/api/tasks/${taskId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ dateFin: newDate }),
                          }).then(() => refreshTasks());
                        }
                      }

                      return (
                        <div
                          key={idx}
                          onDragOver={onCellDragOver}
                          onDragLeave={onCellDragLeave}
                          onDrop={onCellDrop}
                          onDoubleClick={() => { setCalSelectedDate(dayStr); openEventAdd(); }}
                          className={`min-h-[90px] border-b border-r border-slate-50 p-1.5 transition-all cursor-pointer group
                            ${!isCurrentMonth ? "bg-slate-50/50" : "hover:bg-slate-50/30"}
                            ${isToday ? "bg-violet-50/40" : ""}`}
                        >
                          <div className={`text-[11px] font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                            ${isToday ? "bg-violet-600 text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-300"}`}>
                            {day > 0 && day <= daysInMonth ? day : ""}
                          </div>
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 2).map(ev => (
                              <div key={ev._id} draggable
                                onDragStart={(e) => { e.dataTransfer.setData("eventId", ev._id); }}
                                className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium cursor-grab active:cursor-grabbing
                                  ${ev.type === "Réunion" ? "bg-blue-100 text-blue-700" :
                                    ev.type === "Développement" ? "bg-purple-100 text-purple-700" :
                                    ev.type === "Conception" ? "bg-orange-100 text-orange-700" :
                                    ev.type === "Intégration" ? "bg-cyan-100 text-cyan-700" :
                                    ev.type === "Tests" ? "bg-emerald-100 text-emerald-700" :
                                    ev.type === "Déploiement" ? "bg-pink-100 text-pink-700" :
                                    "bg-slate-100 text-slate-600"}`}
                              >{ev.titre}</div>
                            ))}
                            {dayEvents.length > 2 && (
                              <span className="text-[9px] text-violet-600 font-medium px-1">+{dayEvents.length - 2} autres</span>
                            )}
                            {dayTasks.filter(t => t.dateFin?.split("T")[0] === dayStr && t.statut !== "Terminée").slice(0, 1).map(t => (
                              <div key={t._id} className="text-[9px] px-1.5 py-0.5 rounded truncate bg-red-50 text-red-600 font-medium">
                                {t.titre}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Week view placeholder */}
              {calViewMode === "week" && (
                <div className="p-8 text-center text-slate-400 text-sm">
                  <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
                  Vue semaine
                </div>
              )}

              {/* Day view placeholder */}
              {calViewMode === "day" && (
                <div className="p-8 text-center text-slate-400 text-sm">
                  <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
                  Vue jour
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">

              {/* Mini calendar */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                  {calDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </h4>
                <div className="grid grid-cols-7 gap-0.5 text-center mb-2">
                  {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d, i) => (
                    <div key={i} className="text-[9px] font-semibold text-slate-400 py-1">{d[0]}</div>
                  ))}
                  {Array.from({ length: 35 }, (_, i) => {
                    const d = i - 1 + 1;
                    const isToday = d === new Date().getDate() && calDate.getMonth() === new Date().getMonth();
                    return (
                      <div key={i} className={`text-[10px] py-1 rounded cursor-pointer transition-colors
                        ${d > 0 && d <= 31 ? "text-slate-700 hover:bg-slate-100" : "text-slate-200"}
                        ${isToday ? "bg-violet-600 text-white font-bold hover:bg-violet-700" : ""}`}>
                        {d > 0 && d <= 31 ? d : ""}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Légende</h4>
                <div className="space-y-1.5">
                  {[
                    { label: "Réunion", color: "bg-blue-100 text-blue-700 border-blue-200" },
                    { label: "Développement", color: "bg-purple-100 text-purple-700 border-purple-200" },
                    { label: "Conception", color: "bg-orange-100 text-orange-700 border-orange-200" },
                    { label: "Intégration", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
                    { label: "Tests", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                    { label: "Déploiement", color: "bg-pink-100 text-pink-700 border-pink-200" },
                    { label: "Autre", color: "bg-slate-100 text-slate-600 border-slate-200" },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-sm ${l.color.split(" ")[0]}`} />
                      <span className="text-[11px] text-slate-600">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming deadlines */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Échéances</h4>
                <div className="space-y-2">
                  {events.filter(e => e.dateDebut).sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()).slice(0, 4).map(e => {
                    const days = daysUntil(e.dateDebut);
                    return (
                      <div key={e._id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-slate-800 truncate">{e.titre}</p>
                          <p className="text-[9px] text-slate-400">{shortDate(e.dateDebut)}</p>
                        </div>
                        <span className={`shrink-0 ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          days === 0 ? "bg-red-50 text-red-600" : days <= 3 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-500"
                        }`}>{days === 0 ? "Auj." : `J-${days}`}</span>
                      </div>
                    );
                  })}
                  {events.length === 0 && <p className="text-[11px] text-slate-400 text-center py-3">Aucun événement</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section: Selected day events + Activities */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Événements du {calSelectedDate ? new Date(calSelectedDate).toLocaleDateString("fr-FR") : "jour"}
                </h3>
                <button onClick={openEventAdd} className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:opacity-90 transition flex items-center gap-1">
                  <Plus size={13} /> Nouvel événement
                </button>
              </div>
              <div className="space-y-2">
                {events.filter(e => e.dateDebut?.startsWith(calSelectedDate || "")).map(ev => (
                  <div key={ev._id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:border-slate-200 hover:shadow-sm group">
                    <div className={`w-1 h-10 rounded-full shrink-0 ${
                      ev.type === "Réunion" ? "bg-blue-400" :
                      ev.type === "Développement" ? "bg-purple-400" :
                      ev.type === "Conception" ? "bg-orange-400" :
                      ev.type === "Intégration" ? "bg-cyan-400" :
                      ev.type === "Tests" ? "bg-emerald-400" :
                      ev.type === "Déploiement" ? "bg-pink-400" : "bg-slate-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{ev.titre}</p>
                      {ev.description && <p className="text-xs text-slate-400 truncate">{ev.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          ev.type === "Réunion" ? "bg-blue-50 text-blue-700" :
                          ev.type === "Développement" ? "bg-purple-50 text-purple-700" :
                          ev.type === "Conception" ? "bg-orange-50 text-orange-700" :
                          ev.type === "Intégration" ? "bg-cyan-50 text-cyan-700" :
                          ev.type === "Tests" ? "bg-emerald-50 text-emerald-700" :
                          ev.type === "Déploiement" ? "bg-pink-50 text-pink-700" :
                          "bg-slate-50 text-slate-600"
                        }`}>{ev.type}</span>
                        {ev.employeId && <span className="text-[10px] text-slate-400">{ev.employeId}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => openEventEdit(ev)} className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600"><Pencil size={13} /></button>
                      <button onClick={() => handleEventDelete(ev._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
                {events.filter(e => e.dateDebut?.startsWith(calSelectedDate || "")).length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">Aucun événement pour cette date</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Activités récentes</h3>
              <div className="space-y-3">
                {[
                  { user: "Omayma H.", action: "a créé l'événement 'Réunion client'", time: "Il y a 2h" },
                  { user: "Ahmed B.", action: "a déplacé la tâche 'Développement Backend' vers En cours", time: "Il y a 4h" },
                  { user: "Sara M.", action: "a terminé la tâche 'Tests et corrections'", time: "Hier" },
                  { user: "Karim A.", action: "a modifié l'événement 'Sprint planning'", time: "Hier" },
                  { user: "John D.", action: "a ajouté un commentaire sur 'API REST'", time: "Il y a 2 jours" },
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 text-[8px] font-bold mt-0.5">
                      {act.user.split(" ").map(s => s[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-600"><span className="font-medium text-slate-800">{act.user}</span> {act.action}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Fichiers */}
      {activeTab === "Fichiers" && (
        <div className="space-y-5">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setShowFileUploadModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-all">
              <Upload size={16} /> Ajouter un fichier
            </button>
            <button onClick={() => setShowNewFolderModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all">
              <Plus size={16} /> Nouveau dossier
            </button>
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={fileSearch} onChange={(e) => setFileSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                placeholder="Rechercher un fichier..." />
            </div>
            <select value={fileTypeFilter} onChange={(e) => setFileTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-violet-400">
              <option value="">Tous les types</option>
              {["PDF", "DOCX", "PPTX", "ZIP", "JPG", "PNG", "FIG", "XLSX"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={fileMemberFilter} onChange={(e) => setFileMemberFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-violet-400">
              <option value="">Tous les membres</option>
              {["Omayma Hoimdi", "Mohamed Salah", "John Smith"].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={fileSort} onChange={(e) => setFileSort(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-violet-400">
              <option value="recent">Plus récents</option>
              <option value="oldest">Plus anciens</option>
              <option value="name-asc">Nom A-Z</option>
              <option value="name-desc">Nom Z-A</option>
              <option value="size">Taille</option>
            </select>
            <div className="relative">
              <button onClick={() => setExtraFilterOpen(!extraFilterOpen)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-all">
                <SlidersHorizontal size={15} /> Filtres
              </button>
              {extraFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExtraFilterOpen(false)} />
                  <div className="absolute right-0 top-11 z-20 w-52 rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                    {[
                      { key: "favorites", label: "Favoris uniquement" },
                      { key: "shared", label: "Fichiers partagés" },
                      { key: "recent", label: "Modifiés récemment" },
                      { key: "archived", label: "Fichiers archivés" },
                    ].map(({ key, label }) => (
                      <button key={key} onClick={() => { const k = key as keyof typeof extraFilters; if (k !== "archived") setExtraFilters(prev => ({ ...prev, [k]: !prev[k] })); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                        <div className={`h-4 w-4 rounded border-2 transition-all ${(extraFilters as any)[key] ? "border-violet-600 bg-violet-600" : "border-slate-300"}`}>
                          {(extraFilters as any)[key] && <Check size={10} className="text-white ml-[1px] mt-[1px]" />}
                        </div>
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
              <button onClick={() => setFileViewMode("list")}
                className={`rounded-lg p-1.5 transition-all ${fileViewMode === "list" ? "bg-violet-100 text-violet-700" : "text-slate-400 hover:text-slate-600"}`}>
                <LayoutList size={16} />
              </button>
              <button onClick={() => setFileViewMode("grid")}
                className={`rounded-lg p-1.5 transition-all ${fileViewMode === "grid" ? "bg-violet-100 text-violet-700" : "text-slate-400 hover:text-slate-600"}`}>
                <Grid3X3 size={16} />
              </button>
            </div>
          </div>

          {/* Content area */}
          {totalFiles === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="rounded-2xl border border-slate-100 bg-white p-12 shadow-sm text-center">
                <Upload size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-500 mb-1">Aucun fichier disponible</p>
                <p className="text-sm text-slate-400 mb-6">Ajoutez des fichiers pour commencer</p>
                <button onClick={() => setShowFileUploadModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90">
                  <Plus size={16} /> Ajouter votre premier fichier
                </button>
              </div>
            </div>
          ) : fileViewMode === "list" ? (
            hasFileFilters ? (
              /* Flat filtered results */
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="grid grid-cols-[32px_minmax(0,1fr)_160px_80px_100px_140px_60px] gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <div></div><div>Nom</div><div>Propriétaire</div><div>Type</div><div>Taille</div><div>Modifié le</div><div></div>
                </div>
                {filePaginated.map(file => {
                  const FileIcon = getFileIcon(file.type);
                  const isSelected = selectedFiles.has(file.id);
                  const isRenaming = fileRenameId === file.id;
                  return (
                    <div key={file.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData("fileId", file.id); }}
                      onContextMenu={(e) => { e.preventDefault(); setFileContextMenu({ x: e.clientX, y: e.clientY, fileId: file.id }); }}
                      onClick={() => toggleFileSelect(file.id)}
                      className={`grid grid-cols-[32px_minmax(0,1fr)_160px_80px_100px_140px_60px] gap-2 items-center border-b border-slate-50 px-4 py-2.5 cursor-pointer transition-all hover:bg-violet-50/30 ${isSelected ? "bg-violet-50/50" : ""}`}
                    >
                      <input type="checkbox" checked={isSelected} onChange={() => toggleFileSelect(file.id)}
                        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`rounded-lg p-2 ${getFileColor(file.type)}`}>
                          <FileIcon size={16} />
                        </div>
                        {isRenaming ? (
                          <input value={fileRenameValue} onChange={(e) => setFileRenameValue(e.target.value)}
                            onBlur={handleRenameConfirm}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRenameConfirm(); if (e.key === "Escape") setFileRenameId(null); }}
                            className="rounded-lg border border-violet-400 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-violet-100"
                            autoFocus onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <span className="text-sm font-medium text-slate-800 truncate">{file.name}</span>
                        )}
                        {file.favorite && <StarIcon size={12} className="fill-amber-400 text-amber-400 shrink-0" />}
                        {file.shared && <Share2 size={12} className="text-blue-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-[9px] font-bold text-violet-700">
                          {file.ownerAvatar}
                        </div>
                        <span className="text-xs text-slate-600 truncate">{file.owner}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{file.type}</span>
                      <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
                      <span className="text-xs text-slate-500">{formatFileDate(file.lastModified)}</span>
                      <button onClick={(e) => { e.stopPropagation(); setFileContextMenu({ x: e.clientX, y: e.clientY, fileId: file.id }); }}
                        className="rounded-lg p-1.5 text-slate-300 hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 transition-all">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Folder structure */
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="grid grid-cols-[32px_minmax(0,1fr)_160px_80px_100px_140px_60px] gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <div></div><div>Nom</div><div>Propriétaire</div><div>Type</div><div>Taille</div><div>Modifié le</div><div></div>
                </div>
                {folders.map(folder => (
                  <div key={folder.id}>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setFileDragOverFolder(folder.id); }}
                      onDragLeave={() => setFileDragOverFolder(null)}
                      onDrop={(e) => handleFileDrop(e, folder.id)}
                      className={`grid grid-cols-[32px_minmax(0,1fr)_160px_80px_100px_140px_60px] gap-2 items-center border-b border-slate-50 px-4 py-3 cursor-pointer transition-all hover:bg-slate-50/50 ${fileDragOverFolder === folder.id ? "bg-violet-50/50 ring-2 ring-violet-200 ring-inset" : ""}`}
                      onClick={() => toggleFolder(folder.id)}
                    >
                      <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                        {expandedFolders.has(folder.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <div className="flex items-center gap-3 min-w-0">
                        <FolderOpen size={20} className="text-violet-500 shrink-0" />
                        {fileRenameId === folder.id ? (
                          <input value={fileRenameValue} onChange={(e) => setFileRenameValue(e.target.value)}
                            onBlur={handleRenameConfirm}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRenameConfirm(); if (e.key === "Escape") setFileRenameId(null); }}
                            className="rounded-lg border border-violet-400 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-violet-100"
                            autoFocus onClick={(e) => e.stopPropagation()} />
                        ) : (
                          <span className="text-sm font-semibold text-slate-800 truncate">{folder.name}</span>
                        )}
                        <span className="text-[11px] text-slate-400 shrink-0">({folder.files.length} fichier{folder.files.length > 1 ? "s" : ""})</span>
                      </div>
                      <div className="text-xs text-slate-400">—</div>
                      <div className="text-xs text-slate-400">—</div>
                      <div className="text-xs text-slate-400">—</div>
                      <div className="text-xs text-slate-400">—</div>
                      <button onClick={(e) => { e.stopPropagation(); setFileContextMenu({ x: e.clientX, y: e.clientY, fileId: folder.id }); }}
                        className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-all">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                    {expandedFolders.has(folder.id) && folder.files.map(file => {
                      const FileIcon = getFileIcon(file.type);
                      const isSelected = selectedFiles.has(file.id);
                      const isRenaming = fileRenameId === file.id;
                      return (
                        <div key={file.id}
                          draggable
                          onDragStart={(e) => { e.dataTransfer.setData("fileId", file.id); }}
                          onContextMenu={(e) => { e.preventDefault(); setFileContextMenu({ x: e.clientX, y: e.clientY, fileId: file.id }); }}
                          onClick={() => toggleFileSelect(file.id)}
                          className={`grid grid-cols-[32px_minmax(0,1fr)_160px_80px_100px_140px_60px] gap-2 items-center border-b border-slate-50 px-4 py-2.5 cursor-pointer transition-all hover:bg-violet-50/30 ${isSelected ? "bg-violet-50/50" : ""}`}
                        >
                          <input type="checkbox" checked={isSelected} onChange={() => toggleFileSelect(file.id)}
                            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`rounded-lg p-2 ${getFileColor(file.type)}`}>
                              <FileIcon size={16} />
                            </div>
                            {isRenaming ? (
                              <input value={fileRenameValue} onChange={(e) => setFileRenameValue(e.target.value)}
                                onBlur={handleRenameConfirm}
                                onKeyDown={(e) => { if (e.key === "Enter") handleRenameConfirm(); if (e.key === "Escape") setFileRenameId(null); }}
                                className="rounded-lg border border-violet-400 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-violet-100"
                                autoFocus onClick={(e) => e.stopPropagation()} />
                            ) : (
                              <span className="text-sm font-medium text-slate-800 truncate">{file.name}</span>
                            )}
                            {file.favorite && <StarIcon size={12} className="fill-amber-400 text-amber-400 shrink-0" />}
                            {file.shared && <Share2 size={12} className="text-blue-400 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-[9px] font-bold text-violet-700">
                              {file.ownerAvatar}
                            </div>
                            <span className="text-xs text-slate-600 truncate">{file.owner}</span>
                          </div>
                          <span className="text-xs font-medium text-slate-500">{file.type}</span>
                          <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
                          <span className="text-xs text-slate-500">{formatFileDate(file.lastModified)}</span>
                          <button onClick={(e) => { e.stopPropagation(); setFileContextMenu({ x: e.clientX, y: e.clientY, fileId: file.id }); }}
                            className="rounded-lg p-1.5 text-slate-300 hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 transition-all">
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Grid View */
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {hasFileFilters ? (
                filePaginated.map(file => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <div key={file.id}
                      onClick={() => toggleFileSelect(file.id)}
                      className={`rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-200 cursor-pointer ${selectedFiles.has(file.id) ? "border-violet-200 bg-violet-50/30" : "border-slate-100 bg-white"}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`rounded-xl p-3 ${getFileColor(file.type)}`}>
                          <FileIcon size={24} />
                        </div>
                        <div className="flex items-center gap-1">
                          {file.favorite && <StarIcon size={12} className="fill-amber-400 text-amber-400" />}
                          {file.shared && <Share2 size={12} className="text-blue-400" />}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-800 truncate mb-1">{file.name}</p>
                      <p className="text-[11px] text-slate-400">{file.type} &middot; {formatFileSize(file.size)}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-[7px] font-bold text-violet-700">
                            {file.ownerAvatar}
                          </div>
                          <span className="text-[10px] text-slate-500 truncate max-w-[70px]">{file.owner}</span>
                        </div>
                        <span className="text-[9px] text-slate-400">{formatFileDate(file.lastModified)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                folders.map(folder => (
                  <div key={folder.id}
                    onDragOver={(e) => { e.preventDefault(); setFileDragOverFolder(folder.id); }}
                    onDragLeave={() => setFileDragOverFolder(null)}
                    onDrop={(e) => handleFileDrop(e, folder.id)}
                    onClick={() => toggleFolder(folder.id)}
                    className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-200 cursor-pointer ${fileDragOverFolder === folder.id ? "ring-2 ring-violet-200 bg-violet-50/30" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <FolderOpen size={32} className="text-violet-500" />
                      <span className="text-[10px] text-slate-400 font-medium">{folder.files.length} fichier{folder.files.length > 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 truncate">{folder.name}</p>
                    {expandedFolders.has(folder.id) && (
                      <div className="mt-3 space-y-1.5 border-t border-slate-50 pt-3">
                        {folder.files.slice(0, 3).map(file => {
                          const FileIcon = getFileIcon(file.type);
                          return (
                            <div key={file.id} className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                              <FileIcon size={12} className="shrink-0" />
                              <span className="truncate">{file.name}</span>
                            </div>
                          );
                        })}
                        {folder.files.length > 3 && <p className="text-[10px] text-violet-600 font-medium">+{folder.files.length - 3} autres</p>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredFiles.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-3 shadow-sm">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{filteredFiles.length}</span> fichier{filteredFiles.length > 1 ? "s" : ""} sur <span className="font-semibold text-slate-700">{totalFiles}</span>
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Par page:</span>
                <span className="text-xs font-semibold text-slate-700">{filePageSize}</span>
                <div className="flex items-center gap-1">
                  <button disabled={filePage <= 1} onClick={() => setFilePage(p => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-3 text-xs text-slate-600">Page {filePage} / {fileTotalPages}</span>
                  <button disabled={filePage >= fileTotalPages} onClick={() => setFilePage(p => Math.min(fileTotalPages, p + 1))}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Context menu */}
      {fileContextMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setFileContextMenu(null)} />
          <div className="fixed z-40 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl" style={{ left: fileContextMenu.x, top: fileContextMenu.y }}>
            {(fileContextMenu.fileId.startsWith("fold-")
              ? ["Renommer", "Supprimer"]
              : ["Télécharger", "Renommer", "Ajouter aux favoris", "Supprimer"]
            ).map((action, i) => {
              const isDelete = action === "Supprimer";
              const isFav = action === "Ajouter aux favoris";
              const isRename = action === "Renommer";
              const isDownload = action === "Télécharger";
              return (
                <button key={action} onClick={() => {
                  const fileId = fileContextMenu.fileId;
                  if (isDelete) handleFileAction("delete", fileId);
                  else if (isFav) handleFileAction("favorite", fileId);
                  else if (isRename) handleFileAction("rename", fileId);
                  else if (isDownload) {
                    handleFileAction("preview", fileId);
                  }
                  setFileContextMenu(null);
                }}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-all ${isDelete ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-violet-50"}`}>
                  {isDelete && <Trash2 size={14} />}
                  {isFav && <StarIcon size={14} />}
                  {isRename && <Pencil size={14} />}
                  {isDownload && <Download size={14} />}
                  {!isDelete && !isFav && !isRename && !isDownload && <ExternalLink size={14} />}
                  {action}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* File Upload Modal */}
      {showFileUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Ajouter un fichier</h2>
              <button onClick={() => setShowFileUploadModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div
                className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center transition-all hover:border-violet-300 hover:bg-violet-50/20 cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (!file) return;
                  const ext = (file.name.split(".").pop() ?? "").toUpperCase();
                  const data = await readFileAsDataURL(file);
                  const newFile: FileItem = {
                    id: "f" + Date.now(),
                    name: file.name.replace("." + ext.toLowerCase(), ""),
                    type: ["PDF","DOCX","PPTX","ZIP","JPG","PNG","FIG","XLSX"].includes(ext) ? ext : "PDF",
                    size: file.size, owner: "Omayma Hoimdi", ownerAvatar: "OH",
                    lastModified: new Date().toISOString(), folderId: fileUploadFolder,
                    favorite: false, shared: false, data,
                  };
                  setFolders(prev => prev.map(f => f.id === fileUploadFolder ? { ...f, files: [...f.files, newFile] } : f));
                  setShowFileUploadModal(false);
                }}
              >
                <Upload size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium text-slate-700 mb-1">Déposez vos fichiers ici</p>
                <p className="text-xs text-slate-400 mb-4">ou cliquez pour parcourir</p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90">
                  <Upload size={14} /> Parcourir
                  <input type="file" className="hidden" multiple onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    const newFiles: FileItem[] = await Promise.all(files.map(async (file) => {
                      const ext = (file.name.split(".").pop() ?? "").toUpperCase();
                      const data = await readFileAsDataURL(file);
                      return {
                        id: "f" + Date.now() + Math.random(),
                        name: file.name.replace("." + ext.toLowerCase(), ""),
                        type: ["PDF","DOCX","PPTX","ZIP","JPG","PNG","FIG","XLSX"].includes(ext) ? ext : "PDF",
                        size: file.size, owner: "Omayma Hoimdi", ownerAvatar: "OH",
                        lastModified: new Date().toISOString(), folderId: fileUploadFolder,
                        favorite: false, shared: false, data,
                      };
                    }));
                    setFolders(prev => prev.map(f => f.id === fileUploadFolder ? { ...f, files: [...f.files, ...newFiles] } : f));
                    setShowFileUploadModal(false);
                  }} />
                </label>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Dossier de destination</label>
                <select value={fileUploadFolder} onChange={(e) => setFileUploadFolder(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white">
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Nouveau dossier</h2>
              <button onClick={() => { setShowNewFolderModal(false); setNewFolderName(""); }} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Nom du dossier</label>
                <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddFolder(); }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  placeholder="Ex: 07. Développement frontend" autoFocus />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setShowNewFolderModal(false); setNewFolderName(""); }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                <button onClick={handleAddFolder}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2 text-sm font-medium text-white hover:opacity-90">Créer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {showFilePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {allFiles.find(f => f.id === showFilePreview)?.name}
              </h2>
              <button onClick={() => setShowFilePreview(null)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-6">
              {(() => {
                const file = allFiles.find(f => f.id === showFilePreview);
                if (!file) return null;
                const FileIcon = getFileIcon(file.type);
                return (
                  <div className="space-y-4">

                    {/* File header */}
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                      <div className={`rounded-xl p-3 ${getFileColor(file.type)}`}>
                        <FileIcon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{file.type} &middot; {formatFileSize(file.size)} &middot; {file.owner}</p>
                      </div>
                      <button onClick={() => setShowFilePreview(null)}
                        className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
                    </div>

                    {/* File content preview */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 min-h-[200px] max-h-[400px] overflow-y-auto">
                      {file.data && (file.type === "JPG" || file.type === "PNG") && (
                        <img src={file.data} alt={file.name} className="max-w-full max-h-[360px] mx-auto rounded-lg object-contain" />
                      )}
                      {!file.data && (file.type === "PDF" || file.type === "DOCX") && (
                        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                          <h4 className="font-bold text-slate-900 text-base mb-3">{file.name}</h4>
                          <p>Le présent document a pour objet de définir les spécifications fonctionnelles et techniques du projet {project?.titre || "AgencyFlow"}.</p>
                          <p>Il s&apos;adresse à l&apos;ensemble des parties prenantes, incluant les équipes de développement, de design et de gestion de projet.</p>
                          <p className="font-semibold text-slate-800 mt-4">1. Contexte et objectifs</p>
                          <p>Ce projet vise à moderniser l&apos;infrastructure existante et à offrir une expérience utilisateur optimale sur l&apos;ensemble des supports digitaux.</p>
                          <p className="font-semibold text-slate-800 mt-4">2. Périmètre fonctionnel</p>
                          <p>Les fonctionnalités couvertes incluent la gestion des projets, le suivi des tâches, la collaboration en équipe et les rapports de performance.</p>
                          <p className="font-semibold text-slate-800 mt-4">3. Calendrier prévisionnel</p>
                          <p>La livraison est prévue en plusieurs phases : Analyse (J-30), Conception (J-60), Développement (J-90), Tests (J-105), Déploiement (J-120).</p>
                        </div>
                      )}
                      {file.data && (file.type === "PDF" || file.type === "DOCX") && (
                        <iframe src={file.data} className="w-full h-[360px] rounded-lg border-0" title={file.name} />
                      )}
                      {file.type === "PPTX" && (
                        <div className="space-y-3">
                          <div className="rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 p-6 text-center border border-violet-100">
                            <p className="text-sm font-bold text-violet-800 mb-1">{file.name}</p>
                            <p className="text-xs text-violet-500">Présentation &middot; {formatFileSize(file.size)}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[1,2,3,4].map(i => (
                              <div key={i} className="rounded-lg bg-white border border-slate-100 p-3 text-center">
                                <div className="h-12 rounded bg-gradient-to-br from-violet-100 to-purple-50 mb-2 flex items-center justify-center text-[10px] text-violet-400">Slide {i}</div>
                                <p className="text-[10px] text-slate-500">Diapositive {i}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {file.type === "XLSX" && (
                        <div className="text-sm">
                          <div className="grid grid-cols-4 gap-px bg-slate-200 rounded-lg overflow-hidden">
                            {["Tâche", "Statut", "Priorité", "Échéance"].map(h => (
                              <div key={h} className="bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-600">{h}</div>
                            ))}
                            {[
                              ["Développement API", "En cours", "Haute", "J-15"],
                              ["Tests unitaires", "À faire", "Moyenne", "J-20"],
                              ["Déploiement", "En attente", "Urgente", "J-30"],
                            ].map((row, i) => row.map((cell, j) => (
                              <div key={i+"-"+j} className="bg-white px-3 py-2 text-[11px] text-slate-700">{cell}</div>
                            )))}
                          </div>
                        </div>
                      )}
                      {!file.data && (file.type === "JPG" || file.type === "PNG") && (
                        <div className="flex items-center justify-center h-[200px]">
                          <div className={`rounded-2xl p-10 ${getFileColor(file.type)}`}>
                            <FileIcon size={64} className="opacity-40" />
                          </div>
                        </div>
                      )}
                      {file.type === "FIG" && (
                        <div className="flex items-center justify-center h-[200px]">
                          <div className="rounded-2xl bg-gradient-to-br from-violet-100 to-purple-50 p-8 text-center border border-violet-200 w-full max-w-xs">
                            <Palette size={40} className="mx-auto mb-2 text-violet-400" />
                            <p className="text-xs text-violet-600 font-medium">Figma Design File</p>
                            <p className="text-[10px] text-violet-400 mt-1">{file.name}.fig</p>
                          </div>
                        </div>
                      )}
                      {file.type === "ZIP" && (
                        <div className="space-y-1">
                          {["src/", "public/", "package.json", "README.md", "tsconfig.json"].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white text-xs text-slate-600">
                              {item.endsWith("/") ? <FolderOpen size={12} className="text-violet-400" /> : <FileText size={12} className="text-slate-400" />}
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-2">
                      <p className="text-[11px] text-slate-400">
                        Modifié le {new Date(file.lastModified).toLocaleDateString("fr-FR")}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => {
                        if (!file) return;
                        if (file.data) {
                          const a = document.createElement("a"); a.href = file.data; a.download = file.name + "." + file.type.toLowerCase(); a.click();
                        } else {
                          function getPreviewHtml() {
                            if (!file) return "";
                            let body = "";
                            if (file.type === "PDF" || file.type === "DOCX") {
                              body = '<p style="font-weight:600;font-size:15px;margin-top:20px;margin-bottom:8px;color:#7c3aed">Contexte et objectifs</p><p>Ce document definit les specifications du projet ' + (project?.titre || "AgencyFlow") + '.</p><p style="font-weight:600;font-size:15px;margin-top:20px;margin-bottom:8px;color:#7c3aed">Perimetre fonctionnel</p><p>Gestion des projets, suivi des taches, collaboration en equipe, rapports de performance.</p><p style="font-weight:600;font-size:15px;margin-top:20px;margin-bottom:8px;color:#7c3aed">Calendrier</p><p>Analyse (J-30), Conception (J-60), Developpement (J-90), Tests (J-105), Deploiement (J-120).</p>';
                            } else if (file.type === "PPTX") {
                              body = '<p>Presentation: ' + file.name + '</p><p>' + formatFileSize(file.size) + ' - 12 diapositives</p>';
                            } else if (file.type === "XLSX") {
                              body = '<p>Fichier de donnees: ' + file.name + '</p><p>3 feuilles de calcul</p>';
                            } else if (file.type === "JPG" || file.type === "PNG") {
                              body = '<div style="background:#f1f5f9;border-radius:12px;padding:60px;text-align:center;color:#94a3b8;font-size:16px">' + file.type + ' - ' + formatFileSize(file.size) + '</div>';
                            } else if (file.type === "FIG") {
                              body = '<p>Fichier de design Figma</p>';
                            } else if (file.type === "ZIP") {
                              body = '<p>Archive contenant ' + Math.floor(Math.random()*20+5) + ' fichiers</p>';
                            } else {
                              body = '<p>Fichier ' + file.type + '</p>';
                            }
                            return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>' + file.name + '</title><style>body{font-family:Inter,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#1e293b;line-height:1.6}h1{font-size:22px;margin-bottom:4px}.meta{color:#94a3b8;font-size:13px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e2e8f0}.content{font-size:14px}p{margin-bottom:12px}</style></head><body><h1>' + file.name + '</h1><div class="meta">' + file.type + ' - ' + formatFileSize(file.size) + ' - ' + file.owner + '</div><div class="content">' + body + '</div></body></html>';
                          }
                          const blob = new Blob([getPreviewHtml()], { type: "text/html;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a"); a.href = url; a.download = file.name + ".html"; a.click();
                          URL.revokeObjectURL(url);
                        }
                      }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                          <Download size={12} /> Télécharger
                        </button>
                        <button onClick={() => setShowFilePreview(null)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                          <X size={12} /> Fermer
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Discussions */}
      {activeTab === "Discussions" && (
        <div className="flex gap-0 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden" style={{ height: "calc(100vh - 280px)" }}>
          {/* LEFT PANEL */}
          <div className="w-72 shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-3 border-b border-slate-100 space-y-2">
              <button onClick={() => setShowCreateChannel(true)} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 transition flex items-center gap-1.5 justify-center">
                <Plus size={14} /> Nouvelle discussion
              </button>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={channelSearch} onChange={(e) => setChannelSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  placeholder="Rechercher une discussion..." />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredChannels.map(ch => {
                const isActive = ch.id === activeChannel;
                return (
                  <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                    className={`w-full text-left px-3 py-2.5 transition hover:bg-slate-50 border-b border-slate-50 ${isActive ? "bg-violet-50/60 border-l-2 border-l-violet-500" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Hash size={14} className={`shrink-0 ${isActive ? "text-violet-600" : "text-slate-400"}`} />
                        <span className={`text-sm font-medium truncate ${isActive ? "text-violet-900" : "text-slate-700"}`}>{ch.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ch.unread > 0 && (
                          <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-violet-600 text-[10px] font-bold text-white px-1">{ch.unread}</span>
                        )}
                        <span className="text-[10px] text-slate-400">{formatDiscussionTime(ch.lastActivity)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400">{ch.members} membres</span>
                      <span className="text-[10px] text-slate-400">·</span>
                      <span className="text-[10px] text-slate-500 truncate">{ch.lastMessage}</span>
                    </div>
                  </button>
                );
              })}
              {filteredChannels.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">Aucune discussion trouvée</div>
              )}
            </div>
          </div>

          {/* CENTER PANEL */}
          <div className="flex-1 flex flex-col">
            {activeChannelData ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-3">
                    <Hash size={18} className="text-violet-600" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{activeChannelData.name}</h3>
                      <p className="text-[11px] text-slate-400">{activeChannelData.members} membres</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"><Search size={15} /></button>
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"><Phone size={15} /></button>
                    <button onClick={() => setChannelMenu(channelMenu === activeChannelData.id ? null : activeChannelData.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition relative">
                      <MoreHorizontal size={15} />
                      {channelMenu === activeChannelData.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setChannelMenu(null)} />
                          <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
                            <button className="flex w-full items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700"><Pin size={13} /> Messages épinglés</button>
                            <button className="flex w-full items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700"><Bell size={13} /> Notifications</button>
                            <button className="flex w-full items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50"><Trash2 size={13} /> Supprimer le canal</button>
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                  {channelMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare size={36} className="text-slate-200 mb-3" />
                      <p className="text-sm font-medium text-slate-400">Aucun message</p>
                      <p className="text-xs text-slate-300 mt-1">Soyez le premier à écrire dans #{activeChannelData.name}</p>
                    </div>
                  )}
                  {channelMessages.map(msg => {
                    const replies = getReplies(msg.id);
                    const isEditing = editingMessageId === msg.id;
                    const isPinned = msg.pinned;
                    return (
                      <div key={msg.id} className={`group rounded-xl px-4 py-2.5 transition hover:bg-slate-50 ${isPinned ? "border border-violet-100 bg-violet-50/20" : ""}`}>
                        {isPinned && (
                          <div className="flex items-center gap-1 mb-1.5">
                            <Pin size={10} className="text-violet-400" />
                            <span className="text-[10px] text-violet-500 font-medium">Message épinglé</span>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-xs font-bold">
                            {msg.userAvatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800">{msg.userName}</span>
                              <span className="text-[10px] text-slate-400">{formatDiscussionShortDate(msg.time)}</span>
                              {msg.edited && <span className="text-[9px] text-slate-300">(modifié)</span>}
                            </div>
                            {isEditing ? (
                              <div className="mt-1 flex gap-2">
                                <input value={editMessageContent} onChange={(e) => setEditMessageContent(e.target.value)}
                                  className="flex-1 rounded-lg border border-violet-300 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-violet-100"
                                  onKeyDown={(e) => { if (e.key === "Enter") handleEditMessage(msg.id); if (e.key === "Escape") setEditingMessageId(null); }}
                                  autoFocus />
                                <button onClick={() => handleEditMessage(msg.id)} className="rounded-lg bg-violet-600 px-2.5 py-1 text-[10px] font-medium text-white hover:opacity-90">OK</button>
                                <button onClick={() => setEditingMessageId(null)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-50">Annuler</button>
                              </div>
                            ) : (
                              <div className="mt-0.5 space-y-2">
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {msg.attachments.map((att, ai) => (
                                      att.type === "image" ? (
                                        <img key={ai} src={att.data} alt={att.name}
                                          className="max-w-[240px] max-h-[200px] rounded-xl border border-slate-100 object-cover cursor-pointer hover:opacity-90 transition"
                                          onClick={() => window.open(att.data, "_blank")} />
                                      ) : att.type === "voice" ? (
                                        <div className="flex items-center gap-2 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2">
                                          <Mic size={14} className="text-violet-500" />
                                          <audio src={att.data} controls className="h-8 w-44" />
                                        </div>
                                      ) : (
                                        <a href={att.data} download={att.name}
                                          className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 transition">
                                          <Paperclip size={12} className="text-slate-400" />
                                          <span className="truncate max-w-[120px]">{att.name}</span>
                                        </a>
                                      )
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {!isEditing && (
                              <>
                                {/* Reactions */}
                                {msg.reactions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {msg.reactions.map((r, i) => (
                                      <button key={i} onClick={() => handleToggleReaction(msg.id, r.emoji)}
                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${r.users.includes("user-1") ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                                        {r.emoji} <span className="text-[10px]">{r.users.length}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition">
                                  <button onClick={() => handleToggleReaction(msg.id, "👍")} className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600">👍</button>
                                  <button onClick={() => handleToggleReaction(msg.id, "❤️")} className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600">❤️</button>
                                  <button onClick={() => handleToggleReaction(msg.id, "😊")} className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600">😊</button>
                                  <button onClick={() => { setReplyToId(msg.id); }} className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Reply size={11} /></button>
                                  <button onClick={() => { setEditingMessageId(msg.id); setEditMessageContent(msg.content); }} className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Pencil size={11} /></button>
                                  <button onClick={() => handleTogglePin(msg.id)} className={`rounded px-1.5 py-0.5 text-xs ${isPinned ? "text-violet-500" : "text-slate-400 hover:text-slate-600"} hover:bg-slate-100`}><Pin size={11} /></button>
                                  <button onClick={() => handleDeleteMessage(msg.id)} className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={11} /></button>
                                </div>
                              </>
                            )}
                            {/* Replies */}
                            {replies.length > 0 && (
                              <div className="ml-2 mt-2 pl-3 border-l-2 border-slate-100 space-y-2">
                                {replies.map(reply => (
                                  <div key={reply.id} className="flex items-start gap-2">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 text-[9px] font-bold">
                                      {reply.userAvatar}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-semibold text-slate-700">{reply.userName}</span>
                                        <span className="text-[9px] text-slate-400">{formatDiscussionShortDate(reply.time)}</span>
                                      </div>
                                      <p className="text-xs text-slate-600">{reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply indicator */}
                {replyToId && (
                  <div className="flex items-center gap-2 px-5 py-1.5 bg-violet-50/50 border-t border-violet-100 shrink-0">
                    <Reply size={12} className="text-violet-500" />
                    <span className="text-xs text-violet-600">Réponse à un message</span>
                    <button onClick={() => setReplyToId(null)} className="ml-auto rounded p-0.5 text-slate-400 hover:text-slate-600"><X size={14} /></button>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-slate-100 shrink-0 relative">
                  {/* Pending attachments preview */}
                  {pendingAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 px-1">
                      {pendingAttachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5">
                          {att.type === "image" ? (
                            <img src={att.data} alt="" className="h-8 w-8 rounded object-cover" />
                          ) : att.type === "voice" ? (
                            <Mic size={14} className="text-violet-500" />
                          ) : (
                            <Paperclip size={14} className="text-slate-400" />
                          )}
                          <span className="text-xs text-slate-600 truncate max-w-[80px]">{att.name}</span>
                          <button onClick={() => handleRemoveAttachment(i)} className="rounded p-0.5 text-slate-300 hover:text-red-500"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recording indicator */}
                  {isRecording && (
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-medium text-red-500">Enregistrement...</span>
                      <span className="text-xs text-slate-400">{formatRecordingTime(recordingTime)}</span>
                      <button onClick={stopRecording} className="rounded-lg bg-red-500 px-2.5 py-1 text-[10px] font-medium text-white hover:opacity-90">Arrêter</button>
                    </div>
                  )}

                  {toxicAlert && (
                    <div className="flex items-center gap-2 mb-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                      <AlertCircle size={14} className="shrink-0" />
                      {toxicAlert}
                    </div>
                  )}
                  <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition relative">
                    <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.docx,.xlsx,.zip,.pptx,.txt"
                      className="hidden" onChange={handleFileSelect} />
                    {/* Emoji picker */}
                    {showEmojiPicker && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                        <div className="absolute bottom-12 left-0 z-20 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                          <div className="grid grid-cols-8 gap-0.5 max-h-40 overflow-y-auto">
                            {EMOJIS.map((emoji, i) => (
                              <button key={i} onClick={() => insertEmoji(emoji)}
                                className="rounded-lg p-1.5 text-lg hover:bg-slate-100 transition"> {emoji}</button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {/* Mention picker */}
                    {showMentionPicker && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => { setShowMentionPicker(false); setMentionSearch(""); }} />
                        <div className="absolute bottom-12 left-0 z-20 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                          <div className="px-2 pb-1">
                            <p className="text-[10px] font-medium text-slate-400 uppercase">Membres</p>
                          </div>
                          <div className="max-h-36 overflow-y-auto space-y-0.5">
                            {filteredMentions.map(m => (
                              <button key={m._id} onClick={() => handleMentionSelect(m.prenom + " " + m.nom)}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-[9px] font-bold">
                                  {m.prenom[0]}{m.nom[0]}
                                </div>
                                <span>{m.prenom} {m.nom}</span>
                                <span className="ml-auto text-[9px] text-slate-400">{m.role}</span>
                              </button>
                            ))}
                            {filteredMentions.length === 0 && (
                              <p className="px-2 py-2 text-xs text-slate-400">Aucun membre trouvé</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    <textarea value={messageInput} onChange={handleInputChange}
                      onKeyDown={handleInputKeyDown}
                      className="flex-1 resize-none outline-none text-sm text-slate-700 px-2 py-1 max-h-32"
                      placeholder="Écrire un message..."
                      rows={1} />
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => fileInputRef.current?.click()} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"><Paperclip size={15} /></button>
                      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"><Smile size={15} /></button>
                      <button onClick={() => { setShowMentionPicker(!showMentionPicker); setMentionSearch(""); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"><AtSign size={15} /></button>
                      {isRecording ? (
                        <button onClick={stopRecording} className="rounded-lg bg-red-500 p-2 text-white hover:opacity-90 transition">
                          <Mic size={15} />
                        </button>
                      ) : (
                        <button onClick={startRecording} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"><Mic size={15} /></button>
                      )}
                      <button onClick={handleSendMessage}
                        className="rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 p-2 text-white hover:opacity-90 transition">
                        <MessageCircle size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageSquare size={48} className="mb-3 opacity-30" />
                <p className="text-sm font-medium text-slate-500">Sélectionnez une discussion</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Nouvelle discussion</h2>
              <button onClick={() => setShowCreateChannel(false)} className="rounded-lg p-1 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Nom du canal</label>
                <input value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  placeholder="ex: Nouveau design"
                  onKeyDown={(e) => { if (e.key === "Enter") { if (newChannelName.trim()) { setChannels(prev => [...prev, { id: "ch-" + Date.now(), name: newChannelName.trim(), members: 1, lastMessage: "Canal créé", lastActivity: new Date().toISOString(), unread: 0, createdBy: "Omayma Hoimdi" }]); setActiveChannel("ch-" + Date.now()); setShowCreateChannel(false); setNewChannelName(""); } } }} />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreateChannel(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
                <button onClick={() => { if (newChannelName.trim()) { setChannels(prev => [...prev, { id: "ch-" + Date.now(), name: newChannelName.trim(), members: 1, lastMessage: "Canal créé", lastActivity: new Date().toISOString(), unread: 0, createdBy: "Omayma Hoimdi" }]); setActiveChannel("ch-" + Date.now()); setShowCreateChannel(false); setNewChannelName(""); } }}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90">Créer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Activités */}
      {activeTab === "Activités" && (
        <div className="flex gap-6">
          {/* Main timeline */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Filters */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={activityFilterType} onChange={(e) => { setActivityFilterType(e.target.value); setActivityPage(1); }}
                    className="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs outline-none focus:border-violet-400 appearance-none cursor-pointer">
                    <option value="">Toutes les activités</option>
                    <option value="tache">Tâches</option>
                    <option value="fichier">Fichiers</option>
                    <option value="commentaire">Commentaires</option>
                    <option value="calendrier">Calendrier</option>
                    <option value="equipe">Équipe</option>
                    <option value="budget">Budget</option>
                  </select>
                </div>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={activityFilterMember} onChange={(e) => { setActivityFilterMember(e.target.value); setActivityPage(1); }}
                    className="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs outline-none focus:border-violet-400 appearance-none cursor-pointer">
                    <option value="">Tous les membres</option>
                    {[...new Set(activityEntries.map(a => a.user))].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <input type="date" value={activityDateStart} onChange={(e) => { setActivityDateStart(e.target.value); setActivityPage(1); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-violet-400" />
                <span className="text-xs text-slate-400">→</span>
                <input type="date" value={activityDateEnd} onChange={(e) => { setActivityDateEnd(e.target.value); setActivityPage(1); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-violet-400" />
                <div className="relative flex-1 min-w-[160px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={activitySearch} onChange={(e) => { setActivitySearch(e.target.value); setActivityPage(1); }}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-violet-400"
                    placeholder="Rechercher une activité..." />
                </div>
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                  <Filter size={13} /> Filtres avancés
                </button>
              </div>
            </div>

            {/* Timeline */}
            {groupedActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Activity size={48} className="mb-3 opacity-30" />
                <p className="text-sm font-medium text-slate-500">Aucune activité</p>
                <p className="text-xs text-slate-300 mt-1">Aucune activité ne correspond aux filtres sélectionnés</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedActivities.map(group => (
                  <div key={group.date}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-slate-100" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{group.label}</span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    <div className="space-y-2">
                      {group.items.map(item => {
                        const badgeStyles: Record<string, string> = {
                          tache: "bg-violet-50 text-violet-700 border-violet-200",
                          fichier: "bg-blue-50 text-blue-700 border-blue-200",
                          commentaire: "bg-pink-50 text-pink-700 border-pink-200",
                          calendrier: "bg-orange-50 text-orange-700 border-orange-200",
                          equipe: "bg-emerald-50 text-emerald-700 border-emerald-200",
                          budget: "bg-red-50 text-red-700 border-red-200",
                        };
                        const badgeColors: Record<string, string> = {
                          tache: "bg-violet-500", fichier: "bg-blue-500", commentaire: "bg-pink-500",
                          calendrier: "bg-orange-500", equipe: "bg-emerald-500", budget: "bg-red-500",
                        };
                        const badgeLabels: Record<string, string> = {
                          tache: "Tâche", fichier: "Fichier", commentaire: "Commentaire",
                          calendrier: "Calendrier", equipe: "Équipe", budget: "Budget",
                        };
                        const badgeIcons: Record<string, any> = {
                          tache: CheckSquare, fichier: FileText, commentaire: MessageCircle,
                          calendrier: Calendar, equipe: Users, budget: DollarSign,
                        };
                        const BadgeIcon = badgeIcons[item.type];
                        return (
                          <div key={item.id} className="group relative flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
                            {/* Timeline indicator */}
                            <div className="flex flex-col items-center shrink-0">
                              <div className={`h-3 w-3 rounded-full ${badgeColors[item.type]} ring-4 ring-white shadow-sm`} />
                              <div className="w-px flex-1 bg-slate-100 mt-1" />
                            </div>
                            {/* Avatar */}
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-violet-600 text-sm font-bold`}>
                              {item.userAvatar}
                            </div>
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <span className="text-sm font-semibold text-slate-900">{item.user}</span>
                                  <span className="text-sm text-slate-600"> {item.action}</span>
                                  <p className="text-sm font-medium text-slate-900 mt-0.5">{item.target}</p>
                                  {item.details && <p className="text-xs text-slate-500 mt-1 italic">{item.details}</p>}
                                  {item.oldValue && item.newValue && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 line-through">{item.oldValue}</span>
                                      <ChevronRight size={12} className="text-slate-400" />
                                      <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700 font-medium">{item.newValue}</span>
                                    </div>
                                  )}
                                </div>
                                <span className={`shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-medium ${badgeStyles[item.type]}`}>
                                  <BadgeIcon size={11} /> {badgeLabels[item.type]}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1.5">{formatDiscussionShortDate(item.timestamp)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {/* Load more */}
                {hasMoreActivities && (
                  <div className="text-center pt-2">
                    <button onClick={() => setActivityPage(prev => prev + 1)}
                      className="rounded-xl border border-slate-200 px-6 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition">
                      Afficher plus d'activités ({totalActivities - activityPage * pageSizeActivities} restantes)
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
                  { label: "Tâches créées", value: activitySummary.taches, icon: CheckSquare, color: "text-violet-600", bg: "bg-violet-50" },
                  { label: "Fichiers ajoutés", value: activitySummary.fichiers, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Commentaires", value: activitySummary.commentaires, icon: MessageCircle, color: "text-pink-600", bg: "bg-pink-50" },
                  { label: "Événements créés", value: activitySummary.evenements, icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
                  { label: "Membres ajoutés", value: activitySummary.equipe, icon: UserPlus, color: "text-emerald-600", bg: "bg-emerald-50" },
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

            {/* Activity by member (donut) */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Activité par membre</h3>
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie data={activityByMember} dataKey="value" cx={50} cy={50} innerRadius={28} outerRadius={45} strokeWidth={0}>
                        {activityByMember.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {activityByMember.map((m, i) => (
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
                {frequentActivities.map(([type, count], i) => {
                  const freqLabels: Record<string, string> = { fichiers: "Fichiers ajoutés", commentaires: "Commentaires", taches: "Tâches créées", evenements: "Événements créés" };
                  const freqIcons: Record<string, any> = { fichiers: Upload, commentaires: MessageCircle, taches: CheckSquare, evenements: Calendar };
                  const freqColors: Record<string, string> = { fichiers: "text-blue-600 bg-blue-50", commentaires: "text-pink-600 bg-pink-50", taches: "text-violet-600 bg-violet-50", evenements: "text-orange-600 bg-orange-50" };
                  const FreqIcon = freqIcons[type];
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 w-4">{i + 1}</span>
                      <div className={`rounded-lg p-1.5 ${freqColors[type]}`}><FreqIcon size={12} /></div>
                      <span className="flex-1 text-xs text-slate-600">{freqLabels[type]}</span>
                      <span className="text-sm font-bold text-slate-900">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab !== "Vue d'ensemble" && activeTab !== "Tâches" && activeTab !== "Kanban" && activeTab !== "Calendrier" && activeTab !== "Fichiers" && activeTab !== "Discussions" && activeTab !== "Activités" && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="rounded-2xl border border-slate-100 bg-white p-12 shadow-sm w-full max-w-md text-center">
            <LayoutGrid size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium text-slate-500">Onglet &laquo;{activeTab}&raquo;</p>
            <p className="mt-1 text-sm">Contenu en cours de développement</p>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingEvent ? "Modifier l'événement" : "Nouvel événement"}
              </h2>
              <button onClick={() => setShowEventModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleEventSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Titre *</label>
                <input value={eventForm.titre} onChange={(e) => setEventForm({ ...eventForm, titre: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-100 ${!eventForm.titre.trim() ? "" : ""} border-slate-200 focus:border-violet-400`}
                  placeholder="Titre de l'événement" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Description</label>
                <textarea rows={2} value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
                  placeholder="Description optionnelle" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Type</label>
                  <select value={eventForm.type} onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white">
                    {["Réunion", "Développement", "Conception", "Intégration", "Tests", "Déploiement", "Autre"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Assigné</label>
                  <select value={eventForm.employeId} onChange={(e) => setEventForm({ ...eventForm, employeId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white">
                    <option value="">Non assigné</option>
                    {team.map(m => <option key={m._id} value={m._id}>{m.prenom} {m.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Date début *</label>
                  <input type="date" value={eventForm.dateDebut} onChange={(e) => setEventForm({ ...eventForm, dateDebut: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Date fin</label>
                  <input type="date" value={eventForm.dateFin} onChange={(e) => setEventForm({ ...eventForm, dateFin: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEventModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit"
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2 text-sm font-medium text-white disabled:opacity-60 hover:opacity-90">
                  {editingEvent ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingTask ? "Modifier la tâche" : "Nouvelle tâche"}
              </h2>
              <button onClick={() => setShowTaskModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleTaskSubmit} className="p-6 space-y-4">
              {taskError && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 flex items-center gap-2"><AlertCircle size={14} /> {taskError}</p>}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Titre *</label>
                <input value={taskForm.titre} onChange={(e) => setTaskForm({ ...taskForm, titre: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-100 ${taskFormErrors.titre ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-violet-400"}`} />
                {taskFormErrors.titre && <p className="mt-1 text-xs text-red-500"><AlertCircle size={12} className="inline mr-1" />{taskFormErrors.titre}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Description *</label>
                <textarea rows={3} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-100 resize-none ${taskFormErrors.description ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-violet-400"}`} />
                {taskFormErrors.description && <p className="mt-1 text-xs text-red-500"><AlertCircle size={12} className="inline mr-1" />{taskFormErrors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Statut</label>
                  <select value={taskForm.statut} onChange={(e) => setTaskForm({ ...taskForm, statut: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white">
                    {TASK_STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Priorité</label>
                  <select value={taskForm.priorite} onChange={(e) => setTaskForm({ ...taskForm, priorite: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white">
                    {["Faible", "Moyenne", "Haute", "Urgente"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Assigné à</label>
                  <select value={taskForm.employeId} onChange={(e) => setTaskForm({ ...taskForm, employeId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 bg-white">
                    <option value="">Non assigné</option>
                    {team.map((m) => <option key={m._id} value={m._id}>{m.prenom} {m.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Date début</label>
                  <input type="date" value={taskForm.dateDebut} onChange={(e) => setTaskForm({ ...taskForm, dateDebut: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Date fin</label>
                  <input type="date" value={taskForm.dateFin} onChange={(e) => setTaskForm({ ...taskForm, dateFin: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowTaskModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={taskSaving}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2 text-sm font-medium text-white disabled:opacity-60 hover:opacity-90">
                  {taskSaving ? "Enregistrement..." : editingTask ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
