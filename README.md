# Richard Simmons × Namespace

A playable third-person space flight application for Namespace. Pilot a neon interceptor through a five-planet system; dock at a world to read a chapter of Richard Simmons’s application. Inspired by the supplied [NullGraph Comic Space demo](https://nullgraph.dev/dashboard/games/comic-space).

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Vite. If another app already uses `localhost:5173` on IPv6, use `http://127.0.0.1:5173` or choose a different port:

```sh
npm run dev -- --port 5180
```

## Build and verify

```sh
npm run build
npm run preview
npm run test
```

The browser tests use an installed Chrome at `/opt/google/chrome/chrome` when available. On another machine, either set `CHROME_PATH` to your Chrome executable or install Playwright Chromium with `npx playwright install chromium`. Tests start an isolated Vite server on port 4175. They exercise the actual player position and orientation, flight physics, collisions, autopilot arrival at every planet, keyboard and touch controls, docking, pause, application content, project tabs, the reading dialog, the exact resume download, mobile layout, unavailable WebGL, and an axe accessibility audit.

## Fly

- **Launch ship** starts forward cruise with a third-person chase camera.
- **W / S** pitch up / down; **A / D** turn left / right; **Q / E** roll.
- **Shift** boosts; **B** brakes; **Space** fires the twin blasters. Asteroids can be destroyed.
- **Enter** (including the number pad) or **F** docks within 50 meters of a planet’s surface. The docking prompt appears when you are close enough.
- **1–5**, a planet waypoint, or a mission button engages autopilot. The ship physically flies to that planet and docks on arrival. Manual steering cancels autopilot.
- **P / Escape** pauses or resumes flight; **R** resets the ship; **H** opens the controls. Escape undocks when reading a planet chapter.
- **Touch / mouse:** drag the sky to steer. Mobile has hold-to-boost, hold-to-brake, fire, and a Planets menu.
- **Undock and fly** closes the chapter and preserves position, heading, and roll, then holds until you steer, boost, or choose Resume flight.
- **Read application** opens the complete application without requiring flight. Direct links such as `/#nexus` start docked at that planet.
- Reduced motion disables ambient planet/fleet animation, boost streaks, and FOV effects. User-directed flight remains playable. Pause stops player physics and lasers as well as ambient animation.

## Content and positioning

The copy is based on the supplied resume in `docs/`. Candidate metrics are presented as resume-reported results; project evaluation metrics retain their original scope. No employers, credentials, customer relationships, or willingness to relocate have been invented.

The company research, source links, reasoning, and role-fit analysis are in [docs/namespace-research.md](docs/namespace-research.md). It covers Namespace’s CI integration, configuration, caching, observability, customer stories, security, and current agent Devbox direction. The proposed “first useful run” contribution is explicitly an idea for discussion.

Edit personal links, email, destination metadata, and company sources in `src/content.ts`. Edit application copy in `src/components/Dossier.tsx`. The original resume is copied unchanged to `public/Richard_Simmons_Resume.pdf`.

## Rendering

- **React + TypeScript + Vite** for the application and native controls.
- **Three.js / WebGL** for the scene, atmosphere, camera, raycasting, and flight.
- **NullGraph 1.1.0** for actual sphere, ring, and asteroid generation and the spacecraft geometry builder. `src/world/geometry.ts` bridges its interleaved typed arrays into Three.js BufferGeometry without re-generating the geometry.
- Original cel shading with stepped light bands, dark silhouette outlines, shadow halftone, and graphic planet terrain; deterministic stars and instanced asteroids.
- A compact procedural ship references the silhouette in NullGraph’s Comic Flight demo. No large game assets or external rendering services are fetched at runtime.
- Main application HTML loads independently from the lazy Three.js scene. Fonts, resume, and social preview are hosted locally.
- Software rendering uses a lower resolution and update cadence; paused, stationary worlds do not redraw. Resources and event listeners are cleaned up on unmount.
- Without WebGL, the app reports that flight is unavailable and preserves every application chapter and the full reading brief.

NullGraph is a separate WebGPU renderer, so its WebGPU core is not used to create a second renderer. The geometry bridge honors the requested NullGraph reference while keeping Three.js responsible for rendering. See [docs/asset-attribution.md](docs/asset-attribution.md).

## Hosting

Deploy the generated `dist/` folder on any static host. Vite preset: build command `npm run build`, output directory `dist`. Planet URLs use hashes, so server-side route rewrites are unnecessary. The site has no backend, API credentials, account creation, or form submission. Contact uses the candidate’s email address, and project buttons open the actual live demos.

Production: https://namespace-application-site.vercel.app

Source: https://github.com/RSimmons2021/Namespace-application-site

The canonical URL, Open Graph image, and Twitter card point to the production domain. `vercel.json` declares the Vite build and `dist` output. To publish an update with the authenticated Vercel CLI, run `vercel deploy --prod --yes --scope richards-projects-db6a226a`.
