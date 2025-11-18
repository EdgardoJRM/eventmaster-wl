#!/bin/bash

# Script para ejecutar el schema SQL en AWS CloudShell
# Copia y pega este script completo en CloudShell

set -e

echo "🚀 EventMaster WL - Setup de Base de Datos en CloudShell"
echo "=================================================="
echo ""

# Configuración
SECRET_ARN="arn:aws:secretsmanager:us-east-1:104768552978:secret:EventMasterDBSecretD3A9D9FD-P9VCqMV5TGU3-n4CGLb"
DB_ENDPOINT="eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v.cclm8qiyw76p.us-east-1.rds.amazonaws.com"
DB_NAME="eventmaster"

echo "📥 Paso 1: Obteniendo credenciales de Secrets Manager..."
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text)

DB_USER=$(echo "$SECRET_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['username'])")
DB_PASSWORD=$(echo "$SECRET_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['password'])")

echo "✅ Credenciales obtenidas"
echo "   Usuario: $DB_USER"
echo "   Endpoint: $DB_ENDPOINT"
echo ""

echo "📦 Paso 2: Verificando/Instalando PostgreSQL client..."
if ! command -v psql &> /dev/null; then
    echo "   Instalando PostgreSQL 15 client..."
    sudo yum update -y
    sudo amazon-linux-extras install postgresql15 -y
else
    echo "   ✅ psql ya está instalado"
    psql --version
fi
echo ""

echo "📝 Paso 3: Descargando schema SQL..."
# Crear el schema SQL inline o descargarlo
cat > /tmp/schema.sql << 'SCHEMA_EOF'
-- ============================================
-- EventMaster WL - Database Schema
-- PostgreSQL 15+
-- ============================================

-- ============================================
-- TENANTS TABLE (Clientes White Label)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3f5e78',
  secondary_color VARCHAR(7) DEFAULT '#f5f5f5',
  accent_color VARCHAR(7) DEFAULT '#007bff',
  font_family VARCHAR(100) DEFAULT 'Inter, sans-serif',
  
  -- Custom Images
  header_image_url TEXT,
  login_background_image_url TEXT,
  footer_html TEXT,
  
  -- Email/SMS Configuration
  email_from VARCHAR(255) NOT NULL,
  email_from_name VARCHAR(255) NOT NULL,
  sms_sender VARCHAR(20),
  email_signature TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cognito_user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, email)
);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  banner_image_url TEXT,
  
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
  
  location_name VARCHAR(255),
  location_address TEXT,
  location_coordinates POINT,
  
  capacity INTEGER,
  waitlist_enabled BOOLEAN DEFAULT false,
  custom_fields JSONB,
  
  status VARCHAR(50) DEFAULT 'draft',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, slug)
);

-- ============================================
-- PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  qr_code_url TEXT,
  qr_code_data TEXT UNIQUE,
  
  registration_data JSONB,
  custom_fields JSONB,
  
  status VARCHAR(50) DEFAULT 'registered',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(event_id, email)
);

-- ============================================
-- CHECK_INS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  checked_in_by UUID REFERENCES users(id),
  notes TEXT,
  
  UNIQUE(participant_id)
);

-- ============================================
-- EMAIL_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SMS_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  
  to_phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC,
  metric_data JSONB,
  
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_cognito_user_id ON users(cognito_user_id);
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_tenant_id ON participants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_participants_qr_code_data ON participants(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_check_ins_event_id ON check_ins(event_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_tenant_id ON check_ins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_id ON email_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_tenant_id ON sms_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_tenant_id ON analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_id ON analytics(event_id);

-- ============================================
-- TRIGGERS para updated_at
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
-- FUNCTION para generar slug único
-- ============================================
CREATE OR REPLACE FUNCTION generate_unique_event_slug(tenant_uuid UUID, base_slug TEXT)
RETURNS TEXT AS $$
DECLARE
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM events WHERE tenant_id = tenant_uuid AND slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

SCHEMA_EOF

echo "✅ Schema SQL creado en /tmp/schema.sql"
echo ""

echo "🔌 Paso 4: Conectando a RDS y ejecutando schema..."
export PGPASSWORD="$DB_PASSWORD"

psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ✅ ✅ Schema SQL ejecutado exitosamente!"
    echo ""
    echo "📊 Verificando tablas creadas..."
    psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null
    echo ""
    echo "🎉 ¡Base de datos lista para usar!"
else
    echo ""
    echo "❌ Error ejecutando schema SQL"
    exit 1
fi

unset PGPASSWORD

echo ""
echo "✨ Setup completado!"


