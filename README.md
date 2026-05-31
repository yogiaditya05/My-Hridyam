# My Hridyam — AI Companion & Wellness Dashboard

My Hridyam is a premium AI companion designed to support emotional wellness, mindfulness, and interactive conversation. It features a sleek glassmorphic user interface, personal analytics, a secure Admin Dashboard for user/session auditing, and real-time voice-to-text messaging.

---

## 🎙️ Shift from Whisper to Google Gemini

Previously, the application utilized OpenAI Whisper via OpenRouter/Forge APIs for voice-to-text transcription. To provide a more robust, cost-effective, and direct integration, the transcription engine has been **shifted to Google Gemini**.

- **Model Used**: `gemini-2.5-flash`
- **Why Gemini?**: Direct support for multimodal audio input (`audio/webm`, `audio/mp3`, `audio/wav`), extremely low latency, high transcription accuracy, and simple API key authorization via Google AI Studio.
- **How to enable**: Add `Gemini_API_KEY` to your `.env` file. If present, the server automatically bypasses Whisper/Forge endpoints and transcribes microphone input natively through Gemini.

---

## 🛠️ Key Features

- **Empathetic AI Companion**: A conversational partner configured via smart system prompting to adapt to basic questions and support emotional wellness.
- **Admin Dashboard (`/admin`)**: A secure control panel allowing the administrator to inspect registered users and view chronological message histories.
- **Database Dialect**: Powered by Drizzle ORM and SQLite for a lightweight, zero-configuration local workspace.

---

## 🚀 Getting Started

### 1. Environment Setup

Configure your `.env` file in the root directory:

```env
# Port & Server settings
OAUTH_SERVER_URL=http://localhost:3000
DATABASE_URL=./database/hridyam.db

# Voice Agent Configuration (Gemini API Key)
Gemini_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies

Install the project packages using pnpm or npm:

```bash
npm install
```

### 3. Database Setup & Migrations

Deploy the SQLite database schema and run outstanding migrations:

```bash
npm run db:push
```

### 4. Run Locally

Start the development server (runs both the express backend and Vite frontend dev server):

```bash
npm run dev
```

Visit the application at `http://localhost:3000/`.

---

## 🧪 Verification & Development

- **Run Type Checks**: `npm run check` (runs typescript compilation with `--noEmit`).
- **Run Tests**: `npm run test` (runs Vitest unit tests verifying database, admin authorization, and conversational gates).
