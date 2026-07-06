import { Schema, model, models } from "mongoose";

const InvitationSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true },
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    role: { type: String, required: true },
    equipe: { type: String, default: "" },
    invitePar: { type: String, required: true },
    statut: {
      type: String,
      enum: ["En attente", "Acceptée", "Expirée", "Annulée"],
      default: "En attente",
    },
    expiration: { type: Date, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

InvitationSchema.index({ token: 1 }, { unique: true });
InvitationSchema.index({ email: 1, statut: 1 });

const Invitation = models.Invitation || model("Invitation", InvitationSchema);
export default Invitation;
