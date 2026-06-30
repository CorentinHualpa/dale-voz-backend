# Dale Voz Backend

WhatsApp + Voice agents for hotels. MVP: WhatsApp texting, voice notes, payments via Mercado Pago, automatic notifications.

## Stack

- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Database**: PostgreSQL (Prisma ORM)
- **AI**: OpenAI (Whisper, GPT) + Grok Voice
- **Messaging**: Meta WhatsApp Cloud API
- **Payments**: Mercado Pago
- **Notifications**: Resend (email) + WhatsApp
- **Hosting**: Railway

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
# Edit .env with your secrets
```

Required:
- `DATABASE_URL` (PostgreSQL)
- `META_BUSINESS_ACCOUNT_ID`, `META_WHATSAPP_PHONE_ID_*`, `META_WEBHOOK_VERIFY_TOKEN`
- `OPENAI_API_KEY`, `XAI_API_KEY`
- `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_PUBLIC_KEY`
- `RESEND_API_KEY`

### 3. Database

```bash
# Create schema
npm run prisma:migrate

# (Optional) View DB in UI
npm run prisma:studio
```

### 4. Run locally

```bash
npm run dev
```

Server starts on `http://localhost:3000`.

Health check: `GET /health`

## API Endpoints

### WhatsApp Webhook

- `GET /api/whatsapp/webhook` — verify token
- `POST /api/whatsapp/webhook` — receive incoming messages

### Payments

- `POST /api/mercado-pago/webhook` — payment confirmations

### Notifications (testing)

- `POST /api/notification/send` — manually trigger notifications

## Architecture

```
Incoming Message (WhatsApp)
  ↓
[webhook handler]
  ↓
Parse + store in DB
  ↓
Call nova-core service (external)
  ↓
Generate response
  ↓
Send via WhatsApp Cloud API
  ↓
If action needed (reserve, pay): show confirmation button
  ↓
On confirmation: execute tool + trigger payment / notification
```

## Database Schema

- **clients** — hotels
- **bookings** — reservations
- **payments** — payment records
- **conversations** — chat sessions
- **messages** — message history

See `prisma/schema.prisma`.

## Deployment to Railway

1. Push repo to GitHub
2. Create Railway project, link GitHub repo
3. Add environment variables in Railway
4. Add PostgreSQL plugin
5. Deploy

## Testing Locally

Use ngrok to expose local server to Meta:

```bash
ngrok http 3000
# Update webhook URL in Meta Business Manager
# https://ngrok-url.ngrok.io/api/whatsapp/webhook
```

Test message via Meta's testing tools or real WhatsApp Business account.

## Roadmap (Future Paliers)

- **Palier 2**: Telephone overflow (SIP + LiveKit Agents)
- **Palier 3**: WhatsApp voice calls (when available in Peru)
- **Palier 4**: Dedicated DIDs per hotel
- **Later**: Cloudbeds integration, advanced analytics, self-serve onboarding
