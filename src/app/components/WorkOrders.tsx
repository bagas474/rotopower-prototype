import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Plus, LayoutGrid, List, Search,
  ChevronRight, X, ChevronUp, ChevronDown,
  Wrench, Clock, MapPin, FileText,
} from "lucide-react";
import {
  WorkOrder, WOStatus, WOPriority,
  WorkAction, WorkTask, WorkActionAssignment, WorkActionMaterial,
  mockWorkOrders, mockAssetLocations, AssetLocation,
  mockWorkActions, mockWorkTasks, mockWorkActionAssignments, mockWorkActionMaterials,
} from "../data/mockData";
import { WorkOrderKanban, COLUMNS } from "./WorkOrderKanban";
import { WorkOrderDrawer } from "./WorkOrderDrawer";

// ─── Config ────────────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<number, { label: string; cls: string }> = {
  1: { label: "High",   cls: "bg-red-100 text-red-700 border border-red-200" },
  2: { label: "Medium", cls: "bg-orange-100 text-orange-700 border border-orange-200" },
  3: { label: "Low",    cls: "bg-slate-100 text-slate-600 border border-slate-200" },
};

const STATUS_CFG: Record<WOStatus, { label: string; cls: string }> = {
  pending:     { label: "Pending",     cls: "bg-slate-100 text-slate-600 border border-slate-200"  },
  in_progress: { label: "In Progress", cls: "bg-amber-100 text-amber-700 border border-amber-200"   },
  parked:      { label: "Parked",      cls: "bg-violet-100 text-violet-700 border border-violet-200" },
  completed:   { label: "Completed",   cls: "bg-green-100 text-green-700 border border-green-200"   },
  cancelled:   { label: "Cancelled",   cls: "bg-red-100 text-red-600 border border-red-200"         },
};

// ─── Asset Hierarchy Modal ──────────────────────────────────────────────────────

