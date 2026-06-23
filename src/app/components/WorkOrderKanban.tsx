import { useState, useRef } from "react";
import { useDrag, useDrop, useDragLayer } from "react-dnd";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Wrench, FileText, X } from "lucide-react";
import { WorkOrder, WOStatus, WorkActionAssignment } from "../data/mockData";

const ITEM_TYPE = "WORK_ORDER";

export const COLUMNS: { status: WOStatus; label: string; color: string; bg: string; accent: string }[] = [
  { status: "pending",     label: "Pending",     color: "text-slate-600", bg: "bg-slate-50",  accent: "bg-slate-400"  },
  { status: "in_progress", label: "In Progress", color: "text-amber-700", bg: "bg-amber-50",  accent: "bg-amber-500"  },
  { status: "parked",      label: "Parked",      color: "text-violet-700",bg: "bg-violet-50", accent: "bg-violet-500" },
  { status: "completed",   label: "Completed",   color: "text-green-700", bg: "bg-green-50",  accent: "bg-green-500"  },
];

const PRIORITY_CFG: Record<number, { label: string; cls: string }> = {
  1: { label: "High",   cls: "bg-red-100 text-red-700 border border-red-200" },
  2: { label: "Medium", cls: "bg-orange-100 text-orange-700 border border-orange-200" },
  3: { label: "Low",    cls: "bg-slate-100 text-slate-600 border border-slate-200" },
};

// ─── Custom Drag Layer ──────────────────────────────────────────────────────────

