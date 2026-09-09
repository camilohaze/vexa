import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envío de correo transaccional sin dependencias extra.
 * Proveedores soportados vía MAIL_PROVIDER:
 *  - `resend`   → https://api.resend.com/emails        (MAIL_API_KEY)
 *  - `sendgrid` → https://api.sendgrid.com/v3/mail/send (MAIL_API_KEY)
 *  - `log` (default en dev) → solo registra en consola.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly config: ConfigService) {}

  async send(payload: EmailPayload): Promise<void> {
    const provider = this.config.get<string>('MAIL_PROVIDER', 'log');
    const from = this.config.get<string>('MAIL_FROM', 'Vexa <no-reply@vexa.app>');
    const apiKey = this.config.get<string>('MAIL_API_KEY', '');

    if (provider === 'log' || !apiKey) {
      this.logger.log(`[mail:${provider}] → ${payload.to} | ${payload.subject}`);
      return;
    }

    const response = await fetch(
      provider === 'sendgrid'
        ? 'https://api.sendgrid.com/v3/mail/send'
        : 'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          provider === 'sendgrid'
            ? {
                personalizations: [{ to: [{ email: payload.to }] }],
                from: { email: from.replace(/.*<(.+)>/, '$1') },
                subject: payload.subject,
                content: [{ type: 'text/html', value: payload.html }],
              }
            : { from, to: [payload.to], subject: payload.subject, html: payload.html, text: payload.text },
        ),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Mail ${provider} falló (${response.status}): ${body}`);
      throw new Error(`Mail provider error ${response.status}`);
    }
  }

  /** Plantilla del OTP de 6 dígitos. */
  async sendOtp(to: string, code: string, purpose: 'verify' | 'reset') {
    const subject =
      purpose === 'verify' ? 'Verifica tu cuenta de Vexa' : 'Restablece tu contraseña de Vexa';
    const action =
      purpose === 'verify' ? 'confirmar tu correo' : 'restablecer tu contraseña';
    await this.send({
      to,
      subject,
      text: `Tu código de Vexa es ${code}. Caduca en 10 minutos.`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
          <h2>Vexa</h2>
          <p>Usa este código para ${action}:</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:6px">${code}</p>
          <p style="color:#666">Caduca en 10 minutos. Si no lo solicitaste, ignora este correo.</p>
        </div>`,
    });
  }
}
