# PIXS — CRISPE Prompt Guide for Backend/Database Connection
> Use this file as the **template library** when instructing agents to migrate a specific `.tsx` page from local `.json` data to the Laravel + MariaDB backend.

---

## HOW TO USE THIS GUIDE

1. Tell the agent: `"Read PIXS_DB_MASTER_REFERENCE.md first before doing anything."`
2. Identify which `.tsx` file you want to migrate
3. Copy the matching CRISPE template below (or use the blank template)
4. Fill in the specific page details
5. Paste to the agent

---

## BLANK CRISPE TEMPLATE

```
**Context:**
I am building PIXS Printing Shop — a React + Laravel + MariaDB system.
The frontend was originally connected to local `.json` files inside `src/data/`.
All data has been migrated to MariaDB (`pixs_db`). The full table structure and
migration map is documented in `PIXS_DB_MASTER_REFERENCE.md`.
The backend is Laravel running on XAMPP (local). The frontend is React + TypeScript.

**Role:**
Act as a senior full-stack Laravel and React TypeScript developer who specializes
in migrating local JSON-based frontends to RESTful Laravel API backends.
You have deep knowledge of MariaDB schema design, Laravel Eloquent ORM,
and React data-fetching patterns using Axios or React Query.

**Instruction:**
Migrate `[FILENAME].tsx` (and its sub-components listed below) from local `.json`
imports to live Laravel API calls.

Files to migrate:
- `src/pages/[FILENAME].tsx`
- `src/pages/[FILENAME]/components/[SubComponent].tsx`
- (add more as needed)

What was using local data:
- `import productsData from '../../data/products.json'` → now `/api/products`
- `import categoriesData from '../../data/categories.json'` → now `/api/categories`
- (list all json imports being replaced)

Do NOT touch:
- (list any files or logic that should remain unchanged)

**Specification:**
- Use Axios with a shared `axiosInstance` that includes the Laravel Sanctum auth token
- Use `useEffect` + `useState` for data fetching (or React Query if already set up)
- Add loading states (`isLoading`) and error states (`error`)
- Keep all existing UI/UX logic, classNames, and component structure intact
- Only replace the data source — do not refactor component logic or styling
- Add TypeScript interfaces matching the Laravel API response shape
- Format: show full updated file(s), not just the changed lines

**Performance:**
- Every API call must have a loading skeleton or spinner matching existing UI style
- No breaking changes to existing props or component contracts
- Laravel controller must return paginated results for list endpoints (default: 20 per page)
- Error responses must be caught and displayed using existing toast/notification system
- Must work with the existing React Router setup

**Example:**
Before (local JSON):
```tsx
import productsData from '../../data/products.json';
const [products, setProducts] = useState(productsData);
```
After (Laravel API):
```tsx
const [products, setProducts] = useState<IProduct[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  axiosInstance.get('/api/products')
    .then(res => setProducts(res.data.data))
    .catch(() => toast.error('Failed to load products'))
    .finally(() => setIsLoading(false));
}, []);
```
```

---

## READY-MADE CRISPE TEMPLATES

### Template 1: Homepage / Product Listing Page

```
**Context:**
I am building PIXS Printing Shop — React + Laravel + MariaDB.
All data is now in `pixs_db`. Full schema is in `PIXS_DB_MASTER_REFERENCE.md`.
The `HomePage.tsx` currently imports from `products.json` and `categories.json`.
These are now replaced by `/api/products` and `/api/categories` Laravel endpoints.

**Role:**
Act as a senior full-stack developer specializing in React + Laravel migrations.
You know that `categories.count` is auto-maintained by a DB trigger (not manually updated).
You know `products` has sub-tables: `product_variants`, `product_tags`, `product_gallery`.

**Instruction:**
Migrate `HomePage.tsx` and its sub-components to use Laravel API.

Replace:
- `import productsData from '../../data/products.json'` → GET `/api/products`
- `import categoriesData from '../../data/categories.json'` → GET `/api/categories`

Laravel should return products with eager-loaded: variants, tags, gallery (first image only for list view).
The `/api/categories` response must include `count` (number of products in that category).

Do NOT change:
- Existing filter/sort UI logic
- Component layout, classNames, animation
- React Router links

**Specification:**
- TypeScript interfaces: `IProduct`, `ICategory` must match the MariaDB column names
- Use `useEffect` + `useState` with loading/error states
- Category filter should use query param: `/api/products?category_id=CT001`
- Show existing skeleton loaders during fetch
- Format: show full updated HomePage.tsx

**Performance:**
- Products list must be paginated (20 per page, load more button)
- Category count badge must reflect live DB value
- Errors shown via existing toast system

**Example:**
The Laravel `ProductController@index` should return:
```json
{
  "data": [
    {
      "id": "P001",
      "name": "PPY Cup",
      "category_id": "CT001",
      "base_price": 2.85,
      "main_image": "https://...",
      "variants": [...],
      "tags": ["Budget-Friendly", "Food Grade"],
      "gallery": [...]
    }
  ],
  "meta": { "current_page": 1, "last_page": 3, "total": 20 }
}
```
```

