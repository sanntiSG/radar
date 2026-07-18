import { Schema, model, type InferSchemaType } from 'mongoose';

/** Historial de ejecuciones de cada adaptador — alimenta el apartado Fuentes. */
const jobRunSchema = new Schema(
  {
    adapter: { type: String, required: true, index: true },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, default: null },
    itemsFetched: { type: Number, default: 0 },
    newItems: { type: Number, default: 0 },
    status: { type: String, enum: ['ok', 'error'], default: 'ok' },
    error: { type: String, default: '' },
  },
  { timestamps: true }
);

jobRunSchema.index({ adapter: 1, startedAt: -1 });

export type JobRunDoc = InferSchemaType<typeof jobRunSchema>;
export const JobRun = model('JobRun', jobRunSchema);
