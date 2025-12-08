import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AgenteIAService, ChatMessage } from './agente-ia.service';

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  messages: ChatMessage[];
}

@Component({
  selector: 'app-agente-ia',
  imports: [CommonModule, FormsModule],
  templateUrl: './agente-ia.component.html',
  styleUrl: './agente-ia.component.scss'
})
export class AgenteIAComponent implements OnInit {
  constructor(private readonly agenteIAService: AgenteIAService) {}

  ngOnInit(): void {
    this.loadSessionsFromStorage();
    if (this.sessions.length === 0) {
      this.createNewSession();
    }
    this.loadChatState();
  }

  isChatOpen = false;
  isSending = false;
  errorMessage: string | null = null;
  showHistory = false;

  /** Lista de sesiones de chat en el historial */
  sessions: ChatSession[] = [];
  /** Id de la sesión actualmente activa */
  activeSessionId: string | null = null;

  /** Mensajes de la sesión activa (se referencia al array de la sesión activa) */
  messages: ChatMessage[] = [];

  newMessage = '';

  private readonly STORAGE_KEY = 'agente-ia-sessions';
  private readonly STORAGE_KEY_ACTIVE_SESSION = 'agente-ia-active-session';
  private readonly STORAGE_KEY_CHAT_STATE = 'agente-ia-chat-state';

  formatMessage(text: string): string {
    if (!text) return '';
    
    // Remove ** and -- from the text
    let formattedText = text.replace(/\*\*|--/g, '');
    
    // Escape HTML to prevent XSS
    formattedText = this.escapeHtml(formattedText);
    
    // Replace newlines with <br> for line breaks
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    // Format lists (both bullet points and numbered lists)
    formattedText = formattedText.replace(/^(\s*[-•*]\s+)(.+)$/gm, '<li>$2</li>');
    formattedText = formattedText.replace(/^(\s*\d+\.\s+)(.+)$/gm, '<li>$2</li>');
    
    // If we found any list items, wrap them in a <ul> or <ol>
    if (formattedText.includes('<li>')) {
      formattedText = formattedText.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    }
    
    // Format code blocks (text between ```)
    formattedText = formattedText.replace(/```(\w*)\n([\s\S]*?)\n```/g, 
      (match: string, lang: string, code: string) => {
        return `<pre><code class="language-${lang || 'plaintext'}">${this.escapeHtml(code)}</code></pre>`;
      }
    );
    
    // Format inline code (text between `)
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Format links
    formattedText = formattedText.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    return formattedText;
  }
  
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    this.saveChatState();
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  goToHistory(): void {
    // Navigate to history view or show history modal
    // You can implement navigation to a separate history page/component here
  }

