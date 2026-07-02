# Deploying to Render

This app deploys as **one Docker web service** (FastAPI serves the built React app)
plus a **managed PostgreSQL database** (so Prakruthi's streak, journal, and progress
persist across restarts — Render's web filesystem is wiped on every deploy).

Everything is pre-wired in `render.yaml` and `Dockerfile`. You just push to GitHub
and click through Render.

## Prerequisites
- A **GitHub** account (Render deploys from a Git repo)
- A **Render** account → https://render.com
- Your **Anthropic API key**

## Step 1 — Put the project on GitHub
From the project folder:
```bash
git init
git add .
git commit -m "Primer learning app"
git branch -M main
# create an empty repo on github.com first, then:
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
> `.gitignore` already excludes `.env`, the database, `node_modules`, and `.venv`,
> so no secrets or dev data get pushed. The deployed database starts **empty** —
> a clean slate for Prakruthi.

## Step 2 — Create the Render Blueprint
1. Render dashboard → **New ▸ Blueprint**.
2. Connect your GitHub repo. Render detects `render.yaml` and shows a web service
   **primer** + a database **primer-db**.
3. Click **Apply**. Render will ask you to fill the two secrets:
   - `ANTHROPIC_API_KEY` → your Anthropic key
   - `PRIMER_PASSCODE` → the passcode Prakruthi will type to log in (pick anything)

## Step 3 — Wait for the build, then open it
- First build takes a few minutes (it builds the frontend + backend image).
- When it's live, open the `https://primer-XXXX.onrender.com` URL Render gives you.
- Log in with the passcode → it's hers. 🎉

## Step 4 — Hand it to Prakruthi
Send her the URL + the passcode. That's it.

---

## Good to know
- **Persistence:** progress/streak/journal live in Postgres, so they survive
  deploys and restarts.
- **Free tier:** a free web service **sleeps after ~15 min of inactivity**, so the
  first visit after a nap takes ~30–60s to wake. Upgrading the service to a paid
  plan keeps it always-on. (Check Render's current plans/pricing in the dashboard.)
- **Change the model:** set `PRIMER_MODEL` env var — `claude-sonnet-5` cuts cost
  significantly vs `claude-opus-4-8` for heavy use.
- **Update the app later:** just `git push` — Render auto-redeploys. Her data stays
  (it's in Postgres, separate from the code).
- **Reset her data** (if you ever want a fresh start): in Render, open the
  `primer-db` database and drop/recreate it, or delete its rows.
