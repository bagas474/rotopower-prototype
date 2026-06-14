import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Search, Plus, GitBranch, Eye, ChevronUp, ChevronDown,
  Trash2, X, Wrench, Clock, AlertCircle, ClipboardList,
} from "lucide-react";
import {
  FaultTree, mockFaultTrees, mockAssetFaults, AssetFault,
  mockWorkOrders,
} from "../data/mockData";

// ─── Config ────────────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<number, { label: string; cls: string }> = {
  1: { label: "P1 – Critical", cls: "bg-red-100 text-red-700 border border-red-200"    },
  2: { label: "P2 – High",     cls: "bg-orange-100 text-orange-700 border border-orange-200" },
  3: { label: "P3 – Medium",   cls: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  4: { label: "P4 – Low",      cls: "bg-blue-100 text-blue-700 border border-blue-200"  },
  5: { label: "P5 – Minimal",  cls: "bg-slate-100 text-slate-500 border border-slate-200" },
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  draft:     { label: "Draft",     cls: "bg-slate-100 text-slate-600 border border-slate-200"  },
  "in-review":{ label: "In Review", cls: "bg-purple-100 text-purple-700 border border-purple-200" },
  approved:  { label: "Approved",  cls: "bg-green-100 text-green-700 border border-green-200"  },
};

const WO_STATUS_CLS: Record<string, string> = {
  draft:           "bg-slate-100 text-slate-600",
  pending_planner: "bg-violet-100 text-violet-700",
  planned:         "bg-blue-100 text-blue-700",
  in_progress:     "bg-amber-100 text-amber-700",
  completed:       "bg-green-100 text-green-700",
  cancelled:       "bg-red-100 text-red-600",
};
const WO_STATUS_LABEL: Record<string, string> = {
  draft: "Draft", pending_planner: "Pending Planner", planned: "Planned",
  in_progress: "In Progress", completed: "Completed", cancelled: "Cancelled",
};

type SortField = "id" | "asset_fault_id" | "priority" | "status";
type SortDir   = "asc" | "desc";

// ─── Create Investigation Modal ─────────────────────────────────────────────────

