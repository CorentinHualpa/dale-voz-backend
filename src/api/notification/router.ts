import express from 'express';
import { sendNotificationToHotel } from '../../services/notification.js';

export const notificationRouter = express.Router();

// Manually trigger notification (for testing)
notificationRouter.post('/send', async (req, res) => {
  const { bookingId, eventType } = req.body;

  if (!bookingId || !eventType) {
    return res.status(400).json({
      error: 'Missing bookingId or eventType',
    });
  }

  try {
    await sendNotificationToHotel(
      bookingId,
      eventType as 'payment_received' | 'reservation_created' | 'guest_arrived'
    );

    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      error: 'Error sending notification',
      message: (error as Error).message,
    });
  }
});
