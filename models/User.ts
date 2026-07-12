import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "ChefProjet", "Développeur", "Designer", "Client"],
      default: "Développeur",
    },
    telephone: { type: String, default: "" },
    photo: { type: String, default: "" },
    dateEmbauche: { type: Date, default: Date.now },
    activeWorkspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", default: null },
  },
  { timestamps: true }
);

// Virtual for full name
UserSchema.virtual("name").get(function () {
  return `${this.prenom} ${this.nom}`;
});

const User = models.User || model("User", UserSchema);

export { User };
export default User;
