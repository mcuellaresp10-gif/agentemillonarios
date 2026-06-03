# Netlify sin datos — solución

Síntoma: la web carga (splash, menú) pero todo está en 0 / vacío.

Causa: Netlify **no tiene backend**. Las llamadas a `/api/...` deben reenviarse a **Render**.

## Checklist

### 1. API en Render (obligatorio)

Crea un **Web Service** en [render.com](https://render.com) con el mismo repo de GitHub:

| Campo | Valor |
|-------|--------|
| Build Command | `npm install --include=dev` |
| Start Command | `npm run start:api` |

Variables en **Render**:

| Variable | Valor |
|----------|--------|
| `NODE_ENV` | `production` |
| `API_ONLY` | `true` |
| `API_FOOTBALL_KEY` | tu clave |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` |
| `APP_URL` | `https://millonarioscout.netlify.app` |

Copia la URL de Render, ej. `https://agentemillonarios.onrender.com`.

Prueba en el navegador:

`https://TU-API.onrender.com/api/market/status`

Debe verse **JSON**, no HTML.

### 2. Variable en Netlify (obligatorio)

[app.netlify.com](https://app.netlify.com) → tu sitio → **Site configuration** → **Environment variables**

| Key | Value |
|-----|--------|
| `NETLIFY_BACKEND_URL` | `https://TU-API.onrender.com` (sin `/` al final) |

### 3. Redeploy en Netlify

**Deploys** → **Trigger deploy** → **Deploy site**.

En el log de build debe aparecer:

```text
[netlify] Proxy /api/* → https://TU-API.onrender.com/api/*
```

### 4. Comprobar

Abre:

`https://millonarioscout.netlify.app/api/market/status`

- **Bien:** JSON (`configured`, etc.)
- **Mal:** página de la app → falta `NETLIFY_BACKEND_URL` o no redeployaste

---

## Alternativa más simple

Un solo servicio en Render (sin Netlify):

- Build: `npm install --include=dev && npm run build`
- Start: `npm run start:prod`
- Sin `API_ONLY`
- Puedes apuntar un dominio custom a Render
