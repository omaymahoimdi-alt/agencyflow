import { Schema, model, models } from "mongoose";

const CorbeilleItemSchema = new Schema({
  corbeilleId: { type: String, required: true, unique: true },
  workspaceId: { type: String, required: true, index: true },
  deletedBy: { type: String, required: true },
  type: { type: String, required: true, enum: ["Projet", "Tâche", "Client", "Membre", "Fichier"] },
  nom: { type: String, required: true },
  supprimePar: {
    nom: String,
    email: String,
    fonction: String,
    avatar: String,
  },
  supprimeLe: { type: Date, required: true },
  supprimeDefinitivementLe: { type: Date, required: true },
  sourceData: { type: Schema.Types.Mixed },
  meta: { type: Schema.Types.Mixed },
}, { timestamps: true });

CorbeilleItemSchema.index({ workspaceId: 1, supprimeLe: -1 });

const Corbeille = models.Corbeille || model("Corbeille", CorbeilleItemSchema);

export default Corbeille;
