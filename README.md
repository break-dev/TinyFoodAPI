# TinyFood API

> **Para IA del IDE:** Lee este documento completo antes de generar o sugerir cualquier código. Contiene las reglas, arquitectura, modelos de datos y convenciones estrictas de este proyecto.

## 1. Contexto del Negocio

**Objetivo:** Backend de alto rendimiento para la app móvil TinyFood. Reduce el desperdicio de alimentos en el hogar mediante análisis de imágenes por IA y gestión de salud del usuario.

**Flujo principal:**

```
Cliente móvil conecta via WebSocket
  → Emite evento con imagen en base64
    → API consulta Gemini (Google GenAI) para identificar alimentos
      → Gemini devuelve JSON estructurado { name, category, quantity }[]
        → API persiste el registro en Supabase (PostgreSQL)
          → API emite respuesta al cliente via WS
```

**Puerto por defecto:** `3000`  
**URL local:** `http://localhost:3000`

---

## 2. Stack Tecnológico

| Herramienta                | Versión       | Uso                                                |
| -------------------------- | ------------- | -------------------------------------------------- |
| NestJS                     | ^11.0.1       | Framework principal                                |
| TypeScript                 | ^5.7.3        | **Obligatorio** en todo el proyecto                |
| Socket.IO                  | ^4.8.3        | Transport de WebSockets                            |
| @nestjs/websockets         | ^11.1.18      | Decoradores e integración WS con NestJS            |
| @nestjs/platform-socket.io | ^11.1.18      | Adaptador de Socket.IO                             |
| @supabase/supabase-js      | ^2.103.0      | Cliente de base de datos (PostgreSQL via Supabase) |
| @google/genai              | ^1.49.0       | SDK de Google Gemini                               |
| @nestjs/config             | ^4.0.4        | Gestión de variables de entorno                    |
| body-parser                | (via express) | Payloads hasta 20MB (para imágenes base64)         |

**Scripts disponibles:**

```bash
npm run start:dev   # Modo desarrollo con hot-reload (watch)
npm run start       # Producción sin watch
npm run build       # Compila TypeScript a dist/
npm run start:prod  # Ejecuta desde dist/ (post-build)
npm run format      # Prettier sobre src/**/*.ts
npm run lint        # ESLint con auto-fix
```

---

## 3. Variables de Entorno

Copia `.env.example` a `.env` y completa los valores:

```env
# Supabase
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_KEY="tu-anon-key"                        # Usada en WsAuthGuard para validar tokens
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"   # Usada en AuthService para upserts bypassando RLS

# Google Gemini
GEMINI_API_KEY="tu-api-key-de-gemini"

# Puerto (opcional, default: 3000)
PORT=3000
```

> `ConfigModule.forRoot({ isGlobal: true })` hace que estas variables estén disponibles en cualquier módulo vía `ConfigService`.

---

## 4. Arquitectura de la API (Obligatoria)

La API está organizada en **módulos** dentro de `src/modules/`. La comunicación cliente-servidor es **100% WebSockets** salvo integraciones de terceros que requieran webhooks HTTP.

### Capas dentro de cada módulo

```
src/modules/<modulo>/
  presentation/      ← Gateways WS (punto de entrada)
  logic/             ← Casos de uso / reglas de negocio
  service/           ← Integraciones externas (Gemini, OAuth, etc.)
  data/              ← Repositorios (consultas a Supabase)
```

#### Capa Presentation — Gateways

- **Responsabilidad:** Puerta de entrada WS. Recibe eventos, aplica Guards y Filters, y retorna la respuesta al cliente.
- **Regla:** Solo se comunica con la capa Logic (o Service cuando aún no hay lógica compleja). No contiene reglas de negocio.
- Decoradores clave: `@WebSocketGateway`, `@SubscribeMessage`, `@UseGuards`, `@UseFilters`.
- Toda respuesta debe usar `ApiResponse.success(data, msg)` o `ApiResponse.error(msg)`.

**Ejemplo actual:** `src/modules/main/pantry.gateway.ts`

```typescript
@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(WsExceptionFilter)
export class PantryGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('pantry:analyze_image')
  async handleAnalyzeImage(
    client: Socket,
    payload: { imageBase64: string; token: string },
  ): Promise<ApiResponse> {
    const result = await this.pantryService.analyzeFoodImage(
      payload.imageBase64,
    );
    return ApiResponse.success(result, 'Imagen analizada con éxito');
  }
}
```

#### Capa Logic — Use Cases

- **Responsabilidad:** Regla de negocio pura. Orquesta llamadas a Service y Data.
- Implementados como clases `@Injectable()` invocadas desde el Gateway.

#### Capa Service — External Services

- **Responsabilidad:** Comunicación con terceros: Google Gemini, proveedores OAuth, sistemas externos.
- La integración con Gemini reside aquí.

