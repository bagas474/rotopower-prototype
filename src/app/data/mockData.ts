import { User, Role, Competence, Worker, WorkRole, UserCompetence } from "../types";
import { RoleCompetenceRequirement } from "../components/RoleRequirementsMenu";

// Roles
export const mockRoles: Role[] = [
  { id: 1, name: "Administrator", description: "Full system access", is_system: true },
  { id: 2, name: "Technician", description: "Field technician access", is_system: true },
  { id: 3, name: "Maintenance Planner", description: "Planning and scheduling", is_system: true },
  { id: 4, name: "Senior Fitter", description: "Senior maintenance role", is_system: true }
];

// Shared Users/Workers Data
export const mockUsers: User[] = [
  {
    id: 1,
    username: "jdoe_ops",
    email: "jdoe@rotopower.com",
    first_name: "John",
    last_name: "Doe",
    is_active: true,
    roles: [2, 4],
    role_names: ["Technician", "Senior Fitter"],
    sites: [1],
    site_names: ["Plant A"],
    all_sites: false
  },
  {
    id: 2,
    username: "schen_admin",
    email: "schen@rotopower.com",
    first_name: "Sarah",
    last_name: "Chen",
    is_active: true,
    roles: [1],
    role_names: ["Administrator"],
    sites: [1, 2],
    site_names: ["Plant A", "Plant B"],
    all_sites: true
  },
  {
    id: 3,
    username: "mwilson_tech",
    email: "mwilson@rotopower.com",
    first_name: "Michael",
    last_name: "Torres",
    is_active: true,
    roles: [2],
    role_names: ["Technician"],
    sites: [2],
    site_names: ["Plant B"],
    all_sites: false
  },
  {
    id: 4,
    username: "egarcia_maint",
    email: "egarcia@rotopower.com",
    first_name: "Emily",
    last_name: "Watson",
    is_active: true,
    roles: [3],
    role_names: ["Maintenance Planner"],
    sites: [1],
    site_names: ["Plant A"],
    all_sites: false
  },
  {
    id: 5,
    username: "dkim_tech",
    email: "dkim@rotopower.com",
    first_name: "David",
    last_name: "Kim",
    is_active: true,
    roles: [2, 4],
    role_names: ["Technician", "Senior Fitter"],
    sites: [1],
    site_names: ["Plant A"],
    all_sites: false
  }
];

// Workers are derived from Users
export const mockWorkers: Worker[] = mockUsers.map(user => ({
  id: user.id,
  site_id: user.sites[0] || 1,
  user_id: user.id,
  display_name: `${user.first_name} ${user.last_name}`,
  employee_no: `EMP-900${user.id}`,
  stress_level: user.id === 1 ? 4 : user.id === 2 ? 2 : user.id === 3 ? 6 : user.id === 4 ? 3 : 5,
  psychological_load: user.id === 1 ? 3 : user.id === 2 ? 2 : user.id === 3 ? 5 : user.id === 4 ? 3 : 4,
  availability_next_7d_pct: user.id === 1 ? 85 : user.id === 2 ? 95 : user.id === 3 ? 60 : user.id === 4 ? 90 : 75
}));

// Work Roles by User ID
export const mockWorkRoles: Record<number, WorkRole[]> = {
  1: [
    { work_role_id: 5, work_role_name: "Senior Boiler Fitter", is_primary: true },
    { work_role_id: 8, work_role_name: "Welding Specialist", is_primary: false }
  ],
  2: [
    { work_role_id: 12, work_role_name: "Electrical Technician", is_primary: true }
  ],
  3: [
    { work_role_id: 3, work_role_name: "Mechanical Fitter", is_primary: true },
    { work_role_id: 7, work_role_name: "Safety Officer", is_primary: false }
  ],
  4: [
    { work_role_id: 15, work_role_name: "HVAC Specialist", is_primary: true }
  ],
  5: [
    { work_role_id: 9, work_role_name: "Instrumentation Tech", is_primary: true },
    { work_role_id: 11, work_role_name: "Calibration Expert", is_primary: false }
  ]
};

