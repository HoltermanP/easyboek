# Stripe Setup Guide - Development & Production

Deze gids legt uit hoe je Stripe configureert voor development (lokaal) en productie, inclusief de bypass mode voor testen.

## Abonnementen Overzicht

- **Basis**: €29,95/maand (maandelijks betalen, jaarlijks contract van 12 maanden, niet tussentijds opzegbaar)
- **Premium**: €39,95/maand (maandelijks betalen, jaarlijks contract van 12 maanden met 1 maand gratis proefperiode, niet tussentijds opzegbaar)
- **Proefperiode**: Premium heeft een gratis proefmaand van 30 dagen
- **Contract**: Alle abonnementen hebben een jaarlijks contract (12 maanden), maar worden maandelijks betaald

## Overzicht

De applicatie ondersteunt drie modi:
1. **Bypass Mode**: Testen zonder Stripe (alleen development)
2. **Stripe Test Mode**: Testen met Stripe test keys (development)
3. **Stripe Live Mode**: Productie met echte betalingen

---

## Development Mode

### Optie 1: Bypass Mode (Aanbevolen voor lokale ontwikkeling)

Met bypass mode kun je de applicatie testen zonder Stripe te configureren. Abonnementen worden direct aangemaakt in de database.

**Configuratie in `.env`:**
```env
NODE_ENV=development
STRIPE_BYPASS_MODE=true
# Stripe keys zijn niet nodig in bypass mode
```

**Voordelen:**
- Geen Stripe account nodig voor testen
- Geen test keys nodig
- Snelle setup
- Direct testen van functionaliteit

**Hoe het werkt:**
- Checkout requests maken direct een test subscription aan
- Geen Stripe checkout pagina
- Geen webhook processing nodig
- Direct doorsturen naar dashboard

---

### Optie 2: Stripe Test Mode

Test met echte Stripe functionaliteit maar zonder echte betalingen.

**Configuratie in `.env`:**
```env
NODE_ENV=development
STRIPE_BYPASS_MODE=false
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Optioneel voor lokale test
STRIPE_PRICE_ID_BASIS=price_test_...
STRIPE_PRICE_ID_PREMIUM=price_test_...
```

