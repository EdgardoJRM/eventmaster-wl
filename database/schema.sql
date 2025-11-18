-- ============================================
-- EventMaster WL - Database Schema
-- PostgreSQL 15+
-- ============================================

-- ============================================
-- TENANTS TABLE (Clientes White Label)
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier (ej: "acme-corp")
  name VARCHAR(255) NOT NULL,
  
  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3f5e78', -- Hex color
  secondary_color VARCHAR(7) DEFAULT '#f5f5f5',
  accent_color VARCHAR(7) DEFAULT '#007bff',
  font_family VARCHAR(100) DEFAULT 'Inter, sans-serif',
  
  -- Custom Images
  header_image_url TEXT,
  login_background_image_url TEXT,
  footer_html TEXT, -- HTML customizado para footer
  
  -- Email/SMS Configuration
  email_from VARCHAR(255) NOT NULL,
  email_from_name VARCHAR(255) NOT NULL,
  sms_sender VARCHAR(20), -- Twilio phone number or SNS sender ID
  email_signature TEXT, -- Firma personalizada para emails
  
  -- Wallet Pass Configuration
  wallet_pass_template_url TEXT, -- URL del template de Apple/Google Wallet
  wallet_pass_team_id VARCHAR(20), -- Apple Developer Team ID
  wallet_pass_pass_type_id VARCHAR(100), -- Apple Pass Type ID
  
  -- Custom Domain (Premium Feature)
  custom_domain VARCHAR(255) UNIQUE,
  custom_domain_status VARCHAR(50) DEFAULT 'pending', -- pending, active, failed
  
  -- Subscription/Billing
  subscription_plan VARCHAR(50) DEFAULT 'free', -- free, basic, pro, enterprise
  subscription_status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
  monthly_price DECIMAL(10,2) DEFAULT 0.00,
  max_events INTEGER DEFAULT 10, -- Límite según plan
  max_participants_per_event INTEGER DEFAULT 100,
  features JSONB DEFAULT '{}', -- {custom_domain: true, sms: false, ...}
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;

-- ============================================
-- USERS TABLE (Usuarios del sistema)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cognito_sub VARCHAR(255) NOT NULL, -- Cognito User Sub
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- Role: owner (creador del tenant), admin (puede gestionar todo), staff (solo check-in)
  role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  
  -- Permissions (JSONB para flexibilidad)
  permissions JSONB DEFAULT '{}', -- {can_create_events: true, can_manage_users: false, ...}
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP,
  
  -- Unique constraint: email must be unique per tenant
  CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_tenant_role ON users(tenant_id, role);

