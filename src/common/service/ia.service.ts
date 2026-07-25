/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { getMimeType } from '../utils/functions/get-mime-type';

// Servicio de IA centralizado usando Google Gemini.
// Interfaz pública (generate, analyzeImage) independiente del proveedor.
@Injectable()
export class IAService implements OnModuleInit {
  static instance: IAService;
  private ai: GoogleGenAI;
  private model: string;

  constructor(private configService: ConfigService) {
    IAService.instance = this;

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      console.warn(
        '[IAService] GEMINI_API_KEY no encontrada. Agrégala en el .env',
      );
    }

    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
    this.model =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';
  }

  async onModuleInit() {
    console.log(`[IAService] Proveedor: Google Gemini | Modelo: ${this.model}`);
  }

  // --- Conversión de Schema ---

  /**
   * Convierte un JSON Schema estándar al formato de Gemini
   * (tipos en MAYÚSCULAS, sin additionalProperties).
   */
  private static toGeminiSchema(node: any): any {
    if (!node || typeof node !== 'object') return node;

    const TYPE_MAP: Record<string, string> = {
      object: 'OBJECT',
      string: 'STRING',
      array: 'ARRAY',
      integer: 'INTEGER',
      number: 'NUMBER',
      boolean: 'BOOLEAN',
    };

    const result: any = {};

    if (node.type) result.type = TYPE_MAP[node.type] || node.type;
    if (node.description) result.description = node.description;
    if (node.enum) result.enum = node.enum;
    if (node.required) result.required = node.required;

    if (node.properties) {
      result.properties = {};
      for (const [key, val] of Object.entries(node.properties)) {
        result.properties[key] = this.toGeminiSchema(val);
      }
    }

    if (node.items) result.items = this.toGeminiSchema(node.items);

    return result;
  }

  // --- Extracción de imagen ---

  /**
   * Extrae el base64 limpio y el mimeType de un string
   * que puede ser raw base64 o data URL.
   */
  private static async extractImageParts(
    foto_b64: string,
  ): Promise<{ data: string; mimeType: string }> {
    const cleaned = foto_b64.trim().replace(/\s+/g, '');

    if (cleaned.startsWith('data:')) {
      const [header, data] = cleaned.split(',');
      const match = header.match(/data:([^;]+)/);
      return { data, mimeType: match?.[1] || 'image/jpeg' };
    }

    const [mime] = await getMimeType(cleaned);
    return { data: cleaned, mimeType: mime };
  }

  // --- API Pública ---

  /**
   * Genera JSON estructurado a partir de un prompt de texto.
   * Si se pasa schema, Gemini aplica constrained decoding (JSON garantizado).
   */
  static async generate<T>(prompt: string, schema?: any): Promise<T> {
    if (!this.instance)
      throw new Error('[IAService] Instancia no inicializada');

    const config: any = {
      temperature: 0.7,
      responseMimeType: 'application/json',
    };

    if (schema) {
      config.responseSchema = this.toGeminiSchema(schema);
    }

    const response = await this.instance.ai.models.generateContent({
      model: this.instance.model,
      contents: prompt,
      config,
    });

    return JSON.parse(response.text || '{}') as T;
  }

  /**
   * Analiza una imagen y devuelve JSON estructurado.
   * Gemini 2.5 Flash soporta visión + structured output en una sola llamada.
   */
  static async analyzeImage<T>(
    foto_b64: string,
    prompt: string,
    schema?: any,
    _schemaName?: string,
  ): Promise<T> {
    if (!this.instance)
      throw new Error('[IAService] Instancia no inicializada');

    const { data, mimeType } = await this.extractImageParts(foto_b64);

    const config: any = {
      temperature: 0.4,
      responseMimeType: 'application/json',
    };

    if (schema) {
      config.responseSchema = this.toGeminiSchema(schema);
    }

    const response = await this.instance.ai.models.generateContent({
      model: this.instance.model,
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType, data } }, { text: prompt }],
        },
      ],
      config,
    });

    return JSON.parse(response.text || '{}') as T;
  }
}
