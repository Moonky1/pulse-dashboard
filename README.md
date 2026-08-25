<div align="center">

# ⚡ PULSE

### The performance and training platform built for Kampaign Kings.

**Dashboard · GO · Studio · Academy**

</div>

---

## What is Pulse?

Pulse is an internal platform that brings Kampaign Kings performance, training, knowledge, and leadership tools together in one place.

- **Pulse Dashboard** — performance, rankings, agents, teams, and analytics.
- **Pulse GO** — interactive practice, live games, scoring, and final results.
- **Pulse Studio** — tools for hosts, supervisors, trainers, and QA.
- **Pulse Academy** — official training, scripts, processes, and operational knowledge.

---

## Ownership

Pulse was created and developed by **Simon** for **Kampaign Kings**.

The platform, design, training content, operational data, and internal workflows are intended for authorized Kampaign Kings use only.

---

## Build and rollback

- `npm run build` creates the normal Pulse Auth application in `dist/`.
- `npm run build:maintenance` creates the standalone static Maintenance site in `dist-maintenance/`.
- A Maintenance deployment uses `vercel.maintenance.json`, for example:
  `vercel deploy --prod --skip-domain -A vercel.maintenance.json`
- Promote a verified Maintenance deployment only when rollback or planned maintenance is required.

The immutable Maintenance rollback deployment from the first Auth cutover remains available independently in Vercel.

<div align="center">


</div>