// Competencies by User ID
export const mockCompetencies: Record<number, UserCompetence[]> = {
  1: [
    { competence_id: 12, competence_name: "TIG Welding", level: 8, source: "Certification" },
    { competence_id: 15, competence_name: "Pipe Fitting", level: 9, source: "Certification" },
    { competence_id: 22, competence_name: "High Pressure Systems", level: 7, source: "Manager Assessment" },
    { competence_id: 34, competence_name: "Safety Protocols", level: 10, source: "Training" },
    { competence_id: 41, competence_name: "Blueprint Reading", level: 8, source: "Certification" }
  ],
  2: [
    { competence_id: 18, competence_name: "High Voltage Operations", level: 9, source: "Certification" },
    { competence_id: 25, competence_name: "PLC Programming", level: 7, source: "Training" },
    { competence_id: 31, competence_name: "Motor Control", level: 8, source: "Certification" },
    { competence_id: 44, competence_name: "Troubleshooting", level: 9, source: "Peer Review" }
  ],
  3: [
    { competence_id: 5, competence_name: "Hydraulics", level: 6, source: "Training" },
    { competence_id: 13, competence_name: "Pneumatics", level: 7, source: "Certification" },
    { competence_id: 27, competence_name: "Machine Assembly", level: 8, source: "Manager Assessment" }
  ],
  4: [
    { competence_id: 8, competence_name: "Climate Control Systems", level: 9, source: "Certification" },
    { competence_id: 19, competence_name: "Refrigeration", level: 8, source: "Certification" },
    { competence_id: 33, competence_name: "Ventilation Design", level: 7, source: "Training" },
    { competence_id: 46, competence_name: "Energy Efficiency", level: 8, source: "Peer Review" }
  ],
  5: [
    { competence_id: 11, competence_name: "Process Control", level: 9, source: "Certification" },
    { competence_id: 24, competence_name: "Sensor Calibration", level: 10, source: "Certification" },
    { competence_id: 37, competence_name: "Data Analysis", level: 7, source: "Training" },
    { competence_id: 42, competence_name: "Loop Tuning", level: 8, source: "Manager Assessment" }
  ]
};

// ─── Asset Faults (the named failure events that FaultTrees investigate) ────────

export interface AssetFault {
  id: number;
  asset_id: number;
  asset_name: string;
  fault_name: string;
}

export const mockAssetFaults: AssetFault[] = [
  { id: 45, asset_id: 50, asset_name: "Pump P-101",             fault_name: "Bearing Failure"          },
  { id: 52, asset_id: 40, asset_name: "Compressor C-201",       fault_name: "Surge Event"              },
  { id: 61, asset_id: 51, asset_name: "Motor M-305",            fault_name: "Winding Overheating"      },
  { id: 78, asset_id: 52, asset_name: "Fan F-102",              fault_name: "Blade Imbalance"          },
  { id: 90, asset_id: 42, asset_name: "Heat Exchanger HX-01",   fault_name: "Tube Fouling"             },
  { id: 46, asset_id: 10, asset_name: "Boiler Feed Pump #1",    fault_name: "Cavitation"               },
  { id: 47, asset_id: 11, asset_name: "Boiler Feed Pump #2",    fault_name: "Seal Leakage"             },
  { id: 53, asset_id: 41, asset_name: "Compressor C-202",       fault_name: "High Discharge Temp"      },
  { id: 79, asset_id: 52, asset_name: "Fan F-102",              fault_name: "Motor Overcurrent Trip"   },
  { id: 91, asset_id: 23, asset_name: "Main Generator",         fault_name: "Voltage Imbalance"        },
  { id: 92, asset_id: 22, asset_name: "Steam Turbine",          fault_name: "Lube Oil Contamination"   },
];

// RCFA Fault Trees
export interface FaultTreeNode {
  id: string;
  type: "event" | "and-gate" | "or-gate" | "basic" | "fault";
  label: string;
  x: number;
  y: number;
  children: string[];
  sensor_code?: string;
  fault_id?: number;
}

export interface FaultTree {
  id: number;
  asset_fault_id: number;
  asset_fault_name: string;
  expression: string;
  priority: number;
  sensor_codes: string[];
  dependent_asset_fault_ids: number[];
  status: "draft" | "in-review" | "approved";
  created_by: string;
  created_at: string;
  nodes: FaultTreeNode[];
}

