# Radar

Plataforma SaaS de **detección temprana de señales de mercado** para ecommerce, emprendedores, dropshippers, marketers y agencias.

Radar no promete productos ganadores ni predice el futuro: identifica **señales tempranas, anomalías, aceleraciones y patrones emergentes** en el mercado digital mediante análisis matemático sobre históricos propios.

## Estructura

```
radar/
  backend/    Express + TypeScript + Mongoose + node-cron (API :4000)
  frontend/   Next.js 14 + TailwindCSS + GSAP (:3000)
```

## Arranque rápido

### Backend

```bash
cd backend
cp .env.example .env    # completar MONGODB_URI (MongoDB Atlas)
npm install
npm run seed            # poblar la BD con señales realistas
npm run backfill        # histórico de 14 días desde Google Trends
npm run dev             # http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                  # http://localhost:3000
```

## Fuentes de datos (100% gratuitas)

- **Reddit** — endpoints públicos `.json` (credenciales opcionales para mayor rate limit)
- **Google Trends** — interés histórico y backfill
- **RSS** — blogs de ecommerce y noticias del sector

## Arquitectura

```
Fuentes → Adaptadores → Cache inteligente → MongoDB → Snapshots históricos
       → Signal Engine → Motor matemático → Predicciones → Radar Score → Dashboard
```

El motor es **matemático puro** (sin IA de pago): growth velocity, aceleración,
Z-Score/IQR, SMA/EMA, momentum, regresión lineal y suavizado exponencial.

## Funcionalidades

**Retención (Fase 3):** explicación del "por qué" de cada señal (factores con
contribución normalizada), Radar Personal (país/nichos/plataformas/keywords),
descubrimiento de oportunidades tempranas, Asistente en lenguaje natural sobre
datos propios, Radar Diario con racha de actividad, watchlists inteligentes
con alertas configurables, logros dinámicos.

**Confianza (Fase 4):** Centro de Evidencias por señal (timeline anotado desde
la detección, Radar Score explicado con cambio vs. ayer, validación por
fuentes), Índice de Precisión (backtest honesto sobre el histórico propio, con
disclaimer explícito), Asistente v2 (rankings por categoría, comparaciones
directas, ventana temporal y geo transparentes), Radar Personal enriquecido
(nivel de experiencia, objetivos, marketplaces — con adaptación real de copy),
Radar Diario v2 (cambios vs. ayer, filtros por nicho/plataforma/país,
hashtags y productos emergentes), niveles de gamificación (Explorador →
Analista → Experto) sobre actividad real.

Todo funciona sin IA de pago ni servicios con límite de tokens — el núcleo es
matemático y determinista sobre el histórico propio de Radar.

## Tests

```bash
cd backend && npm test
```
