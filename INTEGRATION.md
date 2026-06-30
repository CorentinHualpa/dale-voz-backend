# Integration Guide - Dale Voz + Nova Core

Dale Voz backend interagit avec deux services externes :

1. **nova-core** — le cerveau IA (résout conversations, propose actions)
2. **Meta WhatsApp Cloud API** — le transport (envoie/reçoit messages)

## Architecture

```
WhatsApp Client
    ↓ (message entrant)
[Meta Webhook] → dale-voz-backend
    ↓
[Handler] parse + store message
    ↓
POST /api/chat → nova-core
    ↓
[OpenAI] génère réponse + actions
    ↓
Response : {text, actions[]}
    ↓
[dale-voz] envoie réponse WhatsApp + notif hôtel
    ↓
Mercado Pago (si paiement) → webhook → notif hôtel
```

## Setup local (développement)

### Terminal 1 : nova-core

```bash
cd ../nova-core
npm install
cp .env.example .env
# Edit .env avec OPENAI_API_KEY du vault

npm run dev
# 🧠 Nova Core running on port 3001
```

### Terminal 2 : dale-voz-backend

```bash
cd dale-voz-backend
npm install
cp .env.example .env
# Edit .env :
#   DATABASE_URL=postgresql://...
#   META_BUSINESS_ACCOUNT_ID=...
#   etc.
#   NOVA_CORE_URL=http://localhost:3001

npx prisma migrate dev --name init

npm run dev
# 🚀 Dale Voz backend running on port 3000
```

### Terminal 3 : ngrok (pour Meta webhook)

```bash
ngrok http 3000
# Copier https://XXX.ngrok.io
```

### Terminal 4 : Mercado Pago webhook (optionnel, pour tester payments)

```bash
# Laisser un terminal ouvert pour surveiller les logs
tail -f /var/log/dalvoz.log
```

## Test E2E local

1. **Envoyer message WhatsApp** via Meta testing tools ou vrai numéro Business :
   ```
   "Hola, quiero reservar una habitación"
   ```

2. **Vérifier logs** :
   ```bash
   # Terminal 2 (dale-voz)
   # Voir : 📨 Incoming message from +51...
   # Voir : ✓ Transcribed audio: ...
   # Voir : ✓ Booking created: RES_123
   ```

3. **Tester paiement** :
   - Bot devrait proposer checkout Mercado Pago
   - Cliquer lien → simuler paiement en sandbox MP
   - Webhook → notif hôtel via WhatsApp + email

## Environment Variables

### nova-core

```
PORT=3001
OPENAI_API_KEY=sk_...
```

### dale-voz-backend

```
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/dale_voz
META_BUSINESS_ACCOUNT_ID=...
META_WHATSAPP_PHONE_ID_CONVERSATIONS=...
META_WHATSAPP_PHONE_ID_NOTIFICATIONS=...
META_WEBHOOK_VERIFY_TOKEN=...
NOVA_CORE_URL=http://localhost:3001
MERCADO_PAGO_ACCESS_TOKEN=...
RESEND_API_KEY=...
```

Toutes les clés doivent venir du vault : `C:\Users\msi\.secrets\api-keys.env`

## Deployment (Railway)

### nova-core

1. Push GitHub → linked
2. Railway : new project → GitHub repo
3. Add env vars (OPENAI_API_KEY, etc.)
4. Deploy
5. Get URL (e.g., `https://nova-core-prod.railway.app`)

### dale-voz-backend

1. Push GitHub → linked
2. Railway : new project → GitHub repo
3. Add env vars :
   - DATABASE_URL (PostgreSQL from Railway)
   - META_* (from vault)
   - NOVA_CORE_URL=https://nova-core-prod.railway.app
   - MERCADO_PAGO_*, RESEND_API_KEY
4. Add PostgreSQL plugin
5. Deploy
6. Update Meta webhook URL to Railway URL

## Troubleshooting

### nova-core not responding

```bash
curl http://localhost:3001/health
# Should return {"status":"ok","service":"nova-core"}
```

If not:
- Check env vars (OPENAI_API_KEY)
- Check logs: `npm run dev`
- Check OpenAI account has credits

### WhatsApp webhook not receiving messages

- Verify ngrok URL in Meta Business Manager
- Check webhook verify token matches META_WEBHOOK_VERIFY_TOKEN
- Check dale-voz logs for errors

### Prisma migration fails

```bash
# Reset DB (warning: deletes data)
npx prisma migrate reset
```

### Payment webhook not triggering

- Mercado Pago : use sandbox tokens
- Verify webhook URL is public (not localhost)
- Check Mercado Pago logs in their dashboard

## Monitoring

- **dale-voz logs** : `npm run dev` or `tail -f logs/app.log`
- **nova-core logs** : `npm run dev` or check Railway logs
- **Mercado Pago** : https://www.mercadopago.com.pe/developers/panel
- **Meta** : https://developers.facebook.com/
- **Prisma Studio** : `npm run prisma:studio` (browse DB)

## Performance Notes

- nova-core calls: ~500-800ms (OpenAI latency)
- WhatsApp send: ~100-300ms
- Total roundtrip: ~1-2 seconds (acceptable for async)
- For real-time voice: use LiveKit Agents (Palier 2)

## Next Steps

1. ✅ Local dev setup
2. ✅ E2E test (message → resa → payment)
3. ✅ Deploy to Railway
4. → Add real client (hotel)
5. → Gather feedback
6. → Implement Palier 2 (phone overflow)
