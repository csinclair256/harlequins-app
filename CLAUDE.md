# Harlequins BJJ — Member App (Comp Tracker)
# Parent: ~/Developer/Black_Apple/2100_Clients/Harlequins_BJJ/
# Agency: ~/Developer/Black_Apple/CLAUDE.md | Global: ~/.claude/CLAUDE.md

## Project Goal
Live competition tracker PWA for Harlequins BJJ members.
Tracks match results, grades, upcoming events, and athlete profiles.

## Status
LIVE — maintenance only. All new features require explicit client approval.

## Live Deployment
| Property | Value |
|---|---|
| URL | https://harlequins-comp-tracker.netlify.app |
| Netlify Site ID | 4ebf5eec-3fdc-4155-8347-117b4bb014d7 |
| Deploy command | `netlify deploy --prod --dir=dist --site=4ebf5eec-3fdc-4155-8347-117b4bb014d7` |
| Last verified | 2026-04-29 LIVE ✅ — production Square payments, grading form at /grading-registration |

## Next Action
Maintenance only. Update content for Mid-Year Grading event (13 June 2026).

## Key Dates
| Event | Date |
|---|---|
| Mid-Year Grading | 13 June 2026 |
| End-Year Grading | 21 November 2026 |

## Tools Assigned
- React Native + Expo ~54 (web build → PWA)
- Netlify (hosting, manual deploy — no CI)
- Supabase (PostgreSQL + auth + storage)
- TypeScript ~5.9

## Technical Stack
| Property | Value |
|---|---|
| Framework | Expo ~54 / React Native 0.81.5 / React 19 |
| Router | Expo Router ~6 (file-based, tabs layout) |
| Database | @supabase/supabase-js ^2.98 |
| Auth env vars | EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY |
| Storage bucket | competition-images |
| Edge functions | ${supabaseUrl}/functions/v1 |
| Build | `expo export --platform web` → dist/ |

## Model Routing
| Task | Model |
|---|---|
| Bug fixes / code changes | qwen2.5-coder:32b |
| Orchestration | Claude Code (Sonnet) |

## Skills Assigned
- `frontend-design` — UI reviews, grading-event content updates, theme checks
- Pattern: bugfix → test locally → `expo export --platform web` → verify dist/ → `netlify deploy --prod`

## Design Spec
- Theme: Sovereign Harlequins Gold #D4A017, white base
- IBJJF belt colour palette in constants/

## Directory Structure
```
01_Member_App/source/
├── app/              ← Expo Router pages
├── components/       ← UI components
├── config/           ← App config
├── constants/        ← Theme, belts, dates
├── hooks/            ← Data hooks
├── scripts/          ← Build/deploy helpers
├── utils/            ← Shared utilities
├── public/           ← Static assets
├── dist/             ← Build output (gitignored) — deploy this dir
└── supabaseClient.ts ← Supabase client init
```

## Known Issues / Hotfix History
- 2026-03-20: .env must live in source/ (not 01_Ingestion/) — Metro needs it at root to embed EXPO_PUBLIC_ vars

## Backup Procedure

```bash
# From this directory (01_Member_App/source/)
git add <changed files>
git commit -m "descriptive message"
git push origin main
```

Remote: `https://github.com/csinclair256/harlequins-app.git`  
Auth: `gh` CLI — token in macOS keyring. Run `gh auth status` to verify. Re-auth: `gh auth login --web`  
Branch protection: force pushes + deletions blocked. No PR or signing requirement (solo project).

**Never commit:** `.env`, `dist/`, `node_modules/`  
**Always commit:** source changes, `grading-registration.html`, `netlify.toml`, `CLAUDE.md`

## Deploy Caution
- LIVE PRODUCTION — test every change locally before deploying
- Run `expo export --platform web` then check dist/ before `netlify deploy --prod`
- Confirm with Cameron before any production deploy
- Never deploy from a dirty or untested build