function CreateModal({
  existingFaultIds,
  onSave,
  onClose,
}: {
  existingFaultIds: Set<number>;
  onSave: (assetFaultId: number, priority: number) => void;
  onClose: () => void;
}) {
  const [faultId,  setFaultId]  = useState<number>(mockAssetFaults[0]?.id ?? 0);
  const [priority, setPriority] = useState(3);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!faultId)                        e.fault    = "Please select a failure event.";
    if (existingFaultIds.has(faultId))   e.fault    = "An investigation for this fault already exists.";
    if (priority < 1 || priority > 5)   e.priority = "Priority must be between 1 and 5.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <GitBranch className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">New Investigation</h2>
              <p className="text-xs text-slate-400">Create a new RCFA record</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Failure Event (Asset Fault) <span className="text-red-500">*</span>
            </label>
            <select
              value={faultId}
              onChange={e => { setFaultId(Number(e.target.value)); setErrors({}); }}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.fault ? "border-red-400" : "border-slate-200"}`}
            >
              {mockAssetFaults.map(af => (
                <option key={af.id} value={af.id}>
                  #{af.id} · {af.asset_name} — {af.fault_name}
                </option>
              ))}
            </select>
            {errors.fault && <p className="text-xs text-red-500 mt-1">{errors.fault}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Priority <span className="text-red-500">*</span>
              <span className="ml-1 font-normal text-slate-400">(1 = Critical, 5 = Minimal)</span>
            </label>
            <div className="flex items-center gap-3">
              {[1,2,3,4,5].map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                    priority === p
                      ? `${PRIORITY_CFG[p].cls} ring-2 ring-offset-1 ring-blue-300`
                      : "border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  P{p}
                </button>
              ))}
            </div>
            {errors.priority && <p className="text-xs text-red-500 mt-1">{errors.priority}</p>}
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => { if (validate()) onSave(faultId, priority); }}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Create Investigation
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirmation Popover ────────────────────────────────────────────────

function DeleteConfirmRow({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.1 }}
      className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5"
      onClick={e => e.stopPropagation()}
    >
      <span className="text-xs text-red-600 font-medium">Delete?</span>
      <button onClick={onConfirm} className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-medium">Yes</button>
      <button onClick={onCancel}  className="px-2 py-0.5 border border-slate-200 text-slate-600 text-xs rounded hover:bg-white">No</button>
    </motion.div>
  );
}

// ─── Linked WOs Side Panel ──────────────────────────────────────────────────────

function LinkedWOsPanel({
  record,
  onClose,
  onInvestigate,
}: {
  record: FaultTree;
  onClose: () => void;
  onInvestigate: (id: number) => void;
}) {
  const fault = mockAssetFaults.find(f => f.id === record.asset_fault_id);
  const linkedWOs = mockWorkOrders.filter(wo => wo.asset_fault_id === record.asset_fault_id);
  const pCfg = PRIORITY_CFG[record.priority] ?? PRIORITY_CFG[5];
  const sCfg = STATUS_CFG[record.status] ?? STATUS_CFG.draft;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/10 z-30"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-40 flex flex-col border-l"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs text-slate-400">RCFA #{record.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${pCfg.cls}`}>{pCfg.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sCfg.cls}`}>{sCfg.label}</span>
              </div>
              <h2 className="font-bold text-slate-800 leading-snug">{record.asset_fault_name}</h2>
              {fault && <p className="text-xs text-slate-400 mt-0.5">{fault.asset_name}</p>}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 shrink-0 mt-0.5">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Expression */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Boolean Expression</p>
            {record.expression ? (
              <code className="text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-mono block break-all leading-relaxed">
                {record.expression}
              </code>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-400 border border-slate-200">Unmapped</span>
            )}
          </div>

          {/* Sensors */}
          {record.sensor_codes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sensors</p>
              <div className="flex flex-wrap gap-1.5">
                {record.sensor_codes.map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded font-mono">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Linked Work Orders */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Linked Work Orders</p>
              <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 font-medium">{linkedWOs.length}</span>
            </div>

            {linkedWOs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-300 border-2 border-dashed border-slate-100 rounded-xl">
                <ClipboardList className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">No work orders linked to this fault</p>
              </div>
            ) : (
              <div className="space-y-2">
                {linkedWOs.map(wo => {
                  const sCls = WO_STATUS_CLS[wo.status] ?? "bg-slate-100 text-slate-600";
                  const sLbl = WO_STATUS_LABEL[wo.status] ?? wo.status;
                  const pCls = wo.priority === 1 ? "text-red-600" : wo.priority === 2 ? "text-orange-600" : "text-slate-500";
                  return (
                    <div key={wo.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-[10px] text-slate-400">#{wo.id}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${sCls}`}>{sLbl}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">{wo.title}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Wrench className="h-3 w-3 shrink-0" />
                          <span className="truncate">{wo.asset_name}</span>
                        </div>
                        {wo.planned_start && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{wo.planned_start}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CTA footer */}
        <div className="px-5 py-4 border-t bg-slate-50 shrink-0">
          <button
            onClick={() => onInvestigate(record.id)}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <GitBranch className="h-4 w-4" /> Open Fault Tree Canvas
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

interface RootCauseAnalysisProps {
  isAdmin?: boolean;
  onInvestigate: (id: number) => void;
}

