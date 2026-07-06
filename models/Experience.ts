import { Schema, model, models } from "mongoose";

const ExperienceSchema = new Schema(
  {
    portfolioId: {
      type: Schema.Types.ObjectId,
      ref: "Portfolio",
      required: true,
    },
    type: { type: String, enum: ["work", "education"], default: "work" },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, default: "" },
    current: { type: Boolean, default: false },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const Experience = models.Experience || model("Experience", ExperienceSchema);

export { Experience };
export default Experience;
