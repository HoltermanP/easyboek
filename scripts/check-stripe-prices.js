#!/usr/bin/env node

/**
 * Script om Stripe Price IDs te valideren en te vinden
 * Gebruik: node scripts/check-stripe-prices.js
 */

const fs = require('fs');
const path = require('path');

// Laad .env handmatig
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env bestand niet gevonden');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  });

  return envVars;
}

const env = loadEnv();
const Stripe = require('stripe');

const stripeSecretKey = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY is niet ingesteld in .env');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

async function checkPrices() {
  try {
    console.log('🔍 Zoeken naar Price IDs in je Stripe account...\n');

    // Haal alle prices op
    const prices = await stripe.prices.list({
      limit: 100,
      active: true,
    });

    if (prices.data.length === 0) {
      console.log('⚠️  Geen actieve prices gevonden in je Stripe account.');
      console.log('\n📝 Maak eerst producten en prijzen aan in Stripe Dashboard:');
      console.log('   https://dashboard.stripe.com/test/products\n');
      return;
    }

    console.log(`✅ ${prices.data.length} price(s) gevonden:\n`);

    // Groepeer per product
    const pricesByProduct = {};
    
    for (const price of prices.data) {
      const productId = price.product;
      if (!pricesByProduct[productId]) {
        pricesByProduct[productId] = [];
      }
      pricesByProduct[productId].push(price);
    }

    // Haal product details op
    for (const [productId, productPrices] of Object.entries(pricesByProduct)) {
      try {
        const product = await stripe.products.retrieve(productId);
        console.log(`📦 Product: ${product.name} (${productId})`);
        console.log(`   Description: ${product.description || 'Geen beschrijving'}\n`);

        for (const price of productPrices) {
          const amount = (price.unit_amount / 100).toFixed(2);
          const currency = price.currency.toUpperCase();
          const interval = price.recurring?.interval || 'one-time';
          
          console.log(`   💰 Price ID: ${price.id}`);
          console.log(`      Bedrag: ${currency} ${amount}`);
          console.log(`      Type: ${interval === 'one-time' ? 'Eenmalig' : `Maandelijks (${interval})`}`);
          console.log(`      Status: ${price.active ? '✅ Actief' : '❌ Inactief'}`);
          console.log('');
        }
      } catch (err) {
        console.log(`   ⚠️  Kon product ${productId} niet ophalen: ${err.message}\n`);
      }
    }

    // Check huidige .env values
    console.log('\n📋 Huidige .env configuratie:');
    const basisPriceId = env.STRIPE_PRICE_ID_BASIS || process.env.STRIPE_PRICE_ID_BASIS;
    const premiumPriceId = env.STRIPE_PRICE_ID_PREMIUM || process.env.STRIPE_PRICE_ID_PREMIUM;

    if (basisPriceId) {
      const found = prices.data.find(p => p.id === basisPriceId);
      if (found) {
        console.log(`   ✅ STRIPE_PRICE_ID_BASIS="${basisPriceId}" - GEVONDEN`);
      } else {
        console.log(`   ❌ STRIPE_PRICE_ID_BASIS="${basisPriceId}" - NIET GEVONDEN`);
        console.log(`      Deze Price ID bestaat niet in je Stripe account!`);
      }
    } else {
      console.log(`   ⚠️  STRIPE_PRICE_ID_BASIS is niet ingesteld`);
    }

    if (premiumPriceId) {
      const found = prices.data.find(p => p.id === premiumPriceId);
      if (found) {
        console.log(`   ✅ STRIPE_PRICE_ID_PREMIUM="${premiumPriceId}" - GEVONDEN`);
      } else {
        console.log(`   ❌ STRIPE_PRICE_ID_PREMIUM="${premiumPriceId}" - NIET GEVONDEN`);
        console.log(`      Deze Price ID bestaat niet in je Stripe account!`);
      }
    } else {
      console.log(`   ⚠️  STRIPE_PRICE_ID_PREMIUM is niet ingesteld`);
    }

    // Suggesties
    console.log('\n💡 Suggesties:');
    console.log('   1. Kopieer de juiste Price IDs hierboven');
    console.log('   2. Update je .env bestand met de correcte Price IDs');
    console.log('   3. Herstart je development server\n');

  } catch (error) {
    console.error('❌ Fout bij ophalen prices:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('   Controleer of je STRIPE_SECRET_KEY correct is!');
    }
    process.exit(1);
  }
}

checkPrices();

