"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot, Search, Plus, MoreHorizontal, Send, Mic, Paperclip,
  Copy, ThumbsUp, ThumbsDown, Clock, CheckCircle2,
  AlertTriangle, Users, TrendingUp, FolderKanban,
  MessageSquare, Sparkles, X, Image, File, StopCircle,
  Trash2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const LS_CONV = "af_chatbot_convs";
const LS_MSG_PREFIX = "af_chatbot_msgs_";

interface Attachment {
  id: string; type: "image" | "file" | "audio"; name: string; data: string; size: number;
}

interface Message {
  id: string; role: "user" | "assistant"; content: string; time: string;
  attachments?: Attachment[];
}

interface Conversation {
  id: string; titre: string; preview: string; time: string;
}

const DEFAULT_CONVS: Conversation[] = [
  { id: "c1", titre: "Rapport hebdomadaire", preview: "Voici le résumé de la semaine...", time: "Il y a 2h" },
  { id: "c2", titre: "Analyse du projet E-commerce", preview: "Le projet E-commerce avance bien...", time: "Il y a 5h" },
  { id: "c3", titre: "Tâches en retard", preview: "Vous avez 8 tâches en retard...", time: "Hier" },
  { id: "c4", titre: "Statistiques équipe", preview: "L'équipe a une productivité de 89%...", time: "Hier" },
  { id: "c5", titre: "Budget des projets", preview: "Le budget total est de 245 000€...", time: "Il y a 2j" },
  { id: "c6", titre: "Disponibilité équipe", preview: "3 membres sont disponibles...", time: "Il y a 3j" },
  { id: "c7", titre: "Questions diverses", preview: "Comment configurer le déploiement ?...", time: "Il y a 5j" },
];

const DEFAULT_MSGS: Record<string, Message[]> = {
  c1: [
    { id: "m1", role: "user", content: "Quels sont les projets en retard ?", time: "14:32" },
    { id: "m2", role: "assistant", content: "Vous avez **2 projets en retard** :\n- Application Mobile Santé\n- CRM Integration", time: "14:32" },
    { id: "m3", role: "user", content: "Qui travaille sur le projet E-commerce ?", time: "14:33" },
    { id: "m4", role: "assistant", content: "Les membres assignés au projet **E-commerce** sont :\n- Ahmed Ben Ali\n- Omayma Hoimdi\n- Mohamed Salah", time: "14:33" },
    { id: "m5", role: "user", content: "Combien de tâches sont terminées ?", time: "14:35" },
    { id: "m6", role: "assistant", content: "**56 tâches terminées** sur 78 au total, soit **72%** d'avancement.", time: "14:35" },
  ],
};

const SUGGESTIONS = ["Projets en retard", "Mes tâches", "Rapport hebdomadaire", "Statistiques équipe", "Budget des projets"];

const RECENT_QUESTIONS = [
  { q: "Quels sont les projets en retard ?", time: "14:32" },
  { q: "Qui travaille sur le projet E-commerce ?", time: "14:33" },
  { q: "Combien de tâches sont terminées ?", time: "14:35" },
  { q: "Quel est le budget total ?", time: "Hier" },
  { q: "Disponibilité de l'équipe ?", time: "Hier" },
];

const DONUT_DATA = [
  { name: "Projets", value: 40, color: "#7C3AED" },
  { name: "Tâches", value: 30, color: "#6366F1" },
  { name: "Équipe", value: 20, color: "#10B981" },
  { name: "Autres", value: 10, color: "#94A3B8" },
];

function loadFromLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function saveToLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const KB = 1024;
const MB = KB * 1024;
const MAX_FILE_SIZE = 10 * MB;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "application/zip"];