export const mockFaultTrees: FaultTree[] = [
  {
    id: 1,
    asset_fault_id: 45,
    asset_fault_name: "Pump P-101 Bearing Failure",
    expression: "(VIB-01 AND TEMP-02) OR PRES-03",
    priority: 1,
    sensor_codes: ["VIB-01", "TEMP-02", "PRES-03"],
    dependent_asset_fault_ids: [46, 47],
    status: "approved",
    created_by: "Sarah Chen",
    created_at: "2024-01-15",
    nodes: [
      { id: "n1", type: "event", label: "Bearing Failure (P-101)", x: 300, y: 40, children: ["g1"] },
      { id: "g1", type: "or-gate", label: "OR", x: 300, y: 140, children: ["g2", "n4"] },
      { id: "g2", type: "and-gate", label: "AND", x: 160, y: 240, children: ["n2", "n3"] },
      { id: "n2", type: "basic", label: "High Vibration", x: 60, y: 340, children: [], sensor_code: "VIB-01" },
      { id: "n3", type: "basic", label: "High Temp", x: 200, y: 340, children: [], sensor_code: "TEMP-02" },
      { id: "n4", type: "basic", label: "Low Pressure", x: 420, y: 340, children: [], sensor_code: "PRES-03" }
    ]
  },
  {
    id: 2,
    asset_fault_id: 52,
    asset_fault_name: "Compressor C-201 Surge Event",
    expression: "(FLOW-01 AND FLOW-02) AND PRES-10",
    priority: 2,
    sensor_codes: ["FLOW-01", "FLOW-02", "PRES-10"],
    dependent_asset_fault_ids: [53],
    status: "in-review",
    created_by: "John Doe",
    created_at: "2024-02-08",
    nodes: [
      { id: "n1", type: "event", label: "Compressor Surge (C-201)", x: 300, y: 40, children: ["g1"] },
      { id: "g1", type: "and-gate", label: "AND", x: 300, y: 140, children: ["g2", "n4"] },
      { id: "g2", type: "and-gate", label: "AND", x: 160, y: 240, children: ["n2", "n3"] },
      { id: "n2", type: "basic", label: "Low Flow Inlet", x: 60, y: 340, children: [], sensor_code: "FLOW-01" },
      { id: "n3", type: "basic", label: "Low Flow Outlet", x: 200, y: 340, children: [], sensor_code: "FLOW-02" },
      { id: "n4", type: "basic", label: "High Discharge Pressure", x: 400, y: 340, children: [], sensor_code: "PRES-10" }
    ]
  },
  {
    id: 3,
    asset_fault_id: 61,
    asset_fault_name: "Motor M-305 Overheating",
    expression: "",
    priority: 3,
    sensor_codes: [],
    dependent_asset_fault_ids: [],
    status: "draft",
    created_by: "Michael Torres",
    created_at: "2024-03-20",
    nodes: [
      { id: "n1", type: "event", label: "Motor Overheating (M-305)", x: 300, y: 40, children: [] }
    ]
  },
  {
    id: 4,
    asset_fault_id: 78,
    asset_fault_name: "Fan F-102 Blade Imbalance",
    expression: "VIB-05 OR (TEMP-08 AND CURR-02)",
    priority: 2,
    sensor_codes: ["VIB-05", "TEMP-08", "CURR-02"],
    dependent_asset_fault_ids: [79],
    status: "approved",
    created_by: "Sarah Chen",
    created_at: "2024-04-05",
    nodes: [
      { id: "n1", type: "event", label: "Blade Imbalance (F-102)", x: 300, y: 40, children: ["g1"] },
      { id: "g1", type: "or-gate", label: "OR", x: 300, y: 140, children: ["n2", "g2"] },
      { id: "n2", type: "basic", label: "Excess Vibration", x: 120, y: 340, children: [], sensor_code: "VIB-05" },
      { id: "g2", type: "and-gate", label: "AND", x: 420, y: 240, children: ["n3", "n4"] },
      { id: "n3", type: "basic", label: "High Motor Temp", x: 340, y: 340, children: [], sensor_code: "TEMP-08" },
      { id: "n4", type: "basic", label: "Overcurrent", x: 480, y: 340, children: [], sensor_code: "CURR-02" }
    ]
  },
  {
    id: 5,
    asset_fault_id: 90,
    asset_fault_name: "Heat Exchanger HX-01 Fouling",
    expression: "",
    priority: 4,
    sensor_codes: [],
    dependent_asset_fault_ids: [],
    status: "draft",
    created_by: "Emily Watson",
    created_at: "2024-05-12",
    nodes: [
      { id: "n1", type: "event", label: "HX Fouling (HX-01)", x: 300, y: 40, children: [] }
    ]
  }
];

