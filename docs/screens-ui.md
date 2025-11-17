# Pantallas y Diseño UI/UX - EventMaster WL

## 🎨 Sistema de Theming White Label

### Theme Context Structure

```typescript
interface TenantTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    error: string;
    warning: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    headerImageUrl?: string;
    loginBackgroundUrl?: string;
  };
  layout: {
    headerHeight: string;
    footerHeight: string;
    borderRadius: string;
    shadow: string;
  };
}
```

---

## 📱 Pantallas Públicas

### 1. Página Pública del Evento

**Ruta:** `/{tenant_slug}/evento/{event_slug}`

**Componentes:**
- Header con logo del tenant
- Hero banner con imagen del evento
- Información del evento (título, descripción, fecha, ubicación)
- Botón de registro destacado
- Mapa (si es presencial)
- Footer personalizado

**Layout:**
```
┌─────────────────────────────────────┐
│ [Tenant Logo]          [Menu]        │ ← Header
├─────────────────────────────────────┤
│                                     │
│      [Event Banner Image]           │
│                                     │
├─────────────────────────────────────┤
│ [Event Title]                       │
│ [Date/Time]                         │
│ [Location]                          │
│                                     │
│ [Description]                       │
│                                     │
│ [Register Button] ← Primary Color   │
│                                     │
│ [Map if location]                   │
│                                     │
├─────────────────────────────────────┤
│ [Tenant Footer]                     │
└─────────────────────────────────────┘
```

**Estados:**
- Evento publicado y registro abierto → Botón "Registrarse"
- Evento publicado pero registro cerrado → Botón "Registro Cerrado" (disabled)
- Evento cancelado → Banner "Evento Cancelado"
- Capacidad llena → Botón "Lista de Espera"

---

### 2. Formulario de Registro

**Ruta:** `/{tenant_slug}/evento/{event_slug}/registro`

**Componentes:**
- Header con logo
- Formulario de registro
- Validación en tiempo real
- Botón de envío

**Layout:**
```
┌─────────────────────────────────────┐
│ [Tenant Logo]                        │
├─────────────────────────────────────┤
│                                     │
│  Register for [Event Name]          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Name *                       │   │
│  │ [Input Field]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Email *                      │   │
│  │ [Input Field]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Phone                        │   │
│  │ [Input Field]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Custom Fields if any]             │
│                                     │
│  [Register Button]                  │
│                                     │
│  [Back to Event]                    │
│                                     │
└─────────────────────────────────────┘
```

**Validaciones Visuales:**
- Campos requeridos marcados con *
- Errores en rojo debajo del campo
- Botón disabled hasta que el formulario sea válido
- Loading state durante el envío

---

### 3. Página de Éxito

**Ruta:** `/{tenant_slug}/evento/{event_slug}/exito`

**Componentes:**
- Mensaje de confirmación
- Preview del QR code
- Botones de acción (Wallet, Email, Calendar)
- Información del evento

**Layout:**
```
┌─────────────────────────────────────┐
│ [Tenant Logo]                        │
├─────────────────────────────────────┤
│                                     │
│      ✓ Registration Successful!     │
│                                     │
│  Hi [Name],                         │
│  You're registered for:             │
│  [Event Title]                      │
│                                     │
│  ┌─────────────┐                    │
│  │             │                    │
│  │  [QR Code]  │                    │
│  │             │                    │
│  └─────────────┘                    │
│                                     │
│  [Add to Apple Wallet]              │
│  [Add to Google Wallet]             │
│                                     │
│  [Download QR Code]                 │
│  [Add to Calendar]                  │
│                                     │
│  An email has been sent to:         │
│  [Email]                            │
│                                     │
│  [View Event Details]               │
│                                     │
└─────────────────────────────────────┘
```

---

## 🏢 Pantallas del Dashboard (Tenant)

### 4. Login / Sign Up

**Ruta:** `/{tenant_slug}/login` o `/login?tenant={slug}`

**Componentes:**
- Background personalizado del tenant
- Formulario de login
- Link a "Forgot Password"
- Link a "Sign Up"

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│  [Background Image]                 │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [Tenant Logo]                │   │
│  │                              │   │
│  │  Welcome Back                │   │
│  │                              │   │
│  │  Email                       │   │
│  │  [Input]                     │   │
│  │                              │   │
│  │  Password                    │   │
│  │  [Input]                     │   │
│  │                              │   │
│  │  [Login Button]              │   │
│  │                              │   │
│  │  [Forgot Password?]          │   │
│  │  [Sign Up]                   │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

### 5. Dashboard Principal

**Ruta:** `/dashboard`

**Componentes:**
- Sidebar de navegación
- Stats cards
- Gráficos
- Lista de eventos recientes
- Quick actions

