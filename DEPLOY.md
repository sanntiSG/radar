# Deploy de Radar — guía paso a paso

Los tres servicios son gratuitos: MongoDB Atlas (M0), Render (free) y Netlify (free).

## 1. MongoDB Atlas (base de datos)

1. Crea un cluster M0 gratuito en https://cloud.mongodb.com.
2. En **Database Access** crea un usuario con contraseña.
3. En **Network Access** agrega `0.0.0.0/0` (necesario para Render).
4. Copia la cadena de conexión (`mongodb+srv://usuario:password@cluster...mongodb.net/radar`).
5. Pégala en `backend/.env` como `MONGODB_URI` (local) — la usarás también en Render.

Luego, en local, puebla la base:

```bash
cd backend
npm run seed       # señales realistas al instante
npm run backfill   # 14 días de interés real desde Google Trends
```

## 2. Render (backend)

1. https://dashboard.render.com → **New → Blueprint** → conecta `sanntiSG/radar`.
   Render detecta `render.yaml` automáticamente.
2. Completa las variables marcadas como secretas:
   - `MONGODB_URI` → la cadena de Atlas.
   - `CORS_ORIGIN` → la URL de Netlify (puedes ponerla después del paso 3).
   - `GOOGLE_CLIENT_ID` → tu Client ID de Google OAuth (el `JWT_SECRET` lo
     genera Render automáticamente).
3. Deploy. Verifica `https://<tu-servicio>.onrender.com/health`.

> Nota del plan free: el servicio "duerme" tras 15 min sin tráfico y la primera
> petición tarda ~30 s en despertarlo. Los cron jobs solo corren mientras está
> despierto; el seed/backfill garantiza que siempre haya datos que mostrar.

## 3. Netlify (frontend)

1. https://app.netlify.com → **Add new site → Import an existing project** → `sanntiSG/radar`.
   Netlify detecta `netlify.toml` (base `frontend/`).
2. En **Site configuration → Environment variables** agrega:
   - `NEXT_PUBLIC_API_URL` = URL del backend en Render (sin barra final).
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = el mismo Client ID de Google del backend.
3. En Google Cloud Console → tu OAuth Client → **Authorized JavaScript origins**,
   agrega `http://localhost:3000` y la URL de Netlify (necesario para que el
   botón de Google funcione en cada dominio).
4. Deploy. Abre la URL y verifica que el dashboard muestre señales.
5. Vuelve a Render y ajusta `CORS_ORIGIN` con la URL final de Netlify.

## Checklist final

- [ ] `https://<render>/health` responde `{ status: "ok", db: "connected" }`
- [ ] `https://<render>/api/signals` devuelve señales
- [ ] El dashboard de Netlify lista señales y abre el detalle con chart
- [ ] `CORS_ORIGIN` en Render apunta exactamente a la URL de Netlify
- [ ] El login demo funciona; el botón de Google aparece si configuraste los Client ID
