import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable()
export class PantryService {
  private ai: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      console.warn(
        'GEMINI_API_KEY no encontrada. Por favor agregala en el archivo .env',
      );
    }

    // Inicializamos el SDK de Gemini
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async analyzeFoodImage(imageBase64: string): Promise<any> {
    try {
      // Limpiamos el base64 si trae la cabecera (data:image/jpeg;base64,...)
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      // Instruimos a Gemini con el modelo más rápido y bueno (Flash)
      // Forzamos la salida en un esquema JSON para asegurar nuestra app (Data)
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash', // Corregido a un modelo existente
        contents: [
          'Analiza esta imagen e identifica todos los alimentos posibles. Para cada uno, indica el nombre, categoría (fruta, vegetal, envasado, carne, etc) y una estimación de cantidad. Devuelve estrictamente el JSON esperado.',
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
        ],
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

      // El resultado de Gemini ahora vendrá estructurado uniformemente
      const responseText = response.text || '[]';

      // Dado que indicamos responseMimeType, normalmente ya es un JSON parseable.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Error procesando la imagen con Gemini:', error);
      throw new InternalServerErrorException(
        'No pudimos procesar la imagen con IA.',
      );
    }
  }
}
