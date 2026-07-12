import { Schema, model, models } from "mongoose";

const TeamSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    nom: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

TeamSchema.index({ workspaceId: 1, nom: 1 }, { unique: true });

const Team = models.Team || model("Team", TeamSchema);
export default Team;
