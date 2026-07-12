import { Schema, model, models } from "mongoose";

const WorkspaceSchema = new Schema(
  {
    nom: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, default: "" },
    logo: { type: String, default: "" },
  },
  { timestamps: true }
);

const Workspace = models.Workspace || model("Workspace", WorkspaceSchema);
export default Workspace;
