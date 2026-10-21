# Frontend SICPF

Interfaz general de gestión farmacéutica construida con React, TypeScript y Vite.

## Desarrollo local

Requiere Node.js y npm. Desde este directorio:

```sh
npm ci
npm run dev
```

Configure `VITE_API_URL` en un archivo `.env` para apuntar a su backend. Sin esa variable, se utiliza `http://127.0.0.1:8000/api`. El archivo `.env.production.example` es una referencia de despliegue; sustituya su URL por la de su instalación.

## Verificación

```sh
npm test -- --runInBand
npm run build
```

## Identidad e impresión

SICPF es la identidad del proyecto. Los datos del negocio se obtienen de `/api/negocio/` y se administran en Django Admin; consulte la [guía del backend](../backend/README.md).

Cuando falten nombre comercial, razón social, RUC o dirección, se genera un ticket de demostración sin validez tributaria. Si la API falla, se utiliza la configuración neutral de SICPF. Los tickets de demostración omiten logo empresarial, identificación, sede, URL de consulta y QR tributario. Los importes, productos y métodos de pago se mantienen.
