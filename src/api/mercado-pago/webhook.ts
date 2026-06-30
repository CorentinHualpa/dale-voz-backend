import express from 'express';
import { prisma } from '../../db.js';
import { validateMercadoPagoPayment } from '../../services/payment.js';
import { sendNotificationToHotel } from '../../services/notification.js';

export const mercadoPagoRouter = express.Router();

mercadoPagoRouter.post('/webhook', async (req, res) => {
  const { data, type } = req.body;

  if (type !== 'payment') {
    return res.sendStatus(200);
  }

  try {
    const paymentId = data.id;
    const bookingId = data.external_reference;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hotel: true },
    });

    if (!booking) {
      console.error(`Booking not found for payment ${paymentId}`);
      return res.sendStatus(404);
    }

    // Validate payment
    const payment = await validateMercadoPagoPayment(
      paymentId,
      booking.hotel.mercadoPagoAccessToken || ''
    );

    if (payment.status === 'approved') {
      console.log(`✓ Payment approved for booking ${bookingId}`);

      // Update booking
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'paid',
          mercadoPagoPaymentId: paymentId,
          paidAt: new Date(),
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          bookingId,
          mercadoPagoId: paymentId,
          amount: booking.totalAmount,
          currency: booking.currency,
          method: 'mercado_pago',
          status: 'approved',
        },
      });

      // Send notification to hotel
      await sendNotificationToHotel(bookingId, 'payment_received');
    } else if (payment.status === 'rejected') {
      console.log(`✗ Payment rejected for booking ${bookingId}`);

      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'payment_failed' },
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing Mercado Pago webhook:', error);
    res.sendStatus(500);
  }
});
