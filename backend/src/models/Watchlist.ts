import { Schema, model, Document, Types } from 'mongoose';

export type WatchlistEntityType = 'product' | 'hashtag' | 'trend' | 'category';

export interface IWatchlistItem {
  entityType: WatchlistEntityType;
  entityName: string;
  addedAt: Date;
  note?: string;
}

export interface IWatchlist extends Document {
  userId: Types.ObjectId;
  name: string;
  items: IWatchlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const watchlistItemSchema = new Schema<IWatchlistItem>({
  entityType: {
    type: String,
    enum: ['product', 'hashtag', 'trend', 'category'],
    required: true,
  },
  entityName: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
  note: { type: String },
});

const watchlistSchema = new Schema<IWatchlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, default: 'Mi Watchlist' },
    items: [watchlistItemSchema],
  },
  { timestamps: true }
);

export const Watchlist = model<IWatchlist>('Watchlist', watchlistSchema);
