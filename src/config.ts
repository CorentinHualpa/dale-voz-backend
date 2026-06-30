import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Meta WhatsApp
  meta: {
    businessAccountId: process.env.META_BUSINESS_ACCOUNT_ID || '',
    phoneIdConversations: process.env.META_WHATSAPP_PHONE_ID_CONVERSATIONS || '',
    phoneIdNotifications: process.env.META_WHATSAPP_PHONE_ID_NOTIFICATIONS || '',
    webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || '',
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  // Grok
  xai: {
    apiKey: process.env.XAI_API_KEY || '',
  },

  // Mercado Pago
  mercadoPago: {
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || '',
  },

  // Resend
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
  },

  // Telnyx
  telnyx: {
    apiKey: process.env.TELNYX_API_KEY || '',
    didPe: process.env.TELNYX_DID_PE || '',
  },

  // nova-core service
  novaCore: {
    url: process.env.NOVA_CORE_URL || 'http://localhost:3001',
  },

  // LiveKit
  livekit: {
    url: process.env.LIVEKIT_URL || '',
    apiKey: process.env.LIVEKIT_API_KEY || '',
    apiSecret: process.env.LIVEKIT_API_SECRET || '',
  },
};
