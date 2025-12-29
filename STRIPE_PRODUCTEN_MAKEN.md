# Stripe Producten en Prijzen Aanmaken

Je hebt nog geen producten in je Stripe account. Volg deze stappen om ze aan te maken:

## Stap 1: Ga naar Stripe Dashboard

1. Open [Stripe Dashboard - Products](https://dashboard.stripe.com/test/products)
2. **Zorg dat je in Test mode bent** (toggle rechtsboven)
3. Klik op **"Add product"** (rechtsboven)

## Stap 2: Basis Plan Aanmaken

### Product Details:
- **Name**: `Basis Plan`
- **Description**: `Voor zelfstandigen die zelf de controle willen houden`

### Pricing:
1. Scroll naar beneden naar **"Pricing"**
2. Selecteer **"Recurring"** (niet "One time")
3. Vul in:
   - **Price**: `29.95`
   - **Currency**: `EUR` (Euro)
   - **Billing period**: `Monthly` (maandelijks)
4. Laat andere opties staan zoals ze zijn
5. Klik op **"Save product"** (rechtsboven)

### Price ID Kopiëren:
Na het opslaan:
1. Je ziet de product detail pagina
2. Scroll naar beneden naar de **"Pricing"** sectie
3. Je ziet daar de **Price ID** (begint met `price_...`)
4. **Kopieer deze Price ID** - je hebt deze nodig!

## Stap 3: Premium Plan Aanmaken

1. Ga terug naar [Products](https://dashboard.stripe.com/test/products)
2. Klik op **"Add product"**
3. Vul in:
   - **Name**: `Premium Plan`
   - **Description**: `Volledig ontzorgd met AI en ondersteuning`
4. Scroll naar **"Pricing"**
5. Selecteer **"Recurring"**
6. Vul in:
   - **Price**: `39.95`
   - **Currency**: `EUR`
   - **Billing period**: `Monthly`
7. Klik op **"Save product"**
8. **Kopieer de Price ID**

## Stap 4: Update je .env

Open je `.env` bestand en update de Price IDs:

```env
STRIPE_PRICE_ID_BASIS="price_..."  # Vervang met de echte Price ID van Basis Plan
STRIPE_PRICE_ID_PREMIUM="price_..."  # Vervang met de echte Price ID van Premium Plan
```

## Stap 5: Valideer

Run het check script om te controleren of alles klopt:

```bash
node scripts/check-stripe-prices.js
```

Je zou nu beide Price IDs moeten zien en ze zouden als "GEVONDEN" moeten worden gemarkeerd.

## Stap 6: Herstart Server

Na het updaten van je `.env`:

```bash
# Stop de server (Ctrl+C)
# Start opnieuw
npm run dev
```

## Belangrijk

- **Price ID** begint altijd met `price_...`
- **Product ID** begint met `prod_...` - dit is NIET wat je nodig hebt!
- Zorg dat je in **Test mode** bent voor development
- Voor productie moet je dezelfde producten aanmaken in **Live mode**

## Troubleshooting

### "No such price" error
- Controleer of je de juiste Price ID hebt gekopieerd (moet beginnen met `price_`)
- Zorg dat je in de juiste mode bent (test vs live)
- Check of het product actief is in Stripe Dashboard

### Price ID niet gevonden
- Run `node scripts/check-stripe-prices.js` om te zien welke Price IDs beschikbaar zijn
- Controleer of je de juiste Stripe account gebruikt (test vs live keys)









