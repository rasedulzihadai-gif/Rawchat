# Rawchat — Every AI model. One raw interface.

Chat, code and create with 480+ AI models from 30+ providers through one
Claude-grade interface. Login-required, private per-user chats that
auto-delete 7 days after the last message.

## Quick start

```bash
npm install
cp .env.example .env   # then set DATABASE_URL
npm run db:push        # create tables (fresh DB)
npm run dev            # → http://localhost:3000
```

Open `/login`, create an account, then add a provider key in the app
(Groq has a free tier that takes ~30 seconds).

## Images & Stock mode

- Attach up to 4 images per message (file picker or paste from clipboard).
  Images are downscaled (max 1568px) and JPEG-compressed in the browser,
  sent to providers as OpenAI `image_url` parts (or Anthropic native image
  blocks), and saved with the message so they survive reloads.
- The **Stock** mode turns any vision-capable model (e.g. Gemini Flash,
  GPT-4.1 / 5-mini, Claude, Llama-4-Scout, Qwen-VL) into a stock-image
  metadata expert: it returns strict `{"title", "description", "keywords"}`
  JSON with enforced color keywords, use-case keywords, and filler limits.
  Temperature is lowered to 0.2 in this mode for deterministic output.
- After pulling this change, run `npm run db:push` (or `npm run db:migrate`)
  to add the nullable `messages.images` column — no data loss, old rows just
  have no images.

## Accounts & security

- Email + password auth. Passwords hashed with bcrypt (cost 12).
- Sessions are DB-backed, identified by a 256-bit token stored as a
  SHA-256 hash; the cookie is `HttpOnly`, `SameSite=Lax`, `Secure` in
  production, 30-day sliding expiry.
- Login/signup are rate-limited (10 attempts / 10 min / IP).
- Every conversation, message, and AI-proxy request is scoped to the
  signed-in user — users can never see each other's chats.
- Provider API keys stay in the browser's localStorage; they are never
  written to the database.

## 7-day auto-delete

- A conversation is deleted once its **last message is older than 7 days**.
  Messaging in it extends the window.
- Cleanup runs **opportunistically** (every conversation-list fetch sweeps
  that user's expired chats) and via an optional scheduled sweep:

```bash
# daily cron (Vercel Cron, Render, or crontab):
curl "https://your-app/api/cron/cleanup?token=$CRON_SECRET"
```

Set `CRON_SECRET` (e.g. `openssl rand -hex 32`) to enable the endpoint.

## Upgrading an existing database

Pre-auth `conversations` rows have no owner, so `db:push` can't add the
required `user_id` column while they exist. Clear them first:

```sql
DELETE FROM messages;
DELETE FROM conversations;
```

then run `npm run db:push` (or `npm run db:migrate` on a fresh database).

## Scripts

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start dev server                          |
| `npm run build`   | Production build                          |
| `npm run start`   | Serve production build                    |
| `npm run lint`    | ESLint                                    |
| `npm run typecheck` | `tsc --noEmit`                          |
| `npm run db:push` | Sync schema to DB (create/alter tables)   |
| `npm run db:migrate` | Apply `drizzle/*.sql` migrations       |
| `npm run db:studio` | Browse the DB in Drizzle Studio         |
