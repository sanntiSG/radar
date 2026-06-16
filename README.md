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

### Credenciales de Reddit — ⚠️ App tipo "script" (NO Devvit)

> Devvit es para apps que corren **dentro** de Reddit. Radar es un backend externo que solo **lee** datos públicos — necesita una app tipo **"script"** distinta.

**Paso a paso:**
1. Ir a **https://www.reddit.com/prefs/apps** (logueado con tu cuenta de Reddit)
2. Hacer click en **"create another app..."** al final de la página
3. Elegir tipo **`script`**
4. Nombre: `radar` · redirect uri: `http://localhost:4000` (obligatorio aunque no se usa)
5. Click **"create app"**
6. **`client_id`** = string corto debajo del nombre (a la izquierda, bajo "personal use script")
7. **`client_secret`** = campo "secret" visible en la misma pantalla
8. **`username`/`password`** = tu propia cuenta de Reddit (quedan solo en `.env` local)

### backend/.env
| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | URI de conexión a MongoDB Atlas |
| `PORT` | Puerto del servidor (default: 4000) |
| `FRONTEND_URL` | URL del frontend para CORS |
| `REDDIT_CLIENT_ID` | Client ID de tu Reddit App (paso 6) |
| `REDDIT_CLIENT_SECRET` | Client Secret de tu Reddit App (paso 7) |
| `REDDIT_USERNAME` | Tu usuario de Reddit |
| `REDDIT_PASSWORD` | Tu contraseña de Reddit |
| `REDDIT_USER_AGENT` | `radar:v0.1.0 (by /u/TU_USUARIO)` |

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
