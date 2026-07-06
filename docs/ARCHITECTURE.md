# Architecture Reference Guide & Guidelines

This codebase follows a strict **Feature-Driven Architecture** (inspired by Feature-Sliced Design principles). It is optimized to prevent spaghetti imports, ensure structural scaling, and simplify testing/refactoring.

---

## 📂 Core Structure Overview

The codebase is organized into three primary folders under `src/`:

```
src/
├── app/                  # Next.js App Router: Pure routing & layout only. NO inline UI.
├── features/             # Self-contained feature domains.
│   ├── shop/             # Catalog browsing, products list, product detail.
│   ├── cart/             # Digital cart management & empty states.
│   ├── checkout/         # Digital voucher billing & processing.
│   ├── orders/           # Transaction logs & key deliveries.
│   └── invoices/         # Billing receipts & downloads.
└── shared/               # Truly global, logic-free helper modules & UI primitives.
    ├── components/       # Global brand assets (arena-coin, arena-logo) and shadcn UI.
    └── lib/              # Axios wrappers, utilities.
```

---

## 🛠️ Key Architectural Constraints & Rules

### 1. `app/` is ONLY Routing
* **Rule**: Do not write page layouts or component trees directly inside `app/` route folders. Page files should act as *controllers/orchestrators* that fetch parameters, call services, and render feature shells.
* **Bad**:
  ```tsx
  // app/cart/page.tsx
  export default function CartPage() {
    return <div className="flex bg-[var(--void)] text-white">Empty Cart UI...</div>
  }
  ```
* **Good**:
  ```tsx
  // app/cart/page.tsx
  import { CartShell } from "@/features/cart";
  
  export default function CartPage() {
    return <CartShell />;
  }
  ```
* **Status**: Fully aligned for all routes: [shop](file:///Users/priyansuchavda/Documents/16arena-shop/src/app/(public)/shop/page.tsx), [cart](file:///Users/priyansuchavda/Documents/16arena-shop/src/app/(public)/cart/page.tsx), [checkout](file:///Users/priyansuchavda/Documents/16arena-shop/src/app/(public)/checkout/page.tsx), [orders](file:///Users/priyansuchavda/Documents/16arena-shop/src/app/(protected)/orders/page.tsx), and [invoices](file:///Users/priyansuchavda/Documents/16arena-shop/src/app/(protected)/invoices/page.tsx).

---

### 2. Isolated Features (`features/`)
* **Rule**: Every business domain must sit under `src/features/`. Features must never import internal parts (e.g. `components`, `utils`, `services`) of another feature directly. They may only communicate through public contracts or shared schemas.
* **Boundary Structure**:
  Each feature follows this rigid directory structure:
  ```
  features/my-feature/
  ├── components/         # Feature-specific UI elements (e.g. Shells, Cards)
  ├── services/           # API fetch wrappers (axios/fetch calls)
  ├── types/              # Type definitions and domain schemas
  ├── store/              # Zustand/Context state stores (local to feature)
  └── index.ts            # Entry point. ONLY exports public APIs of the feature.
  ```

---

### 3. `shared/` is NOT a Dumping Ground
* **Rule**: Keep `shared/` lean and business-logic free. 
* **Scope Criteria**:
  * An item goes to `shared/` **only if** it is used by **2+ features** and does not contain custom business logic.
  * If a component or helper is used by only one feature, keep it **inside** that feature.
* **Good examples of shared items**: shadcn buttons/cards, Arena coin/logo vector SVGs, and generic currency helpers.

---

### 4. Mandatory Service Layer
* **Rule**: Do not perform direct API calls (`fetch`, `axios.get`) inside components or hooks. Instead, declare them in the feature's `services/` layer.
* **Bad**:
  ```tsx
  // components/ProductCard.tsx
  useEffect(() => { fetch('/api/products').then(...) }, [])
  ```
* **Good**:
  ```typescript
  // services/product.service.ts
  export async function fetchProducts() {
    return getData("/api/v1/shop/products");
  }
  ```

---

### 5. State Management per Feature
* **Rule**: Avoid centralized global state stores (e.g. `store/index.ts` holding cart, checkout, user, and shop state together). Create feature-specific stores (e.g. `features/cart/store/cart.store.ts`) using Zustand or React Context.

---

## 🎯 Entry-point & Import Discipline

### Public Entry Points (`index.ts`)
Each feature exposes a clean index file acting as its public interface. 
* **Bad (Deep Imports)**:
  ```typescript
  import { CartShell } from "@/features/cart/components/CartShell";
  import { fetchCartItems } from "@/features/cart/services/cart.service";
  ```
* **Good (Clean Import)**:
  ```typescript
  import { CartShell, fetchCartItems } from "@/features/cart";
  ```

This import discipline ensures you can safely refactor files inside components/services without breaking consumers across the project.

---

## 🚀 Checklist: Adding a New Feature

When creating a new feature (e.g., `tournaments`):

1. **Setup Directory Boundary**:
   * Create `src/features/tournaments`
   * Create subfolders: `components/`, `services/`, `types/`, `store/`
2. **Define Entry Point**:
   * Create `src/features/tournaments/index.ts` and add public wildcard exports.
3. **Move/Write Layout Shell**:
   * Write `<TournamentsShell />` inside `components/`.
4. **Implement Services**:
   * Write fetch API calls inside `services/tournaments.service.ts`.
5. **Connect Route**:
   * Create `src/app/tournaments/page.tsx`.
   * Keep it route-only: Import and render `<TournamentsShell />`.
