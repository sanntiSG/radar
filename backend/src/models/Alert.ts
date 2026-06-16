import { Schema, model, Document, Types } from 'mongoose';

export type AlertTrigger = 'radar_score' | 'new_outlier' | 'acceleration';

export interface IAlert extends Document {
  userId: Types.ObjectId;
  entityType: string;
  entityName: string;
  trigger: AlertTrigger;
  threshold: number;
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entityType: { type: String, required: true },
    entityName: { type: String, required: true },
    trigger: {
      type: String,
      enum: ['radar_score', 'new_outlier', 'acceleration'],
      required: true,
    },
    threshold: { type: Number, default: 70 },
    isActive: { type: Boolean, default: true },
    lastTriggeredAt: { type: Date },
  },
  { timestamps: true }
);

export const Alert = model<IAlert>('Alert', alertSchema);
