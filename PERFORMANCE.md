# Landing-page performance

Measured 10 October 2026 using a production Vite build, headless Chrome, a 390 × 844 mobile viewport, cold cache, 4 Mbps download, 150 ms request latency, and a 4× CPU slowdown. Results are medians of three runs.

| Build / language | First contentful paint | Largest contentful paint |
| --- | --- | --- |
| Before optimization, English | 2.07 s | 2.07 s |
| English | 0.79 s | 0.79 s |
| Roman Urdu | 0.79 s | 0.79 s |
| Urdu | 1.06 s | 1.06 s |

The previous English runs ranged from 1.86 to 3.23 seconds because the external font stylesheet delayed rendering. Optimized English/Roman Urdu runs remained below 0.85 seconds; Urdu runs remained at or below 1.1 seconds.

## Changes

- Load login, account, organizer, member, admin, and export routes on demand. The landing page no longer downloads those pages on first visit.
- Serve variable fonts locally with font-display: swap, removing the blocking Google Fonts request. Urdu glyph subsets are fetched when Urdu text is used. Font licenses are included under public/font-licenses.
- Skip off-screen landing layout/paint using content-visibility, replace the large hero blur with a radial gradient, and respect reduced-motion preferences.
- Show the last fetched public landing content immediately on repeat visits and refresh it in the background. Preview data bypasses this cache.
- Enable compression for text assets in Apache-compatible hosting, while retaining long caching for hashed assets.

Initial compressed JavaScript fell from 121,008 to 89,129 bytes (about 26%). The final build still contains all pages; they are served in separate chunks when needed.

## Limits of these measurements

The test server served compressed production files locally under browser network/CPU throttling and returned a small public API fixture. These measurements isolate frontend loading; they do not measure Hostinger database response time, DNS, TLS, distant servers, or unusually slow connections. The two-second target passed for all three languages under this profile; live hosting needs verification after deployment. No commit or push was performed.
