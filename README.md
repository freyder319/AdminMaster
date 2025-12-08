# AdminMaster - Sistema de Gestión Empresarial

[![Angular](https://img.shields.io/badge/Angular-v19.2.15-DD0031?logo=angular)](https://angular.io/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.8-7952B3?logo=bootstrap)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

AdminMaster es una solución integral de gestión empresarial que combina un punto de venta con herramientas administrativas avanzadas, diseñada para optimizar las operaciones de pequeños y medianos negocios.

## 🚀 Características Principales

### 💼 Gestión de Ventas
- Punto de venta intuitivo
- Gestión de cajas y cierres
- Control de inventario en tiempo real
- Generación de facturas y recibos

### 👥 Gestión de Personal
- Control de acceso por roles (Admin, Empleado)
- Gestión de turnos y horarios
- Seguimiento de actividades
- Reportes de rendimiento

### 📊 Análisis y Reportes
- Dashboard interactivo
- Reportes de ventas y ganancias
- Análisis de inventario
- Estadísticas de rendimiento

### 🤖 Asistente de IA Integrado
- Chat interactivo con historial
- Guías paso a paso
- Soporte 24/7
- Análisis predictivo

## 🛠️ Tecnologías Utilizadas

- **Frontend:** 
  - Angular 19
  - TypeScript
  - Bootstrap 5
  - Chart.js
  - Ngx-toastr

- **Herramientas:**
  - Angular CLI
  - RxJS
  - SweetAlert2
  - ExcelJS

## 🚀 Instalación

1. Clona el repositorio:
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd AdminMaster
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   ```bash
   cp src/environments/environment.ts.example src/environments/environment.ts
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   ng serve
   ```

5. Abre tu navegador en:
   ```
   http://localhost:4200
   ```

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── auth/               # Autenticación y autorización
│   ├── admin_principal/    # Panel de administración
│   ├── clientes/           # Gestión de clientes
│   ├── empleados/          # Gestión de empleados
│   ├── inventory/          # Gestión de inventario
│   ├── ventas/             # Módulo de ventas
│   ├── reportes/           # Reportes y estadísticas
│   ├── agente-ia/          # Asistente de IA
│   └── shared/             # Componentes compartidos
├── assets/                 # Recursos estáticos
└── environments/           # Configuraciones de entorno
```

## 📦 Scripts Disponibles

- `ng serve` - Inicia el servidor de desarrollo
- `ng build` - Compila la aplicación para producción
- `ng test` - Ejecuta las pruebas unitarias
- `ng e2e` - Ejecuta pruebas end-to-end

## 🌐 Navegadores Compatibles

- Chrome (última versión)
- Firefox (última versión)
- Edge (última versión)
- Safari (última versión)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, lee nuestras [pautas de contribución](CONTRIBUTING.md) antes de enviar un pull request.

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 📧 Contacto

¿Preguntas o comentarios? Contáctanos en [freyderjapo@gmail.co](mailto:freyderjapo@gmail.com)
