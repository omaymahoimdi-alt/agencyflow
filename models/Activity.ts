import { Schema, model, models } from "mongoose";

const ActivitySchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    entityType: { type: String, required: true }, // client, project, task, team, document, comment
    entityId: { type: String, default: "" },
    entityName: { type: String, default: "" },
    action: { type: String, required: true }, // created, updated, deleted, completed, commented
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

ActivitySchema.index({ workspaceId: 1, createdAt: -1 });

const Activity = models.Activity || model("Activity", ActivitySchema);

export { Activity };
export default Activity;
