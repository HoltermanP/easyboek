# Stripe Quick Start - Wat moet je nog doen?

## ✅ Wat je al hebt:
- ✅ Stripe Secret Key (sk_test_...)
- ✅ Stripe Publishable Key (pk_test_...)

## ❌ Wat je nog moet doen:

### 1. Producten en Prijzen Aanmaken (BELANGRIJK!)

Je moet twee producten aanmaken in Stripe Dashboard om Price IDs te krijgen.

#### Stap 1: Basis Plan
1. Ga naar [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Klik op **"Add product"** (rechtsboven)
3. Vul in:
   - **Name**: `Basis Plan`
   - **Description**: `Voor zelfstandigen die zelf de controle willen houden`
4. Scroll naar **Pricing**:
   - Selecteer **Recurring**
   - **Price**: `29.95`
   - **Currency**: `EUR`
   - **Billing period**: `Monthly`
5. Klik **Save product**
6. **Kopieer de Price ID** (begint met `price_...`)
   - Staat onder de prijs of in de URL
7. Update je `.env`:
   ```env
   STRIPE_PRICE_ID_BASIS="price_..."  # Vervang met echte Price ID
   ```

#### Stap 2: Premium Plan
1. Ga weer naar **Products** → **Add product**
2. Vul in:
   - **Name**: `Premium Plan`
   - **Description**: `Volledig ontzorgd met AI en ondersteuning`
3. Scroll naar **Pricing**:
   - Selecteer **Recurring**
   - **Price**: `39.95`
   - **Currency**: `EUR`
   - **Billing period**: `Monthly`
4. Klik **Save product**
5. **Kopieer de Price ID**
6. Update je `.env`:
   ```env
   STRIPE_PRICE_ID_PREMIUM="price_..."  # Vervang met echte Price ID
   ```

### 2. Webhook Secret (Optioneel voor Development)

Je hebt twee opties:

#### Optie A: Stripe CLI gebruiken (Aanbevolen)
```bash
# Installeer Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks (in aparte terminal)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Met Stripe CLI hoef je `STRIPE_WEBHOOK_SECRET` niet in je `.env` te zetten!

#### Optie B: Test Webhook Aanmaken
1. Ga naar [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Klik **Add endpoint**
3. Endpoint URL: gebruik ngrok of Stripe CLI (beter)
4. Selecteer events (zie STRIPE_CONFIGURATIE.md)
5. Kopieer de Signing secret (whsec_test_...)
6. Update je `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_test_..."  # Vervang met echte secret
   ```

## Testen

Na het invullen van de Price IDs:

1. Herstart je development server:
   ```bash
   npm run dev
   ```

2. Test de checkout:
   - Ga naar `/sign-up`
   - Maak een account
   - Kies een plan
   - Gebruik test card: `4242 4242 4242 4242`

## Hulp Nodig?

Zie `STRIPE_CONFIGURATIE.md` voor gedetailleerde instructies met screenshots.

