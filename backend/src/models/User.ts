import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    googleId: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
