import { Schema, model, models } from "mongoose";

const FileStoreSchema = new Schema({
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  data: { type: String, required: true },
  size: { type: Number, required: true },
  workspaceId: { type: String, default: "" },
  uploadedBy: { type: String, default: "" },
}, { timestamps: true });

const FileStore = models.FileStore || model("FileStore", FileStoreSchema);

export default FileStore;
