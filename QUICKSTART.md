# Quick Start - Dale Voz MVP

## 1. Cloner les repos

```bash
cd C:\Users\msi\Documents\MEGA\PRO\Cowork
git clone https://github.com/CorentinHualpa/nova-core.git
git clone https://github.com/CorentinHualpa/dale-voz-backend.git
```

(Si déjà clonés, juste `git pull`.)

## 2. Setup nova-core (Terminal 1)

```bash
cd nova-core
npm install
cp .env.example .env
# Edit .env : ajouter OPENAI_API_KEY du vault
npm run dev
```

Vérifier : `curl http://localhost:3001/health`

## 3. Setup dale-voz-backend (Terminal 2)

```bash
cd ../dale-voz-backend
npm install
npx prisma migrate dev --name init
cp .env.example .env
# Edit .env : META_*, MERCADO_PAGO_*, RESEND_*, NOVA_CORE_URL=http://localhost:3001
npm run dev
```

Vérifier : `curl http://localhost:3000/health`

## 4. Exposer webhook (Terminal 3)

```bash
ngrok http 3000
# Copier https://XXX.ngrok.io
```

## 5. Configurer Meta Business Manager

1. Aller à https://developers.facebook.com/
2. Webhook Settings :
   - Verify Token : (copier de .env META_WEBHOOK_VERIFY_TOKEN)
   - Callback URL : https://XXX.ngrok.io/api/whatsapp/webhook
   - Verify & Save

## 6. Test E2E

Envoyer message WhatsApp (via Meta testing ou vrai numéro) :
```
"Hola, quiero reservar una habitación"
```

Vérifier dans les logs :
- Terminal 2 (dale-voz) : "📨 Incoming message"
- Terminal 2 : "✓ Booking created"
- Terminal 1 (nova-core) : réponse OpenAI

## Checklist

- [ ] nova-core running (3001)
- [ ] dale-voz running (3000)
- [ ] Prisma migrate OK
- [ ] ngrok exposing 3000
- [ ] Meta webhook configured
- [ ] Env vars remplis (vault)
- [ ] Test message sent
- [ ] Logs show success

## Fichiers clés

- `nova-core/.env` : OPENAI_API_KEY
- `dale-voz-backend/.env` : tous les autres secrets
- `dale-voz-backend/prisma/schema.prisma` : DB schema
- `INTEGRATION.md` : détails architecture
- `NEXT-STEPS.md` : phase par phase

## Troubleshooting

**nova-core not found** → `npm run dev` dans nova-core terminal

**Prisma error** → `npx prisma migrate reset` (WARNING: perd données)

**Meta webhook not receiving** → vérifier ngrok URL + verify token

**OpenAI error** → vérifier OPENAI_API_KEY dans .env

**WhatsApp send fails** → vérifier META_WHATSAPP_PHONE_ID_CONVERSATIONS + access token

## Next

1. ✅ Setup local
2. → Deploy to Railway
3. → Add client #1
4. → Palier 2 (phone overflow)
