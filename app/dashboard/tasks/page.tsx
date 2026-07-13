"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, X, CheckSquare, Search, Filter, ArrowUpDown, AlertCircle } from "lucide-react";


interface Project { _id: string; titre: string }
interface User { _id: string; nom: string; prenom: string }
interface Task {
  _id: string;
  titre: string;
  description: string;
  statut: string;
  priorite: string;
  dateDebut: string;
  dateFin: string;
  projetId?: Project;
  employeId?: User;
}

const STATUTS = ["À faire", "En cours", "Terminée", "Bloquée"] as const;
const PRIORITES = ["Faible", "Moyenne", "Haute", "Urgente"] as const;

const STATUT_COLORS: Record<string, string> = {
  "À faire": "bg-slate-100 text-slate-600",
  "En cours": "bg-indigo-100 text-indigo-700",
  "Terminée": "bg-emerald-100 text-emerald-700",
  "Bloquée": "bg-red-100 text-red-700",
};

const PRIORITE_COLORS: Record<string, string> = {
  Faible: "bg-slate-100 text-slate-500",
  Moyenne: "bg-blue-100 text-blue-700",
  Haute: "bg-orange-100 text-orange-700",
  Urgente: "bg-red-100 text-red-700",
};

const emptyForm = {
  titre: "", description: "", statut: "À faire", priorite: "Moyenne",
  dateDebut: "", dateFin: "", projetId: "", employeId: "",
};

// Validation front-end
const validateTask = (data: typeof emptyForm) => {
  const errors: Record<string, string> = {};

  if (!data.titre.trim()) errors.titre = "Titre obligatoire";
  else if (data.titre.trim().length < 3) errors.titre = "Minimum 3 caractères";
  else if (data.titre.length > 100) errors.titre = "Maximum 100 caractères";

  if (!data.description.trim()) errors.description = "Description obligatoire";
  else if (data.description.trim().length < 10) errors.description = "Minimum 10 caractères";
  else if (data.description.length > 500) errors.description = "Maximum 500 caractères";

  if (!data.projetId) errors.projetId = "Projet obligatoire";

  if (data.dateDebut && data.dateFin && new Date(data.dateFin) <= new Date(data.dateDebut)) {
    errors.dateFin = "Date fin doit être supérieure à date début";
  }

  return errors;
};

