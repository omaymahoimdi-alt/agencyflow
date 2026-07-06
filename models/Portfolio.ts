import { Schema, model, models } from "mongoose";

const PortfolioSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    bio: { type: String, default: "" },
    theme: { type: String, default: "light", trim: true },
    primaryColor: { type: String, default: "#6366f1" },
    isPublished: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Portfolio = models.Portfolio || model("Portfolio", PortfolioSchema);

export { Portfolio };
export default Portfolio;