---

### Template 2: Cart Page (AddToCartPage.tsx)

```
**Context:**
PIXS Printing Shop — React + Laravel + MariaDB.
Schema documented in `PIXS_DB_MASTER_REFERENCE.md`.
`AddToCartPage.tsx` currently reads/writes cart state from a custom `useCart` hook
that stored data in `localStorage`. Cart is now persisted in `cart_items` and
`cart_item_colors` tables in MariaDB, owned by the authenticated customer.

**Role:**
Act as a senior React + Laravel developer who understands:
- The cart item ID format: `{product_id}__{variant_id}__{color_id}__{screenplate_id}`
- Colors are stored in `cart_item_colors` with `channel_label` ENUM (Primary/Secondary/Accent)
- `plate_price` is the `screenplate_compatibility.print_price_per_unit` for the selected variant
- Max colors = `screenplate.channels` value

**Instruction:**
Migrate `AddToCartPage.tsx` to use Laravel API instead of localStorage.

Replace `useCart` hook internals to call:
- GET `/api/cart` — load all cart items (with colors, variant, plate info)
- POST `/api/cart` — add item
- PATCH `/api/cart/{id}` — update quantity, variant, or colors
- DELETE `/api/cart/{id}` — remove item

Do NOT change:
- UI layout, color picker logic, variant compatibility check UI
- `handleCheckout` flow (still navigates to `/transactions`)
- Framer Motion animations

**Specification:**
- Replace localStorage `pixs_checkout_node` write with POST to `/api/orders/prepare`
- All existing toast messages must remain
- The `getItemTotal()` calculation stays in frontend — prices come from API
- TypeScript: update `CartItem` interface to match API response shape
- Format: show updated `useCart.ts` hook + updated `AddToCartPage.tsx`

**Performance:**
- Cart must reload after every PATCH/DELETE (or optimistic update)
- If screenplate is required (`is_need_screenplate = true`) but none selected → show warning (existing UI)
- Failed API calls show existing toast.error()

**Example:**
GET `/api/cart` response:
```json
[
  {
    "id": "P001__V-PPY-12OZ__C001__SP-S-001",
    "product_id": "P001",
    "product_name": "PPY Cup",
    "variant": { "id": "V-PPY-12OZ", "size": "12oz", "unitPrice": 2.85 },
    "colors": [
      { "id": "C001", "name": "Deep Mint", "hex": "#75EEA5", "channel_label": "Primary", "channel_order": 0 }
    ],
    "plate": { "id": "SP-S-001", "name": "Standard Small Plate", "channels": 3, "plate_price": 2.50 },
    "quantity": 100
  }
]
```
```

---

### Template 3: Messenger Page (MessengerPage.tsx)

