# FX-1B — spectral material fidelity lab

Decision: **NO-GO — MATERIAL NEEDS ANOTHER CALIBRATION**.

The ribbon is materially closer to reference 03 than FX-1: a broad refractive
body replaces the localized stripe, the upper/central void stays black, and
pointer deformation changes the surface rather than merely tinting it. This is
not yet the reference's fine, luminous optical structure. The radial translation
also still reads too much like polished metal. This checkpoint does not approve
product integration.

## Scope and launch

- Branch: `pulse/fx-1b-material-fidelity`.
- Base: FX-1 `2de3eabadaffbfc3ebe5c61cd2591f2a9052f385`, not the FX-2 integration.
- Start: `npm run dev -- --config vite.fidelity.config.js --host 127.0.0.1 --port 5184`.
- Open: `http://127.0.0.1:5184/fx-fidelity.html`.
- Only new lab files and this report. Product pages, shared product UI, dependencies,
  backend and remote origin configuration are unchanged.
- The fixed reference middleware streams only `1080x1080 (3).mp4` and
  `1080x1080 (5).mp4` from the local user's Downloads directory. Neither source
  video nor extracted reference frames are committed or included in a build.

## Reference observations

Both supplied videos were decoded into twelve timestamped frames each and
inspected as sequences, with the original video players retained. The lab adds
1/30-second stepping for closer inspection; this is a seek increment, not an
assertion about encoded frame rate.

| Property | Reference 03: ribbon | Reference 05: ring |
| --- | --- | --- |
| Refractive region | Broad lower body; uneven concave meniscus rises at the ends | Narrow curved optical lens surrounding the central disk |
| Warm highlight | Amber/yellow left shoulder around a white-hot patch | Small amber fringes adjacent to concentrated bright patches |
| Cool region | Cyan/white lower-right body, dark blue above it | Blue/cyan reflections break into short segments around the lens |
| White core | Strong lower-left and lower-right luminosity; not a uniform outline | Concentrated moving glints, especially upper-left and opposing lower arc |
| Thickness | Broad body under a thin rolled edge; multiple apparent layers | Inner/outer bevels and a changing optical cross-section |
| Internal structure | Fine fanned streaks, colored fringes and a dark intermediate fold | Split streaks and unequal bright segments; no rigid single color band |
| Motion | Local bending and flow while silhouette stays stable | Highlight width/intensity changes independently of the stationary center |
| Pointer | Visible entry/exit correlates with illumination and meniscus response | No reliable pointer deformation can be inferred from the supplied crop |

Reference 03 is illuminated at approximately 0.04, 0.46 and 0.88 seconds;
dark at 1.29 through 2.96 seconds; illuminated again by 3.37 through 4.63
seconds. Reference 05 changes glint position and width across 0.04–4.61 seconds.
The exact original lighting, geometry and input mapping are not observable from
these recordings. None are claimed to have been recovered.

## Material model

1. **Geometry:** pill signed-distance field, nonuniform concave meniscus and
   domain-moving three-octave value noise. No scrolling gradient or rotation.
2. **Thickness H:** rounded silhouette × meniscus profile × local fold ×
   pressure compression. Center, folded boundary and outer lip differ.
3. **Normals:** central finite differences of H. A finite-difference curvature
   estimate concentrates optical energy around folds.
4. **Refraction:** displaced environment coordinates depend on normal, H,
   view-like direction, curvature and pointer deformation. Red, green and blue
   sample different coordinates. A secondary internally reflected ray samples
   the same environment at a different displacement. RGB contour bands are not
   painted as separate masks.
5. **Environment:** procedural dark graphite, broad studio light, narrow white
   strips, amber bounce and cyan/blue bank. No image texture or graphics library.
6. **Energy:** thickness-dependent absorption; approximate Fresnel; directional
   specular lobes; curvature/fold concentration; exponential display mapping.
   This is a height-field optical approximation, not a path-traced dielectric.
7. **Pointer:** local pressure deforms the meniscus and radial height field. The
   resulting changes propagate to normals, dispersion and highlights. Press
   changes compression; live touch uses the touch location rather than cursor
   tracking.