export default function ChatbotPage() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadFromLS(LS_CONV, DEFAULT_CONVS));
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => loadFromLS(LS_MSG_PREFIX + "c1", DEFAULT_MSGS.c1));
  const [input, setInput] = useState("");
  const [activeConv, setActiveConv] = useState("c1");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save conversations
  useEffect(() => { saveToLS(LS_CONV, conversations); }, [conversations]);

  // Track previous activeConv to save before switching
  const prevConvRef = useRef(activeConv);
  useEffect(() => {
    const prev = prevConvRef.current;
    if (prev !== activeConv) {
      saveToLS(LS_MSG_PREFIX + prev, messages);
      prevConvRef.current = activeConv;
      const saved = loadFromLS<Message[]>(LS_MSG_PREFIX + activeConv, []);
      if (saved.length > 0) { setMessages(saved); }
      else if (DEFAULT_MSGS[activeConv]) { setMessages(DEFAULT_MSGS[activeConv]); }
      else { setMessages([]); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConv]);

  // Save messages when they change (for current conv only)
  useEffect(() => { saveToLS(LS_MSG_PREFIX + activeConv, messages); }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredConvs = conversations.filter(c =>
    c.titre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function updateConvPreview(id: string, preview: string) {
    const now = new Date();
    const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, preview: preview.slice(0, 60), time } : c
    ));
  }

  function handleNewConversation() {
    const id = "c" + Date.now();
    const newConv: Conversation = { id, titre: "Nouvelle conversation", preview: "Commencez par poser une question...", time: "À l'instant" };
    setConversations(prev => [newConv, ...prev]);
    setActiveConv(id);
    setMessages([]);
    setSearchQuery("");
  }

  function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) continue;
      const type = file.type.startsWith("image/") ? "image" as const : "file" as const;
      const data = await readFileAsDataURL(file);
      setPendingAttachments(prev => [...prev, { id: "att" + Date.now() + Math.random(), type, name: file.name, data, size: file.size }]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(id: string) {
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  }

  // Voice recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        const reader = new FileReader();
        reader.onload = () => {
          const data = reader.result as string;
          setPendingAttachments(prev => [...prev, { id: "att" + Date.now(), type: "audio", name: "Message vocal.webm", data, size: blob.size }]);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecordingTime(0);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      const start = Date.now();
      recordingTimerRef.current = setInterval(() => setRecordingTime(Math.floor((Date.now() - start) / 1000)), 1000);
    } catch { /* permission denied */ }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const RESPONSES: [string, string][] = [
    ["bonjour", "Bonjour ! Je suis l'assistant IA AgencyFlow. Je peux vous aider avec :\n- Projets : état d'avancement, retard, budget\n- Tâches : statistiques, répartition\n- Équipe : membres, disponibilité\n- Fonctionnement : créer une équipe, gérer les tâches\n\nPosez-moi une question !"],
    ["salut", "Salut ! Comment puis-je vous aider aujourd'hui ?\n\nEssayez par exemple :\n- \"Quels sont les projets en retard ?\"\n- \"Combien de tâches sont terminées ?\"\n- \"Qui travaille sur le projet E-commerce ?\""],
    ["merci", "De rien ! N'hésitez pas si vous avez d'autres questions."],
    ["comment creer equipe", "Pour **créer une équipe** :\n1. Allez dans **Gestion équipe** dans le menu latéral\n2. Ouvrez l'onglet **Équipes**\n3. Cliquez sur **+ Créer une équipe**\n4. Remplissez le nom, la description, le responsable et les membres\n5. Cliquez sur **Enregistrer**\n\nVous pouvez aussi modifier, dupliquer ou supprimer une équipe depuis la liste."],
    ["comment gerer tache", "Pour **gérer les tâches** :\n1. Ouvrez un projet depuis **Gestion projets**\n2. Allez dans l'onglet **Tâches**\n3. Vous pouvez :\n   - Créer une tâche avec **+ Nouvelle tâche**\n   - Filtrer par statut, priorité, assigné\n   - Changer la vue (Tableau / Kanban / Calendrier)\n   - Assigner des membres, ajouter des tags\n   - Suivre l'avancement avec les indicateurs KPI"],
    ["projets en retard", "Vous avez **2 projets en retard** :\n- Application Mobile Santé (échéance dépassée de 5j)\n- CRM Integration (échéance dépassée de 2j)\n\nJe vous conseille de planifier une réunion d'urgence avec les équipes concernées."],
    ["projet ecommerce", "Le projet **E-commerce** est mené par :\n- **Ahmed Ben Ali** (Développeur)\n- **Omayma Hoimdi** (Chef de projet)\n- **Mohamed Salah** (Développeur)\n- **Lina Ben Amor** (Designer)\n\nAvancement : **68%** — Budget consommé : 45 000€ / 80 000€"],
    ["tache", "**56 tâches terminées** sur 78 au total, soit **72%** d'avancement global.\n\nRépartition :\n- Terminées : 56\n- En cours : 14\n- En attente : 5\n- Bloquées : 3"],
    ["projet", "Voici les **12 projets actifs** :\n1. Site E-commerce (68%)\n2. Mobile App (45%)\n3. CRM Integration (30%)\n4. Admin Dashboard (82%)\n5. Refonte Blog (55%)\net 6 autres..."],
    ["equipe", "L'équipe AgencyFlow compte **6 membres** :\n- Mohamed Salah (Développeur)\n- Ahmed Ben Ali (Développeur)\n- Omayma Hoimdi (Chef de projet)\n- Jane Smith (Designer)\n- Lina Ben Amor (Designer)\n- Karim Aouadi (Testeur)"],
    ["budget", "Le **budget total** alloué est de **245 000€** dont **178 000€** déjà consommés (**73%**).\n\nPar projet :\n- E-commerce : 45k/80k€\n- Mobile App : 35k/60k€\n- CRM : 28k/45k€\n- Admin Dashboard : 22k/30k€"],
    ["disponibilite", "**3 membres** sont disponibles cette semaine :\n- Jane Smith (Designer)\n- Lina Ben Amor (Designer)\n- Karim Aouadi (Testeur)\n\nMembres occupés :\n- Mohamed Salah (Mission client)\n- Ahmed Ben Ali (Sprint en cours)\n- Omayma Hoimdi (Réunions)"],
  ];

  function handleSend() {
    const text = input.trim();
    if (!text && pendingAttachments.length === 0) return;
    const userMsg: Message = {
      id: "m" + Date.now(), role: "user", content: text || "(Fichier joint)",
      time: formatTime(new Date()),
      attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    const preview = text || (pendingAttachments[0]?.type === "image" ? "Image" : pendingAttachments[0]?.type === "audio" ? "Message vocal" : "Fichier");
    updateConvPreview(activeConv, preview);
    setInput("");
    setPendingAttachments([]);
    setAudioBlob(null);

    if (!text) return;
    setTimeout(() => {
      const q = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      let reply = "Je n'ai pas encore de données sur ce sujet. Posez une question sur les projets, tâches, équipe, budget ou le fonctionnement de l'application.";
      const sorted = [...RESPONSES].sort((a, b) => b[0].length - a[0].length);
      for (const [key, val] of sorted) {
        if (q.includes(key)) { reply = val; break; }
      }
      const botMsg: Message = { id: "m" + Date.now(), role: "assistant", content: reply, time: formatTime(new Date()) };
      setMessages(prev => [...prev, botMsg]);
    }, 800);
  }

  function handleSuggestion(s: string) { setInput(s); }

  return (
    <div className="flex gap-5 h-[calc(100vh-120px)]">

      {/* ===== LEFT ===== */}
      <div className="w-72 shrink-0 flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Conversations</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              placeholder="Rechercher une conversation..." />
          </div>
          <button onClick={handleNewConversation} className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-xs font-medium text-white shadow-lg shadow-violet-500/25 hover:opacity-90 transition">
            <Plus size={14} /> Nouvelle conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConvs.map(c => (
            <button key={c.id} onClick={() => setActiveConv(c.id)}
              className={`w-full text-left rounded-xl p-3 transition ${
                activeConv === c.id ? "bg-violet-50 border border-violet-200" : "hover:bg-slate-50 border border-transparent"
              }`}>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <Bot size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">{c.titre}</p>
                    <span className="shrink-0 text-[10px] text-slate-400">{c.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.preview}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-slate-100">
          <button className="w-full text-center text-xs font-medium text-violet-600 hover:text-violet-700 transition">Voir plus</button>
        </div>
      </div>

      {/* ===== CENTER ===== */}
      <div className="flex-1 flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-md">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Assistant IA AgencyFlow</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-emerald-600 font-medium">En ligne</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Sparkles size={15} className="text-violet-500" />
            <span className="text-xs text-slate-400">Assistant intelligent</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Bot size={48} className="mb-3 opacity-30" />
              <p className="text-sm font-medium text-slate-500">Commencez une nouvelle conversation</p>
              <p className="text-xs text-slate-400 mt-1">Posez une question sur les projets, tâches ou l'équipe</p>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${
                m.role === "user" ? "bg-violet-600" : "bg-gradient-to-br from-indigo-500 to-violet-600"
              }`}>
                {m.role === "user" ? "OH" : <Bot size={15} />}
              </div>
              <div className={`max-w-[75%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  m.role === "user" ? "bg-violet-600 text-white rounded-tr-md" : "bg-slate-100 text-slate-700 rounded-tl-md"
                }`}>
                  {m.content.split("**").map((part, i) =>
                    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
                  )}
                  {m.attachments && m.attachments.length > 0 && (
                    <div className={`mt-2 space-y-1.5 ${m.role === "user" ? "" : ""}`}>
                      {m.attachments.map(a => (
                        <div key={a.id} className={`flex items-center gap-2 rounded-lg p-2 ${m.role === "user" ? "bg-violet-500/30" : "bg-white/70"}`}>
                          {a.type === "image" ? (
                            <img src={a.data} alt={a.name} className="max-w-full rounded-lg max-h-40 object-cover" />
                          ) : a.type === "audio" ? (
                            <audio controls src={a.data} className="h-8 max-w-full" />
                          ) : (
                            <>
                              <File size={14} className="shrink-0 text-slate-500" />
                              <span className="text-xs truncate">{a.name}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <span className="text-[10px] text-slate-400">{m.time}</span>
                  {m.role === "assistant" && (
                    <div className="flex items-center gap-0.5">
                      <button className="rounded p-0.5 text-slate-400 hover:text-slate-600"><Copy size={11} /></button>
                      <button className="rounded p-0.5 text-slate-400 hover:text-emerald-600"><ThumbsUp size={11} /></button>
                      <button className="rounded p-0.5 text-slate-400 hover:text-red-500"><ThumbsDown size={11} /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="px-6 py-3 border-t border-slate-100">
          {/* Attachments preview */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {pendingAttachments.map(a => (
                <div key={a.id} className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-700">
                  {a.type === "image" ? <Image size={14} /> : a.type === "audio" ? <Mic size={14} /> : <File size={14} />}
                  <span className="max-w-[120px] truncate">{a.name}</span>
                  <button onClick={() => removeAttachment(a.id)} className="text-slate-400 hover:text-red-500"><X size={13} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => handleSuggestion(s)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition">
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition">
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.docx,.xlsx,.zip,.txt" className="hidden" onChange={handleFileSelect} />
            <button onClick={() => fileInputRef.current?.click()} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"><Paperclip size={15} /></button>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="flex-1 outline-none text-sm text-slate-700 px-1"
              placeholder="Posez votre question..." />
            {isRecording ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-red-500">{formatDuration(recordingTime)}</span>
                <button onClick={stopRecording} className="rounded-lg bg-red-500 p-1.5 text-white hover:opacity-90 transition">
                  <StopCircle size={15} />
                </button>
              </div>
            ) : (
              <button onClick={startRecording} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"><Mic size={15} /></button>
            )}
            <button onClick={handleSend} disabled={!input.trim() && pendingAttachments.length === 0}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 p-1.5 text-white hover:opacity-90 disabled:opacity-50 transition">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== RIGHT ===== */}
      <div className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Aperçu rapide</h3>
          <div className="space-y-3">
            {[
              { label: "Projets actifs", value: "12", icon: FolderKanban, color: "text-violet-600", bg: "bg-violet-50" },
              { label: "Tâches en retard", value: "8", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
              { label: "Membres en ligne", value: "4", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Productivité moyenne", value: "89%", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`rounded-lg ${bg} ${color} p-1.5`}><Icon size={13} /></div>
                  <span className="text-xs text-slate-600">{label}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Questions récentes</h3>
          <div className="space-y-2.5">
            {RECENT_QUESTIONS.map((q, i) => (
              <div key={i} className="flex items-start gap-2">
                <MessageSquare size={13} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-700 truncate">{q.q}</p>
                  <span className="text-[10px] text-slate-400">{q.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Utilisation de l'assistant</h3>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={DONUT_DATA} cx="50%" cy="50%" innerRadius={22} outerRadius={38} dataKey="value" strokeWidth={0}>
                    {DONUT_DATA.map((_, i) => <Cell key={i} fill={DONUT_DATA[i].color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {DONUT_DATA.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-slate-600">{d.name}</span>
                  <span className="text-[10px] font-bold text-slate-800">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
