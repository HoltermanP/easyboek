# Fix: Product IDs vs Price IDs

## Probleem
Je `.env` bevat Product IDs (`prod_...`) maar Stripe heeft Price IDs (`price_...`) nodig.

## Oplossing: Vind je Price IDs

### Methode 1: Via Stripe Dashboard (Aanbevolen)

1. Ga naar [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Klik op je **Basis Plan** product
3. Scroll naar beneden naar de **Pricing** sectie
4. Je ziet daar de **Price ID** (begint met `price_...`)
   - Bijvoorbeeld: `price_1ABC123...`
5. Kopieer deze Price ID
6. Herhaal voor **Premium Plan**

### Methode 2: Via Stripe API (Als je Stripe CLI hebt)

```bash
# List alle prices
stripe prices list --limit 10

# Of voor een specifiek product
stripe prices list --product prod_TURgAViSUS8aAj
```

### Methode 3: Via Browser Console

1. Ga naar je product in Stripe Dashboard
2. Open Developer Tools (F12)
3. Kijk in de Network tab voor API calls
4. De Price ID staat in de response

## Update je .env

Vervang de Product IDs met Price IDs:

```env
# VOOR (fout):
STRIPE_PRICE_ID_BASIS="prod_TURgAViSUS8aAj"
STRIPE_PRICE_ID_PREMIUM="prod_TURhRCQj7ZlCcm"

# NA (correct):
STRIPE_PRICE_ID_BASIS="price_1ABC123..."
STRIPE_PRICE_ID_PREMIUM="price_1XYZ789..."
```

## Belangrijk

- **Product ID** (`prod_...`) = Het product zelf
- **Price ID** (`price_...`) = De prijs van het product (dit heb je nodig!)

Je kunt meerdere Price IDs hebben voor één Product (bijv. maandelijks vs jaarlijks).

## Testen

Na het updaten van je `.env`:
1. Herstart je development server
2. Test de checkout flow
3. Check of er geen errors zijn in de console

