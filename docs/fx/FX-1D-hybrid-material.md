# PULSE FX-1D — hybrid optical material

**Final verdict: NO-GO for reference fidelity. Stop material R&D here.**

The hybrid demonstrably adds thinner, more irregular light filaments and dark
intervals. It does not sufficiently remove the metallic left shoulder or recover
the reference's warm white energy and luminous cyan volume. Passing tests is not
visual approval. No Orb adaptation, B/C tuning or product integration follows.

## Scope / reproduction

- Branch: `pulse/fx-1d-hybrid-material`; base: FX-1C `1990ade`.
- Existing native WebGL/thickness/RGB refraction/internal ray/environment/
  pointer/Fresnel architecture retained. No external graphics dependency.
- Existing local viewer: `http://127.0.0.1:5184/fx-fidelity.html`.
- Run: `npm run dev -- --config vite.fidelity.config.js --host 127.0.0.1 --port 5184`.
- Only A enables the hybrid map. The checkbox switches A back to its exact
  procedural path for inspection; B/C and Orb remain baseline paths.

## Original optical asset

One **scalar caustic irradiance map**, not a colorful overlay or normal picture.
The first-party generator splats rays through an original periodic anisotropic
wave lens onto a periodic receiving plane, with 4x4 ray supersampling and
bilinear splats. Concentrated ray density is encoded as grayscale energy.
This is a useful optical approximation, not a physically exact light solver.

- Asset: `src/fx/fidelity/optical-energy.png`.
- Dimensions: **256 x 128**, 8-bit grayscale, power-of-two and periodic.
- PNG: **10,400 bytes**, lossless compressed.
- Scalar pixels: **32,768 bytes**; RGBA8 WebGL upload: **131,072 bytes**.
- No mipmaps; LINEAR filtering and REPEAT wrapping. No color-profile conversion.
- SHA256: `5294c887b18231c75b6a204c048f8ce12a6abb2fbdb132029c598c82dce45574`.
- Recreate with `node scripts/fx/generate-optical-map.mjs`.
- The generator reads no source images or videos. No reference pixels, assets
  from third parties, video textures, or image sequences are used.

Offline sampling provides thin asymmetric focal detail that the previous small
procedural field smoothed away. The shader still determines geometry, normals,
lighting, dispersion, colors, thickness and pointer response.

## Hybrid application

Two samples use deformed material depth, thickness, surface gradient and coupled
sinusoidal warps. A second, sheared/depth-offset path changes internal reflection
weight. Curvature gates focal energy; the edge mask prevents it from dominating
the silhouette. Low-energy areas transmit less broad milky fill, while
coincident map energy and incoming illumination produce narrow near-white cores.

No direct UV cursor translation or uniformly scrolling texture. Time changes
the local coordinate deformation on different axes/rates. Pointer deformation
changes H, its normal/curvature and thus both optical samples indirectly.
The texture carries no warm/cool color: existing shader lighting and dispersed
environment samples remain responsible for the chromatic relationship.

## Visual gate

| Criterion | Actual result |
| --- | --- |
| Narrower internal filaments | Improved visibly; distinct light threads replace some broad smooth fill. |
| Concentrated white caustic | More localized/intermittent, but insufficient white-hot energy and still silver in the left body. |
| Warm fringe near white | Structurally retained, visually too weak/brown versus the reference. |
| Layered cyan | Better internal streaks/dark gaps, but overall cyan is too dark and lacks the reference's luminous fan. |
| Refractive liquid volume | Partial; more optical layering, yet still reads like rippled chrome in important areas. |
| Temporal redistribution | Coherent non-linear movement and changing filaments, but major energy masses remain too stable. |
| Pointer/press | Geometry and light folds visibly respond; no independent painted cursor highlight. |

Compared reference vs A at **0.46, 2.13, 3.79 and 4.63 seconds**, plus left,
center, right and press states. Timestamp controls label an approximate input
mapping, not recovered reference input. Reference and A were also played live
side-by-side, with independent clocks; sequential captures rather than a movie
are supplied. Reduced-motion override was explicit and restored to off.

Local evidence (not committed) is in `../fx-1d-evidence/`: early-center,
middle-idle, late-right, end-left, press, motion-01, motion-02, baseline-off,
css-fallback PNGs. Reference content stays outside Git and the product build.

The existing viewer also needed two small correctness fixes: use the latest
queued visibility entry after rapid anchor jumps; do not let asynchronous
thumbnail generation overwrite a manually selected reference timestamp.

## Performance / resilience

- **2 texture2D evaluations per hybrid ribbon fragment**, 0 optical-map reads
  on baseline/Orb branches. One map asset; no added offscreen render passes.
- Existing five height samples and seven environment evaluations retained.
- Fragment string: **9,713 -> 10,989 UTF-8 bytes**, **+1,276 (+13.1%)**.
  Added warp/concentration arithmetic plus two bilinear lookups. No measured
  GPU instruction count or FPS/battery claim.
- Product bundle impact: **zero**; the standalone fidelity entry is not in the
  normal application build. Main JS remains 427.33 kB / 124.93 kB gzip;
  no optical asset or shader identifiers appear in dist.
- Lab pays the 10,400-byte PNG plus its small loader/shader changes. Actual
  browser/GPU allocation can exceed raw RGBA8 storage; no second full map.
- Existing capped DPR, idle throttling and hidden/offscreen pause retained.
- Missing/wrong-size texture signals CSS fallback, not false hybrid success.
- Loader cleanup ignores late image callbacks; context restoration reloads
  the map. Simulated actual `WEBGL_lose_context` returned fallback then WebGL
  with `hybrid ready`. Browser warning/error logs were empty after recovery.
- Reduced-motion static rendering and CSS fallback were visually checked.

## Validation

- `npm run test:fx`: **12/12 PASS** (6 existing + 6 hybrid tests).
- New tests cover reproducible PNG bytes/decoding, scalar dimensions, periodic
  ray field, sparse energy, linear-data upload, missing/invalid assets, stale
  callbacks after disposal, reloading and standalone scope. They do not claim
  visual fidelity.
- `npm run lint:pulse`: PASS. Generator syntax check: PASS.
- `npm run build`: PASS, 198 modules.
- `git diff --check`: PASS.
- No full application release suite: no shared product source changed.

## Final product decision

**Recommend option B:** an original small prerendered visual for a deliberately
limited hero/signature placement if reference-like richness remains important.
Keep ordinary interactive buttons simple. This recommendation is not implemented
or deployed here. It trades full pointer-driven optical simulation for
predictable authored visual quality; reduced-motion would need a still frame.

Do **not** start another expensive shader calibration loop. Do not adapt this
experiment to the Orb or promote FX-2. No PR, main merge, Production operation,
backend, user data or origin configuration change is part of FX-1D.