```
**Context:**
PIXS Printing Shop — React + Laravel + MariaDB.
Schema in `PIXS_DB_MASTER_REFERENCE.md`.
`MessengerPage.tsx` currently uses `localStorage` (key: `pixs_messenger_v1`) and
`messages.json` as the initial data source.
Messages are now stored in: `conversations`, `messages`, `message_attachments`,
`message_reactions` tables.

IMPORTANT: `sender_id` and `receiver_id` in `messages` have no hard FK —
they can be either employee (EMP-xxx) or customer (CUST-xxx) IDs.
Use `sender_type` ENUM to resolve which table to query.

**Role:**
Act as a senior full-stack developer who understands real-time messaging patterns
in Laravel + React. You know that emoji reactions require `utf8mb4` charset.
You know messages support: edit (is_edited), soft delete (is_deleted),
reply threading (reply_to_id self-FK), and file attachments.

**Instruction:**
Migrate `MessengerPage.tsx` to use Laravel API. Remove all localStorage usage.

Replace:
- `localStorage.getItem('pixs_messenger_v1')` → GET `/api/conversations/{id}/messages`
- `localStorage.setItem('pixs_messenger_v1', ...)` → POST `/api/conversations/{id}/messages`
- `handleEditMessage` → PATCH `/api/messages/{id}`
- `handleDeleteMessage` → DELETE `/api/messages/{id}` (soft delete)
- `handleReaction` → POST `/api/messages/{id}/reactions`

Do NOT change:
- `IMessage` interface shape (keep for UI compatibility, map from API response)
- GalleryView, MessageList, MessageInput component interfaces
- AnimatePresence animations, HeroSection logic

**Specification:**
- Add polling every 5 seconds for new messages (or Laravel Echo/Pusher if available)
- Map API response to `IMessage` interface format in a transformer function
- Maintain `isHeroVisible` logic (show hero if 0 messages)
- Format: show updated `MessengerPage.tsx` only

**Performance:**
- Messages must load with skeleton while fetching
- Reactions use optimistic update (update UI immediately, sync with API)
- Deleted messages show "This message has been removed." (existing text)
- All attachment uploads go to POST `/api/messages/{id}/attachments`

**Example:**
API message shape → IMessage transform:
```ts
const toIMessage = (m: ApiMessage): IMessage => ({
  id: m.id,
  sender: m.sender_type === 'customer' ? 'customer' : 'admin',
  senderName: m.sender_type === 'customer' ? 'You' : 'PIXS Admin',
  text: m.is_deleted ? 'This message has been removed.' : m.message,
  timestamp: m.created_at,
  attachments: m.attachments?.map(a => ({ type: a.type, url: a.url, name: a.name })) ?? [],
  reactions: m.reactions?.map(r => ({ user: r.user_id, emoji: r.emoji })) ?? [],
  isEdited: m.is_edited === 1,
  isDeleted: m.is_deleted === 1,
  replyTo: m.reply_to ? { id: m.reply_to.id, text: m.reply_to.message, senderName: m.reply_to.sender_type } : undefined
});
```
```

---

### Template 4: Admin Inventory Page

```
**Context:**
PIXS Printing Shop — React + Laravel + MariaDB.
Schema in `PIXS_DB_MASTER_REFERENCE.md`.
The `/inventory/stock` page is accessible only by employees with `role = inventory` or `role = admin`.
Stock updates are logged in `inventory_logs`. The trigger `trg_inventory_log_restock`
auto-updates `products.current_stock` on RESTOCK/ADJUSTMENT inserts.

**Role:**
Act as a senior Laravel developer who understands role-based middleware,
database triggers, and inventory management patterns.

**Instruction:**
Build the Laravel side of the inventory page:
- `InventoryController@index` — list all products with current_stock vs min_threshold
- `InventoryController@store` — create inventory_log entry (triggers stock update)
- `InventoryController@logs` — paginated log history

Middleware: only `admin` and `inventory` roles can access these routes.

**Specification:**
- `POST /api/inventory/logs` body: `{ product_id, qty_added, cost, type, notes }`
- `type` must be one of: RESTOCK, MISC, ADJUSTMENT, DAMAGE
- For MISC: `product_id` can be null, `qty_added` can be 0
- For ADJUSTMENT: `qty_added` can be negative (stock reduction)
- Response must include updated `current_stock` after insert
- Format: show `InventoryController.php`, `routes/api.php` additions, and `InventoryLog` model

**Performance:**
- Products below `min_threshold` must be flagged in response: `"is_low_stock": true`
- Logs must be paginated (50 per page)
- All role checks via Laravel Policy, not inline `if` statements

**Example:**
```php
// InventoryPolicy.php
public function manage(Employee $employee): bool
{
    return in_array($employee->role, ['admin', 'inventory']);
}
```
```

---

## QUICK REFERENCE: JSON → API CHEATSHEET

| Old Code (JSON import) | New Code (API call) |
|---|---|
| `import p from '../../data/products.json'` | `GET /api/products` |
| `import c from '../../data/categories.json'` | `GET /api/categories` |
| `import s from '../../data/screenplate.json'` | `GET /api/screenplates` |
| `import col from '../../data/color.json'` | `GET /api/colors` |
| `import m from '../../data/messages.json'` | `GET /api/conversations/{id}/messages` |
| `localStorage.getItem('pixs_cart')` | `GET /api/cart` |
| `localStorage.setItem('pixs_cart', ...)` | `POST/PATCH /api/cart` |
| `localStorage.getItem('pixs_messenger_v1')` | `GET /api/conversations/{id}/messages` |
| `localStorage.setItem('pixs_checkout_node', ...)` | `POST /api/orders` |
