import { Schema, model, models } from "mongoose";

const WorkspaceMemberSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["Owner", "Admin", "ChefProjet", "Développeur", "Designer", "Client"],
      default: "Développeur",
    },
    equipe: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Actif", "Invité", "Suspendu"],
      default: "Actif",
    },
  },
  { timestamps: true }
);

WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

const WorkspaceMember = models.WorkspaceMember || model("WorkspaceMember", WorkspaceMemberSchema);
export default WorkspaceMember;
