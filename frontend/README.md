# frontend

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

Environment variables

Create a `.env` file in `frontend/` (or `.env.local`) to configure API and UI thresholds.

Required:

- VUE_APP_API_BASE_URL: Backend base URL (e.g. http://localhost:3000)

Optional:

- VUE_PING_LOSS_THRESHOLD: Loss threshold (%) used in the device events chart (default 10)

Example `.env.local`:

VUE_APP_API_BASE_URL=http://localhost:3000
VUE_PING_LOSS_THRESHOLD=10
