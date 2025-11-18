# 🎉 Lambda CREATE EVENT - VERSIÓN COMPLETA

## 📅 Fecha: 2025-11-18

---

## ✅ CAMPOS IMPLEMENTADOS

### **1. Información Básica** (5 campos)
- `title` * (requerido)
- `short_description`
- `description` * (requerido)
- `banner_image_url`
- `featured_image_url`

### **2. Ubicación** (9 campos)
- `is_virtual` (boolean)
- `location.name` *
- `location.address` *
- `location.city` *
- `location.state` *
- `location.country` *
- `location.zip`
- `location.is_online`
- `virtual_meeting_url` *

### **3. Fecha y Capacidad** (5 campos)
- `dates.start` * (Unix timestamp)
- `dates.end` * (Unix timestamp)
- `dates.timezone` *
- `capacity` (0 = ilimitado)
- `waitlist_enabled` (boolean)

### **4. Registro** (4 campos)
- `registration_enabled` (boolean)
- `max_per_person` (number)
- `require_phone` (boolean)
- `custom_fields` (JSON array)

### **5. Publicación** (2 campos)
- `status` (draft/published/cancelled)
- `visibility` (public/unlisted/private)

### **6. Contadores** (auto-generados)
- `registered_count` = 0
- `checked_in_count` = 0
- `waitlist_count` = 0

### **7. Metadatos** (auto-generados)
- `event_id` = `event_{random_hex}`
- `tenant_id` = from JWT
- `slug` = auto-generated from title
- `created_at` = Unix timestamp
- `updated_at` = Unix timestamp

---

## 🔒 VALIDACIONES

### **Básicas:**
- ✅ `title` mínimo 3 caracteres
- ✅ `description` requerida
- ✅ `start_date` y `end_date` requeridos
- ✅ `end_date` debe ser después de `start_date`

### **Ubicación:**
- ✅ Si `is_virtual = true` → `virtual_meeting_url` requerido
- ✅ Si `is_virtual = false` → `location_name` requerido

### **Custom Fields:**
- ✅ Validar formato JSON
- ✅ Debe ser array válido

---

## 📊 ESTRUCTURA DEL EVENTO EN DYNAMODB

```javascript
{
  // IDs
  event_id: "event_abc123...",
  tenant_id: "user_xyz...",
  slug: "conferencia-tecnologia-2025",
  
  // Básico
  title: "Conferencia de Tecnología 2025",
  short_description: "El evento tech del año",
  description: "Descripción completa del evento...",
  banner_image_url: "https://...",
  featured_image_url: "https://...",
  
  // Ubicación
  is_virtual: false,
  location: {
    name: "Centro de Convenciones",
    address: "Av. Principal 123",
    city: "Ciudad de México",
    state: "CDMX",
    country: "México",
    zip: "01000",
    is_online: false
  },
  virtual_meeting_url: "",
  
  // Fechas
  dates: {
    start: 1735689600,  // Unix timestamp
    end: 1735776000,
    timezone: "America/Mexico_City",
    is_all_day: false
  },
  
  // Capacidad
  capacity: 500,
  waitlist_enabled: true,
  
  // Registro
  registration_enabled: true,
  max_per_person: 2,
  require_phone: true,
  custom_fields: [
    {
      name: "company",
      label: "Empresa",
      type: "text",
      required: false
    }
  ],
  
  // Publicación
  status: "published",
  visibility: "public",
  
  // Contadores
  registered_count: 0,
  checked_in_count: 0,
  waitlist_count: 0,
  
  // Timestamps
  created_at: 1731949200,
  updated_at: 1731949200
}
```

---

## 🚀 DEPLOYMENT

```bash
# 1. Crear archivo Lambda
/tmp/create-event-complete.js

# 2. Zipear
cd /tmp && zip -q create-event-complete.zip create-event-complete.js

# 3. Deploy a AWS Lambda
aws lambda update-function-code \
  --function-name eventmaster-create-event \
  --zip-file fileb:///tmp/create-event-complete.zip \
  --region us-east-1
```

---

## 📝 EJEMPLO DE REQUEST

```bash
POST /prod/events
Headers:
  Authorization: Bearer {JWT_TOKEN}
  Content-Type: application/json

Body:
{
  "title": "Conferencia de Tecnología 2025",
  "short_description": "El evento tech del año",
  "description": "Descripción completa del evento con todos los detalles...",
  "banner_image_url": "https://example.com/banner.jpg",
  "featured_image_url": "https://example.com/featured.jpg",
  
  "is_virtual": false,
  "location_name": "Centro de Convenciones",
  "location_address": "Av. Principal 123",
  "location_city": "Ciudad de México",
  "location_state": "CDMX",
  "location_country": "México",
  "location_zip": "01000",
  
  "start_date": "2025-01-15T09:00:00",
  "end_date": "2025-01-15T18:00:00",
  "timezone": "America/Mexico_City",
  "capacity": 500,
  "waitlist_enabled": true,
  
  "registration_enabled": true,
  "max_per_person": 2,
  "require_phone": true,
  "custom_fields": "[{\"name\":\"company\",\"label\":\"Empresa\",\"type\":\"text\",\"required\":false}]",
  
  "status": "published",
  "visibility": "public"
}
```

---

## 📊 EJEMPLO DE RESPONSE

```json
{
  "success": true,
  "data": {
    "event_id": "event_b59c1fcf9567f18b9a1bc95f3b83303c",
    "tenant_id": "66b95fdb-44e9-43ba-aec2-e29dc3a96e5b",
    "slug": "conferencia-de-tecnologia-2025",
    "title": "Conferencia de Tecnología 2025",
    "status": "published",
    "visibility": "public",
    "is_virtual": false,
    "registration_enabled": true,
    "capacity": 500,
    "created_at": 1731949200
  }
}
```

---

## 🔍 DIFERENCIAS CON VERSIÓN ANTERIOR

| Campo | Versión Anterior | Versión Nueva |
|-------|-----------------|---------------|
| **Campos básicos** | 3 | **5** ✅ |
| **Ubicación** | 2 | **9** ✅ |
| **Registro** | 0 | **4** ✅ |
| **Publicación** | 1 | **2** ✅ |
| **Total campos** | 6 | **25+** ✅ |
| **Validaciones** | Básicas | **Completas** ✅ |
| **Virtual events** | ❌ | ✅ |
| **Custom fields** | ❌ | ✅ |
| **Waitlist** | ❌ | ✅ |
| **Visibility** | ❌ | ✅ |

---

## 🎯 STATUS

```
✅ Lambda actualizado
✅ Validaciones completas
✅ Todos los campos del formulario soportados
✅ Compatible con frontend wizard de 5 pasos
✅ Documentación completa
```

---

**Lambda:** `eventmaster-create-event`  
**Región:** `us-east-1`  
**Runtime:** `nodejs18.x`  
**Handler:** `create-event-complete.handler`  
**Tamaño:** `2537 bytes`

**Status:** ✅ **DEPLOYADO Y FUNCIONANDO**

