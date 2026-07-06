import { Schema, model, models } from "mongoose";

const AnalyticsSchema = new Schema(
  {
    portfolioId: {
      type: Schema.Types.ObjectId,
      ref: "Portfolio",
      required: true,
    },
    date: { type: String, required: true },
    views: { type: Number, default: 0 },
    country: { type: String, default: "", trim: true },
    device: { type: String, default: "desktop", trim: true },
    projectClicks: [{ type: Schema.Types.ObjectId, ref: "Project" }],
  },
  { timestamps: true }
);

const Analytics = models.Analytics || model("Analytics", AnalyticsSchema);

export { Analytics };
export default Analytics;
