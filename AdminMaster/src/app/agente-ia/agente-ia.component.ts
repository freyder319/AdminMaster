import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AgenteIAService, ChatMessage } from './agente-ia.service';

@Component({
  selector: 'app-agente-ia',
  imports: [CommonModule, FormsModule],
  templateUrl: './agente-ia.component.html',
  styleUrl: './agente-ia.component.scss'
})
export class AgenteIAComponent implements OnInit {
  constructor(private readonly agenteIAService: AgenteIAService) {}

  ngOnInit(): void {
    this.loadChatHistory();
    this.loadChatState();
  }

  isChatOpen = false;
  isSending = false;
  errorMessage: string | null = null;

  messages: ChatMessage[] = [];

  newMessage = '';

  private readonly STORAGE_KEY = 'agente-ia-messages';
  private readonly STORAGE_KEY_CHAT_STATE = 'agente-ia-chat-state';

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    this.saveChatState();
  }

  async sendMessage(): Promise<void> {
    const text = this.newMessage.trim();
    if (!text || this.isSending) {
      return;
    }

    this.messages.push({ from: 'user', text });
    const historySnapshot = [...this.messages];
    this.newMessage = '';
    this.errorMessage = null;
    this.isSending = true;
    this.saveChatHistory();

    try {
      const response = await firstValueFrom(this.agenteIAService.sendMessage(text, historySnapshot));
      this.messages.push({
        from: 'agent',
        text: this.extractReply(response)
      });
      this.saveChatHistory();
    } catch {
      const fallbackText =
        'Lo siento, no pude conectar con el asistente. Inténtalo nuevamente en unos segundos.';
      this.errorMessage = fallbackText;
      this.messages.push({ from: 'agent', text: fallbackText });
      this.saveChatHistory();
    } finally {
      this.isSending = false;
    }
  }

  private extractReply(response: unknown): string {
    if (!response || typeof response !== 'object') {
      return 'Recibí tu mensaje, pero no pude obtener una respuesta válida.';
    }

    const candidate = this.pickReply(response as Record<string, unknown>);
    return candidate ?? 'Recibí tu mensaje, pero no pude obtener una respuesta válida.';
  }

  private pickReply(data: Record<string, unknown>): string | null {
    const candidates = [
      data['reply'],
      data['message'],
      data['response'],
      typeof data['data'] === 'string'
        ? data['data']
        : this.extractNested(data['data'] as Record<string, unknown> | undefined)
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate;
      }
    }

    return null;
  }

  private extractNested(nested?: Record<string, unknown>): string | null {
    if (!nested) {
      return null;
    }

    const innerCandidates = ['reply', 'message', 'response']
      .map((key) => nested[key])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    return innerCandidates[0] ?? null;
  }

  private saveChatHistory(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.messages));
    } catch (error) {
      console.warn('No se pudo guardar el historial del chat:', error);
    }
  }

  private loadChatHistory(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        this.messages = parsed.length > 0 ? parsed : [{
          from: 'agent',
          text: '¡Hola! Soy tu agente IA. ¿En qué puedo ayudarte hoy?'
        }];
      } else {
        this.messages = [{
          from: 'agent',
          text: '¡Hola! Soy tu agente IA. ¿En qué puedo ayudarte hoy?'
        }];
      }
    } catch (error) {
      console.warn('No se pudo cargar el historial del chat:', error);
      this.messages = [{
        from: 'agent',
        text: '¡Hola! Soy tu agente IA. ¿En qué puedo ayudarte hoy?'
      }];
    }
  }

  private saveChatState(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_CHAT_STATE, JSON.stringify({
        isChatOpen: this.isChatOpen
      }));
    } catch (error) {
      console.warn('No se pudo guardar el estado del chat:', error);
    }
  }

  private loadChatState(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_CHAT_STATE);
      if (stored) {
        const state = JSON.parse(stored);
        this.isChatOpen = state.isChatOpen || false;
      }
    } catch (error) {
      console.warn('No se pudo cargar el estado del chat:', error);
    }
  }

  clearHistory(): void {
    this.messages = [{
      from: 'agent',
      text: '¡Hola! Soy tu agente IA. ¿En qué puedo ayudarte hoy?'
    }];
    this.saveChatHistory();
  }
}
