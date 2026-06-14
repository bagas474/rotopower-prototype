# MRO Inventory (PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** Missing a $10 bearing can delay a $100,000 generator repair. Technicians need instant visibility into spare parts (Maintenance, Repair, and Operations - MRO) availability and the ability to book them.
  * *As a Maintenance Technician*, I want to book spare parts directly from my Work Order so that I don't have to walk to the warehouse to check availability.

### 1.1. Domain Glossary & Key Concepts
* **MRO (Maintenance, Repair, and Operations):** The supplies and spare parts needed to keep the plant running. (e.g., Bearings, Lubricants, Gaskets).
* **SKU (Stock Keeping Unit):** A unique identifier or barcode for each specific type of part in the warehouse.
* **Quantity on Hand (`qty_on_hand`):** The actual, physical number of items currently sitting on the shelf.

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Menu Location:** `Sidebar > Workforce Resources > MRO Inventory`
* **Core Layout:** *Standard Data Grid* listing Materials and Inventory Levels.
* **Cross-Module Integration:** The `MaterialBooking` action is designed as a *Global Modal* that can be triggered from here, OR directly from the `01_Work_Orders_Defects.md` Kanban board.

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields from the target Backend Schema ([`material.py`](../../../app-training-v2-be/app/schemas/material.py)) must be listed here.

**1. Material Catalog (`MaterialBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | PK. | `5012` |
| `item_code` | String | Output (Badge) / Input (Text) | Material number. | `BRG-6204` |
| `description` | String | Output (Text) / Input (Text Area) | Description. | `SKF Deep Groove Ball Bearing` |
| `quantity` | Integer | Output (Text) / Read-only | Current stock level. | `15` |
| `unit_cost` | Decimal | Hidden / Input (Number) | Cost per unit. | `45.00` |
| `location_id` | Integer | Output (Text) / Input (Hierarchy Tree Modal) | Bin/Shelf location mapped via Tree (`depth="location"`). | `14` |
| `min_stock` | Integer | Output (Text) / Input (Number) | Reorder point. | `5` |

**2. Inventory Levels (`MaterialsInventoryBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `location_id` | Integer | Output (Text) / Input (Dropdown) | Bin/Shelf location. | `14` |
| `qty_on_hand` | Integer | Output (Badge) / Input (Number) | Current physical count. | `24` |

**3. TRANSACTION SCHEMA (`InventoryTransactionBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | PK. | `902` |
| `material_id` | Integer | Hidden / Input (Auto) | Links to the item being moved. | `5012` |
| `type` | Enum (`TransType`) | Output (Badge) / Input (Dropdown) | `IN` (Receive), `OUT` (Issue). | `OUT` |
| `qty_change` | Integer | Output (Text) / Input (Number) | How many were moved. | `-2` |
| `work_order_id`| Integer | Output (Link) / Input (Dropdown) | The WO consuming this part. | `2041` |
| `asset_id` | Integer | Output (Link) / Input (Hierarchy Tree Modal) | The machine receiving it. Selected via Tree (`depth="asset"`). | `88` |
| `timestamp` | Datetime | Output (Text) / Read-only | Audit log. | `2024-05-20` |

### 2.3. User Flow (Main & Alternate Scenarios)
*Do not just write the 'Happy Path'. You MUST document what happens when things go wrong or when a user cancels an action.*

**[Main Flow: Happy Path (Booking via Work Order)]**
1. Technician is in `Work_Orders_Defects.md` repairing a pump.
2. Clicks "Book Material" on the Work Order drawer.
3. The *Global Material Booking Modal* opens.
4. Searches for `BRG-6204`. The modal shows `qty_on_hand: 24`.
5. Inputs `quantity: 2`. The `work_order_id` is auto-filled by the context.
6. Clicks "Confirm Booking". The system creates a `MaterialBooking` record and deducts 2 from the inventory.

**[Alternate Flow 1: Out of Stock]**
1. Technician searches for `GASKET-99`.
2. Modal shows `qty_on_hand: 1`.
3. Technician inputs `quantity: 2`.
4. The "Confirm Booking" button immediately disables.
5. The input box turns red, and an inline error appears: *"Insufficient stock. Only 1 available."*
6. A secondary action button appears: *"Request Restock from Procurement."*

### 2.4. Interface Components
* **Data Grid:** Displays a joined view of `MaterialBase` and `MaterialsInventory`.
* **Global Booking Modal:** A reusable React/Vue component. Must contain a fast SKU search bar (auto-complete).

### 2.5. UI States (The 5 Fundamental States)
* **Empty State:** If the MRO database is empty, show a "Catalog Empty - Import Master Data" button.
* **Loading State:** Standard Data Grid loading for the main page. The Booking Modal should show an inline spinner while searching for an SKU.
* **Error State (Form Validation):** Prevent negative numbers in `quantity` input. Show inline red errors.
* **Error State (System/Network):** If the booking transaction fails, show a toast notification.
* **Partial / Edge State:** If `qty_on_hand` is exactly `0`, render the badge in Red. If `qty_on_hand` < 5 (Low Stock), render the badge in Yellow.

### 2.6. Micro-interactions & Animations
* **Transitions:** The Global Booking Modal must fade in with a slight scale-up animation (a modern pop-up feel).
* **Hover & Click:** Clicking the "Confirm Booking" button transitions it into a loading spinner before displaying a checkmark.
* **Feedback:** When an SKU is selected in the search bar, its image and location (`Bin/Shelf`) should elegantly slide into view inside the modal.

---

## 3. Technical Frontend Execution
* The Global Booking Modal should be registered at the root level of the application state (e.g., via Context API or Redux) so it can be summoned from any route.
