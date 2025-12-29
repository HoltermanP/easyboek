# Vercel Deployment Setup

## Environment Variables in Vercel

### Stap 1: Ga naar Vercel Dashboard
1. Log in op [vercel.com](https://vercel.com)
2. Selecteer je project
3. Ga naar **Settings** → **Environment Variables**

### Stap 2: Voeg alle environment variables toe

#### Database
- **DATABASE_URL**: Connection string van Vercel Postgres of externe database
  - Voor Vercel Postgres: Ga naar **Storage** → **Create Database** → **Postgres**
  - Kopieer de connection string

#### Clerk Authentication
- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**: Production publishable key van Clerk
- **CLERK_SECRET_KEY**: Production secret key van Clerk
  - Haal deze op van [Clerk Dashboard](https://dashboard.clerk.com)
  - Gebruik **Production** keys, niet test keys

#### OpenAI
- **OPENAI_API_KEY**: Je OpenAI API key
  - Haal deze op van [OpenAI Platform](https://platform.openai.com/api-keys)

#### Stripe (Production)
- **STRIPE_SECRET_KEY**: Live secret key (sk_live_...)
- **STRIPE_PUBLISHABLE_KEY**: Live publishable key (pk_live_...)
- **STRIPE_WEBHOOK_SECRET**: Webhook secret voor productie
- **STRIPE_PRICE_ID_BASIS**: Live price ID voor Basis plan
- **STRIPE_PRICE_ID_PREMIUM**: Live price ID voor Premium plan

### Stap 3: Stripe Webhook configureren

**BELANGRIJK**: De webhook secret wordt pas gegenereerd nadat je een webhook endpoint hebt aangemaakt. Volg deze stappen:

1. **Deploy eerst je applicatie naar Vercel** (zonder webhook secret - dit is OK voor de eerste deployment)
2. Ga naar [Stripe Dashboard](https://dashboard.stripe.com)
3. Zorg dat je in **Test mode** bent voor development, of **Live mode** voor productie
4. Ga naar **Developers** → **Webhooks** (in de linkernavigatie)
5. Klik op **Add endpoint** (rechtsboven)
6. Vul in:
   - **Endpoint URL**: 
     - Voor productie: `https://jouw-domein.vercel.app/api/webhooks/stripe`
     - Voor lokale testing: gebruik Stripe CLI (zie hieronder)
   - **Description** (optioneel): "ZZP Ontzorg webhook"
7. Klik op **Add events** en selecteer:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
8. Klik op **Add endpoint**
9. **Na het aanmaken** zie je de webhook in de lijst
10. Klik op de webhook om de details te zien
11. Scroll naar beneden naar **Signing secret**
12. Klik op **Reveal** naast "Signing secret"
13. Kopieer de secret (begint met `whsec_...`)
14. Voeg deze toe als `STRIPE_WEBHOOK_SECRET` in Vercel environment variables

**Let op**: 
- Voor **test mode** krijg je een test webhook secret (whsec_test_...)
- Voor **live mode** krijg je een live webhook secret (whsec_live_...)
- Gebruik de juiste secret voor de juiste omgeving!

### Stap 4: Clerk Production Setup

1. Ga naar [Clerk Dashboard](https://dashboard.clerk.com)
2. Selecteer je applicatie
3. Ga naar **Settings** → **Domains**
4. Voeg je Vercel domain toe (bijv. `jouw-app.vercel.app`)
5. Update redirect URLs:
   - **After sign-in URL**: `https://jouw-domein.vercel.app/dashboard`
   - **After sign-up URL**: `https://jouw-domein.vercel.app/onboarding/select-plan`

### Stap 5: Database Migrations

Na de eerste deployment, voer database migrations uit:

```bash
# Via Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy

# Of via Vercel Dashboard → Settings → Database
```

## Local Development Setup

### Stap 1: Kopieer env.example naar .env
```bash
cp env.example .env
```

### Stap 2: Vul je .env bestand in
- Gebruik **test** keys voor Clerk en Stripe
- Gebruik je lokale database connection string
- Gebruik je OpenAI API key
- **STRIPE_WEBHOOK_SECRET**: Laat dit leeg voor lokale ontwikkeling (gebruik Stripe CLI, zie hieronder)

### Stap 3: Start lokale database
```bash
# Als je PostgreSQL lokaal draait
# Of gebruik Docker:
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

### Stap 4: Run migrations
```bash
npx prisma migrate dev
# Of
npx prisma db push
```

### Stap 5: Stripe Webhook voor lokale ontwikkeling (optioneel)

Voor lokale webhook testing kun je de Stripe CLI gebruiken:

1. **Installeer Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Of download van https://stripe.com/docs/stripe-cli
   ```

2. **Login met Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks naar je lokale server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. De CLI toont een webhook secret (whsec_...). Je kunt deze gebruiken in je `.env`, maar het is niet nodig als je de CLI gebruikt.

5. **Trigger test events** (in een andere terminal):
   ```bash
   stripe trigger checkout.session.completed
   ```

**Let op**: Als je Stripe CLI gebruikt, hoef je `STRIPE_WEBHOOK_SECRET` niet in je `.env` te zetten. De CLI handelt de webhook forwarding af.

### Stap 6: Start development server
```bash
npm run dev
```

## Environment Variables Overzicht

### Vereist voor alle omgevingen:
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `OPENAI_API_KEY`

### Vereist voor productie (Vercel):
- `STRIPE_SECRET_KEY` (live key)
- `STRIPE_PUBLISHABLE_KEY` (live key)
- `STRIPE_WEBHOOK_SECRET` (live webhook secret)
- `STRIPE_PRICE_ID_BASIS` (live price ID)
- `STRIPE_PRICE_ID_PREMIUM` (live price ID)

### Optioneel voor development:
- `STRIPE_SECRET_KEY` (test key) - voor testen van checkout
- `STRIPE_PUBLISHABLE_KEY` (test key)
- `STRIPE_WEBHOOK_SECRET` (test webhook secret) - alleen nodig als je geen Stripe CLI gebruikt
- `STRIPE_PRICE_ID_BASIS` (test price ID)
- `STRIPE_PRICE_ID_PREMIUM` (test price ID)

## Troubleshooting

### Database connection errors
- Controleer of `DATABASE_URL` correct is ingesteld
- Voor Vercel Postgres: Zorg dat de database is aangemaakt
- Check of je IP whitelist hebt ingesteld (voor externe databases)

### Clerk errors
- Controleer of je production keys gebruikt in productie
- Check of je domain is toegevoegd in Clerk dashboard
- Verify redirect URLs zijn correct geconfigureerd

### Stripe errors
- Zorg dat je live keys gebruikt in productie
- Check of webhook endpoint correct is geconfigureerd
- Verify price IDs zijn correct (test vs live)

## Vercel CLI Commands

### Install Vercel CLI
```bash
npm i -g vercel
```

### Login
```bash
vercel login
```

### Link project
```bash
vercel link
```

### Pull environment variables
```bash
vercel env pull .env.production
```

### Deploy to preview
```bash
vercel
```

### Deploy to production
```bash
vercel --prod
```


