import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Inbox,
  Clock,
  Gauge,
  TriangleAlert,
  CircleCheck,
  Loader2,
  Cpu,
  Hand,
  Activity,
  Link2,
  Lock,
  X,
  ClipboardList,
  Package,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { cn } from "./ui/utils";

// --- FMEA Dictionary (mirrors Failure Dictionary Admin) ---
const FAILURE_MODES = [
  { id: 1, code: "BRG-01", label: "Bearing Seizure" },
  { id: 2, code: "LEAK-01", label: "External Leakage" },
  { id: 3, code: "VIB-01", label: "Excessive Vibration" },
];

const FAILURE_CAUSES = [
  { id: 1, code: "LUB-LOSS", label: "Loss of Lubrication" },
  { id: 2, code: "MISALIGN", label: "Shaft Misalignment" },
  { id: 3, code: "WEAR", label: "Normal Wear & Tear" },
];

type EventStatus = "open" | "approved" | "rejected";
type FmeaStatus = "suspected" | "confirmed" | "rejected";
type WOPriority = "1" | "2" | "3";

interface Evidence {
  evidence_kind: string;
  note: string;
  confidence?: number;
}

interface FailureEvent {
  id: number;
  site_id: number;
  asset_id: number;
  asset_name: string;
  detected_at: string;
  downtime_minutes: number;
  description: string;
  status: EventStatus;
  kind: string;
  source: string;
  asset_fault_id?: number;
  work_order_id?: number;
  // FMEA path
  failure_mode_id?: number;
  failure_cause_id?: number;
  fmea_status: FmeaStatus;
  confidence?: number;
  fmea_source: "manual" | "ai";
  evidence: Evidence[];
}

const INITIAL_EVENTS: FailureEvent[] = [
  {
    id: 105,
    site_id: 2,
    asset_id: 88,
    asset_name: "Cooling Water Pump P-101",
    detected_at: "2024-05-21T10:00:00",
    downtime_minutes: 120,
    description: "High vibration on NDE bearing",
    status: "open",
    kind: "standard",
    source: "sensor",
    asset_fault_id: 15,
    fmea_status: "suspected",
    confidence: 0.92,
    fmea_source: "ai",
    failure_mode_id: 1,
    evidence: [
      { evidence_kind: "sensor", note: "Vibration RMS exceeded 7.1 mm/s threshold for 15 min", confidence: 0.92 },
      { evidence_kind: "ai", note: "ML model flagged bearing degradation pattern", confidence: 0.92 },
    ],
  },
  {
    id: 106,
    site_id: 2,
    asset_id: 42,
    asset_name: "Boiler Feed Pump P-204",
    detected_at: "2024-05-21T08:30:00",
    downtime_minutes: 45,
    description: "Seal leakage observed during walkdown",
    status: "open",
    kind: "standard",
    source: "manual",
    fmea_status: "suspected",
    confidence: 0.38,
    fmea_source: "ai",
    failure_mode_id: 2,
    evidence: [
      { evidence_kind: "manual", note: "Operator reported fluid pooling under mechanical seal" },
      { evidence_kind: "ai", note: "Low-confidence correlation with pressure drop", confidence: 0.38 },
    ],
  },
  {
    id: 107,
    site_id: 2,
    asset_id: 12,
    asset_name: "Conveyor Motor M-09",
    detected_at: "2024-05-20T22:15:00",
    downtime_minutes: 0,
    description: "Intermittent high current draw anomaly",
    status: "open",
    kind: "standard",
    source: "sensor",
    fmea_status: "suspected",
    fmea_source: "manual",
    evidence: [
      { evidence_kind: "sensor", note: "Current spikes detected on phase B, no clear pattern" },
    ],
  },
];

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

function ConfidenceBadge({ confidence, compact = false }: { confidence?: number; compact?: boolean }) {
  if (confidence === undefined) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const pct = Math.round(confidence * 100);
  if (confidence >= 0.8) {
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{compact ? `${pct}%` : `High · ${pct}%`}</Badge>;
  }
  if (confidence < 0.5) {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        <TriangleAlert className="h-3 w-3 mr-1" />
        {compact ? `Low ${pct}%` : `Low AI Confidence (${pct}%) — Manual verification required`}
      </Badge>
    );
  }
  return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{compact ? `${pct}%` : `AI Confidence · ${pct}%`}</Badge>;
}