**Stappen:**
1. Maak een Stripe account aan op [stripe.com](https://stripe.com)
2. Ga naar [Stripe Dashboard](https://dashboard.stripe.com)
3. Zorg dat je in **Test mode** bent (toggle rechtsboven)
4. Haal test keys op: **Developers** → **API keys**
5. Maak test producten aan: **Products** → **Add product**
6. Kopieer de Price IDs naar je `.env`

**Voor lokale webhook testing:**
```bash
# Installeer Stripe CLI
npm install -g stripe-cli

# Login
stripe login

# Forward webhooks naar lokale server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

De output geeft je een `whsec_...` secret die je kunt gebruiken.

---

## Production Mode

In productie gebruik je altijd Stripe Live mode. Bypass mode is **niet toegestaan** in productie.

**Configuratie in Vercel Environment Variables:**
```env
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Van productie webhook endpoint
STRIPE_PRICE_ID_BASIS=price_live_...
STRIPE_PRICE_ID_PREMIUM=price_live_...
# STRIPE_BYPASS_MODE niet ingesteld of false
```

**Stappen voor productie:**
1. Zorg dat je Stripe account volledig is ingesteld (verificatie, bankrekening, etc.)
2. Schakel over naar **Live mode** in Stripe Dashboard
3. Haal live keys op: **Developers** → **API keys**
4. Maak live producten aan (of kopieer van test naar live)
5. Maak webhook endpoint aan:
   - **Developers** → **Webhooks** → **Add endpoint**
   - URL: `https://jouw-domein.com/api/webhooks/stripe`
   - Selecteer events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
   - Kopieer de webhook secret
6. Voeg alle variabelen toe aan Vercel Environment Variables

---

## Environment Variables Overzicht

| Variabele | Development (Bypass) | Development (Test) | Production |
|-----------|---------------------|-------------------|------------|
| `STRIPE_BYPASS_MODE` | `true` | `false` | niet ingesteld of `false` |
| `STRIPE_SECRET_KEY` | niet nodig | `sk_test_...` | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | niet nodig | `pk_test_...` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | niet nodig | `whsec_...` (optioneel) | `whsec_...` (verplicht) |
| `STRIPE_PRICE_ID_BASIS` | niet nodig | `price_test_...` (maandelijks) | `price_live_...` (maandelijks) |
| `STRIPE_PRICE_ID_PREMIUM` | niet nodig | `price_test_...` (maandelijks) | `price_live_...` (maandelijks) |

**BELANGRIJK**: 
- Alle abonnementen worden **maandelijks** betaald (monthly) in Stripe
- Maar hebben een **jaarlijks contract** van 12 maanden (niet tussentijds opzegbaar)
- Premium heeft automatisch een **30-dagen proefperiode** voor nieuwe gebruikers
- Abonnementen zijn **niet tussentijds opzegbaar** tot het einde van het 12-maanden contract

---

## Code Flow

### Bypass Mode Flow
```
User clicks "Subscribe"
  ↓
POST /api/checkout
  ↓
Check STRIPE_BYPASS_MODE === true
  ↓
createTestSubscription() → Direct database insert
  ↓
Return success → Redirect to dashboard
```

### Stripe Mode Flow
```
User clicks "Subscribe"
  ↓
POST /api/checkout
  ↓
Check STRIPE_BYPASS_MODE === false
  ↓
Create Stripe Checkout Session
  - Maandelijkse subscription (monthly)
  - Voor Premium: Voeg 30-dagen trial period toe (als gebruiker nog geen subscription heeft)
  - Voor Basis: Geen trial period
  ↓
Return Stripe checkout URL
  ↓
User completes payment on Stripe
  ↓
Stripe webhook → /api/webhooks/stripe
  ↓
Update subscription in database
  - Maandelijkse betalingen, maar jaarlijks contract (12 maanden vanaf start)
  - currentPeriodEnd = 12 maanden vanaf start (contract einddatum)
  - cancelAtPeriodEnd = false (niet opzegbaar tussentijds)
```

---

## Troubleshooting

### "Stripe is niet geconfigureerd" error
- **Bypass mode**: Zet `STRIPE_BYPASS_MODE=true` in `.env`
- **Stripe mode**: Zorg dat `STRIPE_SECRET_KEY` is ingesteld en `STRIPE_BYPASS_MODE=false`

### Webhooks werken niet lokaal
- Gebruik Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Of gebruik bypass mode voor lokale ontwikkeling

### Bypass mode werkt niet in productie
- Dit is beveiligd: bypass mode is alleen toegestaan in development
- Gebruik altijd Stripe Live mode in productie

### Test subscriptions blijven actief
- In bypass mode worden subscriptions direct als "active" aangemaakt
- Dit is normaal gedrag voor testen
- In productie worden subscriptions alleen actief na succesvolle betaling

### Stripe Product Setup
**BELANGRIJK**: Configureer de producten als **maandelijks** (monthly) in Stripe Dashboard:
1. Ga naar **Products** → **Add product**
2. Voor **Basis**: 
   - Naam: "Basis"
   - Prijs: €29,95
   - Billing period: **Monthly** (maandelijks)
3. Voor **Premium**:
   - Naam: "Premium"
   - Prijs: €39,95
   - Billing period: **Monthly** (maandelijks)
   - Trial period: 30 dagen (wordt automatisch toegevoegd door de applicatie voor nieuwe gebruikers)
4. Kopieer de Price IDs naar je environment variables

**Let op**: Hoewel de betalingen maandelijks zijn, heeft elk abonnement een **jaarlijks contract van 12 maanden** dat niet tussentijds opzegbaar is. Dit wordt beheerd door de applicatie, niet door Stripe.

---

## Best Practices

1. **Development**: Gebruik bypass mode voor snelle ontwikkeling
2. **Testing Stripe flow**: Schakel tijdelijk over naar test mode
3. **Production**: Gebruik altijd live mode, nooit bypass mode
4. **Security**: Deel nooit je live Stripe keys publiekelijk
5. **Webhooks**: Test webhooks altijd eerst in test mode voordat je live gaat

---

## Meer Informatie

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [STRIPE_CONFIGURATIE.md](./STRIPE_CONFIGURATIE.md) - Originele setup guide
- [STRIPE_WEBHOOK_SETUP.md](./STRIPE_WEBHOOK_SETUP.md) - Webhook setup details

