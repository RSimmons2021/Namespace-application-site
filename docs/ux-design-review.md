# Application UX review

October 1, 2026. Implemented with the software-design-playbook and interface-details skills.

## Product frame

The visitor is a Namespace hiring reviewer evaluating Richard’s Product Engineer application. The assumption is that some reviewers want a quick read and others want to explore. Neither group should need to learn flight controls to find evidence, download the resume, or get in touch. This is an implementation review and browser verification, not a user study.

Keep the playable, cel-shaded ship and five planets as the primary experience. Give each world an understandable chapter name, let autopilot teach the journey through a successful action, and provide a persistent reading route.

## Findings and changes

| Priority | Evidence and impact | Implemented response | Confidence |
| --- | --- | --- | --- |
| High | On mobile, the Planets toggle remained available after docking, but its panel was rendered only during flight. The control did nothing while reading. | Render the destination panel in both modes; opening it holds the ship. Escape dismisses the panel before undocking or pausing. | High: code inspection and regression test |
| High | Chapter footer navigation lived inside long scrollable content. Reviewers had to finish scrolling before continuing or downloading. | Place chapter actions outside the scroller. Show “Fly to…” as the next action and finish Signal with an email action. | High: mobile browser inspection |
| Medium | Planet names alone did not identify the evidence. A reading link became an unexplained icon on mobile. | Lead navigation with chapter subjects and result teasers; keep “Read application” visible at 320 px. Add “Start with shipped work” to route to Forge. | High: interface inspection; content order is a design judgment |
| Medium | Autopilot gave no travel progress, and its cancel icon actually returned the ship to manual flight. | Show destination distance and native progress derived from actual simulation position; label the action “Take control.” | High: simulation and browser checks |
| Medium | Enter/F outside docking range silently did nothing. Reset did not explain whether visited planets were retained. | Announce the 50 m docking rule and autopilot recovery path without moving focus; acknowledge reset and retained visit markers. | High: observed behavior and regression tests |
| Medium | Brief navigation and close control scrolled away; the last mobile section link was clipped. | Keep header, section navigation, and resume/contact footer outside the body scroller. Wrap mobile navigation into two rows. | High: browser inspection at 320 and 390 px |
| Medium | Trait-based headings buried the strongest evidence. Some result captions were difficult to read on mobile. | Lead with shipped products, infrastructure cost, request volume, and task-time improvements. Increase content and result-caption sizes. | High for readability; positioning follows the supplied role and resume |

## Interaction states

- Loading: explain preparation and disable destination selection until the world is ready. Reading remains available.
- Standby: launch manual flight, take the guided Forge route, or read directly.
- Manual flight: retain WASD, roll, boost, brake, blasters, drag steering, and Enter/F docking. Invalid docking explains the rule.
- Autopilot: report the chosen world’s surface distance and physical progress. Steering or “Take control” restores manual flight. Arrival opens its chapter.
- Menu/help/reading dialog: hold the simulation. Menus and native dialogs preserve appropriate focus on dismissal. A mobile menu closes on outside interaction or Escape.
- Docked: focus the chapter scroller, keep continuation and resume actions visible, highlight the current planet, and permit travel through the Planets panel. Escape undocks only when no menu or dialog is open.
- After undocking: retain the ship’s position, heading, and roll. Hold position until steering, boost, or the Resume flight action begins manual flight; selecting another planet still starts autopilot. Closing a chapter never automatically turns the ship away from its planet.
- WebGL unavailable: preserve all chapters, contact, and resume through the reading view and destination selection.
- Clipboard unavailable: show an explicit selection-based recovery message rather than silently failing.
- Reduced motion: omit incidental transitions and idle rendering; user-directed flight continues to work.

## Detail rules applied

Concrete destination nouns and accurate action verbs (copywriting-1, -3), recovery steps and constraint-based feedback (-4, -8), current-state progress (-7), quieter copy (-10), generous touch targets (interactivity-3; accessibility-7), persistent chapter context (interactivity-34), shareable planet bookmarks (-37), focus visibility and keyboard paths (accessibility-1, -12), reduced motion (-2), copyable email (-4), brand casing and text selection (typography-4, -5), and brief, interruptible feedback (motion-11, -15).

The site uses a small shared set of surface, border, and feedback timing values. It retains native dialogs, progress, links, and buttons. Feedback is immediate, with 120 ms color transitions where motion is allowed; no reveal blocks interaction.

## Evidence boundaries

Candidate metrics are resume-reported. Agent Lab figures remain scoped to its puzzle suite, and Agent Relay remains a project demonstration. Namespace references and the contribution proposal retain the distinctions documented in [namespace-research.md](namespace-research.md). No new company claims or relocation commitments were added.

## Verification

Production build, browser regression suite, keyboard and touch gameplay, all five bookmarks, menu/focus behavior, docking range feedback, reading navigation, clipboard success/failure, original resume bytes, and WebGL fallback. Axe scans cover the game, help, mobile layout, docked project chapter, and reading view. Visual review covers desktop and mobile layouts with reduced motion. Final results: all 19 Playwright tests passed (3.0 minutes). No critical or serious Axe violations were found in the tested views. React Doctor remained at the pre-change 75/100 with five existing warnings and no new diagnostics; the flagged scroll-region tab stop is intentional keyboard access, and the skip link deliberately opens the reading dialog without changing the planet URL. Desktop 1440 × 900 and mobile 390 × 844 / 320 × 740 layouts were inspected. No critical in-scope finding remains open.

A docking test initially hit its 20-second arrival deadline while builds and scans competed with Chromium’s software renderer. The ship remained on course. The browser deadline was raised to 30 seconds; no simulation speed or docking range was changed, and all three docking-key cases passed in the final run.


## October 2: heading continuity correction

A user reported an unexpected direction after closing a planet chapter. The undock implementation recomputed orientation from the planet’s outward normal with world-up, causing an approximately 180° turn and discarding roll. The regression test reproduced a 3.14159-radian heading change. Undocking now retains position and orientation and enters an explicit holding state. Deliberate steering, boost, Resume flight, or a new course determines the next movement. Brake and blasters alone leave the ship holding.

Physics regressions exercise every planet, autopilot arrivals, bookmarked positions, manual docking, and rolled headings. Browser regressions check chapter dismissal by button and Escape, heading/position continuity, resuming via button and keyboard, and touch steering after undocking. All 22 tests passed (1.8 minutes), including the original flight and accessibility checks. The production build passed; React Doctor remained at 75/100 without new diagnostics.

## October 2: application release

Phone landscape previously clipped the final destinations and let the cockpit compete with the hero. Short screens now use a compact cockpit and a scrollable Planets drawer; the reading dialog retains its header, section navigation, and action footer with at least 155 px of reading space at 568 × 320. Regression coverage includes 844 × 390 and 568 × 320.

At the candidate’s request, the website omits location/remote copy and FocusFi. Lucid links to https://lucid-app.xyz, Agent Relay links to its public source, and the application footer links to this site’s GitHub repository. The original and downloadable resumes remain byte-for-byte unchanged. Canonical and social metadata use https://namespace-application-site.vercel.app, with a new local 1440 × 900 preview of the cel-shaded game.

Verification: all 24 tests passed (2.2 minutes), including flight, docking keys, heading continuity, touch input, reading/navigation, original resume bytes, unavailable WebGL, and Axe checks. The production build passed. React Doctor remained at the baseline 75/100 with the same five diagnostics. Visual inspection covered desktop and both landscape layouts. Vercel deployment excludes credentials, development artifacts, tests, and research documents; Git ignores generated environment and Vercel files.
