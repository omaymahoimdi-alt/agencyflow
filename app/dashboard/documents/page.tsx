"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, Filter, Download, FileText, FileImage, Trash2, X, Eye } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { addToCorbeille } from "@/lib/corbeille";

interface Project { _id: string; titre: string }
interface TeamMember { _id: string; nom: string; prenom: string }
interface DocFile {
  _id: string;
  nomDocument: string;
  type: string;
  description?: string;
  url: string;
  dateUpload: string;
  projectId?: Project;
  uploadedBy?: TeamMember;
}

const TYPE_OPTIONS = ["Tous", "PDF", "Image", "Word", "Excel", "ZIP"];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  PDF: <FileText size={18} className="text-red-500" />,
  Image: <FileImage size={18} className="text-blue-500" />,
  Word: <FileText size={18} className="text-blue-700" />,
  Excel: <FileText size={18} className="text-emerald-600" />,
  ZIP: <FileText size={18} className="text-amber-500" />,
  Autre: <FileText size={18} className="text-slate-400" />,
};

const TYPE_BADGE: Record<string, string> = {
  PDF: "bg-red-50 text-red-600",
  Image: "bg-blue-50 text-blue-600",
  Word: "bg-blue-50 text-blue-800",
  Excel: "bg-emerald-50 text-emerald-700",
  ZIP: "bg-amber-50 text-amber-700",
  Autre: "bg-slate-100 text-slate-600",
};

function detectType(filename: string, mimeType: string): string {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("image")) return "Image";
  if (mimeType.includes("word") || filename.endsWith(".docx") || filename.endsWith(".doc")) return "Word";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet") || filename.endsWith(".xlsx") || filename.endsWith(".xls")) return "Excel";
  if (mimeType.includes("zip") || filename.endsWith(".zip") || filename.endsWith(".rar")) return "ZIP";
  return "Autre";
}

