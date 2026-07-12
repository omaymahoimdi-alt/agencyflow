import { Schema, model, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true }, // activity, mention, invitation, task_assigned, comment
    title: { type: String, required: true },
    message: { type: String, default: "" },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false },
    entityType: { type: String, default: "" },
    entityId: { type: String, default: "" },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User" },
    fromUserName: { type: String, default: "" },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = models.Notification || model("Notification", NotificationSchema);

export { Notification };
export default Notification;
