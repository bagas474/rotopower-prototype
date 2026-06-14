# Craft & Competency (PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** Scheduling maintenance requires ensuring the right technicians with the exact right skills (e.g., Certified Welder Level 3) are assigned. Hardcoded spreadsheets lead to unqualified personnel doing dangerous work.
  * *As an HR Admin*, I want a centralized hub to track every worker, their assigned roles, and their granular competence levels.

### 1.1. Domain Glossary & Key Concepts
* **Craft:** A broad trade or profession (e.g., Mechanical Fitter, Electrician).
* **Competency:** A highly specific skill with a measurable level within a Craft (e.g., "TIG Welding Level 3").
* **Work Role:** The specific operational duty assigned to a worker for a shift (e.g., "Senior Boiler Fitter").

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Menu Location:** `Sidebar > Workforce Resources > Craft Competency`
* **Core Layout:** *Master-Detail Split View*. Left pane: List of Workers. Right pane: Their active Roles and Competencies.

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields from the target Backend Schemas ([`worker.py`](../../../app-training-v2-be/app/schemas/worker.py), [`work_role.py`](../../../app-training-v2-be/app/schemas/work_role.py), [`competence.py`](../../../app-training-v2-be/app/schemas/competence.py)) must be listed here.

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
| `competence_id` | Integer | Output (Text) / Input (Dropdown) | Specific skill (e.g., TIG Welding). | `12` |
| `level` | Integer | Output (Rating) / Input (Number) | 1-10 scale (backend constraint). | `8` |
| `source` | String | Output (Text) / Input (Dropdown) | Where this rating came from (e.g., Certification, Peer). | `Certification` |

**3. Work Role Assignment (`WorkerWorkRoleBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `work_role_id` | Integer | Output (Badge) / Input (Dropdown) | Role name (e.g., Senior Fitter). | `5` |
| `is_primary` | Boolean | Output (Star Icon) / Input (Toggle) | Indicates main job function. | `True` |

### 2.3. User Flow (Main & Alternate Scenarios)
*Do not just write the 'Happy Path'. You MUST document what happens when things go wrong or when a user cancels an action.*

**[Main Flow: Happy Path (Add Competency)]**
1. Supervisor navigates to the Craft Competency page.
2. Supervisor selects `John Doe` from the left pane list.
3. The right pane populates with John's HR metrics (`stress_level`), Roles, and Skills (`UserCompetence`).
4. Supervisor clicks "Add Competence", selects "High Voltage Operations", sets level to `8`, and clicks Save.
5. The Radar Chart dynamically updates to reflect the new skill.

**[Alternate Flow 1: Add Duplicate Competency]**
1. Supervisor clicks "Add Competence" and selects "TIG Welding", which John already possesses.
2. UI instantly disables the Save button.
3. The dropdown highlights yellow with a tooltip: *"John Doe already holds this competency. Please edit the existing entry instead."*

### 2.4. Interface Components
* **Worker List (Left):** Searchable list with profile avatars and `availability_next_7d_pct` indicators.
* **Competency Radar Chart:** A spider/radar chart in the right pane visualizing the `level` of various `competence_id` arrays to quickly assess a worker's strengths.

### 2.5. UI States (The 5 Fundamental States)
* **Empty State:** If the Left Pane has no workers, show an "Import Workforce Data" button. In the Right Pane, if a worker is selected but has 0 competencies, the Radar Chart should display a completely empty web with text "No skills recorded."
* **Loading State:** Left pane uses a Skeleton List; Right pane uses a Skeleton Box for the chart.
* **Error State (Form Validation):** In the Add Competence modal, if a level > 10 is entered manually, input box turns red: "Level must be 1-10."
* **Error State (System/Network):** If fetching the worker's details fails, show a "Failed to load profile" Toast.
* **Partial / Edge State:** If `user_id` is null (the worker is a contractor without system access), show a prominent warning badge next to their name: "System Login Not Provisioned".

### 2.6. Micro-interactions & Animations
* **Transitions:** The Radar Chart should animate its web growing outward from the center when it first renders.
* **Hover & Click:** Hovering over a data point on the Radar Chart shows a tooltip with the exact skill name and level.
* **Visual Feedback:** Sorting the worker list by "Availability" should trigger a smooth re-ordering animation.

---

## 3. Technical Frontend Execution
* Data fetching must cleanly aggregate the three schemas to render the unified profile view.
