# Esquema de Base de Datos - DynamoDB

## 📊 Estrategia Multi-Tenant

**Enfoque:** Partition Key con `tenant_id` en todas las tablas para garantizar aislamiento completo.

## 🗂️ Tablas Principales

### 1. Tenants Table

**Tabla:** `eventmaster-tenants`

**Estructura:**
```json
{
  "tenant_id": {
    "S": "tenant_abc123"  // PK
  },
  "slug": {
    "S": "acme-events"  // GSI1 PK - URL slug único
  },
  "name": {
    "S": "ACME Events"
  },
  "status": {
    "S": "active"  // active, suspended, cancelled
  },
  "branding": {
    "M": {
      "logo_url": { "S": "https://s3.../logo.png" },
      "favicon_url": { "S": "https://s3.../favicon.ico" },
      "primary_color": { "S": "#3B82F6" },
      "secondary_color": { "S": "#1E40AF" },
      "accent_color": { "S": "#10B981" },
      "font_family": { "S": "Inter" },
      "header_image_url": { "S": "https://s3.../header.jpg" },
      "login_background_url": { "S": "https://s3.../login-bg.jpg" },
      "footer_text": { "S": "© 2024 ACME Events" },
      "footer_links": {
        "L": [
          { "M": { "text": { "S": "Privacy" }, "url": { "S": "/privacy" } } }
        ]
      }
    }
  },
  "contact": {
    "M": {
      "email": { "S": "contact@acme.com" },
      "phone": { "S": "+1234567890" },
      "address": { "S": "123 Main St" }
    }
  },
  "notifications": {
    "M": {
      "email_from": { "S": "noreply@acme.com" },
      "email_from_name": { "S": "ACME Events" },
      "sms_sender": { "S": "ACME" },
      "email_templates": {
        "M": {
          "registration": { "S": "template_id_1" },
          "reminder": { "S": "template_id_2" },
          "checkin_confirmation": { "S": "template_id_3" }
        }
      }
    }
  },
  "settings": {
    "M": {
      "timezone": { "S": "America/New_York" },
      "locale": { "S": "en-US" },
      "currency": { "S": "USD" },
      "wallet_pass_enabled": { "BOOL": true },
      "sms_enabled": { "BOOL": true },
      "email_enabled": { "BOOL": true }
    }
  },
  "subscription": {
    "M": {
      "plan": { "S": "pro" },  // free, basic, pro, enterprise
      "status": { "S": "active" },
      "current_period_end": { "N": "1735689600" },
      "max_events": { "N": "100" },
      "max_participants_per_event": { "N": "10000" }
    }
  },
  "created_at": {
    "N": "1704067200"
  },
  "updated_at": {
    "N": "1704067200"
  },
  "created_by": {
    "S": "user_123"
  }
}
```

**Indexes:**
- **PK:** `tenant_id`
- **GSI1:** `slug` (PK) - Para lookup por URL slug

**Queries:**
- Get tenant by ID: `GetItem(tenant_id)`
- Get tenant by slug: `Query(GSI1, slug = "acme-events")`

---

### 2. Users Table

**Tabla:** `eventmaster-users`

**Estructura:**
```json
{
  "user_id": {
    "S": "user_abc123"  // PK
  },
  "tenant_id": {
    "S": "tenant_abc123"  // SK, GSI1 PK
  },
  "cognito_user_id": {
    "S": "us-east-1:abc123"  // Cognito User ID
  },
  "email": {
    "S": "admin@acme.com"  // GSI1 SK
  },
  "name": {
    "S": "John Doe"
  },
  "role": {
    "S": "owner"  // owner, admin, staff
  },
  "permissions": {
    "L": [
      { "S": "events:create" },
      { "S": "events:edit" },
      { "S": "participants:view" },
      { "S": "checkin:scan" }
    ]
  },
  "status": {
    "S": "active"  // active, inactive, suspended
  },
  "last_login": {
    "N": "1704067200"
  },
  "created_at": {
    "N": "1704067200"
  },
  "updated_at": {
    "N": "1704067200"
  }
}
```

**Indexes:**
- **PK:** `user_id`
- **SK:** `tenant_id`
- **GSI1:** `tenant_id` (PK) -> `email` (SK) - Para buscar usuarios por tenant y email

**Queries:**
- Get user: `GetItem(user_id, tenant_id)`
- Get user by email in tenant: `Query(GSI1, tenant_id = "x", email = "y")`
- List users in tenant: `Query(GSI1, tenant_id = "x")`

---

### 3. Events Table

**Tabla:** `eventmaster-events`

