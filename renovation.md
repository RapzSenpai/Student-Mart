# StudentMart Renovation Plan

**AI AGENT: READ THIS ENTIRE FILE BEFORE DOING ANYTHING.**

## Execution Rules (non-negotiable)

1. **Plan mode first.** Do not edit files until Phase 0 + Phase 1 (Audit + Gap Analysis) are complete and presented to the user.
2. **One phase at a time.** Complete a phase, report what changed, wait for confirmation before starting the next phase. Do not batch multiple phases in one pass.
3. **Never break existing functionality.** Extend/improve, don't rewrite working systems for the sake of rewriting.
4. **Reuse existing logic wherever possible** (cart, checkout, order, auth). UI/UX gets revamped; underlying working logic does not get needlessly replaced.
5. **This is a school store with physical pickup**, not shipped e-commerce. Every copy/UX/status decision must reflect that. Never write Amazon-style marketing copy.
6. **Suggest before implementing** anything not explicitly specified (e.g. new order statuses, low-stock indicators, empty/loading states). Present suggestion, get approval, then implement.
7. **Frontend AND backend validation** must stay in sync. Don't rely on HTML-only restrictions if backend validation exists in the project.
8. **Don't hardcode** data that should come from the database.
9. Match project's existing conventions/architecture. Don't introduce unnecessary dependencies.

---

## Roles & Scope (decision update)
- **No separate seller role and no seller UI.** The **admin** owns and manages the entire product catalog and all orders.
- The admin area is a single **sidebar layout** mounted at `/admin`, hosting two sections:
  - **Products** — create / edit / delete products (name, description, price, stock, category, classification, image).
  - **Orders** — order list, status updates, receipt.
- All product management is admin-only. Remove any `sellerId` / seller references.

---

## Phase 0 — Audit (REQUIRED FIRST, NO CODE CHANGES)

Inspect and report on:
- Current pages/routes
- Components structure
- Auth flow
- Database models/schema
- API endpoints
- Product structure (fields, categories, variants if any)
- Cart system (how items are added/stored/synced)
- Checkout/order-summary system
- Order system (statuses, history if any)
- Admin system (product mgmt, order mgmt)
- Existing styling setup (CSS approach, fonts, current UI library if any)
- Existing dependencies (package.json)
- Existing assets folder (confirm StudentMart logo/image location for hero section)

**Output:** structured audit report. No file edits in this phase.

## Phase 1 — Gap Analysis (NO CODE CHANGES)

Using Phase 0 findings, produce:
- What already exists and can be reused as-is
- What exists but needs UI-only rework
- What needs new backend/API work
- What needs new DB schema/fields (e.g. `studentId`, product `stock`, `classification`, `images[]`, order `status`, pickup status)
- What could break, and how it'll be avoided
- Any suggestions (per Rule 6) — list them explicitly, don't implement yet

**Output:** gap analysis report. Wait for user go-ahead before Phase 2.

## Phase 2 — Design Plan (NO CODE CHANGES)

Propose UI/UX direction for: landing page, store/product listing, product card, product details, cart, checkout, order history, navbar, notifications, admin product mgmt, admin order mgmt, receipt, about, contact, privacy.

Visual direction to lock in:
- Primary: soft blue
- Background: smoke white / light neutral
- Style: minimalist, compact (not spacious), formal but approachable, consistent across pages
- Typography: clean/formal/highly readable font, replace current fonts
- Icons: proper icon set, replace all emoji usage
- Component library: DaisyUI (`npm i -D daisyui@latest`) — verify compatibility with existing stack before install

**Output:** design plan. Wait for user go-ahead before implementation phases.

---

## Implementation Phases (execute strictly in order, one at a time)

### Phase 3 — Design System / DaisyUI Setup
- Install and configure DaisyUI, confirm no conflicts with existing Tailwind/CSS setup
- Define theme tokens (soft blue primary, smoke white backgrounds)
- Verify: existing pages still render, no style regressions

### Phase 4 — Typography & Global Styling
- Apply new font across app
- Global spacing/color/component baseline
- Verify: no layout breakage on existing pages