**Ejemplo actual:** `src/modules/main/pantry.service.ts`

```typescript
// Llama a Gemini con gemini-2.0-flash y fuerza respuesta JSON estructurada
async analyzeFoodImage(imageBase64: string): Promise<any> {
  const response = await this.ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [ prompt, { inlineData: { mimeType: 'image/jpeg', data: base64Data } } ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            quantity: { type: Type.STRING },
          },
        },
      },
    },
  });
  return JSON.parse(response.text || '[]');
}
```

#### Capa Data — Repositorios

- **Responsabilidad:** Consultas a Supabase (PostgreSQL).
- Usa el SDK `@supabase/supabase-js` directamente.
- Aislada completamente del resto: ninguna otra capa hace consultas SQL.

#### Capa Model (transversal)

- Espejo estricto de las tablas de la base de datos como interfaces TypeScript.
- Ubicación: externa a los módulos específicos (ej. `src/common/interfaces/` o una carpeta `models/`).

---

## 5. Módulos Actuales

### `src/modules/auth`

Gestiona la autenticación del usuario con Supabase.

| Archivo           | Propósito                                          |
| ----------------- | -------------------------------------------------- |
| `auth.gateway.ts` | Gateway WS. Evento `auth:sync` → sincroniza perfil |
| `auth.service.ts` | Lógica de sincronización de perfil en Supabase     |
| `auth.module.ts`  | Módulo NestJS que registra gateway y service       |

**Evento WebSocket:**

```
Emitir:  auth:sync       { token: string }   (token en handshake o payload)
Recibir: auth:sync       ApiResponse<{ id, email, sync: boolean }>
```

**Flujo:** El `WsAuthGuard` valida el token JWT con Supabase → inyecta `client.user` → `AuthGateway` pasa el usuario a `AuthService.syncProfile` → hace upsert del perfil en la tabla `usuario`.

### `src/modules/main` (pantry)

Gestiona el inventario de alimentos (despensa).

| Archivo             | Propósito                                                  |
| ------------------- | ---------------------------------------------------------- |
| `pantry.gateway.ts` | Gateway WS. Evento `pantry:analyze_image` → llama a Gemini |
| `pantry.service.ts` | Integración con Google Gemini (`gemini-2.0-flash`)         |
| `pantry.module.ts`  | Módulo NestJS                                              |

**Evento WebSocket:**

```
Emitir:  pantry:analyze_image   { imageBase64: string, token: string }
Recibir: pantry:analyze_image   ApiResponse<Array<{ name: string, category: string, quantity: string }>>
```

**Notas importantes:**

- El `imageBase64` puede incluir el header `data:image/jpeg;base64,...` — el service lo limpia automáticamente.
- El payload máximo aceptado es **20MB** (configurado en `main.ts` con `body-parser`).
- El modelo de Gemini usado es `gemini-2.0-flash` (velocidad + calidad balanceadas).
- La respuesta se fuerza a JSON via `responseMimeType: 'application/json'` y un `responseSchema` estricto.

---

## 6. Infraestructura Común (`src/common/`)

### `ApiResponse<T>` — `src/common/classes/api-response.class.ts`

DTO unificado para **todas** las respuestas WebSocket:

```typescript
class ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string | string[] | null;

  static success<T>(data: T, message?: string): ApiResponse<T>;
  static error(message: string | string[]): ApiResponse<null>;
}
```

> **Regla:** Todo Gateway siempre retorna `ApiResponse`. Nunca retornar objetos planos.

### `WsAuthGuard` — `src/common/guards/ws-auth.guard.ts`

Guard de autenticación para eventos WebSocket.

- Lee el token desde `data.token` (payload del evento) o `client.handshake.auth.token` (conexión inicial).
- Valida el token con `supabase.auth.getUser(token)`.
- Si es válido, inyecta el usuario en `client.user` para consumo del Gateway.
- Si `SUPABASE_URL` / `SUPABASE_KEY` no está configurado, simula autenticación exitosa con `test-user-id` (**solo para desarrollo local**).

```typescript
// En el cliente (frontend), pasar el token al conectar:
const socket = io('http://localhost:3000', {
  auth: { token: supabaseSession.access_token },
});

// O en cada evento:
socket.emit('pantry:analyze_image', {
  imageBase64: '...',
  token: supabaseSession.access_token,
});
```

### `WsExceptionFilter` — `src/common/filters/ws-exception.filter.ts`

Filtro global de excepciones para WebSockets.

- Captura `WsException`, `HttpException` y `Error` genéricos.
- Emite el error al cliente como `ApiResponse.error(message)` via el evento `'exception'`.

```typescript
// El cliente debe escuchar:
socket.on('exception', (response: ApiResponse) => {
  console.error(response.message);
});
```

