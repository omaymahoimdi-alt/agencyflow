import { Schema, model, models } from "mongoose";

const PermissionItemSchema = new Schema({
  voir: { type: Boolean, default: false },
  creer: { type: Boolean, default: false },
  modifier: { type: Boolean, default: false },
  supprimer: { type: Boolean, default: false },
  gerer: { type: Boolean, default: false },
}, { _id: false });

const RoleSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    nom: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["Système", "Personnalisé"], default: "Personnalisé" },
    creePar: { type: String, default: "" },
    creeParEmail: { type: String, default: "" },
    permissions: { type: Map, of: PermissionItemSchema, default: {} },
  },
  { timestamps: true }
);

RoleSchema.index({ workspaceId: 1, nom: 1 }, { unique: true });

const Role = models.Role || model("Role", RoleSchema);
export default Role;