**Layout:**
```
┌──────┬──────────────────────────────┐
│      │ [Header: Logo + User Menu]   │
│ Side │──────────────────────────────│
│ bar  │                              │
│      │  ┌──────┐ ┌──────┐ ┌──────┐ │
│ -    │  │Total │ │Total │ │Check-│ │
│ Dash │  │Events│ │Part. │ │ins   │ │
│ -    │  └──────┘ └──────┘ └──────┘ │
│ Event│                              │
│ -    │  [Weekly Stats Chart]        │
│ Part.│                              │
│ -    │  Upcoming Events            │
│ Check│  ┌────────────────────────┐ │
│ -    │  │ Event 1                │ │
│ Set. │  │ Event 2                │ │
│      │  │ Event 3                │ │
│      │  └────────────────────────┘ │
│      │                              │
│      │  [Create Event Button]     │
└──────┴──────────────────────────────┘
```

**Stats Cards:**
- Total Events (con badge de estado)
- Total Participants
- Total Check-ins
- Upcoming Events Count

---

### 6. Lista de Eventos

**Ruta:** `/events`

**Componentes:**
- Filtros (status, fecha)
- Búsqueda
- Tabla/Grid de eventos
- Paginación
- Acciones rápidas

**Layout:**
```
┌─────────────────────────────────────┐
│ Events                              │
│                                     │
│ [Search] [Filter: All] [Create New] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐│
│ │ [Thumb] Event Title              ││
│ │         Status: Published        ││
│ │         Date: Jan 1, 2024        ││
│ │         Participants: 1250/5000 ││
│ │         [View] [Edit] [Delete]   ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ [Thumb] Event 2                 ││
│ └─────────────────────────────────┘│
│                                     │
│ [< Previous] [Next >]               │
└─────────────────────────────────────┘
```

---

### 7. Crear/Editar Evento

**Ruta:** `/events/new` o `/events/{id}/edit`

**Componentes:**
- Multi-step form
- Preview en tiempo real
- Upload de imágenes
- Date/time picker
- Map picker

**Layout (Step 1 - Basic Info):**
```
┌─────────────────────────────────────┐
│ Create Event                         │
│ [Step 1/4] ●○○○                      │
├─────────────────────────────────────┤
│                                     │
│  Title *                            │
│  [Input]                            │
│                                     │
│  Slug *                             │
│  [Input] [Auto-generate]            │
│                                     │
│  Description                        │
│  [Textarea]                         │
│                                     │
│  Banner Image                       │
│  [Upload] or [URL]                  │
│  [Preview]                          │
│                                     │
│  [Cancel] [Next Step →]             │
│                                     │
└─────────────────────────────────────┘
```

**Layout (Step 2 - Location):**
```
┌─────────────────────────────────────┐
│ Create Event                         │
│ [Step 2/4] ○●○○                      │
├─────────────────────────────────────┤
│                                     │
│  Event Type                         │
│  ○ In-Person  ● Online              │
│                                     │
│  Location Name *                    │
│  [Input]                            │
│                                     │
│  Address *                          │
│  [Input]                            │
│                                     │
│  [Map Picker]                       │
│                                     │
│  [← Previous] [Next Step →]         │
│                                     │
└─────────────────────────────────────┘
```

**Layout (Step 3 - Dates):**
```
┌─────────────────────────────────────┐
│ Create Event                         │
│ [Step 3/4] ○○●○                      │
├─────────────────────────────────────┤
│                                     │
│  Start Date & Time *                │
│  [Date Picker] [Time Picker]        │
│                                     │
│  End Date & Time *                  │
│  [Date Picker] [Time Picker]        │
│                                     │
│  Timezone *                         │
│  [Select]                           │
│                                     │
│  ☐ All Day Event                    │
│                                     │
│  [← Previous] [Next Step →]         │
│                                     │
└─────────────────────────────────────┘
```

**Layout (Step 4 - Settings):**
```
┌─────────────────────────────────────┐
│ Create Event                         │
│ [Step 4/4] ○○○●                      │
├─────────────────────────────────────┤
│                                     │
│  Capacity *                         │
│  [Number Input]                     │
│                                     │
│  Registration                       │
│  ☑ Enable Registration              │
│  Opens: [Date/Time]                 │
│  Closes: [Date/Time]                │
│                                     │
│  Notifications                      │
│  ☑ Send QR on Registration          │
│  ☑ Send Reminder 24h Before        │
│  ☑ Send Reminder 1h Before         │
│                                     │
│  [← Previous] [Review & Publish]     │
│                                     │
└─────────────────────────────────────┘
```

---

### 8. Configuración de Branding

**Ruta:** `/settings/branding`

**Componentes:**
- Color pickers
- Logo upload
- Font selector
- Live preview
- Header/footer editor

