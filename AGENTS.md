<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Proyecto: GOXT CRM Frontend

## Contexto
Frontend CRM construido desde cero. El objetivo es **aprender haciendo** — estructura limpia, código ordenado y fluido. No se busca velocidad sino comprensión y buenas prácticas. UI-first, sin conexión al backend todavía.

## Stack
- **Next.js 15** App Router con route groups: `(auth)`, `(onboarding)`
- **shadcn/ui** estilo `base-nova` — usa `@base-ui/react` como primitiva (NO radix-ui)
- **React Hook Form + Zod** para formularios y validación
- **Tailwind CSS v4** / **TypeScript**

## Reglas

### Componentes
- Primitivas shadcn en minúscula (`button.tsx`). Componentes propios en PascalCase (`LoginForm.tsx`)
- Separar por responsabilidad: cada página tiene su componente padre y subcomponentes
- No crear abstracciones si algo se usa una sola vez

### Formularios
- Siempre `type="submit"` en botones de envío — `@base-ui/react` Button defaultea a `type="button"`
- Validación con Zod + `zodResolver`, errores inline bajo cada campo
- `useForm` directo, sin wrapper de shadcn Form

### Selectores
- Listas largas (países, timezones): `SearchableSelect` propio en `src/components/ui/searchable-select.tsx` con dropdown `position: fixed` para no interferir con contenedores overflow
- Listas cortas: `Select` de shadcn

### Layout
- Auth: `grid-cols-2` — imagen izquierda, form derecho
- Onboarding: `grid-cols-[2fr_3fr]` — imagen izquierda, card derecha con stepper interno y altura fija (`h-145`)
- Raíz con `h-screen overflow-hidden`, scroll interno donde se necesite

### Estilo
- Sin comentarios obvios. Sin abstracciones prematuras. Sin emojis salvo que el usuario los pida.

## Estructura actual
```
src/
├── app/
│   ├── (auth)/        → login, signup, recovery-password, reset-password
│   ├── (onboarding)/  → create-workspace
│   └── page.tsx       → redirect a /login
├── components/
│   ├── auth/          → Login, Signup, LoginForm, SignupForm, VerifyOTP, RecoveryPassword, ResetPassword, Testimonials, Icons
│   ├── onboarding/    → CreateWorkspace, CreateWorkspaceForm, InviteTeamForm
│   └── ui/            → primitivas shadcn + SearchableSelect propio
```

## Trampas conocidas
- `ComboboxCollection` de base-ui espera render function, no array — no usarlo con `.map()` directo
- `overflow-y-auto` en el contenedor padre clipea dropdowns `absolute` — el `SearchableSelect` usa `fixed` para evitarlo
- No mezclar radix-ui con base-ui
