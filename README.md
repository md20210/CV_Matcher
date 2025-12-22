# CV Matcher

AI-Powered Resume Analysis Tool using General Backend API

## Project Structure

```
CV_Matcher/
├── src/
│   ├── components/       # React components
│   │   ├── auth/        # Login, Register components
│   │   ├── dashboard/   # Dashboard and Project list
│   │   ├── upload/      # CV upload components
│   │   └── matching/    # Matching results display
│   ├── services/        # API services
│   ├── types/           # TypeScript type definitions
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **PDF Processing:** pdf.js, pdf-lib
- **Backend API:** General Backend (Railway)

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build
```

## Backend API

API Base URL: `https://general-backend-production-a734.up.railway.app`

API Documentation: https://general-backend-production-a734.up.railway.app/docs

## Features (Planned)

- ✅ User Authentication (Login/Register)
- ✅ Project Management
- ✅ CV Upload (PDF/DOCX)
- ✅ Job Description Input
- ✅ AI-Powered Matching Analysis
- ✅ Semantic Search
- ✅ Match Results Display

## Development with Aider

This project is being developed with Aider AI coding assistant.

Ready for Aider prompts!
