# Work Orders & Defects (PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** Maintenance teams manage defects using paper forms or legacy systems, making it difficult to track what is currently broken, what is being repaired, and how long it takes.
* **Goal (Success Metrics):** Provide a digital, real-time Kanban board for all Work Orders to ensure defects are resolved quickly and safely.
* **Target Personas:** Maintenance Planner, Maintenance Supervisor.
* **User Stories:**
  * *As a Maintenance Planner*, I want to see a Kanban board of all work orders so that I can easily drag a ticket from "Draft" to "In Progress".

### 1.1. Domain Glossary & Key Concepts
* **Work Order (WO):** A formal document authorizing a maintenance crew to perform a specific repair on a specific piece of equipment.
* **Defect:** A problem or broken part. In Rotopower, an unaddressed Defect eventually becomes a Work Order.
* **Kanban Board:** A visual workflow management tool where work items are represented by cards moving across columns (e.g., Draft ➔ To-Do ➔ In Progress ➔ Resolved).

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Menu Location:** `Sidebar > Work Execution > Work Orders`
* **Core Layout:** *Kanban Board* (Default View) & *Data Grid* (List View). Users can toggle between the two.

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields from the target Backend Schema ([`work_order.py`](../../../app-training-v2-be/app/schemas/work_order.py)) must be listed here.

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | Database PK. | `2041` |
| `site_id` | Integer | Hidden / Read-only | Inherited from Global Context. | `2` |
| `asset_id` | Integer | Output (Text) / Input (Hierarchy Tree Modal) | The specific equipment to repair. Selected via Tree Modal. | `88` |
| `title` | String | Output (Text) / Input (Text) | Short description. | `Fix leaking seal on BFP-01` |
| `description` | String | Output (Text) / Input (Text Area) | Detailed problem description. | `Vibration high, bearing worn out.` |
| `status` | String | Output (Kanban Column) / Input (Drag & Drop) | `draft`, `todo`, `in_progress`, `resolved`. | `in_progress` |
| `priority` | Integer | Output (Badge) / Input (Dropdown) | 1 = High, 2 = Medium, 3 = Low. | `1` |
| `asset_fault_id` | Integer | Hidden / Input (Dropdown) | Links to a specific Failure Mode. | `15` |
| `planned_start` | Datetime | Output (Text) / Input (Datepicker) | When the work should begin. | `2024-05-21` |
| `planned_end` | Datetime | Output (Text) / Input (Datepicker) | When the work should finish. | `2024-05-22` |
| `started_at` | Datetime | Hidden / Read-only | Automatically set when moved to in_progress. | `2024-05-21` |
| `resolved_at` | Datetime | Hidden / Read-only | Automatically set when moved to resolved. | `2024-05-22` |
| `created_by` | Integer | Output (Text) / Read-only | User who created the WO. | `45` |
| `deleted_at` | Datetime | Hidden / Read-only | Soft delete timestamp. | `null` |

### 2.3. User Flow (Main & Alternate Scenarios)
*Do not just write the 'Happy Path'. You MUST document what happens when things go wrong or when a user cancels an action.*

**[Main Flow: Happy Path (Create Work Order)]**
1. User clicks "Create Work Order".
2. System opens the Creation Form Modal.
3. User clicks "Select Asset". A nested **Asset Hierarchy Tree Modal** (`depth="asset"`) appears.
4. User visually navigates Location ➔ Asset, selects the broken pump, and clicks Confirm.
5. The `asset_id` is populated in the form. User fills out the `title`, `description`, and sets `priority`.
6. User clicks Save.
7. System fires a `POST` request. The Kanban Board refreshes and the new WO appears in the "Backlog" column.s success, and the card settles in the new column.

**[Alternate Flow 1: Missing Mandatory Completion Data]**
1. User drags a card straight from "In Progress" to "Resolved".
2. The UI pauses the drag drop action and pops up a Modal: *"Please enter the total downtime minutes before resolving."*
3. The user clicks "Cancel" on the modal.
4. The card snaps back elastically to the "In Progress" column.

### 2.4. Interface Components
* **Kanban Board:**
  * **Columns:** Scrollable vertically if many tickets exist.
  * **Card Design:** Show `id`, `title`, `priority` badge, and `asset_id` name.
* **List View Toggle:** A button to switch from Kanban to the standard `Data_Grid_Standard` component for bulk exporting.

### 2.5. UI States (The 5 Fundamental States)
* **Empty State:** If the entire board is empty, show a large "Zero Defects! Plant is running perfectly." illustration. If a specific column is empty, show a dashed outline indicating a dropzone.
* **Loading State:** When first loading, render 3 *Skeleton Cards* in the Draft column, and 2 in the To-Do column.
* **Error State (Form Validation):** During inline creation, if the title is missing, outline the input field in red.
* **Error State (System/Network):** If the drag-and-drop `PUT` request fails, revert the card to its original column and show a red Toast: "Failed to update Work Order status."
* **Partial / Edge State:** If a title is excessively long, truncate it with `...` to prevent the card from stretching vertically and breaking the Kanban layout.

### 2.6. Micro-interactions & Animations
* **Transitions:** When dragging a card, it should tilt slightly (e.g., 3 degrees) and cast a larger drop shadow to indicate it has been "picked up" from the board.
* **Hover & Click:** Hovering over a column should subtly highlight its background color to indicate it is a valid drop target.
* **Feedback:** Snapping back an invalid drag must use a fast, elastic spring animation.

---

## 3. Technical Frontend Execution
* **Library:** Use a robust drag-and-drop library (e.g., `react-beautiful-dnd` or `dnd-kit`).

---

## 4. Technical Backend Execution (API Contract)
* **Core Pydantic Schemas:** `WorkOrderCreate`, `WorkOrderUpdate`
