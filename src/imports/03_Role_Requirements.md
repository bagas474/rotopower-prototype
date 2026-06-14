# Role Requirements (PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1 (Phase 1 MVP)

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** We need to define exactly what skills are required for a worker to hold a specific operational duty (Work Role) so the system can validate shift assignments automatically.
  * *As an HR Admin*, I want a dedicated menu to map out Work Roles and their prerequisite skills.

### 1.1. Phased Rollout Strategy
* **Phase 1 (MVP - Current Scope):** Focus exclusively on establishing baseline requirements for a single universal role called **"Worker"**. The UI is simplified to a single-panel grid.
* **Phase 2 (Future Enhancements):** Introduce multi-role management (e.g., "Senior Boiler Fitter", "Junior Electrician") utilizing a Master-Detail Split View. 

### 1.2. Domain Glossary & Key Concepts
* **Work Role:** The specific operational duty assigned to a worker for a shift. In Phase 1, this is globally defined as "Worker".
* **Role Competency:** A prerequisite skill required for the role, mapped from the Master Skills Dictionary.

---

## 2. PHASE 1: UI/UX Requirements (MVP)

### 2.1. Architecture & Navigation
* **Menu Location:** `Sidebar > Workforce Resources > Role Requirements`
* **Core Layout:** *Single Panel Data Grid*. A full-width table displaying the required competencies specifically for the "Worker" role. No side-navigation or left pane needed.

### 2.2. Data Dictionary & CRUD Mapping (Phase 1)
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*

**Role Competence Requirements (`RoleCompetenceBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `role_id` | Integer | Hidden / Hardcoded | Backend must default to/auto-fetch the ID for the "Worker" role. | `1` |
| `competence_id` | Integer | Output (Text) / Input (Dropdown) | Fetch from Master Competency Dictionary. | `12` |
| `min_level` | Integer | Output (Text) / Input (Number) | Minimum required level (1-10). | `7` |

### 2.3. User Flow (Main & Alternate Scenarios - Phase 1)

**[Main Flow: Add Requirement for "Worker"]**
1. Admin navigates to Role Requirements. The page immediately displays the data grid for the "Worker" role.
2. Clicks "Add Requirement".
3. Selects "Basic Welding" from the dropdown, sets minimum level to `5`, and saves.
4. The requirement is added to the grid.

**[Main Flow: Update & Delete Requirement]**
1. To update: Admin clicks the edit icon next to a requirement in the grid. Modifies the `min_level` and saves.
2. To delete: Admin clicks the trash icon next to a requirement. A confirmation modal appears. Upon confirmation, the prerequisite is removed from the "Worker" role.

### 2.4. Interface Components
* **Requirement Data Grid:** A standard, full-width table of required `competence_id` entries and their `min_level` needed for the universal "Worker" role.
* **Add Requirement Modal:** Contains a Dropdown that fetches options directly from the Master Skills Dictionary (`CompetenceBase`).

### 2.5. UI States (The 5 Fundamental States)
* **Empty State:** If the Worker role has no requirements, show an empty state graphic: "No prerequisites defined for Worker."
* **Loading State:** Standard table skeleton.
* **Error State (Form Validation):** Prevents submitting a `min_level` less than 1 or greater than 10.

---

## 3. PHASE 2: Future Enhancements (Multi-Role Architecture)
*(This section is for future planning and should not be built in Sprint 1).*

### 3.1. Upgraded Architecture
* **Core Layout:** *Master-Detail Split View*. 
  * **Left pane:** List of Work Roles (e.g., Fitter, Electrician, Operator). 
  * **Right pane:** Required Competencies for the currently selected role.

### 3.2. Extended Data Dictionary
**Work Role Master (`WorkRoleBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | PK. | `5` |
| `name` | String | Output (Text) / Input (Text) | Name of the role. | `Senior Boiler Fitter` |
| `description` | String | Output (Text) / Input (Textarea) | Short description. | `Handles high pressure boilers.` |

### 3.3. Extended User Flows
**[Main Flow: Create & Delete Work Role]**
1. To create: Admin clicks "Add New Role" above the left pane. Fills in the `name` and `description` in a modal and saves. The new role appears in the list.
2. To delete: Admin clicks the trash icon next to a role in the left pane. 
3. *Alternate Flow (Prevention):* If the role is currently assigned to any workers (in `WorkerWorkRoleBase`), the system prevents deletion and shows a warning: *"Cannot delete this role because it is currently assigned to 3 workers."*
