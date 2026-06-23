import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
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
  unread?: boolean;
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
    unread: true,
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
    unread: true,
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

function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence === undefined) return null;
  const pct = Math.round(confidence * 100);
  if (confidence >= 0.8) {
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">High AI Confidence · {pct}%</Badge>;
  }
  if (confidence < 0.5) {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        <TriangleAlert className="h-3 w-3 mr-1" />
        Low AI Confidence ({pct}%) — Manual verification required
      </Badge>
    );
  }
  return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">AI Confidence · {pct}%</Badge>;
}

function StatusBadge({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, string> = {
    open: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    approved: "bg-green-100 text-green-700 hover:bg-green-100",
    rejected: "bg-slate-200 text-slate-600 hover:bg-slate-200",
  };
  return <Badge className={map[status]}>{status.toUpperCase()}</Badge>;
}

interface FailureEventsProps {
  isAdmin?: boolean;
  canEdit?: boolean;
}

export function FailureEvents({ canEdit = true }: FailureEventsProps) {
  const [events, setEvents] = useState<FailureEvent[]>(INITIAL_EVENTS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("symptom");

  // Diagnosis draft state
  const [draftModeId, setDraftModeId] = useState<string>("");
  const [draftCauseId, setDraftCauseId] = useState<string>("");
  const [modeError, setModeError] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);

  // Reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const openEvents = useMemo(() => events.filter((e) => e.status === "open"), [events]);
  const selected = events.find((e) => e.id === selectedId) ?? null;

  const handleSelect = (event: FailureEvent) => {
    setSelectedId(event.id);
    setActiveTab("symptom");
    setDraftModeId(event.failure_mode_id ? String(event.failure_mode_id) : "");
    setDraftCauseId(event.failure_cause_id ? String(event.failure_cause_id) : "");
    setModeError("");
    // mark as read
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, unread: false } : e)));
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
      setSelectedId(null);
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
    setSelectedId(null);
    toast.success("Failure event rejected.");
  };

  const modeLabel = (id?: number) => FAILURE_MODES.find((m) => m.id === id)?.label;

  return (
    <div className="flex flex-col h-full overflow-hidden">
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

      <div className="flex flex-1 overflow-hidden">
        {/* Left pane: list */}
        <div className="w-full md:w-[340px] flex-shrink-0 border-r overflow-y-auto bg-slate-50">
          {openEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full p-8 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CircleCheck className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="font-semibold">Inbox Zero!</h3>
              <p className="text-sm text-slate-500">
                No open failure events. Assets are running smoothly.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {openEvents.map((event) => (
                <li key={event.id}>
                  <button
                    onClick={() => handleSelect(event)}
                    className={cn(
                      "w-full text-left p-4 transition-colors hover:bg-white border-l-2",
                      selectedId === event.id
                        ? "bg-white border-l-blue-600"
                        : event.unread
                          ? "border-l-blue-400"
                          : "border-l-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{event.asset_name}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {relativeTime(event.detected_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {event.source}
                      </Badge>
                      {event.confidence !== undefined && event.confidence < 0.5 && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                          Low confidence
                        </Badge>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right pane: detail */}
        <div className="flex-1 overflow-y-auto hidden md:block">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Inbox className="h-7 w-7 text-slate-400" />
              </div>
              <h3 className="font-semibold">Select an event</h3>
              <p className="text-sm text-slate-500">
                Choose a failure event from the list to review evidence and diagnose.
              </p>
            </div>
          ) : (
            <div key={selected.id} className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{selected.asset_name}</h2>
                    <StatusBadge status={selected.status} />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Event #{selected.id} · Asset ID {selected.asset_id} · Detected{" "}
                    {new Date(selected.detected_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4 mt-5">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" /> Downtime
                  </div>
                  <p className="text-lg font-semibold mt-1">{selected.downtime_minutes} min</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Activity className="h-3.5 w-3.5" /> Source
                  </div>
                  <p className="text-lg font-semibold mt-1 capitalize">{selected.source}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Gauge className="h-3.5 w-3.5" /> Kind
                  </div>
                  <p className="text-lg font-semibold mt-1 capitalize">{selected.kind}</p>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList>
                  <TabsTrigger value="symptom">Symptom &amp; Evidence</TabsTrigger>
                  <TabsTrigger value="diagnosis">Diagnosis (FMEA)</TabsTrigger>
                </TabsList>

                <TabsContent value="symptom" className="mt-4 space-y-4">
                  <div>
                    <Label className="text-xs text-slate-500">Symptom Description</Label>
                    <p className="text-sm mt-1">{selected.description}</p>
                  </div>
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

                <TabsContent value="diagnosis" className="mt-4 space-y-5">
                  {selected.fmea_source === "ai" && selected.confidence !== undefined && (
                    <div className="flex items-center justify-between rounded-lg border p-3">
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

                  <div className="space-y-2">
                    <Label htmlFor="mode">Failure Mode *</Label>
                    <Select
                      value={draftModeId}
                      onValueChange={(v) => {
                        setDraftModeId(v);
                        setModeError("");
                      }}
                    >
                      <SelectTrigger id="mode" className={cn(modeError && "border-red-500 ring-red-500")}>
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
                    <Select value={draftCauseId} onValueChange={setDraftCauseId}>
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
                </TabsContent>
              </Tabs>

              {/* Actions */}
              {canEdit && (
                <div className="flex items-center gap-3 mt-8 pt-5 border-t">
                  <Button
                    onClick={handleApprove}
                    disabled={isPromoting}
                    className="bg-green-600 hover:bg-green-700 text-white"
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
                  {selected.work_order_id && (
                    <span className="ml-auto text-sm text-slate-500 flex items-center gap-1">
                      <Link2 className="h-4 w-4" />
                      WO #{selected.work_order_id}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
