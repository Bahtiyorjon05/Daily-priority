# Adhan audio

Drop your adhan recordings here — the app picks them up automatically, no code
change or redeploy of anything else needed.

| File                  | Used for                                    | Required |
|-----------------------|---------------------------------------------|----------|
| `adhan.mp3`           | All prayers                                 | Yes      |
| `adhan-fajr.mp3`      | Fajr only (traditionally differs)           | Optional |

If neither file is present the app plays a short synthesized chime instead, so
prayer alerts still work — you'll just see a hint in the banner.

Notes:
- Keep files reasonably small (a 2–4 minute MP3 at 96–128 kbps is plenty);
  they're served as static assets.
- Use a recording you have the right to distribute.
- Audio only plays while the app is open in a tab or the installed PWA —
  browsers do not allow custom audio on background push notifications. The push
  notification itself still fires when the app is closed.
