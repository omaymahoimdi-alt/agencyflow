"use client";

export interface CorbeilleItem {
  id: string;
  type: "Projet" | "Tâche" | "Client" | "Membre" | "Fichier";
  nom: string;
  supprimePar: { nom: string; fonction: string; avatar: string };
  supprimeLe: string;
  supprimeDefinitivementLe: string;
  sourceData?: any;
  meta?: Record<string, string>;
}

const STORAGE_KEY = "af_corbeille";

export function getCorbeilleItems(): CorbeilleItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCorbeilleItems(items: CorbeilleItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function addToCorbeille(item: CorbeilleItem) {
  const items = getCorbeilleItems();
  items.unshift(item);
  saveCorbeilleItems(items);
}

export function removeFromCorbeille(id: string): CorbeilleItem | undefined {
  const items = getCorbeilleItems();
  const found = items.find((i) => i.id === id);
  saveCorbeilleItems(items.filter((i) => i.id !== id));
  return found;
}

export function clearCorbeille() {
  saveCorbeilleItems([]);
}

// --- Restore helpers ---

export async function restoreItem(item: CorbeilleItem): Promise<boolean> {
  switch (item.type) {
    case "Membre":
      return restoreMembre(item);
    case "Fichier":
      return restoreFichier(item);
    case "Projet":
      return restoreProjet(item);
    case "Tâche":
      return restoreTache(item);
    case "Client":
      return restoreClient(item);
    default:
      return true;
  }
}

function restoreMembre(item: CorbeilleItem): boolean {
  try {
    const raw = localStorage.getItem("af_team_members");
    const members = raw ? JSON.parse(raw) : [];
    if (item.sourceData) {
      members.push(item.sourceData);
    }
    localStorage.setItem("af_team_members", JSON.stringify(members));
    return true;
  } catch {
    return false;
  }
}

function restoreFichier(item: CorbeilleItem): boolean {
  try {
    const projectId = item.meta?.projectId;
    const folderId = item.meta?.folderId;
    if (!projectId || !folderId || !item.sourceData) return false;
    const raw = localStorage.getItem(`agencyflow_folders_${projectId}`);
    const folders = raw ? JSON.parse(raw) : [];
    const target = folders.find((f: any) => f.id === folderId);
    if (target) {
      target.files.push(item.sourceData);
    } else {
      folders.push({ id: folderId, name: item.meta?.folderName || "Restauré", files: [item.sourceData] });
    }
    localStorage.setItem(`agencyflow_folders_${projectId}`, JSON.stringify(folders));
    return true;
  } catch {
    return false;
  }
}

function extractApiData(item: CorbeilleItem): any {
  if (!item.sourceData) return {};
  const { _id, id, ...rest } = item.sourceData;
  // Normalize projetId from object { _id, titre } to plain string
  if (rest.projetId && typeof rest.projetId === "object") {
    rest.projetId = rest.projetId._id || rest.projetId.id;
  }
  // Normalize employeId from object { _id, nom, prenom } to plain string
  if (rest.employeId && typeof rest.employeId === "object") {
    rest.employeId = rest.employeId._id || rest.employeId.id;
  }
  return rest;
}

async function restoreProjet(item: CorbeilleItem): Promise<boolean> {
  try {
    const body = extractApiData(item);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function restoreTache(item: CorbeilleItem): Promise<boolean> {
  try {
    const body = extractApiData(item);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function restoreClient(item: CorbeilleItem): Promise<boolean> {
  try {
    const body = extractApiData(item);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}
