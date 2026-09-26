# Tailwind replaces the hand-authored CSS

The design ships as 804 lines of hand-authored CSS (`.design/assets/styles.css`) with a frozen `@layer od-layout` block, and DESIGN.md §4 names that file the source of truth. The Next.js build will instead port the entire design system to **Tailwind v4**: tokens move into `@theme`, the layout primitives become utilities/compositions, and no product CSS ships alongside. Decided by the owner when asked to choose.

Consequences: DESIGN.md §4.1 (frozen block) and §9.1's "classes only, no hard-coded values" wording no longer describe the implementation and must be amended (see wayfinder map). The visual result must still match `.design` — the port is the risk this decision buys.