// Validation TypeScript (contrôle de saisie)
const validateDocument = (data: any) => {
  const errors: Record<string, string> = {};
  
  if (!data.nomDocument?.trim()) errors.nomDocument = "Nom du document obligatoire";
  if (!data.type?.trim()) errors.type = "Type du document obligatoire";
  if (!data.url?.trim()) errors.url = "Fichier obligatoire";
  if (!data.projectId) errors.projectId = "Projet associé obligatoire";
  
  return errors;
};

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [filtered, setFiltered] = useState<DocFile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState<DocFile | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<DocFile | null>(null);

  // Add form states
  const [form, setForm] = useState({
    nomDocument: "",
    type: "PDF",
    description: "",
    url: "",
    projectId: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Search and filter states
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Tous");

  useEffect(() => {
    Promise.all([
      fetch("/api/documents").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]).then(([d, p]) => {
      setDocuments(Array.isArray(d) ? d : []);
      setProjects(Array.isArray(p) ? p : []);
      setLoading(false);
    });
  }, []);

  // Apply search, filter, sort
  useEffect(() => {
    let result = [...documents];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(doc => 
        doc.nomDocument.toLowerCase().includes(q) ||
        (doc.description && doc.description.toLowerCase().includes(q))
      );
    }

    // Filter by type
    if (filterType !== "Tous") {
      result = result.filter(doc => doc.type === filterType);
    }

    setFiltered(result);
  }, [search, filterType, documents]);

  function refreshDocs() {
    fetch("/api/documents").then((r) => r.json()).then((data) => setDocuments(Array.isArray(data) ? data : []));
  }

  function openAddModal() {
    setForm({
      nomDocument: "",
      type: "PDF",
      description: "",
      url: "",
      projectId: projects[0]?._id || "",
    });
    setFormErrors({});
    setShowAddModal(true);
  }

  async function handleFileSelect(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "agencyflow/documents");

    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      alert("Erreur upload: " + uploadData.message);
      setUploading(false);
      return;
    }

    const docType = detectType(file.name, file.type);
    setForm(prev => ({
      ...prev,
      nomDocument: file.name,
      type: docType,
      url: uploadData.url,
      publicId: uploadData.publicId || "",
    }));
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const validationErrors = validateDocument(form);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    const saveRes = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (saveRes.ok) {
      setShowAddModal(false);
      refreshDocs();
    } else {
      const errData = await saveRes.json();
      if (errData.errors) setFormErrors(errData.errors);
      else alert(errData.message || "Erreur serveur");
    }
  }

  async function handleDelete(doc: DocFile) {
    await fetch(`/api/documents/${doc._id}`, { method: "DELETE" });
    const userName = session?.user?.name || "Utilisateur inconnu";
    const userEmail = session?.user?.email || "—";
    const userAvatar = userName.split(" ").map((w: string) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
    await addToCorbeille({
      id: "corbeille-fichier-" + Date.now(),
      type: "Fichier",
      nom: doc.nomDocument + "." + (doc.type || "pdf"),
      supprimePar: { nom: userName, email: userEmail, fonction: "Utilisateur", avatar: userAvatar },
      supprimeLe: new Date().toISOString(),
      supprimeDefinitivementLe: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      sourceData: doc,
    });
    setShowDeleteModal(null);
    refreshDocs();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestion des Documents</h1>
          <p className="mt-1 text-sm text-slate-500">Documents associés aux projets</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:opacity-90 transition"
        >
          <Plus size={16} /> Ajouter Document
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un document..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-6 py-3.5 text-left font-semibold text-slate-700">Nom du fichier</th>
                <th className="px-6 py-3.5 text-left font-semibold text-slate-700">Type</th>
                <th className="px-6 py-3.5 text-left font-semibold text-slate-700">Projet</th>
                <th className="px-6 py-3.5 text-left font-semibold text-slate-700">Ajouté par</th>
                <th className="px-6 py-3.5 text-left font-semibold text-slate-700">Date</th>
                <th className="px-6 py-3.5 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    Aucun document trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {TYPE_ICONS[doc.type] || TYPE_ICONS.Autre}
                        <span className="font-medium text-slate-900 truncate max-w-xs">{doc.nomDocument}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE[doc.type] || "bg-slate-100 text-slate-600"}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{doc.projectId?.titre || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {doc.uploadedBy ? `${doc.uploadedBy.prenom} ${doc.uploadedBy.nom}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(doc.dateUpload).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowViewModal(doc)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
                          title="Visualiser"
                        >
                          <Eye size={15} />
                        </button>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                          title="Télécharger"
                        >
                          <Download size={15} />
                        </a>
                        <button
                          onClick={() => setShowDeleteModal(doc)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Supprimer"
                        >
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

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">Ajouter Document</h2>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors && Object.values(formErrors).some(e => e) && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {Object.entries(formErrors).map(([k, v]) => v && <p key={k}>{v}</p>)}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Fichier *</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.gif,.webp"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 hover:border-indigo-300 hover:bg-slate-100 transition disabled:opacity-60"
                >
                  {uploading ? "Upload en cours..." : form.url ? `Fichier sélectionné: ${form.nomDocument}` : "Choisir un fichier"}
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Nom du document *</label>
                <input
                  value={form.nomDocument}
                  onChange={(e) => setForm({ ...form, nomDocument: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 ${formErrors.nomDocument ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`}
                />
                {formErrors.nomDocument && <p className="mt-1 text-xs text-red-500">{formErrors.nomDocument}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Projet associé *</label>
                  <select
                    value={form.projectId}
                    onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 bg-white ${formErrors.projectId ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`}
                  >
                    <option value="">Sélectionner Projet</option>
                    {projects.map((p) => <option key={p._id} value={p._id}>{p.titre}</option>)}
                  </select>
                  {formErrors.projectId && <p className="mt-1 text-xs text-red-500">{formErrors.projectId}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 bg-white ${formErrors.type ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400"}`}
                  >
                    {TYPE_OPTIONS.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {formErrors.type && <p className="mt-1 text-xs text-red-500">{formErrors.type}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={uploading} className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2 text-sm font-medium text-white disabled:opacity-60 hover:opacity-90">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">Détails du document</h2>
              <button onClick={() => setShowViewModal(null)} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-medium text-slate-500">Nom</span>
                <p className="text-sm font-medium text-slate-900">{showViewModal.nomDocument}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500">Projet</span>
                <p className="text-sm text-slate-700">{showViewModal.projectId?.titre || "—"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500">Type</span>
                <p className="text-sm text-slate-700">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGE[showViewModal.type] || "bg-slate-100 text-slate-600"}`}>{showViewModal.type}</span>
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500">Ajouté par</span>
                <p className="text-sm text-slate-700">{showViewModal.uploadedBy ? `${showViewModal.uploadedBy.prenom} ${showViewModal.uploadedBy.nom}` : "—"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500">Date</span>
                <p className="text-sm text-slate-700">{new Date(showViewModal.dateUpload).toLocaleDateString("fr-FR")}</p>
              </div>
              {showViewModal.description && (
                <div>
                  <span className="text-xs font-medium text-slate-500">Description</span>
                  <p className="text-sm text-slate-700">{showViewModal.description}</p>
                </div>
              )}

              {showViewModal.type === "Image" && (
                <div className="rounded-xl border border-slate-200 p-2 bg-slate-50">
                  <img
                    src={showViewModal.url}
                    alt={showViewModal.nomDocument}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowViewModal(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Fermer</button>
              <a
                href={showViewModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Télécharger
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Confirmation</h2>
              <p className="mt-2 text-sm text-slate-600">Voulez-vous vraiment supprimer ce document ?</p>
              <p className="mt-1 text-xs text-slate-500">Nom: {showDeleteModal.nomDocument}</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowDeleteModal(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={() => handleDelete(showDeleteModal)} className="rounded-xl bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
