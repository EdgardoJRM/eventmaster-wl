# Especificación Completa de APIs - EventMaster WL

## 🔐 Autenticación

Todas las APIs (excepto las públicas) requieren autenticación mediante JWT token en el header:

```
Authorization: Bearer {jwt_token}
```

El token contiene el `tenant_id` en el claim `custom:tenant_id`.

## 📋 Base URL

```
Production: https://api.eventmasterwl.com/v1
Development: https://dev-api.eventmasterwl.com/v1
```

## 🏢 Tenant APIs

### POST /tenant/create

Crea un nuevo tenant (solo para super-admin o signup).

**Request:**
```json
{
  "name": "ACME Events",
  "slug": "acme-events",
  "email": "admin@acme.com",
  "password": "SecurePass123!",
  "contact": {
    "email": "contact@acme.com",
    "phone": "+1234567890"
  },
  "branding": {
    "primary_color": "#3B82F6",
    "secondary_color": "#1E40AF"
  }
}
```

**Validaciones:**
- `slug`: Requerido, único, solo alfanumérico y guiones, 3-50 caracteres
- `email`: Requerido, formato válido, único
- `password`: Requerido, mínimo 8 caracteres, al menos 1 mayúscula, 1 número, 1 especial
- `name`: Requerido, 2-100 caracteres

**Response (201):**
```json
{
  "success": true,
  "data": {
    "tenant_id": "tenant_abc123",
    "slug": "acme-events",
    "name": "ACME Events",
    "status": "active",
    "created_at": 1704067200
  }
}
```

**Errors:**
- `400`: Validación fallida
- `409`: Slug o email ya existe
- `500`: Error del servidor

---

### GET /tenant/{tenant_id}

Obtiene información del tenant (solo el mismo tenant).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tenant_id": "tenant_abc123",
    "slug": "acme-events",
    "name": "ACME Events",
    "branding": {
      "logo_url": "https://s3.../logo.png",
      "primary_color": "#3B82F6",
      "secondary_color": "#1E40AF",
      "font_family": "Inter"
    },
    "subscription": {
      "plan": "pro",
      "status": "active"
    }
  }
}
```

**Errors:**
- `401`: No autenticado
- `403`: No autorizado (tenant diferente)
- `404`: Tenant no encontrado

---

### PUT /tenant/{tenant_id}/branding

Actualiza el branding del tenant.

**Request:**
```json
{
  "logo_url": "https://s3.../new-logo.png",
  "primary_color": "#FF5733",
  "secondary_color": "#33FF57",
  "accent_color": "#3357FF",
  "font_family": "Roboto",
  "header_image_url": "https://s3.../header.jpg",
  "login_background_url": "https://s3.../login-bg.jpg",
  "footer_text": "© 2024 ACME Events",
  "footer_links": [
    {
      "text": "Privacy",
      "url": "/privacy"
    }
  ]
}
```

**Validaciones:**
- URLs deben ser válidas
- Colores en formato hex (#RRGGBB)
- Font family debe existir en lista permitida

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tenant_id": "tenant_abc123",
    "branding": {
      "primary_color": "#FF5733",
      "updated_at": 1704067200
    }
  }
}
```

---

## 📅 Event APIs

### POST /events

Crea un nuevo evento.

**Request:**
```json
{
  "title": "Summer Music Festival 2024",
  "description": "Join us for an amazing summer festival...",
  "slug": "summer-festival-2024",
  "banner_image_url": "https://s3.../banner.jpg",
  "location": {
    "name": "Central Park",
    "address": "123 Park Ave",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "USA",
    "latitude": 40.7829,
    "longitude": -73.9654,
    "is_online": false
  },
  "dates": {
    "start": 1704067200,
    "end": 1704153600,
    "timezone": "America/New_York",
    "is_all_day": false
  },
  "capacity": 5000,
  "status": "draft",
  "registration": {
    "enabled": true,
    "opens_at": 1703980800,
    "closes_at": 1704067200,
    "requires_approval": false,
    "max_per_person": 5
  },
  "notifications": {
    "send_qr_on_registration": true,
    "send_reminder_24h": true,
    "send_reminder_1h": true
  }
}
```

**Validaciones:**
- `title`: Requerido, 3-200 caracteres
- `slug`: Requerido, único por tenant, alfanumérico y guiones
- `dates.start`: Requerido, timestamp válido, debe ser futuro
- `dates.end`: Requerido, debe ser después de start
- `capacity`: Requerido, número positivo
- `location`: Requerido si no es online

**Response (201):**
```json
{
  "success": true,
  "data": {
    "event_id": "event_abc123",
    "tenant_id": "tenant_abc123",
    "slug": "summer-festival-2024",
    "title": "Summer Music Festival 2024",
    "public_url": "https://eventmasterwl.com/acme-events/evento/summer-festival-2024",
    "status": "draft",
    "created_at": 1704067200
  }
}
```

---

### GET /events

Lista eventos del tenant (con paginación).

