"use client";

export interface CorbeilleItem {
  id: string;
  type: "Projet" | "Tâche" | "Client" | "Membre" | "Fichier";
  nom: string;
  supprimePar: { nom: string; email: string; fonction: string; avatar: string };
  supprimeLe: string;
  supprimeDefinitivementLe: string;
  sourceData?: any;
  meta?: Record<string, string>;
}

export async function getCorbeilleItems(): Promise<CorbeilleItem[]> {
  try {
    const res = await fetch("/api/corbeille");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function addToCorbeille(item: CorbeilleItem): Promise<boolean> {
  try {
    const res = await fetch("/api/corbeille", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function removeFromCorbeille(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/corbeille/${id}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearCorbeille(): Promise<boolean> {
  try {
    const items = await getCorbeilleItems();
    await Promise.all(items.map(i => removeFromCorbeille(i.id)));
    return true;
  } catch {
    return false;
  }
}

// --- Restore helpers ---

export async function restoreItem(item: CorbeilleItem): Promise<boolean> {
  switch (item.type) {
    case "Membre":
      return restoreMembre(item);
    case "Fichier":
      return restoreFichier(item);
    default:
      return restoreViaApi(item);
  }
}

async function restoreViaApi(item: CorbeilleItem): Promise<boolean> {
  try {
    if (!item.sourceData) return false;
    const { _id, id, ...data } = item.sourceData;
    const res = await fetch("/api/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: item.type, data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function restoreMembre(item: CorbeilleItem): Promise<boolean> {
  try {
    if (!item.sourceData) return false;
    const { _id, id, ...data } = item.sourceData;
    const res = await fetch("/api/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "Membre", data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function restoreFichier(item: CorbeilleItem): Promise<boolean> {
  try {
    if (!item.sourceData) return false;
    const res = await fetch("/api/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "Fichier",
        data: item.sourceData,
        meta: item.meta,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
