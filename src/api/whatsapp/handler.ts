import { prisma } from '../../db.js';
import { novaCore } from '../../services/nova-core.js';
import { transcribeAudio } from '../../services/transcription.js';
import { textToSpeech } from '../../services/text-to-speech.js';
import { sendWhatsAppMessage } from './webhook.js';

export async function handleIncomingMessage(
  message: any,
  metadata: any
) {
  const phoneId = metadata.phone_number_id;
  const senderPhone = message.from;
  const messageId = message.id;
  const timestamp = message.timestamp;

  console.log(`📨 Incoming message from ${senderPhone} (${message.type})`);

  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      guestPhone: senderPhone,
      status: 'active',
    },
  });

  if (!conversation) {
    // Determine hotel by phone ID
    const client = await prisma.client.findFirst({
      where: {
        whatsappPhoneIdConversations: phoneId,
      },
    });

    if (!client) {
      console.error(`No client found for phone ID ${phoneId}`);
      return;
    }

    conversation = await prisma.conversation.create({
      data: {
        hotelId: client.id,
        guestPhone: senderPhone,
        channel: 'whatsapp',
      },
    });
  }

  // Parse message content
  let textContent = '';

  if (message.type === 'text') {
    textContent = message.text.body;
  } else if (message.type === 'audio') {
    // Transcribe audio
    const mediaId = message.audio.id;
    try {
      textContent = await transcribeAudio(mediaId);
      console.log(`✓ Transcribed audio: ${textContent}`);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      await sendWhatsAppMessage(phoneId, senderPhone, {
        type: 'text',
        text: 'Disculpa, no pude transcribir tu audio. Intenta de nuevo.',
      });
      return;
    }
  } else if (message.type === 'button') {
    textContent = message.button.payload;
  } else {
    console.log(`Unsupported message type: ${message.type}`);
    return;
  }

  // Store message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'guest',
      content: textContent,
      messageType: message.type,
    },
  });

  // Get client context
  const client = await prisma.client.findUnique({
    where: { id: conversation.hotelId },
  });

  if (!client) return;

  // Call nova-core
  const novaResponse = await novaCore.chat({
    messages: [
      {
        role: 'user',
        content: textContent,
      },
    ],
    context: {
      hotel_id: client.id,
      language: client.language,
      guest_phone: senderPhone,
    },
    tools: ['reservar', 'cobrar', 'actualizar'],
  });

  // Store agent response
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'agent',
      content: novaResponse.text,
      messageType: 'text',
    },
  });

  // Send response to client
  // If agent wants to call a tool, send confirmation button
  if (novaResponse.actions && novaResponse.actions.length > 0) {
    const action = novaResponse.actions[0];

    let confirmationText = '';
    if (action.type === 'reservar') {
      confirmationText = `¿Confirmo la reservación para ${action.payload.guest_name} del ${action.payload.dates}?`;
    } else if (action.type === 'cobrar') {
      confirmationText = `¿Confirmo el pago de ${action.payload.amount} soles?`;
    }

    // Send text response
    await sendWhatsAppMessage(phoneId, senderPhone, {
      type: 'text',
      text: novaResponse.text,
    });

    // Send confirmation button
    if (confirmationText) {
      await sendWhatsAppMessage(phoneId, senderPhone, {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: confirmationText },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: `action_${action.type}_confirm`,
                  title: 'Sí, confirmar',
                },
              },
              {
                type: 'reply',
                reply: {
                  id: 'action_cancel',
                  title: 'Cancelar',
                },
              },
            ],
          },
        },
      });
    }
  } else {
    // Just send text response
    let responseText = novaResponse.text;

    // If audio is available, send voice message too
    if (novaResponse.audio_url) {
      await sendWhatsAppMessage(phoneId, senderPhone, {
        type: 'audio',
        url: novaResponse.audio_url,
      });
    }

    await sendWhatsAppMessage(phoneId, senderPhone, {
      type: 'text',
      text: responseText,
    });
  }

  // Handle action confirmation
  if (
    message.type === 'button' &&
    message.button.payload.startsWith('action_')
  ) {
    const actionId = message.button.payload;

    if (actionId === 'action_cancel') {
      await sendWhatsAppMessage(phoneId, senderPhone, {
        type: 'text',
        text: 'Se canceló la operación.',
      });
      return;
    }

    if (actionId.startsWith('action_reservar_confirm')) {
      // Execute booking
      const booking = await novaCore.executeReservation(conversation.id);
      console.log('✓ Booking created:', booking.id);

      await sendWhatsAppMessage(phoneId, senderPhone, {
        type: 'text',
        text: `¡Reservación confirmada! ID: ${booking.id}\nAhora procede con el pago.`,
      });

      // Trigger payment
      // (See payment service)
    }
  }
}
