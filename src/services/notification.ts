import { Resend } from 'resend';
import { prisma } from '../db.js';
import { sendWhatsAppMessage } from '../api/whatsapp/webhook.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNotificationToHotel(
  bookingId: string,
  eventType: 'payment_received' | 'reservation_created' | 'guest_arrived'
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hotel: true },
    });

    if (!booking || !booking.hotel) {
      throw new Error('Booking or hotel not found');
    }

    const templates = {
      payment_received: {
        whatsapp: generateWhatsAppNotification(booking, 'payment_received'),
        email: generateEmailNotification(booking, 'payment_received'),
      },
      reservation_created: {
        whatsapp: generateWhatsAppNotification(booking, 'reservation_created'),
        email: generateEmailNotification(booking, 'reservation_created'),
      },
      guest_arrived: {
        whatsapp: generateWhatsAppNotification(booking, 'guest_arrived'),
        email: generateEmailNotification(booking, 'guest_arrived'),
      },
    };

    const notification = templates[eventType];

    // Send WhatsApp notification if enabled
    if (
      booking.hotel.notificationChannels?.includes('whatsapp') &&
      booking.hotel.hotelContactWhatsapp
    ) {
      try {
        await sendWhatsAppMessage(
          booking.hotel.whatsappPhoneIdConversations || '',
          booking.hotel.hotelContactWhatsapp,
          {
            type: 'text',
            text: notification.whatsapp,
          }
        );
        console.log(`✓ WhatsApp notification sent to ${booking.hotel.hotelName}`);
      } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
      }
    }

    // Send email notification if enabled
    if (
      booking.hotel.notificationChannels?.includes('email') &&
      booking.hotel.hotelContactEmail
    ) {
      try {
        await resend.emails.send({
          from: 'Dale Voz <notificaciones@dalevoz.pe>',
          to: booking.hotel.hotelContactEmail,
          subject: `[${booking.hotel.hotelName}] Notificación de reservación`,
          html: notification.email,
        });
        console.log(`✓ Email notification sent to ${booking.hotel.hotelContactEmail}`);
      } catch (error) {
        console.error('Error sending email notification:', error);
      }
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

function generateWhatsAppNotification(booking: any, eventType: string): string {
  const checkInDate = new Date(booking.checkIn).toLocaleDateString('es-PE');
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('es-PE');

  if (eventType === 'payment_received') {
    return `✓ *Reservación confirmada*\n\n*Huésped:* ${booking.guestName} | ${booking.guestPhone}\n*Email:* ${booking.guestEmail}\n*Check-in:* ${checkInDate}\n*Check-out:* ${checkOutDate}\n*Noches:* ${booking.nights}\n*Total:* ${booking.totalAmount} ${booking.currency}\n\n*ID Reservación:* ${booking.id}`;
  } else if (eventType === 'reservation_created') {
    return `📅 *Nueva reservación*\n\n*Huésped:* ${booking.guestName}\n*Fechas:* ${checkInDate} → ${checkOutDate}\n*Noches:* ${booking.nights}\n*Pendiente de pago*`;
  }

  return '';
}

function generateEmailNotification(booking: any, eventType: string): string {
  const checkInDate = new Date(booking.checkIn).toLocaleDateString('es-PE');
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('es-PE');

  if (eventType === 'payment_received') {
    return `
      <h2>Reservación Confirmada</h2>
      <table border="1" cellpadding="10">
        <tr>
          <td><strong>Huésped:</strong></td>
          <td>${booking.guestName}</td>
        </tr>
        <tr>
          <td><strong>Teléfono:</strong></td>
          <td>${booking.guestPhone}</td>
        </tr>
        <tr>
          <td><strong>Email:</strong></td>
          <td>${booking.guestEmail}</td>
        </tr>
        <tr>
          <td><strong>Check-in:</strong></td>
          <td>${checkInDate}</td>
        </tr>
        <tr>
          <td><strong>Check-out:</strong></td>
          <td>${checkOutDate}</td>
        </tr>
        <tr>
          <td><strong>Noches:</strong></td>
          <td>${booking.nights}</td>
        </tr>
        <tr>
          <td><strong>Monto Total:</strong></td>
          <td>${booking.totalAmount} ${booking.currency}</td>
        </tr>
        <tr>
          <td><strong>ID Reservación:</strong></td>
          <td>${booking.id}</td>
        </tr>
      </table>
      <p>Pago recibido vía Mercado Pago</p>
    `;
  }

  return '';
}
