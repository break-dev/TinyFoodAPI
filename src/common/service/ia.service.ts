/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { getDataUrlFromB64 } from '../utils/functions/get-data-url-from-b64';

// Servicio de IA centralizado con autodetección de modelos de Groq, pipeline de 2 pasos para visión y resiliencia contra rate limits.
@Injectable()
export class IAService implements OnModuleInit {
  static instance: IAService;
  private groq: Groq;
  private modelText: string;
  private modelVision: string;
  private modelStructured: string;
  private activeModelsCache: string[] = [];

  constructor(private configService: ConfigService) {
    IAService.instance = this;

    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      console.warn(
        '[IAService] GROQ_API_KEY no encontrada. Agrégala en el .env',
      );
    }
    this.groq = new Groq({ apiKey: apiKey || '' });

    // Cargar modelos iniciales de variables de entorno con fallbacks seguros
    this.modelText =
      this.configService.get<string>('GROQ_MODEL_TEXT') ||
      'openai/gpt-oss-120b';
    this.modelVision =
      this.configService.get<string>('GROQ_MODEL_VISION') || 'qwen/qwen3.6-27b';
    this.modelStructured =
      this.configService.get<string>('GROQ_MODEL_STRUCTURED') || this.modelText;
  }

  async onModuleInit() {
    await this.syncActiveModels();
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Limpia etiquetas de pensamiento (<think>...</think>), bloques markdown y extrae el objeto JSON válido.
   */
  private static cleanAndParseJson<T>(raw: string): T {
    let cleaned = raw
      // Eliminar etiqueta <think> cerrada normalmente
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      // Eliminar etiqueta <think> sin cerrar (stream truncado o salida parcial)
      .replace(/<think>[\s\S]*/gi, '')
      // Limpiar bloques de código markdown
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else {
      throw new Error(
        `[IAService] No se encontró un objeto JSON en la respuesta de la IA. Contenido recibido: "${cleaned.substring(0, 120)}..."`,
      );
    }

    return JSON.parse(cleaned) as T;
  }

  /**
   * Sincroniza dinámicamente la lista de modelos activos ofrecidos por Groq
   * para evitar fallos si Groq cambia o retira modelos sin previo aviso.
   */
  private async syncActiveModels(): Promise<void> {
    try {
      const modelsList = await this.groq.models.list();
      this.activeModelsCache = modelsList.data
        .filter((m: any) => m.active !== false)
        .map((m) => m.id);

      console.log(
        `[IAService] Modelos activos en Groq (${this.activeModelsCache.length}):`,
        this.activeModelsCache,
      );

      // Prioridades de fallbacks para texto / estructurado
      const preferredText = [
        this.configService.get<string>('GROQ_MODEL_TEXT'),
        'openai/gpt-oss-120b',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'openai/gpt-oss-20b',
      ].filter(Boolean) as string[];

      const activeText = preferredText.find((m) =>
        this.activeModelsCache.includes(m),
      );
      if (activeText) {
        this.modelText = activeText;
        this.modelStructured = activeText;
      }

      // Prioridades de fallbacks para visión
      const preferredVision = [
        this.configService.get<string>('GROQ_MODEL_VISION'),
        'llama-3.2-11b-vision-preview',
        'llama-3.2-90b-vision-instruct',
        'qwen/qwen3.6-27b',
      ].filter(Boolean) as string[];

      const activeVision = preferredVision.find((m) =>
        this.activeModelsCache.includes(m),
      );
      if (activeVision) {
        this.modelVision = activeVision;
      }

      console.log(
        `[IAService] Modelos seleccionados -> Texto/Estructurado: ${this.modelText} | Visión: ${this.modelVision}`,
      );
    } catch (error) {
      console.warn(
        '[IAService] No se pudo sincronizar la lista de modelos de Groq, usando valores predeterminados:',
        error,
      );
    }
  }

  /**
   * Método genérico privado para interactuar con Groq, con tolerancia a fallos,
   * manejo de 429 rate limits y compatibilidad con modelos de razonamiento.
   */
  private static async requestGroq<T>({
    model,
    messages,
    schema,
    schemaName = 'response_schema',
    temperature = 0.4,
    isVision = false,
    rawTextOnly = false,
  }: {
    model: string;
    messages: any[];
    schema?: any;
    schemaName?: string;
    temperature?: number;
    isVision?: boolean;
    rawTextOnly?: boolean;
  }): Promise<T> {
    if (!this.instance) {
      throw new Error('[IAService] Instancia no inicializada');
    }

    let currentMessages = JSON.parse(JSON.stringify(messages));

    const injectSchemaPrompt = () => {
      if (!schema || rawTextOnly) return;
      const schemaPrompt = `\n\n[REGLA DE FORMATO OBLIGATORIA]: Responde ÚNICAMENTE con un OBJETO JSON válido (un objeto que comience con '{' y termine con '}') que cumpla estrictamente con esta estructura:\n${JSON.stringify(schema, null, 2)}`;

      const lastIndex = currentMessages.length - 1;
      const lastMsg = currentMessages[lastIndex];

      if (typeof lastMsg.content === 'string') {
        currentMessages[lastIndex] = {
          ...lastMsg,
          content: lastMsg.content + schemaPrompt,
        };
      } else if (Array.isArray(lastMsg.content)) {
        currentMessages[lastIndex] = {
          ...lastMsg,
          content: lastMsg.content.map((c: any) =>
            c.type === 'text' ? { ...c, text: c.text + schemaPrompt } : c,
          ),
        };
      }
    };

    const cleanRawText = (raw: string): string => {
      return raw
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<think>[\s\S]*/gi, '')
        .replace(/^```[a-z]*\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
    };

    let responseFormat: any = undefined;
    if (isVision || rawTextOnly) {
      if (!rawTextOnly) injectSchemaPrompt();
      responseFormat = undefined;
    } else if (schema) {
      responseFormat = {
        type: 'json_schema' as const,
        json_schema: {
          name: schemaName,
          schema,
        },
      };
    } else {
      responseFormat = { type: 'json_object' as const };
    }

    const maxTokens = isVision ? 2500 : 1500;

    const executeCall = async (params: any) => {
      const completion = await this.instance.groq.chat.completions.create(
        params,
      );
      const raw = completion.choices[0]?.message?.content ?? '';
      if (rawTextOnly) {
        return cleanRawText(raw) as unknown as T;
      }
      return this.cleanAndParseJson<T>(raw);
    };

    const isRateLimitError = (err: any) => {
      const msg = String(err?.message || err || '');
      return (
        err?.status === 429 ||
        err?.code === 'rate_limit_exceeded' ||
        msg.includes('429') ||
        msg.includes('rate_limit_exceeded')
      );
    };

    // --- NIVEL 1: Petición principal ---
    try {
      const completionParams: any = {
        model,
        messages: currentMessages,
        temperature,
        max_tokens: maxTokens,
      };

      if (responseFormat) {
        completionParams.response_format = responseFormat;
      }

      return await executeCall(completionParams);
    } catch (error: any) {
      const errMsg = String(error?.message || error || '');
      console.warn(`[IAService] Nivel 1 falló para modelo '${model}': ${errMsg}`);

      if (isRateLimitError(error)) {
        console.warn(
          '[IAService] Rate limit detectado (429). Esperando 4 segundos antes de reintentar...',
        );
        await this.delay(4000);
      }

      if (schema && responseFormat?.type === 'json_schema') {
        injectSchemaPrompt();

        // --- NIVEL 2: Fallback a json_object si json_schema falla ---
        try {
          console.log(
            `[IAService] Nivel 2: Reintentando '${model}' con json_object...`,
          );
          return await executeCall({
            model,
            messages: currentMessages,
            temperature,
            max_tokens: maxTokens,
            response_format: { type: 'json_object' as const },
          });
        } catch (fallbackError: any) {
          console.warn(
            `[IAService] Nivel 2 falló para '${model}': ${fallbackError?.message}`,
          );
          if (isRateLimitError(fallbackError)) {
            await this.delay(4000);
          }
        }
      }

      // --- NIVEL 3: Fallback sin response_format (Tolera etiquetas <think> y parsea manualmente) ---
      try {
        console.log(
          `[IAService] Nivel 3: Reintentando '${model}' sin response_format para permitir parsing manual...`,
        );
        return await executeCall({
          model,
          messages: currentMessages,
          temperature,
          max_tokens: maxTokens,
        });
      } catch (rawError: any) {
        console.error(
          '[IAService] Nivel 3 también falló:',
          rawError?.message || rawError,
        );
        throw new Error('Error al procesar la solicitud con la IA.');
      }
    }
  }

  static async generate<T>(
    prompt: string,
    schema?: any,
    schemaName?: string,
  ): Promise<T> {
    if (!this.instance) {
      throw new Error('[IAService] Instancia no inicializada');
    }
    const model = schema
      ? this.instance.modelStructured
      : this.instance.modelText;

    return this.requestGroq<T>({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      schema,
      schemaName,
      temperature: 0.7,
      isVision: false,
    });
  }

  /**
   * Pipeline en 2 pasos para análisis de imagen:
   * 1. Extracción de Visión: El modelo de visión analiza la imagen y genera una descripción textual.
   * 2. Estructuración JSON: El modelo de texto estructurado convierte la descripción textual al esquema JSON final.
   */
  static async analyzeImage<T>(
    foto_b64: string,
    prompt: string,
    schema?: any,
    schemaName?: string,
  ): Promise<T> {
    if (!this.instance) {
      throw new Error('[IAService] Instancia no inicializada');
    }
    const dataUrl = await getDataUrlFromB64(foto_b64);

    // PASO 1: Obtener la identificación de alimentos del modelo de Visión en texto plano
    const visionPrompt = `${prompt}\n\n[INSTRUCCIÓN DE SALIDA DE VISIÓN]: Analiza la imagen y describe detalladamente todos los alimentos, cantidades, categorías y etiquetas identificadas en texto plano ordenado. NO generes código JSON ni etiquetas <think>.`;

    let descripcionTextual: string;
    try {
      descripcionTextual = await this.requestGroq<string>({
        model: this.instance.modelVision,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
              {
                type: 'text',
                text: visionPrompt,
              },
            ],
          },
        ],
        temperature: 0.3,
        isVision: true,
        rawTextOnly: true,
      });
    } catch (visionError) {
      console.warn(
        '[IAService] Falló el paso de visión del pipeline de imagen:',
        visionError,
      );
      throw visionError;
    }

    if (!descripcionTextual || descripcionTextual.trim().length === 0) {
      throw new Error(
        '[IAService] El modelo de visión no devolvió ningún texto descriptivo.',
      );
    }

    // PASO 2: Transformar la descripción del modelo de visión a JSON Estructurado usando el Modelo de Texto
    const structuringPrompt = `A continuación se presenta el resultado del análisis de visión de una foto de alimentos:\n\n"""\n${descripcionTextual}\n"""\n\nCon base en esa descripción, extrae la información requerida y genera el resultado final respetando todas las reglas solicitadas:\n${prompt}`;

    return this.generate<T>(structuringPrompt, schema, schemaName);
  }
}
