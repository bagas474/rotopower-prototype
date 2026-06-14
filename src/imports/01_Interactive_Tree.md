# Interactive Fault Tree Canvas (Sub-PRD)

**Status:** Draft
**Author:** AI Assistant
**Target Release:** Sprint 1

---

## 1. Context & Objectives (Overview)
* **Problem Statement:** Engineers need to build logical models of *how* a machine fails (e.g., If Vibration > X AND Temp > Y ➔ Bearing Failure). Writing boolean strings like `(S1 & S2) | S3` manually is error-prone.
  * *As an Engineer*, I want a visual drag-and-drop canvas where engineers can connect logic gates (AND/OR) to physical sensors to map failure modes.

### 1.1. Domain Glossary & Key Concepts
* **Logic Gate:** A decision block. An `AND` gate means *all* inputs must be true. An `OR` gate means *any* input can be true.
* **Boolean Expression:** A text string like `(S1 & S2) | S3`. The frontend canvas must convert the visual drawing into this exact text format for the backend to understand.
* **DAG (Directed Acyclic Graph):** A graph data structure where connections only flow in one direction and cannot create circular loops.

## 2. UI/UX Requirements - *High Fidelity Specification*

### 2.1. Architecture & Navigation
* **Menu Location:** Accessible only via deep-link from `02_Root_Cause_Analysis.md`.
* **Core Layout:** *Full-screen Node Canvas*.

### 2.2. Data Dictionary & CRUD Mapping
*Crucial for UI/UX: Designers must align wireframes with these backend data payloads.*
* **Exhaustive Mapping Rule:** ALL fields mapped in the parent PRD. This document specifies the interaction with the `expression` and `tree_structure` computed properties.

**Interaction Mapping (`tree_structure`):**

| Component Type | Frontend UI | Backend Meaning |
| :--- | :--- | :--- |
| **Logic Gate** | Dragged as an `AND` or `OR` block. | Translated to `&` or `|` in the `expression` string. |
| **Sensor Node** | Dragged as a specific Tag block. | Populates the `sensor_codes` array. |
| **Connection Line** | Drawn between nodes. | Defines parenthesis grouping in the `expression`. |

### 2.3. User Flow (Main & Alternate Scenarios)
*Do not just write the 'Happy Path'. You MUST document what happens when things go wrong or when a user cancels an action.*

**[Main Flow: Happy Path (Build Tree)]**
1. User arrives at the blank canvas for a specific `asset_fault_id`.
2. User drags an `AND` logic gate onto the canvas.
3. User drags two `Sensor Nodes` (Vibration & Temperature) onto the canvas.
4. User draws connecting lines from the sensors to the `AND` gate.
5. User clicks Save.
6. The Frontend compiles the visual nodes into the string `(VIB_CODE & TEMP_CODE)` and sends it via `PUT`.

**[Alternate Flow 1: Infinite Loop Creation]**
1. User tries to draw a line from the output of an `AND` gate back into its own input.
2. The UI instantly prevents the connection (DAG validation).
3. The connecting line snaps back, and a small warning pops up: *"Circular logic detected. Fault trees cannot contain infinite loops."*

### 2.4. Interface Components
* **Node Palette:** A sidebar containing Logic Gates and available Sensors for the asset.
* **Canvas Toolbar:** Zoom in, Zoom out, Auto-align nodes, Clear canvas.
* **Live Test Button:** Evaluates the current tree against actual real-time telemetry to see if it would trigger.

### 2.5. UI States (The 5 Fundamental States)
* **Empty State:** A completely blank canvas with a watermark: "Drag nodes from the palette to begin."
* **Loading State:** When fetching an existing tree, show a spinner overlay on the canvas.
* **Error State (Form Validation):** If a user tries to save a tree with an unattached logic gate, highlight the gate in red.
* **Error State (System/Network):** If the save fails, show a toast notification without resetting the canvas work.
* **Partial / Edge State:** If a sensor mapped in the tree was deleted from the master database, its specific node on the canvas should turn gray and display "Sensor Not Found".

### 2.6. Micro-interactions & Animations
* **Transitions:** Node connections snap smoothly with a Bezier curve animation.
* **Hover & Click:** Hovering over an output port highlights valid input ports on other nodes.
* **Visual Feedback:** The "Live Test" button makes the active logic paths glow green if they are currently true based on live telemetry data.

---

## 3. Technical Frontend Execution
* **Library:** Require a directed-acyclic-graph (DAG) rendering library (e.g., `React Flow` or `D3.js`).
* **Expression Compiler:** The Frontend must include a parser that converts the JSON node/edge structure into the Python-compatible boolean string required by the backend schema.
