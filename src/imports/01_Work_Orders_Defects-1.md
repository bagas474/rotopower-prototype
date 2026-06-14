# Work Orders & Defects (PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** Maintenance teams manage defects using paper forms or legacy systems, making it difficult to track what is currently broken, what is being repaired, and how long it takes.
* **Goal (Success Metrics):** Provide a digital, real-time Kanban board and detailed views for all Work Orders to ensure defects are resolved quickly, safely, and thoroughly documented.
* **Target Personas:** Maintenance Planner, Maintenance Supervisor, Maintenance Technician.
* **User Stories:**
  * *As a Maintenance Planner*, I want to review incoming drafts and approve them to be planned, so that resources are correctly allocated.
  * *As a Maintenance Supervisor*, I want to assign specific actions and tasks to my team members.
  * *As a Maintenance Technician*, I want to see a clear list of actions, tasks, and materials required for my assigned work order.

### 1.1. Domain Glossary & Key Concepts
* **Work Order (WO):** A formal document authorizing a maintenance crew to perform a specific repair on a specific piece of equipment. Contains overall status and planned dates.
* **Work Action:** A subset of a Work Order. Represents a chunk of work that can be assigned to specific users and scheduled for a particular shift. 
* **Work Task:** A granular step within a Work Action.
* **Defect:** A problem or broken part. In Rotopower, an unaddressed Defect starts as a Draft Work Order.
* **Kanban Board:** A visual workflow management tool where work items are represented by cards moving across columns representing their statuses.

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Menu Location:** `Sidebar > Work Execution > Work Orders`
* **Core Layout:** *Kanban Board* (Default View) & *Data Grid* (List View). Users can toggle between the two. Clicking a Work Order opens a *Detailed Work Order Page* showing Actions, Tasks, Materials, and Assignments.
* **Cross-Module Integration (RCA):** If a Work Order is linked to an `asset_fault_id`, the *Detailed Work Order Page* MUST provide a prominent shortcut button (e.g., "View RCA Investigation") that routes the user directly to the `Root Cause Analysis` canvas for that fault.

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields from the target Backend Schema ([`work_order.py`](../../../app-training-v2-be/app/schemas/work_order.py)) must be listed here.

#### 2.2.1 Work Order Level
| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | Database PK. | `2041` |
| `site_id` | Integer | Hidden / Read-only | Inherited from Global Context. | `2` |
| `asset_id` | Integer | Output (Text) / Input (Hierarchy Tree Modal) | The specific equipment to repair. | `88` |
| `title` | String | Output (Text) / Input (Text) | Short description. | `Fix leaking seal on BFP-01` |
| `description` | String | Output (Text) / Input (Text Area) | Detailed problem description. | `Vibration high, bearing worn out.` |
| `status` | String | Output (Kanban Column) / Input (Drag & Drop) | `draft`, `pending_planner`, `planned`, `in_progress`, `completed`, `cancelled`. | `in_progress` |
| `priority` | Integer | Output (Badge) / Input (Dropdown) | e.g., 1 = High, 2 = Medium, 3 = Low. | `1` |
| `asset_fault_id` | Integer | Hidden / Input (Dropdown) | Links to a specific Failure Mode. | `15` |
| `planned_start` | Datetime | Output (Text) / Input (Datepicker) | When the work should begin. | `2024-05-21` |
| `planned_end` | Datetime | Output (Text) / Input (Datepicker) | When the work should finish. | `2024-05-22` |
| `started_at` | Datetime | Hidden / Read-only | Automatically set when moved to in_progress. | `2024-05-21` |
| `resolved_at` | Datetime | Hidden / Read-only | Automatically set when moved to completed. | `2024-05-22` |
| `created_by` | Integer | Output (Text) / Read-only | User who created the WO. | `45` |

#### 2.2.2 Work Action Level
| Field Name / Backend Key | Backend Data Type | Frontend I/O Type | Constraints & UI Rules |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | Database PK. |
| `work_order_id` | Integer | Hidden / Read-only | Links to parent WO. |
| `status` | String | Output (Badge) / Input (Select) | e.g., `proposed`, `active`, `done`. |
| `address_summary` | String | Output (Text) / Input (Text) | Brief location or scope. |
| `description` | String | Output (Text) / Input (Text Area) | Details of the action. |
| `planned_shift_id` | Integer | Output (Text) / Input (Dropdown) | Links to shift schedule. |

