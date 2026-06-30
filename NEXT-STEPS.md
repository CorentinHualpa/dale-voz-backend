# Dale Voz MVP — Prochaines étapes

**Commit initial** : scaffold complet pour Palier 1 (WhatsApp texte + notes vocales + paiements).

## ✅ Ce qui est fait

- [x] Structure repo + TypeScript + Express
- [x] Prisma schema (clients, bookings, payments, conversations)
- [x] Meta WhatsApp webhook handler (entrants + sortants)
- [x] Message parsing (texte, audio, boutons)
- [x] Transcription (Whisper OpenAI)
- [x] TTS placeholder (ElevenLabs API ready)
- [x] nova-core service integration (external HTTP)
- [x] Mercado Pago checkout + webhook validation
- [x] Notifications (WhatsApp + email via Resend)
- [x] Database models + relations
- [x] Config management (env vars)

## 🔧 À faire immédiatement

### Phase 0.5 : Setup infra (semaine 1)

1. **Remplir .env** :
   ```
   DATABASE_URL=postgresql://...  (Railway à créer)
   META_BUSINESS_ACCOUNT_ID=...
   META_WHATSAPP_PHONE_ID_CONVERSATIONS=...
   META_WHATSAPP_PHONE_ID_NOTIFICATIONS=...
   META_WEBHOOK_VERIFY_TOKEN=...
   ```
   → Prendre les clés du vault : `C:\Users\msi\.secrets\api-keys.env`

2. **Installer node_modules** :
   ```bash
   npm install
   ```

3. **Setup Prisma** :
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **Tester localement** :
   ```bash
   npm run dev
   # GET http://localhost:3000/health → { status: 'ok' }
   ```

5. **Exposer via ngrok** (pour Meta webhook) :
   ```bash
   ngrok http 3000
   # Webhook URL: https://XXX.ngrok.io/api/whatsapp/webhook
   # Register in Meta Business Manager
   ```

### Phase 1 : Completion (semaine 2-3)

**Problèmes connus à corriger** :

1. **nova-core abstraction** :
   - [ ] Créer service REST séparé (ou réutiliser de revolution-web)
   - [ ] Endpoint `POST /chat` qui prend `messages[]` + `context` + `tools`
   - [ ] Retourner `{ text, audio_url?, actions[] }`
   - Config : `NOVA_CORE_URL` en `.env`

2. **Signature Meta validation** :
   - [ ] Ajouter `WHATSAPP_APP_SECRET` en env (pour vérifier `x-hub-signature-256`)
   - [ ] Corriger `verifySignature()` dans webhook.ts (manque app secret)

3. **Tests end-to-end** :
   - [ ] Envoyer message test via Meta testing tools
   - [ ] Vérifier que webhook reçoit
   - [ ] Confirmer nova-core appel OK
   - [ ] Vérifier réponse WhatsApp renvoyée

4. **Paiement Mercado Pago** :
   - [ ] Créer compte test Mercado Pago (si pas existe)
   - [ ] Tester création checkout
   - [ ] Tester webhook de confirmation

5. **Email notifications** :
   - [ ] Tester Resend (clé API)
   - [ ] Valider templates email (ici c'est basique HTML)

### Phase 2 : Refinement (semaine 4-5)

- [ ] Gérer timeout paiement (24h non payé → cancel resa)
- [ ] Retry logic pour nova-core failures
- [ ] Rate limiting par hotel
- [ ] Logging + monitoring (Sentry ou custom)
- [ ] Tests unitaires (services)
- [ ] Tests intégration (webhook → DB → notification)

### Phase 3 : Déploiement (semaine 6)

1. **Railway** :
   - [ ] Créer projet Railway
   - [ ] Ajouter GitHub repo
   - [ ] Configurer env vars
   - [ ] Ajouter PostgreSQL plugin
   - [ ] Deploy
   - [ ] Mettre à jour Meta webhook URL

2. **Logs + monitoring** :
   - [ ] Vérifier Railway logs
   - [ ] Setup alertes (Slack ?)

3. **Premier client pilot** :
   - [ ] Créer entrée en DB (hotel, credentials Mercado Pago)
   - [ ] Assigner Phone ID WhatsApp
   - [ ] Test end-to-end réel (pas test tools)
   - [ ] Valider flow : message → resa → paiement → notif

## 🎯 Fichiers critiques à implémenter / corriger

| Fichier | Statut | Notes |
|---|---|---|
| `src/services/nova-core.ts` | 🟡 Stub | Dépend de service externe à implémenter |
| `src/api/whatsapp/webhook.ts` | 🟡 Partial | Signature verification manque app secret |
| `src/services/transcription.ts` | 🟡 Stub | Besoin accès Meta pour media URL |
| `src/services/text-to-speech.ts` | 🟡 Stub | ElevenLabs API key nécessaire |
| `src/services/payment.ts` | 🟡 Working | OK si creds Mercado Pago setup |
| `src/services/notification.ts` | 🟡 Working | OK si Resend API key setup |
| `prisma/schema.prisma` | ✅ Complete | Prêt pour migration |

## 📋 Checklist avant Palier 2 (telephone overflow)

- [ ] Palier 1 en production (clients réels)
- [ ] Data terrain : taux conv par canal, durée moyenne appels
- [ ] Telnyx DID PE configuré (bundle 72h)
- [ ] LiveKit Agents setup (si pas déjà)
- [ ] OpenAI Realtime plugin validé

## 📚 Documentation additionnelle

- `PLAN-BUILD-MVP.md` : détail semaine par semaine (phase 0-4)
- `Architecture-Technique-Dale-Voz.md` : archi + paliers + points validation
- `SUIVI-Dale-Voz.md` : décisions + questions ouvertes

## 💬 Questions à Coq

1. Quel repo pour nova-core service ? (nouveau ou dans revolution-web ?)
2. Mercado Pago account déjà setup pour RA ?
3. Resend setup pour domaine dalevoz.pe ?
4. Timeline réaliste pour entretiens terrain (Jacky) ?
5. Cloudbeds API keys pour client pilot #1 ?

## Ordre prioritaire

1. **Semaine 1** : Setup infra + .env + npm install + tests locaux
2. **Semaine 2** : Valider webhook Meta + nova-core integration
3. **Semaine 3** : Valider Mercado Pago + email notifications
4. **Semaine 4** : Deploy Railway + client pilot
5. **Semaines 5-6** : Feedback terrain + polish avant Palier 2
