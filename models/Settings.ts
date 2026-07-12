import { Schema, model, models } from "mongoose";

const SettingsSchema = new Schema(
  {
    nomAgence: { type: String, default: "AgencyFlow", trim: true },
    emailAgence: { type: String, default: "", trim: true, lowercase: true },
    telephoneAgence: { type: String, default: "" },
    logo: { type: String, default: "" },
    logoPublicId: { type: String, default: "" },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true, index: true },
  },
  { timestamps: true }
);

const Settings = models.Settings || model("Settings", SettingsSchema);

export { Settings };
export default Settings;
