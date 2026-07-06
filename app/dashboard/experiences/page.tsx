"use client"
import { useState, useEffect } from "react"
import { validateExperience, type ValidationErrors } from "@/lib/validation"

interface Experience {
  _id: string
  type: "work" | "education"
  title: string
  company: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

export default function GestionExperiences() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    type: "work" as "work" | "education",
    title: "", company: "",
    startDate: "", endDate: "",
    current: false, description: ""
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch("/api/experiences")
        const data = await res.json()
        setExperiences(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error loading experiences:", error)
        setExperiences([])
      }
    }
    charger()
  }, [])

  function ouvrirAjout() {
    setEditId(null)
    setForm({ type: "work", title: "", company: "", startDate: "", endDate: "", current: false, description: "" })
    setShowModal(true)
  }

  function ouvrirEdit(exp: Experience) {
    setEditId(exp._id)
    setForm({
      type: exp.type, title: exp.title, company: exp.company,
      startDate: exp.startDate, endDate: exp.endDate,
      current: exp.current, description: exp.description
    })
    setShowModal(true)
  }

  function validateForm(): boolean {
    const errors = validateExperience(form)
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function sauvegarder() {
    if (!validateForm()) return

    if (editId) {
      const res = await fetch(`/api/experiences/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const updated = await res.json()
      setExperiences(prev => prev.map(e => e._id === editId ? updated : e))
    } else {
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const created = await res.json()
      setExperiences(prev => [...prev, created])
    }
    setShowModal(false)
    setFormErrors({})
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer cette expérience ?")) return
    await fetch(`/api/experiences/${id}`, { method: "DELETE" })
    setExperiences(prev => prev.filter(e => e._id !== id))
  }

  const travaux = experiences.filter(e => e.type === "work")
  const formations = experiences.filter(e => e.type === "education")

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Gestion des expériences</h1>
        <button
          onClick={ouvrirAjout}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Ajouter
        </button>
      </div>

      {/* Emplois */}
      <h2 className="font-semibold text-lg mb-3 text-slate-900">💼 Expériences professionnelles</h2>
      <div className="relative border-l-2 border-blue-200 ml-4 mb-8">
        {travaux.map(exp => (
          <div key={exp._id} className="ml-6 mb-6 relative">
            <div className="absolute -left-8 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                  <p className="text-blue-600 text-sm">{exp.company}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {exp.startDate} → {exp.current ? "Aujourd'hui" : exp.endDate}
                  </p>
                  <p className="text-slate-600 text-sm mt-2">{exp.description}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => ouvrirEdit(exp)} className="text-blue-500 text-sm">✏️</button>
                  <button onClick={() => supprimer(exp._id)} className="text-red-400 text-sm">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formations */}
      <h2 className="font-semibold text-lg mb-3 text-slate-900">🎓 Formations</h2>
      <div className="relative border-l-2 border-purple-200 ml-4">
        {formations.map(exp => (
          <div key={exp._id} className="ml-6 mb-6 relative">
            <div className="absolute -left-8 w-4 h-4 bg-purple-500 rounded-full border-2 border-white" />
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                  <p className="text-purple-600 text-sm">{exp.company}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {exp.startDate} → {exp.current ? "En cours" : exp.endDate}
                  </p>
                  <p className="text-slate-600 text-sm mt-2">{exp.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => ouvrirEdit(exp)} className="text-blue-500 text-sm">✏️</button>
                  <button onClick={() => supprimer(exp._id)} className="text-red-400 text-sm">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-slate-900">
              {editId ? "Modifier" : "Nouvelle expérience"}
            </h2>
            <div className="space-y-3">
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as "work" | "education" })}
                className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-slate-900"
              >
                <option value="work">💼 Emploi</option>
                <option value="education">🎓 Formation</option>
              </select>
              <div>
                <input
                  placeholder="Titre / Poste"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 ${formErrors.title ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"}`}
                />
                {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
              </div>
              <div>
                <input
                  placeholder="Entreprise / École"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 ${formErrors.company ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"}`}
                />
                {formErrors.company && <p className="text-red-500 text-sm mt-1">{formErrors.company}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="month"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 text-slate-900 ${formErrors.startDate ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"}`}
                  />
                  {formErrors.startDate && <p className="text-red-500 text-sm mt-1">{formErrors.startDate}</p>}
                </div>
                <div>
                  <input
                    type="month"
                    value={form.endDate}
                    disabled={form.current}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 text-slate-900 disabled:opacity-50 ${formErrors.endDate ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"}`}
                  />
                  {formErrors.endDate && <p className="text-red-500 text-sm mt-1">{formErrors.endDate}</p>}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.current}
                  onChange={e => setForm({ ...form, current: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Poste actuel / En cours</span>
              </label>
              <textarea
                placeholder="Description..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 h-20 text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormErrors({})
                }}
                className="flex-1 border border-slate-300 rounded-lg py-2 text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={sauvegarder}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
              >
                {editId ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
