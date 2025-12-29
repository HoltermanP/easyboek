# Troubleshooting: Inloggen werkt niet op productie

## Mogelijke oorzaken en oplossingen

### 1. Clerk Environment Variables niet correct ingesteld

**Controleer in Vercel Dashboard:**
- Ga naar **Settings** → **Environment Variables**
- Zorg dat deze variabelen zijn ingesteld:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Moet beginnen met `pk_live_...` (niet `pk_test_...`)
  - `CLERK_SECRET_KEY` - Moet beginnen met `sk_live_...` (niet `sk_test_...`)

**Belangrijk:**
- Gebruik **Production** keys, niet test keys
- Haal de keys op van [Clerk Dashboard](https://dashboard.clerk.com) → Je applicatie → API Keys → **Production**

### 2. Clerk Domain niet geconfigureerd

**In Clerk Dashboard:**
1. Ga naar **Settings** → **Domains**
2. Voeg je Vercel domain toe (bijv. `jouw-app.vercel.app`)
3. Zorg dat het domain is geverifieerd

### 3. Redirect URLs niet correct ingesteld

**In Clerk Dashboard:**
1. Ga naar **Settings** → **Paths**
2. Controleer of deze URLs correct zijn:
   - **After sign-in URL**: `https://jouw-domein.vercel.app/dashboard`
   - **After sign-up URL**: `https://jouw-domein.vercel.app/onboarding/select-plan`

### 4. Middleware configuratie

De middleware is correct geconfigureerd. Als er problemen zijn:
- Controleer of de middleware correct wordt uitgevoerd
- Check de Vercel logs voor errors

### 5. Browser Console Errors

**Check in de browser:**
1. Open Developer Tools (F12)
2. Ga naar Console tab
3. Zoek naar errors gerelateerd aan Clerk
4. Veelvoorkomende errors:
   - `Clerk: Missing publishableKey` - Environment variable niet ingesteld
   - `Clerk: Invalid domain` - Domain niet toegevoegd in Clerk Dashboard

### 6. Cache problemen

**Probeer:**
1. Hard refresh: Ctrl+Shift+R (Windows) of Cmd+Shift+R (Mac)
2. Clear browser cache
3. Test in incognito/private mode

### 7. Database connectie

Als inloggen werkt maar gebruikers niet worden aangemaakt:
- Controleer DATABASE_URL in Vercel
- Check of Prisma migrations zijn uitgevoerd
- Kijk in Vercel logs voor database errors

## Debug stappen

### Stap 1: Check Environment Variables
```bash
# Via Vercel CLI
vercel env ls

# Of check in Vercel Dashboard → Settings → Environment Variables
```

### Stap 2: Check Vercel Logs
1. Ga naar Vercel Dashboard → Je project → **Deployments**
2. Klik op de laatste deployment
3. Ga naar **Functions** tab
4. Check voor errors in de logs

### Stap 3: Test lokaal met productie keys
```bash
# Kopieer productie keys naar .env.local (alleen voor testen!)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Test lokaal
npm run dev
```

### Stap 4: Check Clerk Dashboard
1. Ga naar [Clerk Dashboard](https://dashboard.clerk.com)
2. Selecteer je applicatie
3. Ga naar **Users** - zie je nieuwe gebruikers?
4. Ga naar **Sessions** - zie je actieve sessies?

## Snelle fix checklist

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is ingesteld in Vercel (production key)
- [ ] `CLERK_SECRET_KEY` is ingesteld in Vercel (production key)
- [ ] Domain is toegevoegd in Clerk Dashboard → Settings → Domains
- [ ] Redirect URLs zijn correct ingesteld in Clerk Dashboard
- [ ] Vercel deployment is geslaagd zonder errors
- [ ] Browser console toont geen Clerk errors
- [ ] Database connectie werkt (DATABASE_URL is ingesteld)

## Als niets werkt

1. **Herdeploy de applicatie** na het instellen van environment variables
2. **Check Clerk status**: [status.clerk.com](https://status.clerk.com)
3. **Contact Clerk support** via hun dashboard als het probleem aanhoudt