## Exactly three calibrations

| Candidate | Dispersion | Bend | H scale | Exposure | Assessment |
| --- | ---: | ---: | ---: | ---: | --- |
| A — Reference-faithful | 0.22 | 1.04 | 0.82 | 1.15 | Closest ribbon candidate; richer split internal light |
| B — Pulse-balanced | 0.17 | 0.92 | 0.77 | 0.85 | Restrained material, same model; useful next product candidate |
| C — Minimal | 0.10 | 0.80 | 0.70 | 0.48 | Quieter secondary-context study; loses reference energy |

Controls adjust B only. Fixed input presets (idle/left/center/right/press),
freeze and timed stepping reproduce comparisons. These are explicitly lab
input fixtures, not evidence of real product actions. The radial prototype uses
B and its own curved H; it does not wrap the old orbital-color shader.

## Evidence and runtime

Local evidence is saved outside the repository in `../fx-1b-evidence/`:

- `ribbon-{idle,left,center,right,press}-2.6s.png`.
- Matching states at 4.6s, plus a center sample at 3.6s.
- Live motion samples and radial prototype captures.
- Responsive and CSS fallback captures.

No motion video was produced; multiple rendered temporal samples are supplied.
Reference-containing screenshots remain local and are not shipped or pushed.

Native WebGL only; one context per visible candidate plus one radial prototype.
Contexts initialize near the viewport, pause offscreen and on hidden documents.
Idle scheduling waits 65 ms on fine pointers / 160 ms on coarse pointers between
frames; recent pointer activity requests animation frames. These are scheduling
intervals, **not measured FPS or battery-life claims**. DPR is capped at 1.75,
or 1.25 for coarse pointers. Context loss switches to CSS and restoration
reinitializes the renderer.

OS reduced motion is static by default. This browser reported reduced motion;
the initial scene drew once and remained static. An explicit unchecked-by-default
lab checkbox permits motion study without changing the OS preference. Manual
frame stepping remains available with reduced motion. The override is not
product code.

## Validation

- Targeted ESLint for the new lab and Vite configuration: PASS.
- Existing `lint:pulse`: PASS.
- Application build: PASS, 198 modules; no fidelity shader, entry, reference
  middleware or videos in the generated assets.
- Existing FX-1 tests: 6/6 PASS. These protect the old lab baseline; they are
  **not** presented as visual-fidelity tests for FX-1B.
- New shaders compile/link and render in the real browser with no console errors.
- Responsive checks at 1180×820, 820×1180 and 390×844: no horizontal overflow;
  screenshots saved locally. This does not constitute physical-phone battery QA.
- Actual offscreen check: ribbon A stayed at 99 draws while the visible orb
  advanced from 157 to 1556. The hidden-tab pause is implemented, not benchmarked.
- CSS fallback inspected using the explicit lab control. A real GPU failure was
  not induced; the loss/restoration handler is implemented but not end-to-end tested.
- No app regression sweep needed: no shared or product code changed.
- Added dependencies: zero. Application bundle impact: zero relative to FX-1.
- New lab source is approximately 28 kB before this report, unbundled.

## Remaining mismatch and next calibration

The broad refractive region, warm/cool distribution, black negative space,
internal bends and geometry-driven response now match the reference better.
The unresolved differences are visible, not test failures:

- **Shader design:** the ribbon is still too smooth/opaque in large bright
  areas. The reference's many fine streaks and dark internal split need better
  spatially varying internal-ray concentration.
- **Shader design:** the radial prototype has too much chrome/bevel identity
  and insufficient localized high-energy spectral sparkle.
- **Missing environment information:** the original studio light and reflecting
  scene are unknown; the procedural environment is an approximation.
- **2D model limits:** there is no true back-surface intersection, multi-bounce
  transport, physically computed caustic or surrounding bloom transport. A more
  expressive two-surface approximation may improve the next iteration without
  adding a graphics framework.

Recommended next step: calibrate the internal fold/caustic structure of A against
the supplied frame sequence before more radial work. Do not promote FX-2 or
change GO/Studio origins on the strength of this lab.
