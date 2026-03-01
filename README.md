# Clip on Fly

An AI-powered video clipping and repurposing platform. Upload long-form videos, let AI extract the best moments, edit them in a canvas-based editor, and publish directly to YouTube — all in one workflow.

---

## Features

- **AI Video Processing** — Automatically extracts highlights and short clips from long videos
- **Canvas-Based Editor** — Frame-level editing with text, overlays, and effects powered by Fabric.js
- **Templates** — Pre-built clip templates for Reels, Shorts, and TikTok formats
- **YouTube Auto-Post** — OAuth-connected publishing directly to your YouTube channel
- **Real-Time Progress** — WebSocket-based live updates during video processing
- **Subscription Billing** — Razorpay-powered plans with usage limits
- **Authentication** — Google OAuth and email/password login via Firebase Auth
- **Dark / Light / Ocean Themes** — Full theme support across the UI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI | shadcn/ui, Tailwind CSS, Radix UI, Framer Motion |
| Video Editor | Fabric.js |
| State Management | Zustand, TanStack Query |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Backend Functions | Firebase Cloud Functions |
| Video Storage | Cloudflare R2 |
| Video Processing | AWS Lambda + Step Functions |
| Real-Time | AWS API Gateway WebSocket |
| Payments | Razorpay |
| Deployment | Netlify / Firebase Hosting |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun
- Firebase project (Blaze plan for Cloud Functions)
- Cloudflare R2 bucket
- AWS account (Lambda + API Gateway)
- Razorpay account

### Installation

```bash
# Clone the repository
git clone https://github.com/saivenkat2609/clip-on-fly.git
cd clip-on-fly

# Install dependencies
npm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Backend
VITE_API_ENDPOINT=
VITE_WEBSOCKET_URL=
VITE_WORKER_UPLOAD_URL=

# Payments
VITE_RAZORPAY_KEY_ID=
```

### Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

---

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── VideoEditor/  # Canvas editor (Fabric.js)
│   ├── layout/       # App shell, sidebar, nav
│   └── ui/           # shadcn/ui primitives
├── contexts/         # React context providers (Auth)
├── lib/              # Firebase, API client, WebSocket, utilities
├── pages/            # Route-level page components
└── App.tsx           # Router and providers setup

functions/
└── src/
    ├── index.ts              # Firebase Cloud Functions entry
    └── razorpay/             # Razorpay client and plan mapping
```

---

## Deployment

### Firebase Hosting

```bash
firebase deploy
```

### Netlify

Connect the repository to Netlify. The `netlify.toml` file handles SPA redirects automatically.

### Firebase Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

---

## Security

- All secrets are loaded from environment variables — no hardcoded credentials
- Firebase Security Rules are enforced server-side (`firestore.rules`)
- Razorpay webhook signatures are verified using HMAC-SHA256
- Firebase ID tokens validate every authenticated API request

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## License

MIT
