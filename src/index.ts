import express from 'express';
import { config } from './config.js';
import { whatsappRouter } from './api/whatsapp/webhook.js';
import { mercadoPagoRouter } from './api/mercado-pago/webhook.js';
import { notificationRouter } from './api/notification/router.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/mercado-pago', mercadoPagoRouter);
app.use('/api/notification', notificationRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const port = config.port;
app.listen(port, () => {
  console.log(`🚀 Dale Voz backend running on port ${port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});
