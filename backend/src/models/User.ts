import { Schema, model, Document } from 'mongoose';

export type UserPlan = 'free' | 'pro';

export interface IUser extends Document {
  email: string;
  name: string;
  avatar?: string;
  googleId?: string;
  plan: UserPlan;
  signalsViewedToday: number;
  lastSignalResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    avatar: { type: String },
    googleId: { type: String, index: true, sparse: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    signalsViewedToday: { type: Number, default: 0 },
    lastSignalResetAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