**Estructura:**
```json
{
  "event_id": {
    "S": "event_abc123"  // PK
  },
  "tenant_id": {
    "S": "tenant_abc123"  // SK, GSI1 PK, GSI2 PK
  },
  "slug": {
    "S": "summer-festival-2024"  // URL slug único por tenant
  },
  "title": {
    "S": "Summer Music Festival 2024"
  },
  "description": {
    "S": "Join us for an amazing summer festival..."
  },
  "short_description": {
    "S": "Amazing summer festival with live music"
  },
  "banner_image_url": {
    "S": "https://s3.../banner.jpg"
  },
  "thumbnail_image_url": {
    "S": "https://s3.../thumbnail.jpg"
  },
  "location": {
    "M": {
      "name": { "S": "Central Park" },
      "address": { "S": "123 Park Ave" },
      "city": { "S": "New York" },
      "state": { "S": "NY" },
      "zip": { "S": "10001" },
      "country": { "S": "USA" },
      "latitude": { "N": "40.7829" },
      "longitude": { "N": "-73.9654" },
      "is_online": { "BOOL": false },
      "online_url": { "S": "" }
    }
  },
  "dates": {
    "M": {
      "start": { "N": "1704067200" },  // Unix timestamp
      "end": { "N": "1704153600" },
      "timezone": { "S": "America/New_York" },
      "is_all_day": { "BOOL": false }
    }
  },
  "capacity": {
    "N": "5000"
  },
  "registered_count": {
    "N": "1250"  // Actualizado en tiempo real
  },
  "checked_in_count": {
    "N": "850"  // Actualizado en tiempo real
  },
  "status": {
    "S": "published"  // draft, published, cancelled, completed
  },
  "visibility": {
    "S": "public"  // public, private, unlisted
  },
  "registration": {
    "M": {
      "enabled": { "BOOL": true },
      "opens_at": { "N": "1703980800" },
      "closes_at": { "N": "1704067200" },
      "requires_approval": { "BOOL": false },
      "max_per_person": { "N": "5" },
      "fields": {
        "L": [
          { "M": { "name": { "S": "name" }, "required": { "BOOL": true } } },
          { "M": { "name": { "S": "email" }, "required": { "BOOL": true } } },
          { "M": { "name": { "S": "phone" }, "required": { "BOOL": false } } }
        ]
      }
    }
  },
  "notifications": {
    "M": {
      "send_qr_on_registration": { "BOOL": true },
      "send_reminder_24h": { "BOOL": true },
      "send_reminder_1h": { "BOOL": true },
      "send_checkin_confirmation": { "BOOL": true }
    }
  },
  "settings": {
    "M": {
      "allow_waitlist": { "BOOL": true },
      "show_attendee_list": { "BOOL": false },
      "require_checkin": { "BOOL": true }
    }
  },
  "created_at": {
    "N": "1704067200"
  },
  "updated_at": {
    "N": "1704067200"
  },
  "created_by": {
    "S": "user_abc123"
  },
  "published_at": {
    "N": "1704067200"
  }
}
```

**Indexes:**
- **PK:** `event_id`
- **SK:** `tenant_id`
- **GSI1:** `tenant_id` (PK) -> `created_at` (SK) - Listar eventos por tenant ordenados por fecha
- **GSI2:** `tenant_id` (PK) -> `status` (SK) -> `created_at` - Filtrar por estado
- **GSI3:** `tenant_id` (PK) -> `slug` (SK) - Lookup por slug

**Queries:**
- Get event: `GetItem(event_id, tenant_id)`
- List events by tenant: `Query(GSI1, tenant_id = "x")`
- List published events: `Query(GSI2, tenant_id = "x", status = "published")`
- Get event by slug: `Query(GSI3, tenant_id = "x", slug = "y")`

---

### 4. Participants Table

**Tabla:** `eventmaster-participants`

**Estructura:**
```json
{
  "participant_id": {
    "S": "part_abc123"  // PK
  },
  "tenant_id": {
    "S": "tenant_abc123"  // SK (parte), GSI2 PK
  },
  "event_id": {
    "S": "event_abc123"  // SK (parte), GSI1 PK
  },
  "registration_number": {
    "S": "REG-2024-001234"  // Número único por tenant
  },
  "name": {
    "S": "Jane Smith"
  },
  "email": {
    "S": "jane@example.com"
  },
  "phone": {
    "S": "+1234567890"
  },
  "custom_fields": {
    "M": {
      "company": { "S": "Acme Corp" },
      "dietary_restrictions": { "S": "Vegetarian" }
    }
  },
  "qr_code": {
    "M": {
      "data": { "S": "EVENT:event_abc123:PART:part_abc123:TENANT:tenant_abc123" },
      "image_url": { "S": "https://s3.../qr.png" },
      "expires_at": { "N": "1704153600" }
  },
  "wallet_pass": {
    "M": {
      "apple_url": { "S": "https://.../pass.pkpass" },
      "google_url": { "S": "https://.../pass.jwt" },
      "generated_at": { "N": "1704067200" }
    }
  },
  "status": {
    "S": "registered"  // registered, confirmed, checked_in, cancelled, no_show
  },
  "checked_in": {
    "BOOL": false
  },
  "checked_in_at": {
    "N": null  // Timestamp cuando se hace check-in
  },
  "checked_in_by": {
    "S": null  // user_id del staff que hizo check-in
  },
  "notifications": {
    "M": {
      "qr_sent": { "BOOL": true },
      "qr_sent_at": { "N": "1704067200" },
      "reminder_24h_sent": { "BOOL": false },
      "reminder_1h_sent": { "BOOL": false },
      "checkin_confirmation_sent": { "BOOL": false }
    }
  },
  "registration_source": {
    "S": "web"  // web, api, import
  },
  "ip_address": {
    "S": "192.168.1.1"  // Para analytics
  },
  "created_at": {
    "N": "1704067200"
  },
  "updated_at": {
    "N": "1704067200"
  }
}
```

