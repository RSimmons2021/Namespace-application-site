# Assets and rendering references

## NullGraph

- Source: https://github.com/flarelink-in/NullGraph
- Author: Vikas Singh
- License: MIT; included in `public/assets/NullGraph-LICENSE.txt`.
- Actual library dependency: `null-graph@1.1.0`, importing `null-graph/geometry`.
- Used for spheres, rings, asteroid primitives, and the procedural spacecraft geometry builder.
- The spacecraft silhouette is adapted from the user-supplied [Comic Flight demo](https://nullgraph.dev/dashboard/games/comic-space). The source geometry remains procedural rather than a downloaded GLB.
- The [fly camera demo](https://nullgraph.dev/dashboard/camera/fly) and comic demo informed the neon control palette and flight interaction.

## Original work

Cel-shaded planet and ship shaders, inverted-hull ink outlines, shadow halftone, atmosphere, star placement, UI, application copy, player flight physics, chase camera, flight HUD, and the favicon are created for this application. The social preview is a screenshot of the implemented site.

## Typography

Chakra Petch, Manrope, and IBM Plex Mono are downloaded from Google Fonts and hosted locally. Their SIL Open Font License files are included in `public/fonts/licenses/`.

## Icons and libraries

Lucide icons are from `lucide-react`. React, Three.js, and other dependencies retain their licenses in their npm packages. NullGraph’s MIT notice is additionally included with the public application assets.

## Resume

`public/Richard_Simmons_Resume.pdf` is an unchanged copy of the resume supplied by the user. The website exposes the name, location, contact address, and professional links needed for the application, without adding personal details.