### Phase 5 — Landing Page
- New route (app should land here, not directly on product listing)
- Two-column hero: left = intro text + subtext + CTA into store; right = existing StudentMart logo/image from assets (reuse, don't recreate)
- "Why StudentMart?" section: icons + small cards, school-store-relevant benefits only (convenient ordering, easy browsing, simple checkout, pickup-based ordering, order tracking/history, stock visibility)
- Thank-you closing section
- Footer: © 2026 StudentMart. All rights reserved. + About / Contact / Privacy links
- Verify: existing store route still reachable, auth-gated routes unaffected

### Phase 6 — Static Pages
- Create `/about`, `/contact`, `/privacy` with StudentMart-relevant, school-pickup-store-relevant content
- Wire up footer links

### Phase 7 — Navigation/Layout Redesign
- Navbar redesign, add bell icon (notification UI shell only, no logic yet per Phase 15)
- Verify: all existing nav links/routes still work

### Phase 8 — Registration: Student ID Field
- Add Student ID field: numeric only, max 10 digits
- Frontend validation (input restriction + form validation, not HTML-only)
- Backend validation if backend exists for registration
- Verify: existing registration flow (all other fields, submit, error handling) still works end-to-end

### Phase 9 — Store/Product UI Redesign
- Revamp product listing using DaisyUI components
- Product card shows: image, name, price, stock/availability, classification/variant (if applicable), Buy Now button, Add to Cart button
- Keep existing Add to Cart behavior intact, only UI/flow improves
- Verify: category filtering, existing product data rendering still work

### Phase 10 — Product Details Page
- New route, reached via Buy Now from product card
- Shows: name, description, price, stock, classification/variant, images, reviews (only if data structure supports or can reasonably support), quantity selector, Buy Now, Add to Cart
- Buy Now flow: Product → Product Details → Checkout
- Add to Cart flow: Product → Cart (stays on/returns to cart, not forced into details)
- Verify: both flows correctly pass product/quantity data downstream

### Phase 11 — Cart Redesign
- Reuse existing cart logic, redesign UI only
- Verify: add/remove/update quantity still functionally correct

### Phase 12 — Checkout / Order Summary Redesign
- Reuse existing checkout logic, redesign UI only
- Display: products, quantities, prices, total, pickup/order info, final confirmation action
- School-pickup framing throughout (no shipping language)
- Verify: existing order creation logic unaffected

### Phase 13 — Stock & Quantity Validation
- Enforce stock limits at: product card display, cart quantity increase, checkout submission
- Handle edge cases: concurrent orders on same product, stock changed after add-to-cart, stock changed after cart quantity increase, stock insufficient at checkout time
- Server-side enforcement required, not just UI-level
- Verify: valid orders within stock still succeed; over-stock attempts are blocked at every entry point, not just the card

### Phase 14 — Order History Page
- New page: order number/reference, date, items, total, order status, pickup status if applicable
- Verify: pulls real order data per logged-in student, no cross-user leakage

### Phase 15 — Admin Product Management (in admin sidebar)
- Improve product create/edit to support: name, description, price, stock, category, classification/variant, multiple images
- Admin UI for adding/managing multiple images per product
- Hosted inside the `/admin` sidebar (Products section)
- Follow existing DB architecture, no unnecessary new complexity
- Verify: existing admin product creation via category `+` button either upgraded in place or cleanly replaced without losing existing products/data

### Phase 16 — Admin Order Management + Online Receipt (in admin sidebar)
- Hosted inside the `/admin` sidebar (Orders section)
- Add "Download Receipt" action in admin order list
- Receipt includes: student/customer info, order/reference number, date, items, quantities, individual prices, total, pickup info, StudentMart branding
- Reuse existing order data, don't duplicate/re-fetch redundantly
- Verify: receipt data matches actual order record

### Phase 17 — Notification UI Shell
- Bell icon in navbar (already added Phase 7) — ensure dropdown/panel shell exists, structured for future logic wiring
- No notification logic/backend required this phase
- Verify: shell doesn't break navbar layout, no dead links/errors

### Phase 18 — Responsive & Accessibility Pass
- Full responsive check across all new/changed pages
- Semantic HTML check, keyboard nav, contrast, alt text on images
- Verify: mobile layout for landing, store, product details, cart, checkout, order history, admin

### Phase 19 — Regression / Testing Pass
- Full click-through of: registration, login, browse, add to cart, buy now, checkout, order history, admin product CRUD, admin receipt download
- Confirm nothing from the pre-renovation feature set is broken
- Report final summary: what changed, what was added, what was verified

---

## Reporting Format (use after each phase)

```
PHASE N COMPLETE: <name>
Changed: <files/areas touched>
Added: <new features/components>
Verified: <what was tested and confirmed working>
Risks/Notes: <anything the user should know>
Ready for Phase N+1? (waiting for confirmation)
```