// ─── MRO Inventory ────────────────────────────────────────────────────────────

export interface MROmaterial {
  id: number;
  site_id: number;
  sku: string;
  name: string;
  description: string;
}

export interface InventoryLevel {
  id: number;
  material_id: number;
  location_id: number;
  location_name: string;
  qty_on_hand: number;
  min_stock: number;
  updated_at: string;
}

export interface MaterialBooking {
  id: number;
  site_id: number;
  material_id: number;
  material_sku: string;
  material_name: string;
  quantity: number;
  work_order_id: number | null;
  asset_id: number | null;
  asset_name: string | null;
  booked_at: string;
  booked_by: string;
}

export const mockMROmaterials: MROmaterial[] = [
  { id: 5012, site_id: 1, sku: "BRG-6204",   name: "Deep Groove Ball Bearing",       description: "SKF Deep Groove Ball Bearing 6204-2RS, sealed, ID 20mm OD 47mm." },
  { id: 5013, site_id: 1, sku: "GASKET-99",   name: "High Temp Flange Gasket",        description: "Spiral wound flange gasket, 316 SS + graphite, ASME B16.20, 4-inch." },
  { id: 5014, site_id: 1, sku: "LUB-HD50",    name: "Heavy Duty Hydraulic Oil 5L",    description: "ISO VG 46 anti-wear hydraulic fluid, 5-litre drum." },
  { id: 5015, site_id: 1, sku: "SEAL-KIT-A",  name: "Pump Mechanical Seal Kit",       description: "Complete mechanical seal kit for BFP-01 & BFP-02 series pumps. Includes spring, faces, O-rings." },
  { id: 5016, site_id: 1, sku: "BOLT-M12",    name: "M12×50 Hex Bolt (Box/100)",      description: "Grade 8.8 zinc-plated hex head bolt, M12×50mm, DIN 933, box of 100." },
  { id: 5017, site_id: 1, sku: "FILTER-OIL",  name: "Hydraulic Oil Filter Cartridge", description: "Spin-on hydraulic return-line filter, 10 micron, compatible with Rexroth R928 series." },
  { id: 5018, site_id: 1, sku: "V-BELT-B72",  name: "V-Belt Section B72",             description: "Classical V-belt, B-section, 72 inch outside circumference. For ID-FAN drives." },
  { id: 5019, site_id: 1, sku: "COUP-FLEX",   name: "Flexible Jaw Coupling Insert",   description: "Polyurethane spider insert, 98 Shore A, for Lovejoy L-095 coupling." },
];

export const mockInventoryLevels: InventoryLevel[] = [
  { id: 101, material_id: 5012, location_id: 14, location_name: "Warehouse A – Shelf 3B", qty_on_hand: 24, min_stock: 8,  updated_at: "2024-05-20" },
  { id: 102, material_id: 5012, location_id: 21, location_name: "Warehouse B – Shelf 1A", qty_on_hand: 6,  min_stock: 4,  updated_at: "2024-05-18" },
  { id: 103, material_id: 5013, location_id: 15, location_name: "Warehouse A – Shelf 4C", qty_on_hand: 1,  min_stock: 10, updated_at: "2024-05-19" },
  { id: 104, material_id: 5014, location_id: 16, location_name: "Warehouse B – Tank Bay",  qty_on_hand: 30, min_stock: 15, updated_at: "2024-05-15" },
  { id: 105, material_id: 5015, location_id: 14, location_name: "Warehouse A – Shelf 3B", qty_on_hand: 3,  min_stock: 8,  updated_at: "2024-05-21" },
  { id: 106, material_id: 5016, location_id: 17, location_name: "Warehouse A – Bin 12",   qty_on_hand: 0,  min_stock: 3,  updated_at: "2024-05-10" },
  { id: 107, material_id: 5017, location_id: 15, location_name: "Warehouse A – Shelf 4C", qty_on_hand: 20, min_stock: 10, updated_at: "2024-05-17" },
  { id: 108, material_id: 5017, location_id: 22, location_name: "Warehouse C – Shelf 2D", qty_on_hand: 5,  min_stock: 5,  updated_at: "2024-05-12" },
  { id: 109, material_id: 5018, location_id: 18, location_name: "Warehouse B – Shelf 2C", qty_on_hand: 8,  min_stock: 4,  updated_at: "2024-05-08" },
  { id: 110, material_id: 5019, location_id: 14, location_name: "Warehouse A – Shelf 3B", qty_on_hand: 12, min_stock: 5,  updated_at: "2024-05-22" },
];

