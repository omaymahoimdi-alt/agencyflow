import { Schema, model, models } from "mongoose";

const CommentSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, default: "" },
    entityType: { type: String, required: true }, // project, task, client
    entityId: { type: String, required: true },
    content: { type: String, required: true },
    mentions: [{ type: String }],
  },
  { timestamps: true }
);

CommentSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const Comment = models.Comment || model("Comment", CommentSchema);

export { Comment };
export default Comment;
