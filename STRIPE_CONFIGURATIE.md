# Stripe Configuratie - Stap voor Stap

Deze gids helpt je om Stripe volledig te configureren voor je ZZP Ontzorg applicatie.

## Stap 1: Stripe Account Aanmaken (als je die nog niet hebt)

1. Ga naar [stripe.com](https://stripe.com)
2. Klik op **"Start now"** of **"Sign in"**
3. Maak een account aan of log in
4. Voltooi de account setup (bedrijfsgegevens, bankrekening, etc.)

## Stap 2: API Keys Ophalen

### Voor Development (Test Mode)

1. Ga naar [Stripe Dashboard](https://dashboard.stripe.com)
2. **Zorg dat je in Test mode bent** (toggle rechtsboven moet "Test mode" zeggen)
3. Ga naar **Developers** → **API keys** (linker menu)
4. Je ziet twee keys:
   - **Publishable key** (begint met `pk_test_...`)
   - **Secret key** (begint met `sk_test_...`) - klik op **"Reveal test key"** om deze te zien

5. Kopieer beide keys en voeg ze toe aan je `.env`:
   ```env
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

### Voor Productie (Live Mode)

1. Zorg dat je account volledig is ingesteld (verificatie, bankrekening, etc.)
2. **Schakel over naar Live mode** (toggle rechtsboven)
3. Ga naar **Developers** → **API keys**
4. Kopieer de **Live** keys (beginnen met `pk_live_...` en `sk_live_...`)
5. Voeg deze toe aan je Vercel environment variables

## Stap 3: Producten en Prijzen Aanmaken

Je hebt twee abonnementen nodig: **Basis** en **Premium**.

### Product 1: Basis Plan

1. Ga naar **Products** → **Add product** (rechtsboven)
2. Vul in:
   - **Name**: `Basis Plan`
   - **Description**: `Voor zelfstandigen die zelf de controle willen houden`
3. Scroll naar beneden naar **Pricing**
4. Selecteer **Recurring** (abonnement)
5. Vul in:
   - **Price**: `29.95`
   - **Currency**: `EUR` (Euro)
   - **Billing period**: `Monthly`
6. Klik op **Save product**
7. **BELANGRIJK**: Kopieer de **Price ID** (begint met `price_...`)
   - Deze staat onder de prijs, of in de URL na het aanmaken
8. Voeg toe aan `.env`:
   ```env
   STRIPE_PRICE_ID_BASIS="price_..."
   ```

### Product 2: Premium Plan

1. Ga weer naar **Products** → **Add product**
2. Vul in:
   - **Name**: `Premium Plan`
   - **Description**: `Volledig ontzorgd met AI en ondersteuning`
3. Scroll naar beneden naar **Pricing**
4. Selecteer **Recurring**
5. Vul in:
   - **Price**: `39.95` (introductieprijs voor eerste 6 maanden)
   - **Currency**: `EUR`
   - **Billing period**: `Monthly`
6. **Optioneel**: Je kunt later een promotion code aanmaken voor de verhoging naar €49,95 na 6 maanden
7. Klik op **Save product**
8. Kopieer de **Price ID** (begint met `price_...`)
9. Voeg toe aan `.env`:
   ```env
   STRIPE_PRICE_ID_PREMIUM="price_..."
   ```

### Waar vind ik de Price ID?

Na het aanmaken van een product:
- De Price ID staat in de product detail pagina
- Of in de URL: `https://dashboard.stripe.com/test/products/prod_.../prices/price_...`
- De Price ID begint altijd met `price_...`

## Stap 4: Webhook Configureren (Optioneel voor Development)

Voor lokale ontwikkeling kun je de Stripe CLI gebruiken (aanbevolen) of een test webhook aanmaken.

### Optie A: Stripe CLI (Aanbevolen voor Development)

1. **Installeer Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Of download van https://stripe.com/docs/stripe-cli
   ```

2. **Login**:
   ```bash
   stripe login
   ```

3. **Forward webhooks** (in een aparte terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Met Stripe CLI hoef je geen `STRIPE_WEBHOOK_SECRET` in je `.env` te zetten!

### Optie B: Test Webhook Aanmaken

1. Ga naar **Developers** → **Webhooks**
2. Klik op **Add endpoint**
3. Endpoint URL: `https://your-domain.ngrok.io/api/webhooks/stripe` (gebruik ngrok voor lokale testing)
   - Of gebruik Stripe CLI (beter voor development)
4. Selecteer events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Klik op **Add endpoint**
6. Kopieer de **Signing secret** (whsec_test_...)
7. Voeg toe aan `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_test_..."
   ```

## Stap 5: .env Bestand Invullen

Je `.env` bestand zou er zo uit moeten zien:

```env
# Stripe Configuration (Test Mode voor Development)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET=""  # Leeg laten als je Stripe CLI gebruikt
STRIPE_PRICE_ID_BASIS="price_..."
STRIPE_PRICE_ID_PREMIUM="price_..."
```

## Stap 6: Testen

1. Start je development server:
   ```bash
   npm run dev
   ```

2. Test de checkout flow:
   - Ga naar `/sign-up`
   - Maak een account aan
   - Kies een plan
   - Probeer een checkout te starten

3. Gebruik Stripe test card numbers:
   - **Succesvol**: `4242 4242 4242 4242`
   - **Declined**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0025 0000 3155`
   - Gebruik elke toekomstige datum voor expiratie
   - Gebruik elke 3 cijfers voor CVC

## Stap 7: Productie Configuratie (Vercel)

Voor productie moet je:

1. **Schakel over naar Live mode** in Stripe Dashboard
2. **Maak dezelfde producten aan** in Live mode (of kopieer ze)
3. **Kopieer Live API keys** en voeg toe aan Vercel environment variables
4. **Maak een Live webhook endpoint** aan met je Vercel URL
5. **Kopieer Live Price IDs** en voeg toe aan Vercel

### Vercel Environment Variables:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
STRIPE_PRICE_ID_BASIS=price_... (live)
STRIPE_PRICE_ID_PREMIUM=price_... (live)
```

## Troubleshooting

### "Stripe is niet geconfigureerd" error
- Controleer of `STRIPE_SECRET_KEY` is ingesteld in je `.env`
- Zorg dat de key begint met `sk_test_...` (development) of `sk_live_...` (productie)
- Herstart je development server na het toevoegen van environment variables

### "Stripe price ID niet geconfigureerd" error
- Controleer of `STRIPE_PRICE_ID_BASIS` en `STRIPE_PRICE_ID_PREMIUM` zijn ingesteld
- Zorg dat de Price IDs beginnen met `price_...`
- Check of je in de juiste mode bent (test vs live)

### Webhook errors
- Voor development: gebruik Stripe CLI (`stripe listen`)
- Voor productie: check of webhook endpoint correct is geconfigureerd
- Check Vercel logs voor webhook errors

### Test cards werken niet
- Zorg dat je in **Test mode** bent in Stripe Dashboard
- Gebruik de test card numbers hierboven
- Check of je test API keys gebruikt (niet live keys)

## Handige Links

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Keys](https://dashboard.stripe.com/test/apikeys)
- [Stripe Products](https://dashboard.stripe.com/test/products)
- [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

