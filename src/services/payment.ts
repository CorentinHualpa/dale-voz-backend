import axios from 'axios';
import { prisma } from '../db.js';

export async function createMercadoPagoCheckout(
  bookingId: string,
  amount: number,
  currency: string,
  clientId: string
): Promise<{
  preference_id: string;
  init_point: string;
  qr_code?: string;
}> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const response = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      {
        items: [
          {
            title: `Reservación - ${client.hotelName}`,
            quantity: 1,
            unit_price: amount,
            currency_id: currency === 'PEN' ? 'PEN' : 'USD',
          },
        ],
        payer: {
          email: booking.guestEmail || 'guest@example.com',
          name: booking.guestName,
          phone: {
            area_code: '51',
            number: parseInt(booking.guestPhone?.replace('+51', '') || '0'),
          },
        },
        payment_methods: {
          excluded_payment_types: [],
          installments: 1,
        },
        notification_url: `${process.env.API_URL || 'http://localhost:3000'}/api/mercado-pago/webhook`,
        external_reference: bookingId,
        auto_return: 'approved',
      },
      {
        headers: {
          Authorization: `Bearer ${client.mercadoPagoAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;

    // Update booking with Mercado Pago preference ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        mercadoPagoPreferenceId: data.id,
      },
    });

    return {
      preference_id: data.id,
      init_point: data.init_point,
      qr_code: data.qr_code,
    };
  } catch (error) {
    console.error('Error creating Mercado Pago checkout:', error);
    throw error;
  }
}

export async function validateMercadoPagoPayment(
  paymentId: string,
  accessToken: string
): Promise<{
  status: string;
  amount: number;
  external_reference: string;
}> {
  try {
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      status: response.data.status,
      amount: response.data.transaction_amount,
      external_reference: response.data.external_reference,
    };
  } catch (error) {
    console.error('Error validating Mercado Pago payment:', error);
    throw error;
  }
}