function AssetPickerModal({
  onSelect, onClose,
}: {
  onSelect: (loc: AssetLocation, asset: { id: number; code: string; name: string }) => void;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[70vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div><h2 className="font-semibold text-slate-800">Select Asset</h2><p className="text-xs text-slate-400 mt-0.5">Navigate Location → Asset</p></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-1">
          {mockAssetLocations.map(loc => (
            <div key={loc.id} className="rounded-xl border border-slate-100 overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(expanded === loc.id ? null : loc.id)}
              >
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">{loc.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{loc.code}</div>
                </div>
                <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${expanded === loc.id ? "rotate-90" : ""}`} />
              </button>
              <AnimatePresence>
                {expanded === loc.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                    className="overflow-hidden border-t border-slate-100 bg-slate-50"
                  >
                    {loc.assets.map(asset => (
                      <button
                        key={asset.id}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-blue-50 transition-colors group"
                        onClick={() => onSelect(loc, asset)}
                      >
                        <Wrench className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm text-slate-700 group-hover:text-blue-700">{asset.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{asset.code}</div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-400" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Create WO Modal ────────────────────────────────────────────────────────────

function CreateWOModal({ onSave, onClose }: { onSave: (wo: Omit<WorkOrder, "id" | "started_at" | "resolved_at">) => void; onClose: () => void }) {
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [form, setForm] = useState({
    asset_id: 0, asset_name: "", location_name: "",
    title: "", description: "",
    priority: 2 as WOPriority, status: "pending" as WOStatus,
    planned_start: "", planned_end: "",
    site_id: 1, asset_fault_id: null as number | null, created_by: "Sarah Chen",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: any) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => { const n = { ...e }; delete n[k]; return n; }); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.asset_id)           e.asset         = "Please select an asset.";
    if (!form.title.trim())       e.title         = "Title is required.";
    if (!form.planned_start)      e.planned_start = "Planned start is required.";
    if (!form.planned_end)        e.planned_end   = "Planned end is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold text-slate-800">Create Work Order</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
          </div>
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Asset <span className="text-red-500">*</span></label>
              <button
                onClick={() => setShowAssetPicker(true)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                  errors.asset ? "border-red-400 bg-red-50" : form.asset_id ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-slate-300 text-slate-400"
                }`}
              >
                {form.asset_id ? (
                  <div><div className="font-medium text-slate-800">{form.asset_name}</div><div className="text-xs text-slate-400">{form.location_name}</div></div>
                ) : <span>Select Asset…</span>}
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              </button>
              {errors.asset && <p className="text-xs text-red-500 mt-1">{errors.asset}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Title <span className="text-red-500">*</span></label>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Fix leaking seal on BFP-01"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.title ? "border-red-400 bg-red-50" : "border-slate-200"}`} />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3}
                placeholder="Detailed problem description…"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Priority</label>
                <select value={form.priority} onChange={e => set("priority", parseInt(e.target.value) as WOPriority)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value={1}>1 – High</option><option value={2}>2 – Medium</option><option value={3}>3 – Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Initial Status</label>
                <div className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-500 flex items-center">
                  Pending
                </div>
                <p className="text-[10px] text-slate-400 mt-1">New work orders start in the Pending column.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Planned Start <span className="text-red-500">*</span></label>
                <input type="date" value={form.planned_start} onChange={e => set("planned_start", e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.planned_start ? "border-red-400 bg-red-50" : "border-slate-200"}`} />
                {errors.planned_start && <p className="text-xs text-red-500 mt-1">{errors.planned_start}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Planned End <span className="text-red-500">*</span></label>
                <input type="date" value={form.planned_end} onChange={e => set("planned_end", e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.planned_end ? "border-red-400 bg-red-50" : "border-slate-200"}`} />
                {errors.planned_end && <p className="text-xs text-red-500 mt-1">{errors.planned_end}</p>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end px-6 py-4 border-t bg-slate-50 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-white">Cancel</button>
            <button onClick={() => { if (validate()) onSave({ ...form, cancellation_reason: undefined }); }}
              className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Create Work Order</button>
          </div>
        </motion.div>
      </div>
      <AnimatePresence>
        {showAssetPicker && (
          <AssetPickerModal
            onSelect={(loc, asset) => { set("asset_id", asset.id); set("asset_name", asset.name); set("location_name", loc.name); setShowAssetPicker(false); }}
            onClose={() => setShowAssetPicker(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── List View ──────────────────────────────────────────────────────────────────

function WorkOrderList({ workOrders, onOpen }: { workOrders: WorkOrder[]; onOpen: (wo: WorkOrder) => void }) {
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortField, setSortField]         = useState<"id"|"priority"|"status"|"planned_start">("id");
  const [sortDir, setSortDir]             = useState<"asc"|"desc">("asc");

  const handleSort = (f: typeof sortField) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("asc"); }
  };
  const SortIcon = ({ f }: { f: typeof sortField }) =>
    sortField !== f ? <ChevronUp className="h-3 w-3 text-slate-300" /> :
    sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-blue-600" /> : <ChevronDown className="h-3 w-3 text-blue-600" />;

  const filtered = workOrders
    .filter(wo => {
      const q = search.toLowerCase();
      return (String(wo.id).includes(q) || wo.title.toLowerCase().includes(q) || wo.asset_name.toLowerCase().includes(q))
        && (statusFilter === "all" || wo.status === statusFilter)
        && (priorityFilter === "all" || String(wo.priority) === priorityFilter);
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "id")            cmp = a.id - b.id;
      else if (sortField === "priority") cmp = a.priority - b.priority;
      else if (sortField === "status")   cmp = a.status.localeCompare(b.status);
      else                               cmp = a.planned_start.localeCompare(b.planned_start);
      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-3 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none text-slate-600">
          <option value="all">All Statuses</option>
          {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none text-slate-600">
          <option value="all">All Priorities</option>
          <option value="1">High</option><option value="2">Medium</option><option value="3">Low</option>
        </select>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} records</span>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-600 font-medium text-left">
                {([["id","WO #"],["","Title"],["priority","Priority"],["status","Status"],["","Asset"],["planned_start","Planned Start"],["","Created By"]] as [string, string][]).map(([f, label]) => (
                  <th key={label} className={`px-4 py-3 ${f ? "cursor-pointer hover:bg-slate-100 select-none" : ""}`}
                    onClick={() => f && handleSort(f as any)}>
                    <div className="flex items-center gap-1">{label}{f && <SortIcon f={f as any} />}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No work orders found</p>
                </td></tr>
              ) : filtered.map(wo => {
                const pCfg = PRIORITY_CFG[wo.priority];
                const sCfg = STATUS_CFG[wo.status];
                return (
                  <tr key={wo.id} className="border-b last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => onOpen(wo)}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">#{wo.id}</td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="font-medium text-slate-800 truncate">{wo.title}</p>
                      {wo.description && <p className="text-xs text-slate-400 truncate">{wo.description}</p>}
                    </td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pCfg.cls}`}>{pCfg.label}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sCfg.cls}`}>{sCfg.label}</span></td>
                    <td className="px-4 py-3"><div className="font-medium text-slate-700 text-xs">{wo.asset_name}</div><div className="text-[10px] text-slate-400">{wo.location_name}</div></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{wo.planned_start}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{wo.created_by}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

interface WorkOrdersProps {
  isAdmin?: boolean;
  onViewRCA?: (faultTreeId: number) => void;
}

export function WorkOrders({ isAdmin = true, onViewRCA }: WorkOrdersProps) {
  const [workOrders,   setWorkOrders]   = useState<WorkOrder[]>(mockWorkOrders);
  const [actions,      setActions]      = useState<WorkAction[]>(mockWorkActions);
  const [tasks,        setTasks]        = useState<WorkTask[]>(mockWorkTasks);
  const [assignments,  setAssignments]  = useState<WorkActionAssignment[]>(mockWorkActionAssignments);
  const [woMaterials,  setWOMaterials]  = useState<WorkActionMaterial[]>(mockWorkActionMaterials);

  const [viewMode,  setViewMode]  = useState<"kanban"|"list">("kanban");
  const [showCreate, setShowCreate] = useState(false);
  const [drawerWO,  setDrawerWO]  = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 1200); return () => clearTimeout(t); }, []);

  const handleMove = (id: number, newStatus: WOStatus, cancelReason?: string) => {
    setWorkOrders(wos => wos.map(wo => {
      if (wo.id !== id) return wo;
      const updates: Partial<WorkOrder> = { status: newStatus };
      if (newStatus === "in_progress" && !wo.started_at) updates.started_at = new Date().toISOString().split("T")[0];
      if (newStatus === "completed")   updates.resolved_at = new Date().toISOString().split("T")[0];
      if (newStatus === "cancelled" && cancelReason) updates.cancellation_reason = cancelReason;
      return { ...wo, ...updates };
    }));
    const label = COLUMNS.find(c => c.status === newStatus)?.label ?? newStatus;
    toast.success(`WO #${id} moved to ${label}`);
    // Keep drawer in sync
    if (drawerWO?.id === id) setDrawerWO(w => w ? { ...w, status: newStatus, cancellation_reason: cancelReason } : w);
  };

  const handleCreate = (data: Omit<WorkOrder, "id" | "started_at" | "resolved_at">) => {
    const newWO: WorkOrder = {
      ...data,
      id: Math.max(...workOrders.map(w => w.id), 2000) + 1,
      started_at: null, resolved_at: null,
    };
    setWorkOrders(wos => [newWO, ...wos]);
    setShowCreate(false);
    toast.success(`Work Order #${newWO.id} created.`);
  };

  const handleStatusChange = (id: number, status: WOStatus, cancelReason?: string) => {
    handleMove(id, status, cancelReason);
  };

  const counts = COLUMNS.reduce((acc, c) => {
    acc[c.status] = workOrders.filter(w => w.status === c.status).length;
    return acc;
  }, {} as Record<string, number>);

  // Per-WO filtered data for drawer
  const woActions     = drawerWO ? actions.filter(a => a.work_order_id === drawerWO.id) : [];
  const woActionIds   = woActions.map(a => a.id);
  const woTasks       = tasks.filter(t => woActionIds.includes(t.work_action_id));
  const woAssignments = assignments.filter(a => woActionIds.includes(a.work_action_id));
  const woMats        = woMaterials.filter(m => m.work_order_id === drawerWO?.id);

  // For avatar stacks on kanban, build a flat map: work_order_id → assignments
  const woIdToAssignments = new Map<number, WorkActionAssignment[]>();
  actions.forEach(a => {
    const woAssigns = assignments.filter(asn => asn.work_action_id === a.id);
    const existing = woIdToAssignments.get(a.work_order_id) ?? [];
    woIdToAssignments.set(a.work_order_id, [...existing, ...woAssigns]);
  });
  const allAssignmentsForKanban = Array.from(woIdToAssignments.entries()).flatMap(([, asns]) => asns);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Work Orders</h1>
              <p className="text-sm text-slate-500 mt-0.5">Defect tracking and maintenance workflow</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${viewMode === "kanban" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                  <LayoutGrid className="h-3.5 w-3.5" /> Kanban
                </button>
                <button onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                  <List className="h-3.5 w-3.5" /> List
                </button>
              </div>
              {isAdmin && (
                <button onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                  <Plus className="h-4 w-4" /> Create Work Order
                </button>
              )}
            </div>
          </div>
          {/* Status summary */}
          <div className="flex items-center gap-2 flex-wrap">
            {COLUMNS.map(col => (
              <div key={col.status} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${col.accent}`} />
                <span className="text-xs text-slate-500">{col.label}</span>
                <span className="text-xs font-semibold text-slate-800">{counts[col.status] ?? 0}</span>
              </div>
            ))}
            <span className="ml-auto text-xs text-slate-400">{workOrders.length} total</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {viewMode === "kanban" ? (
            <WorkOrderKanban
              workOrders={workOrders.filter(wo => wo.status !== "cancelled")}
              allAssignments={allAssignmentsForKanban}
              onMove={handleMove}
              onOpen={setDrawerWO}
              isLoading={isLoading}
            />
          ) : (
            <WorkOrderList workOrders={workOrders} onOpen={setDrawerWO} />
          )}
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showCreate && <CreateWOModal onSave={handleCreate} onClose={() => setShowCreate(false)} />}
        </AnimatePresence>

        {/* Detail Drawer */}
        <AnimatePresence>
          {drawerWO && (
            <WorkOrderDrawer
              wo={workOrders.find(w => w.id === drawerWO.id) ?? drawerWO}
              actions={woActions}
              tasks={woTasks}
              assignments={woAssignments}
              materials={woMats}
              onClose={() => setDrawerWO(null)}
              onStatusChange={handleStatusChange}
              onUpdateActions={newActions => setActions(prev => [...prev.filter(a => a.work_order_id !== drawerWO.id), ...newActions])}
              onUpdateTasks={newTasks => setTasks(prev => [...prev.filter(t => !woActionIds.includes(t.work_action_id)), ...newTasks])}
              onUpdateAssignments={newAsns => setAssignments(prev => [...prev.filter(a => !woActionIds.includes(a.work_action_id)), ...newAsns])}
              onUpdateMaterials={newMats => setWOMaterials(prev => [...prev.filter(m => m.work_order_id !== drawerWO.id), ...newMats])}
              onViewRCA={onViewRCA}
            />
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
}