-- ============================================
-- EVENTS TABLE (Eventos)
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Basic Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(100) NOT NULL, -- URL-friendly (único por tenant)
  
  -- Visual
  banner_image_url TEXT,
  thumbnail_image_url TEXT,
  
  -- Location
  location_name VARCHAR(255),
  location_address TEXT,
  location_city VARCHAR(100),
  location_state VARCHAR(100),
  location_country VARCHAR(100),
  location_zip VARCHAR(20),
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  is_virtual BOOLEAN DEFAULT false,
  virtual_meeting_url TEXT, -- Zoom, Teams, etc.
  
  -- Dates
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  registration_opens_at TIMESTAMP,
  registration_closes_at TIMESTAMP,
  
  -- Capacity
  capacity INTEGER, -- NULL = unlimited
  waitlist_enabled BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  
  -- Settings
  require_email BOOLEAN DEFAULT true,
  require_phone BOOLEAN DEFAULT false,
  allow_multiple_registrations BOOLEAN DEFAULT false, -- Mismo email puede registrarse múltiples veces
  auto_send_qr BOOLEAN DEFAULT true, -- Enviar QR automáticamente al registrarse
  send_reminder_email BOOLEAN DEFAULT true,
  send_reminder_sms BOOLEAN DEFAULT false,
  reminder_hours_before INTEGER DEFAULT 24, -- Horas antes del evento para enviar recordatorio
  
  -- Custom Fields (JSONB para campos adicionales)
  custom_fields JSONB DEFAULT '[]', -- [{name: "Company", type: "text", required: true}, ...]
  
  -- Analytics
  total_registrations INTEGER DEFAULT 0,
  total_check_ins INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  deleted_at TIMESTAMP,
  
  -- Unique constraint: slug must be unique per tenant
  CONSTRAINT unique_slug_per_tenant UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_events_tenant_id ON events(tenant_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_tenant_status ON events(tenant_id, status);
CREATE INDEX idx_events_tenant_slug ON events(tenant_id, slug);
CREATE INDEX idx_events_created_by ON events(created_by);

-- ============================================
-- PARTICIPANTS TABLE (Registrados al evento)
-- ============================================
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Personal Info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- QR Code
  qr_code_url TEXT, -- URL de la imagen del QR
  qr_code_data TEXT NOT NULL, -- Data del QR (único por participante)
  
  -- Wallet Pass
  wallet_pass_url TEXT, -- URL para descargar Apple/Google Wallet pass
  wallet_pass_apple_url TEXT, -- URL específica para Apple Wallet
  wallet_pass_google_url TEXT, -- URL específica para Google Wallet
  
  -- Check-in Status
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP,
  checked_in_by UUID REFERENCES users(id), -- Staff que hizo el check-in
  
  -- Custom Fields Data (JSONB)
  custom_fields_data JSONB DEFAULT '{}', -- {company: "Acme Corp", dietary: "Vegetarian", ...}
  
  -- Email/SMS Status
  qr_email_sent BOOLEAN DEFAULT false,
  qr_email_sent_at TIMESTAMP,
  reminder_email_sent BOOLEAN DEFAULT false,
  reminder_email_sent_at TIMESTAMP,
  reminder_sms_sent BOOLEAN DEFAULT false,
  reminder_sms_sent_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: same email can register multiple times if allow_multiple_registrations is true
  -- Otherwise, unique per event
  CONSTRAINT unique_email_per_event UNIQUE (event_id, email) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_participants_tenant_id ON participants(tenant_id);
CREATE INDEX idx_participants_event_id ON participants(event_id);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_qr_code_data ON participants(qr_code_data);
CREATE INDEX idx_participants_checked_in ON participants(checked_in);
CREATE INDEX idx_participants_tenant_event ON participants(tenant_id, event_id);

-- ============================================
-- CHECK_INS TABLE (Historial de check-ins)
-- ============================================
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  checked_in_by UUID NOT NULL REFERENCES users(id),
  
  -- Check-in details
  check_in_method VARCHAR(20) DEFAULT 'qr_scan', -- qr_scan, manual, api
  device_info TEXT, -- Info del dispositivo que hizo el scan
  location_info TEXT, -- GPS si está disponible
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_check_ins_tenant_id ON check_ins(tenant_id);
CREATE INDEX idx_check_ins_event_id ON check_ins(event_id);
CREATE INDEX idx_check_ins_participant_id ON check_ins(participant_id);
CREATE INDEX idx_check_ins_created_at ON check_ins(created_at);

-- ============================================
-- EMAIL_LOGS TABLE (Logs de emails enviados)
-- ============================================
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  
  -- Email details
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  email_type VARCHAR(50) NOT NULL, -- qr_code, reminder, custom
  template_name VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, bounced
  ses_message_id VARCHAR(255),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP
);

CREATE INDEX idx_email_logs_tenant_id ON email_logs(tenant_id);
CREATE INDEX idx_email_logs_event_id ON email_logs(event_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);

-- ============================================
-- SMS_LOGS TABLE (Logs de SMS enviados)
-- ============================================
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  
  -- SMS details
  to_phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  sms_type VARCHAR(50) NOT NULL, -- reminder, custom
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, delivered
  provider_message_id VARCHAR(255), -- SNS MessageId o Twilio SID
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP
);

CREATE INDEX idx_sms_logs_tenant_id ON sms_logs(tenant_id);
CREATE INDEX idx_sms_logs_event_id ON sms_logs(event_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);

-- ============================================
-- ANALYTICS TABLE (Métricas y estadísticas)
-- ============================================
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  
  -- Date for daily aggregation
  date DATE NOT NULL,
  
  -- Metrics
  registrations_count INTEGER DEFAULT 0,
  check_ins_count INTEGER DEFAULT 0,
  emails_sent_count INTEGER DEFAULT 0,
  sms_sent_count INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint: one record per tenant/event/date
  CONSTRAINT unique_analytics_per_day UNIQUE (tenant_id, event_id, date)
);

CREATE INDEX idx_analytics_tenant_id ON analytics(tenant_id);
CREATE INDEX idx_analytics_event_id ON analytics(event_id);
CREATE INDEX idx_analytics_date ON analytics(date);

-- ============================================
-- TRIGGERS para updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS útiles
-- ============================================

-- Function para generar slug único
CREATE OR REPLACE FUNCTION generate_unique_event_slug(p_tenant_id UUID, p_title TEXT)
RETURNS VARCHAR(100) AS $$
DECLARE
  base_slug VARCHAR(100);
  final_slug VARCHAR(100);
  counter INTEGER := 1;
BEGIN
  -- Generar slug base desde el título
  base_slug := lower(regexp_replace(p_title, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := substring(base_slug from 1 for 63);
  
  final_slug := base_slug;
  
  -- Verificar si existe y generar uno único
  WHILE EXISTS (SELECT 1 FROM events WHERE tenant_id = p_tenant_id AND slug = final_slug) LOOP
    final_slug := substring(base_slug from 1 for 58) || '-' || counter;
    counter := counter + 1;
    
    IF counter > 100 THEN
      -- Fallback a UUID
      final_slug := 'event-' || substring(gen_random_uuid()::text from 1 for 8);
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

