import { Schema, model, models } from "mongoose";

const ClientSchema = new Schema(
  {
    nomSociete: { type: String, required: true, trim: true },
    responsable: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    telephone: { type: String, default: "" },
    adresse: { type: String, default: "" },
    secteurActivite: { type: String, default: "" },
    budget: { type: Number, default: 0 },
    dateCreation: { type: Date, default: Date.now },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  },
  { timestamps: true }
);

const Client = models.Client || model("Client", ClientSchema);

export { Client };
export default Client;
