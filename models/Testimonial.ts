import { Schema, model, models } from "mongoose";

const TestimonialSchema = new Schema(
  {
    portfolioId: {
      type: Schema.Types.ObjectId,
      ref: "Portfolio",
      required: true,
    },
    authorName: { type: String, required: true, trim: true },
    authorJob: { type: String, default: "", trim: true },
    authorAvatar: { type: String, default: "" },
    content: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Testimonial = models.Testimonial || model("Testimonial", TestimonialSchema);

export { Testimonial };
export default Testimonial;
