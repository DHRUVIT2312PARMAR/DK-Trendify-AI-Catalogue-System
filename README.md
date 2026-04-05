# DK Trendify AI Catalogue System

MERN SaaS platform for Meesho sellers with JWT auth, AI-assisted product analysis, market research, profit estimation, and custom catalog form intelligence.

## Run locally
1. Copy `.env.example` to `.env`.
2. Install dependencies from the repository root.
3. Start the app with `npm run dev`.

## Structure
- `frontend/` - React + Bootstrap UI
- `backend/` - Express + MongoDB API
- `database/` - MongoDB schema notes
- `docs/` - Implementation and deployment documentation

## Main Routes
- `/api/auth` - Signup, login, and current user
- `/api/uploads` - Single image analysis with custom catalog fields
- `/api/profit` - Profit calculator
- `/api/dashboard` - Analytics dashboard data
