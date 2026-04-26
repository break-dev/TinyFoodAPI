# TinyFood API

> **Para IA del IDE:** Lee este documento completo antes de generar o sugerir cualquier código. Contiene las reglas, arquitectura, modelos de datos y convenciones estrictas de este proyecto.

## 1. Contexto del Negocio

**Objetivo:** Backend de alto rendimiento para la app móvil TinyFood. Gestiona el ciclo de vida de los alimentos y la salud del usuario mediante IA.

**Flujo principal:**
1. El cliente móvil conecta vía WebSocket.
2. Se autentica mediante el JWT de Supabase (validado en el `AuthGuard`).
3. Envía eventos (`auth:autenticar`, `home:analyze_image`, etc.).
4. La API procesa, persiste en PostgreSQL (Supabase) y responde mediante un callback (Acknowledgement).

---

## 2. Stack Tecnológico

| Herramienta        | Versión  | Uso                                                |
| ------------------ | -------- | -------------------------------------------------- |
| NestJS             | ^11.0.1  | Framework principal                                |
| TypeScript         | ^5.7.3   | Tipado estricto obligatorio                        |
| Socket.IO          | ^4.8.3   | Motor de comunicación bidireccional                |
| Prisma ORM         | ^6.4.1   | Gestión de Base de Datos (PostgreSQL)              |
| @supabase/supabase | ^2.62.2  | Validación de sesiones y acceso a storage          |
| @google/genai      | ^1.49.0  | Integración con IA Gemini 2.0                      |

---

## 3. Arquitectura de Comunicación (WebSockets Core)

Hemos implementado un sistema de **Puente Centralizado** para máxima seguridad y orden:

### 3.1 `PrivateGateway` (`src/common/presentation/gateways`)
Es el único punto de entrada para eventos privados. 
- Usa un listener `onAny` para capturar todos los eventos.
- Valida manualmente el token JWT mediante `AuthGuard.verify`.
- Inyecta el `usuario` de la base de datos directamente en el objeto `client`.
- Soporta **Acknowledgements** (callbacks): si el cliente envía una función de respuesta, la API la ejecuta.

### 3.2 `Dispatcher` (`src/common/presentation/dispatcher.ts`)
Actúa como el "router" de los eventos WebSocket.
- Registra handlers de forma estática.
- Busca el handler correspondiente al nombre del evento (ej: `auth:autenticar`) y lo ejecuta.

---

## 4. Estructura de Módulos (Clean Architecture)

```
src/modules/<modulo>/
  presentation/ ← Registro de eventos en el Dispatcher (ej. auth.gateway.ts)
  logic/        ← Casos de Uso (ej. autenticar.uc.ts)
  data/         ← Repositorios con Prisma (ej. auth.data.ts)
```

---

## 5. Base de Datos (Prisma & Supabase)

### 5.1 Esquema Multi-archivo
Usamos `prisma/schema/*.prisma` para mantener el orden. Los modelos principales son:
- **Usuario:** Almacena peso, talla, y arreglos nativos de Postgres (`String[]`) para `alimentos_prohibidos` y `preferencias`.
- **Comida:** Almacena el inventario con fechas de vencimiento estimadas.

### 5.2 Tipos de Datos Especiales
- **Arrays:** Usamos `String[]` para tags y preferencias (mapeados a `text[]` en Postgres).
- **JSONB:** Usamos `Json?` para `informacion_medica`, permitiendo estructuras flexibles.

---

## 6. Seguridad (AuthGuard)

El `AuthGuard.ts` utiliza el SDK oficial de Supabase para verificar los tokens:
1. Recibe el token del payload o del handshake.
2. Llama a `supabase.auth.getUser(token)`.
3. Si el usuario existe en Supabase pero no en nuestra BD local, permite el evento `auth:registrar` pero bloquea los demás.

---

## 7. Convenciones de Respuesta (`ApiResponse`)

Todas las respuestas deben seguir esta estructura:
```typescript
{
  success: boolean;
  data: any | null;
  message: string | null;
}
```

---

## 8. Scripts de Desarrollo

- `npm run start:dev`: Inicia la API en modo watch (Escucha en `0.0.0.0:3000`).
- `npx prisma generate`: Genera el cliente de Prisma tras cambios en el schema.
- `npx prisma db push`: Sincroniza el schema con Supabase.

---

## 9. Variables de Entorno (.env)

```env
PORT=3000
SUPABASE_URL=...
SUPABASE_KEY=... # Publishable key
SUPABASE_SERVICE_ROLE_KEY=... # Para bypass de RLS
DATABASE_URL=... # URL de conexión directa o pooler
GEMINI_API_KEY=...
```