**Query Parameters:**
- `status`: Filtrar por estado (draft, published, cancelled)
- `limit`: Número de resultados (default: 20, max: 100)
- `next_token`: Token para paginación

**Response (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "event_id": "event_abc123",
        "title": "Summer Music Festival 2024",
        "slug": "summer-festival-2024",
        "status": "published",
        "dates": {
          "start": 1704067200,
          "end": 1704153600
        },
        "capacity": 5000,
        "registered_count": 1250,
        "checked_in_count": 850,
        "created_at": 1704067200
      }
    ],
    "next_token": "eyJ..."
  }
}
```

---

### GET /events/{event_id}

Obtiene detalles de un evento.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "event_id": "event_abc123",
    "tenant_id": "tenant_abc123",
    "slug": "summer-festival-2024",
    "title": "Summer Music Festival 2024",
    "description": "Join us...",
    "banner_image_url": "https://s3.../banner.jpg",
    "location": {
      "name": "Central Park",
      "address": "123 Park Ave",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA",
      "latitude": 40.7829,
      "longitude": -73.9654
    },
    "dates": {
      "start": 1704067200,
      "end": 1704153600,
      "timezone": "America/New_York"
    },
    "capacity": 5000,
    "registered_count": 1250,
    "checked_in_count": 850,
    "status": "published",
    "public_url": "https://eventmasterwl.com/acme-events/evento/summer-festival-2024",
    "created_at": 1704067200
  }
}
```

---

### PUT /events/{event_id}

Actualiza un evento.

**Request:** (mismo formato que POST, campos opcionales)

**Validaciones:**
- No se puede cambiar `slug` si el evento está publicado
- No se puede reducir `capacity` por debajo de `registered_count`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "event_id": "event_abc123",
    "updated_at": 1704067200
  }
}
```

---

### POST /events/{event_id}/publish

Publica un evento (cambia status a "published").

**Response (200):**
```json
{
  "success": true,
  "data": {
    "event_id": "event_abc123",
    "status": "published",
    "published_at": 1704067200
  }
}
```

---

### DELETE /events/{event_id}

Elimina un evento (soft delete, cambia status a "cancelled").

**Response (200):**
```json
{
  "success": true,
  "data": {
    "event_id": "event_abc123",
    "status": "cancelled"
  }
}
```

---

## 👥 Participant APIs

### POST /participants/register

Registra un participante en un evento (público, no requiere auth).

**Request:**
```json
{
  "event_id": "event_abc123",
  "tenant_slug": "acme-events",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "custom_fields": {
    "company": "Acme Corp",
    "dietary_restrictions": "Vegetarian"
  }
}
```

**Validaciones:**
- `event_id`: Requerido, debe existir y estar publicado
- `name`: Requerido, 2-100 caracteres
- `email`: Requerido, formato válido
- `phone`: Opcional, formato válido
- Verificar capacidad disponible
- Verificar que registro esté abierto

**Response (201):**
```json
{
  "success": true,
  "data": {
    "participant_id": "part_abc123",
    "registration_number": "REG-2024-001234",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "qr_code_url": "https://s3.../qr.png",
    "wallet_pass_url": "https://.../pass.pkpass",
    "event": {
      "title": "Summer Music Festival 2024",
      "dates": {
        "start": 1704067200
      }
    },
    "created_at": 1704067200
  }
}
```

**Errors:**
- `400`: Validación fallida
- `404`: Evento no encontrado
- `409`: Ya registrado o capacidad llena
- `410`: Registro cerrado

---

### GET /participants

Lista participantes de eventos del tenant (requiere auth).

**Query Parameters:**
- `event_id`: Filtrar por evento
- `status`: Filtrar por estado (registered, checked_in, cancelled)
- `search`: Buscar por nombre o email
- `limit`: Número de resultados (default: 50, max: 200)
- `next_token`: Token para paginación

**Response (200):**
```json
{
  "success": true,
  "data": {
    "participants": [
      {
        "participant_id": "part_abc123",
        "registration_number": "REG-2024-001234",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+1234567890",
        "event_id": "event_abc123",
        "event_title": "Summer Music Festival 2024",
        "status": "registered",
        "checked_in": false,
        "created_at": 1704067200
      }
    ],
    "next_token": "eyJ...",
    "total": 1250
  }
}
```

---

### GET /participants/{participant_id}

Obtiene detalles de un participante.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "participant_id": "part_abc123",
    "registration_number": "REG-2024-001234",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "event_id": "event_abc123",
    "event_title": "Summer Music Festival 2024",
    "qr_code_url": "https://s3.../qr.png",
    "wallet_pass_url": "https://.../pass.pkpass",
    "status": "registered",
    "checked_in": false,
    "notifications": {
      "qr_sent": true,
      "qr_sent_at": 1704067200
    },
    "created_at": 1704067200
  }
}
```

---

### POST /participants/{participant_id}/send-qr

