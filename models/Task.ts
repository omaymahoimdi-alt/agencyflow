import { Schema, model, models } from "mongoose";

const TaskSchema = new Schema(
  {
    titre: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    statut: {
      type: String,
      enum: ["À faire", "En cours", "Terminée", "Bloquée"],
      default: "À faire",
    },
    priorite: {
      type: String,
      enum: ["Faible", "Moyenne", "Haute", "Urgente"],
      default: "Moyenne",
    },
    dateDebut: { type: Date, default: Date.now },
    dateFin: { type: Date },
    projetId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    employeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

const Task = models.Task || model("Task", TaskSchema);

export { Task };
export default Task;
