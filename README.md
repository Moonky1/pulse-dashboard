# Pulse Dashboard

Real-time agent performance tracking built for call center team leaders and supervisors.

## What it does

- Live transfer metrics per agent pulled directly from Google Sheets
- Team overview across all 6 regions (Philippines, Venezuela, Colombia, Mexico, Central America, Asia)
- Daily goal tracking — flags who hit 20 English transfers, who's in progress, and who's at zero
- Top 3 leaderboard per team (English, Spanish, Total)
- Auto-refreshes every 60 seconds — no manual updates needed

## Who it's for

Team Leaders, Supervisors, and QA only. Users register once with Google and select their team permanently.

## Tech stack

React · Vite · React Router · Google Sheets CSV API · Vercel

## Getting started
```bash
git clone https://github.com/Moonky1/pulse-dashboard.git
cd pulse-dashboard
npm install
npm run dev
```

Open `http://localhost:5173` in Chrome.

## Configuration

Edit `src/config.js` to set your team names, daily goal target, and Google Sheet URL.

---

Built with ❤️ for Kampaign Kings
