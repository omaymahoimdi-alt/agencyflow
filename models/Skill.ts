import { Schema, model, models } from "mongoose";

const SkillSchema = new Schema(
  {
    portfolioId: {
      type: Schema.Types.ObjectId,
      ref: "Portfolio",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "Frontend", trim: true },
    level: { type: Number, min: 0, max: 100, default: 50 },
    icon: { type: String, default: "" },
  },
  { timestamps: true }
);

const Skill = models.Skill || model("Skill", SkillSchema);

export { Skill };
export default Skill;
