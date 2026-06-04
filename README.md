# GitHub Models Chat

A production-ready AI chat web application that connects to [GitHub Models](https://github.com/marketplace/models) API. Chat with GPT-4.1, GPT-5, DeepSeek R1, Grok 3, and more through a beautiful ChatGPT-style interface.

![GitHub Models Chat](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss)

## Features

- 🤖 **Multi-Model Support** — GPT-4.1, GPT-4o, GPT-5, o4-mini, DeepSeek R1, Grok 3
- 💬 **Streaming Responses** — Real-time streamed AI responses
- 🎨 **Dark/Light Mode** — System-aware theme switching
- 📝 **Markdown Rendering** — Full markdown with syntax highlighting
- 📁 **Conversation Management** — Create, rename, delete, search conversations
- ⚙️ **Settings** — Temperature, max tokens, system prompt, API key management
- 🔒 **Secure** — API keys encrypted at rest, never exposed to browser
- 📤 **Export/Import** — Export chats as Markdown or JSON
- 🐳 **Docker Ready** — One-command deployment
- 📱 **Responsive** — Works on desktop, tablet, and mobile

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm 9+

### 1. Clone and install

```bash
git clone <your-repo-url>
cd github-models-chat
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `ENCRYPTION_KEY` — Generate with: `openssl rand -hex 32`
- `SESSION_PASSWORD` — Any string with 32+ characters

### 3. Initialize database

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Login

Default credentials:
- **Username:** `admin`
- **Password:** `admin123`

### 6. Add your API key

1. Go to **Settings** → **API Key**
2. Enter your [GitHub Personal Access Token](https://github.com/settings/tokens) (needs `read:models` scope)
3. Click **Save Key**
4. Click **Test Connection** to verify

## Docker Deployment

### One-Command Startup

```bash
# 1. Configure
cp .env.example .env
# Edit .env with your ENCRYPTION_KEY and SESSION_PASSWORD

# 2. Build and run
docker-compose up -d --build
```

The app will be available at `http://localhost:3000`.

### DigitalOcean Deployment

1. **Create a Droplet** (Ubuntu 22.04, 1GB+ RAM)

2. **Install Docker**
```bash
curl -fsSL https://get.docker.com | sh
sudo apt install docker-compose-plugin -y
```

3. **Clone and deploy**
```bash
git clone <your-repo-url> /opt/github-models-chat
cd /opt/github-models-chat
cp .env.example .env
nano .env  # Set ENCRYPTION_KEY and SESSION_PASSWORD
docker compose up -d --build
```

4. **Setup reverse proxy (optional)**
```bash
sudo apt install nginx -y
# Configure nginx to proxy_pass to localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite database path (default: `file:./dev.db`) |
| `ENCRYPTION_KEY` | Yes | 64-char hex key for API key encryption |
| `SESSION_PASSWORD` | Yes | 32+ char password for session cookies |
| `NEXT_PUBLIC_APP_NAME` | No | App name shown in UI |
| `NODE_ENV` | No | `development` or `production` |

## Supported Models

| Provider | Models |
|---|---|
| OpenAI | GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, GPT-4o, GPT-4o Mini, GPT-5, GPT-5 Mini, GPT-5 Nano, o4-mini |
| DeepSeek | DeepSeek R1 |
| xAI | Grok 3 |

To add new models, edit `src/config/models.ts`.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Enter` | Send message |
| `Shift + Enter` | New line |

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** SQLite (Prisma ORM)
- **Auth:** iron-session + bcrypt
- **AI SDK:** @azure-rest/ai-inference
- **State:** Zustand
- **Validation:** Zod

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   ├── login/              # Login page
│   └── (chat)/             # Authenticated pages
│       ├── chat/[id]/      # Chat conversation
│       └── settings/       # Settings page
├── components/             # React components
├── config/                 # App configuration
├── lib/                    # Server utilities
└── stores/                 # Zustand stores
```

## License

MIT
