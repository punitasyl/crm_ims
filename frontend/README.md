# CRM IMS Frontend

Next.js frontend application for the CRM IMS system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API URL
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # Utilities and API client
│   ├── pages/           # Page components
│   └── store/           # State management
├── public/              # Static assets
└── package.json
```

## Features

- Customer Management
- Product Management
- Inventory Tracking
- Order Management
- Dashboard and Reports
- Authentication

## Technology Stack

- Next.js 14
- React 18
- TypeScript
- Material-UI
- Zustand (State Management)
- Axios (HTTP Client)

