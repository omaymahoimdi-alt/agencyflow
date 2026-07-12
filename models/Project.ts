import { Schema, model, models } from "mongoose";

const ProjectSchema = new Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dateDebut: { type: Date, default: Date.now },
    dateFin: { type: Date },
    budget: { type: Number, default: 0 },
    statut: {
      type: String,
      enum: ["En attente", "En cours", "En test", "Terminé", "Suspendu"],
      default: "En attente",
    },
    priorite: {
      type: String,
      enum: ["Faible", "Moyenne", "Haute", "Urgente"],
      default: "Moyenne",
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    chefProjet: { type: String, default: "" },
    chefProjetId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  },
  { timestamps: true }
);

const Project = models.Project || model("Project", ProjectSchema);

export { Project };
export default Project;