  switchToSession(sessionId: string): void {
    this.activeSessionId = sessionId;
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      this.messages = session.messages;
    }
    this.saveSessionsToStorage();
  }

  async sendMessage(): Promise<void> {
    const text = this.newMessage.trim();
    if (!text || this.isSending) {
      return;
    }

    // Agregar mensaje del usuario
    this.messages.push({ from: 'user', text, timestamp: new Date() });
    const historySnapshot = [...this.messages];
    this.newMessage = '';
    this.errorMessage = null;
    this.isSending = true;
    this.saveSessionsToStorage();

    try {
      const response = await firstValueFrom(
        this.agenteIAService.sendMessage(
          text,
          historySnapshot,
          this.activeSessionId || undefined
        )
      );
      this.messages.push({
        from: 'agent',
        text: this.extractReply(response),
        timestamp: new Date()
      });
      this.saveSessionsToStorage();
      this.updateSessionTitle();
    } catch {
      const fallbackText =
        'Lo siento, no pude conectar con el asistente. Inténtalo nuevamente en unos segundos.';
      this.errorMessage = fallbackText;
      this.messages.push({ from: 'agent', text: fallbackText, timestamp: new Date() });
      this.saveSessionsToStorage();
      this.updateSessionTitle();
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

  private createNewSession(): void {
    const id = this.generateSessionId();
    const welcomeMessage: ChatMessage = {
      from: 'agent',
      text: '¡Hola! Soy tu agente IA. ¿En qué puedo ayudarte hoy?'
    };

    const newSession: ChatSession = {
      id,
      title: 'Nuevo Chat',
      createdAt: new Date(),
      messages: [welcomeMessage]
    };

    this.sessions.unshift(newSession);
    this.activeSessionId = id;
    this.messages = newSession.messages;
    this.saveSessionsToStorage();
    this.saveActiveSession();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }

  private generateChatTitle(messages: ChatMessage[]): string {
    if (messages.length === 0) return 'Nuevo Chat';
    
    // Buscar el primer mensaje del usuario para generar el título
    const firstUserMessage = messages.find(msg => msg.from === 'user' && msg.text);
    
    if (!firstUserMessage) return 'Nuevo Chat';
    
    const text = firstUserMessage.text.toLowerCase();
    
    // Palabras clave y sus títulos correspondientes
    const keywordTitles = [
      { keywords: ['producto', 'inventario', 'stock', 'almacen', 'mercancia'], title: 'Gestión de Productos' },
      { keywords: ['venta', 'vender', 'cobrar', 'factura', 'ticket', 'caja'], title: 'Ventas y Cobros' },
      { keywords: ['cliente', 'cliente', 'consumidor', 'comprador'], title: 'Gestión de Clientes' },
      { keywords: ['proveedor', 'proveedores', 'compra', 'adquisicion'], title: 'Gestión de Proveedores' },
      { keywords: ['empleado', 'trabajador', 'personal', 'staff'], title: 'Gestión de Personal' },
      { keywords: ['reporte', 'report', 'estadistica', 'dato', 'analisis'], title: 'Reportes y Análisis' },
      { keywords: ['turno', 'horario', 'agenda', 'calendario'], title: 'Gestión de Turnos' },
      { keywords: ['categoria', 'clasificacion', 'tipo', 'grupo'], title: 'Categorización' },
      { keywords: ['precio', 'costo', 'tarifa', 'valor'], title: 'Gestión de Precios' },
      { keywords: ['pedido', 'orden', 'solicitud', 'encargo'], title: 'Gestión de Pedidos' },
      { keywords: ['problema', 'error', 'falla', 'incidente', 'ayuda'], title: 'Soporte y Ayuda' },
      { keywords: ['configuracion', 'config', 'ajuste', 'setting'], title: 'Configuración' },
      { keywords: ['cuenta', 'perfil', 'usuario', 'acceso'], title: 'Cuenta de Usuario' }
    ];
    
    // Buscar coincidencias con palabras clave
    for (const { keywords, title } of keywordTitles) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return title;
      }
    }
    
    // Si no hay coincidencias, usar las primeras palabras del mensaje
    const words = firstUserMessage.text.split(' ').slice(0, 4).join(' ');
    return words.length > 25 ? words.substring(0, 25) + '...' : words;
  }

  private updateSessionTitle(): void {
    const activeSession = this.sessions.find(s => s.id === this.activeSessionId);
    if (activeSession && activeSession.title === 'Nuevo Chat') {
      const newTitle = this.generateChatTitle(this.messages);
      if (newTitle !== 'Nuevo Chat') {
        activeSession.title = newTitle;
        this.saveSessionsToStorage();
      }
    }
  }

  private saveSessionsToStorage(): void {
    try {
      const sessionsData = this.sessions.map(session => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt.toISOString(),
        messages: session.messages
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionsData));
    } catch (error) {
      console.warn('No se pudo guardar las sesiones:', error);
    }
  }

  private loadSessionsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.sessions = parsed.map((s: any) => ({
          id: s.id,
          title: s.title,
          createdAt: new Date(s.createdAt),
          messages: s.messages || []
        }));
        
        // Cargar la sesión activa
        this.loadActiveSession();
        
        // Si no hay sesión activa o no existe, seleccionar la primera
        if (!this.activeSessionId || !this.sessions.find(s => s.id === this.activeSessionId)) {
          if (this.sessions.length > 0) {
            this.activeSessionId = this.sessions[0].id;
            this.messages = this.sessions[0].messages;
          } else {
            this.createNewSession();
          }
        } else {
          const activeSession = this.sessions.find(s => s.id === this.activeSessionId);
          if (activeSession) {
            this.messages = activeSession.messages;
          }
        }
      }
    } catch (error) {
      console.warn('No se pudo cargar las sesiones:', error);
    }
  }

  private saveActiveSession(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_ACTIVE_SESSION, JSON.stringify({
        activeSessionId: this.activeSessionId
      }));
    } catch (error) {
      console.warn('No se pudo guardar la sesión activa:', error);
    }
  }

  private loadActiveSession(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_ACTIVE_SESSION);
      if (stored) {
        const state = JSON.parse(stored);
        this.activeSessionId = state.activeSessionId || null;
      }
    } catch (error) {
      console.warn('No se pudo cargar la sesión activa:', error);
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
    this.createNewSession();
  }
}