export default function TasksPage() {
  // Récupération de la session NextAuth pour identifier l'utilisateur connecté
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filtered, setFiltered] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("Tous");
  const [filterPriorite, setFilterPriorite] = useState("");
  const [sortBy, setSortBy] = useState("dateFin");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/team").then((r) => r.json()),
    ]).then(([t, p, u]) => {
      const tasksData = Array.isArray(t) ? t : [];
      setTasks(tasksData);
      setFiltered(tasksData);
      setProjects(Array.isArray(p) ? p : []);
      setTeam(Array.isArray(u) ? u : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...tasks];

    // Recherche
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (task) =>
          task.titre.toLowerCase().includes(q) ||
          (task.description && task.description.toLowerCase().includes(q)) ||
          (task.employeId && `${task.employeId.prenom} ${task.employeId.nom}`.toLowerCase().includes(q))
      );
    }

    // Filtre statut
    if (filterStatut !== "Tous") {
      result = result.filter((t) => t.statut === filterStatut);
    }

    // Filtre priorité
    if (filterPriorite) {
      result = result.filter((t) => t.priorite === filterPriorite);
    }

    // Tri
    result.sort((a, b) => {
      if (sortBy === "dateFin") {
        const da = a.dateFin ? new Date(a.dateFin).getTime() : Infinity;
        const db = b.dateFin ? new Date(b.dateFin).getTime() : Infinity;
        return da - db;
      }
      if (sortBy === "titre") return a.titre.localeCompare(b.titre);
      if (sortBy === "priorite") {
        const priorityOrder = { "Urgente": 0, "Haute": 1, "Moyenne": 2, "Faible": 3 };
        const pa = a.priorite as keyof typeof priorityOrder;
        const pb = b.priorite as keyof typeof priorityOrder;
        return priorityOrder[pa] - priorityOrder[pb];
      }
      return 0;
    });

    setFiltered(result);
  }, [search, tasks, filterStatut, filterPriorite, sortBy]);

  function refreshTasks() {
    fetch("/api/tasks").then((r) => r.json()).then((data) => {
      const tasksData = Array.isArray(data) ? data : [];
      setTasks(tasksData);
      setFiltered(tasksData);
    });
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setError("");
    setShowModal(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setForm({
      titre: task.titre,
      description: task.description || "",
      statut: task.statut,
      priorite: task.priorite,
      dateDebut: task.dateDebut ? task.dateDebut.split("T")[0] : "",
      dateFin: task.dateFin ? task.dateFin.split("T")[0] : "",
      projetId: task.projetId?._id || "",
      employeId: task.employeId?._id || "",
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

    // Validation front-end
    const validationErrors = validateTask(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSaving(false);
      return;
    }

    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/tasks/${editing._id}` : "/api/tasks";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setShowModal(false);
      refreshTasks();
    } else {
      const d = await res.json();
      if (d.errors) {
        setErrors(d.errors);
      }
      setError(d.message || "Erreur serveur");
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette tâche ?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    refreshTasks();
  }

  async function changeStatut(task: Task, statut: string) {
    await fetch(`/api/tasks/${task._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    refreshTasks();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tâches</h1>
          <p className="mt-1 text-sm text-slate-500">Gérez et suivez les tâches de vos projets</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:opacity-90 transition"
        >
          <Plus size={16} /> Ajouter tâche
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une tâche..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filterPriorite}
              onChange={(e) => setFilterPriorite(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Toutes les priorités</option>
              {PRIORITES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="relative">
            <ArrowUpDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="dateFin">Trier par date fin</option>
              <option value="titre">Trier par titre</option>
              <option value="priorite">Trier par priorité</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["Tous", ...STATUTS].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatut(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filterStatut === s
                ? "bg-indigo-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-6 py-3.5 text-left font-semibold text-slate-700">Tâche</th>
                <th className="px-6 py-3.5 text-left font-semibold text-slate-700">Projet</th>
                <th className="px-6 py-3.5 text-left font-semibold text-slate-700">Employé</th>
                <th className="px-6 py-3.5 text-left font-semibold text-slate-700">Statut</th>
                <th className="px-6 py-3.5 text-left font-semibold text-slate-700">Priorité</th>
                <th className="px-6 py-3.5 text-left font-semibold text-slate-700">Date fin</th>
                <th className="px-6 py-3.5 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
                    Aucune tâche trouvée
                  </td>
                </tr>
              ) : (
                filtered.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{task.titre}</p>
                      {task.description && <p className="text-xs text-slate-400 truncate max-w-xs">{task.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{task.projetId?.titre || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {task.employeId ? `${task.employeId.prenom} ${task.employeId.nom}` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={task.statut}
                        onChange={(e) => changeStatut(task, e.target.value)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-none outline-none cursor-pointer ${STATUT_COLORS[task.statut] || "bg-slate-100 text-slate-600"}`}
                      >
                        {STATUTS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITE_COLORS[task.priorite] || "bg-slate-100"}`}>
                        {task.priorite}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {task.dateFin ? new Date(task.dateFin).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(task)} className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(task._id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? "Modifier tâche" : "Ajouter tâche"}
              </h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 flex items-center gap-2"><AlertCircle size={14} />{error}</p>}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Titre *</label>
                <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 ${errors.titre ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`} />
                {errors.titre && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.titre}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Description *</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 resize-none ${errors.description ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`} />
                {errors.description && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Projet *</label>
                  <select value={form.projetId} onChange={(e) => setForm({ ...form, projetId: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 bg-white ${errors.projetId ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`}>
                    <option value="">Sélectionner...</option>
                    {projects.map((p) => <option key={p._id} value={p._id}>{p.titre}</option>)}
                  </select>
                  {errors.projetId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.projetId}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Employé</label>
                  <select value={form.employeId} onChange={(e) => setForm({ ...form, employeId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white">
                    <option value="">Aucun</option>
                    {team.map((u) => <option key={u._id} value={u._id}>{u.prenom} {u.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Statut</label>
                  <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white">
                    {STATUTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Priorité</label>
                  <select value={form.priorite} onChange={(e) => setForm({ ...form, priorite: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 bg-white">
                    {PRIORITES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Date début</label>
                  <input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Date fin</label>
                  <input type="date" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 ${errors.dateFin ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`} />
                  {errors.dateFin && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{errors.dateFin}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2 text-sm font-medium text-white disabled:opacity-60 hover:opacity-90">
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