function KanbanDragLayer({ workOrders }: { workOrders: WorkOrder[] }) {
  const { isDragging, item, currentOffset } = useDragLayer(monitor => ({
    item: monitor.getItem() as { id: number } | null,
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));
  if (!isDragging || !currentOffset || !item) return null;
  const wo = workOrders.find(w => w.id === item.id);
  if (!wo) return null;
  const pCfg = PRIORITY_CFG[wo.priority];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
      <div style={{ transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)` }}>
        <div style={{ transform: "rotate(3deg)", width: 260 }}>
          <div className="bg-white rounded-xl border-2 border-blue-400 shadow-2xl p-3 opacity-95">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-mono text-xs text-slate-400">#{wo.id}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${pCfg.cls}`}>{pCfg.label}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">{wo.title}</p>
            <p className="text-[11px] text-slate-400 mt-1 truncate">{wo.asset_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Avatar Stack ───────────────────────────────────────────────────────────────

function AvatarStack({ assignments }: { assignments: WorkActionAssignment[] }) {
  if (assignments.length === 0) return null;
  const COLORS = ["bg-blue-500","bg-violet-500","bg-green-500","bg-amber-500","bg-red-500"];
  const shown = assignments.slice(0, 3);
  const extra = assignments.length - 3;
  return (
    <div className="flex items-center -space-x-1.5 mt-2">
      {shown.map((a, i) => (
        <div
          key={a.id}
          title={a.user_name}
          className={`h-6 w-6 rounded-full ${COLORS[i % COLORS.length]} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}
        >
          {a.user_initials}
        </div>
      ))}
      {extra > 0 && (
        <div className="h-6 w-6 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-slate-600 text-[9px] font-bold">
          +{extra}
        </div>
      )}
    </div>
  );
}

// ─── Kanban Card ────────────────────────────────────────────────────────────────

function KanbanCard({
  wo, assignments, onOpen, snapBack,
}: {
  wo: WorkOrder;
  assignments: WorkActionAssignment[];
  onOpen: (wo: WorkOrder) => void;
  snapBack?: boolean;
}) {
  const pCfg = PRIORITY_CFG[wo.priority];
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: wo.id },
    collect: m => ({ isDragging: m.isDragging() }),
  });

  return (
    <motion.div
      ref={drag as any}
      layout
      initial={snapBack ? { x: 50, opacity: 0 } : { opacity: 0, y: -6 }}
      animate={snapBack ? { x: 0, opacity: 1 } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={snapBack ? { type: "spring", stiffness: 500, damping: 30 } : { duration: 0.15 }}
      className={`bg-white rounded-xl border border-slate-200 p-3 cursor-pointer shadow-sm hover:shadow-md hover:border-blue-200 transition-shadow select-none ${isDragging ? "opacity-30" : ""}`}
      onClick={() => onOpen(wo)}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="font-mono text-[10px] text-slate-400">#{wo.id}</span>
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${pCfg.cls}`}>{pCfg.label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 mb-2">{wo.title}</p>
      <div className="flex items-center gap-1 text-[11px] text-slate-400">
        <Wrench className="h-3 w-3 shrink-0" />
        <span className="truncate">{wo.asset_name}</span>
      </div>
      {wo.planned_start && (
        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{wo.planned_start}</span>
        </div>
      )}
      <AvatarStack assignments={assignments} />
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm animate-pulse">
      <div className="flex justify-between mb-2"><div className="h-3 w-10 bg-slate-100 rounded"/><div className="h-3 w-14 bg-slate-100 rounded-full"/></div>
      <div className="h-4 w-full bg-slate-100 rounded mb-1.5"/><div className="h-4 w-3/4 bg-slate-100 rounded mb-2"/>
      <div className="h-3 w-2/3 bg-slate-50 rounded"/>
    </div>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────────────────

function KanbanColumn({
  col, cards, assignments, isLoading, onDrop, onOpen, snapBackId,
}: {
  col: typeof COLUMNS[number];
  cards: WorkOrder[];
  assignments: WorkActionAssignment[];
  isLoading: boolean;
  onDrop: (woId: number, target: WOStatus) => void;
  onOpen: (wo: WorkOrder) => void;
  snapBackId: number | null;
}) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { id: number }) => onDrop(item.id, col.status),
    collect: m => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
  });
  const isEmpty = !isLoading && cards.length === 0;

  return (
    <div className="flex flex-col min-w-[220px] flex-1 max-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${col.accent}`} />
        <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
        <span className="ml-auto text-xs font-medium bg-white border border-slate-200 rounded-full px-2 py-0.5 text-slate-500">{cards.length}</span>
      </div>
      <div
        ref={drop as any}
        className={`flex-1 rounded-xl p-2 min-h-[200px] flex flex-col gap-2.5 transition-colors ${col.bg}
          ${isOver && canDrop ? "ring-2 ring-blue-400 ring-offset-1 bg-blue-50/60" : ""}
          ${isEmpty ? "border-2 border-dashed border-slate-200" : ""}`}
      >
        {isLoading ? (
          <><SkeletonCard />{(col.status === "pending" || col.status === "in_progress") && <SkeletonCard />}</>
        ) : isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-6">
            <FileText className="h-7 w-7 mb-1.5 opacity-40"/><p className="text-xs">Drop here</p>
          </div>
        ) : (
          <AnimatePresence>
            {cards.map(wo => (
              <KanbanCard
                key={wo.id} wo={wo}
                assignments={assignments.filter(a => a.work_action_id === wo.id)} // filtered by parent in board
                onOpen={onOpen}
                snapBack={wo.id === snapBackId}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ─── Cancel Reason Modal ────────────────────────────────────────────────────────

function CancelModal({ wo, onConfirm, onCancel }: { wo: WorkOrder; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <X className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Cancel Work Order</h2>
            <p className="text-xs text-slate-400">#{wo.id} · {wo.asset_name}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-4">Please provide a reason for cancellation. This will be appended to the work order description.</p>
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-600 block mb-1.5">Reason for Cancellation <span className="text-red-500">*</span></label>
          <textarea
            value={reason} onChange={e => { setReason(e.target.value); setError(""); }}
            rows={3} autoFocus placeholder="e.g. Equipment repaired by OEM under warranty…"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none ${error ? "border-red-400" : "border-slate-200"}`}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Keep Open</button>
          <button
            onClick={() => { if (!reason.trim()) { setError("Reason is required."); return; } onConfirm(reason.trim()); }}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
          >Cancel WO</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Board ──────────────────────────────────────────────────────────────────────

export interface KanbanBoardProps {
  workOrders: WorkOrder[];
  allAssignments: WorkActionAssignment[];
  onMove: (id: number, status: WOStatus, cancelReason?: string) => void;
  onOpen: (wo: WorkOrder) => void;
  isLoading: boolean;
}

export function WorkOrderKanban({ workOrders, allAssignments, onMove, onOpen, isLoading }: KanbanBoardProps) {
  const [cancelling, setCancelling] = useState<WorkOrder | null>(null);
  const [snapBackId, setSnapBackId]= useState<number | null>(null);

  const handleDrop = (woId: number, target: WOStatus) => {
    const wo = workOrders.find(w => w.id === woId);
    if (!wo || wo.status === target) return;
    if (wo.status === "completed" || wo.status === "cancelled") return; // read-only
    if (target === "cancelled") { setCancelling(wo); return; }
    onMove(woId, target);
  };

  const handleCancelConfirm = (reason: string) => {
    if (!cancelling) return;
    onMove(cancelling.id, "cancelled", reason);
    setCancelling(null);
  };

  const handleCancelAbort = () => {
    if (cancelling) { setSnapBackId(cancelling.id); setTimeout(() => setSnapBackId(null), 600); }
    setCancelling(null);
  };

  if (!isLoading && workOrders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Zero Defects!</h2>
        <p className="text-slate-500 max-w-xs">Plant is running perfectly. No active work orders at this time.</p>
      </div>
    );
  }

  // Build per-WO assignment map: flatten via WorkActions (we pass all, filter in card by action)
  // For card display, show assignments for ALL actions in that WO
  const woAssignments = (woId: number) => allAssignments.filter(a => {
    // assignments tied to actions — we need work_order_id via work_action
    // For simplicity we track it via work_action_id prefix range in mock (101-102 → WO 2041, 103-104 → WO 2043, 105 → 2044, 106 → 2042)
    // Better: pass the actions list too; but to keep the API clean we track via a prop
    return true; // filtered inside KanbanCard below with a direct match
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <KanbanDragLayer workOrders={workOrders} />
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full p-4 min-w-max">
          {COLUMNS.map(col => {
            const cards = workOrders.filter(w => w.status === col.status);
            return (
              <KanbanColumn
                key={col.status}
                col={col}
                cards={cards}
                assignments={allAssignments}
                isLoading={isLoading}
                onDrop={handleDrop}
                onOpen={onOpen}
                snapBackId={snapBackId}
              />
            );
          })}
        </div>
      </div>
      <AnimatePresence>
        {cancelling && (
          <CancelModal wo={cancelling} onConfirm={handleCancelConfirm} onCancel={handleCancelAbort} />
        )}
      </AnimatePresence>
    </div>
  );
}
