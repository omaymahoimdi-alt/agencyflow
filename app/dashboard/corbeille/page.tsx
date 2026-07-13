"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Trash2, RotateCcw, Search, X, Eye, ChevronLeft, ChevronRight,
  FolderKanban, CheckSquare, Users, Building2, FileText, RefreshCw,
  AlertTriangle, Info,
} from "lucide-react";
import {
  CorbeilleItem, getCorbeilleItems,
  removeFromCorbeille, restoreItem, clearCorbeille,
} from "@/lib/corbeille";

// --- Helpers ---
const TYPE_ICONS: Record<string, React.ElementType> = {
  Projet: FolderKanban,
  Tâche: CheckSquare,
  Client: Building2,
  Membre: Users,
  Fichier: FileText,
};

const TYPE_COLORS: Record<string, string> = {
  Projet: "bg-indigo-100 text-indigo-700",
  Tâche: "bg-emerald-100 text-emerald-700",
  Client: "bg-amber-100 text-amber-700",
  Membre: "bg-rose-100 text-rose-700",
  Fichier: "bg-sky-100 text-sky-700",
};

const TYPE_EMOJIS: Record<string, string> = {
  Projet: "📁",
  Tâche: "✅",
  Client: "👤",
  Membre: "👥",
  Fichier: "📄",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function getDaysUntil(iso: string) {
  const now = new Date();
  const target = new Date(iso);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// --- Component ---
export default function CorbeillePage() {
  const [items, setItems] = useState<CorbeilleItem[]>([]);
  const [filter, setFilter] = useState("Tous");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 6;
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    getCorbeilleItems().then(setItems);
    const onVisible = () => { if (!document.hidden) getCorbeilleItems().then(setItems); };
    const onFocus = () => getCorbeilleItems().then(setItems);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const persistAndSet = useCallback(async (newItems: CorbeilleItem[]) => {
    setItems(newItems);
    // remove all current, then re-add new ones is not efficient, but fine for rare bulk ops
    for (const item of newItems) {
      await fetch("/api/corbeille", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    }
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (filter !== "Tous") result = result.filter((i) => i.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.nom.toLowerCase().includes(q));
    }
    return result;
  }, [items, filter, search]);

  const totalPages = Math.ceil(filteredItems.length / perPage);
  const paginated = filteredItems.slice((page - 1) * perPage, page * perPage);

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (selected.length === paginated.length) {
      setSelected([]);
    } else {
      setSelected(paginated.map((i) => i.id));
    }
  }

  async function handleRestore(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const ok = await restoreItem(item);
    if (ok) {
      await removeFromCorbeille(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setSelected((prev) => prev.filter((id) => id !== itemId));
      setToast({ type: "success", message: `"${item.nom}" a été restauré avec succès.` });
    } else {
      setToast({ type: "error", message: `Impossible de restaurer "${item.nom}".` });
    }
  }

  async function handleRestoreAll() {
    const allItems = items;
    let okCount = 0;
    const toRemove: string[] = [];
    for (const item of allItems) {
      const ok = await restoreItem(item);
      if (ok) {
        okCount++;
        toRemove.push(item.id);
      }
    }
    await Promise.all(toRemove.map(id => removeFromCorbeille(id)));
    setItems((prev) => prev.filter((i) => !toRemove.includes(i.id)));
    setSelected([]);
    setToast({ type: "success", message: `${okCount}/${allItems.length} élément(s) restauré(s) avec succès.` });
  }

  async function handlePermanentDelete(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    if (!confirm(`Supprimer définitivement "${item.nom}" ? Cette action est irréversible.`)) return;
    await removeFromCorbeille(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setSelected((prev) => prev.filter((id) => id !== itemId));
    setToast({ type: "success", message: `"${item.nom}" a été supprimé définitivement.` });
  }

  async function handleEmptyTrash() {
    if (!confirm("Vider la corbeille ? Tous les éléments seront définitivement supprimés.")) return;
    await clearCorbeille();
    setItems([]);
    setSelected([]);
    setToast({ type: "success", message: "Corbeille vidée avec succès." });
  }

  function handlePreview(itemId: string) {
    // no-op for now
  }

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { Tous: items.length };
    for (const item of items) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
    return counts;
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-xl px-5 py-3 shadow-xl text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Trash2 size={28} className="text-violet-600" />
            Corbeille
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 max-w-2xl">
            Retrouvez, restaurez ou supprimez définitivement les éléments supprimés de votre plateforme.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleEmptyTrash}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition shadow-sm">
            <Trash2 size={16} /> Vider la corbeille
          </button>
          <button onClick={handleRestoreAll}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 hover:opacity-90 transition">
            <RotateCcw size={16} /> Restaurer tout
          </button>
        </div>
      </div>

      {/* ===== SEARCH + FILTERS ===== */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none text-slate-600 placeholder:text-slate-400 focus:border-violet-300 transition"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "Tous", label: "Tous", icon: null },
            { key: "Projet", label: "Projets", icon: FolderKanban },
            { key: "Tâche", label: "Tâches", icon: CheckSquare },
            { key: "Client", label: "Clients", icon: Building2 },
            { key: "Membre", label: "Membres", icon: Users },
            { key: "Fichier", label: "Fichiers", icon: FileText },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setPage(1); }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                filter === key
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {Icon && <Icon size={15} />}
              {label}
              <span className={`ml-1 text-xs ${filter === key ? "text-violet-200" : "text-slate-400"}`}>
                ({filterCounts[key] || 0})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Table */}
        <div className="flex-1 min-w-0">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-16 text-center shadow-sm">
              <Trash2 size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-500">La corbeille est vide</p>
              <p className="text-sm text-slate-400 mt-1">Les éléments supprimés apparaîtront ici.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="w-10 px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={paginated.length > 0 && selected.length === paginated.length}
                          onChange={toggleAll}
                          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Élément</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Supprimé par</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Supprimé le</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Suppression définitive dans</th>
                      <th className="px-4 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((item) => {
                      const daysLeft = getDaysUntil(item.supprimeDefinitivementLe);
                      return (
                        <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${selected.includes(item.id) ? "bg-violet-50/50" : ""}`}>
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selected.includes(item.id)}
                              onChange={() => toggleSelect(item.id)}
                              className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm">
                                {TYPE_EMOJIS[item.type]}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{item.nom}</p>
                                <p className="text-[11px] text-slate-400">{item.type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold ${TYPE_COLORS[item.type]}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5">
                              {/* Avatar avec initiales du responsable */}
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 text-xs font-bold text-violet-600 shadow-sm">
                                {item.supprimePar.avatar}
                              </div>
                              <div>
                                {/* Nom complet du responsable de la suppression */}
                                <p className="text-sm font-medium text-slate-700">{item.supprimePar.nom}</p>
                                {/* Email du responsable — permet d'identifier précisément qui a supprimé l'élément */}
                                <a
                                  href={`mailto:${item.supprimePar.email}`}
                                  className="text-[11px] text-violet-500 hover:text-violet-700 hover:underline transition-colors"
                                  title={`Contacter ${item.supprimePar.nom}`}
                                >
                                  {item.supprimePar.email || item.supprimePar.fonction}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-slate-700">
                              {formatDate(item.supprimeLe)} à {new Date(item.supprimeLe).getHours().toString().padStart(2, "0")}h{new Date(item.supprimeLe).getMinutes().toString().padStart(2, "0")}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className={`text-sm font-bold ${daysLeft <= 5 ? "text-red-500" : "text-slate-900"}`}>
                              {daysLeft} jours
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatDate(item.supprimeDefinitivementLe)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleRestore(item.id)}
                                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 transition"
                                title="Restaurer"
                              >
                                <RotateCcw size={14} />
                              </button>
                              <button
                                onClick={() => handlePreview(item.id)}
                                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 transition"
                                title="Aperçu"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(item.id)}
                                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
                                title="Supprimer définitivement"
                              >
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
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-4 py-4">
                  <p className="text-xs text-slate-500">
                    {filteredItems.length > 0
                      ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, filteredItems.length)} sur ${filteredItems.length} éléments`
                      : "Aucun élément"}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          p === page ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tip banner */}
          <div className="mt-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <Info size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Conseil</p>
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                  Utilisez les filtres pour retrouver rapidement vos éléments supprimés.
                  Vous pouvez restaurer un élément individuellement ou restaurer plusieurs
                  éléments en une seule opération.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT SIDEBAR ===== */}
        <div className="w-full lg:w-80 shrink-0 space-y-5">
          {/* Info card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Info size={16} className="text-violet-600" /> Informations
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Les éléments supprimés sont conservés pendant 30 jours avant leur suppression définitive.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-xs font-medium text-slate-600">Nombre d&apos;éléments</span>
                <span className="text-sm font-bold text-slate-900">{items.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-xs font-medium text-slate-600">Espace utilisé</span>
                <span className="text-sm font-bold text-slate-900">1.2 Go</span>
              </div>
            </div>
          </div>

          {/* Répartition par type */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Répartition par type</h3>
            <div className="space-y-3">
              {(["Projet", "Tâche", "Client", "Membre", "Fichier"] as const).map((type) => {
                const count = items.filter((i) => i.type === type).length;
                const Icon = TYPE_ICONS[type];
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">{TYPE_EMOJIS[type]}</span>
                      <span className="text-xs font-medium text-slate-600">{type}s</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{count} élément{count > 1 ? "s" : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Actions rapides</h3>
            <div className="space-y-2.5">
              <button onClick={async () => {
                const today = new Date().toISOString().split("T")[0];
                const todayItems = items.filter((i) => i.supprimeLe.startsWith(today));
                for (const item of todayItems) {
                  await restoreItem(item);
                  removeFromCorbeille(item.id);
                }
                setItems((prev) => prev.filter((i) => !todayItems.find((t) => t.id === i.id)));
                setToast({ type: "success", message: `${todayItems.length} élément(s) restauré(s).` });
              }}
                className="w-full flex items-center gap-2.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition">
                <RefreshCw size={14} className="text-violet-500" />
                Restaurer les éléments supprimés aujourd&apos;hui
              </button>
              <button onClick={async () => {
                const projets = items.filter((i) => i.type === "Projet");
                for (const item of projets) {
                  await restoreItem(item);
                  removeFromCorbeille(item.id);
                }
                setItems((prev) => prev.filter((i) => !projets.find((p) => p.id === i.id)));
                setToast({ type: "success", message: `${projets.length} projet(s) restauré(s).` });
              }}
                className="w-full flex items-center gap-2.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition">
                <FolderKanban size={14} className="text-indigo-500" />
                Restaurer les projets
              </button>
              <button onClick={async () => {
                const taches = items.filter((i) => i.type === "Tâche");
                for (const item of taches) {
                  await restoreItem(item);
                  removeFromCorbeille(item.id);
                }
                setItems((prev) => prev.filter((i) => !taches.find((t) => t.id === i.id)));
                setToast({ type: "success", message: `${taches.length} tâche(s) restaurée(s).` });
              }}
                className="w-full flex items-center gap-2.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition">
                <CheckSquare size={14} className="text-emerald-500" />
                Restaurer les tâches
              </button>
              <button onClick={handleEmptyTrash}
                className="w-full flex items-center gap-2.5 rounded-xl border border-red-100 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition">
                <AlertTriangle size={14} />
                Vider toute la corbeille
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