export const mockMaterialBookings: MaterialBooking[] = [
  { id: 901, site_id: 1, material_id: 5012, material_sku: "BRG-6204",  material_name: "Deep Groove Ball Bearing",   quantity: 2, work_order_id: 2041, asset_id: 10, asset_name: "Boiler Feed Pump #1", booked_at: "2024-05-21", booked_by: "Sarah Chen"    },
  { id: 902, site_id: 1, material_id: 5015, material_sku: "SEAL-KIT-A",material_name: "Pump Mechanical Seal Kit",   quantity: 1, work_order_id: 2041, asset_id: 10, asset_name: "Boiler Feed Pump #1", booked_at: "2024-05-21", booked_by: "Sarah Chen"    },
  { id: 903, site_id: 1, material_id: 5014, material_sku: "LUB-HD50",  material_name: "Heavy Duty Hydraulic Oil 5L",quantity: 3, work_order_id: 2043, asset_id: 40, asset_name: "Compressor C-201",   booked_at: "2024-05-20", booked_by: "John Doe"      },
  { id: 904, site_id: 1, material_id: 5017, material_sku: "FILTER-OIL",material_name: "Hydraulic Oil Filter Cartridge", quantity: 2, work_order_id: 2046, asset_id: 22, asset_name: "Steam Turbine", booked_at: "2024-05-15", booked_by: "John Doe"      },
  { id: 905, site_id: 1, material_id: 5019, material_sku: "COUP-FLEX", material_name: "Flexible Jaw Coupling Insert",quantity: 4, work_order_id: 2048, asset_id: 52, asset_name: "Fan F-102",          booked_at: "2024-05-10", booked_by: "Sarah Chen"    },
];

// ─── Work Orders ──────────────────────────────────────────────────────────────

export type WOStatus =
  | "draft"
  | "pending_planner"
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";
export type WOPriority = 1 | 2 | 3;

export interface WorkOrder {
  id: number;
  site_id: number;
  asset_id: number;
  asset_name: string;
  location_name: string;
  title: string;
  description: string;
  status: WOStatus;
  priority: WOPriority;
  asset_fault_id: number | null;
  planned_start: string;
  planned_end: string;
  started_at: string | null;
  resolved_at: string | null;
  created_by: string;
  cancellation_reason?: string;
}

export type WorkActionStatus = "proposed" | "active" | "done";

export interface WorkAction {
  id: number;
  work_order_id: number;
  status: WorkActionStatus;
  address_summary: string;
  description: string;
  planned_shift_id: number | null;
}

export interface WorkTask {
  id: number;
  work_action_id: number;
  status: "todo" | "done";
  sequence: number;
  label: string;
  description: string;
}

export interface WorkActionAssignment {
  id: number;
  work_action_id: number;
  user_id: number;
  user_name: string;
  user_initials: string;
  assigned_at: string;
}

export interface WorkActionMaterial {
  id: number;
  work_action_id: number;
  work_order_id: number;
  material_id: number;
  material_sku: string;
  material_name: string;
  qty_requested: number;
  qty_issued: number | null;
  booked_at: string;
}

export interface AssetLocation {
  id: number;
  code: string;
  name: string;
  assets: { id: number; code: string; name: string }[];
}

