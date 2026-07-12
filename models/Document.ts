import { Schema, model, models } from "mongoose";

const DocumentSchema = new Schema(
  {
    nomFichier: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["PDF", "Image", "Word", "Excel", "ZIP", "Autre"],
      default: "Autre",
    },
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    dateUpload: { type: Date, default: Date.now },
    projetId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  },
  { timestamps: true }
);

const Document = models.Document || model("Document", DocumentSchema);

export { Document };
export default Document;
