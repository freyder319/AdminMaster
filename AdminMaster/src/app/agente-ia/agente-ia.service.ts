import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  from: 'user' | 'agent';
  text: string;
  timestamp?: Date;
}

export interface ChatResponse {
  reply?: string;
  message?: string;
  response?: string;
  data?: {
    reply?: string;
    message?: string;
    response?: string;
  } | string;
  [key: string]: unknown;
}

export interface ImageAnalysisResponse {
  analysis?: string;
  suggestions?: string[];
  detectedObjects?: string[];
  quality?: string;
  recommendations?: string;
  [key: string]: unknown;
}

export interface ChatSessionSummary {
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgenteIAService {
  private readonly webhookUrl = 'https://adminmaster.app.n8n.cloud/webhook/chat';
  private readonly apiBaseUrl = '/agente-ia';

  constructor(private readonly http: HttpClient) {}

  sendMessage(message: string, history: ChatMessage[], sessionId?: string): Observable<ChatResponse> {
    const payload = {
      message,
      sessionId,
      history: history.map((msg) => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        text: msg.text,
        content: msg.text
      }))
    };

    return this.http.post<ChatResponse>(
      this.webhookUrl,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  getSessions(): Observable<ChatSessionSummary[]> {
    return this.http.get<ChatSessionSummary[]>(`${this.apiBaseUrl}/sessions`);
  }

  analyzeImage(imageBase64: string, fileName?: string, context?: string): Observable<ImageAnalysisResponse> {
    const payload = {
      imageBase64,
      fileName: fileName || 'product-image.jpg',
      context: context || 'Análisis de producto para formulario dinámico'
    };

    return this.http.post<ImageAnalysisResponse>(`${this.apiBaseUrl}/analyze-image`, payload);
  }

  storeTempImage(imageData: string, sessionId: string, fileName?: string): Observable<{ imageUrl: string }> {
    const payload = {
      imageData,
      sessionId,
      fileName: fileName || 'product-image.jpg'
    };

    return this.http.post<{ imageUrl: string }>(`${this.apiBaseUrl}/temp-image`, payload);
  }

  extractReply(response: ChatResponse): string {
    // Intentar diferentes propiedades donde podría estar la respuesta
    if (response.reply) return response.reply;
    if (response.message) return response.message;
    if (response.response) return response.response;
    
    // Si la respuesta está anidada en data
    if (response.data) {
      if (typeof response.data === 'string') return response.data;
      if (typeof response.data === 'object') {
        const dataObj = response.data as any;
        if (dataObj.reply) return dataObj.reply;
        if (dataObj.message) return dataObj.message;
        if (dataObj.response) return dataObj.response;
      }
    }
    
    // Si no se encuentra nada, devolver string vacío
    return '';
  }

}

