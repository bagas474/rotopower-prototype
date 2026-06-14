import { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges,
  type Node, type Edge, type NodeChange, type EdgeChange,
  type Connection, type NodeTypes,
  Handle, Position, useReactFlow, ReactFlowProvider, Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft, Plus, Trash2, Save, GitBranch, AlertCircle,
  Info, Zap, ZapOff, LayoutGrid, X, AlertTriangle, CheckCircle,
  Play, Link,
} from "lucide-react";
import { toast } from "sonner";
import { FaultTree, mockFaultTrees, mockAssetFaults } from "../data/mockData";

// ─── Domain types ──────────────────────────────────────────────────────────────

type GateType = "AND" | "OR";

interface GateNodeData extends Record<string, unknown> {
  gateType: GateType;
  hasError?: boolean;
  isActive?: boolean;
}
interface SensorNodeData extends Record<string, unknown> {
  sensorCode: string;
  label: string;
  notFound?: boolean;
  isActive?: boolean;
  liveValue?: boolean;
}
interface FaultNodeData extends Record<string, unknown> {
  faultId: number;
  faultName: string;
  assetName: string;
  isActive?: boolean;
  liveValue?: boolean;
}
interface TopEventNodeData extends Record<string, unknown> {
  label: string;
  isActive?: boolean;
}

// ─── Custom node: TopEvent ──────────────────────────────────────────────────────

function TopEventNode({ data, selected }: { data: TopEventNodeData; selected?: boolean }) {
  return (
    <div className={`px-4 py-3 rounded-xl border-2 min-w-[160px] text-center shadow-sm transition-all ${
      data.isActive ? "bg-green-100 border-green-500 shadow-green-200 shadow-md"
      : selected ? "bg-blue-100 border-blue-600 shadow-blue-200 shadow-md"
      : "bg-blue-50 border-blue-400"
    }`}>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-blue-500 mb-1">Top Event</div>
      <div className="text-sm font-bold text-blue-800 leading-tight">{data.label}</div>
      <Handle type="target" position={Position.Bottom} className="!w-3 !h-3 !bg-blue-400 !border-2 !border-white" />
    </div>
  );
}

// ─── Custom node: Gate ─────────────────────────────────────────────────────────

function GateNode({ data, selected }: { data: GateNodeData; selected?: boolean }) {
  const isAnd = data.gateType === "AND";
  return (
    <div className={`relative flex flex-col items-center justify-center w-24 h-20 transition-all ${data.hasError ? "drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : ""}`}>
      <Handle type="source" position={Position.Top} className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !-top-1.5" />
      {isAnd ? (
        <svg width="96" height="64" viewBox="0 0 96 64">
          <path d="M12,52 L12,12 L60,12 A36,40 0 0 1 60,52 Z"
            fill={data.isActive ? "#bbf7d0" : data.hasError ? "#fee2e2" : selected ? "#d1fae5" : "#f0fdf4"}
            stroke={data.isActive ? "#16a34a" : data.hasError ? "#ef4444" : selected ? "#16a34a" : "#22c55e"} strokeWidth="2" />
          <text x="36" y="36" textAnchor="middle" fontSize="13" fontWeight="800"
            fill={data.isActive ? "#15803d" : data.hasError ? "#dc2626" : "#166534"}>AND</text>
        </svg>
      ) : (
        <svg width="96" height="64" viewBox="0 0 96 64">
          <path d="M12,52 Q12,12 48,12 Q84,12 84,52 Q60,36 12,52 Z"
            fill={data.isActive ? "#fef9c3" : data.hasError ? "#fee2e2" : selected ? "#fef3c7" : "#fefce8"}
            stroke={data.isActive ? "#ca8a04" : data.hasError ? "#ef4444" : selected ? "#ca8a04" : "#eab308"} strokeWidth="2" />
          <text x="48" y="40" textAnchor="middle" fontSize="13" fontWeight="800"
            fill={data.isActive ? "#854d0e" : data.hasError ? "#dc2626" : "#713f12"}>OR</text>
        </svg>
      )}
      <Handle type="target" position={Position.Bottom} id="in-l" style={{ left: "28%" }} className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !bottom-0" />
      <Handle type="target" position={Position.Bottom} id="in-r" style={{ left: "72%" }} className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white !bottom-0" />
    </div>
  );
}

