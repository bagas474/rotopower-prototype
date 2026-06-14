# Worker Profiles (PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** Scheduling maintenance requires ensuring the right technicians with the exact right skills are assigned. 
  * *As an HR Admin*, I want a centralized hub to track every worker, their assigned roles, and their granular competence levels so I know exactly what my workforce is capable of.

### 1.1. Domain Glossary & Key Concepts
* **Worker:** A technician or employee assigned to the plant.
* **Competency:** A highly specific skill with a measurable level (e.g., "TIG Welding Level 3").
* **Work Role:** The specific operational duty assigned to a worker for a shift.

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Menu Location:** `Sidebar > Workforce Resources > Worker Profiles`
* **Core Layout:** *Master-Detail Split View*. Left pane: List of Workers. Right pane: Their active Roles and Competencies.

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields from the target Backend Schema ([`worker.py`](../../../app-training-v2-be/app/schemas/worker.py)) must be listed here.

**1. Worker Master Data (`WorkerBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | PK. | `15` |
| `site_id` | Integer | Hidden / Input (Dropdown) | Plant location. | `2` |
| `user_id` | Integer | Hidden / Input (Dropdown) | Links to System Auth User. | `104` |
| `display_name` | String | Output (Text) / Input (Text) | Displayed prominently. | `John Doe` |
| `employee_no` | String | Output (Text) / Input (Text) | HR ID. | `EMP-9001` |
| `stress_level` | Integer | Output (Gauge) / Read-only | Derived or inputted via IoT/HR. | `4` |
| `psychological_load`| Integer | Output (Gauge) / Read-only | Derived HR metric. | `3` |
| `availability_next_7d_pct`| Integer | Output (Badge) / Read-only | Capacity. | `85` |

**2. Worker Competence (`UserCompetenceBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `competence_id` | Integer | Output (Text) / Input (Dropdown) | Fetch from Master Competency Dictionary. | `12` |
| `level` | Integer | Output (Rating) / Input (Number) | 1-10 scale (backend constraint). | `8` |
| `source` | String | Output (Text) / Input (Dropdown) | Where this rating came from (e.g., Certification). | `Certification` |

**3. Work Role Assignment (`WorkerWorkRoleBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `work_role_id` | Integer | Output (Badge) / Input (Dropdown) | Fetch from Role Requirements. | `5` |
| `is_primary` | Boolean | Output (Star Icon) / Input (Toggle) | Indicates main job function. | `True` |

### 2.3. User Flow (Main & Alternate Scenarios)

**[Main Flow: Happy Path (Add Competency to Worker)]**
1. Supervisor navigates to the Worker Profiles page.
2. Supervisor selects `John Doe` from the left pane list.
3. The right pane populates with John's HR metrics, Roles, and Skills (`UserCompetence`).
4. Supervisor clicks "Add Competence", selects "High Voltage Operations" from the dropdown, sets level to `8`, and clicks Save.
5. The Radar Chart dynamically updates to reflect the new skill.

**[Alternate Flow 1: Add Duplicate Competency]**
1. Supervisor clicks "Add Competence" and selects "TIG Welding", which John already possesses.
2. UI instantly disables the Save button.
3. The dropdown highlights yellow with a tooltip: *"John Doe already holds this competency. Please edit the existing entry instead."*

**[Main Flow: Update & Delete User Competency]**
1. To update: Supervisor clicks the edit icon next to an existing competency in the list. Changes the level from 5 to 8 and clicks Save.
2. To delete: Supervisor clicks the trash icon next to a competency. A confirmation modal appears. Upon confirmation, the competency is removed from the worker's profile.

**[Main Flow: Assign & Unassign Work Role]**
1. To assign: Supervisor clicks "Assign Role", selects a role from the dropdown, toggles `is_primary`, and saves.
2. To unassign: Supervisor clicks the "Remove" button next to an assigned role. The role is removed from the worker's active list.

### 2.4. Interface Components
* **Worker List (Left Pane):** Searchable list with profile avatars and `availability_next_7d_pct` indicators.
* **Competency Radar Chart (Right Pane):** A spider/radar chart visualizing the `level` of various `competence_id` arrays to quickly assess a worker's strengths.
* **Add Competence Modal:** Contains a Dropdown that fetches options directly from the Master Skills Dictionary (`CompetenceBase`).

### 2.5. UI States (The 5 Fundamental States)
* **Empty State:** If the Left Pane has no workers, show an "Import Workforce Data" button. In the Right Pane, if a worker is selected but has 0 competencies, the Radar Chart should display a completely empty web with text "No skills recorded."
* **Loading State:** Left pane uses a Skeleton List; Right pane uses a Skeleton Box for the chart.
* **Error State (Form Validation):** In the Add Competence modal, if a level > 10 is entered manually, input box turns red: "Level must be 1-10."

### 2.6. Micro-interactions & Animations
* **Transitions:** The Radar Chart should animate its web growing outward from the center when it first renders.
* **Hover & Click:** Hovering over a data point on the Radar Chart shows a tooltip with the exact skill name and level.

---

## 3. Technical Frontend Execution
* Data fetching must cleanly aggregate the worker schema to render the unified profile view.
