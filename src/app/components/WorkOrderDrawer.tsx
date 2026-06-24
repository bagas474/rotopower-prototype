import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  X, GitBranch, Wrench, MapPin, Clock, User, Plus, Trash2,
  CheckSquare, ChevronDown, ChevronRight,
  Package, AlertCircle, Check, Users, MessageSquare, Send,
} from "lucide-react";
import {
  WorkOrder, WOStatus, WOPriority,
  WorkAction, WorkActionStatus, WorkTask, WorkTaskStatus,
  WorkActionAssignment, WorkActionMaterial, WorkOrderComment,
  mockFaultTrees, mockUsers, mockWorkOrderComments,
} from "../data/mockData";

// ─── Config ────────────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<WOPriority, { label: string; cls: string }> = {
  1: { label: "High",   cls: "bg-red-100 text-red-700 border border-red-200" },
  2: { label: "Medium", cls: "bg-orange-100 text-orange-700 border border-orange-200" },
  3: { label: "Low",    cls: "bg-slate-100 text-slate-600 border border-slate-200" },
};

const STATUS_CFG: Record<WOStatus, { label: string; cls: string }> = {
  pending:     { label: "Pending",     cls: "bg-slate-100 text-slate-600"   },
  in_progress: { label: "In Progress", cls: "bg-amber-100 text-amber-700"   },
  parked:      { label: "Parked",      cls: "bg-violet-100 text-violet-700" },
  completed:   { label: "Completed",   cls: "bg-green-100 text-green-700"   },
  cancelled:   { label: "Cancelled",   cls: "bg-red-100 text-red-600"       },
};

const ACTION_STATUS_CFG: Record<WorkActionStatus, { label: string; cls: string }> = {
  proposed:  { label: "Proposed", cls: "bg-slate-100 text-slate-600"   },
  active:    { label: "Active",   cls: "bg-amber-100 text-amber-700"   },
  "wont-do": { label: "Won't Do", cls: "bg-red-50 text-red-500"        },
  done:      { label: "Done",     cls: "bg-green-100 text-green-700"   },
};

const TASK_STATUS_CFG: Record<WorkTaskStatus, { label: string; cls: string; dot: string }> = {
  todo:        { label: "To Do",       cls: "bg-slate-100 text-slate-600",   dot: "bg-slate-400"  },
  in_progress: { label: "In Progress", cls: "bg-amber-100 text-amber-700",   dot: "bg-amber-500"  },
  blocked:     { label: "Blocked",     cls: "bg-red-100 text-red-600",       dot: "bg-red-500"    },
  done:        { label: "Done",        cls: "bg-green-100 text-green-700",    dot: "bg-green-500"  },
  cancelled:   { label: "Cancelled",   cls: "bg-slate-100 text-slate-400",   dot: "bg-slate-300"  },
};

const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-green-500","bg-amber-500","bg-rose-500"];

const ALL_STATUSES: WOStatus[] = ["pending","in_progress","parked","completed","cancelled"];

function isReadOnly(status: WOStatus) {
  return status === "completed" || status === "cancelled";
}

// ─── Tab types ──────────────────────────────────────────────────────────────────

type DrawerTab = "diagnosis" | "info" | "actions" | "materials" | "assignments";

// ─── Diagnosis & Evidence Tab ───────────────────────────────────────────────────

