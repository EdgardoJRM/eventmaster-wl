/**
 * Genera el HTML del email de confirmación con QR code
 * 100% personalizable con el branding del tenant
 */

function generateRegistrationEmail({ participant, event, tenant, qrCodeUrl }) {
  const {
    primary_color = '#9333ea',
    secondary_color = '#f3f4f6',
    accent_color = '#3b82f6',
    logo_url = '',
    tenant_name = 'EventMaster',
  } = tenant || {};

  const eventLink = `${process.env.FRONTEND_URL || 'https://main.d14jon4zzm741k.amplifyapp.com'}/events/${event.event_id}`;
  const checkinLink = `${process.env.FRONTEND_URL || 'https://main.d14jon4zzm741k.amplifyapp.com'}/events/${event.event_id}/checkin`;

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Registro - ${event.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      background-color: #f9fafb;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, ${primary_color} 0%, ${accent_color} 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      max-width: 120px;
      height: auto;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 28px;
      margin: 0;
      font-weight: 700;
    }
    .header p {
      font-size: 16px;
      margin: 10px 0 0;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #111827;
      margin-bottom: 20px;
    }
    .event-details {
      background: ${secondary_color};
      border-left: 4px solid ${primary_color};
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
    }
    .event-details h2 {
      color: ${primary_color};
      font-size: 22px;
      margin-bottom: 15px;
    }
    .detail-item {
      margin: 12px 0;
      display: flex;
      align-items: flex-start;
    }
    .detail-icon {
      color: ${primary_color};
      margin-right: 10px;
      font-size: 20px;
    }
    .detail-text {
      color: #374151;
      font-size: 15px;
    }
    .qr-section {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: #ffffff;
      border: 2px dashed ${primary_color};
      border-radius: 12px;
    }
    .qr-section h3 {
      color: ${primary_color};
      font-size: 20px;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .qr-code {
      max-width: 250px;
      height: auto;
      margin: 20px auto;
      padding: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .registration-number {
      display: inline-block;
      background: ${primary_color};
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      margin-top: 15px;
    }
    .cta-button {
      display: inline-block;
      background: ${primary_color};
      color: white;
      text-decoration: none;
      padding: 15px 35px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    .info-box {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 6px;
    }
    .info-box p {
      color: #78350f;
      font-size: 14px;
      margin: 0;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #6b7280;
      font-size: 13px;
      margin: 5px 0;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: ${primary_color};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      ${logo_url ? `<img src="${logo_url}" alt="${tenant_name}" class="logo" />` : ''}
      <h1>¡Registro Confirmado!</h1>
      <p>Gracias por registrarte en nuestro evento</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hola <strong>${participant.name}</strong>,</p>
      
      <p>Tu registro para el evento <strong>${event.title}</strong> ha sido confirmado exitosamente.</p>

      <!-- Event Details -->
      <div class="event-details">
        <h2>📅 Detalles del Evento</h2>
        
        <div class="detail-item">
          <span class="detail-icon">📌</span>
          <span class="detail-text"><strong>Evento:</strong> ${event.title}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-icon">🕐</span>
          <span class="detail-text"><strong>Fecha:</strong> ${formatDate(event.dates.start)}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-icon">📍</span>
          <span class="detail-text">
            <strong>Ubicación:</strong> 
            ${event.location.is_virtual 
              ? 'Evento Virtual - El link de acceso se enviará próximamente' 
              : `${event.location.name}, ${event.location.address}`
            }
          </span>
        </div>

        ${event.capacity > 0 ? `
        <div class="detail-item">
          <span class="detail-icon">👥</span>
          <span class="detail-text"><strong>Capacidad:</strong> ${event.registered_count || 0}/${event.capacity} registrados</span>
        </div>
        ` : ''}
      </div>

      <!-- QR Code Section -->
      <div class="qr-section">
        <h3>🎫 Tu Código QR para el Check-in</h3>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
          Presenta este código en la entrada del evento para hacer check-in
        </p>
        
        <img src="${qrCodeUrl}" alt="QR Code" class="qr-code" />
        
        <div class="registration-number">
          Nº Registro: ${participant.registration_number}
        </div>

        <div class="info-box">
          <p>
            💡 <strong>Tip:</strong> Guarda este correo o toma una captura de pantalla del QR. 
            También puedes imprimirlo para mayor comodidad.
          </p>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${eventLink}" class="cta-button">
          Ver Detalles del Evento
        </a>
      </div>

      <!-- Additional Info -->
      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
        <h4 style="color: #111827; font-size: 18px; margin-bottom: 15px;">📝 Información Importante</h4>
        
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 10px 0; color: #374151;">
            ✓ Llega 15 minutos antes para el check-in
          </li>
          <li style="margin: 10px 0; color: #374151;">
            ✓ Presenta tu QR code al ingresar
          </li>
          <li style="margin: 10px 0; color: #374151;">
            ✓ ${event.registration.require_phone ? 'Identificación requerida' : 'No se requiere identificación adicional'}
          </li>
          ${event.location.is_virtual ? `
          <li style="margin: 10px 0; color: #374151;">
            ✓ Recibirás el link de acceso 1 hora antes del evento
          </li>
          ` : ''}
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="font-weight: 600; color: #111827; margin-bottom: 10px;">${tenant_name}</p>
      <p>Si tienes alguna pregunta, responde a este email.</p>
      <p style="margin-top: 20px; font-size: 12px;">
        Este email fue enviado automáticamente. Por favor no respondas a esta dirección.
      </p>
      <p style="margin-top: 10px; font-size: 11px; color: #9ca3af;">
        © ${new Date().getFullYear()} ${tenant_name}. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

module.exports = { generateRegistrationEmail };