function StatusBadge({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, string> = {
    open: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    approved: "bg-green-100 text-green-700 hover:bg-green-100",
    rejected: "bg-slate-200 text-slate-600 hover:bg-slate-200",
  };
  return <Badge className={map[status]}>{status.toUpperCase()}</Badge>;
}

// --- Locked tab empty state ---
function LockedTab({ icon: Icon, title, cta }: { icon: typeof Lock; title: string; cta: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-3">
      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <Icon className="h-7 w-7 text-slate-300" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 border-2 border-white">
          <Lock className="h-3 w-3 text-slate-500" />
        </div>
      </div>
      <h3 className="font-semibold text-slate-700">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs">{cta}</p>
    </div>
  );
}

// --- List/Grid loading skeleton ---
function ListSkeleton() {
  return (
    <div className="divide-y">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded" />
          <div className="h-4 flex-1 bg-slate-200 rounded" />
          <div className="h-5 w-24 bg-slate-200 rounded-full" />
        </div>
      ))}
    </div>
  );
}

interface FailureEventsProps {
  isAdmin?: boolean;
  canEdit?: boolean;
}

export function FailureEvents({ canEdit = true }: FailureEventsProps) {
  const [events, setEvents] = useState<FailureEvent[]>(INITIAL_EVENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("diagnosis");

  // Diagnosis draft state
  const [draftModeId, setDraftModeId] = useState<string>("");
  const [draftCauseId, setDraftCauseId] = useState<string>("");
  const [modeError, setModeError] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);

  // WO draft (General Info tab)
  const [draftTitle, setDraftTitle] = useState("");
  const [draftPriority, setDraftPriority] = useState<WOPriority>("2");

  // Reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const openEvents = useMemo(() => events.filter((e) => e.status === "open"), [events]);
  const selected = events.find((e) => e.id === selectedId) ?? null;

  // Simulate initial data load
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Deep-linking: read selectedId from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("selectedId");
    if (idParam) {
      const id = Number(idParam);
      const ev = INITIAL_EVENTS.find((e) => e.id === id && e.status === "open");
      if (ev) openDrawer(ev);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist selectedId in the URL without a page reload
  const syncUrl = (id: number | null) => {
    const params = new URLSearchParams(window.location.search);
    if (id === null) params.delete("selectedId");
    else params.set("selectedId", String(id));
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

  const openDrawer = (event: FailureEvent) => {
    setSelectedId(event.id);
    setActiveTab("diagnosis");
    setDraftModeId(event.failure_mode_id ? String(event.failure_mode_id) : "");
    setDraftCauseId(event.failure_cause_id ? String(event.failure_cause_id) : "");
    setDraftTitle(`${event.asset_name} — ${event.description}`);
    setDraftPriority(event.downtime_minutes >= 60 ? "1" : "2");
    setModeError("");
    syncUrl(event.id);
  };

  const closeDrawer = () => {
    setSelectedId(null);
    syncUrl(null);
  };

  const handleApprove = () => {
    if (!selected) return;
    if (!draftModeId) {
      setModeError("Diagnosis is required to create a Work Order");
      setActiveTab("diagnosis");
      return;
    }
    setIsPromoting(true);
    // Simulate API call to /promote
    setTimeout(() => {
      const newWoId = 2000 + selected.id;
      setEvents((prev) =>
        prev.map((e) =>
          e.id === selected.id
            ? {
                ...e,
                status: "approved",
                fmea_status: "confirmed",
                failure_mode_id: Number(draftModeId),
                failure_cause_id: draftCauseId ? Number(draftCauseId) : undefined,
                work_order_id: newWoId,
              }
            : e
        )
      );
      setIsPromoting(false);
      closeDrawer();
      toast.success(`Work Order #${newWoId} created and set to pending.`);
    }, 1000);
  };

  const handleReject = () => {
    if (!selected) return;
    setEvents((prev) =>
      prev.map((e) => (e.id === selected.id ? { ...e, status: "rejected", fmea_status: "rejected" } : e))
    );
    setRejectOpen(false);
    setRejectReason("");
    closeDrawer();
    toast.success("Failure event rejected.");
  };

  const modeLabel = (id?: number) => FAILURE_MODES.find((m) => m.id === id)?.label;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header / Breadcrumbs */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
        <p className="text-xs text-slate-500">Home / Work Execution / Failure Events</p>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-2xl font-semibold">Failure Events</h1>
            <p className="text-sm text-slate-600 mt-1">
              Review incoming anomaly reports, diagnose root causes, and approve them into Work Orders.
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Inbox className="h-4 w-4 mr-1.5" />
            {openEvents.length} open
          </Badge>
        </div>
      </div>

      {/* Data Grid / Master Table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ListSkeleton />
        ) : openEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-full p-8 gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CircleCheck className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Inbox Zero!</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              No open failure events. Assets are running smoothly.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-6 py-3">Asset</th>
                <th className="text-left font-medium px-4 py-3">Detected</th>
                <th className="text-left font-medium px-4 py-3">Downtime</th>
                <th className="text-left font-medium px-4 py-3">Symptom</th>
                <th className="text-left font-medium px-4 py-3">AI Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {openEvents.map((event) => (
                <tr
                  key={event.id}
                  onClick={() => openDrawer(event)}
                  className={cn(
                    "cursor-pointer transition-all hover:bg-slate-50 hover:shadow-sm",
                    selectedId === event.id && "bg-blue-50/60"
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{event.asset_name}</div>
                    <div className="text-xs text-slate-400 mt-0.5 capitalize flex items-center gap-1">
                      <Activity className="h-3 w-3" /> {event.source} · Asset #{event.asset_id}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {relativeTime(event.detected_at)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{event.downtime_minutes} min</td>
                  <td className="px-4 py-4 text-slate-600 max-w-xs">
                    <span className="line-clamp-1">{event.description}</span>
                  </td>
                  <td className="px-4 py-4">
                    <ConfidenceBadge confidence={event.confidence} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Side Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={closeDrawer}
            />

            {/* Drawer */}
            <motion.div
              key={selected.id}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed right-0 top-0 h-full w-full md:w-1/2 bg-white shadow-2xl z-50 flex flex-col border-l"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold truncate">{selected.asset_name}</h2>
                      <StatusBadge status={selected.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Event #{selected.id} · Asset ID {selected.asset_id} · Detected{" "}
                      {new Date(selected.detected_at).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={closeDrawer} className="text-slate-400 hover:text-slate-700 shrink-0 mt-1">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="rounded-lg border p-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" /> Downtime
                    </div>
                    <p className="text-base font-semibold mt-0.5">{selected.downtime_minutes} min</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Activity className="h-3.5 w-3.5" /> Source
                    </div>
                    <p className="text-base font-semibold mt-0.5 capitalize">{selected.source}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Gauge className="h-3.5 w-3.5" /> Kind
                    </div>
                    <p className="text-base font-semibold mt-0.5 capitalize">{selected.kind}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 pt-3 shrink-0">
                  <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="diagnosis">Diagnosis &amp; Evidence</TabsTrigger>
                    <TabsTrigger value="info">General Info</TabsTrigger>
                    <TabsTrigger value="actions" className="gap-1">
                      <Lock className="h-3 w-3" /> Actions
                    </TabsTrigger>
                    <TabsTrigger value="materials" className="gap-1">
                      <Lock className="h-3 w-3" /> Materials
                    </TabsTrigger>
                    <TabsTrigger value="assignments" className="gap-1">
                      <Lock className="h-3 w-3" /> Assignments
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {/* Tab 1: Diagnosis & Evidence */}
                  <TabsContent value="diagnosis" className="mt-0 space-y-5">
                    {/* AI suggestion */}
                    {selected.fmea_source === "ai" && selected.confidence !== undefined && (
                      <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
                        <div>
                          <p className="text-sm font-medium">AI Suggested Diagnosis</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Suggested mode: {modeLabel(selected.failure_mode_id) ?? "—"}
                          </p>
                        </div>
                        <ConfidenceBadge confidence={selected.confidence} />
                      </div>
                    )}

                    {selected.confidence !== undefined && (
                      <div>
                        <Label className="text-xs text-slate-500">AI Confidence Score</Label>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Progress value={selected.confidence * 100} className="h-2" />
                          <span className="text-sm font-medium w-10 text-right">
                            {Math.round(selected.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* FMEA dropdowns */}
                    <div className="space-y-2">
                      <Label htmlFor="mode">Failure Mode *</Label>
                      <Select
                        value={draftModeId}
                        onValueChange={(v) => {
                          setDraftModeId(v);
                          setModeError("");
                        }}
                        disabled={!canEdit}
                      >
                        <SelectTrigger id="mode" className={cn(modeError && "border-red-500 ring-1 ring-red-500")}>
                          <SelectValue placeholder="Select a failure mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {FAILURE_MODES.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.label} ({m.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {modeError && <p className="text-xs text-red-600">{modeError}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cause">Failure Cause</Label>
                      <Select value={draftCauseId} onValueChange={setDraftCauseId} disabled={!canEdit}>
                        <SelectTrigger id="cause">
                          <SelectValue placeholder="Select a cause (optional — may be unknown until tear-down)" />
                        </SelectTrigger>
                        <SelectContent>
                          {FAILURE_CAUSES.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.label} ({c.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Partial diagnosis is allowed. The exact cause can be confirmed later.
                      </p>
                    </div>

                    {/* Evidence */}
                    <div>
                      <Label className="text-xs text-slate-500">Evidence</Label>
                      <div className="space-y-2 mt-2">
                        {selected.evidence.map((ev, idx) => (
                          <div key={idx} className="flex items-start gap-3 rounded-lg border p-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 flex-shrink-0">
                              {ev.evidence_kind === "ai" ? (
                                <Cpu className="h-4 w-4 text-slate-600" />
                              ) : ev.evidence_kind === "manual" ? (
                                <Hand className="h-4 w-4 text-slate-600" />
                              ) : (
                                <Activity className="h-4 w-4 text-slate-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {ev.evidence_kind}
                                </Badge>
                                {ev.confidence !== undefined && (
                                  <span className="text-xs text-slate-400">
                                    {Math.round(ev.confidence * 100)}% confidence
                                  </span>
                                )}
                              </div>
                              <p className="text-sm mt-1">{ev.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 2: General Info (WO draft) */}
                  <TabsContent value="info" className="mt-0 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="wo-title">Work Order Title</Label>
                      <Input
                        id="wo-title"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        placeholder="Describe the work to be performed"
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wo-priority">Priority</Label>
                      <Select value={draftPriority} onValueChange={(v) => setDraftPriority(v as WOPriority)} disabled={!canEdit}>
                        <SelectTrigger id="wo-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 — High</SelectItem>
                          <SelectItem value="2">2 — Medium</SelectItem>
                          <SelectItem value="3">3 — Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wo-symptom">Symptom Description</Label>
                      <Textarea id="wo-symptom" value={selected.description} rows={3} readOnly className="bg-slate-50" />
                    </div>
                    {selected.asset_fault_id && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Link2 className="h-4 w-4" />
                        Linked to Fault Tree node #{selected.asset_fault_id}
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 3-5: Locked */}
                  <TabsContent value="actions" className="mt-0">
                    <LockedTab icon={ClipboardList} title="Actions & Tasks Locked" cta="Approve to unlock Tasks. Once a Work Order is created, you can plan actions and tasks here." />
                  </TabsContent>
                  <TabsContent value="materials" className="mt-0">
                    <LockedTab icon={Package} title="Materials Locked" cta="Approve to unlock Materials. Reserve and consume spare parts after the Work Order is created." />
                  </TabsContent>
                  <TabsContent value="assignments" className="mt-0">
                    <LockedTab icon={Users} title="Assignments Locked" cta="Approve to unlock Assignments. Assign technicians to the Work Order once it exists." />
                  </TabsContent>
                </div>
              </Tabs>

              {/* Sticky bottom action bar */}
              {canEdit && (
                <div className="px-6 py-4 border-t bg-white shrink-0 flex items-center gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={isPromoting}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    {isPromoting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Work Order...
                      </>
                    ) : (
                      <>
                        <CircleCheck className="h-4 w-4 mr-2" />
                        Approve &amp; Create WO
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectOpen(true)}
                    disabled={isPromoting}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Reject Event
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reject modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Failure Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this event? Provide a reason (e.g., false positive).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Sensor miscalibration, not an actual failure."
              rows={3}
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
