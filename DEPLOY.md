# Publicar en GitHub + Netlify

Esta app tiene **dos partes**:

| Parte | Qué es | Dónde desplegar |
|-------|--------|-----------------|
| **Frontend** | React (carpeta `dist/`) | **Netlify** |
| **API** | Express (`/api/football`, IA, mercado) | **Render** (gratis) u otro Node |

Netlify solo sirve archivos estáticos. El proxy de API-Football y OpenRouter **deben** correr en un servidor Node. Netlify reenvía `/api/*` a ese backend (misma URL para el navegador → las cookies de acceso funcionan).

---

## 1. Subir a GitHub

1. Crea un repositorio vacío en [github.com/new](https://github.com/new) (sin README si ya tienes uno local).

2. En la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Millonarios Analytics: app inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

**No subas** `.env` (ya está en `.gitignore`). Solo secretos en el panel de Netlify/Render.

---

## 2. API en Render (primero)

1. [render.com](https://render.com) → **New** → **Blueprint** o **Web Service**.
2. Conecta el repo de GitHub.
3. Si usas **Blueprint**, Render lee [`render.yaml`](render.yaml).
4. Si es manual:
   - **Build command:** `npm install`
   - **Start command:** `npm run start:api`
   - **Environment:** `API_ONLY=true`, `NODE_ENV=production`
5. Variables de entorno (obligatorias):

| Variable | Valor |
|----------|--------|
| `API_FOOTBALL_KEY` | Tu clave API-Football |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` |
| `APP_URL` | La pondrás después: URL de Netlify (`https://xxx.netlify.app`) |
| `API_ONLY` | `true` |

Opcionales: `APIFY_TOKEN`, `REQUIRE_ACCESS_CODE`, `APP_ACCESS_SECRET`, `API_FOOTBALL_DAILY_LIMIT`.

6. Despliega y copia la URL pública, por ejemplo:  
   `https://millonarios-api.onrender.com`

---

## 3. Frontend en Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**.
2. Elige el mismo repositorio.
3. Netlify detecta [`netlify.toml`](netlify.toml):
   - **Build command:** `npm run build:netlify`
   - **Publish directory:** `dist`
4. Variable de entorno en Netlify:

| Variable | Valor |
|----------|--------|
| `NETLIFY_BACKEND_URL` | URL de Render **sin** barra final, ej. `https://millonarios-api.onrender.com` |

5. **Deploy site**.

6. Copia la URL de Netlify, ej. `https://millonarios-analytics.netlify.app`.

7. Vuelve a **Render** y actualiza `APP_URL` con esa URL de Netlify → **Redeploy** el servicio API (para CORS).

8. En Netlify, **Trigger deploy** otra vez si cambiaste `NETLIFY_BACKEND_URL`.

---

## 4. Código de acceso (opcional)

En **Render** (API):

```env
REQUIRE_ACCESS_CODE=true
APP_ACCESS_SECRET=un-texto-largo-secreto
```

Comparte ese secreto solo con testers. No lo pongas en Netlify (solo en Render).

---

## 5. Comprobar

- Abre la URL de Netlify → Dashboard carga datos.
- Scouting → equipos y búsqueda.
- Análisis IA → genera texto (si `OPENROUTER_API_KEY` está en Render).

Si `/api` falla: revisa `NETLIFY_BACKEND_URL` y que Render esté **Live**.

---

## Alternativa: todo en un solo servicio

Si prefieres **no** usar Netlify:

```bash
npm run build
NODE_ENV=production npm run start:prod
```

Un solo deploy en Render/Railway/Fly con `start:prod` (sin `API_ONLY`) sirve frontend + API en la misma URL. Más simple; Netlify solo tiene sentido si quieres CDN del frontend.

---

## Resumen de variables

| Dónde | Variables |
|-------|-----------|
| **Render** | `API_FOOTBALL_KEY`, `OPENROUTER_API_KEY`, `APP_URL` (= Netlify), `API_ONLY=true`, opcionales seguridad/TM |
| **Netlify** | `NETLIFY_BACKEND_URL` (= Render) |
