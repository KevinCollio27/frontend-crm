# No subir aún — Mercado Pago / Billing

Integración de Mercado Pago en desarrollo, todavía no lista para prod. Mientras siga así, estos archivos **no se agregan a ningún commit**:

- `src/components/settings/billing/BillingPanel.tsx` *(modificado — la versión commiteada en `dev` es un stub de tarjeta mockeado, sin dependencias reales. No subir los cambios locales.)*
- `src/services/billing.service.ts` *(nuevo)*
- `src/types/billing.ts` *(nuevo)*

Nadie más en el repo importa `billing.service.ts` ni `types/billing.ts` todavía, así que dejarlos afuera no rompe nada — `dev` se queda con el stub actual de `BillingPanel.tsx`.

## Al hacer commit

```
git add <todo lo demás, sin tocar los 3 archivos de arriba>
```

Cuando Mercado Pago esté listo para subir, borra este archivo.
