# Radar 🎯

**Plataforma de Detección Temprana de Señales de Mercado para Ecommerce**

Radar detecta señales emergentes antes de que se conviertan en tendencias conocidas. No prometemos productos ganadores — detectamos señales, tú decides.

---

## Estructura

```
radar/
  frontend/   Next.js + TypeScript + TailwindCSS + GSAP
  backend/    Express + TypeScript + MongoDB + node-cron
```

## Setup rápido

### Backend

```bash
cd backend
cp .env.example .env
# Completar credenciales en .env
npm install
npm run seed       # Poblar BD con datos seed realistas
npm run backfill   # Backfill de histórico (Google Trends + Reddit)
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Verificar NEXT_PUBLIC_API_URL en .env.local
npm install
npm run dev
```

---

## Variables de entorno

### backend/.env
| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | URI de conexión a MongoDB Atlas |
| `PORT` | Puerto del servidor (default: 4000) |
| `FRONTEND_URL` | URL del frontend para CORS |
| `REDDIT_CLIENT_ID` | Client ID de tu Reddit App |
| `REDDIT_CLIENT_SECRET` | Client Secret de tu Reddit App |
| `REDDIT_USER_AGENT` | User agent para la API de Reddit |

### frontend/.env.local
| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL del backend (default: http://localhost:4000) |

---

## Stack

- **Frontend:** Next.js 14 (App Router) · React · TypeScript · TailwindCSS · GSAP
- **Backend:** Node.js · Express · TypeScript · Mongoose
- **Base de datos:** MongoDB Atlas
- **Fuentes de datos:** Reddit API · Google Trends
- **Jobs:** node-cron
- **Deploy:** Netlify (frontend) · Render (backend) · MongoDB Atlas

---

## Arquitectura

```
Fuentes (Reddit, Google Trends)
   ↓  Adaptadores independientes
   ↓  Cache inteligente
   ↓  MongoDB (snapshots históricos)
   ↓  Signal Engine
   ↓  Motor Matemático (velocity · acceleration · z-score · momentum · predicción)
   ↓  Radar Score (0-100)
   ↓  API REST → Dashboard
```

---

*Radar — Detecta señales. Tú decides.*
