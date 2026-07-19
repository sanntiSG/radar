import { Router } from 'express';
import type { Response } from 'express';
import { Product, Signal } from '../models';
import { asyncHandler } from './helpers';

export const exportRouter = Router();

/** Escapado CSV RFC 4180 — sin dependencias. */
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) lines.push(row.map(csvCell).join(','));
  // BOM para que Excel abra UTF-8 con acentos correctos
  return '﻿' + lines.join('\r\n');
}

function sendCsv(res: Response, filename: string, csv: string) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

// GET /api/export/signals.csv
exportRouter.get(
  '/signals.csv',
  asyncHandler(async (_req, res) => {
    const signals = await Signal.find().sort({ radarScore: -1 }).limit(500);
    const csv = toCsv(
      ['Nombre', 'Tipo', 'Categoría', 'Radar Score', 'Crecimiento %', 'Confianza', 'Estado', 'Detectada', 'Predicción 7d', 'Explicación'],
      signals.map((s) => [
        s.name,
        s.entityType,
        s.category,
        s.radarScore,
        s.growthScore,
        s.confidence,
        s.status,
        s.detectedAt?.toISOString().slice(0, 10),
        s.predictions?.d7 ?? '',
        s.explanation,
      ])
    );
    sendCsv(res, 'radar-senales.csv', csv);
  })
);

// GET /api/export/products.csv
exportRouter.get(
  '/products.csv',
  asyncHandler(async (_req, res) => {
    const products = await Product.find().sort({ radarScore: -1 }).limit(500);
    const csv = toCsv(
      ['Producto', 'Categoría', 'Radar Score', 'Crecimiento %', 'Frecuencia', 'Variantes agrupadas', 'Fuentes', 'Primera vez visto', 'Última vez visto'],
      products.map((p) => [
        p.name,
        p.category,
        p.radarScore,
        p.growthPct,
        p.frequency,
        p.aliases.join(' | '),
        p.sources.join(' | '),
        p.firstSeenAt?.toISOString().slice(0, 10),
        p.lastSeenAt?.toISOString().slice(0, 10),
      ])
    );
    sendCsv(res, 'radar-productos.csv', csv);
  })
);