**Layout:**
```
┌─────────────────────────────────────┐
│ Branding Settings                    │
├──────────┬──────────────────────────┤
│          │                          │
│ Settings │  Live Preview            │
│          │  ┌────────────────────┐  │
│ Colors   │  │ [Preview Site]     │  │
│ ──────── │  │                    │  │
│ Primary  │  │                    │  │
│ [Picker] │  │                    │  │
│          │  │                    │  │
│ Second.  │  │                    │  │
│ [Picker] │  │                    │  │
│          │  └────────────────────┘  │
│ Logo     │                          │
│ [Upload] │                          │
│          │                          │
│ Font     │                          │
│ [Select] │                          │
│          │                          │
│ [Save]   │                          │
└──────────┴──────────────────────────┘
```

---

### 9. Lista de Participantes

**Ruta:** `/events/{event_id}/participants`

**Componentes:**
- Búsqueda y filtros
- Tabla de participantes
- Acciones masivas
- Export CSV

**Layout:**
```
┌─────────────────────────────────────┐
│ Participants - [Event Name]         │
│                                     │
│ [Search] [Filter: All] [Export CSV] │
├─────────────────────────────────────┤
│ ☐ Name        Email      Status    │
│ ☐ John Doe    j@e.com    Checked In│
│ ☐ Jane Smith  j2@e.com   Registered│
│ ☐ Bob Wilson  b@e.com    Checked In│
│                                     │
│ [Select All] [Bulk Actions ▼]       │
│                                     │
│ [< Previous] [Next >]               │
│ Showing 1-50 of 1250                │
└─────────────────────────────────────┘
```

---

### 10. Detalle de Participante

**Ruta:** `/participants/{participant_id}`

**Componentes:**
- Información del participante
- QR code preview
- Historial de check-in
- Acciones (resend QR, etc.)

**Layout:**
```
┌─────────────────────────────────────┐
│ Participant Details                  │
├─────────────────────────────────────┤
│                                     │
│  Registration #: REG-2024-001234    │
│                                     │
│  Name: Jane Smith                   │
│  Email: jane@example.com            │
│  Phone: +1234567890                 │
│                                     │
│  Event: Summer Music Festival 2024  │
│  Registered: Jan 1, 2024            │
│                                     │
│  Status: ✓ Checked In               │
│  Checked In: Jan 15, 2024 10:30 AM  │
│                                     │
│  ┌─────────────┐                    │
│  │ [QR Code]   │                    │
│  └─────────────┘                    │
│                                     │
│  [Resend QR] [Download QR]          │
│  [View Wallet Pass]                  │
│                                     │
│  [Back to List]                     │
└─────────────────────────────────────┘
```

---

### 11. Check-in Scanner

**Ruta:** `/checkin` o `/checkin/{event_id}`

**Componentes:**
- Camera scanner
- Manual entry
- Lista de check-ins recientes
- Estadísticas en tiempo real

**Layout:**
```
┌─────────────────────────────────────┐
│ Check-in Scanner                     │
│                                     │
│ Event: [Select Event ▼]             │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │    [Camera View]            │   │
│  │                             │   │
│  │    Point at QR Code         │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Or enter code manually:            │
│  [Input Field]                      │
│                                     │
├─────────────────────────────────────┤
│ Recent Check-ins                    │
│ ─────────────────────────────────── │
│ ✓ Jane Smith - 10:30 AM             │
│ ✓ John Doe - 10:25 AM               │
│                                     │
│ Stats: 850/1250 checked in (68%)    │
└─────────────────────────────────────┘
```

---

## 🎨 Componentes Reutilizables

### Button Component
```typescript
<Button 
  variant="primary" // primary, secondary, outline, ghost
  size="md"        // sm, md, lg
  loading={false}
  disabled={false}
>
  Click Me
</Button>
```

### Input Component
```typescript
<Input
  label="Email"
  type="email"
  required
  error="Invalid email"
  placeholder="Enter your email"
/>
```

### Card Component
```typescript
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>
```

### Modal Component
```typescript
<Modal 
  isOpen={true}
  onClose={() => {}}
  title="Confirm Action"
>
  Content
</Modal>
```

---

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Adaptaciones Móviles
- Sidebar colapsable en mobile
- Tablas scrollables horizontalmente
- Formularios en una columna
- Botones full-width en mobile
- Scanner de QR a pantalla completa

---

## 🎯 Principios de UX

1. **Claridad**: Información clara y concisa
2. **Consistencia**: Mismos patrones en toda la app
3. **Feedback**: Loading states, success/error messages
4. **Accesibilidad**: ARIA labels, keyboard navigation
5. **Performance**: Lazy loading, optimización de imágenes
6. **White Label**: Todo personalizable por tenant

---

## 🚀 Estados y Animaciones

### Loading States
- Skeleton loaders para contenido
- Spinners para acciones
- Progress bars para uploads

### Success States
- Toast notifications
- Checkmark animations
- Confetti (opcional para registros)

### Error States
- Inline error messages
- Toast notifications
- Error boundaries

### Transitions
- Page transitions suaves
- Modal fade in/out
- Button hover effects
- Card hover effects