### Interfaces WS — `src/common/interfaces/ws.interface.ts`

```typescript
interface WsResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}
interface WsRequest<T = any> {
  token?: string;
  event: string;
  body: T;
}
```

---

## 7. Esquema de Base de Datos (Supabase / PostgreSQL)

### Tabla `usuario`

```sql
id                  UUID PRIMARY KEY (generado por Supabase Auth)
nombre              TEXT
correo              TEXT UNIQUE
peso                NUMERIC          -- kg, para cálculo de IMC
talla               NUMERIC          -- cm, para cálculo de IMC
fecha_nacimiento    DATE
nivel_actividad     INTEGER          -- Rango 1-5
informacion_medica  JSONB            -- Array [{ nombre: string, descripcion: string }]
alimentos_prohibidos TEXT[]          -- Array de tags (ej. ["gluten", "lactosa"])
preferencias        TEXT[]           -- Array de tags (ej. ["vegano", "sin_picante"])
created_at          TIMESTAMPTZ DEFAULT now()
```

### Tabla `comida`

```sql
id                          UUID PRIMARY KEY
id_usuario                  UUID REFERENCES usuario(id)
nombre                      TEXT            -- Manual o generado por IA
descripcion                 TEXT            -- Manual o generado por IA
fecha_hora_compra           TIMESTAMPTZ     -- Cuando se registró en la despensa
fecha_estimada_vencimiento  DATE            -- Calculada por IA o ingresada manualmente
tags                        TEXT[]          -- Generados por IA (ej. ["pollo", "proteína", "carne"])
estado                      TEXT            -- Enum: 'Por consumir' | 'Consumido' | 'Descartado'
created_at                  TIMESTAMPTZ DEFAULT now()
```

> Al crear interfaces TypeScript para estos modelos, mapear exactamente estos campos. Los arrays de JSONB/text[] se tipan como `object[]` o `string[]` respectivamente.

---

## 8. Gateway Principal (Core) — `src/core/gateways/app.gateway.ts`

Gateway base aplicable a nivel de toda la app. Usado para eventos globales (conexión/desconexión general, health checks, etc.). Los módulos específicos tienen sus propios Gateways.

---

## 9. Convenciones de Código

| Concepto             | Convención                                                              |
| -------------------- | ----------------------------------------------------------------------- |
| Módulos              | `src/modules/<nombre>/` en kebab-case                                   |
| Gateways             | `<modulo>.gateway.ts`, clase `<Modulo>Gateway`                          |
| Services             | `<modulo>.service.ts`, clase `<Modulo>Service` con `@Injectable()`      |
| Módulos NestJS       | `<modulo>.module.ts`, registra gateway + service + data                 |
| Eventos WS           | `modulo:accion` en snake_case (ej. `pantry:analyze_image`, `auth:sync`) |
| Respuestas           | Siempre `ApiResponse.success(data, msg)` o `ApiResponse.error(msg)`     |
| Variables de entorno | Acceder **solo** via `ConfigService`, nunca `process.env` directamente  |

---

## 10. Configuración Global (`src/main.ts`)

| Configuración  | Detalle                                                            |
| -------------- | ------------------------------------------------------------------ |
| Body parser    | JSON y urlencoded hasta **20MB** (necesario para imágenes base64)  |
| ValidationPipe | `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` |
| CORS HTTP      | Origen `http://localhost:5173`, métodos GET/POST/PUT/DELETE/PATCH  |
| CORS WS        | `{ origin: '*' }` en cada `@WebSocketGateway`                      |
| Shutdown hooks | `app.enableShutdownHooks()` evita apagado abrupto                  |

---

## 11. Reglas Críticas de Desarrollo

1. **WebSockets primero.** Todo endpoint nuevo debe ser un `@SubscribeMessage` en un Gateway. Solo usar HTTP REST para webhooks de terceros que lo requieran explícitamente.
2. **`ApiResponse` siempre.** Ningún Gateway devuelve un objeto plano. Usa `ApiResponse.success` o `ApiResponse.error`.
3. **Gemini en Service.** Toda llamada a `@google/genai` va en la capa Service. El Gateway nunca instancia `GoogleGenAI` directamente.
4. **Supabase en Data.** Toda consulta SQL/SDK de Supabase va en la capa Data. El Service nunca hace `createClient` para consultas.
5. **ConfigService para env vars.** Siempre inyectar `ConfigService` para leer variables de entorno.
6. **Tipado estricto.** TypeScript obligatorio. Los `any` deben ser justificados con comentario explícito.
7. **Token en Guard, no en lógica.** La validación del JWT de Supabase ocurre exclusivamente en `WsAuthGuard`. Los Gateways asumen que `client.user` ya está disponible.
