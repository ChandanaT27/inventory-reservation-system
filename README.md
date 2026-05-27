Inventory Reservation System

A full-stack Inventory Reservation System built with Next.js, TypeScript, Prisma, and PostgreSQL.
This project allows users to reserve products, confirm reservations, and automatically release expired reservations while preventing overselling using database transactions.

Features
1.View available products
2.Reserve stock dynamically
3.Prevent overselling with Prisma transactions
4.Confirm reservations
5.Release expired reservations
6.Auto-expiry timer (5 minutes)
7.Real-time stock updates
8.Reservation status tracking
9.Responsive dashboard UI

Screenshots

<img width="1378" height="730" alt="image" src="https://github.com/user-attachments/assets/ed09fa84-305b-4f34-9808-ff6ad8c88147" />
<img width="1599" height="988" alt="image" src="https://github.com/user-attachments/assets/f616002b-40c0-4f5e-add3-138a303b8b40" />
<img width="1350" height="801" alt="image" src="https://github.com/user-attachments/assets/53b5ea54-a741-4496-b80a-f2e80d42dbbe" />
<img width="1599" height="848" alt="image" src="https://github.com/user-attachments/assets/066a07e7-d23a-4d7a-b874-a170e84d6017" />






Tech Stack
 Next.js 14
 React 18
 TypeScript
 Prisma ORM
 PostgreSQL (Supabase)
 Tailwind CSS
 Vercel Deployment
 
Project Structure
app/
 ├── api/
 │    ├── products/
 │    ├── reserve/
 │    ├── confirm/[id]/
 │    ├── release/[id]/
 │    └── reservation/[id]/
 ├── globals.css
 ├── layout.tsx
 └── page.tsx

lib/
 └── prisma.ts

prisma/
 ├── schema.prisma
 └── seed.ts
 
Installation



Install dependencies:

npm install
Environment Variables

Create a .env file:

DATABASE_URL="your_supabase_postgresql_url"
Prisma Setup

Push schema to database:

npx prisma db push

Seed initial data:

npx prisma db seed

Generate Prisma client:

npx prisma generate
Run Development Server
npm run dev

Open:

http://localhost:3000
Production Build
npm run build
Deployment (Vercel)

Install Vercel CLI:

npm install -g vercel

Deploy:

vercel

Production deployment:

vercel --prod

API Routes
Method	Route	Description
GET	/api/products	Fetch all products
POST	/api/reserve	Reserve stock
POST	/api/confirm/[id]	Confirm reservation
POST	/api/release/[id]	Release reservation
GET	/api/reservation/[id]	Get reservation details
Key Concepts
Reservation Flow
User reserves stock
Reserved quantity is locked
Reservation expires after 5 minutes
User can confirm reservation
Expired reservations can be released automatically
Preventing Overselling

This project uses:

Prisma transactions
Atomic stock updates
Reservation validation

to ensure stock consistency even during concurrent requests.



Author

 Chandana T


/// This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
