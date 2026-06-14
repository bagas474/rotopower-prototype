# MRO Inventory (PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** Missing a $10 bearing can delay a $100,000 generator repair. Technicians need instant visibility into spare parts (Maintenance, Repair, and Operations - MRO) availability and the ability to book them.
  * *As a Maintenance Technician*, I want to book spare parts directly from my Work Order so that I don't have to walk to the warehouse to check availability.
  * *As a Warehouse Manager*, I need to track `qty_on_hand` at specific bin locations to know exactly what we have and where it is.

### 1.1. Domain Glossary & Key Concepts
* **MRO (Maintenance, Repair, and Operations):** The supplies and spare parts needed to keep the plant running. (e.g., Bearings, Lubricants, Gaskets).
* **SKU (Stock Keeping Unit):** A unique identifier or barcode for each specific type of part in the warehouse.
* **Quantity on Hand (`qty_on_hand`):** The actual, physical number of items currently sitting on a specific shelf/location.
* **Material Booking:** The action of reserving or consuming a material for a specific Work Order or Asset.

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Menu Location:** `Sidebar > Work Execution > MRO Inventory`
* **Core Layout:** *Standard Data Grid* listing Materials, linked to their Inventory Levels by location.
* **Cross-Module Integration:** The `MaterialBooking` action is designed as a *Global Modal* that can be triggered from here, OR directly from the `01_Work_Orders_Defects.md` detailed view.

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields from the target Backend Schema ([`material.py`](../../../app-training-v2-be/app/schemas/material.py)) must be listed here.

**1. Material Catalog (`MaterialBase`):**
Defines what the item is.

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | PK. | `5012` |
| `site_id` | Integer | Hidden / Read-only | Inherited from Global Context. | `2` |
| `sku` | String | Output (Badge) / Input (Text) | Unique Material number. | `BRG-6204` |
| `name` | String | Output (Text) / Input (Text) | Short name. | `Deep Groove Ball Bearing` |
| `description` | String | Output (Text) / Input (Text Area) | Detailed specs. | `SKF Deep Groove Ball Bearing, sealed.` |

**2. Inventory Levels (`MaterialsInventoryBase`):**
Defines how many we have and where they are located.

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | PK. | `112` |
| `site_id` | Integer | Hidden / Read-only | Inherited from Global Context. | `2` |
| `material_id` | Integer | Hidden / Input (Auto) | Links to the Material. | `5012` |
| `location_id` | Integer | Output (Text) / Input (Hierarchy Tree Modal) | Bin/Shelf location mapped via Tree (`depth="location"`). | `14` |
| `qty_on_hand` | Integer | Output (Badge) / Input (Number) | Current physical count (Must be >= 0). | `24` |
| `updated_at` | Datetime | Output (Text) / Read-only | Last time the count was changed. | `2024-05-20` |

**3. MATERIAL BOOKING (`MaterialBookingBase`):**
Defines consumption of materials for a work order or asset.

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | PK. | `902` |
| `site_id` | Integer | Hidden / Read-only | Inherited from Global Context. | `2` |
| `material_id` | Integer | Hidden / Input (Auto) | Links to the item being moved. | `5012` |
| `quantity` | Integer | Output (Text) / Input (Number) | Must be > 0. | `2` |
| `work_order_id`| Integer | Output (Link) / Input (Dropdown) | Optional. The WO consuming this part. | `2041` |
| `asset_id` | Integer | Output (Link) / Input (Hierarchy Tree Modal) | Optional. The machine receiving it. | `88` |
| `booked_at` | Datetime | Output (Text) / Read-only | Audit log. | `2024-05-20` |

### 2.3. User Flow (Main & Alternate Scenarios)

**[Main Flow: Happy Path (Booking via Work Order - 'Create' Transaction)]**
1. Technician is in `01_Work_Orders_Defects.md` repairing a pump.
2. Clicks "Book Material" on the Work Order drawer.
3. The *Global Material Booking Modal* opens.
4. Searches for `sku` `BRG-6204`. The modal shows `qty_on_hand: 24` at `location_id: 14`.
5. Inputs `quantity: 2`. The `work_order_id` and `asset_id` are auto-filled by the context.
6. Clicks "Confirm Booking". The system creates a `MaterialBooking` record and automatically deducts 2 from the `MaterialsInventory` `qty_on_hand`.

**[Alternate Flow 1: Out of Stock]**
1. Technician searches for `GASKET-99`.
2. Modal shows `qty_on_hand: 1`.
3. Technician inputs `quantity: 2`.
4. The "Confirm Booking" button immediately disables.
5. The input box turns red, and an inline error appears: *"Insufficient stock. Only 1 available."*

**[Admin Flow: Master Data CRUD (Create/Update Material)]**
1. Warehouse Manager clicks "Add New Material" from the Data Grid.
2. A side-drawer opens with fields: `sku`, `name`, `description`.
3. Manager fills the form and clicks "Save". System creates a `MaterialBase` record.
4. To edit, manager clicks the "Edit" icon on the grid row, updating the text fields.

**[Admin Flow: Inventory Management (Add/Update Stock)]**
1. Manager receives a new shipment of `BRG-6204`.
2. Manager clicks "Add Stock" on the specific material row.
3. Selects `location_id` from a Tree Dropdown and inputs the `qty_on_hand` to add.
4. System updates the `MaterialsInventory` record for that location.

### 2.4. Interface Components
* **Data Grid:** Displays a joined view of `MaterialBase` and its `MaterialsInventory` locations. Expand a material to see stock at different locations.
* **Global Booking Modal:** A reusable React/Vue component. Must contain a fast SKU search bar (auto-complete).

### 2.5. UI States (The Fundamental States)
* **Empty State:** If the MRO database is empty, show a "Catalog Empty - Import Master Data" button.
* **Loading State:** Standard Data Grid loading for the main page. The Booking Modal should show an inline spinner while searching for an SKU.
* **Error State (Form Validation):** Prevent negative numbers or 0 in `quantity` input. Show inline red errors.
* **Error State (System/Network):** If the booking transaction fails, show a toast notification.
* **Partial / Edge State:** If `qty_on_hand` is exactly `0`, render the badge in Red.

### 2.6. Micro-interactions & Animations
* **Transitions:** The Global Booking Modal must fade in with a slight scale-up animation (a modern pop-up feel).
* **Hover & Click:** Clicking the "Confirm Booking" button transitions it into a loading spinner before displaying a checkmark.
* **Feedback:** When an SKU is selected in the search bar, its image (if available) and location (`Bin/Shelf`) should elegantly slide into view inside the modal.

---

## 3. Technical Frontend Execution
* The Global Booking Modal should be registered at the root level of the application state (e.g., via Context API or Redux) so it can be summoned from any route.
