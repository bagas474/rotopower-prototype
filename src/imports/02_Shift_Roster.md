# Shift Roster (PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** Planning 24/7 operations requires balancing worker fatigue with the necessity of having specific competencies on-site at all times.
  * *As a Shift Manager*, I want to digitize shift schedules so that every shift automatically validates if the minimum competency requirements are met.

### 1.1. Domain Glossary & Key Concepts
* **Shift Roster:** The official schedule detailing exactly who is working on what date and time.
* **Shift Requirement (`ShiftCompetence`):** A strict rule for a shift. For example: "The Night Shift MUST have at least 1 person with Confined Space Rescue certification."
* **Fatigue Management:** A critical safety concept ensuring workers have adequate rest between shifts to prevent accidents.

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Menu Location:** `Sidebar > Workforce Resources > Shift Roster`
* **Core Layout:** *Data Grid (MVP)*. For Version 1, the primary interface is a Data Grid listing dates and shifts. *(Note: The architecture must support adding an Interactive Calendar view in V2 as a toggleable tab).*

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields from the target Backend Schemas ([`shift.py`](../../../app-training-v2-be/app/schemas/shift.py) and `WorkerShift` from [`worker.py`](../../../app-training-v2-be/app/schemas/worker.py)) must be listed here.

**1. Shift Master (`ShiftBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | PK. | `100` |
| `shift_date` | Date | Output (Text) / Input (Datepicker) | The date of the shift. | `2024-05-21` |
| `shift_time` | Enum (`ShiftTime`) | Output (Badge) / Input (Dropdown) | `MORNING`, `EVENING`, `NIGHT`. | `MORNING` |

**2. Shift Requirements (**`[BACKEND MISSING SCHEMA]`**):**
> **Product Note:** The backend currently does not have a schema to define required competencies per shift (e.g. `ShiftCompetenceBase`). The frontend must mock this until the backend implements it, as it is critical for Auto-Validation.

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `competence_id` | Integer | Output (Text) / Input (Dropdown) | e.g., Confined Space Entry. | `15` |
| `min_level` | Integer | Output (Text) / Input (Number) | Required skill level. | `3` |
| `weight` | Float | Hidden / Input (Number) | Used for auto-scheduling logic. | `1.5` |

**3. Worker Assignment (`UserShiftBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `site_id` | Integer | Hidden / Input (Auto) | Site context for this assignment. | `2` |
| `user_id` | Integer | Output (Badge) / Input (Multi-Select) | Which worker is on this shift. | `45` |

### 2.3. User Flow (Main & Alternate Scenarios)
*Do not just write the 'Happy Path'. You MUST document what happens when things go wrong or when a user cancels an action.*

**[Main Flow: Happy Path (Schedule Valid Shift)]**
1. Planner opens Shift Roster.
2. System displays a table grouped by `shift_date`.
3. Planner clicks "Add Shift" for tomorrow's `NIGHT` shift.
4. Planner defines the Shift Requirements (Must have 1 person with High Voltage Lv 8).
5. Planner opens the `UserShiftBase` multi-select and assigns John Doe (who has High Voltage Lv 8).
6. The UI Validation Banner turns Green ("All Competencies Met").
7. Planner clicks Save.

**[Alternate Flow 1: Rest Period Violation (Fatigue)]**
1. Planner assigns Jane Doe to the `NIGHT` shift.
2. The UI detects Jane was already scheduled for the `MORNING` shift the very next day.
3. The UI immediately highlights Jane's name in red.
4. A toast warning appears: *"Rest Period Violation: Jane Doe cannot work NIGHT followed immediately by MORNING. Minimum 12 hours rest required."*
5. The Save button is disabled until the conflict is resolved.

### 2.4. Interface Components
* **Data Grid:** Lists shifts. Columns: Date, Shift Time, Assigned Workers, Competence Met (Green/Yellow Indicator).
* **Validation Banner:** A dynamic UI component that watches the `worker_id` array and cross-references it with their `competence.py` profiles to calculate shift safety.

### 2.5. UI States (The 5 Fundamental States)
* **Empty State:** If a selected week has no shifts, show an empty calendar grid with a large "Generate Standard Roster" primary action.
* **Loading State:** Standard Data Grid skeleton loading.
* **Error State (Form Validation):** In addition to fatigue violations, if a selected worker does not meet the defined `ShiftCompetence`, the Validation Banner turns Yellow: *"Missing Requirement: High Voltage Level 3."*
* **Error State (System/Network):** If the save fails, display inline error on the form modal.
* **Partial / Edge State:** If a shift is missing workers (0 assigned), the row in the Data Grid should have a flashing orange indicator to warn the Shift Manager of an empty schedule.

### 2.6. Micro-interactions & Animations
* **Transitions:** The Validation Banner should smoothly slide down and expand when a requirement is met or broken, rather than abruptly popping into existence.
* **Hover & Click:** Hovering over a worker's name in the Data Grid should display a tooltip mini-profile summarizing their Top 3 skills.
* **Visual Alerting:** Safety violations (like Fatigue) must use strong visual cues (e.g., shaking animation on the specific input field).

---

## 3. Technical Frontend Execution
* The future Calendar View should be designed to share the exact same React/Vue state as the Data Grid, ensuring seamless toggling.
