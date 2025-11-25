import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  from: 'user' | 'agent';
  text: string;
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

@Injectable({
  providedIn: 'root'
})
export class AgenteIAService {
  private readonly webhookUrl = 'https://adminmaster.app.n8n.cloud/webhook/chat';

  constructor(private readonly http: HttpClient) {}

  sendMessage(message: string, history: ChatMessage[]): Observable<ChatResponse> {
    const payload = {
      message,
      history: history.map((msg) => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        text: msg.text
      }))
    };

    return this.http.post<ChatResponse>(this.webhookUrl, payload);
  }
}