#### 2.2.3 Work Task Level
| Field Name / Backend Key | Backend Data Type | Frontend I/O Type | Constraints & UI Rules |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | Database PK. |
| `work_action_id` | Integer | Hidden / Read-only | Links to parent Action. |
| `status` | String | Checkbox / Output | `todo`, `done`. |
| `sequence` | Integer | Hidden / Drag Handle | Order of execution. |
| `label` | String | Output (Text) / Input (Text) | Task title. |
| `description` | String | Output (Text) / Input (Text Area) | Step-by-step instructions. |

*(Also includes `TaskCompetence`, `WorkActionAssignment`, and `WorkActionMaterial` for resources and assignments.)*

### 2.3. User Flow & Detailed CRUD Mechanics

**[Main Flow: Work Order Lifecycle (Create, Read, Update)]**
1. **Create WO:** User clicks "Create Work Order" on the Kanban board. A modal appears requesting `asset_id` (via Tree Picker), `title`, `description`, and `priority`.
2. **Submission:** Upon Save, system triggers `POST /work-orders`. WO appears in the `draft` column.
3. **Read/Detail View:** Clicking a WO card opens the *Detailed WO Drawer/Page* from the right side of the screen.
4. **Update Status (Approval):** Supervisor opens the Drawer, reviews the info, and changes the status dropdown to `pending_planner`. Planner later changes it to `planned`.
5. **Execution & Completion:** When work begins, card is dragged to `in_progress`. When finished, dragged to `completed`.

**[Sub-Flow: Work Actions & Tasks (CRUD within a WO)]**
1. **Create Action:** Inside the WO Drawer (Actions Tab), Planner clicks "Add Work Action". A new card/section appears with an inline form for `address_summary` and `planned_shift_id`.
2. **Create Task:** Underneath an Action, Planner clicks "+ Add Task". A minimalist inline input appears for `label`. `sequence` is handled automatically via drag-and-drop order.
3. **Update/Delete:** Hovering over an Action or Task reveals an "Edit" (pencil) and "Delete" (trash) icon. Deleting prompts a confirmation pop-over.
4. **Execute Task (Update):** Technicians tick a checkbox next to a `WorkTask`. System triggers a `PUT` request changing task status to `done`.

**[Sub-Flow: Assignments & Materials (Create / Update)]**
1. **Assign Personnel (Create):** In the Assignments Tab, Supervisor clicks "Assign Technician". A searchable dropdown list of `Users` appears. Selecting one triggers `POST` to `WorkActionAssignment`.
2. **Request Material (Create):** In the Materials Tab, Planner clicks "Add Material". Opens the Global Booking Modal (see MRO Inventory PRD).
3. **Consume Material (Update):** Technician sees the material list on their tablet. They input the physical amount used into the `qty_issued` field and click a "Consume" checkmark.

**[Alternate Flow: Cancelled Work (Delete / Archive)]**
1. User changes WO status to `cancelled`.
2. System intercepts and shows a Modal: *"Reason for Cancellation?"*
3. The reason is appended to the `description`, and the WO is moved to a hidden/archived state (soft delete/status update).

### 2.4. Interface Components
* **Kanban Board:**
  * **Columns:** Draft, Pending Planner, Planned, In Progress, Completed (Cancelled hidden or at end).
  * **Card Design:** Show `id`, `title`, `priority` badge, `asset_id` name, and a small avatar stack for `WorkActionAssignments`.
* **List View Toggle:** Data Grid for bulk exporting and filtering.
* **Detailed WO Drawer/Page:** Tabbed interface for: Info, Actions & Tasks, Materials, Assignments.

### 2.5. UI States (The Fundamental States)
* **Empty State:** If the entire board is empty, show a large "Zero Defects! Plant is running perfectly." illustration.
* **Loading State:** Render *Skeleton Cards* during data fetch.
* **Error State (Form Validation):** Red outlines for missing mandatory fields like `title` or `asset_id`.
* **State Constraints:** 
  * Only `draft` and `pending_planner` can be heavily edited. 
  * `completed` and `cancelled` are generally read-only.

### 2.6. Micro-interactions & Animations
* **Transitions:** Dragging a card tilts it slightly with a larger drop shadow.
* **Hover & Click:** Valid drop targets subtly highlight their backgrounds.
* **Feedback:** Snapping back an invalid drag must use a fast, elastic spring animation.

---

## 3. Technical Frontend Execution
* **Library:** Use a robust drag-and-drop library (e.g., `react-beautiful-dnd` or `@dnd-kit/core`).
* **State Management:** Optimistic UI updates when changing columns, with rollback on API failure.

---

## 4. Technical Backend Execution (API Contract)
* **Core Pydantic Schemas:** `WorkOrderCreate`, `WorkOrderUpdate`, `WorkActionCreate`, `WorkTaskCreate`, `WorkActionAssignmentCreate`, `WorkActionMaterialCreate`
