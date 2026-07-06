"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Star, Mail, Phone, MapPin, Globe, Building2,
  MoreVertical, Pencil, Trash2, Send, Paperclip, Bell,
  Clock, UserCircle2, Calendar, FileText, MessageSquare,
  CheckSquare, AlertCircle, Activity, DollarSign, Users,
  Briefcase, Heart, TrendingUp, ChevronRight,
  Plus, X, Download, Eye, ClipboardList, Edit, UserPlus,
  MessageCircle, FilePlus, Star as StarIcon, RefreshCw
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

import "leaflet/dist/leaflet.css";
import * as L from "leaflet";

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

interface ClientActivity {
  _id: string;
  clientId: string;
  userId: string;
  action: string;
  description: string;
  createdAt: string;
}

interface ClientComment {
  _id: string;
  clientId: string;
  userId: string;
  comment: string;
  createdAt: string;
}

interface ClientDocument {
  _id: string;
  clientId: string;
  documentName: string;
  documentType: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

interface ClientReminder {
  _id: string;
  clientId: string;
  title: string;
  description: string;
  reminderDate: string;
  endDate?: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface ClientEmail {
  _id: string;
  clientId: string;
  senderEmail: string;
  receiverEmail: string;
  subject: string;
  message: string;
  status: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
}

interface ClientLocation {
  _id: string;
  clientId: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

interface ClientInvoice {
  _id: string;
  clientId: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  createdAt: string;
}

interface Project {
  _id: string;
  titre: string;
  description?: string;
  statut: string;
  priorite: string;
  budget: number;
  clientId: any;
  dateDebut?: string;
  dateFin?: string;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  type: "REMINDER" | "INVOICE" | "TASK" | "PROJECT";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

function getUrgentNotifications(reminders: ClientReminder[], invoices: ClientInvoice[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const notifications: NotificationItem[] = [];

  for (const r of reminders) {
    if (r.status === "Terminé") continue;
    const d = new Date(r.reminderDate);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (d.getTime() === today.getTime()) {
      notifications.push({
        id: `reminder-today-${r._id}`, type: "REMINDER",
        title: r.title, message: "Aujourd'hui",
        isRead: false, createdAt: new Date(r.reminderDate),
      });
    } else if (d.getTime() < today.getTime()) {
      notifications.push({
        id: `reminder-overdue-${r._id}`, type: "REMINDER",
        title: r.title, message: `En retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? "s" : ""}`,
        isRead: false, createdAt: d,
      });
    }
  }

  for (const inv of invoices) {
    if (inv.status === "Payée") continue;
    const due = new Date(inv.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0 && inv.status !== "Payée") {
      notifications.push({
        id: `invoice-overdue-${inv._id}`, type: "INVOICE",
        title: inv.invoiceNumber,
        message: `Facture en retard - ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(inv.amount)}`,
        isRead: false, createdAt: due,
      });
    } else if (diffDays <= 7) {
      notifications.push({
        id: `invoice-due-${inv._id}`, type: "INVOICE",
        title: inv.invoiceNumber,
        message: `Échéance dans ${diffDays} jour${diffDays > 1 ? "s" : ""} - ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(inv.amount)}`,
        isRead: false, createdAt: due,
      });
    }
  }

  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return notifications;
}

type TabKey = "overview" | "projects" | "activities" | "documents" | "comments" | "emails" | "reminders" | "map";

function formatBudget(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}

const sectorColors: Record<string, string> = {
  "Informatique": "bg-blue-50 text-blue-700 border-blue-200",
  "E-commerce": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Immobilier": "bg-amber-50 text-amber-700 border-amber-200",
  "Santé": "bg-rose-50 text-rose-700 border-rose-200",
  "Finance": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Education": "bg-violet-50 text-violet-700 border-violet-200",
};

const priorityBadges: Record<string, string> = {
  Haute: "bg-red-50 text-red-700 border-red-200",
  Moyenne: "bg-amber-50 text-amber-700 border-amber-200",
  Basse: "bg-green-50 text-green-700 border-green-200",
};

const activityIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  UPDATE_CLIENT: Pencil,
  ADD_COMMENT: MessageSquare,
  DELETE_COMMENT: MessageSquare,
  UPLOAD_DOCUMENT: FilePlus,
  DELETE_DOCUMENT: FilePlus,
  SEND_EMAIL: Mail,
  ADD_REMINDER: Bell,
  CREATE_PROJECT: Briefcase,
  ADD_CONTACT: UserPlus,
  UPDATE_STATUS: RefreshCw,
};

const activityColors: Record<string, string> = {
  UPDATE_CLIENT: "bg-blue-100 text-blue-600",
  ADD_COMMENT: "bg-emerald-100 text-emerald-600",
  DELETE_COMMENT: "bg-red-100 text-red-600",
  UPLOAD_DOCUMENT: "bg-amber-100 text-amber-600",
  DELETE_DOCUMENT: "bg-red-100 text-red-600",
  SEND_EMAIL: "bg-violet-100 text-violet-600",
  ADD_REMINDER: "bg-rose-100 text-rose-600",
  CREATE_PROJECT: "bg-indigo-100 text-indigo-600",
  ADD_CONTACT: "bg-cyan-100 text-cyan-600",
  UPDATE_STATUS: "bg-orange-100 text-orange-600",
};

function formatTimeAgo(dateStr: string) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}

function formatDateTimeReal(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${datePart} à ${hours}:${minutes} ${ampm}`;
}

const statusBadges: Record<string, string> = {
  Actif: "bg-emerald-50 text-emerald-700",
  Prospect: "bg-amber-50 text-amber-700",
  Inactif: "bg-red-50 text-red-700",
  VIP: "bg-purple-50 text-purple-700",
  "En attente": "bg-amber-50 text-amber-700",
  Effectué: "bg-emerald-50 text-emerald-700",
  Annulé: "bg-red-50 text-red-700",
  Payée: "bg-emerald-50 text-emerald-700",
  "En retard": "bg-red-50 text-red-700",
};

const projectStatusBadges: Record<string, string> = {
  "En cours": "bg-blue-50 text-blue-700 border-blue-200",
  Terminé: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "En attente": "bg-amber-50 text-amber-700 border-amber-200",
  Annulé: "bg-red-50 text-red-700 border-red-200",
};

const defaultLocation = { lat: 36.8065, lng: 10.1815 };

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const agencyCoords = { lat: 36.8065, lng: 10.1815 };

function scoreToColor(score: number) {
  if (score >= 80) return { text: "text-emerald-600", ring: "#10b981", bg: "bg-emerald-50" };
  if (score >= 60) return { text: "text-amber-600", ring: "#f59e0b", bg: "bg-amber-50" };
  return { text: "text-red-500", ring: "#ef4444", bg: "bg-red-50" };
}

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "overview", label: "Vue d'ensemble", icon: Eye },
  { key: "projects", label: "Projets", icon: Briefcase },
  { key: "activities", label: "Activités", icon: Activity },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "comments", label: "Commentaires", icon: MessageSquare },
  { key: "emails", label: "Emails", icon: Mail },
  { key: "reminders", label: "Rappels", icon: Bell },
  { key: "map", label: "Carte", icon: MapPin },
];

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [comments, setComments] = useState<ClientComment[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [reminders, setReminders] = useState<ClientReminder[]>([]);
  const [emails, setEmails] = useState<ClientEmail[]>([]);
  const [locations, setLocations] = useState<ClientLocation[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    nomSociete: "", responsable: "", email: "", telephone: "", secteurActivite: "", adresse: ""
  });
  const [saving, setSaving] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: "", subject: "", message: "" });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailAttachment, setEmailAttachment] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const emailFileInputRef = useRef<HTMLInputElement>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({ title: "", description: "", reminderDate: "", reminderTime: "", endDate: "", endTime: "", priority: "Normale", status: "En attente" });
  const [reminderErrors, setReminderErrors] = useState<{ dateDebut?: string; dateFin?: string }>({});
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderFilter, setReminderFilter] = useState<"all" | "today" | "overdue" | "done">("all");
  const [editReminderId, setEditReminderId] = useState<string | null>(null);
  const [showReminderCalendar, setShowReminderCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapTabRef = useRef<HTMLDivElement>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState("");
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const notifications = getUrgentNotifications(reminders, invoices);
  const notificationCount = notifications.length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openEmailModal() {
    setEmailForm({ to: client?.email || "", subject: "", message: "" });
    setEmailAttachment(null);
    setShowEmailModal(true);
  }

  async function handleSendEmail() {
    if (!emailForm.to.trim() || !emailForm.subject.trim() || !emailForm.message.trim()) return;
    setSendingEmail(true);
    try {
      let attachmentUrl = "";
      let attachmentName = "";
      if (emailAttachment) {
        setUploadingAttachment(true);
        const formData = new FormData();
        formData.append("file", emailAttachment);
        formData.append("folder", `clients/${id}/emails`);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          attachmentUrl = uploadData.url || uploadData.fileUrl || "";
          attachmentName = emailAttachment.name;
        }
        setUploadingAttachment(false);
      }
      const res = await fetch(`/api/clients/${id}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: id,
          senderEmail: "contact@agencyflow.com",
          receiverEmail: emailForm.to.trim(),
          subject: emailForm.subject.trim(),
          message: emailForm.message.trim(),
          status: "Envoyé",
          attachmentUrl: attachmentUrl || undefined,
          attachmentName: attachmentName || undefined,
        }),
      });
      if (res.ok) {
        setShowEmailModal(false);
        setEmailForm({ to: "", subject: "", message: "" });
        setEmailAttachment(null);
        const emailsRes = await fetch(`/api/clients/${id}/emails`);
        const emailsData = await emailsRes.json();
        setEmails(Array.isArray(emailsData) ? emailsData : []);
        await createActivity("SEND_EMAIL", `Email envoyé à ${emailForm.to.trim()} : ${emailForm.subject.trim()}`);
      }
    } catch (err) {
      console.error("Failed to send email", err);
    } finally {
      setSendingEmail(false);
      setUploadingAttachment(false);
    }
  }

  function openEditModal() {
    if (!client) return;
    setEditForm({
      nomSociete: client.nomSociete || "",
      responsable: client.responsable || "",
      email: client.email || "",
      telephone: client.telephone || "",
      secteurActivite: client.secteurActivite || "",
      adresse: client.adresse || "",
    });
    setShowEditModal(true);
    setShowMenu(false);
  }

  async function handleClientUpdate() {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setClient(updated);
        setShowEditModal(false);
        await createActivity("UPDATE_CLIENT", `Fiche client mise à jour`);
      } else {
        const err = await res.json();
        console.error("Validation error:", err.errors);
      }
    } catch (err) {
      console.error("Failed to update client", err);
    } finally {
      setSaving(false);
    }
  }

  async function createActivity(action: string, description: string) {
    try {
      await fetch(`/api/clients/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id, userId: "current-user", action, description }),
      });
      const res = await fetch(`/api/clients/${id}/activities`);
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to create activity", err);
    }
  }

  function openReminderModal(reminder?: typeof reminders[0]) {
    if (reminder) {
      const d = new Date(reminder.reminderDate);
      const datePart = d.toISOString().split("T")[0];
      const timePart = d.toTimeString().slice(0, 5);
      let endDatePart = "";
      let endTimePart = "";
      if ((reminder as any).endDate) {
        const ed = new Date((reminder as any).endDate);
        endDatePart = ed.toISOString().split("T")[0];
        endTimePart = ed.toTimeString().slice(0, 5);
      }
      setReminderForm({ title: reminder.title, description: reminder.description || "", reminderDate: datePart, reminderTime: timePart, endDate: endDatePart, endTime: endTimePart, priority: reminder.priority, status: reminder.status });
      setEditReminderId(reminder._id);
    } else {
      setReminderForm({ title: "", description: "", reminderDate: "", reminderTime: "", endDate: "", endTime: "", priority: "Normale", status: "En attente" });
      setEditReminderId(null);
    }
    setReminderErrors({});
    setShowReminderModal(true);
  }

  function validateReminder() {
    const errors: { dateDebut?: string; dateFin?: string } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reminderForm.reminderDate) {
      const startDate = new Date(reminderForm.reminderDate + "T00:00:00");
      if (startDate < today) {
        errors.dateDebut = "La date de début ne peut pas être dans le passé";
      }
    }
    if (reminderForm.reminderDate && reminderForm.endDate) {
      const startDate = new Date(reminderForm.reminderDate + "T00:00:00");
      const endDate = new Date(reminderForm.endDate + "T00:00:00");
      if (endDate < startDate) {
        errors.dateFin = "La date de fin ne peut pas être avant la date de début";
      }
    }
    setReminderErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSaveReminder() {
    if (!reminderForm.title.trim() || !reminderForm.reminderDate) return;
    if (!validateReminder()) return;
    setSavingReminder(true);
    try {
      const reminderDate = reminderForm.reminderTime
        ? `${reminderForm.reminderDate}T${reminderForm.reminderTime}:00`
        : `${reminderForm.reminderDate}T00:00:00`;
      const endDate = reminderForm.endDate
        ? reminderForm.endTime
          ? `${reminderForm.endDate}T${reminderForm.endTime}:00`
          : `${reminderForm.endDate}T23:59:00`
        : undefined;
      const method = editReminderId ? "PUT" : "POST";
      const body = editReminderId
        ? { ...reminderForm, reminderDate, endDate, _id: editReminderId }
        : { ...reminderForm, reminderDate, endDate };
      const res = await fetch(`/api/clients/${id}/reminders`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id, ...body }),
      });
      if (res.ok) {
        setShowReminderModal(false);
        setReminderErrors({});
        const remindersRes = await fetch(`/api/clients/${id}/reminders`);
        const remindersData = await remindersRes.json();
        setReminders(Array.isArray(remindersData) ? remindersData : []);
        await createActivity(
          editReminderId ? "UPDATE_REMINDER" : "ADD_REMINDER",
          editReminderId ? `Rappel modifié : ${reminderForm.title}` : `Nouveau rappel : ${reminderForm.title}`
        );
      }
    } catch (err) {
      console.error("Failed to save reminder", err);
    } finally {
      setSavingReminder(false);
    }
  }

  async function handleCompleteReminder(reminderId: string) {
    const cId = id;
    try {
      const res = await fetch(`/api/clients/${cId}/reminders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: cId, _id: reminderId, status: "Terminé" }),
      });
      if (res.ok) {
        const remindersRes = await fetch(`/api/clients/${cId}/reminders`);
        const remindersData = await remindersRes.json();
        setReminders(Array.isArray(remindersData) ? remindersData : []);
        const r = reminders.find(x => x._id === reminderId);
        if (r) await createActivity("COMPLETE_REMINDER", `Rappel terminé : ${r.title}`);
      }
    } catch (err) {
      console.error("Failed to complete reminder", err);
    }
  }

  async function handleDeleteReminder(reminderId: string) {
    const cId = id;
    try {
      const res = await fetch(`/api/clients/${cId}/reminders`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: cId, _id: reminderId }),
      });
      if (res.ok) {
        const remindersRes = await fetch(`/api/clients/${cId}/reminders`);
        const remindersData = await remindersRes.json();
        setReminders(Array.isArray(remindersData) ? remindersData : []);
      }
    } catch (err) {
      console.error("Failed to delete reminder", err);
    }
  }

  function getFilteredReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reminders.filter(r => {
      if (reminderFilter === "today") {
        const d = new Date(r.reminderDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }
      if (reminderFilter === "overdue") {
        const d = new Date(r.reminderDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime() < today.getTime() && r.status !== "Terminé";
      }
      if (reminderFilter === "done") return r.status === "Terminé";
      return true;
    });
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      const res = await fetch(`/api/clients/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id, userId: "current-user", comment: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText("");
        const commentsRes = await fetch(`/api/clients/${id}/comments`);
        const commentsData = await commentsRes.json();
        setComments(Array.isArray(commentsData) ? commentsData : []);
        createActivity("ADD_COMMENT", `Nouveau commentaire ajouté`);
      }
    } catch (err) {
      console.error("Failed to add comment", err);
    } finally {
      setSendingComment(false);
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/clients/${id}/documents`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const docsRes = await fetch(`/api/clients/${id}/documents`);
        const docsData = await docsRes.json();
        setDocuments(Array.isArray(docsData) ? docsData : []);
        await createActivity("UPLOAD_DOCUMENT", `Document "${file.name}" ajouté`);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
      e.target.value = "";
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!confirm("Supprimer ce document ?")) return;
    setDeletingDocId(docId);
    try {
      await fetch(`/api/clients/${id}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: docId }),
      });
      const res = await fetch(`/api/clients/${id}/documents`);
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
      await createActivity("DELETE_DOCUMENT", "Document supprimé");
    } catch (err) {
      console.error("Delete doc error", err);
    }
    setDeletingDocId(null);
  }

  async function handleRenameDoc(docId: string, newName: string) {
    if (!newName.trim()) return;
    try {
      await fetch(`/api/clients/${id}/documents`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: docId, documentName: newName.trim() }),
      });
      const res = await fetch(`/api/clients/${id}/documents`);
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Rename doc error", err);
    }
    setEditingDocId(null);
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Supprimer ce commentaire ?")) return;
    setDeletingCommentId(commentId);
    try {
      await fetch(`/api/clients/${id}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: commentId }),
      });
      const res = await fetch(`/api/clients/${id}/comments`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
      await createActivity("DELETE_COMMENT", "Commentaire supprimé");
    } catch (err) {
      console.error("Delete comment error", err);
    }
    setDeletingCommentId(null);
  }

  async function handleEditComment(commentId: string, newText: string) {
    if (!newText.trim()) return;
    try {
      await fetch(`/api/clients/${id}/comments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: commentId, comment: newText.trim() }),
      });
      const res = await fetch(`/api/clients/${id}/comments`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Edit comment error", err);
    }
    setEditingCommentId(null);
  }

  useEffect(() => {
    if (!id) return;
    fetchAllData();
  }, [id]);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [clientRes, activitiesRes, commentsRes, docsRes, remindersRes, emailsRes, locationsRes, invoicesRes, projectsRes] = await Promise.all([
        fetch(`/api/clients/${id}`),
        fetch(`/api/clients/${id}/activities`),
        fetch(`/api/clients/${id}/comments`),
        fetch(`/api/clients/${id}/documents`),
        fetch(`/api/clients/${id}/reminders`),
        fetch(`/api/clients/${id}/emails`),
        fetch(`/api/clients/${id}/locations`),
        fetch(`/api/clients/${id}/invoices`),
        fetch(`/api/clients/${id}/projects`),
      ]);

      const [clientData, activitiesData, commentsData, docsData, remindersData, emailsData, locationsData, invoicesData, projectsData] = await Promise.all([
        clientRes.json(),
        activitiesRes.json(),
        commentsRes.json(),
        docsRes.json(),
        remindersRes.json(),
        emailsRes.json(),
        locationsRes.json(),
        invoicesRes.json(),
        projectsRes.json(),
      ]);

      setClient(clientData);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setDocuments(Array.isArray(docsData) ? docsData : []);
      setReminders(Array.isArray(remindersData) ? remindersData : []);
      setEmails(Array.isArray(emailsData) ? emailsData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (err) {
      console.error("Error fetching client details:", err);
    }
    setLoading(false);
  }

  const loc = locations.length > 0 ? { lat: locations[0].latitude, lng: locations[0].longitude } : defaultLocation;
  const distance = haversineDistance(agencyCoords.lat, agencyCoords.lng, loc.lat, loc.lng);

  useEffect(() => {
    if (!mapRef.current || !client) return;
    const map = L.map(mapRef.current, {
      center: [loc.lat, loc.lng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    const icon = L.divIcon({
      html: `<div style="background:#4f46e5;color:white;padding:8px 12px;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 4px 12px rgba(79,70,229,0.4);border:2px solid white;">${client.nomSociete}</div>`,
      className: "",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    L.marker([loc.lat, loc.lng], { icon }).addTo(map).bindPopup(`
      <div style="font-family:system-ui,sans-serif;min-width:200px;">
        <div style="font-size:15px;font-weight:700;color:#1e293b;">${client.nomSociete}</div>
        <div style="font-size:13px;color:#475569;margin-top:6px;">${client.adresse || "Tunis, Tunisie"}</div>
        ${client.telephone ? `<div style="font-size:13px;color:#475569;margin-top:4px;">${client.telephone}</div>` : ""}
        ${client.email ? `<div style="font-size:13px;color:#475569;margin-top:2px;">${client.email}</div>` : ""}
      </div>
    `);
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); };
  }, [client, loc.lat, loc.lng]);

  useEffect(() => {
    if (!mapTabRef.current || !client) return;
    const map = L.map(mapTabRef.current, {
      center: [loc.lat, loc.lng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    const icon = L.divIcon({
      html: `<div style="background:#4f46e5;color:white;padding:8px 12px;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 4px 12px rgba(79,70,229,0.4);border:2px solid white;">${client.nomSociete}</div>`,
      className: "",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    L.marker([loc.lat, loc.lng], { icon }).addTo(map).bindPopup(`
      <div style="font-family:system-ui,sans-serif;min-width:200px;">
        <div style="font-size:15px;font-weight:700;color:#1e293b;">${client.nomSociete}</div>
        <div style="font-size:13px;color:#475569;margin-top:6px;">${client.adresse || "Tunis, Tunisie"}</div>
        ${client.telephone ? `<div style="font-size:13px;color:#475569;margin-top:4px;">${client.telephone}</div>` : ""}
        ${client.email ? `<div style="font-size:13px;color:#475569;margin-top:2px;">${client.email}</div>` : ""}
      </div>
    `);
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); };
  }, [client, loc.lat, loc.lng]);

  if (loading || !client) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>
  );
}

  const statusLabel = client.secteurActivite === "Informatique" ? "Actif" : client.secteurActivite === "E-commerce" ? "VIP" : client.secteurActivite === "Finance" ? "Prospect" : "Actif";
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const completedTasks = projects.filter(p => p.statut === "Terminé").length;
  const location = loc;
  const initials = client.nomSociete.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const hash = client._id.split("").reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);

  const maxBudget = 500000;
  const budgetScore = Math.min(Math.round((totalBudget / maxBudget) * 50), 50);
  const projectScore = Math.min(projects.length * 10, 50);
  let score = budgetScore + projectScore;
  score = Math.max(Math.min(score, 100), 0);
  const scoreColor = scoreToColor(score);
  const healthLabel = score >= 75 ? "Excellent" : score >= 55 ? "Moyen" : "Risque";
  const healthDot = score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-amber-500" : "bg-red-500";
  const healthBg = score >= 75 ? "bg-emerald-50 text-emerald-700" : score >= 55 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  const satisfaction = Math.min(5, (score / 100) * 5).toFixed(1);

  async function handleDelete() {
    if (!confirm("Supprimer ce client ?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    router.push("/dashboard/clients");
  }

  function handleBack() {
    router.push("/dashboard/clients");
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft size={16} /> Retour aux clients
      </button>

      {/* Header Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white shadow-md">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{client.nomSociete}</h1>
                <button className="text-amber-400"><Star size={18} fill="currentColor" /></button>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${statusBadges[statusLabel] || "bg-slate-50 text-slate-600"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusLabel === "Actif" ? "bg-emerald-500" : statusLabel === "VIP" ? "bg-purple-500" : statusLabel === "Prospect" ? "bg-amber-500" : "bg-red-500"}`} />
                  {statusLabel}
                </span>
                <span className={`rounded-md border px-2.5 py-0.5 text-xs font-medium ${sectorColors[client.secteurActivite] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                  {client.secteurActivite}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <UserCircle2 size={15} className="text-slate-400 shrink-0" />
                  {client.responsable}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={15} className="text-slate-400 shrink-0" />
                  {client.email}
                </div>
                {client.telephone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={15} className="text-slate-400 shrink-0" />
                    {client.telephone}
                  </div>
                )}
                {client.adresse && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={15} className="text-slate-400 shrink-0" />
                    <span className="truncate">{client.adresse}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Score + Health + Actions */}
          <div className="flex items-start gap-6">
            {/* Score */}
            <div className="flex flex-col items-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-indigo-200">
                <span className={`text-2xl font-bold ${scoreColor.text}`}>{score}</span>
                <span className="absolute -bottom-1 text-xs text-slate-400">/100</span>
              </div>
              <span className={`mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${scoreColor.bg} ${scoreColor.text}`}>
                {score >= 75 ? "Excellent" : score >= 55 ? "Bon" : "Faible"}
              </span>
            </div>

            {/* Health */}
            <div className="flex flex-col items-center">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full ${healthBg}`}>
                <div className="text-center">
                  <div className={`mx-auto h-3 w-3 rounded-full ${healthDot} mb-1`} />
                  <span className="text-xs font-semibold">{healthLabel}</span>
                </div>
              </div>
              <span className="mt-2 text-xs text-slate-400">Santé client</span>
            </div>

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-sm transition"
                title="Notifications"
              >
                <Bell size={18} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-slate-200 bg-white py-2 shadow-2xl">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-800">Notifications ({notificationCount})</span>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-300 hover:text-slate-500">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationCount === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">
                        <Bell size={24} className="mx-auto mb-2 text-slate-300" />
                        Aucune notification
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-0">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            n.type === "REMINDER"
                              ? n.message.startsWith("Aujourd") ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"
                              : n.message.includes("retard") ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                          }`}>
                            {n.type === "REMINDER" ? <Bell size={14} /> : <DollarSign size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => { setShowNotifications(false); setActiveTab("reminders"); }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-50 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                    >
                      Voir tous les rappels →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 shadow-sm"
              >
                <MoreVertical size={16} /> Actions
              </button>
              {showMenu && (
                <div
                  className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
                  onClick={() => setShowMenu(false)}
                >
                  <button onClick={openEditModal} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition">
                    <Pencil size={15} className="text-slate-400" /> Modifier
                  </button>
                  <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition">
                    <Send size={15} className="text-slate-400" /> Envoyer email
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 size={15} /> Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-1">
        <div className="flex min-w-max gap-1 rounded-2xl bg-slate-50 p-1 border border-slate-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <Briefcase size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
                  <p className="text-xs text-slate-500">Projets</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                  <DollarSign size={18} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{formatBudget(totalBudget)}</p>
                  <p className="text-xs text-slate-500">Budget total</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckSquare size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{completedTasks}</p>
                  <p className="text-xs text-slate-500">Tâches complétées</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Star size={18} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{satisfaction}</p>
                  <p className="text-xs text-slate-500">Satisfaction</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Activity Timeline */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Activity size={16} className="text-indigo-500" /> Activités récentes
                  </h2>
                  <span className="text-xs text-slate-400">{activities.length} activités</span>
                </div>
                {activities.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    <Activity size={32} className="mx-auto mb-2 text-slate-300" />
                    Aucune activité récente
                  </div>
                ) : (
                  <div className="space-y-0">
                    {(() => {
                      const sorted = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                      const groups: Record<string, typeof sorted> = {};
                      sorted.forEach((act) => {
                        const d = new Date(act.createdAt);
                        const today = new Date();
                        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
                        const key = d.toDateString() === today.toDateString() ? "Aujourd'hui"
                          : d.toDateString() === yesterday.toDateString() ? "Hier"
                          : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(act);
                      });
                      return Object.entries(groups).map(([label, acts]) => (
                        <div key={label}>
                          <p className="text-xs font-semibold text-slate-500 mb-3 mt-5 first:mt-0">{label}</p>
                          <div className="relative space-y-0">
                            {acts.slice(0, 5).map((act, i) => {
                              const icon = activityIcons[act.action] || Activity;
                              const color = activityColors[act.action] || "bg-indigo-100 text-indigo-600";
                              return (
                                <div key={act._id} className="relative flex gap-4 pb-5 last:pb-0">
                                  {i < acts.length - 1 && (
                                    <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200" />
                                  )}
                                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full z-10 ${color}`}>
                                    {React.createElement(icon, { size: 14 })}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-700">{act.description}</p>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                      <Clock size={11} /> {formatTimeAgo(act.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* Recent Projects */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Briefcase size={16} className="text-indigo-500" /> Projets récents
                  </h2>
                  <button
                    onClick={() => setActiveTab("projects")}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Voir tout
                  </button>
                </div>
                {projects.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    <Briefcase size={32} className="mx-auto mb-2 text-slate-300" />
                    Aucun projet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 3).map((p) => {
                      const progress = p.statut === "Terminé" ? 100 : p.statut === "En cours" ? 45 + (Math.abs(hash) % 40) : 10 + (Math.abs(hash) % 20);
                      return (
                        <div key={p._id} className="rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-slate-900">{p.titre}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Budget: {formatBudget(p.budget || 0)}
                              </p>
                            </div>
                            <span className={`rounded-md border px-2.5 py-0.5 text-xs font-medium ${projectStatusBadges[p.statut] || "bg-slate-50 text-slate-600"}`}>
                              {p.statut}
                            </span>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>Progression</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  progress === 100 ? "bg-emerald-500" : progress >= 60 ? "bg-indigo-500" : "bg-amber-500"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-500" /> Commentaires
                  </h2>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Voir tout
                  </button>
                </div>
                {/* Comment input */}
                <div className="flex gap-3 mb-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                    "MO"
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || sendingComment}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {sendingComment ? "..." : "Publier"}
                    </button>
                  </div>
                </div>
                {comments.length === 0 ? (
                  <div className="py-6 text-center text-sm text-slate-400">
                    Aucun commentaire
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.slice(0, 3).map((c) => (
                      <div key={c._id} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                          {c.userId.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">Utilisateur</span>
                            <span className="text-xs text-slate-400">{formatDateTimeReal(c.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{c.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <FileText size={16} className="text-indigo-500" /> Documents
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab("documents")}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Voir tout
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                    >
                      <Plus size={14} /> {uploading ? "Upload..." : "Uploader"}
                    </button>
                  </div>
                </div>
                {documents.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                    Aucun document
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.slice(0, 8).map((d) => (
                      <div key={d._id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                          <FileText size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{d.documentName}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(d.fileSize)} • {formatDate(d.createdAt)}</p>
                        </div>
                        <a
                          href={d.fileUrl}
                          download
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition"
                          title="Télécharger"
                        >
                          <Download size={15} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

              {/* Right column */}
            <div className="space-y-6">
              {/* Reminders */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Bell size={16} className="text-indigo-500" /> Rappels
                  </h2>
                  <button className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800">
                    <Plus size={14} /> Nouveau
                  </button>
                </div>
                {reminders.length === 0 ? (
                  <div className="py-6 text-center text-sm text-slate-400">Aucun rappel</div>
                ) : (
                  <div className="space-y-3">
                    {reminders.slice(0, 3).map((r) => (
                      <div key={r._id} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{r.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>
                          </div>
                          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${priorityBadges[r.priority] || "bg-slate-50 text-slate-600"}`}>
                            {r.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                          <Calendar size={11} />
                          <span>{formatDate(r.reminderDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emails */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Mail size={16} className="text-indigo-500" /> Emails récents
                  </h2>
                  <button className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800">
                    <Plus size={14} /> Composer
                  </button>
                </div>
                {emails.length === 0 ? (
                  <div className="py-6 text-center text-sm text-slate-400">Aucun email</div>
                ) : (
                  <div className="space-y-3">
                    {emails.slice(0, 3).map((e) => (
                      <div key={e._id} className="rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition">
                        <div className="flex items-center justify-between">
                          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${e.status === "Envoyé" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {e.status}
                          </span>
                          <span className="text-xs text-slate-400">{getRelativeTime(e.createdAt)}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-slate-800">{e.subject}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{e.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-500" /> Localisation du client
                  </h2>
                </div>
                <div
                  ref={mapRef}
                  className="w-full rounded-xl border border-slate-200"
                  style={{ height: "350px", minHeight: "350px" }}
                />
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span>Distance depuis l&apos;agence : <strong className="text-slate-600">{distance.toFixed(1)} km</strong></span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">Adresse :</span>
                      <span>{client.adresse || "Non renseignée"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Globe size={14} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">Latitude :</span>
                      <span>{location.lat.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Globe size={14} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">Longitude :</span>
                      <span>{location.lng.toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock size={14} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">Dernière mise à jour :</span>
                      <span>{client.updatedAt ? formatDateTimeReal(client.updatedAt) : "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                      <a
                        href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"
                      >
                        <Globe size={13} /> Ouvrir dans Google Maps
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                      >
                        <MapPin size={13} /> Itinéraire
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {activeTab === "projects" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Projets ({projects.length})</h2>
          {projects.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              <Briefcase size={40} className="mx-auto mb-3 text-slate-300" />
              Aucun projet pour ce client
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => {
                const progress = p.statut === "Terminé" ? 100 : p.statut === "En cours" ? 45 + (Math.abs(hash + p._id.length) % 40) : 10 + (Math.abs(hash + p._id.length) % 20);
                return (
                  <div key={p._id} className="rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{p.titre}</p>
                          <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${projectStatusBadges[p.statut] || "bg-slate-50 text-slate-600"}`}>
                            {p.statut}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">{p.description || "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800">{formatBudget(p.budget || 0)}</p>
                        <p className="text-xs text-slate-400">Budget</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Progression</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            progress === 100 ? "bg-emerald-500" : progress >= 60 ? "bg-indigo-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>Début: {formatDate(p.dateDebut || "")}</span>
                      <span>Fin: {formatDate(p.dateFin || "—")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "activities" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Toutes les activités ({activities.length})</h2>
          {activities.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              <Activity size={40} className="mx-auto mb-3 text-slate-300" />
              Aucune activité
            </div>
          ) : (
            <div className="relative space-y-0">
              {activities.map((act, i) => (
                <div key={act._id} className="relative flex gap-4 pb-6">
                  {i < activities.length - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200" />}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 z-10">
                    <Activity size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{act.action}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{act.description}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock size={11} /> {formatDateTime(act.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900">Documents ({documents.length})</h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-medium text-white shadow-md shadow-indigo-500/20 hover:opacity-90 transition disabled:opacity-50"
            >
              <Plus size={14} /> {uploading ? "Upload..." : "Uploader"}
            </button>
          </div>
          {documents.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              <FileText size={40} className="mx-auto mb-3 text-slate-300" />
              Aucun document
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((d) => (
                <div key={d._id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 transition group">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                    <FileText size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingDocId === d._id ? (
                      <div className="flex gap-2">
                        <input
                          value={editingDocName}
                          onChange={(e) => setEditingDocName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRenameDoc(d._id, editingDocName); if (e.key === "Escape") setEditingDocId(null); }}
                          className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-indigo-400"
                          autoFocus
                        />
                        <button onClick={() => handleRenameDoc(d._id, editingDocName)} className="rounded-lg bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700">OK</button>
                        <button onClick={() => setEditingDocId(null)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">Annuler</button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-slate-800 truncate">{d.documentName}</p>
                        <p className="text-xs text-slate-400">{d.documentType} • {formatFileSize(d.fileSize)}</p>
                        <p className="text-xs text-slate-400">{formatDate(d.createdAt)}</p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingDocId(d._id); setEditingDocName(d.documentName); }}
                      className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition opacity-0 group-hover:opacity-100"
                      title="Renommer"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(d._id)}
                      disabled={deletingDocId === d._id}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                    <a
                      href={d.fileUrl}
                      download
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition"
                      title="Télécharger"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "comments" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900">Commentaires ({comments.length})</h2>
          </div>
          {/* Comment input */}
          <div className="flex gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
              MO
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                placeholder="Ajouter un commentaire..."
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || sendingComment}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {sendingComment ? "..." : "Publier"}
              </button>
            </div>
          </div>
          {comments.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              <MessageSquare size={40} className="mx-auto mb-3 text-slate-300" />
              Aucun commentaire
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c._id} className="flex gap-3 p-4 rounded-xl bg-slate-50 group">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                    {c.userId.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">Utilisateur</span>
                        <span className="text-xs text-slate-400">{formatDateTimeReal(c.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => { setEditingCommentId(c._id); setEditingCommentText(c.comment); }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(c._id)}
                          disabled={deletingCommentId === c._id}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {editingCommentId === c._id ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleEditComment(c._id, editingCommentText); if (e.key === "Escape") setEditingCommentId(null); }}
                          className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-indigo-400"
                          autoFocus
                        />
                        <button onClick={() => handleEditComment(c._id, editingCommentText)} className="rounded-lg bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700">OK</button>
                        <button onClick={() => setEditingCommentId(null)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">Annuler</button>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-slate-600">{c.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "emails" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Mail size={16} className="text-indigo-500" /> Emails ({emails.length})
            </h2>
            <button
              onClick={openEmailModal}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-medium text-white shadow-md shadow-indigo-500/20 hover:opacity-90 transition"
            >
              <Plus size={14} /> Composer
            </button>
          </div>
          {emails.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              <Mail size={40} className="mx-auto mb-3 text-slate-300" />
              Aucun email
            </div>
          ) : (
            <div className="space-y-3">
              {[...emails].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((e) => (
                <div key={e._id} className="rounded-xl border border-slate-100 p-4 hover:bg-slate-50 hover:shadow-sm transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${e.status === "Envoyé" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>
                        {e.status === "Envoyé" ? <Send size={15} /> : <Mail size={15} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{e.subject}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {e.senderEmail} → {e.receiverEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${e.status === "Envoyé" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {e.status === "Envoyé" ? "📤 Envoyé" : "📥 Reçu"}
                      </span>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{formatDateTimeReal(e.createdAt)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-2">{e.message}</p>
                  {e.attachmentUrl && (
                    <a
                      href={e.attachmentUrl}
                      download={e.attachmentName}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 transition"
                    >
                      <Paperclip size={12} /> {e.attachmentName || "Pièce jointe"}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "reminders" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Bell size={16} className="text-indigo-500" /> Rappels ({reminders.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReminderCalendar(!showReminderCalendar)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${showReminderCalendar ? "bg-indigo-50 text-indigo-700" : "border border-slate-200 text-slate-500 hover:bg-slate-50"}`}
              >
                <Calendar size={13} /> {showReminderCalendar ? "Liste" : "Calendrier"}
              </button>
              <button
                onClick={() => openReminderModal()}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-medium text-white shadow-md shadow-indigo-500/20 hover:opacity-90 transition"
              >
                <Plus size={14} /> Nouveau rappel
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-5">
            {(["all", "today", "overdue", "done"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setReminderFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  reminderFilter === f
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {f === "all" ? "Tous" : f === "today" ? "Aujourd'hui" : f === "overdue" ? "En retard" : "Terminés"}
              </button>
            ))}
          </div>

          {getFilteredReminders().length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              <Bell size={40} className="mx-auto mb-3 text-slate-300" />
              {reminderFilter === "all" ? "Aucun rappel" : "Aucun rappel pour ce filtre"}
            </div>
          ) : showReminderCalendar ? (
            /* Calendar View */
            <CalendarView
              reminders={getFilteredReminders()}
              onComplete={handleCompleteReminder}
              onEdit={(r) => openReminderModal(r)}
              formatDate={formatDate}
              priorityBadges={priorityBadges}
              statusBadges={statusBadges}
            />
          ) : (
            /* List View */
            <div className="space-y-3">
              {getFilteredReminders().map((r) => {
                const isOverdue = new Date(r.reminderDate) < new Date() && r.status !== "Terminé";
                const isToday = new Date(r.reminderDate).toDateString() === new Date().toDateString();
                return (
                  <div
                    key={r._id}
                    className={`rounded-xl border p-4 transition hover:shadow-sm ${
                      r.status === "Terminé"
                        ? "border-slate-100 bg-slate-50/50"
                        : isOverdue
                        ? "border-red-200 bg-red-50/50"
                        : isToday
                        ? "border-amber-200 bg-amber-50/30"
                        : "border-slate-100 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${
                          r.priority === "Urgente" ? "bg-red-100 text-red-600" :
                          r.priority === "Haute" ? "bg-orange-100 text-orange-600" :
                          "bg-green-100 text-green-600"
                        }`}>
                          <Bell size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${r.status === "Terminé" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                              {r.title}
                            </p>
                            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${priorityBadges[r.priority] || "bg-slate-50 text-slate-600"}`}>
                              {r.priority}
                            </span>
                          </div>
                          {r.description && <p className="text-sm text-slate-500 mt-0.5">{r.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> {formatDate(r.reminderDate)}
                            </span>
                            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                              r.status === "Terminé" ? "bg-emerald-50 text-emerald-700" :
                              isOverdue ? "bg-red-50 text-red-700" :
                              "bg-blue-50 text-blue-700"
                            }`}>
                              {isOverdue ? "En retard" : r.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {r.status !== "Terminé" && (
                          <button
                            onClick={() => handleCompleteReminder(r._id)}
                            className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 transition"
                            title="Terminer"
                          >
                            <CheckSquare size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => openReminderModal(r)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
                          title="Modifier"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(r._id)}
                          className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 transition"
                          title="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "map" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <MapPin size={16} className="text-indigo-500" /> Carte interactive
            </h2>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"
              >
                <Globe size={13} /> Google Maps
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                <MapPin size={13} /> Itinéraire
              </a>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div
                ref={mapTabRef}
                className="w-full rounded-xl border border-slate-200"
                style={{ height: "400px", minHeight: "400px" }}
              />
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <span>Distance depuis l&apos;agence : <strong className="text-slate-600">{distance.toFixed(1)} km</strong></span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <MapPin size={14} className="text-indigo-500" /> Informations lieu
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Société</span>
                    <span className="font-medium text-slate-800">{client.nomSociete}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Adresse</span>
                    <span className="font-medium text-slate-800 text-right">{client.adresse || "Non renseignée"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Latitude</span>
                    <span className="font-medium text-slate-800">{location.lat.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Longitude</span>
                    <span className="font-medium text-slate-800">{location.lng.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distance</span>
                    <span className="font-medium text-slate-800">{distance.toFixed(1)} km</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Clock size={14} className="text-indigo-500" /> Dernière mise à jour
                </h3>
                <p className="text-sm text-slate-600">{client.updatedAt ? formatDateTimeReal(client.updatedAt) : "—"}</p>
              </div>
            </div>
          </div>
        </div>
      )}



{showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg mx-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">Modifier le client</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom société</label>
                <input type="text" value={editForm.nomSociete} onChange={(e) => setEditForm(f => ({ ...f, nomSociete: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
                <input type="text" value={editForm.responsable} onChange={(e) => setEditForm(f => ({ ...f, responsable: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input type="text" value={editForm.telephone} onChange={(e) => setEditForm(f => ({ ...f, telephone: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Secteur activité</label>
                <select value={editForm.secteurActivite} onChange={(e) => setEditForm(f => ({ ...f, secteurActivite: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                  <option value="">Sélectionner</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Santé">Santé</option>
                  <option value="Education">Education</option>
                  <option value="Informatique">Informatique</option>
                  <option value="Finance">Finance</option>
                  <option value="Immobilier">Immobilier</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <input type="text" value={editForm.adresse} onChange={(e) => setEditForm(f => ({ ...f, adresse: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition">
                Annuler
              </button>
              <button onClick={handleClientUpdate} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition">
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Bell size={18} className="text-indigo-500" /> {editReminderId ? "Modifier" : "Nouveau"} rappel
              </h3>
              <button onClick={() => setShowReminderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Appeler le client"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={reminderForm.description}
                  onChange={(e) => setReminderForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Faire le suivi du projet"
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={reminderForm.reminderDate}
                    onChange={(e) => { setReminderForm(f => ({ ...f, reminderDate: e.target.value })); setReminderErrors({}); }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${reminderErrors.dateDebut ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"}`}
                  />
                  {reminderErrors.dateDebut && <p className="mt-1 text-xs text-red-500">{reminderErrors.dateDebut}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Heure de début</label>
                  <input
                    type="time"
                    value={reminderForm.reminderTime}
                    onChange={(e) => setReminderForm(f => ({ ...f, reminderTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={reminderForm.endDate}
                    onChange={(e) => { setReminderForm(f => ({ ...f, endDate: e.target.value })); setReminderErrors({}); }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${reminderErrors.dateFin ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"}`}
                  />
                  {reminderErrors.dateFin && <p className="mt-1 text-xs text-red-500">{reminderErrors.dateFin}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Heure de fin</label>
                  <input
                    type="time"
                    value={reminderForm.endTime}
                    onChange={(e) => setReminderForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priorité</label>
                  <select
                    value={reminderForm.priority}
                    onChange={(e) => setReminderForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Normale">Normale</option>
                    <option value="Haute">Haute</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                  <select
                    value={reminderForm.status}
                    onChange={(e) => setReminderForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="En attente">En attente</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowReminderModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition">
                Annuler
              </button>
              <button
                onClick={handleSaveReminder}
                disabled={!reminderForm.title.trim() || !reminderForm.reminderDate || savingReminder}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {savingReminder ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg mx-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Mail size={18} className="text-indigo-500" /> Nouveau message
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">À</label>
                <input
                  type="email"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm(f => ({ ...f, to: e.target.value }))}
                  placeholder="email@client.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sujet</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Objet de l&#39;email"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Bonjour,..."
                  rows={5}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div>
                <input
                  ref={emailFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setEmailAttachment(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => emailFileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition"
                >
                  <Paperclip size={14} />
                  {emailAttachment ? emailAttachment.name : "Pièce jointe"}
                </button>
                {emailAttachment && (
                  <button
                    type="button"
                    onClick={() => setEmailAttachment(null)}
                    className="ml-2 text-xs text-red-400 hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowEmailModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition">
                  Annuler
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!emailForm.to.trim() || !emailForm.subject.trim() || !emailForm.message.trim() || sendingEmail || uploadingAttachment}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Send size={14} /> {uploadingAttachment ? "Upload..." : sendingEmail ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileSelected}
      />
    </div>
  );
}

function CalendarView({ reminders, onComplete, onEdit, formatDate, priorityBadges, statusBadges }: {
  reminders: any[];
  onComplete: (id: string) => void;
  onEdit: (r: any) => void;
  formatDate: (d: string) => string;
  priorityBadges: Record<string, string>;
  statusBadges: Record<string, string>;
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const getRemindersForDay = (day: number) => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    return reminders.filter(r => r.reminderDate && r.reminderDate.startsWith(dateStr));
  };

  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
          <ChevronRight size={16} className="rotate-180" />
        </button>
        <span className="text-sm font-semibold text-slate-800 capitalize">{monthName}</span>
        <button onClick={nextMonth} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-xl overflow-hidden">
        {dayNames.map(d => (
          <div key={d} className="bg-slate-50 px-2 py-2 text-center text-xs font-medium text-slate-500">{d}</div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white min-h-[80px] p-1" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayReminders = getRemindersForDay(day);
          const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
          return (
            <div key={day} className={`bg-white min-h-[80px] p-1 ${isToday ? "ring-2 ring-indigo-400 ring-inset" : ""}`}>
              <span className={`text-xs font-medium ${isToday ? "text-indigo-600" : "text-slate-600"}`}>{day}</span>
              <div className="mt-0.5 space-y-0.5">
                {dayReminders.slice(0, 3).map(r => (
                  <div
                    key={r._id}
                    className={`group relative cursor-pointer rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${
                      r.priority === "Urgente" ? "bg-red-100 text-red-700" :
                      r.priority === "Haute" ? "bg-orange-100 text-orange-700" :
                      "bg-green-100 text-green-700"
                    } ${r.status === "Terminé" ? "opacity-50 line-through" : ""}`}
                    title={r.title}
                  >
                    {r.title}
                    <div className="absolute left-0 top-full z-10 mt-1 hidden w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg group-hover:block">
                      <p className="text-xs font-semibold text-slate-800">{r.title}</p>
                      {r.description && <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${priorityBadges[r.priority] || ""}`}>{r.priority}</span>
                        <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${statusBadges[r.status] || ""}`}>{r.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {dayReminders.length > 3 && (
                  <span className="text-[10px] text-slate-400">+{dayReminders.length - 3} autres</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}