# Root Cause Analysis (Main Page)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** When critical equipment fails repeatedly, plants lose millions. Engineers need a structured way to document their investigations (Root Cause Failure Analysis) so the knowledge is retained.
* **Goal (Success Metrics):** Digitalize the FMEA (Failure Mode and Effects Analysis) and Fault Tree process.
* **Target Personas:** Reliability Engineer.

### 1.1. Domain Glossary & Key Concepts
* **RCFA (Root Cause Failure Analysis):** A detective investigation into *why* a machine broke down, rather than just fixing the broken part.
* **FMEA (Failure Mode and Effects Analysis):** A systematic method for evaluating processes to identify where and how they might fail.
* **Fault Tree:** A diagram that uses boolean logic (AND/OR gates) to trace a top-level failure down to its lowest root causes.

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Menu Location:** `Sidebar > Work Execution > Root Cause Analysis`
* **Core Layout:** *Standard Data Grid* listing all RCFA investigations.
* **Component & Sub-page Splitting Strategy:** The interactive drag-and-drop Fault Tree is highly complex and is documented in [`03_RCFA_Canvas/01_Interactive_Tree.md`](03_RCFA_Canvas/01_Interactive_Tree.md).

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields from the target Backend Schema ([`new_fault_tree.py`](../../../app-training-v2-be/app/schemas/new_fault_tree.py)) must be listed here.

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Output (Text) / Read-only | PK. | `10` |
| `asset_fault_id` | Integer | Output (Text) / Input (Dropdown) | Links this RCFA to a specific failure event. | `45` |
| `expression` | String | Output (Text) / Input (Interactive Canvas) | Boolean logic connecting sensors. | `(S1 AND S2) OR S3` |
| `priority` | Integer | Output (Badge) / Input (Number) | 1-5 scale. | `1` |
| `sensor_codes` | Array | Hidden / Input (Canvas) | Sensors involved in this fault tree. | `["VIB-01", "TEMP-02"]` |
| `dependent_asset_fault_ids`| Array | Hidden / Input (Canvas) | Linked cascading failures. | `[46, 47]` |

### 2.3. User Flow (Main & Alternate Scenarios)
*Do not just write the 'Happy Path'. You MUST document what happens when things go wrong or when a user cancels an action.*

**[Main Flow: Happy Path (Investigate Root Cause)]**
1. User navigates to the Root Cause Analysis page.
2. System displays a Data Grid of all `NewFaultTree` records.
3. User clicks "Investigate" on a specific row.
4. System routes the user to the `Interactive_Tree` sub-page to build the logical fault tree.

**[Alternate Flow 1: Insufficient Permissions]**
1. A standard Technician clicks "Investigate" on a row.
2. System routes to the sub-page but hides the Canvas editor palette.
3. A read-only overlay banner appears: *"You are viewing this RCFA in read-only mode."*

### 2.4. Interface Components
* **Data Grid:** Utilizes [`03_Data_Grid_Standard.md`](../00_Global_Components/03_Data_Grid_Standard.md). Columns: ID, Asset Fault, Priority, Expression, Actions.

### 2.5. UI States (The 5 Fundamental States)
* **Empty State:** Follows standard Data Grid empty state.
* **Loading State:** Follows standard Data Grid loading state.
* **Error State (Form Validation):** N/A.
* **Error State (System/Network):** Follows standard Data Grid error state.
* **Partial / Edge State:** If `expression` is empty, show a gray badge "Unmapped" instead of an empty column.

### 2.6. Micro-interactions & Animations
* **Hover & Click:** Clicking the "Investigate" action button opens a new tab or slides the user into the canvas view with a smooth page transition.

---

## 3. Technical Frontend Execution
* Ensure row clicks seamlessly transition to the Canvas route (`/dashboard/work-execution/rcfa/{id}/canvas`).
