# SOP Builder

Visual Standard Operating Procedure designer and tester. Design SOPs as workflow graphs, then push objects through to test transitions, audit trails, and notification flows.

**Live:** [sop.synthia.bot](https://sop.synthia.bot)

## Features

- **Visual SOP Designer** — Drag-and-drop workflow editor with Start, Status, Decision, and End nodes
- **Node & Edge Configuration** — SLA timeouts, notification settings (email/SMS), required fields per action
- **SOP Tester** — Push test objects through workflows, track position with animated highlighting
- **Multi-Object Tracking** — Run multiple objects simultaneously with color-coded paths
- **Audit Trail** — Full transition log with filtering and CSV export
- **Notification Preview** — Simulated notification toasts showing what would be sent
- **Import/Export** — Share SOPs as JSON files
- **Sample SOP** — Pre-loaded "Purchase Order Approval" workflow

## Tech Stack

- React 18 + Vite
- Tailwind CSS (dark theme)
- @xyflow/react (React Flow v12) for visual editor
- zustand for state management
- dagre for auto-layout
- lucide-react for icons
- localStorage for persistence (v1 — no backend)

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
# Copy dist/ to web server
```

## License

MIT — 3E Tech Corp
