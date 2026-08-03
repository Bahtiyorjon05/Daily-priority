# Reminder scheduler setup (cron-job.org)

Prayer/habit/task reminders are dispatched by `GET /api/cron/reminders`. Vercel's Hobby
plan only allows one cron per day, so an external scheduler drives it instead.

## One-time setup

1. Sign in at **https://cron-job.org** (free).
2. **Create cronjob** with:

   | Field | Value |
   |---|---|
   | Title | `Daily Priority — reminders` |
   | URL | `https://daily-priority.vercel.app/api/cron/reminders` |
   | Schedule | **Every 5 minutes** |
   | Request method | `GET` |

3. Authenticate it. Either is fine — the header is tidier because the secret
   doesn't sit in the URL or in cron-job.org's request logs:

   **Preferred — custom header** (Advanced → Headers):
   ```
   Authorization: Bearer <CRON_SECRET>
   ```

   **Or — query string** (append to the URL):
   ```
   ?secret=<CRON_SECRET>
   ```

4. Get `<CRON_SECRET>` from `web/.env` (same value is set in Vercel → Settings →
   Environment Variables). Don't commit it anywhere.

5. Save and **Run now** once.

## Verify it worked

Open **/admin → Overview**. The *System health* panel at the top shows:

- **Reminders — "just now"** and a green tick → working
- **"Scheduler looks stopped"** → it ran before but has been silent >20 min
- **"Reminder scheduler has never run"** → the job isn't reaching us at all

The panel refreshes itself every minute.

## Why every 5 minutes

The dispatcher fires a prayer reminder when the current local minute falls inside a
5-minute window around `prayer time − lead minutes`. Running less often than every 5
minutes will make it miss windows; running more often is harmless (notifications carry a
stable tag, so a repeat replaces rather than duplicates).

Nothing runs if a user has no push devices registered, so the job is cheap.

## Weekly review email

`GET /api/cron/weekly-review` is already scheduled by Vercel (`vercel.json`,
Sundays 17:00 UTC) and needs no external scheduler. Append `&dryRun=1` to test it
without sending anything.
