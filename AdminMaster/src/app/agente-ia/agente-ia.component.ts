import { Component } from '@angular/core';
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
export class AgenteIAComponent {
  constructor(private readonly agenteIAService: AgenteIAService) {}

  isChatOpen = false;
  isSending = false;
  errorMessage: string | null = null;

  messages: ChatMessage[] = [
    {
      from: 'agent',
      text: '¡Hola! Soy tu agente IA. ¿En qué puedo ayudarte hoy?'
    }
  ];

  newMessage = '';

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
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

    try {
      const response = await firstValueFrom(this.agenteIAService.sendMessage(text, historySnapshot));
      this.messages.push({
        from: 'agent',
        text: this.extractReply(response)
      });
    } catch {
      const fallbackText =
        'Lo siento, no pude conectar con el asistente. Inténtalo nuevamente en unos segundos.';
      this.errorMessage = fallbackText;
      this.messages.push({ from: 'agent', text: fallbackText });
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
}
