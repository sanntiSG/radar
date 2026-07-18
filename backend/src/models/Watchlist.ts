import { Schema, model, type InferSchemaType } from 'mongoose';

const watchlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    items: [
      {
        entityType: {
          type: String,
          enum: ['trend', 'hashtag', 'product', 'category', 'signal'],
          required: true,
        },
        slug: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export type WatchlistDoc = InferSchemaType<typeof watchlistSchema>;
export const Watchlist = model('Watchlist', watchlistSchema);