function DiagnosisTab({
  wo, onViewFailureEvent,
}: {
  wo: WorkOrder;
  onViewFailureEvent?: () => void;
}) {
  const faultTree = wo.asset_fault_id
    ? mockFaultTrees.find(t => t.asset_fault_id === wo.asset_fault_id)
    : null;

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-2">Context & Source</label>
        <p className="text-sm text-slate-600 leading-relaxed">
          This Work Order was auto-generated from a Failure Event report. The information below provides the operational context and the FMEA path that led to this maintenance task.
        </p>
      </div>

      {/* Linked Failure Event / FMEA Path */}
      {faultTree ? (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">FMEA Context</h4>
              <p className="text-xs text-slate-500 mt-0.5">From RCA Investigation</p>
            </div>
            <GitBranch className="h-5 w-5 text-blue-600 shrink-0" />
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <span className="font-semibold text-blue-700">Failure Mode:</span>
              <p className="text-slate-700 mt-0.5">{faultTree.asset_fault_name}</p>
            </div>
            <div>
              <span className="font-semibold text-blue-700">Expression:</span>
              <p className="text-slate-700 mt-0.5 font-mono text-xs bg-white rounded p-2">{faultTree.expression}</p>
            </div>
            {faultTree.sensor_codes.length > 0 && (
              <div>
                <span className="font-semibold text-blue-700">Sensor Inputs:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {faultTree.sensor_codes.map(code => (
                    <span key={code} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs font-medium">{code}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {onViewFailureEvent && (
            <button
              onClick={onViewFailureEvent}
              className="w-full flex items-center justify-center gap-2 mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <GitBranch className="h-3.5 w-3.5" /> View Original Failure Event
            </button>
          )}
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl p-4 text-center text-slate-400 py-8">
          <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No linked Failure Event or FMEA context available.</p>
        </div>
      )}

      {/* Evidence & Anomaly Data */}
      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-2">Detected Anomaly</label>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
          <p className="text-sm text-slate-700">{wo.description || "No anomaly data recorded."}</p>
          {wo.started_at && (
            <p className="text-xs text-slate-500">
              <span className="font-semibold">First detected:</span> {wo.started_at}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Info Tab ───────────────────────────────────────────────────────────────────

function InfoTab({
  wo, onStatusChange, readOnly, comments, onAddComment,
}: {
  wo: WorkOrder;
  onStatusChange: (s: WOStatus) => void;
  readOnly: boolean;
  comments: WorkOrderComment[];
  onAddComment: (body: string) => void;
}) {
  const pCfg = PRIORITY_CFG[wo.priority];
  const [draft, setDraft] = useState("");

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const submitComment = () => {
    if (!draft.trim()) return;
    onAddComment(draft.trim());
    setDraft("");
  };

  return (
    <div className="space-y-5">
      {/* Status */}
      {!readOnly ? (
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Status</label>
          <select
            value={wo.status}
            onChange={e => onStatusChange(e.target.value as WOStatus)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_CFG[s].label}</option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Status</label>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CFG[wo.status].cls}`}>
            {STATUS_CFG[wo.status].label}
          </span>
          {wo.cancellation_reason && (
            <p className="text-xs text-red-500 mt-1.5">Reason: {wo.cancellation_reason}</p>
          )}
        </div>
      )}

      {/* Asset */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Asset</label>
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <Wrench className="h-4 w-4 text-slate-300 shrink-0" />
            {wo.asset_name}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Location</label>
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <MapPin className="h-4 w-4 text-slate-300 shrink-0" />
            {wo.location_name}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Priority</label>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${pCfg.cls}`}>{pCfg.label}</span>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Created By</label>
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <User className="h-4 w-4 text-slate-300 shrink-0" />
            {wo.created_by}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Planned Start</label>
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <Clock className="h-4 w-4 text-slate-300 shrink-0" />
            {wo.planned_start || "—"}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Planned End</label>
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <Clock className="h-4 w-4 text-slate-300 shrink-0" />
            {wo.planned_end || "—"}
          </div>
        </div>
        {wo.started_at && (
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Started At</label>
            <p className="text-sm text-slate-700">{wo.started_at}</p>
          </div>
        )}
        {wo.resolved_at && (
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Completed At</label>
            <p className="text-sm text-slate-700">{wo.resolved_at}</p>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-slate-500 block mb-1.5">Description</label>
        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg px-3 py-2.5 whitespace-pre-wrap">
          {wo.description || <span className="text-slate-300 italic">No description</span>}
        </p>
      </div>

      {/* Activity & Comments */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 mb-3">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Activity &amp; Comments</span>
          <span className="text-[10px] text-slate-400">({comments.length})</span>
        </div>

        {!readOnly && (
          <div className="flex items-end gap-2 mb-4">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComment(); }}
              rows={2}
              placeholder="Add a comment… (⌘/Ctrl + Enter to post)"
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <button
              onClick={submitComment}
              disabled={!draft.trim()}
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Post comment"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}

        {comments.length === 0 ? (
          <p className="text-xs text-slate-300 italic">No activity yet.</p>
        ) : (
          <ol className="space-y-3">
            {[...comments].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(c => (
              <li key={c.id} className="flex gap-2.5">
                {c.kind === "comment" ? (
                  <div className={`h-7 w-7 rounded-full ${AVATAR_COLORS[c.id % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                    {c.author_initials}
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    {c.kind === "status" ? <Clock className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-700">{c.author_name}</span>
                    <span className="text-[10px] text-slate-400">{fmtTime(c.created_at)}</span>
                  </div>
                  <p className={`text-sm mt-0.5 ${c.kind === "comment" ? "text-slate-700" : "text-slate-500 italic"}`}>{c.body}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ─── Actions & Tasks Tab ────────────────────────────────────────────────────────

function ActionsTab({
  wo, actions, tasks,
  onAddAction, onDeleteAction, onUpdateActionStatus,
  onAddTask, onTaskStatus, onDeleteTask,
  readOnly,
}: {
  wo: WorkOrder;
  actions: WorkAction[];
  tasks: WorkTask[];
  onAddAction: () => void;
  onDeleteAction: (id: number) => void;
  onUpdateActionStatus: (id: number, status: WorkActionStatus) => void;
  onAddTask: (actionId: number, label: string) => void;
  onTaskStatus: (taskId: number, status: WorkTaskStatus) => void;
  onDeleteTask: (taskId: number) => void;
  readOnly: boolean;
}) {
  const [expandedActions, setExpandedActions] = useState<Set<number>>(new Set(actions.map(a => a.id)));
  const [addingTaskFor, setAddingTaskFor] = useState<number | null>(null);
  const [newTaskLabel, setNewTaskLabel] = useState("");

  const toggleAction = (id: number) => {
    setExpandedActions(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const submitTask = (actionId: number) => {
    if (!newTaskLabel.trim()) return;
    onAddTask(actionId, newTaskLabel.trim());
    setNewTaskLabel("");
    setAddingTaskFor(null);
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <button
          onClick={onAddAction}
          className="flex items-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Work Action
        </button>
      )}

      {actions.length === 0 && (
        <div className="text-center py-10 text-slate-300">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No actions yet</p>
        </div>
      )}

      {actions.map(action => {
        const actionTasks = tasks.filter(t => t.work_action_id === action.id).sort((a, b) => a.sequence - b.sequence);
        const doneTasks   = actionTasks.filter(t => t.status === "done").length;
        const isExpanded  = expandedActions.has(action.id);
        const aCfg        = ACTION_STATUS_CFG[action.status];

        return (
          <div key={action.id} className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Action header */}
            <div className="flex items-start gap-2 px-4 py-3 bg-slate-50">
              <button onClick={() => toggleAction(action.id)} className="mt-0.5 text-slate-400 hover:text-slate-700">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800 truncate">{action.address_summary}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${aCfg.cls}`}>{aCfg.label}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{action.description}</p>
                {actionTasks.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1">{doneTasks}/{actionTasks.length} tasks done</p>
                )}
              </div>
              {!readOnly && (
                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={action.status}
                    onChange={e => onUpdateActionStatus(action.id, e.target.value as WorkActionStatus)}
                    onClick={e => e.stopPropagation()}
                    className="text-[10px] border border-slate-200 rounded px-1.5 py-1 bg-white focus:outline-none"
                  >
                    {(["proposed","active","wont-do","done"] as WorkActionStatus[]).map(s => (
                      <option key={s} value={s}>{ACTION_STATUS_CFG[s].label}</option>
                    ))}
                  </select>
                  <button onClick={() => onDeleteAction(action.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Tasks */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  transition={{ duration: 0.18 }} className="overflow-hidden"
                >
                  <div className="px-4 py-2 space-y-1.5">
                    {actionTasks.map(task => {
                      const tCfg = TASK_STATUS_CFG[task.status];
                      const muted = task.status === "done" || task.status === "cancelled";
                      return (
                        <div key={task.id} className="flex items-start gap-2.5 group py-1">
                          <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${tCfg.dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${muted ? "line-through text-slate-400" : "text-slate-700"}`}>
                              {task.label}
                            </p>
                            {task.description && (
                              <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                            )}
                          </div>
                          {!readOnly ? (
                            <select
                              value={task.status}
                              onChange={e => onTaskStatus(task.id, e.target.value as WorkTaskStatus)}
                              className={`text-[10px] font-semibold border-0 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer ${tCfg.cls}`}
                            >
                              {(["todo","in_progress","blocked","done","cancelled"] as WorkTaskStatus[]).map(s => (
                                <option key={s} value={s}>{TASK_STATUS_CFG[s].label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`text-[10px] font-semibold rounded px-1.5 py-1 ${tCfg.cls}`}>{tCfg.label}</span>
                          )}
                          {!readOnly && (
                            <button onClick={() => onDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Add task inline */}
                    {!readOnly && (
                      addingTaskFor === action.id ? (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="h-2 w-2 rounded-full bg-slate-200 shrink-0" />
                          <input
                            autoFocus
                            value={newTaskLabel}
                            onChange={e => setNewTaskLabel(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") submitTask(action.id);
                              if (e.key === "Escape") { setAddingTaskFor(null); setNewTaskLabel(""); }
                            }}
                            placeholder="Task title…"
                            className="flex-1 text-sm border-b border-blue-300 focus:outline-none py-0.5 bg-transparent"
                          />
                          <button onClick={() => submitTask(action.id)} className="text-green-600 hover:text-green-700">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setAddingTaskFor(null); setNewTaskLabel(""); }} className="text-slate-400">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingTaskFor(action.id)}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-500 transition-colors py-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add task
                        </button>
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── Materials Tab ──────────────────────────────────────────────────────────────

function MaterialsTab({
  materials, onConsumeUpdate, readOnly,
}: {
  materials: WorkActionMaterial[];
  onConsumeUpdate: (id: number, qty: number) => void;
  readOnly: boolean;
}) {
  const [editing, setEditing] = useState<Record<number, string>>({});

  if (materials.length === 0) {
    return (
      <div className="text-center py-12 text-slate-300">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No materials booked for this work order</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {materials.map(m => {
        const consumed = m.qty_issued !== null;
        return (
          <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border ${consumed ? "bg-green-50 border-green-100" : "bg-white border-slate-200"}`}>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600">{m.material_sku}</span>
                <span className="text-xs text-slate-500 truncate">{m.material_name}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Requested: {m.qty_requested}</p>
            </div>
            <div className="shrink-0 text-right">
              {consumed ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckSquare className="h-4 w-4" />
                  <span className="text-xs font-semibold">{m.qty_issued} issued</span>
                </div>
              ) : !readOnly ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min="0" max={m.qty_requested}
                    value={editing[m.id] ?? ""}
                    onChange={e => setEditing(ed => ({ ...ed, [m.id]: e.target.value }))}
                    placeholder="qty"
                    className="w-16 text-xs border border-slate-200 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-green-400"
                  />
                  <button
                    onClick={() => {
                      const qty = parseInt(editing[m.id], 10);
                      if (!isNaN(qty) && qty >= 0) { onConsumeUpdate(m.id, qty); setEditing(ed => { const n = {...ed}; delete n[m.id]; return n; }); }
                    }}
                    className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Not consumed</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Assignments Tab ────────────────────────────────────────────────────────────

function AssignmentsTab({
  wo, actions, assignments,
  onAssign, onUnassign, readOnly,
}: {
  wo: WorkOrder;
  actions: WorkAction[];
  assignments: WorkActionAssignment[];
  onAssign: (actionId: number, userId: number, userName: string, initials: string) => void;
  onUnassign: (assignmentId: number) => void;
  readOnly: boolean;
}) {
  const [addingFor, setAddingFor] = useState<number | null>(null);
  const [searchUser, setSearchUser] = useState("");

  const userOptions = mockUsers.map(u => ({
    id: u.id,
    name: `${u.first_name} ${u.last_name}`,
    initials: `${u.first_name[0]}${u.last_name[0]}`,
  })).filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase()));

  return (
    <div className="space-y-4">
      {actions.map((action, ai) => {
        const actionAssignments = assignments.filter(a => a.work_action_id === action.id);
        return (
          <div key={action.id} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
              <div>
                <p className="text-sm font-semibold text-slate-700 truncate">{action.address_summary}</p>
                <p className="text-xs text-slate-400">Action #{action.id}</p>
              </div>
              {!readOnly && (
                <button
                  onClick={() => setAddingFor(addingFor === action.id ? null : action.id)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Assign
                </button>
              )}
            </div>

            {/* Assignee search panel */}
            <AnimatePresence>
              {addingFor === action.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                  className="overflow-hidden border-t border-slate-100 bg-blue-50/50 px-4 py-3"
                >
                  <input
                    autoFocus value={searchUser} onChange={e => setSearchUser(e.target.value)}
                    placeholder="Search technician…"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                  />
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {userOptions.map(u => {
                      const alreadyAssigned = actionAssignments.some(a => a.user_id === u.id);
                      return (
                        <button
                          key={u.id} disabled={alreadyAssigned}
                          onClick={() => { onAssign(action.id, u.id, u.name, u.initials); setAddingFor(null); setSearchUser(""); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                            alreadyAssigned ? "opacity-40 cursor-not-allowed" : "hover:bg-blue-100"
                          }`}
                        >
                          <div className={`h-7 w-7 rounded-full ${AVATAR_COLORS[u.id % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                            {u.initials}
                          </div>
                          <span className="text-slate-700">{u.name}</span>
                          {alreadyAssigned && <span className="ml-auto text-[10px] text-slate-400">Assigned</span>}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Current assignees */}
            <div className="px-4 py-3 space-y-2">
              {actionAssignments.length === 0 ? (
                <p className="text-xs text-slate-300 italic">No technicians assigned</p>
              ) : (
                actionAssignments.map(a => (
                  <div key={a.id} className="flex items-center gap-2.5 group">
                    <div className={`h-8 w-8 rounded-full ${AVATAR_COLORS[a.user_id % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {a.user_initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">{a.user_name}</p>
                      <p className="text-[10px] text-slate-400">Assigned {a.assigned_at}</p>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => onUnassign(a.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}

      {actions.length === 0 && (
        <div className="text-center py-10 text-slate-300">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Add work actions first to assign technicians</p>
        </div>
      )}
    </div>
  );
}

// ─── Cancel Reason Modal ────────────────────────────────────────────────────────

function CancelReasonModal({ wo, onConfirm, onClose }: { wo: WorkOrder; onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Cancel Work Order</h2>
            <p className="text-xs text-slate-400">WO #{wo.id} · {wo.asset_name}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-4">Provide a reason for cancellation. It will be appended to the work order description and the WO archived.</p>
        <label className="text-xs font-medium text-slate-600 block mb-1.5">Reason for Cancellation <span className="text-red-500">*</span></label>
        <textarea
          value={reason} onChange={e => { setReason(e.target.value); setError(""); }}
          rows={3} autoFocus placeholder="e.g. Equipment repaired by OEM under warranty…"
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none ${error ? "border-red-400" : "border-slate-200"}`}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Keep Open</button>
          <button
            onClick={() => { if (!reason.trim()) { setError("Reason is required."); return; } onConfirm(reason.trim()); }}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
          >Cancel WO</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Drawer ────────────────────────────────────────────────────────────────

export interface WorkOrderDrawerProps {
  wo: WorkOrder;
  actions: WorkAction[];
  tasks: WorkTask[];
  assignments: WorkActionAssignment[];
  materials: WorkActionMaterial[];
  onClose: () => void;
  onStatusChange: (id: number, status: WOStatus, cancelReason?: string) => void;
  onUpdateActions: (actions: WorkAction[]) => void;
  onUpdateTasks: (tasks: WorkTask[]) => void;
  onUpdateAssignments: (assignments: WorkActionAssignment[]) => void;
  onUpdateMaterials: (materials: WorkActionMaterial[]) => void;
  onViewRCA?: (faultTreeId: number) => void;
}

export function WorkOrderDrawer({
  wo, actions, tasks, assignments, materials,
  onClose, onStatusChange,
  onUpdateActions, onUpdateTasks, onUpdateAssignments, onUpdateMaterials,
  onViewRCA,
}: WorkOrderDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>("diagnosis");
  const [comments, setComments] = useState<WorkOrderComment[]>(
    mockWorkOrderComments.filter(c => c.work_order_id === wo.id)
  );
  const [pendingCancel, setPendingCancel] = useState(false);
  const readOnly = isReadOnly(wo.status);

  // Filter data for this work order
  const woActions = actions.filter(a => a.work_order_id === wo.id);
  const woMats = materials.filter(m => m.work_order_id === wo.id);
  const woAssignments = assignments.filter(a => a.work_order_id === wo.id);
  const woTasks = tasks.filter(t => woActions.some(a => t.work_action_id === a.id));

  const pCfg = PRIORITY_CFG[wo.priority];
  const sCfg = STATUS_CFG[wo.status];

  // ── Status change (intercept cancellation) ──

  const handleStatusSelect = (s: WOStatus) => {
    if (s === "cancelled") { setPendingCancel(true); return; }
    onStatusChange(wo.id, s);
    setComments(c => [...c, {
      id: Math.max(0, ...c.map(x => x.id)) + 1,
      work_order_id: wo.id, kind: "status",
      author_name: "You", author_initials: "ME",
      body: `Moved status to ${STATUS_CFG[s].label}.`,
      created_at: new Date().toISOString(),
    }]);
  };

  const handleConfirmCancel = (reason: string) => {
    onStatusChange(wo.id, "cancelled", reason);
    setComments(c => [...c, {
      id: Math.max(0, ...c.map(x => x.id)) + 1,
      work_order_id: wo.id, kind: "status",
      author_name: "You", author_initials: "ME",
      body: `Cancelled work order. Reason: ${reason}`,
      created_at: new Date().toISOString(),
    }]);
    setPendingCancel(false);
  };

  const handleAddComment = (body: string) => {
    setComments(c => [...c, {
      id: Math.max(0, ...c.map(x => x.id)) + 1,
      work_order_id: wo.id, kind: "comment",
      author_name: "You", author_initials: "ME",
      body, created_at: new Date().toISOString(),
    }]);
    toast.success("Comment added");
  };

  // ── Action handlers ──

  const handleAddAction = () => {
    const newAction: WorkAction = {
      id: Math.max(...actions.map(a => a.id), 100) + 1,
      work_order_id: wo.id,
      status: "proposed",
      address_summary: "New Work Area",
      description: "",
      planned_shift_id: null,
    };
    onUpdateActions([...actions, newAction]);
  };

  const handleDeleteAction = (id: number) => {
    onUpdateActions(actions.filter(a => a.id !== id));
    onUpdateTasks(tasks.filter(t => t.work_action_id !== id));
    onUpdateAssignments(assignments.filter(a => a.work_action_id !== id));
  };

  const handleActionStatus = (id: number, status: WorkActionStatus) => {
    onUpdateActions(actions.map(a => a.id === id ? { ...a, status } : a));
  };

  // ── Task handlers ──

  const handleAddTask = (actionId: number, label: string) => {
    const actionTasks = tasks.filter(t => t.work_action_id === actionId);
    const newTask: WorkTask = {
      id: Math.max(...tasks.map(t => t.id), 200) + 1,
      work_action_id: actionId,
      status: "todo",
      sequence: actionTasks.length + 1,
      label,
      description: "",
    };
    onUpdateTasks([...tasks, newTask]);
  };

  const handleTaskStatus = (taskId: number, status: WorkTaskStatus) => {
    onUpdateTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
    toast.success(`Task marked ${status.replace("_", " ")}`);
  };

  const handleDeleteTask = (taskId: number) => {
    onUpdateTasks(tasks.filter(t => t.id !== taskId));
  };

  // ── Assignment handlers ──

  const handleAssign = (actionId: number, userId: number, userName: string, initials: string) => {
    const newAssignment: WorkActionAssignment = {
      id: Math.max(...assignments.map(a => a.id), 300) + 1,
      work_action_id: actionId,
      user_id: userId,
      user_name: userName,
      user_initials: initials,
      assigned_at: new Date().toISOString().split("T")[0],
    };
    onUpdateAssignments([...assignments, newAssignment]);
    toast.success(`${userName} assigned`);
  };

  const handleUnassign = (assignmentId: number) => {
    onUpdateAssignments(assignments.filter(a => a.id !== assignmentId));
  };

  // ── Material consume ──

  const handleConsumeUpdate = (id: number, qty: number) => {
    onUpdateMaterials(materials.map(m => m.id === id ? { ...m, qty_issued: qty } : m));
    toast.success("Consumption recorded");
  };

  // ── RCA link ──

  const handleViewRCA = () => {
    if (!wo.asset_fault_id) return;
    const ft = mockFaultTrees.find(t => t.asset_fault_id === wo.asset_fault_id);
    if (ft && onViewRCA) onViewRCA(ft.id);
  };

  const TABS: { key: DrawerTab; label: string; count?: number }[] = [
    { key: "diagnosis", label: "Diagnosis & Evidence" },
    { key: "info", label: "General Info" },
    { key: "actions", label: "Actions & Tasks", count: woTasks.length },
    { key: "materials", label: "Materials", count: woMats.length },
    { key: "assignments", label: "Assignments", count: woAssignments.length },
  ];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col border-l"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs text-slate-400">WO #{wo.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${pCfg.cls}`}>{pCfg.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sCfg.cls}`}>{sCfg.label}</span>
              </div>
              <h2 className="font-bold text-slate-800 leading-snug line-clamp-2">{wo.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{wo.asset_name} · {wo.location_name}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 shrink-0 mt-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 mt-4 -mb-4 border-b-0">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${tab === t.key ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "diagnosis" && (
            <DiagnosisTab
              wo={wo}
              onViewFailureEvent={handleViewRCA}
            />
          )}
          {tab === "info" && (
            <InfoTab
              wo={wo}
              onStatusChange={handleStatusSelect}
              readOnly={readOnly}
              comments={comments}
              onAddComment={handleAddComment}
            />
          )}
          {tab === "actions" && (
            <ActionsTab
              wo={wo} actions={woActions} tasks={woTasks}
              onAddAction={handleAddAction}
              onDeleteAction={handleDeleteAction}
              onUpdateActionStatus={handleActionStatus}
              onAddTask={handleAddTask}
              onTaskStatus={handleTaskStatus}
              onDeleteTask={handleDeleteTask}
              readOnly={readOnly}
            />
          )}
          {tab === "materials" && (
            <MaterialsTab
              materials={materials}
              onConsumeUpdate={handleConsumeUpdate}
              readOnly={readOnly}
            />
          )}
          {tab === "assignments" && (
            <AssignmentsTab
              wo={wo} actions={actions} assignments={assignments}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
              readOnly={readOnly}
            />
          )}
        </div>

        {/* Read-only banner */}
        {readOnly && (
          <div className="px-6 py-3 border-t bg-slate-50 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
              This work order is <span className="font-semibold">{sCfg.label.toLowerCase()}</span> and is read-only.
            </div>
          </div>
        )}
      </motion.div>

      {/* Cancel reason modal */}
      <AnimatePresence>
        {pendingCancel && (
          <CancelReasonModal
            wo={wo}
            onConfirm={handleConfirmCancel}
            onClose={() => setPendingCancel(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