export function RootCauseAnalysis({ isAdmin = true, onInvestigate }: RootCauseAnalysisProps) {
  const [records,       setRecords]       = useState<FaultTree[]>(mockFaultTrees);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [sortField,     setSortField]     = useState<SortField>("priority");
  const [sortDir,       setSortDir]       = useState<SortDir>("asc");
  const [showCreate,    setShowCreate]    = useState(false);
  const [deletingId,    setDeletingId]    = useState<number | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<FaultTree | null>(null);

  const handleSort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("asc"); }
  };

  const SortIcon = ({ f }: { f: SortField }) =>
    sortField !== f
      ? <ChevronUp className="h-3 w-3 text-slate-300" />
      : sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-blue-600" />
      : <ChevronDown className="h-3 w-3 text-blue-600" />;

  const filtered = records
    .filter(r => {
      const q = search.toLowerCase();
      return (
        String(r.id).includes(q) ||
        r.asset_fault_name.toLowerCase().includes(q) ||
        r.expression.toLowerCase().includes(q) ||
        r.sensor_codes.some(s => s.toLowerCase().includes(q))
      ) && (statusFilter === "all" || r.status === statusFilter);
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "id")             cmp = a.id - b.id;
      else if (sortField === "asset_fault_id") cmp = a.asset_fault_id - b.asset_fault_id;
      else if (sortField === "priority")  cmp = a.priority - b.priority;
      else if (sortField === "status")    cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleCreate = (assetFaultId: number, priority: number) => {
    const fault = mockAssetFaults.find(f => f.id === assetFaultId);
    if (!fault) return;
    const newRecord: FaultTree = {
      id: Math.max(...records.map(r => r.id), 0) + 1,
      asset_fault_id: assetFaultId,
      asset_fault_name: `${fault.asset_name} ${fault.fault_name}`,
      expression: "",
      priority,
      sensor_codes: [],
      dependent_asset_fault_ids: [],
      status: "draft",
      created_by: "Sarah Chen",
      created_at: new Date().toISOString().split("T")[0],
      nodes: [{ id: "n1", type: "event", label: `${fault.fault_name} (${fault.asset_name})`, x: 300, y: 40, children: [] }],
    };
    setRecords(prev => [newRecord, ...prev]);
    setShowCreate(false);
    toast.success(`Investigation #${newRecord.id} created.`);
  };

  const handleDelete = (id: number) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    if (selectedRecord?.id === id) setSelectedRecord(null);
    setDeletingId(null);
    toast.success(`Investigation #${id} deleted.`);
  };

  const existingFaultIds = new Set(records.map(r => r.asset_fault_id));

  const linkedWOCount = (assetFaultId: number) =>
    mockWorkOrders.filter(wo => wo.asset_fault_id === assetFaultId).length;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Root Cause Analysis</h1>
            <p className="text-sm text-slate-500 mt-0.5">RCFA investigations and fault tree mapping</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" /> New Investigation
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ID, fault, sensor…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="in-review">In Review</option>
            <option value="approved">Approved</option>
          </select>
          <span className="text-sm text-slate-500 ml-auto">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs text-slate-600 font-medium">
                {([
                  ["id",            "ID"],
                  ["asset_fault_id","Asset Fault"],
                  ["priority",      "Priority"],
                  [null,            "Expression"],
                  [null,            "Status"],
                  [null,            "Linked WOs"],
                  [null,            "Actions"],
                ] as [SortField | null, string][]).map(([f, label]) => (
                  <th
                    key={label}
                    className={`px-4 py-3 ${f ? "cursor-pointer hover:bg-slate-100 select-none" : ""}`}
                    onClick={() => f && handleSort(f)}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {f && <SortIcon f={f} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No investigations found</p>
                    <p className="text-xs mt-1">Adjust filters or create a new investigation</p>
                  </td>
                </tr>
              ) : (
                filtered.map(row => {
                  const pCfg = PRIORITY_CFG[row.priority] ?? PRIORITY_CFG[5];
                  const sCfg = STATUS_CFG[row.status]    ?? STATUS_CFG.draft;
                  const woCount = linkedWOCount(row.asset_fault_id);
                  const isSelected = selectedRecord?.id === row.id;

                  return (
                    <tr
                      key={row.id}
                      className={`border-b last:border-0 cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                      onClick={() => setSelectedRecord(isSelected ? null : row)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">#{row.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{row.asset_fault_name}</div>
                        <div className="text-xs text-slate-400">Fault #{row.asset_fault_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pCfg.cls}`}>
                          {pCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {row.expression ? (
                          <code className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-mono break-all line-clamp-2">
                            {row.expression}
                          </code>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-400 border border-slate-200">
                            Unmapped
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sCfg.cls}`}>
                          {sCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {woCount > 0 ? (
                          <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                            <ClipboardList className="h-3.5 w-3.5" />
                            {woCount} WO{woCount !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <AnimatePresence mode="wait">
                            {deletingId === row.id ? (
                              <DeleteConfirmRow
                                key="confirm"
                                onConfirm={() => handleDelete(row.id)}
                                onCancel={() => setDeletingId(null)}
                              />
                            ) : (
                              <motion.div key="actions" className="flex items-center gap-1.5"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {isAdmin && (
                                  <button
                                    onClick={() => setDeletingId(row.id)}
                                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="Delete investigation"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => onInvestigate(row.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  {isAdmin
                                    ? <><GitBranch className="h-3.5 w-3.5" /> Investigate</>
                                    : <><Eye className="h-3.5 w-3.5" /> View</>}
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal
            existingFaultIds={existingFaultIds}
            onSave={handleCreate}
            onClose={() => setShowCreate(false)}
          />
        )}
      </AnimatePresence>

      {/* Linked WOs side panel */}
      <AnimatePresence>
        {selectedRecord && (
          <LinkedWOsPanel
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onInvestigate={(id) => { setSelectedRecord(null); onInvestigate(id); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