export const mockAssetLocations: AssetLocation[] = [
  {
    id: 1, code: "BOILER", name: "Boiler House",
    assets: [
      { id: 10, code: "BFP-01", name: "Boiler Feed Pump #1" },
      { id: 11, code: "BFP-02", name: "Boiler Feed Pump #2" },
      { id: 12, code: "ID-FAN", name: "Induced Draft Fan" },
      { id: 13, code: "FD-FAN", name: "Forced Draft Fan" },
    ],
  },
  {
    id: 2, code: "TURBINE", name: "Turbine Hall",
    assets: [
      { id: 20, code: "GT-01", name: "Gas Turbine #1" },
      { id: 21, code: "GT-02", name: "Gas Turbine #2" },
      { id: 22, code: "ST-01", name: "Steam Turbine" },
      { id: 23, code: "GEN-01", name: "Main Generator" },
    ],
  },
  {
    id: 3, code: "COOLING", name: "Cooling Tower",
    assets: [
      { id: 30, code: "CT-FAN-01", name: "Cooling Fan #1" },
      { id: 31, code: "CT-FAN-02", name: "Cooling Fan #2" },
      { id: 32, code: "CWP-01", name: "Cooling Water Pump" },
    ],
  },
  {
    id: 4, code: "COMPRESS", name: "Compressor Station",
    assets: [
      { id: 40, code: "C-201", name: "Compressor C-201" },
      { id: 41, code: "C-202", name: "Compressor C-202" },
      { id: 42, code: "HX-01", name: "Heat Exchanger HX-01" },
    ],
  },
  {
    id: 5, code: "UTILITY", name: "Utility Systems",
    assets: [
      { id: 50, code: "P-101", name: "Pump P-101" },
      { id: 51, code: "M-305", name: "Motor M-305" },
      { id: 52, code: "F-102", name: "Fan F-102" },
    ],
  },
];

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 2041,
    site_id: 1,
    asset_id: 10,
    asset_name: "Boiler Feed Pump #1",
    location_name: "Boiler House",
    title: "Fix leaking seal on BFP-01",
    description: "Mechanical seal showing signs of leakage. Oil seeping from the shaft coupling area.",
    status: "in_progress",
    priority: 1,
    asset_fault_id: 45,
    planned_start: "2024-05-21",
    planned_end: "2024-05-22",
    started_at: "2024-05-21",
    resolved_at: null,
    created_by: "Sarah Chen",
  },
  {
    id: 2042,
    site_id: 1,
    asset_id: 20,
    asset_name: "Gas Turbine #1",
    location_name: "Turbine Hall",
    title: "GT-01 vibration spike investigation",
    description: "Vibration sensor VIB-01 reading 12 mm/s RMS, above 10 mm/s alarm threshold. Inspect bearings.",
    status: "pending_planner",
    priority: 1,
    asset_fault_id: null,
    planned_start: "2024-05-23",
    planned_end: "2024-05-24",
    started_at: null,
    resolved_at: null,
    created_by: "John Doe",
  },
  {
    id: 2043,
    site_id: 1,
    asset_id: 40,
    asset_name: "Compressor C-201",
    location_name: "Compressor Station",
    title: "C-201 surge event — root cause review",
    description: "Two surge events in last 72 hrs. RCFA underway. Anti-surge valve suspected faulty.",
    status: "in_progress",
    priority: 1,
    asset_fault_id: 52,
    planned_start: "2024-05-20",
    planned_end: "2024-05-25",
    started_at: "2024-05-20",
    resolved_at: null,
    created_by: "Sarah Chen",
  },
  {
    id: 2044,
    site_id: 1,
    asset_id: 30,
    asset_name: "Cooling Fan #1",
    location_name: "Cooling Tower",
    title: "CT-FAN-01 blade inspection",
    description: "Scheduled blade wear inspection. Last done 6 months ago.",
    status: "planned",
    priority: 2,
    asset_fault_id: null,
    planned_start: "2024-05-28",
    planned_end: "2024-05-28",
    started_at: null,
    resolved_at: null,
    created_by: "Michael Torres",
  },
  {
    id: 2045,
    site_id: 1,
    asset_id: 51,
    asset_name: "Motor M-305",
    location_name: "Utility Systems",
    title: "M-305 overheating — replace cooling fan",
    description: "Motor winding temperature reaching 145°C (limit: 130°C). Cooling fin blocked with debris.",
    status: "draft",
    priority: 2,
    asset_fault_id: 61,
    planned_start: "2024-06-01",
    planned_end: "2024-06-02",
    started_at: null,
    resolved_at: null,
    created_by: "Emily Watson",
  },
  {
    id: 2046,
    site_id: 1,
    asset_id: 22,
    asset_name: "Steam Turbine",
    location_name: "Turbine Hall",
    title: "ST-01 lube oil system top-up",
    description: "Lube oil level at 30% (min 40%). Top up reservoir and check for leaks.",
    status: "completed",
    priority: 3,
    asset_fault_id: null,
    planned_start: "2024-05-15",
    planned_end: "2024-05-15",
    started_at: "2024-05-15",
    resolved_at: "2024-05-15",
    created_by: "John Doe",
    downtime_minutes: 45,
  },
  {
    id: 2047,
    site_id: 1,
    asset_id: 42,
    asset_name: "Heat Exchanger HX-01",
    location_name: "Compressor Station",
    title: "HX-01 chemical cleaning",
    description: "Fouling reducing heat transfer efficiency by ~18%. Schedule chemical flush.",
    status: "draft",
    priority: 3,
    asset_fault_id: 90,
    planned_start: "2024-06-05",
    planned_end: "2024-06-06",
    started_at: null,
    resolved_at: null,
    created_by: "Emily Watson",
  },
  {
    id: 2048,
    site_id: 1,
    asset_id: 52,
    asset_name: "Fan F-102",
    location_name: "Utility Systems",
    title: "F-102 blade imbalance — dynamic balancing",
    description: "Dynamic balancing required after blade replacement. Vibration at 8 mm/s.",
    status: "completed",
    priority: 2,
    asset_fault_id: 78,
    planned_start: "2024-05-10",
    planned_end: "2024-05-11",
    started_at: "2024-05-10",
    resolved_at: "2024-05-11",
    created_by: "Sarah Chen",
    downtime_minutes: 210,
  },
  {
    id: 2049,
    site_id: 1,
    asset_id: 13,
    asset_name: "Forced Draft Fan",
    location_name: "Boiler House",
    title: "FD-FAN damper actuator replacement",
    description: "Damper actuator not responding to control signals. Manual override in place.",
    status: "pending_planner",
    priority: 2,
    asset_fault_id: null,
    planned_start: "2024-05-30",
    planned_end: "2024-05-30",
    started_at: null,
    resolved_at: null,
    created_by: "John Doe",
  },
  {
    id: 2050,
    site_id: 1,
    asset_id: 32,
    asset_name: "Cooling Water Pump",
    location_name: "Cooling Tower",
    title: "CWP-01 impeller wear check",
    description: "Flow rate 12% below design. Impeller erosion suspected.",
    status: "draft",
    priority: 3,
    asset_fault_id: null,
    planned_start: "2024-06-10",
    planned_end: "2024-06-11",
    started_at: null,
    resolved_at: null,
    created_by: "Michael Torres",
  },
];

