import { Schema, model, type InferSchemaType } from 'mongoose';

const alertSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      enum: ['radar_score', 'outlier', 'acceleration'],
      required: true,
    },
    entityType: {
      type: String,
      enum: ['trend', 'hashtag', 'product', 'category', 'signal'],
      required: true,
    },
    slug: { type: String, required: true },
    message: { type: String, required: true },
    value: { type: Number, default: 0 },
    threshold: { type: Number, default: 0 },
    seen: { type: Boolean, default: false },
    triggeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

alertSchema.index({ triggeredAt: -1 });

export type AlertDoc = InferSchemaType<typeof alertSchema>;
export const Alert = model('Alert', alertSchema);
