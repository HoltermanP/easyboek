# EasyBoek - Administratie & Belastingautomatisering

Een volledige SaaS platform voor ZZP administratie en belastingautomatisering, gebouwd met Next.js 14, TypeScript, Prisma, Clerk en shadcn/ui.

## 🚀 Features

- **Authenticatie**: Clerk voor gebruikersbeheer met rollen (user/admin)
- **Document Upload**: Upload functionaliteit (momenteel uitgeschakeld)
- **OCR Verwerking**: Automatische tekst extractie uit documenten (placeholder)
- **AI Categorisatie**: Automatische categorisatie van documenten (placeholder)
- **Double-Entry Bookkeeping**: Volledig grootboek systeem
- **BTW Beheer**: Automatische BTW berekeningen per periode
- **Facturatie**: CRUD voor uitgaande facturen
- **Admin Panel**: Beheer van alle administraties

## 📋 Vereisten

- Node.js 18+ 
- PostgreSQL database
- Clerk account (voor authenticatie)

## 🛠️ Installatie

1. Clone de repository:
```bash
git clone <repository-url>
cd easyboek
```

2. Installeer dependencies:
```bash
npm install
```

3. Maak een `.env` bestand aan (kopieer `env.example` naar `.env`):
```bash
cp env.example .env
```

Vul dan de volgende variabelen in:

**Database:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/zzp_ontzorg"
```

**Clerk Authentication** (haal keys op van https://dashboard.clerk.com):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

**OpenAI** (voor OCR en AI categorisatie, haal key op van https://platform.openai.com/api-keys):
```env
OPENAI_API_KEY="sk-..."
```


4. Setup de database:
```bash
npx prisma generate
npx prisma db push
```

5. Start de development server:
```bash
npm run dev
```

De applicatie is nu beschikbaar op [http://localhost:3000](http://localhost:3000)

## 📁 Project Structuur

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authenticatie routes
│   ├── dashboard/         # Dashboard routes
│   ├── admin/             # Admin panel routes
│   └── api/               # API routes
├── components/            # React componenten
│   ├── ui/               # shadcn/ui componenten
│   ├── dashboard/        # Dashboard specifieke componenten
│   └── upload/           # Upload componenten
├── lib/                  # Utility functies
│   ├── prisma.ts         # Prisma client
│   └── auth.ts           # Auth helpers
├── services/             # Business logic
│   ├── ocr/              # OCR service
│   ├── ai/               # AI categorisatie
│   ├── bookings/         # Boekings logica
│   └── btw/              # BTW logica
└── prisma/               # Prisma schema
    └── schema.prisma     # Database schema
```

## 🔐 Authenticatie

De applicatie gebruikt Clerk voor authenticatie. Gebruikers hebben standaard de rol "user". Om admin toegang te krijgen, moet de rol handmatig worden aangepast in de database:

```sql
UPDATE users SET role = 'admin' WHERE clerk_id = 'user_xxx';
```

## 🗄️ Database

De applicatie gebruikt Prisma ORM met PostgreSQL. Het schema bevat:

- **User**: Gebruikers gekoppeld aan Clerk
- **Company**: Bedrijven van gebruikers
- **TransactionDocument**: Geüploade documenten
- **Booking**: Double-entry boekingen
- **LedgerAccount**: Grootboekrekeningen
- **Invoice**: Uitgaande facturen
- **Customer**: Klanten
- **VatPeriod**: BTW perioden

## 📤 Document Upload

De document upload functionaliteit is momenteel uitgeschakeld. Deze kan later worden toegevoegd met een eigen file upload implementatie.

## 🧮 BTW Module

De BTW module berekent automatisch:
- Omzet belasting (BTW over verkopen)
- Voorbelasting (BTW over inkoop)
- Te betalen BTW

BTW perioden worden automatisch aangemaakt per kwartaal.

## 🛠️ Development

### Database migraties
```bash
npm run db:migrate
```

### Prisma Studio
```bash
npm run db:studio
```

### Type checking
```bash
npm run build
```

## 📝 TODO

- [ ] Echte OCR integratie (Tesseract/Google Vision)
- [ ] Echte AI categorisatie (OpenAI/Claude)
- [ ] PDF factuur generatie
- [ ] iDEAL betaallink integratie
- [ ] Email notificaties
- [ ] Rapportages (Kolommenbalans, W&V)
- [ ] Export functionaliteit

## 📄 Licentie

Privé project

