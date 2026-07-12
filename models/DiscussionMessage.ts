import { Schema, model, models } from "mongoose";

const DiscussionMessageSchema = new Schema(
  {
    channelId: { type: String, required: true },
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    userAvatar: { type: String, default: "" },
    content: { type: String, required: true },
    time: { type: String, default: "" },
    reactions: [{ emoji: String, users: [String] }],
    pinned: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    parentId: { type: String, default: undefined },
    attachments: [{ type: Schema.Types.Mixed }],
    mentions: [{ type: String }],
  },
  { timestamps: true }
);

DiscussionMessageSchema.index({ projectId: 1, channelId: 1, time: 1 });

const DiscussionMessage = models.DiscussionMessage || model("DiscussionMessage", DiscussionMessageSchema);

export { DiscussionMessage };
export default DiscussionMessage;