// ─── Custom node: Sensor ───────────────────────────────────────────────────────

function SensorNode({ data, selected }: { data: SensorNodeData; selected?: boolean }) {
  return (
    <div className={`relative flex flex-col items-center justify-center w-28 h-28 rounded-full border-2 transition-all shadow-sm ${
      data.notFound ? "bg-slate-100 border-slate-300"
      : data.isActive ? "bg-green-100 border-green-500 shadow-green-200 shadow-md"
      : selected ? "bg-sky-100 border-sky-500"
      : "bg-sky-50 border-sky-300"
    }`}>
      <Handle type="source" position={Position.Top} className="!w-3 !h-3 !bg-sky-400 !border-2 !border-white !-top-1.5" />
      {data.notFound ? (
        <>
          <AlertCircle className="h-5 w-5 text-slate-400 mb-1" />
          <div className="text-[9px] text-slate-400 font-medium px-2 text-center">Sensor Not Found</div>
          <div className="text-[10px] font-mono text-slate-300 mt-0.5">{data.sensorCode}</div>
        </>
      ) : (
        <>
          <div className="text-[10px] font-mono font-bold text-sky-700">{data.sensorCode}</div>
          <div className="text-[9px] text-sky-500 px-3 text-center mt-0.5 leading-tight">{data.label}</div>
          {data.liveValue !== undefined && (
            <div className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${data.liveValue ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {data.liveValue ? "TRUE" : "FALSE"}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Custom node: Fault (cascading failure) ────────────────────────────────────

function FaultNode({ data, selected }: { data: FaultNodeData; selected?: boolean }) {
  // Hexagon shape via clip-path
  return (
    <div className="relative flex flex-col items-center" style={{ width: 120, height: 80 }}>
      <Handle type="source" position={Position.Top} className="!w-3 !h-3 !bg-rose-400 !border-2 !border-white !-top-1.5" />
      <div
        className={`w-full h-full flex flex-col items-center justify-center transition-all shadow-sm ${
          data.isActive ? "bg-rose-200 border-rose-600"
          : selected ? "bg-rose-100 border-rose-500"
          : "bg-rose-50 border-rose-300"
        }`}
        style={{ clipPath: "polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)", border: "2px solid" }}
      >
        <Link className={`h-3.5 w-3.5 mb-0.5 ${data.isActive ? "text-rose-700" : "text-rose-400"}`} />
        <div className="text-[9px] font-mono font-bold text-rose-700 px-4 text-center leading-tight line-clamp-1">
          #{data.faultId}
        </div>
        <div className="text-[8px] text-rose-500 px-3 text-center leading-tight line-clamp-2 mt-0.5">
          {data.faultName}
        </div>
        {data.liveValue !== undefined && (
          <div className={`mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${data.liveValue ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {data.liveValue ? "TRUE" : "FALSE"}
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  topEvent: TopEventNode as any,
  gate:     GateNode     as any,
  sensor:   SensorNode   as any,
  fault:    FaultNode    as any,
};

// ─── Sensors palette ───────────────────────────────────────────────────────────

const availableSensors = [
  { code: "VIB-01", label: "Vibration (Bearing)"   },
  { code: "VIB-05", label: "Vibration (Fan)"        },
  { code: "TEMP-02",label: "Temperature (Motor)"    },
  { code: "TEMP-08",label: "Temperature (Exhaust)"  },
  { code: "PRES-03",label: "Pressure (Discharge)"   },
  { code: "PRES-10",label: "Pressure (Suction)"     },
  { code: "FLOW-01",label: "Flow (Inlet)"           },
  { code: "FLOW-02",label: "Flow (Outlet)"          },
  { code: "CURR-02",label: "Current (Motor)"        },
  { code: "LVL-04", label: "Oil Level"              },
  { code: "TEMP-01",label: "Temperature (Winding)"  },
];

// ─── Expression compiler (returns expression + extracts sensor_codes + fault_ids) ──

function compileTree(nodes: Node[], edges: Edge[]): {
  expression: string;
  sensorCodes: string[];
  dependentFaultIds: number[];
} {
  function buildExpr(nodeId: string): string {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return "";
    if (node.type === "sensor") return (node.data as SensorNodeData).sensorCode;
    if (node.type === "fault")  return `FAULT_${(node.data as FaultNodeData).faultId}`;
    if (node.type === "topEvent") {
      const child = edges.find(e => e.target === nodeId);
      return child ? buildExpr(child.source) : "";
    }
    if (node.type === "gate") {
      const children = edges.filter(e => e.target === nodeId).map(e => buildExpr(e.source)).filter(Boolean);
      if (children.length === 0) return "";
      const op = (node.data as GateNodeData).gateType === "AND" ? " & " : " | ";
      return children.length === 1 ? children[0] : `(${children.join(op)})`;
    }
    return "";
  }

  const topEvent = nodes.find(n => n.type === "topEvent");
  const expression = topEvent ? buildExpr(topEvent.id) : "";

  const sensorCodes = nodes
    .filter(n => n.type === "sensor")
    .map(n => (n.data as SensorNodeData).sensorCode)
    .filter(Boolean);

  const dependentFaultIds = nodes
    .filter(n => n.type === "fault")
    .map(n => (n.data as FaultNodeData).faultId)
    .filter(Boolean);

  return { expression, sensorCodes, dependentFaultIds };
}

// ─── Cycle detection ───────────────────────────────────────────────────────────

function hasCycle(nodes: Node[], edges: Edge[], newEdge: { source: string; target: string }): boolean {
  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  [...edges, newEdge].forEach(e => {
    const arr = adj.get(e.source) ?? [];
    arr.push(e.target);
    adj.set(e.source, arr);
  });
  const visited = new Set<string>(), stack = new Set<string>();
  function dfs(id: string): boolean {
    if (stack.has(id)) return true;
    if (visited.has(id)) return false;
    visited.add(id); stack.add(id);
    for (const nb of adj.get(id) ?? []) if (dfs(nb)) return true;
    stack.delete(id);
    return false;
  }
  for (const n of nodes) if (dfs(n.id)) return true;
  return false;
}

// ─── Build initial React Flow state from stored mock nodes ─────────────────────

function buildInitialState(tree: FaultTree): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = tree.nodes.map(n => {
    if (n.type === "event") return { id: n.id, type: "topEvent", position: { x: n.x, y: n.y }, data: { label: n.label } as TopEventNodeData };
    if (n.type === "and-gate" || n.type === "or-gate") return { id: n.id, type: "gate", position: { x: n.x, y: n.y }, data: { gateType: n.type === "and-gate" ? "AND" : "OR" } as GateNodeData };
    if (n.type === "fault") {
      const af = mockAssetFaults.find(f => f.id === n.fault_id);
      return { id: n.id, type: "fault", position: { x: n.x, y: n.y }, data: { faultId: n.fault_id ?? 0, faultName: af?.fault_name ?? "Unknown", assetName: af?.asset_name ?? "" } as FaultNodeData };
    }
    return { id: n.id, type: "sensor", position: { x: n.x, y: n.y }, data: { sensorCode: n.sensor_code ?? "", label: n.label } as SensorNodeData };
  });
  const edges: Edge[] = [];
  tree.nodes.forEach(n => {
    n.children.forEach((childId, i) => {
      edges.push({ id: `e-${n.id}-${childId}`, source: childId, target: n.id, targetHandle: i % 2 === 0 ? "in-l" : "in-r", animated: false, style: { stroke: "#94a3b8", strokeWidth: 2 } });
    });
  });
  return { nodes, edges };
}

// ─── Inner canvas ──────────────────────────────────────────────────────────────

interface InnerCanvasProps {
  tree: FaultTree;
  isAdmin: boolean;
  onBack: () => void;
}

function InnerCanvas({ tree, isAdmin, onBack }: InnerCanvasProps) {
  const { fitView } = useReactFlow();
  const initial = buildInitialState(tree);
  const [nodes,  setNodes]  = useState<Node[]>(initial.nodes);
  const [edges,  setEdges]  = useState<Edge[]>(initial.edges);
  const [compiled, setCompiled] = useState(() => compileTree(initial.nodes, initial.edges));
  const [liveMode, setLiveMode] = useState(false);
  const [liveValues, setLiveValues] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [errorNodeIds, setErrorNodeIds] = useState<Set<string>>(new Set());
  const liveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recompile on every graph change
  useEffect(() => {
    setCompiled(compileTree(nodes, edges));
  }, [nodes, edges]);

  // Live telemetry simulation
  useEffect(() => {
    if (!liveMode) {
      if (liveTimer.current) clearInterval(liveTimer.current);
      setLiveValues({});
      setNodes(ns => ns.map(n => ({ ...n, data: { ...n.data, liveValue: undefined, isActive: false } })));
      return;
    }
    const runLive = () => {
      const vals: Record<string, boolean> = {};
      nodes.filter(n => n.type === "sensor" || n.type === "fault").forEach(n => {
        const key = n.type === "sensor" ? (n.data as SensorNodeData).sensorCode : `fault_${(n.data as FaultNodeData).faultId}`;
        vals[key] = Math.random() > 0.4;
      });
      setLiveValues(vals);
      function evalNode(id: string): boolean {
        const node = nodes.find(n => n.id === id);
        if (!node) return false;
        if (node.type === "sensor") return vals[(node.data as SensorNodeData).sensorCode] ?? false;
        if (node.type === "fault")  return vals[`fault_${(node.data as FaultNodeData).faultId}`] ?? false;
        if (node.type === "topEvent") { const c = edges.find(e => e.target === id); return c ? evalNode(c.source) : false; }
        if (node.type === "gate") {
          const children = edges.filter(e => e.target === id).map(e => evalNode(e.source));
          return (node.data as GateNodeData).gateType === "AND" ? children.every(Boolean) : children.some(Boolean);
        }
        return false;
      }
      const activeMap: Record<string, boolean> = {};
      nodes.forEach(n => { activeMap[n.id] = evalNode(n.id); });
      setNodes(ns => ns.map(n => ({
        ...n,
        data: { ...n.data, isActive: activeMap[n.id],
          ...(n.type === "sensor" ? { liveValue: vals[(n.data as SensorNodeData).sensorCode] } : {}),
          ...(n.type === "fault"  ? { liveValue: vals[`fault_${(n.data as FaultNodeData).faultId}`] } : {}),
        },
      })));
      setEdges(es => es.map(e => ({
        ...e,
        animated: activeMap[e.source] && activeMap[e.target],
        style: { stroke: (activeMap[e.source] && activeMap[e.target]) ? "#22c55e" : "#94a3b8", strokeWidth: (activeMap[e.source] && activeMap[e.target]) ? 3 : 2 },
      })));
    };
    runLive();
    liveTimer.current = setInterval(runLive, 2000);
    return () => { if (liveTimer.current) clearInterval(liveTimer.current); };
  }, [liveMode, nodes.length, edges.length]);

  const onNodesChange  = useCallback((changes: NodeChange[]) => setNodes(ns => applyNodeChanges(changes, ns)), []);
  const onEdgesChange  = useCallback((changes: EdgeChange[]) => setEdges(es => applyEdgeChanges(changes, es)), []);
  const onConnect      = useCallback((connection: Connection) => {
    if (!isAdmin) return;
    if (hasCycle(nodes, edges, { source: connection.source!, target: connection.target! })) {
      toast.warning("Circular logic detected. Fault trees cannot contain infinite loops.");
      return;
    }
    setEdges(es => addEdge({ ...connection, animated: false, style: { stroke: "#94a3b8", strokeWidth: 2 } }, es));
  }, [nodes, edges, isAdmin]);

  const addGate   = (gateType: GateType) => { const id = `gate-${Date.now()}`; setNodes(ns => [...ns, { id, type: "gate",   position: { x: 280 + Math.random()*100, y: 280 + Math.random()*60 }, data: { gateType } as GateNodeData }]); };
  const addSensor = (code: string, label: string) => { const id = `sensor-${Date.now()}`; setNodes(ns => [...ns, { id, type: "sensor", position: { x: 180 + Math.random()*250, y: 420 + Math.random()*60 }, data: { sensorCode: code, label } as SensorNodeData }]); };
  const addFault  = (faultId: number) => {
    const af = mockAssetFaults.find(f => f.id === faultId);
    if (!af) return;
    const id = `fault-${Date.now()}`;
    setNodes(ns => [...ns, { id, type: "fault", position: { x: 180 + Math.random()*250, y: 420 + Math.random()*60 }, data: { faultId, faultName: af.fault_name, assetName: af.asset_name } as FaultNodeData }]);
  };

  const clearCanvas  = () => { const top = nodes.find(n => n.type === "topEvent"); setNodes(top ? [{ ...top, data: { ...top.data, isActive: false } }] : []); setEdges([]); setErrorNodeIds(new Set()); };
  const autoAlign    = () => {
    const top = nodes.find(n => n.type === "topEvent");
    if (!top) return;
    const levels = new Map<string, number>();
    const queue = [{ id: top.id, level: 0 }];
    while (queue.length) {
      const { id, level } = queue.shift()!;
      if (!levels.has(id) || levels.get(id)! < level) levels.set(id, level);
      edges.filter(e => e.target === id).forEach(e => queue.push({ id: e.source, level: level + 1 }));
    }
    const byLevel = new Map<number, string[]>();
    levels.forEach((lvl, id) => { const arr = byLevel.get(lvl) ?? []; arr.push(id); byLevel.set(lvl, arr); });
    setNodes(ns => ns.map(n => {
      const lvl = levels.get(n.id) ?? 0;
      const siblings = byLevel.get(lvl) ?? [n.id];
      const idx = siblings.indexOf(n.id);
      return { ...n, position: { x: 400 - ((siblings.length - 1) * 180) / 2 + idx * 180, y: 60 + lvl * 160 } };
    }));
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  };

  const handleSave = () => {
    const unattached = nodes.filter(n => n.type === "gate" && edges.filter(e => e.target === n.id).length === 0);
    if (unattached.length > 0) {
      const ids = new Set(unattached.map(n => n.id));
      setErrorNodeIds(ids);
      setNodes(ns => ns.map(n => ({ ...n, data: { ...n.data, hasError: ids.has(n.id) } })));
      toast.error(`${unattached.length} gate(s) have no connected inputs. Connect them before saving.`);
      return;
    }
    setErrorNodeIds(new Set());
    setNodes(ns => ns.map(n => ({ ...n, data: { ...n.data, hasError: false } })));
    setSaved(true);
    toast.success("Fault tree saved. Payload: " + JSON.stringify({ expression: compiled.expression.slice(0, 40) + (compiled.expression.length > 40 ? "…" : ""), sensor_codes: compiled.sensorCodes, dependent_asset_fault_ids: compiled.dependentFaultIds }));
    setTimeout(() => setSaved(false), 2500);
  };

  const topEventActive = nodes.find(n => n.type === "topEvent")?.data?.isActive;

  // Available faults for palette: exclude the current tree's own asset_fault_id
  const paletteFaults = mockAssetFaults.filter(f => f.id !== tree.asset_fault_id);

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Top bar */}
      <div className="bg-white border-b px-4 py-2.5 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="h-5 w-px bg-slate-200" />
        <GitBranch className="h-5 w-5 text-blue-600" />
        <div>
          <span className="font-semibold text-slate-800 text-sm">{tree.asset_fault_name}</span>
          <span className="ml-2 text-xs text-slate-400">Fault #{tree.asset_fault_id}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Live expression pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-lg max-w-xs overflow-hidden">
            <span className="text-xs text-slate-400 shrink-0">expr:</span>
            <code className="text-xs font-mono text-slate-700 truncate">{compiled.expression || <span className="text-slate-300 italic">empty</span>}</code>
          </div>
          <button onClick={() => setLiveMode(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${liveMode ? "bg-green-600 text-white hover:bg-green-700" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {liveMode ? <><ZapOff className="h-3.5 w-3.5" /> Stop Test</> : <><Play className="h-3.5 w-3.5" /> Live Test</>}
          </button>
          {!isAdmin && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
              <Info className="h-3.5 w-3.5" /> Read-only mode
            </div>
          )}
          {isAdmin && (
            <button onClick={handleSave}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${saved ? "bg-green-50 border border-green-300 text-green-700" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
              <Save className="h-3.5 w-3.5" /> {saved ? "Saved!" : "Save"}
            </button>
          )}
        </div>
      </div>

      {/* Live banner */}
      {liveMode && (
        <div className={`flex items-center justify-center gap-2 py-1.5 text-xs font-medium transition-colors ${topEventActive ? "bg-green-500 text-white" : "bg-slate-700 text-slate-200"}`}>
          <Zap className="h-3.5 w-3.5" />
          {topEventActive ? "⚡ FAULT ACTIVE — condition is currently TRUE" : "Live telemetry running… Fault NOT active. Refreshes every 2s."}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Palette */}
        {isAdmin && (
          <div className="w-52 bg-white border-r flex flex-col p-3 gap-4 shrink-0 overflow-y-auto">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Logic Gates</p>
              <div className="flex flex-col gap-2">
                {(["AND","OR"] as GateType[]).map(gt => (
                  <button key={gt} onClick={() => addGate(gt)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold hover:opacity-80 ${gt === "AND" ? "bg-green-50 border-green-300 text-green-700" : "bg-yellow-50 border-yellow-300 text-yellow-700"}`}>
                    <Plus className="h-3.5 w-3.5 shrink-0" /> {gt} Gate
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sensors</p>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                {availableSensors.map(s => (
                  <button key={s.code} onClick={() => addSensor(s.code, s.label)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-sky-200 bg-sky-50 text-xs text-sky-700 hover:bg-sky-100 transition-colors text-left">
                    <Plus className="h-3 w-3 shrink-0" />
                    <div><div className="font-mono font-bold">{s.code}</div><div className="text-[9px] text-sky-400 leading-tight">{s.label}</div></div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Fault Nodes</p>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                {paletteFaults.map(f => (
                  <button key={f.id} onClick={() => addFault(f.id)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700 hover:bg-rose-100 transition-colors text-left">
                    <Link className="h-3 w-3 shrink-0" />
                    <div><div className="font-mono font-bold text-[10px]">#{f.id}</div><div className="text-[9px] text-rose-400 leading-tight">{f.asset_name} – {f.fault_name}</div></div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Canvas</p>
              <div className="flex flex-col gap-1.5">
                <button onClick={autoAlign} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">
                  <LayoutGrid className="h-3.5 w-3.5" /> Auto-align
                </button>
                <button onClick={clearCanvas} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-xs text-red-500 hover:bg-red-50">
                  <X className="h-3.5 w-3.5" /> Clear Canvas
                </button>
              </div>
            </div>

            <div className="mt-auto text-[10px] text-slate-400 leading-relaxed">
              Connect output port (top) → input port (bottom) to build the tree. Cycle detection prevents infinite loops.
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={isAdmin ? onNodesChange : undefined}
            onEdgesChange={isAdmin ? onEdgesChange : undefined}
            onConnect={isAdmin ? onConnect : undefined}
            nodeTypes={nodeTypes}
            fitView fitViewOptions={{ padding: 0.25 }}
            nodesDraggable={isAdmin} nodesConnectable={isAdmin}
            elementsSelectable deleteKeyCode={isAdmin ? "Backspace" : null}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e2e8f0" gap={24} />
            <Controls />
            <MiniMap
              nodeColor={n => n.type === "topEvent" ? "#93c5fd" : n.type === "gate" ? ((n.data as GateNodeData).gateType === "AND" ? "#86efac" : "#fde047") : n.type === "fault" ? "#fca5a5" : "#7dd3fc"}
              className="!border !border-slate-200 !rounded-lg !shadow"
            />

            {nodes.length === 0 && (
              <Panel position="top-center" className="pointer-events-none select-none mt-32">
                <div className="flex flex-col items-center gap-3 text-slate-300">
                  <GitBranch className="h-16 w-16 opacity-20" />
                  <p className="text-lg font-medium">Drag nodes from the palette to begin</p>
                </div>
              </Panel>
            )}
            {!isAdmin && (
              <Panel position="bottom-center" className="mb-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-300 rounded-full text-xs text-amber-800 font-medium shadow-sm">
                  <Info className="h-3.5 w-3.5" /> You are viewing this RCFA in read-only mode.
                </div>
              </Panel>
            )}
            {errorNodeIds.size > 0 && (
              <Panel position="top-right" className="mt-2 mr-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-300 rounded-lg text-xs text-red-700 shadow-sm">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {errorNodeIds.size} gate(s) highlighted — connect their inputs to save.
                </div>
              </Panel>
            )}
            {saved && (
              <Panel position="top-right" className="mt-2 mr-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-300 rounded-lg text-xs text-green-700 shadow-sm">
                  <CheckCircle className="h-3.5 w-3.5" /> Tree saved successfully.
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right info panel */}
        <div className="w-52 bg-white border-l flex flex-col p-3 gap-4 shrink-0 overflow-y-auto">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Investigation</p>
            <dl className="space-y-2 text-xs">
              <div><dt className="text-slate-400 text-[10px]">Created by</dt><dd className="text-slate-700 font-medium">{tree.created_by}</dd></div>
              <div><dt className="text-slate-400 text-[10px]">Date</dt><dd className="text-slate-600">{tree.created_at}</dd></div>
              <div>
                <dt className="text-slate-400 text-[10px]">Status</dt>
                <dd><span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  tree.status === "approved" ? "bg-green-100 text-green-700" : tree.status === "in-review" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                }`}>{tree.status === "in-review" ? "In Review" : tree.status.charAt(0).toUpperCase() + tree.status.slice(1)}</span></dd>
              </div>
            </dl>
          </div>

          {/* 3-payload compiled output */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Expression</p>
            {compiled.expression ? (
              <code className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1.5 rounded font-mono block break-all leading-relaxed">{compiled.expression}</code>
            ) : (
              <span className="text-[10px] text-slate-300 italic">Not yet mapped</span>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sensor Codes</p>
            {compiled.sensorCodes.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {compiled.sensorCodes.map(s => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 bg-sky-50 text-sky-600 border border-sky-100 rounded font-mono">{s}</span>
                ))}
              </div>
            ) : <span className="text-[10px] text-slate-300 italic">None</span>}
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Dependent Faults</p>
            {compiled.dependentFaultIds.length > 0 ? (
              <div className="flex flex-col gap-1">
                {compiled.dependentFaultIds.map(id => {
                  const af = mockAssetFaults.find(f => f.id === id);
                  return (
                    <span key={id} className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded font-mono">
                      #{id}{af ? ` ${af.fault_name}` : ""}
                    </span>
                  );
                })}
              </div>
            ) : <span className="text-[10px] text-slate-300 italic">None</span>}
          </div>

          {liveMode && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Live Values</p>
              <div className="flex flex-col gap-1">
                {Object.entries(liveValues).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-600 truncate">{key}</span>
                    <span className={`px-1 py-0.5 rounded font-bold ml-1 shrink-0 ${val ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{val ? "T" : "F"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Public export ─────────────────────────────────────────────────────────────

interface RCFACanvasProps {
  faultTreeId: number;
  isAdmin?: boolean;
  onBack: () => void;
}

export function RCFACanvas({ faultTreeId, isAdmin = true, onBack }: RCFACanvasProps) {
  const tree = mockFaultTrees.find(t => t.id === faultTreeId);
  if (!tree) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 gap-2">
        <AlertCircle className="h-5 w-5" /> Investigation not found.
      </div>
    );
  }
  return (
    <ReactFlowProvider>
      <InnerCanvas tree={tree} isAdmin={isAdmin} onBack={onBack} />
    </ReactFlowProvider>
  );
}
