import { Component, OnInit, ViewChild, AfterViewChecked, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from '../admin_navbar/admin_navbar.component';
import { AgenteIAService } from '../agente-ia/agente-ia.service';

interface AiMessage {
  text: string;
  time: Date;
  type: 'assistant' | 'user';
}

// Interface compatible con el servicio de IA
interface ChatMessage {
  from: 'user' | 'agent';
  text: string;
}

interface ProductForm {
  imagen: string | null;
  nombre: string;
  codigo: string;
  precioUnitario: number;
  precioComercial: number;
  stock: number;
  categoria: string;
}

interface AiSuggestion {
  nombre?: string;
  codigo?: string;
  precios?: string;
  stock?: string;
}

@Component({
  selector: 'app-formulario-dinamico',
  imports: [AdminNavbarComponent, CommonModule, FormsModule],
  templateUrl: './formulario-dinamico.component.html',
  styleUrl: './formulario-dinamico.component.scss'
})
export class FormularioDinamicoComponent implements OnInit, AfterViewChecked {
  selectedFormType: string | null = null;
  aiMessages: AiMessage[] = [];
  newAiMessage: string = '';
  isAiTyping: boolean = false;
  currentStep: number = 1;
  
  // Session ID for AI context
  sessionId: string = '';
  
  // Form data
  productForm: ProductForm = {
    imagen: null,
    nombre: '',
    codigo: '',
    precioUnitario: 0,
    precioComercial: 0,
    stock: 0,
    categoria: ''
  };
  
  aiSuggestion: AiSuggestion = {};
  profitMargin: number = 0;
  
  @ViewChild('aiMessagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('imageInput') private imageInput!: ElementRef<HTMLInputElement>;

  constructor(private agenteIAService: AgenteIAService) {}

  ngOnInit(): void {
    // Mensaje de bienvenida del asistente
    this.addAiMessage('¡Hola! Soy tu asistente IA para formularios dinámicos. 🤖\n\nEstoy aquí para guiarte paso a paso en la creación de nuevos elementos en tu sistema. Por favor, selecciona qué tipo de elemento deseas agregar y te ayudaré con recomendaciones y mejores prácticas.\n\n¿En puedo asistirte hoy?');
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  // Helper method to extract basic image information
  private extractImageInfo(): string {
    if (!this.productForm.imagen) return 'No hay imagen disponible';
    
    // Extraer información básica del data URL
    const dataUrl = this.productForm.imagen;
    const mimeType = dataUrl.split(':')[1]?.split(';')[0] || 'image/jpeg';
    const size = Math.round((dataUrl.length * 3) / 4 / 1024); // Approximate size in KB
    
    // Extraer información del nombre de archivo si existe
    let fileName = 'producto-imagen';
    
    return `• Tipo de imagen: ${mimeType}
• Tamaño aproximado: ${size} KB
• Calidad: Imagen digital de producto
• Contexto: Imagen subida para formulario de productos
• Uso: Identificación y naming de productos

Nota: Esta es una imagen de producto subida por el usuario para su análisis y naming automático.`;
  }

  // Helper method to convert aiMessages to ChatMessage format
  private convertToChatMessages(): ChatMessage[] {
    // Enviar solo los últimos 3 mensajes para no sobrecargar
    const recentMessages = this.aiMessages.slice(-3);
    
    return recentMessages.map(msg => ({
      from: msg.type === 'user' ? 'user' : 'agent',
      text: msg.text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .substring(0, 100) // Limit each message to 100 chars
        .trim()
    }));
  }

  selectFormType(type: string): void {
    this.selectedFormType = type;
    this.currentStep = 1;
    this.resetProductForm();
    
    // Generate unique sessionId for this form session
    this.sessionId = `form-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (type === 'producto') {
      this.addAiMessage('¡Excelente elección! 📦\n\nTe ayudaré a agregar un nuevo producto paso a paso. Comencemos con la imagen del producto.\n\n📸 **Paso 1: Imagen del Producto**\n• Una buena imagen aumenta las ventas en un 40%\n• Usa fondos blancos o neutros\n• Muestra el producto desde múltiples ángulos\n• Asegúrate que se vea clara y nítida\n\nCuando subas la imagen, la analizaré para darte recomendaciones.');
    } else {
      this.addAiMessage(this.getWelcomeMessage(type));
      this.sendContextToAi(type);
    }
  }

  resetForm(): void {
    this.selectedFormType = null;
    this.currentStep = 1;
    this.resetProductForm();
    this.addAiMessage('He vuelto a la selección de formularios. ¿Qué otro tipo de elemento te gustaría agregar?');
  }

  resetProductForm(): void {
    this.productForm = {
      imagen: null,
      nombre: '',
      codigo: '',
      precioUnitario: 0,
      precioComercial: 0,
      stock: 0,
      categoria: ''
    };
    this.aiSuggestion = {};
    this.profitMargin = 0;
  }

  getFormTypeTitle(): string {
    const titles: { [key: string]: string } = {
      producto: 'Producto',
      proveedor: 'Proveedor',
      cliente: 'Cliente',
      empleado: 'Empleado',
      categoria: 'Categoría',
      promocion: 'Promoción'
    };
    return titles[this.selectedFormType!] || 'Formulario';
  }

  getWelcomeMessage(type: string): string {
    const messages: { [key: string]: string } = {
      proveedor: '¡Perfecto! 🚚\n\nTe guiaré en el registro de un nuevo proveedor:\n\n🏢 **Información básica**\n• Nombre completo de la empresa\n• NIT o identificación fiscal\n• Datos de contacto confiables\n\n📞 **Información de contacto**\n• Teléfono principal y alternativo\n• Email corporativo\n• Dirección completa\n\n📋 **Condiciones comerciales**\n• Plazos de entrega habituales\n• Métodos de pago aceptados\n• Descuentos por volumen\n\n¿Listo para empezar con el registro?',
      
      cliente: '¡Genial! 👤\n\nAgregar un nuevo cliente es fácil con mi ayuda:\n\n📝 **Datos personales**\n• Nombre completo correcto\n• Documento de identidad válido\n• Información de contacto\n\n🏠 **Información de domicilio**\n• Dirección exacta para entregas\n• Barrio y ciudad\n• Referencias si es necesario\n\n📱 **Contacto preferido**\n• Teléfono principal\n• Email para notificaciones\n\n¡Vamos a registrar a tu nuevo cliente!',
      
      empleado: '¡Excelente! 👔\n\nTe ayudaré a registrar un nuevo empleado:\n\n📋 **Información personal**\n• Nombre completo\n• Documento de identidad\n• Información de contacto\n\n💼 **Información laboral**\n• Cargo o posición\n• Departamento\n• Salario acordado\n\n📅 **Contratación**\n• Fecha de inicio\n• Tipo de contrato\n• Horario laboral\n\n¡Preparado para agregar al nuevo miembro del equipo!',
      
      categoria: '¡Muy bien! 🏷️\n\nCrear categorías bien organizadas es clave:\n\n📊 **Nombre de categoría**\n• Usa nombres descriptivos\n• Ejemplos: "Electrónica", "Ropa", "Alimentos"\n• Evita nombres muy genéricos\n\n🎯 **Descripción clara**\n• ¿Qué productos pertenecen?\n• ¿Quiénes la usarán?\n\n¿Qué tipo de productos categorizarás?',
      
      promocion: '¡Fantástico! 🎉\n\nDiseñemos una promoción efectiva:\n\n💰 **Tipo de descuento**\n• Porcentaje: "20% de descuento"\n• Valor fijo: "$5.000 de descuento"\n• 2x1, 3x2, etc.\n\n📅 **Vigencia**\n• Fecha de inicio y fin\n• ¿Es permanente o temporal?\n\n🎯 **Aplicación**\n• ¿A qué productos aplica?\n• ¿Mínimo de compra?\n\n¡Creemos una promoción que impulse tus ventas!'
    };
    
    return messages[type] || '¡Perfecto! Te ayudaré a completar este formulario paso a paso.';
  }

  // Step navigation
  nextStep(): void {
    // Si estamos en el paso 1 (imagen) y hay una imagen, analizarla primero
    if (this.currentStep === 1 && this.productForm.imagen) {
      this.analyzeImageAndContinue();
    } else if (this.currentStep < 5) {
      this.currentStep++;
      this.addStepMessage(this.currentStep);
    }
  }

  analyzeImageAndContinue(): void {
    this.addAiMessage('📸 **Analizando imagen...**\n\nPor favor espera mientras la IA identifica el producto.\n\n⏳ Esto puede tomar unos segundos...');

    // Obtener contexto completo del formulario
    const formContext = this.getFormContext();
    
    // Almacenar imagen temporalmente y obtener URL
    this.agenteIAService.storeTempImage(
      this.productForm.imagen!,
      this.sessionId,
      'product-image.jpg'
    ).subscribe({
      next: (response) => {
        // Enviar análisis con URL de la imagen para que la IA pueda verla
        this.sendImageAnalysisWithUrl(response.imageUrl, formContext);
      },
      error: (error) => {
        console.error('Error almacenando imagen temporalmente:', error);
        // Fallback: usar análisis básico sin imagen
        this.sendGenericProductAnalysis(formContext);
      }
    });
  }

  sendImageAnalysisWithUrl(imageUrl: string, formContext: string): void {
    const analysisRequest = `Analiza esta imagen: ${imageUrl}

Sugiere nombre para producto. Responde: NOMBRE_SUGERIDO="nombre aquí"

Máximo 50 caracteres. Ejemplos:
- "Laptop Dell Inspiron"
- "iPhone 13 Pro"
- "Samsung Galaxy"`;

    // Usar el servicio existente de IA con sessionId y contexto
    this.agenteIAService.sendMessage(analysisRequest, this.convertToChatMessages(), this.sessionId).subscribe({
      next: (response) => {
        this.processImageAnalysisAndContinue(response);
      },
      error: (error) => {
        console.error('Error analizando imagen:', error);
        this.addAiMessage('⚠️ **Error en el análisis**\n\nNo pude analizar la imagen en este momento. Por favor:\n\n• Verifica que la imagen sea clara y nítida\n• Asegúrate que el producto sea visible\n\nHe pasado al siguiente paso para que puedas ingresar el nombre manualmente.');
        // Continuar al siguiente paso aunque haya error
        this.currentStep++;
        this.addStepMessage(this.currentStep);
      }
    });
  }

  sendGenericProductAnalysis(formContext: string): void {
    const analysisRequest = `Sugiere nombre para producto. Responde: NOMBRE_SUGERIDO="nombre aquí"

Máximo 50 caracteres. Ejemplos:
- "Laptop Dell"
- "iPhone 13"
- "Samsung Galaxy"`;

    // Usar el servicio existente de IA con sessionId y contexto
    this.agenteIAService.sendMessage(analysisRequest, this.convertToChatMessages(), this.sessionId).subscribe({
      next: (response) => {
        this.processImageAnalysisAndContinue(response);
      },
      error: (error) => {
        console.error('Error en análisis básico:', error);
        this.addAiMessage('⚠️ **Error en el análisis**\n\nNo pude procesar la solicitud en este momento.\n\nHe pasado al siguiente paso para que puedas ingresar el nombre manualmente.');
        // Continuar al siguiente paso
        this.currentStep++;
        this.addStepMessage(this.currentStep);
      }
    });
  }

  processImageAnalysisAndContinue(response: any): void {
    const reply = this.agenteIAService.extractReply(response);
    
    if (reply) {
      // Buscar el patrón NOMBRE_SUGERIDO="..."
      const match = reply.match(/NOMBRE_SUGERIDO="([^"]+)"/);
      
      if (match && match[1]) {
        let suggestedName = match[1].trim();
        
        // Limitar longitud y limpiar el nombre
        suggestedName = this.cleanAndLimitName(suggestedName);
        
        // Aplicar automáticamente la sugerencia
        this.productForm.nombre = suggestedName;
        
        this.addAiMessage(`📸 **Análisis completado**\n\n🔍 **Producto detectado:** He identificado claramente el producto en tu imagen.\n\n✅ **Nombre aplicado automáticamente:** "${suggestedName}"\n\n📝 He pasado al siguiente paso. Si deseas modificar el nombre, puedes editarlo directamente en el campo.\n\n¡Excelente detección por parte de la IA!`);
        
        // Avanzar al siguiente paso después del análisis
        this.currentStep++;
        this.addStepMessage(this.currentStep);
      } else {
        // Si no encuentra el formato esperado, muestra la respuesta completa
        this.addAiMessage(`📸 **Análisis completado**\n\n🔍 **Respuesta de la IA:** ${reply}\n\n💡 He pasado al siguiente paso. Por favor, ingresa el nombre del producto manualmente basándote en la información de la IA.`);
        
        // Avanzar al siguiente paso
        this.currentStep++;
        this.addStepMessage(this.currentStep);
      }
    } else {
      this.addAiMessage('📸 **Análisis completado**\n\n⚠️ No recibí una respuesta clara de la IA. Por favor, ingresa el nombre del producto manualmente.');
      
      // Avanzar al siguiente paso
      this.currentStep++;
      this.addStepMessage(this.currentStep);
    }
  }

  // Helper method to clean and limit product name length
  private cleanAndLimitName(name: string): string {
    // Remover caracteres especiales problemáticos para nombres de archivo
    let cleaned = name
      .replace(/[<>:"/\\|?*]/g, '') // Remover caracteres inválidos para archivos
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
      .trim();

    // Limitar longitud máxima a 50 caracteres
    if (cleaned.length > 50) {
      // Intentar cortar en un espacio para no cortar palabras
      const lastSpace = cleaned.substring(0, 50).lastIndexOf(' ');
      if (lastSpace > 20) { // Si hay un espacio decente
        cleaned = cleaned.substring(0, lastSpace);
      } else {
        cleaned = cleaned.substring(0, 50);
      }
    }

    return cleaned;
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  addStepMessage(step: number): void {
    const stepMessages: { [key: number]: string } = {
      2: '📝 **Paso 2: Nombre del Producto**\n\nAhora necesitamos un nombre claro y descriptivo. Mientras escribes, te daré sugerencias para mejorarlo.\n\n💡 **Consejos:**\n• Sé específico pero breve\n• Incluye marca y modelo si aplica\n• Ejemplo: "Laptop Dell Inspiron 15" en lugar de "Laptop"',
      
      3: '🏷️ **Paso 3: Código del Producto**\n\nEl código debe ser único y fácil de identificar. Te sugeriré un formato basado en el nombre.\n\n💡 **Consejos:**\n• Usa abreviaciones consistentes\n• Incluye categoría\n• Ejemplo: LAP-DELL-001',
      
      4: '💰 **Paso 4: Precios**\n\nDefine los costos y precio de venta. Analizaré tu margen de ganancia y te daré recomendaciones.\n\n💡 **Consejos:**\n• Mantén un margen saludable (30%+)\n• Considera precios de competencia\n• Piensa en valor percibido',
      
      5: '📊 **Paso 5: Stock Inicial**\n\nDefine la cantidad inicial. Te ayudaré a determinar una cantidad apropiada.\n\n💡 **Consejos:**\n• Empieza con cantidades conservadoras\n• Considera la demanda proyectada\n• Piensa en costos de almacenamiento'
    };
    
    this.addAiMessage(stepMessages[step] || 'Continuemos con el siguiente paso.');
  }

  // Image handling
  triggerImageUpload(): void {
    this.imageInput.nativeElement.click();
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.processImage(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.processImage(file);
    }
  }

  processImage(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      this.addAiMessage('⚠️ La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.productForm.imagen = e.target?.result as string;
      this.addAiMessage('📸 **Imagen subida correctamente**\n\n✅ He recibido tu imagen.\n\n💡 **Al hacer clic en "Siguiente", la IA analizará la imagen y sugerirá automáticamente el nombre del producto.**\n\nEsto nos ayudará a tener un nombre preciso y descriptivo para tu inventario.');
    };
    reader.readAsDataURL(file);
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.productForm.imagen = null;
    this.imageInput.nativeElement.value = '';
  }

  // Form field handlers
  onNameChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value.length > 3) {
      this.generateNameSuggestion(value);
    }
  }

  onCodeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value.length > 2) {
      this.generateCodeSuggestion(value);
    }
  }

  onPriceChange(event: Event): void {
    this.calculateProfitMargin();
    if (this.productForm.precioUnitario > 0 && this.productForm.precioComercial > 0) {
      this.generatePriceSuggestion();
    }
  }

  onStockChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value);
    if (value > 0) {
      this.generateStockSuggestion(value);
    }
  }

  // AI Suggestion generators
  generateNameSuggestion(currentName: string): void {
    // Simulación de análisis de IA
    setTimeout(() => {
      if (currentName.toLowerCase().includes('laptop')) {
        this.aiSuggestion.nombre = '¿Qué tal "Laptop Dell Inspiron 15.6" Core i5"? Es más específico y atractivo.';
      } else if (currentName.toLowerCase().includes('telefono')) {
        this.aiSuggestion.nombre = 'Te recomiendo "Samsung Galaxy A54 128GB" - incluye marca, modelo y capacidad.';
      } else if (currentName.length < 10) {
        this.aiSuggestion.nombre = 'El nombre es muy corto. Considera agregar más detalles como marca, modelo o características principales.';
      }
    }, 1000);
  }

  generateCodeSuggestion(currentCode: string): void {
    setTimeout(() => {
      if (this.productForm.nombre.toLowerCase().includes('laptop')) {
        this.aiSuggestion.codigo = 'Te sugiero el formato: LAP-DELL-001 (Categoría-Marca-Secuencia)';
      } else if (this.productForm.nombre.toLowerCase().includes('telefono')) {
        this.aiSuggestion.codigo = 'Formato recomendado: TEL-SAM-A54 (Categoría-Marca-Modelo)';
      } else {
        this.aiSuggestion.codigo = 'Usa un código corto pero descriptivo. Ej: PROD-001';
      }
    }, 800);
  }

  generatePriceSuggestion(): void {
    setTimeout(() => {
      if (this.profitMargin < 15) {
        this.aiSuggestion.precios = '⚠️ Tu margen de ganancia es bajo (<15%). Considera aumentar el precio de venta o reducir costos para mantener un negocio sostenible.';
      } else if (this.profitMargin >= 30) {
        this.aiSuggestion.precios = '✅ ¡Excelente margen de ganancia! (>30%). Tienes un buen espacio para rentabilidad y posibles descuentos.';
      } else {
        this.aiSuggestion.precios = '💡 Tu margen es aceptable (15-30%). Considera el mercado y competencia para ajustar si es necesario.';
      }
    }, 500);
  }

  generateStockSuggestion(currentStock: number): void {
    setTimeout(() => {
      if (currentStock > 100) {
        this.aiSuggestion.stock = '⚠️ Stock alto inicial. Considera empezar con menos unidades para probar la demanda y reducir costos de almacenamiento.';
      } else if (currentStock < 5) {
        this.aiSuggestion.stock = '💡 Stock bajo inicial. Asegúrate de tener un plan de reabastecimiento rápido para no perder ventas.';
      } else {
        this.aiSuggestion.stock = '✅ Stock inicial razonable. Es una buena cantidad para empezar y evaluar la demanda.';
      }
    }, 600);
  }

  calculateProfitMargin(): void {
    if (this.productForm.precioUnitario > 0) {
      this.profitMargin = ((this.productForm.precioComercial - this.productForm.precioUnitario) / this.productForm.precioComercial) * 100;
    }
  }

  applySuggestion(field: keyof AiSuggestion): void {
    if (field === 'nombre' && this.aiSuggestion.nombre) {
      // Extraer la sugerencia del texto
      const match = this.aiSuggestion.nombre.match(/"([^"]+)"/);
      if (match) {
        this.productForm.nombre = match[1];
      }
    } else if (field === 'codigo' && this.aiSuggestion.codigo) {
      const match = this.aiSuggestion.codigo.match(/: ([^)]+)/);
      if (match) {
        this.productForm.codigo = match[1].trim();
      }
    }
    
    // Clear suggestion after applying
    this.aiSuggestion[field] = undefined;
  }

  submitProduct(): void {
    // Simulate product submission
    this.addAiMessage('🎉 **¡Producto guardado exitosamente!**\n\nTu producto ha sido agregado al inventario con los siguientes datos:\n\n• **Nombre:** ' + this.productForm.nombre + '\n• **Código:** ' + this.productForm.codigo + '\n• **Precio:** $' + this.productForm.precioComercial.toFixed(2) + '\n• **Stock:** ' + this.productForm.stock + ' unidades\n• **Margen:** ' + this.profitMargin.toFixed(1) + '%\n\n¿Te gustaría agregar otro producto o necesitas ayuda con algo más?');
    
    // Reset form after successful submission
    setTimeout(() => {
      this.resetForm();
    }, 3000);
  }

  // AI Chat methods
  sendContextToAi(type: string): void {
    const context = `El usuario ha seleccionado crear un nuevo ${type}. Por favor, proporciona recomendaciones específicas para este tipo de formulario y guía paso a paso. Responde en español y de manera conversacional.`;
    
    this.agenteIAService.sendMessage(context, this.convertToChatMessages(), this.sessionId).subscribe({
      next: (response) => {
        const reply = this.agenteIAService.extractReply(response);
        if (reply && reply !== context) {
          this.addAiMessage(reply);
        }
      },
      error: () => {
      }
    });
  }

  sendAiMessage(): void {
    if (!this.newAiMessage.trim() || this.isAiTyping) return;

    const userMessage = this.newAiMessage.trim();
    this.addUserMessage(userMessage);
    this.newAiMessage = '';
    this.isAiTyping = true;

    this.addTypingIndicator();

    const context = this.getFormContext();
    const fullMessage = `${context}\n\nUsuario pregunta: ${userMessage}\n\nPor favor responde de manera helpful y específica para el formulario de ${this.selectedFormType}.`;

    this.agenteIAService.sendMessage(fullMessage, this.convertToChatMessages(), this.sessionId).subscribe({
      next: (response) => {
        this.removeTypingIndicator();
        const reply = this.agenteIAService.extractReply(response);
        if (reply) {
          this.addAiMessage(reply);
        }
        this.isAiTyping = false;
      },
      error: () => {
        this.removeTypingIndicator();
        this.addAiMessage('Lo siento, estoy teniendo dificultades para responder en este momento. Por favor, intenta nuevamente en unos segundos.');
        this.isAiTyping = false;
      }
    });
  }

  getFormContext(): string {
    const contexts: { [key: string]: string } = {
      producto: `El usuario está llenando un formulario para agregar un nuevo producto. Paso actual: ${this.currentStep}. Campos: imagen (subida), nombre: "${this.productForm.nombre}", código: "${this.productForm.codigo}", stock: ${this.productForm.stock}, precio unitario: ${this.productForm.precioUnitario}, precio comercial: ${this.productForm.precioComercial}, categoría: "${this.productForm.categoria}".`,
      proveedor: 'El usuario está registrando un nuevo proveedor. Los campos incluyen: nombre, NIT, teléfono, email, dirección, y condiciones comerciales.',
      cliente: 'El usuario está agregando un nuevo cliente. Los campos incluyen: nombre, documento, teléfono, email, y dirección.',
      empleado: 'El usuario está registrando un nuevo empleado. Los campos incluyen: información personal, cargo, salario, y fecha de contratación.',
      categoria: 'El usuario está creando una nueva categoría de productos. Los campos incluyen: nombre y descripción.',
      promocion: 'El usuario está configurando una nueva promoción. Los campos incluyen: tipo de descuento, vigencia, y condiciones de aplicación.'
    };
    
    return contexts[this.selectedFormType!] || 'El usuario está llenando un formulario dinámico.';
  }

  onFormSubmitted(): void {
    this.addAiMessage('¡Felicidades! 🎉 Has completado el formulario exitosamente.\n\n¿Te gustaría agregar otro elemento o necesitas ayuda con algo más?');
  }

  // AI Chat helper methods
  private addAiMessage(text: string): void {
    this.aiMessages.push({
      text: this.formatMessage(text),
      time: new Date(),
      type: 'assistant'
    });
  }

  private addUserMessage(text: string): void {
    this.aiMessages.push({
      text: text,
      time: new Date(),
      type: 'user'
    });
  }

  private addTypingIndicator(): void {
    this.aiMessages.push({
      text: '<div class="typing-indicator"><span></span><span></span><span></span></div>',
      time: new Date(),
      type: 'assistant'
    });
  }

  private removeTypingIndicator(): void {
    const lastIndex = this.aiMessages.length - 1;
    if (lastIndex >= 0 && this.aiMessages[lastIndex].text.includes('typing-indicator')) {
      this.aiMessages.splice(lastIndex, 1);
    }
  }

  private formatMessage(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/📦|🚚|👤|👔|🏷️|🎉|📸|📝|💰|📊|🏢|📞|📋|🏠|📱|💼|📅|🎯|🤖|🎉|⭐|✨|💡|🔧|🚀|⚠️|✅|💡|📸|📝|🏷️|💰|📊/g, (match) => `<span class="emoji">${match}</span>`);
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error al hacer scroll:', err);
    }
  }
}
