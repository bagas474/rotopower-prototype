# Users, Roles, & RBAC (PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** An enterprise app requires strict data compartmentalization. A technician at Site A should not be able to edit Work Orders at Site B, nor should they be able to delete Asset Hierarchy nodes.
  * *As a System Administrator*, I want a robust Role-Based Access Control (RBAC) interface that maps users to granular CRUD permissions across specific modules.

### 1.1. Domain Glossary & Key Concepts
* **RBAC (Role-Based Access Control):** A system where you don't assign permissions to *people* directly. You create a *Role* (e.g., "Mechanic"), give the role permissions, and then assign people to that Role.
* **Provisioning:** The act of setting up a new employee's account so they can log in.
* **Soft-Ban (`is_active: false`):** Instead of deleting a user (which breaks the audit log), you flip a switch that instantly prevents them from logging in.

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Menu Location:** `Sidebar > System Administration > Users & Roles`
* **Core Layout:** *Tabbed Interface*. 
  * Tab 1: Users Directory (Data Grid & Registration Form).
  * Tab 2: Role Management (Matrix Grid).

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields from the target Backend Schemas ([`user.py`](../../../app-training-v2-be/app/schemas/user.py), [`role.py`](../../../app-training-v2-be/app/schemas/rbac/role.py), [`permission.py`](../../../app-training-v2-be/app/schemas/rbac/permission.py)) must be listed here.

**1. User Master Data (`UserBase` / `UserCreate`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | Hidden / Read-only | PK. | `45` |
| `username` | String | Output (Text) / Input (Text) | Unique identifier for login. | `jdoe_ops` |
| `email` | EmailStr | Output (Text) / Input (Email) | Optional. | `jdoe@rotopower.com` |
| `first_name`, `last_name`| String | Output (Text) / Input (Text) | Concat to `full_name`. | `John`, `Doe` |
| `is_active` | Boolean | Output (Toggle) / Input (Toggle) | Soft-ban access. | `True` |
| `roles` | Array[Int] | Output (Badge) / Input (Multi-select) | Linked `role_id`s. | `[2, 4]` |
| `sites` | Array[Int] | Output (Badge) / Input (Multi-select) | Multi-tenant plant access. | `[1]` |
| `all_sites` | Boolean | Hidden / Input (Checkbox) | Super-admin flag to bypass site check. | `False` |
| `password` | String | Hidden / Input (Password) | Required on Create. Hidden on Read. | `********` |

**2. Role & Permissions Matrix (`PermissionBase`):**

| Field Name / Backend Key | Backend Data Type | Frontend I/O Type (Read / Write) | Constraints & UI Rules | Dummy Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `role_id` | Integer | Hidden / Input (Auto) | Bound to the selected Role (e.g. "Technician"). | `4` |
| `module_id` | Integer | Output (Row Name) / Read-only | e.g. "Work Orders". | `10` |
| `create` | Boolean | Output (Checkbox) / Input (Checkbox) | Can POST? | `True` |
| `read` | Boolean | Output (Checkbox) / Input (Checkbox) | Can GET detail? | `True` |
| `update` | Boolean | Output (Checkbox) / Input (Checkbox) | Can PUT/PATCH? | `False` |
| `delete` | Boolean | Output (Checkbox) / Input (Checkbox) | Can DELETE? | `False` |
| `sidebar` | Boolean | Output (Checkbox) / Input (Checkbox) | Menu visibility. | `True` |

### 2.3. User Flow (Main & Alternate Scenarios)
*Do not just write the 'Happy Path'. You MUST document what happens when things go wrong or when a user cancels an action.*

**[Main Flow: Happy Path (Provision User)]**
1. Admin switches to the "Users" tab and clicks "Add User".
2. Admin fills in the basic info (`username`, `password`).
3. Admin assigns the user to a specific `site_id` (Crucial for data isolation).
4. Admin assigns the newly created "Junior Fitter" role.
5. Admin clicks Save. A new user is provisioned.

**[Alternate Flow 1: Self-Lockout Attempt]**
1. An Admin is editing their *own* active Role.
2. They accidentally uncheck the "System Administration" read/write permissions.
3. They click Save.
4. The UI blocks the request client-side, outlining the matrix in red.
5. A modal pops up: *"Self-Lockout Prevented: You cannot remove administration privileges from your own active session."*

### 2.4. Interface Components
* **Permission Matrix Grid:** A highly dense table. Use toggles/checkboxes. Add a "Select All Row" and "Select All Column" shortcut for power users.

### 2.5. UI States (The 5 Fundamental States)
* **Empty State:** If a new site has no users, display an "Add First User" empty state graphic.
* **Loading State:** The Permission Matrix should load its rows with skeleton bars.
* **Error State (Form Validation):** Ensure password strength meters are used on User Creation. Fail validation if weak.
* **Error State (System/Network):** General Toast error.
* **Partial / Edge State:** If a user is deactivated (`is_active: false`), render their row in the Data Grid with a pale gray background and strike-through text.

### 2.6. Micro-interactions & Animations
* **Interactions:** The Permission Matrix should support "Shift-Click" to check multiple boxes in a row or column instantly.
* **Transitions:** Switching between the "Users" and "Roles" tab should employ a smooth crossfade.
* **Visual Alerting:** Changing critical access roles should require a "Type CONFIRM to save" modal.

---

## 3. Technical Frontend Execution
* The frontend must cache the `roles` and `permissions` of the logged-in user upon authentication to instantly conditionally render buttons (e.g., hiding the "Delete" button if `update: false`).
