import { Schema, model, models } from "mongoose";

const CorbeilleItemSchema = new Schema({
  workspaceId: { type: String, required: true, index: true },
  deletedBy: { type: String, required: true },
  id: { type: String, required: true },
  type: { type: String, required: true, enum: ["Projet", "Tâche", "Client", "Membre", "Fichier"] },
  nom: { type: String, required: true },
  supprimePar: {
    nom: String,
    email: String,
    fonction: String,
    avatar: String,
  },
  supprimeLe: { type: String, required: true },
  supprimeDefinitivementLe: { type: String, required: true },
  sourceData: { type: Schema.Types.Mixed },
  meta: { type: Schema.Types.Mixed },
}, { timestamps: true });

const Corbeille = models.Corbeille || model("Corbeille", CorbeilleItemSchema);

export default Corbeille;
