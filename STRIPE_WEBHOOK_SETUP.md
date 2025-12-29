# Stripe Webhook Secret - Stap voor Stap

## Waarom zie ik geen webhook secret?

De webhook secret wordt **pas gegenereerd** nadat je een webhook endpoint hebt aangemaakt in Stripe. Je kunt deze niet vinden in de API keys sectie - het is een aparte functie.

## Hoe krijg ik een webhook secret?

### Optie 1: Voor Productie (Vercel)

1. **Deploy eerst je applicatie** naar Vercel (zonder webhook secret - dit is OK)
2. Ga naar [Stripe Dashboard](https://dashboard.stripe.com)
3. **Zorg dat je in Live mode bent** (toggle rechtsboven)
4. Ga naar **Developers** → **Webhooks** (linker menu)
5. Klik op **Add endpoint** (rechtsboven)
6. Vul in:
   ```
   Endpoint URL: https://jouw-domein.vercel.app/api/webhooks/stripe
   ```
7. Klik op **Add events** en selecteer:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
8. Klik op **Add endpoint**
9. Je ziet nu je nieuwe webhook in de lijst
10. **Klik op de webhook** om de details te openen
11. Scroll naar beneden naar **"Signing secret"**
12. Klik op **"Reveal"** naast de signing secret
13. **Kopieer de secret** (begint met `whsec_live_...`)
14. Voeg deze toe in Vercel: **Settings** → **Environment Variables** → `STRIPE_WEBHOOK_SECRET`

### Optie 2: Voor Development (Test Mode)

1. Ga naar [Stripe Dashboard](https://dashboard.stripe.com)
2. **Zorg dat je in Test mode bent** (toggle rechtsboven)
3. Volg dezelfde stappen als hierboven, maar gebruik:
   - Test mode webhook
   - Secret begint met `whsec_test_...`
   - Voeg toe aan je lokale `.env` bestand

### Optie 3: Voor Lokale Ontwikkeling (Stripe CLI - Aanbevolen)

Als je lokaal ontwikkelt, kun je de Stripe CLI gebruiken in plaats van een webhook secret:

1. **Installeer Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows (via Scoop)
   scoop install stripe
   
   # Of download van https://stripe.com/docs/stripe-cli
   ```

2. **Login**:
   ```bash
   stripe login
   ```

3. **Forward webhooks naar je lokale server** (in een aparte terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. De CLI toont een webhook secret, maar je hoeft deze niet te gebruiken - de CLI handelt alles af.

5. **Test webhooks** (in een andere terminal):
   ```bash
   stripe trigger checkout.session.completed
   ```

**Voordeel**: Je hoeft geen webhook secret in je `.env` te zetten en je kunt webhooks lokaal testen.

## Waar vind ik mijn webhook secret in Stripe Dashboard?

1. Ga naar **Developers** → **Webhooks**
2. Klik op je webhook endpoint
3. Scroll naar beneden naar **"Signing secret"**
4. Klik op **"Reveal"** om de secret te zien
5. Klik op **"Copy"** om te kopiëren

## Belangrijke opmerkingen

- **Test vs Live**: 
  - Test webhook secrets beginnen met `whsec_test_...`
  - Live webhook secrets beginnen met `whsec_live_...`
  - Gebruik de juiste secret voor de juiste omgeving!

- **Meerdere webhooks**: Je kunt meerdere webhook endpoints hebben (bijv. één voor test, één voor live)

- **Webhook secret wijzigen**: Als je de secret verliest of wilt resetten, kun je een nieuwe secret genereren in het webhook endpoint detail scherm

## Troubleshooting

### "Webhook signature verification failed"
- Controleer of je de juiste secret gebruikt (test vs live)
- Zorg dat de secret correct is gekopieerd (geen extra spaties)
- Voor lokale ontwikkeling: gebruik Stripe CLI of zorg dat je test webhook secret correct is

### "No signature" error
- Zorg dat je webhook endpoint correct is geconfigureerd
- Check of Stripe de webhook kan bereiken (voor productie: check Vercel logs)

### Webhook werkt niet lokaal
- Gebruik Stripe CLI (`stripe listen`) in plaats van een webhook secret
- Of maak een test webhook aan in Stripe Dashboard en gebruik de test secret

