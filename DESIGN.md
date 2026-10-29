# ModularDom — Mallorca Private Residences · Design system

## Concept: *The horizon line*

Every Mallorca residence is sold on one thing that no render can fake: the line
where the land stops and the Mediterranean begins. The identity is built on
that line. A single bronze hairline runs through the experience. It is drawn
once in the opening sequence. After that it reappears as the active marker in
navigation, in the comparator handle and in chapter progress. Everything else
stays quiet: mineral black, stone white, large light serif type and a lot of
room.

The visitor should not feel they are browsing listings. The site behaves like a
private presentation. It opens with a film, sets out a short argument, and then
gives each residence its own *Private Showroom*, a sequence of chapters rather
than one crowded page.

## Tokens

| Token | Value | Role |
| --- | --- | --- |
| `mineral` | `#161715` | Dark surfaces, primary text on light |
| `mineral-2` | `#1E1F1C` | Raised dark surface (viewer chrome) |
| `stone` | `#F5F3EE` | Light surface |
| `sand` | `#D7CBB7` | Secondary light surface, hairlines on dark |
| `warm-grey` | `#96938D` | Secondary text **on dark only** (fails on stone) |
| `ash` | `#67645E` | Secondary text on stone (5.3:1) |
| `bronze` | `#A89170` | The horizon line, focus rings, active markers. Not body text on stone |
| `bronze-deep` | `#7A6547` | Bronze used as text on light (5.0:1) |

Type:

- **Newsreader** (variable, optical sizes): display and editorial text. Display
  set at weight 300 with tight tracking (-0.025em), sentence case.
- **Hanken Grotesk**: navigation, data, forms, buttons. 15–16px base, tabular
  numerals for specifications and coordinates.
- No eyebrow labels, no all-caps label system, and no single-word accent styling
  in headlines.

Scale (fluid): display `clamp(3rem, 7.4vw, 6rem)`, h2 `clamp(2.25rem, 4.6vw,
4rem)`, h3 `clamp(1.5rem, 2.4vw, 2rem)`, lead `1.375rem` serif, body `1rem`
sans / `1.125rem` serif.

Motion (Emil Kowalski's rules):

- `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` for entrances and UI;
  `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement;
  `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` for panels.
- One authored moment: the opening sequence (wordmark → horizon line draws →
  headline lines rise from their masks → actions fade). Everything else answers
  the visitor (selecting a residence, opening the gallery, entering the 3D
  model).
- UI motion stays under 300ms. Presses scale to 0.97. Hover effects are gated
  behind `(hover: hover) and (pointer: fine)`.
- `prefers-reduced-motion`: no autoplaying film (poster instead), no
  transforms; opacity transitions only.

## Layout

12-column grid with a 1440px max measure. Side gutters are 24px on mobile and
`5vw` on desktop. Compositions are asymmetric and left-aligned. Text blocks
stay narrow (≤ 34rem) and sit against large images. Images are never cropped
past their declared focal point, and renders keep their aspect ratio (`contain`
inside a toned plate when the frame disagrees).

Surfaces alternate by chapter: film and showroom chapters are mineral (a
cinema), and editorial chapters are stone (paper). The header switches between
light and dark based on the section beneath it (`data-surface`).

## Honesty rules (from the brief)

- Demonstration media (the procedural maquette plates, films, panoramas and
  plan) always carry a visible "Demonstration" mark. They are flagged with
  `demo: true` in content.
- Specifications flagged `illustrative` say so next to the figures.
- Prices default to *Price on request*. The site never shows invented
  scarcity, countdowns or urgency.
- Distances, services and certifications only appear when `verified: true`.
