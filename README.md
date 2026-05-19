# Travelia
Plataforma Web de Turismo y Red Social

Travelia es un ecosistema digital integral diseñado para conectar a viajeros con establecimientos turísticos. La plataforma combina la agilidad de una red social con la robustez de un sistema de gestión transaccional, permitiendo desde la interacción social hasta la reserva formal de servicios.

---

## Capacidades del Sistema

El proyecto se divide en cuatro módulos estratégicos que definen su propuesta de valor:

### 1. Red Social Turística
Interacción social dinámica centrada en el turismo. Los usuarios pueden:
*   Generar publicaciones compartiendo experiencias, tours o visitas a sitios turísticos.
*   Interactuar mediante un sistema de likes y comentarios gestionados en arquitectura NoSQL[cite: 1].
*   Etiquetar negocios registrados en sus publicaciones para vincular experiencias con perfiles reales[cite: 1].
*   Gestionar una red de amistades mediante solicitudes de envío, aceptación y rechazo[cite: 1].

### 2. Gestión de Negocios (Hoteles y Restaurantes)
Los empresarios disponen de herramientas para digitalizar y gestionar sus establecimientos[cite: 1]:
*   Perfiles corporativos con galería de imágenes, descripción y ubicación física[cite: 1].
*   Publicaciones exclusivas de negocio que aparecen en el feed general con diferenciación visual[cite: 1].
*   Sistema de reseñas y calificaciones de 1 a 5 estrellas para generar promedios de confianza[cite: 1].

### 3. Motor de Reservas
Sistema transaccional con reglas de negocio para la gestión de disponibilidad[cite: 1]:
*   **Gestión de Mesas:** Los propietarios configuran mesas por número y capacidad[cite: 1].
*   **Reservas en Tiempo Real:** Los usuarios seleccionan fecha, hora y número de personas con validación de disponibilidad[cite: 1].
*   **Control de Estado:** Seguimiento de reservas en estados pendiente, confirmada o cancelada[cite: 1].

### 4. Auditoría y Trazabilidad
El sistema implementa un registro automático de acciones relevantes para garantizar la seguridad[cite: 1]:
*   Persistencia en MongoDB de inicios de sesión, publicaciones, comentarios y reservas[cite: 1].
*   Capacidad de filtrado por usuario, tipo de acción y rango de fechas para administradores[cite: 1].

---

## Stack Tecnológico

| Capa | Tecnología | Rol |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS | Interfaz de usuario y renderizado responsivo[cite: 1] |
| **Backend** | Python, Flask | API REST, lógica de negocio y autenticación JWT[cite: 1] |
| **Base de datos SQL** | MySQL | Datos de usuarios, negocios, publicaciones y reservas[cite: 1] |
| **Base de datos NoSQL** | MongoDB | Comentarios, likes y registros de auditoría[cite: 1] |

---

## Especificaciones de Diseño

La interfaz utiliza una estética **Glassmorphism** basada en superficies translúcidas y una arquitectura de variables CSS para alternar entre temas[cite: 1].

