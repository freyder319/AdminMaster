import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { AgenteIAService, ChatMessage, ChatSessionSummary } from '../agente-ia/agente-ia.service';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';

interface ExtendedChatMessage extends ChatMessage {
  image?: string;
  steps?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  messages: ExtendedChatMessage[];
}

@Component({
  selector: 'app-agente-general',
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  templateUrl: './agente-general.component.html',
  styleUrl: './agente-general.component.scss'
})
export class AgenteGeneralComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatBody') chatBody!: ElementRef;

  constructor(
    private readonly agenteIAService: AgenteIAService,
    private readonly sanitizer: DomSanitizer
  ) {}

  isSending = false;
  errorMessage: string | null = null;
  showHistoryPanel = false;
  
  /** Lista de sesiones de chat en el historial */
  sessions: ChatSession[] = [];
  /** Id de la sesión actualmente activa */
  activeSessionId: string | null = null;

  /** Mensajes de la sesión activa (se referencia al array de la sesión activa) */
  messages: ExtendedChatMessage[] = [];

  newMessage = '';
  shouldScroll = false;

  /** Modo de eliminación individual */
  isDeleteMode = false;

  private readonly STORAGE_KEY = 'agente-general-sessions';
  private readonly STORAGE_KEY_ACTIVE_SESSION = 'agente-general-active-session';

  ngOnInit(): void {
    this.loadSessionsFromStorage();
    if (this.sessions.length === 0) {
      this.loadSessionsFromBackend();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  onNewChatClick(): void {
    if (this.isSending) {
      return;
    }
    this.errorMessage = null;
    this.newMessage = '';
    this.createNewSession();
  }

  private async loadSessionsFromBackend(): Promise<void> {
    try {
      const sessions = await firstValueFrom(this.agenteIAService.getSessions());

      if (!sessions || sessions.length === 0) {
        this.createNewSession();
        return;
      }

      this.sessions = sessions.map((s, index) => ({
        id: s.sessionId,
        title: s.title || `Chat ${index + 1}`,
        createdAt: new Date(s.createdAt),
        messages: [],
      }));

      const first = this.sessions[0];
      this.activeSessionId = first.id;
      this.messages = first.messages;
      this.shouldScroll = true;
      this.saveSessionsToStorage();
    } catch {
      // Si falla la carga desde el backend, continuar con una sesión local nueva
      this.createNewSession();
    }
  }

  private createNewSession(): void {
    const id = this.generateSessionId();
    const welcomeMessage: ExtendedChatMessage = {
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
    this.shouldScroll = true;
    this.saveSessionsToStorage();
    this.saveActiveSession();
  }

  onSelectSession(sessionId: string): void {
    if (this.activeSessionId === sessionId) {
      return;
    }

    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) {
      return;
    }

    this.activeSessionId = sessionId;
    this.messages = session.messages;
    this.errorMessage = null;
    this.newMessage = '';
    this.shouldScroll = true;
    this.saveActiveSession();
    
    // On mobile, hide history panel after selecting a session
    if (window.innerWidth < 649) {
      this.showHistoryPanel = false;
    }
  }

  toggleHistoryPanel(): void {
    this.showHistoryPanel = !this.showHistoryPanel;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }

  private generateChatTitle(messages: ExtendedChatMessage[]): string {
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

  async sendMessage(): Promise<void> {
    const text = this.newMessage.trim();

    if (!text || this.isSending) {
      return;
    }

    // Agregar mensaje del usuario
    const userMessage: ExtendedChatMessage = {
      from: 'user',
      text: text
    };
    this.messages.push(userMessage);
    this.shouldScroll = true;
    this.saveSessionsToStorage();

    const historySnapshot = [...this.messages];
    this.newMessage = '';
    this.errorMessage = null;
    this.isSending = true;

    try {
      const response = await firstValueFrom(
        this.agenteIAService.sendMessage(
          text,
          historySnapshot,
          this.activeSessionId || undefined
        )
      );
      
      const replyText = this.extractReply(response);
      const steps = this.extractSteps(replyText);
      
      this.messages.push({
        from: 'agent',
        text: replyText,
        steps: steps.length > 0 ? steps : undefined
      });
      this.shouldScroll = true;
      this.saveSessionsToStorage();
      this.updateSessionTitle();
    } catch {
      const fallbackText =
        'Lo siento, no pude conectar con el asistente. Inténtalo nuevamente en unos segundos.';
      this.errorMessage = fallbackText;
      this.messages.push({ from: 'agent', text: fallbackText });
      this.shouldScroll = true;
      this.saveSessionsToStorage();
      this.updateSessionTitle();
    } finally {
      this.isSending = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.chatBody) {
        const element = this.chatBody.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling:', err);
    }
  }

  formatMessage(text: string): SafeHtml {
    if (!text) return this.sanitizer.bypassSecurityTrustHtml('');
    
    // Escapar HTML primero para seguridad
    const escapeHtml = (str: string) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };
    
    let formatted = escapeHtml(text);
    
    // Convertir saltos de línea a <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Formatear texto en negrita
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  extractSteps(text: string): string[] {
    if (!text) return [];
    
    const steps: string[] = [];
    
    // Buscar patrones de pasos numerados
    const stepPattern1 = /^\d+\.\s+(.+)$/gm;
    let match;
    
    while ((match = stepPattern1.exec(text)) !== null) {
      steps.push(match[1].trim());
    }
    
    // Si no se encontraron pasos numerados, buscar líneas con guiones
    if (steps.length === 0) {
      const stepPattern2 = /^[-•]\s+(.+)$/gm;
      while ((match = stepPattern2.exec(text)) !== null) {
        steps.push(match[1].trim());
      }
    }
    
    return steps;
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
        this.shouldScroll = true;
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

  deleteSession(sessionId: string): void {
    const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return;
    
    this.sessions.splice(sessionIndex, 1);
    
    // Si eliminamos la sesión activa, seleccionar otra
    if (this.activeSessionId === sessionId) {
      if (this.sessions.length > 0) {
        this.activeSessionId = this.sessions[0].id;
        this.messages = this.sessions[0].messages;
      } else {
        this.createNewSession();
      }
    }
    
    this.saveSessionsToStorage();
    this.saveActiveSession();
    
    // Si no quedan sesiones, salir del modo eliminación
    if (this.sessions.length === 0) {
      this.isDeleteMode = false;
    }
  }

  toggleDeleteMode(): void {
    this.isDeleteMode = !this.isDeleteMode;
  }
}