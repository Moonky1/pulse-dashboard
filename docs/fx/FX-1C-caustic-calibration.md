# FX-1C — final caustic and light-fold calibration

Decision: **NO-GO for product adaptation**. This is a preserved experimental
calibration, not a visually certified release. Stop here rather than iterate
indefinitely. No PR, merge, deployment or remote configuration change.

Branch: `pulse/fx-1c-caustic-calibration`, based on FX-1B `9c4c659`.
Run the existing fidelity Vite configuration and open
`http://127.0.0.1:5184/fx-fidelity.html`.

## Changes to A

- Kept the existing thickness field, finite-difference normals, RGB-separated
  environment sampling, internal ray, pointer deformation and native WebGL.
- Added two shallow folds to thickness, shifted by the existing coherent noise.
  These alter ray direction rather than draw screen-space colored lines.
- Reused the five height samples for directional second derivatives. A bounded
  inverse diagonal-Jacobian proxy concentrates energy near converging folds.
  This is a heuristic, not a physical or energy-conserving caustic simulation.
- Masked interior concentration away from the outer boundary. Reduced ribbon
  Fresnel contribution independently; kept the outer silhouette lip separate.
- Added a localized near-white focal core, narrow white environment apertures
  and amber shoulders around those apertures. Exposure remains 1.15 for A.
- Tuned the internal-ray weight by thickness and gradient. A bounded cyan side
  light restores volume under narrow strips and darker intervening folds.
- Added low-amplitude advected micro-noise to thickness. Reduced its amplitude
  and the fine-fold slopes after the first pass became noisy and too dark.
- Changed ribbon-only tone mapping from exponential shadow lift to a rational
  shoulder with controlled clipping and less gamma lift. No global saturation
  increase. Reduced curvature-amplified RGB splitting to avoid noisy fringes.
- Lab controls now tune A. Four comparison buttons set shader/reference clocks
  to 0.46, 2.13, 3.79 and 4.63 seconds with labeled input approximations.
  Reference drawing now listens before thumbnail extraction completes and uses
  decoded video callbacks during playback. No lab layout redesign.

## Reference comparison and self-critique

| Question | Finding |
| --- | --- |
| Refractive volume rather than colored graphics? | Partially. Thickness and internal layering read clearly, but the left bright body still looks like polished metal. |
| Narrow optical folds? | Yes, more distinct than FX-1B, but some upper-left highlights break into small colored fragments rather than a few clean high-energy seams. |
| Cyan refracted rather than filled? | More layered, with a dark-blue upper region and internal streaks; the broad cyan body is still too uniform. |
| Warm light tied to white caustic? | Spatially localized near white apertures, but too muted/brown compared with the reference's narrow luminous yellow/amber fringe. |
| Motion redistributes energy like the reference? | Coherent drift and pressure change the folds, but the major left/right light masses remain too stable. It does not yet match the reference's optical flow. |
| What remains missing? | Bright folded seams with clean fanning, finer blue/cyan internal strata, less silver opacity, and more local temporal energy redistribution. |

Early 0.46s, middle/idle 2.13s, late/right 3.79s and end/left 4.63s
were visually inspected side-by-side. Press was separately inspected at 4.63s.
These input labels are test fixtures; they do not claim to recover the original
pointer trajectory or exact lighting. Idle remains appropriately dark.
Live A animation was enabled explicitly in the lab and sequential samples were
captured; no continuous side-by-side recording or measured frame-rate result is
claimed. The video was inspected through decoded timestamped frames.

Evidence remains local, outside Git, in `../fx-1c-evidence/`:
`early-center.png`, `middle-idle.png`, `late-right.png`, `end-left.png`,
`press.png`, `motion-01.png`, `motion-02.png`, `mobile.png`.
Reference screenshots and supplied videos are not shipped or pushed.

## A / B / C and Orb

A has **not** passed internal visual approval. Therefore no new B/C derivation
is approved or performed. Existing B/C parameter sets remain unretuned and
render the same shared shader for context; they are not final FX-1C presets.
There are no independent B/C shader forks. Automatic intensity derivation is
deferred until A passes the material gate.

The radial field, Orb environment, presets and renderer are unchanged. New
lighting/tonemapping behavior is ribbon-only. Radial adaptability remains
conceptually possible, but is deliberately not calibrated or integrated here.

## Texture and performance

No texture/LUT or dependency added. The unresolved issue is optical transport
and energy distribution, not a lack of noise detail; a decorative lookup would
not demonstrate a fidelity improvement and could conceal the same mismatch.

- Height samples: still five per ribbon fragment; environment evaluations:
  still seven; texture reads: zero.
- Extra work: five single-noise evaluations, two fold Gaussians per height
  sample, directional curvature/Jacobian arithmetic and additional bounded
  environment apertures. Some old environment operations are bypassed for the
  ribbon. No GPU instruction count or timing benchmark is claimed.
- Material module: 7,942 to 10,618 bytes (about +34%, source, not GPU cost).
  Current fragment string: 9,713 bytes.
- Renderer unchanged: offscreen/hidden pause, capped DPR, lower idle cadence,
  context fallback, reduced-motion default. Actual shader compiled/rendered.
- OS reduced-motion was active; ordinary frames stayed static. Explicit lab
  override allowed motion study and was turned off again afterwards.
- 1440×1120 desktop and 390×844 layout inspected. Mobile document width 375px
  within 390px viewport; no horizontal overflow. No physical-device benchmark.

## Validation / scope

- `npm run lint:pulse`: PASS.
- `npm run lint`: FAIL, 48 errors and 7 warnings in unchanged legacy GO/pages
  source (for example GoQuizRoom, StudioDashboard and Settings). No legacy lint
  cleanup is included in this checkpoint.
- `npm run build`: PASS, 198 modules. Build/test process spawning required the
  usual sandbox escalation after EPERM; successful reruns are the results above.
- `npm run test:fx`: 6/6 PASS. These are existing FX-1 regression contracts,
  **not** tests of FX-1C visual fidelity.
- `git diff --check`: PASS. Browser error/warning logs: empty during inspection.
- No full application release suite: no shared application source changed.
- Only material lab code, its controls and this report changed. No backend,
  auth, business data, Pulse pages, FX-2 release, origins or Production actions.

Next decision is material-model work, not product integration: the mismatch is
still substantial enough that simply adapting this effect to buttons/Orb would
be premature.
