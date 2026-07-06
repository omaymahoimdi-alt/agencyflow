import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema(
  {
    expediteurId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    destinataireId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contenu: { type: String, required: true, trim: true },
    dateEnvoi: { type: Date, default: Date.now },
    lu: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = models.Message || model("Message", MessageSchema);

export { Message };
export default Message;