### Modo Oscuro
| Muestra | Variable | Valor | Aplicación |
| :---: | :--- | :--- | :--- |
| ![](https://singlecolorimage.com/get/0F0E2A/20x20) | `--bg-deep` | `#0F0E2A` | Fondo principal[cite: 1] |
| ![](https://singlecolorimage.com/get/1A1840/20x20) | `--bg-mid` | `#1A1840` | Fondo secundario[cite: 1] |
| ![](https://singlecolorimage.com/get/6C63FF/20x20) | `--primary` | `#6C63FF` | Acento principal[cite: 1] |
| ![](https://singlecolorimage.com/get/8B85FF/20x20) | `--primary-light` | `#8B85FF` | Hover o activos[cite: 1] |
| ![](https://singlecolorimage.com/get/4A42CC/20x20) | `--primary-dark` | `#4A42CC` | Sombras o gradientes[cite: 1] |
| ![](https://singlecolorimage.com/get/00D4AA/20x20) | `--accent` | `#00D4AA` | Verde para destacados[cite: 1] |
| ![](https://singlecolorimage.com/get/FF7B54/20x20) | `--accent-warm` | `#FF7B54` | Coral (negocios o alertas)[cite: 1] |
| ![](https://singlecolorimage.com/get/FFFFFF/20x20) | `--glass-bg` | `rgba(255,255,255,0.07)` | Tarjetas glass[cite: 1] |
| ![](https://singlecolorimage.com/get/FFFFFF/20x20) | `--glass-border` | `rgba(255,255,255,0.15)` | Bordes glass[cite: 1] |
| ![](https://singlecolorimage.com/get/F0EEFF/20x20) | `--text-primary` | `#F0EEFF` | Texto principal[cite: 1] |
| ![](https://singlecolorimage.com/get/F0EEFF/20x20) | `--text-secondary` | `rgba(240,238,255,0.65)` | Texto secundario[cite: 1] |
| ![](https://singlecolorimage.com/get/F0EEFF/20x20) | `--text-muted` | `rgba(240,238,255,0.40)` | Texto silenciado[cite: 1] |

### Modo Claro
| Muestra | Variable | Valor | Aplicación |
| :---: | :--- | :--- | :--- |
| ![](https://singlecolorimage.com/get/F4F3FF/20x20) | `--bg-deep` | `#F4F3FF` | Fondo principal[cite: 1] |
| ![](https://singlecolorimage.com/get/ECEAFF/20x20) | `--bg-mid` | `#ECEAFF` | Fondo secundario[cite: 1] |
| ![](https://singlecolorimage.com/get/6C63FF/20x20) | `--primary` | `#6C63FF` | Acento principal[cite: 1] |
| ![](https://singlecolorimage.com/get/5750DD/20x20) | `--primary-light` | `#5750DD` | Hover o activos[cite: 1] |
| ![](https://singlecolorimage.com/get/4A42CC/20x20) | `--primary-dark` | `#4A42CC` | Gradientes[cite: 1] |
| ![](https://singlecolorimage.com/get/00A882/20x20) | `--accent` | `#00A882` | Verde teal oscurecido[cite: 1] |
| ![](https://singlecolorimage.com/get/E8602A/20x20) | `--accent-warm` | `#E8602A` | Coral[cite: 1] |
| ![](https://singlecolorimage.com/get/FFFFFF/20x20) | `--glass-bg` | `rgba(255,255,255,0.75)` | Tarjetas glass[cite: 1] |
| ![](https://singlecolorimage.com/get/6C63FF/20x20) | `--glass-border` | `rgba(108,99,255,0.15)` | Bordes glass[cite: 1] |
| ![](https://singlecolorimage.com/get/1A1740/20x20) | `--text-primary` | `#1A1740` | Texto principal[cite: 1] |
| ![](https://singlecolorimage.com/get/1A1740/20x20) | `--text-secondary` | `rgba(26,23,64,0.70)` | Texto secundario[cite: 1] |
| ![](https://singlecolorimage.com/get/1A1740/20x20) | `--text-muted` | `rgba(26,23,64,0.45)` | Texto silenciado[cite: 1] |

---

## Implementación de Estilos (CSS)

```css
:root {
  --bg-deep: #0F0E2A;
  --bg-mid: #1A1840;
  --primary: #6C63FF;
  --primary-light: #8B85FF;
  --primary-dark: #4A42CC;
  --accent: #00D4AA;
  --accent-warm: #FF7B54;
  --glass-bg: rgba(255, 255, 255, 0.07);
  --glass-border: rgba(255, 255, 255, 0.15);
  --text-primary: #F0EEFF;
  --text-secondary: rgba(240, 238, 255, 0.65);
  --text-muted: rgba(240, 238, 255, 0.40);
}

[data-theme='light'] {
  --bg-deep: #F4F3FF;
  --bg-mid: #ECEAFF;
  --primary: #6C63FF;
  --primary-light: #5750DD;
  --primary-dark: #4A42CC;
  --accent: #00A882;
  --accent-warm: #E8602A;
  --glass-bg: rgba(255, 255, 255, 0.75);
  --glass-border: rgba(108, 99, 255, 0.15);
  --text-primary: #1A1740;
  --text-secondary: rgba(26, 23, 64, 0.70);
  --text-muted: rgba(26, 23, 64, 0.45);
}