Reenvía el QR code por email.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "participant_id": "part_abc123",
    "qr_sent": true,
    "sent_at": 1704067200
  }
}
```

---

### POST /participants/checkin

Realiza check-in de un participante escaneando QR.

**Request:**
```json
{
  "qr_code": "EVENT:event_abc123:PART:part_abc123:TENANT:tenant_abc123",
  "event_id": "event_abc123",
  "location": {
    "latitude": 40.7829,
    "longitude": -73.9654,
    "accuracy": 10
  }
}
```

**Validaciones:**
- `qr_code`: Requerido, formato válido
- Verificar que el QR pertenece al tenant correcto
- Verificar que el evento existe y está activo

**Response (200) - Success:**
```json
{
  "success": true,
  "data": {
    "participant_id": "part_abc123",
    "name": "Jane Smith",
    "status": "checked_in",
    "checked_in_at": 1704067200,
    "message": "Check-in successful"
  }
}
```

**Response (200) - Already Checked:**
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_CHECKED",
    "message": "Participant already checked in",
    "data": {
      "participant_id": "part_abc123",
      "checked_in_at": 1704067000
    }
  }
}
```

**Response (404) - Invalid:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QR",
    "message": "Invalid QR code"
  }
}
```

---

## 📧 Email & SMS APIs

### POST /email/send

Envía un email (interno, requiere auth).

**Request:**
```json
{
  "to": "jane@example.com",
  "template": "registration",
  "participant_id": "part_abc123",
  "event_id": "event_abc123",
  "variables": {
    "participant_name": "Jane Smith",
    "event_title": "Summer Music Festival 2024",
    "event_date": "2024-01-01"
  }
}
```

**Templates disponibles:**
- `registration`: Email con QR al registrarse
- `reminder_24h`: Recordatorio 24h antes
- `reminder_1h`: Recordatorio 1h antes
- `checkin_confirmation`: Confirmación de check-in

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message_id": "msg_abc123",
    "sent_at": 1704067200
  }
}
```

---

### POST /sms/send

Envía un SMS (interno, requiere auth).

**Request:**
```json
{
  "to": "+1234567890",
  "message": "Your event reminder: Summer Music Festival 2024 on Jan 1, 2024",
  "participant_id": "part_abc123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message_id": "msg_abc123",
    "sent_at": 1704067200
  }
}
```

---

## 🎫 Wallet APIs

### POST /wallet/generate

Genera Apple/Google Wallet pass para un participante.

**Request:**
```json
{
  "participant_id": "part_abc123",
  "event_id": "event_abc123",
  "type": "apple"  // apple, google
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "participant_id": "part_abc123",
    "wallet_pass_url": "https://s3.../pass.pkpass",
    "generated_at": 1704067200
  }
}
```

---

## 📊 Dashboard APIs

### GET /dashboard/stats

Obtiene estadísticas del dashboard.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_events": 45,
    "total_participants": 12500,
    "total_checkins": 8500,
    "upcoming_events": 12,
    "events_by_status": {
      "draft": 5,
      "published": 35,
      "completed": 5
    },
    "recent_events": [
      {
        "event_id": "event_abc123",
        "title": "Summer Music Festival 2024",
        "registered_count": 1250,
        "checked_in_count": 850,
        "dates": {
          "start": 1704067200
        }
      }
    ],
    "weekly_stats": [
      {
        "date": "2024-01-01",
        "registrations": 150,
        "checkins": 120
      }
    ]
  }
}
```

---

## 🌐 Public APIs (Sin autenticación)

### GET /public/events/{tenant_slug}/{event_slug}

Obtiene información pública de un evento.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "event_id": "event_abc123",
    "title": "Summer Music Festival 2024",
    "description": "Join us...",
    "banner_image_url": "https://s3.../banner.jpg",
    "location": {
      "name": "Central Park",
      "address": "123 Park Ave",
      "city": "New York"
    },
    "dates": {
      "start": 1704067200,
      "end": 1704153600,
      "timezone": "America/New_York"
    },
    "capacity": 5000,
    "registered_count": 1250,
    "registration": {
      "enabled": true,
      "opens_at": 1703980800,
      "closes_at": 1704067200
    },
    "tenant": {
      "name": "ACME Events",
      "branding": {
        "primary_color": "#3B82F6",
        "logo_url": "https://s3.../logo.png"
      }
    }
  }
}
```

---

## ⚠️ Códigos de Error Estándar

| Código | Descripción |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validación fallida) |
| 401 | Unauthorized (no autenticado) |
| 403 | Forbidden (no autorizado) |
| 404 | Not Found |
| 409 | Conflict (recurso ya existe) |
| 410 | Gone (recurso no disponible) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

## 🔒 Rate Limiting

- **Public APIs**: 100 requests/minuto por IP
- **Authenticated APIs**: 1000 requests/minuto por usuario
- **Check-in API**: 500 requests/minuto por usuario

## 📝 Notas de Implementación

1. Todas las respuestas incluyen `success: boolean`
2. Errores incluyen `error.code` y `error.message`
3. Paginación usa `next_token` (JWT codificado)
4. Timestamps en formato Unix (segundos)
5. Validación de `tenant_id` en cada request autenticado
6. Logging de todas las operaciones para auditoría

