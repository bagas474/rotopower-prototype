# Global Top Navigation (PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** The application manages data across multiple geographical regions and plant sites. If users have to select their Region and Site every time they open a new page (or if it's buried in a side-tree), navigation becomes tedious. 
* **Goal (Success Metrics):** Provide a globally persistent "Context Selector" in the top navigation bar that acts as a master filter for the entire application state.
* **Target Personas:** All Roles.

### 1.1. Domain Glossary & Key Concepts
* **Global Context:** The currently active `region_id` and `site_id` in the Redux/Zustand store. Any API call made by any page (e.g., fetching Work Orders) will automatically append `?site_id=X` based on this context.
* **RBAC Enforcement:** Users can only see Regions and Sites in this dropdown that their Role permits them to see.
* **Zero State (Day 0):** The condition where the database is completely empty. The Top Nav must handle the creation of the very first Region and Site without requiring the user to navigate through a broken app.

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Type:** Reusable UI Component (Persistent layout wrapper).
* **Location:** Fixed at the very top of the screen (Top Navbar), remaining visible across all routes.

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields from the target Backend Schemas ([`region.py`](../../../app-training-v2-be/app/schemas/region.py), [`site.py`](../../../app-training-v2-be/app/schemas/site.py)) must be listed here.

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| **REGION SCHEMA** | | | | |
| `id` | Integer | Hidden / Read-only | PK. | `5` |
| `name` | String | Output (Text) / Input (Dropdown) | First selector level. | `Sumatra Fleet` |
| `description` | String | Hidden / Input (Text Area) | Optional context. | `Sumatra island operations` |
| **SITE SCHEMA** | | | | |
| `id` | Integer | Hidden / Read-only | PK. | `12` |
| `code` | String | Output (Text) / Input (Dropdown) | Max 5 chars. | `PLTU1` |
| `name` | String | Output (Text) / Input (Dropdown) | Displayed as `[{code}] {name}`. | `[PLTU1] Suralaya` |
| `region_id` | Integer | Hidden / Read-only | Used to link the Site to Region. | `5` |
| `description` | String | Hidden / Input (Text Area) | Optional context. | `Main coal power plant` |

### 2.3. User Flow (Main & Alternate Scenarios)
*Do not just write the 'Happy Path'. You MUST document what happens when things go wrong or when a user cancels an action.*

**[Main Flow: Changing Context]**
1. User logs in. The backend returns their `default_site_id`.
2. The Top Nav auto-selects this Region and Site (e.g., `Sumatra Fleet` -> `[PLTU1] Suralaya`).
3. User clicks the Site Dropdown and selects `[PLTU2] Tarahan`.
4. The global state updates. The current page (and all its children, like the Sidebar Tree or Data Grid) instantly trigger a re-fetch using the new `site_id=15`.

**[Alternate Flow 1: Single-Site Persona]**
1. A Technician logs in. Their RBAC profile restricts them strictly to `[PLTU1]`.
2. The UI detects that the `Region` list has `length === 1` and `Site` list has `length === 1`.
3. The dropdowns are rendered as plain text labels (non-clickable) to reduce visual clutter and prevent confusion.

**[Alternate Flow 2: Zero State (Day 0) Inline CRUD]**
1. A Super Admin logs into a completely empty database.
2. The Region dropdown is bordered in warning red and reads *"No Region Selected"*.
3. Admin clicks the dropdown. The only item inside is a sticky button: **"+ Create First Region"**.
4. A small inline modal pops up. Admin types the Region Name and saves.
5. The Region dropdown populates and auto-selects.
6. The Site dropdown now prompts: **"+ Create First Site"**. Admin clicks, fills the `code` and `name`, and saves.
7. The Global Context is established, and the rest of the application unlocks.

**[Alternate Flow 3: Editing / Deleting a Region or Site]**
1. Admin opens the Region or Site dropdown.
2. Admin hovers their mouse over an existing item (e.g., `[PLTU1] Suralaya`).
3. A small Pencil (Edit) and Trash (Delete) icon appear on the far right of that specific list item row.
4. If Admin clicks Edit: The *Inline Form Modal* appears pre-filled. Modifying and saving will instantly update the dropdown label.
5. If Admin clicks Delete: A destructive confirmation modal warns the Admin: *"Warning: Deleting a Site will orphan all Assets and Locations inside it. Type the Site code to confirm."* 
6. Upon confirmation, the backend deletes the site, and the UI re-establishes the Global Context to a different available site.

### 2.4. Interface Components
* **Context Selectors (Dropdowns):** Two styled select-dropdowns. 
  * *Create:* For users with Admin permissions, the very bottom of the dropdown list MUST contain a sticky (fixed position) **"+ Add New Region/Site"** button.
  * *Update/Delete:* Hovering over any item in the dropdown list MUST reveal inline Edit/Delete icon buttons (Admin only).
* **Inline Form Modal:** A compact popup that appears when the "+ Add New" button is clicked, containing the fields defined in the Data Dictionary.
* **User Profile Avatar:** Located on the far right.
* **Notification Bell:** Located next to the Profile Avatar, displaying a red badge if there are unread system alerts.

### 2.5. UI States (The 5 Fundamental States)
* **Empty State (Zero State):** Handled via the *Inline CRUD* flow. If empty, the dropdown acts as a direct call-to-action to create the first entry.
* **Loading State:** While fetching the allowed Region/Sites during initial app load, render skeleton boxes in place of the dropdowns.
* **Error State (Form Validation):** N/A.
* **Error State (System/Network):** If fetching the allowed sites fails, display a persistent red banner below the Top Nav: "Failed to establish global context. Retrying..."
* **Partial / Edge State:** If a user belongs to multiple Regions, but one Region currently has 0 Sites assigned to it, the Site dropdown should read "No Sites available in this Region" and disable itself.

### 2.6. Micro-interactions & Animations
* **Transitions:** When the Site is changed, a subtle top-border loading bar (like YouTube) should shoot across the screen to indicate that the application is fetching new data for the new context.
* **Feedback:** Changing the Context must feel immediate. Do not block the dropdown with a spinner; instead, let the page content below handle the loading state.

---

## 3. Technical Frontend Execution
* The selected `site_id` must be persisted in `localStorage` so that if the user refreshes the browser, they don't lose their context.