export const mockWorkActions: WorkAction[] = [
  { id: 101, work_order_id: 2041, status: "active",   address_summary: "Pump P-101 – Mechanical Room B",        description: "Isolate, drain, and replace mechanical seal assembly.",       planned_shift_id: 1 },
  { id: 102, work_order_id: 2041, status: "proposed", address_summary: "Pump P-101 – Shaft Coupling Area",      description: "Inspect shaft alignment after seal replacement.",             planned_shift_id: 2 },
  { id: 103, work_order_id: 2043, status: "active",   address_summary: "Compressor C-201 – Control Room",       description: "Inspect and replace anti-surge valve actuator.",             planned_shift_id: 1 },
  { id: 104, work_order_id: 2043, status: "proposed", address_summary: "Compressor C-201 – Inlet Piping",       description: "Check inlet filter differential pressure and clean filter.",  planned_shift_id: null },
  { id: 105, work_order_id: 2044, status: "proposed", address_summary: "Cooling Tower – Fan Deck Level 2",      description: "Inspect all blade profiles for erosion and cracks.",         planned_shift_id: 1 },
  { id: 106, work_order_id: 2042, status: "proposed", address_summary: "Turbine Hall – Bearing Pedestal GT-01", description: "Vibration measurement and bearing clearance check.",           planned_shift_id: null },
];