**Indexes:**
- **PK:** `participant_id`
- **SK:** `tenant_id#event_id` (Composite)
- **GSI1:** `event_id` (PK) -> `checked_in` (SK) -> `created_at` - Listar participantes por evento
- **GSI2:** `tenant_id` (PK) -> `created_at` (SK) - Listar todos los participantes del tenant
- **GSI3:** `event_id` (PK) -> `email` (SK) - Buscar por email en evento
- **GSI4:** `qr_code.data` (PK) - Lookup rápido por QR code

**Queries:**
- Get participant: `GetItem(participant_id, tenant_id#event_id)`
- List participants by event: `Query(GSI1, event_id = "x")`
- List checked-in participants: `Query(GSI1, event_id = "x", checked_in = true)`
- Find participant by email: `Query(GSI3, event_id = "x", email = "y")`
- Find by QR code: `Query(GSI4, qr_code.data = "x")`

---

### 5. Check-in Logs Table (Opcional - para auditoría)

**Tabla:** `eventmaster-checkin-logs`

**Estructura:**
```json
{
  "log_id": {
    "S": "log_abc123"  // PK
  },
  "tenant_id": {
    "S": "tenant_abc123"  // SK, GSI1 PK
  },
  "event_id": {
    "S": "event_abc123"  // GSI1 SK
  },
  "participant_id": {
    "S": "part_abc123"
  },
  "checked_in_by": {
    "S": "user_abc123"  // Staff que hizo check-in
  },
  "qr_code_scanned": {
    "S": "EVENT:event_abc123:PART:part_abc123"
  },
  "status": {
    "S": "success"  // success, already_checked, invalid, error
  },
  "location": {
    "M": {
      "latitude": { "N": "40.7829" },
      "longitude": { "N": "-73.9654" },
      "accuracy": { "N": "10" }
    }
  },
  "device_info": {
    "M": {
      "user_agent": { "S": "Mozilla/5.0..." },
      "platform": { "S": "iOS" },
      "app_version": { "S": "1.0.0" }
    }
  },
  "timestamp": {
    "N": "1704067200"
  }
}
```

**Indexes:**
- **PK:** `log_id`
- **SK:** `tenant_id`
- **GSI1:** `tenant_id` (PK) -> `event_id` (SK) -> `timestamp` - Logs por evento

---

## 🔍 Global Secondary Indexes (GSIs) Summary

| Tabla | GSI | Partition Key | Sort Key | Uso |
|------|-----|---------------|----------|-----|
| Tenants | GSI1 | slug | - | Lookup por URL slug |
| Users | GSI1 | tenant_id | email | Buscar usuario por email en tenant |
| Events | GSI1 | tenant_id | created_at | Listar eventos ordenados |
| Events | GSI2 | tenant_id | status | Filtrar por estado |
| Events | GSI3 | tenant_id | slug | Lookup por slug |
| Participants | GSI1 | event_id | checked_in | Listar participantes por evento |
| Participants | GSI2 | tenant_id | created_at | Todos los participantes del tenant |
| Participants | GSI3 | event_id | email | Buscar por email |
| Participants | GSI4 | qr_code.data | - | Lookup por QR code |

## 📝 Notas de Implementación

### Aislamiento Multi-Tenant

1. **Todas las queries DEBEN incluir `tenant_id`**
2. **Nunca hacer queries sin filtro de tenant**
3. **Validar `tenant_id` del JWT token en cada request**
4. **No confiar en `tenant_id` del body del request**

### Optimizaciones

1. **Batch operations** para múltiples participantes
2. **DynamoDB Streams** para actualizar contadores en tiempo real
3. **Caching** con ElastiCache (opcional) para datos frecuentes
4. **Projection expressions** para reducir data transfer

### Escalabilidad

- DynamoDB auto-scales
- On-demand pricing para carga variable
- Provisioned capacity para carga predecible
- TTL attributes para limpiar datos antiguos

### Backup y Recovery

- Point-in-time recovery habilitado
- On-demand backups antes de cambios importantes
- Export a S3 para análisis

