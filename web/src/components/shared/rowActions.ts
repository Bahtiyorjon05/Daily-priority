/**
 * Classes for a card's edit/delete cluster.
 *
 * The pattern these replace was `opacity-0 group-hover:opacity-100`, which made
 * editing and deleting completely unreachable on a phone. Tailwind compiles
 * `group-hover:` inside `@media (hover: hover)`, so on a touch screen the reveal
 * never fires while the bare `opacity-0` always does — the buttons were there,
 * laid out, focusable, and permanently invisible.
 *
 * So: visible by default, and hidden-until-hover *only* where a hovering pointer
 * actually exists. Keyed on the pointer rather than a breakpoint, because a
 * Windows touchscreen is wide and still cannot hover.
 *
 * Both reveal variants out-specify the hiding rule — `group-hover:` compiles to
 * `.group-hover\:opacity-100:is(:where(.group):hover *)` and `focus-within:` to
 * `.focus-within\:opacity-100:focus-within`, each (0,2,0) against (0,1,0) — so
 * this does not depend on Tailwind's emit order.
 */
export const ROW_ACTIONS =
  'opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 ' +
  'group-hover:opacity-100 focus-within:opacity-100'
