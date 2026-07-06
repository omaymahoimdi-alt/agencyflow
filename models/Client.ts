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
    dateCreation: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

const Client = models.Client || model("Client", ClientSchema);

export { Client };
export default Client;
