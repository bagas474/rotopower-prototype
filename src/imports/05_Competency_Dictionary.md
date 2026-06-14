# Competency Dictionary (PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** To prevent duplicate data entries (e.g. "TIG Welding" vs "Welding TIG"), the system requires a Single Source of Truth for all skills.
  * *As an HR Admin*, I want a centralized Master Data dictionary to register and manage every official skill recognized by the plant.

### 1.1. Domain Glossary & Key Concepts
* **Competency:** A standardized skill recognized by the organization.
* **ESCO URI:** An optional link to the European Skills, Competences, Qualifications and Occupations framework for standardization.

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Menu Location:** `Sidebar > Workforce Resources > Competency Dictionary`
* **Core Layout:** *Standard Data Grid*. A full-width table displaying all master skills.

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields from the target Backend Schema ([`competence.py`](../../../app-training-v2-be/app/schemas/competence.py)) must be listed here.

**1. Master Skills Dictionary (`CompetenceBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | PK. | `12` |
| `label` | String | Output (Text) / Input (Text) | Name of the skill. Must be unique. | `TIG Welding` |
| `category` | String | Output (Badge) / Input (Dropdown) | Broad grouping. | `Mechanical` |
| `esco_uri` | String | Hidden / Input (Text) | Optional external standard link. | `http://...` |

### 2.3. User Flow (Main & Alternate Scenarios)

**[Main Flow: Happy Path (Add New Skill)]**
1. Admin navigates to the Competency Dictionary.
2. Clicks "Add Skill".
3. Fills in the `label` ("High Voltage Operations") and `category` ("Electrical").
4. Clicks Save. The skill is now available in the dropdowns across Worker Profiles and Role Requirements menus.

**[Main Flow: Read & Search]**
1. Admin uses the search bar above the grid to type "Welding".
2. The data grid filters in real-time to show only competencies containing "Welding".
3. Admin uses the category dropdown filter to show only "Mechanical" skills.

**[Main Flow: Update Skill]**
1. Admin clicks the edit icon on a row (e.g., changing "Tig Weld" to "TIG Welding").
2. Modifies the `label` and clicks Save.
3. *System Note:* This change automatically propagates because the Worker Profiles and Role Requirements rely on the `id`, not the string text.

**[Main Flow: Delete Skill]**
1. Admin clicks the trash icon on a row.
2. A confirmation modal appears.
3. Upon confirmation, the skill is deleted from the dictionary.
4. *Alternate Flow (Prevention):* If the skill is currently assigned to any worker or role, the system blocks deletion and displays an error: *"Cannot delete this competency because it is currently assigned to 5 workers and 2 roles."*

### 2.4. Interface Components
* **Data Grid:** A standard table listing all `CompetenceBase` entries with full inline CRUD capabilities (Edit/Delete).
* **Search & Filter:** A top bar to search by skill name or filter by category.

### 2.5. UI States (The 5 Fundamental States)
* **Empty State:** If no skills exist, show an "Add First Skill" button.
* **Error State (Form Validation):** If Admin tries to save a skill name that already exists, show an inline error: "Skill already exists in the dictionary."