export const mockWorkTasks: WorkTask[] = [
  { id: 201, work_action_id: 101, status: "done", sequence: 1, label: "Install Lock-Out Tag-Out (LOTO)",               description: "Apply LOTO per SOP-MAINT-005 before any isolation." },
  { id: 202, work_action_id: 101, status: "done", sequence: 2, label: "Drain pump casing",                             description: "Open drain valve and collect oil in drip tray." },
  { id: 203, work_action_id: 101, status: "todo", sequence: 3, label: "Remove old seal assembly",                      description: "Use seal puller tool TP-012. Do not damage shaft." },
  { id: 204, work_action_id: 101, status: "todo", sequence: 4, label: "Install new SEAL-KIT-A",                        description: "Torque gland bolts to 18 Nm in cross pattern." },
  { id: 205, work_action_id: 101, status: "todo", sequence: 5, label: "Pressure test and re-commission",               description: "Hydrostatic test at 1.5× operating pressure for 15 min." },
  { id: 206, work_action_id: 102, status: "todo", sequence: 1, label: "Check shaft run-out with dial gauge",           description: "Max allowable run-out: 0.05mm TIR." },
  { id: 207, work_action_id: 102, status: "todo", sequence: 2, label: "Record alignment readings in maintenance log",  description: "Log all four-quadrant readings." },
  { id: 208, work_action_id: 103, status: "done", sequence: 1, label: "Isolate control air supply to actuator",       description: "Close PSOV-201 and vent residual pressure." },
  { id: 209, work_action_id: 103, status: "todo", sequence: 2, label: "Disconnect actuator signal cable (4–20mA)",    description: "Label cable before disconnecting." },
  { id: 210, work_action_id: 103, status: "todo", sequence: 3, label: "Replace actuator and bench-test stroke",       description: "Full stroke test: 4mA=closed, 20mA=open." },
  { id: 211, work_action_id: 105, status: "todo", sequence: 1, label: "Visual inspection – all 6 blades",             description: "Photograph any crack or erosion > 2mm." },
  { id: 212, work_action_id: 105, status: "todo", sequence: 2, label: "Measure blade tip clearance",                  description: "Clearance spec: 8–12mm. Record values." },
];

export const mockWorkActionAssignments: WorkActionAssignment[] = [
  { id: 301, work_action_id: 101, user_id: 1, user_name: "John Doe",       user_initials: "JD", assigned_at: "2024-05-21" },
  { id: 302, work_action_id: 101, user_id: 3, user_name: "Michael Torres", user_initials: "MT", assigned_at: "2024-05-21" },
  { id: 303, work_action_id: 102, user_id: 1, user_name: "John Doe",       user_initials: "JD", assigned_at: "2024-05-21" },
  { id: 304, work_action_id: 103, user_id: 4, user_name: "Emily Watson",   user_initials: "EW", assigned_at: "2024-05-20" },
  { id: 305, work_action_id: 106, user_id: 3, user_name: "Michael Torres", user_initials: "MT", assigned_at: "2024-05-22" },
];

export const mockWorkActionMaterials: WorkActionMaterial[] = [
  { id: 401, work_action_id: 101, work_order_id: 2041, material_id: 5015, material_sku: "SEAL-KIT-A", material_name: "Pump Mechanical Seal Kit",   qty_requested: 1, qty_issued: null, booked_at: "2024-05-21" },
  { id: 402, work_action_id: 101, work_order_id: 2041, material_id: 5012, material_sku: "BRG-6204",   material_name: "Deep Groove Ball Bearing",    qty_requested: 2, qty_issued: null, booked_at: "2024-05-21" },
  { id: 403, work_action_id: 103, work_order_id: 2043, material_id: 5014, material_sku: "LUB-HD50",   material_name: "Heavy Duty Hydraulic Oil 5L", qty_requested: 3, qty_issued: 3,    booked_at: "2024-05-20" },
];

// Role Competence Requirements by Role ID (Phase 1: Worker role only with ID = 1)
export const mockRoleRequirements: Record<number, RoleCompetenceRequirement[]> = {
  1: [
    { role_id: 1, competence_id: 34, competence_name: "Safety Protocols", min_level: 5 },
    { role_id: 1, competence_id: 41, competence_name: "Blueprint Reading", min_level: 3 },
    { role_id: 1, competence_id: 44, competence_name: "Troubleshooting", min_level: 4 }
  ]
};
