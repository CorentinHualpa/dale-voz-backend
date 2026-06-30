import express from 'express';
import crypto from 'crypto';
import { config } from '../../config.js';
import { handleIncomingMessage } from './handler.js';

export const whatsappRouter = express.Router();

// Verify webhook token
whatsappRouter.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.meta.webhookVerifyToken) {
    console.log('✓ Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Receive webhook events
whatsappRouter.post('/webhook', async (req, res) => {
  const body = req.body;

  // Verify signature
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!verifySignature(body, signature)) {
    console.error('Invalid signature');
    return res.sendStatus(403);
  }

  if (body.object === 'whatsapp_business_account') {
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          // Incoming message
          const value = change.value;
          for (const message of value.messages || []) {
            await handleIncomingMessage(message, value.metadata);
          }
        } else if (change.field === 'message_template_status_update') {
          // Template status (optional logging)
          console.log('Template status update:', change.value);
        }
      }
    }
  }

  res.sendStatus(200);
});

// Send message to client
export async function sendWhatsAppMessage(
  phoneId: string,
  recipientPhone: string,
  message: {
    type: 'text' | 'image' | 'audio' | 'template' | 'interactive';
    text?: string;
    url?: string;
    template?: any;
    interactive?: any;
  }
) {
  const url = `https://graph.instagram.com/v18.0/${phoneId}/messages`;

  const payload: any = {
    messaging_product: 'whatsapp',
    to: recipientPhone,
    type: message.type,
  };

  if (message.type === 'text') {
    payload.text = { body: message.text };
  } else if (message.type === 'audio') {
    payload.audio = { link: message.url };
  } else if (message.type === 'image') {
    payload.image = { link: message.url };
  } else if (message.type === 'template') {
    payload.template = message.template;
  } else if (message.type === 'interactive') {
    payload.interactive = message.interactive;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN || ''}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('WhatsApp send error:', await response.text());
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

function verifySignature(body: any, signature: string): boolean {
  const expectedSignature = 'sha256=' +
    crypto
      .createHmac('sha256', process.env.WHATSAPP_APP_SECRET || '')
      .update(JSON.stringify(body))
      .digest('hex');

  return signature === expectedSignature;
}
