"use client";

import { useState, useCallback } from "react";
import { Clock, RefreshCw, User, FileText, FolderKanban, ListTodo, Users, MessageSquare, Trash2 } from "lucide-react";
import { usePolling } from "@/hooks/usePolling";

interface Activity {
  _id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  entityType: string;
  entityName: string;
  action: string;
  description: string;
  createdAt: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  created: { label: "a créé", color: "text-emerald-600" },
  updated: { label: "a modifié", color: "text-amber-600" },
  deleted: { label: "a supprimé", color: "text-red-600" },
  completed: { label: "a terminé", color: "text-emerald-600" },
  commented: { label: "a commenté", color: "text-blue-600" },
};

const entityIcons: Record<string, any> = {
  client: Building2Icon,
  project: FolderKanban,
  task: ListTodo,
  team: Users,
  document: FileText,
  comment: MessageSquare,
};

function Building2Icon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M2 22h20M10 8h4M10 12h4M10 16h4" />
    </svg>
  );
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const perPage = 30;

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/activities?limit=${perPage}&skip=${page * perPage}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
        setTotal(data.total || 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [page]);

  usePolling(fetchActivities, 30000);

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`;
    return date.toLocaleDateString("fr-FR");
  };

  const getActionInfo = (action: string) => {
    const key = Object.keys(actionLabels).find(k => action.startsWith(k)) || "updated";
    return actionLabels[key] || actionLabels.updated;
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Historique des activités</h1>
          <p className="text-sm text-slate-500">{total} actions enregistrées</p>
        </div>
        <button
          onClick={fetchActivities}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <Clock size={48} className="mx-auto text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-700">Aucune activité</h3>
          <p className="mt-1 text-sm text-slate-500">Les actions de votre équipe apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((a, i) => {
            const actionInfo = getActionInfo(a.action);
            const Icon = entityIcons[a.entityType] || Clock;
            return (
              <div key={a._id} className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 transition hover:bg-slate-50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">{a.userName || "Quelqu'un"}</span>{" "}
                    {a.userEmail && <span className="text-xs text-slate-400 ml-1">({a.userEmail})</span>}{" "}
                    <span className={actionInfo.color}>{actionInfo.label}</span>{" "}
                    <span className="font-medium">{a.entityType}</span>
                    {a.entityName && (
                      <span className="text-slate-500"> &quot;{a.entityName}&quot;</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{timeAgo(a.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > perPage && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-sm text-slate-500">
            Page {page + 1} / {Math.ceil(total / perPage)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * perPage >= total}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
