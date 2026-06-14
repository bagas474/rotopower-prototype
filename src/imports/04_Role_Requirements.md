# Role Requirements (PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** We need to define exactly what skills are required for a worker to hold a specific operational duty (Work Role) so the system can validate shift assignments automatically.
  * *As an HR Admin*, I want a dedicated menu to map out Work Roles and their prerequisite skills.

### 1.1. Domain Glossary & Key Concepts
* **Work Role:** The specific operational duty assigned to a worker for a shift (e.g., "Senior Boiler Fitter").
* **Role Competency:** A prerequisite skill required for the role, mapped from the Master Skills Dictionary.

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Menu Location:** `Sidebar > Workforce Resources > Role Requirements`
* **Core Layout:** *Master-Detail Split View*. Left pane: List of Work Roles. Right pane: Required Competencies for the selected role.

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields from the target Backend Schemas ([`work_role.py`](../../../app-training-v2-be/app/schemas/work_role.py) and `roles.py`) must be listed here.

**1. Work Role Master (`WorkRoleBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | PK. | `5` |
| `name` | String | Output (Text) / Input (Text) | Name of the role. | `Senior Boiler Fitter` |
| `description` | String | Output (Text) / Input (Textarea) | Short description. | `Handles high pressure boilers.` |

**2. Role Competence Requirements (`RoleCompetenceBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `role_id` | Integer | Hidden / Input (Auto) | Bound to the specific Work Role. | `5` |
| `competence_id` | Integer | Output (Text) / Input (Dropdown) | Fetch from Master Competency Dictionary. | `12` |
| `min_level` | Integer | Output (Text) / Input (Number) | Minimum required level (1-10). | `7` |

### 2.3. User Flow (Main & Alternate Scenarios)

**[Main Flow: Happy Path (Define Role Requirement)]**
1. Admin navigates to Role Requirements.
2. Selects `Senior Boiler Fitter` from the left list.
3. Clicks "Add Requirement" on the right pane.
4. Selects "High Pressure Welding" from the dropdown, sets minimum level to `7`, and saves.
**[Main Flow: Create & Delete Work Role]**
1. To create: Admin clicks "Add New Role" above the left pane. Fills in the `name` and `description` in a modal and saves. The new role appears in the list.
2. To delete: Admin clicks the trash icon next to a role in the left pane. 
3. *Alternate Flow (Prevention):* If the role is currently assigned to any workers (in `WorkerWorkRoleBase`), the system prevents deletion and shows a warning: *"Cannot delete this role because it is currently assigned to 3 workers."*

**[Main Flow: Update & Delete Role Requirement]**
1. To update: Admin clicks the edit icon next to a requirement in the right pane. Modifies the `min_level` and saves.
2. To delete: Admin clicks the trash icon next to a requirement. A confirmation modal appears. Upon confirmation, the prerequisite is removed from the role.

### 2.4. Interface Components
* **Role List (Left Pane):** Simple searchable list of Roles.
* **Requirement List (Right Pane):** A simple grid/table of required `competence_id` entries and their `min_level` needed for the selected role.
* **Add Requirement Modal:** Contains a Dropdown that fetches options directly from the Master Skills Dictionary (`CompetenceBase`).

### 2.5. UI States (The 5 Fundamental States)
* **Empty State:** If a role has no requirements, show an empty state graphic: "No prerequisites defined."
* **Loading State:** Skeleton lists.
