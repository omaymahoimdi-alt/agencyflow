"use client"
import { useState, useEffect } from "react"
import { validateSkill, type ValidationErrors } from "@/lib/validation"

interface Skill {
  _id: string
  name: string
  category: string
  level: number
}

const CATEGORIES = ["Frontend", "Backend", "Design", "DevOps", "Autre"]

export default function GestionCompetences() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [form, setForm] = useState({ name: "", category: "Frontend", level: 50 })
  const [editId, setEditId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function charger() {
      try {
        const res = await fetch("/api/skills")
        const data = await res.json()
        setSkills(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error loading skills:", error)
        setSkills([])
      }
    }
    charger()
  }, [])

  // ===== Validation en temps réel =====
  function handleFieldChange(field: string, value: string | number) {
    const newForm = { ...form, [field]: value }
    setForm(newForm)
    
    const errors = validateSkill(newForm)
    setFormErrors(prev => ({ ...prev, [field]: errors[field] }))
  }

  function validateForm(): boolean {
    const errors = validateSkill(form)
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function sauvegarder() {
    if (!validateForm()) return

    if (editId) {
      const res = await fetch(`/api/skills/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const updated = await res.json()
      setSkills(prev => prev.map(s => s._id === editId ? updated : s))
      setEditId(null)
    } else {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const created = await res.json()
      setSkills(prev => [...prev, created])
    }
    setForm({ name: "", category: "Frontend", level: 50 })
    setFormErrors({})
  }

  async function supprimer(id: string) {
    await fetch(`/api/skills/${id}`, { method: "DELETE" })
    setSkills(prev => prev.filter(s => s._id !== id))
  }

  function editer(skill: Skill) {
    setEditId(skill._id)
    setForm({ name: skill.name, category: skill.category, level: skill.level })
  }

  // Grouper par catégorie
  const parCategorie = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = skills.filter(s => s.category === cat)
    return acc
  }, {} as Record<string, Skill[]>)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Gestion des compétences</h1>

      {/* Formulaire */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 shadow-sm">
        <h2 className="font-semibold mb-4 text-slate-900">
          {editId ? "Modifier la compétence" : "Ajouter une compétence"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom de la compétence <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: React, JavaScript, Figma"
              value={form.name}
              onChange={e => handleFieldChange('name', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 ${formErrors.name ? "border-red-500 bg-red-50" : "border-slate-300 bg-white"}`}
            />
            {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={e => handleFieldChange('category', e.target.value)}
              className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-slate-900"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Niveau: {form.level}%
            </label>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="range"
                min={0} max={100}
                value={form.level}
                onChange={e => handleFieldChange('level', Number(e.target.value))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
        {formErrors.level && <p className="text-red-500 text-sm mb-3">{formErrors.level}</p>}
        <div className="flex gap-2">
          {editId && (
            <button
              onClick={() => {
                setEditId(null)
                setForm({ name: "", category: "Frontend", level: 50 })
                setFormErrors({})
              }}
              className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              Annuler
            </button>
          )}
          <button
            onClick={sauvegarder}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {editId ? "Enregistrer" : "+ Ajouter"}
          </button>
        </div>
      </div>

      {/* Liste par catégorie */}
      {CATEGORIES.map(cat => (
        parCategorie[cat]?.length > 0 && (
          <div key={cat} className="mb-6">
            <h2 className="font-semibold text-slate-600 mb-3">📂 {cat}</h2>
            <div className="space-y-3">
              {parCategorie[cat].map(skill => (
                <div key={skill._id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-slate-900">{skill.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editer(skill)}
                        className="text-blue-500 text-sm hover:underline"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => supprimer(skill._id)}
                        className="text-red-400 text-sm hover:underline"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                  {/* Barre de progression */}
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                  <p className="text-right text-sm text-blue-600 mt-1">{skill.level}%</p>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  )
}
