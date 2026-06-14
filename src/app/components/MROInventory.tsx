import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Search, Plus, Package, AlertTriangle, ShoppingCart,
  ChevronRight, ChevronDown, Pencil, Layers, X,
  MapPin, Calendar, History, CheckCircle2,
} from "lucide-react";
import {
  MROmaterial, InventoryLevel, MaterialBooking,
  mockMROmaterials, mockInventoryLevels, mockMaterialBookings,
  mockWorkOrders,
} from "../data/mockData";
import { MaterialBookingModal } from "./MaterialBookingModal";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function totalQty(levels: InventoryLevel[]) {
  return levels.reduce((s, l) => s + l.qty_on_hand, 0);
}

function stockStatus(levels: InventoryLevel[]) {
  if (levels.length === 0 || totalQty(levels) === 0) return "out";
  if (levels.some(l => l.qty_on_hand > 0 && l.qty_on_hand < l.min_stock)) return "low";
  return "ok";
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  out: { label: "Out of Stock", cls: "bg-red-100 text-red-700 border border-red-200" },
  low: { label: "Low Stock",    cls: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  ok:  { label: "In Stock",     cls: "bg-green-100 text-green-700 border border-green-200" },
};

// ─── Sub-location row ───────────────────────────────────────────────────────────

function LocationRow({
  level,
  onBook,
}: {
  level: InventoryLevel;
  onBook: (level: InventoryLevel) => void;
}) {
  const isOut = level.qty_on_hand === 0;
  const isLow = !isOut && level.qty_on_hand < level.min_stock;

  return (
    <tr className="bg-slate-50/70 border-b border-slate-100 text-xs">
      <td className="pl-12 pr-3 py-2.5 text-slate-400" colSpan={1} />
      <td className="pr-3 py-2.5">
        <div className="flex items-center gap-1.5 text-slate-500">
          <MapPin className="h-3 w-3 text-slate-300 shrink-0" />
          <span>{level.location_name}</span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold border ${
            isOut
              ? "bg-red-100 text-red-700 border-red-200"
              : isLow
              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
              : "bg-green-100 text-green-700 border-green-200"
          }`}
        >
          {level.qty_on_hand}
        </span>
        <span className="ml-1 text-slate-400">/ min {level.min_stock}</span>
      </td>
      <td className="px-3 py-2.5 text-slate-400">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {level.updated_at}
        </div>
      </td>
      <td className="px-3 py-2.5 text-right">
        <button
          disabled={isOut}
          onClick={() => onBook(level)}
          className="px-2.5 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[11px] font-medium"
        >
          Book
        </button>
      </td>
    </tr>
  );
}

// ─── Add / Edit Material Drawer ─────────────────────────────────────────────────

interface MaterialDrawerProps {
  initial?: MROmaterial;
  onSave: (m: Omit<MROmaterial, "id" | "site_id">) => void;
  onClose: () => void;
}

function MaterialDrawer({ initial, onSave, onClose }: MaterialDrawerProps) {
  const [form, setForm] = useState({
    sku:         initial?.sku         ?? "",
    name:        initial?.name        ?? "",
    description: initial?.description ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.sku.trim())  e.sku  = "SKU is required.";
    if (!form.name.trim()) e.name = "Name is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 340, damping: 34 }}
      className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-40 flex flex-col border-l"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="font-semibold text-slate-800">{initial ? "Edit Material" : "Add New Material"}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">SKU / Material Code <span className="text-red-500">*</span></label>
          <input
            value={form.sku}
            onChange={e => set("sku", e.target.value)}
            placeholder="e.g. BRG-6204"
            className={`w-full px-3 py-2.5 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.sku ? "border-red-400 bg-red-50" : "border-slate-200"}`}
          />
          {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">Short Name <span className="text-red-500">*</span></label>
          <input
            value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="e.g. Deep Groove Ball Bearing"
            className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.name ? "border-red-400 bg-red-50" : "border-slate-200"}`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">Description / Specs</label>
          <textarea
            value={form.description}
            onChange={e => set("description", e.target.value)}
            rows={4}
            placeholder="Detailed specifications…"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end px-6 py-4 border-t bg-slate-50">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-white">Cancel</button>
        <button
          onClick={() => { if (validate()) onSave(form); }}
          className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          {initial ? "Save Changes" : "Add Material"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Add Stock Modal ────────────────────────────────────────────────────────────

const WAREHOUSE_LOCATIONS = [
  { id: 14, name: "Warehouse A – Shelf 3B" },
  { id: 15, name: "Warehouse A – Shelf 4C" },
  { id: 16, name: "Warehouse B – Tank Bay" },
  { id: 17, name: "Warehouse A – Bin 12" },
  { id: 18, name: "Warehouse B – Shelf 2C" },
  { id: 21, name: "Warehouse B – Shelf 1A" },
  { id: 22, name: "Warehouse C – Shelf 2D" },
];

interface AddStockModalProps {
  material: MROmaterial;
  existingLevels: InventoryLevel[];
  onSave: (materialId: number, locationId: number, locationName: string, qty: number) => void;
  onClose: () => void;
}

function AddStockModal({ material, existingLevels, onSave, onClose }: AddStockModalProps) {
  const [locationId, setLocationId] = useState<number>(WAREHOUSE_LOCATIONS[0].id);
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");

  const existing = existingLevels.find(l => l.location_id === locationId);

  const handleSave = () => {
    const n = parseInt(qty, 10);
    if (!qty || isNaN(n) || n <= 0) { setError("Enter a positive quantity."); return; }
    const loc = WAREHOUSE_LOCATIONS.find(l => l.id === locationId)!;
    onSave(material.id, locationId, loc.name, n);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800">Add Stock</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{material.sku} · {material.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Bin / Shelf Location</label>
            <select
              value={locationId}
              onChange={e => { setLocationId(Number(e.target.value)); setError(""); }}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {WAREHOUSE_LOCATIONS.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            {existing && (
              <p className="text-xs text-slate-400 mt-1">
                Current stock at this location: <span className="font-semibold text-slate-700">{existing.qty_on_hand}</span>
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Quantity to Add</label>
            <input
              type="number" min="1"
              value={qty}
              onChange={e => { setQty(e.target.value); setError(""); }}
              placeholder="e.g. 10"
              className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${error ? "border-red-400 bg-red-50" : "border-slate-200"}`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Add Stock</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Booking History Tab ────────────────────────────────────────────────────────

function BookingHistory({ bookings }: { bookings: MaterialBooking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-300">
        <History className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No bookings recorded yet</p>
      </div>
    );
  }
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50 text-left text-slate-600 font-medium text-xs">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Material</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Work Order</th>
            <th className="px-4 py-3">Asset</th>
            <th className="px-4 py-3">Booked At</th>
            <th className="px-4 py-3">By</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50 text-xs">
              <td className="px-4 py-2.5 font-mono text-slate-400">#{b.id}</td>
              <td className="px-4 py-2.5"><span className="font-mono text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">{b.material_sku}</span></td>
              <td className="px-4 py-2.5 text-slate-700">{b.material_name}</td>
              <td className="px-4 py-2.5 font-semibold text-slate-800">{b.quantity}</td>
              <td className="px-4 py-2.5 text-slate-500">{b.work_order_id ? `WO #${b.work_order_id}` : "—"}</td>
              <td className="px-4 py-2.5 text-slate-500 truncate max-w-[140px]">{b.asset_name ?? "—"}</td>
              <td className="px-4 py-2.5 text-slate-400">{b.booked_at}</td>
              <td className="px-4 py-2.5 text-slate-500">{b.booked_by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

interface MROInventoryProps {
  isAdmin?: boolean;
}

export function MROInventory({ isAdmin = true }: MROInventoryProps) {
  const [materials,  setMaterials]  = useState<MROmaterial[]>(mockMROmaterials);
  const [levels,     setLevels]     = useState<InventoryLevel[]>(mockInventoryLevels);
  const [bookings,   setBookings]   = useState<MaterialBooking[]>(mockMaterialBookings);

  const [search,     setSearch]     = useState("");
  const [tab,        setTab]        = useState<"catalog" | "history">("catalog");
  const [expanded,   setExpanded]   = useState<Set<number>>(new Set());

  // Drawer / modal state
  const [drawerMode, setDrawerMode] = useState<"none" | "add" | "edit">("none");
  const [editTarget, setEditTarget] = useState<MROmaterial | null>(null);
  const [addStockFor,setAddStockFor]= useState<MROmaterial | null>(null);
  const [bookTarget, setBookTarget] = useState<{ material: MROmaterial; levelId?: number } | null>(null);

  // ── derived ──
  const filtered = materials.filter(m => {
    const q = search.toLowerCase();
    return m.sku.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
  });

  const levelsFor = (id: number) => levels.filter(l => l.material_id === id);

  const stats = {
    total: materials.length,
    out:   materials.filter(m => totalQty(levelsFor(m.id)) === 0).length,
    low:   materials.filter(m => { const lvls = levelsFor(m.id); return totalQty(lvls) > 0 && stockStatus(lvls) === "low"; }).length,
    ok:    materials.filter(m => stockStatus(levelsFor(m.id)) === "ok").length,
  };

  const toggleExpand = (id: number) => {
    setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // ── handlers ──
  const handleAddMaterial = (data: Omit<MROmaterial, "id" | "site_id">) => {
    const id = Math.max(...materials.map(m => m.id), 5000) + 1;
    setMaterials(ms => [...ms, { id, site_id: 1, ...data }]);
    setDrawerMode("none");
    toast.success(`Material "${data.sku}" added to catalog.`);
  };

  const handleEditMaterial = (data: Omit<MROmaterial, "id" | "site_id">) => {
    if (!editTarget) return;
    setMaterials(ms => ms.map(m => m.id === editTarget.id ? { ...m, ...data } : m));
    setDrawerMode("none");
    setEditTarget(null);
    toast.success("Material updated.");
  };

  const handleAddStock = (materialId: number, locationId: number, locationName: string, qty: number) => {
    setLevels(ls => {
      const existing = ls.find(l => l.material_id === materialId && l.location_id === locationId);
      if (existing) {
        return ls.map(l =>
          l.material_id === materialId && l.location_id === locationId
            ? { ...l, qty_on_hand: l.qty_on_hand + qty, updated_at: new Date().toISOString().split("T")[0] }
            : l
        );
      }
      return [...ls, {
        id: Math.max(...ls.map(l => l.id), 100) + 1,
        material_id: materialId, location_id: locationId,
        location_name: locationName, qty_on_hand: qty, min_stock: 5,
        updated_at: new Date().toISOString().split("T")[0],
      }];
    });
    setAddStockFor(null);
    toast.success(`Stock updated for ${addStockFor?.sku}.`);
  };

  const handleConfirmBooking = (quantity: number, workOrderId?: number, assetId?: number) => {
    if (!bookTarget) return;
    const { material, levelId } = bookTarget;

    // Deduct from the specific level or the first available
    setLevels(ls => {
      if (levelId) {
        return ls.map(l => l.id === levelId ? { ...l, qty_on_hand: l.qty_on_hand - quantity } : l);
      }
      // deduct from first level with enough stock
      let remaining = quantity;
      return ls.map(l => {
        if (l.material_id !== material.id || remaining <= 0) return l;
        const deduct = Math.min(remaining, l.qty_on_hand);
        remaining -= deduct;
        return { ...l, qty_on_hand: l.qty_on_hand - deduct };
      });
    });

    const wo = workOrderId ? mockWorkOrders.find(w => w.id === workOrderId) : undefined;
    const newBooking: MaterialBooking = {
      id: Math.max(...bookings.map(b => b.id), 900) + 1,
      site_id: 1,
      material_id: material.id,
      material_sku: material.sku,
      material_name: material.name,
      quantity,
      work_order_id: workOrderId ?? null,
      asset_id: assetId ?? null,
      asset_name: wo?.asset_name ?? null,
      booked_at: new Date().toISOString().split("T")[0],
      booked_by: "Sarah Chen",
    };
    setBookings(bs => [newBooking, ...bs]);
    setBookTarget(null);
    toast.success(`Booked ${quantity}× ${material.sku} successfully.`);
  };

  // ── empty catalog state ──
  if (materials.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm">
          <Package className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Catalog Empty</h2>
          <p className="text-slate-500 mb-6">Import master data to start tracking your MRO inventory.</p>
          <button
            onClick={() => setDrawerMode("add")}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
          >
            <Plus className="h-4 w-4" /> Import Master Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-white border-b px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">MRO Inventory</h1>
            <p className="text-sm text-slate-500 mt-0.5">Maintenance, Repair & Operations spare parts catalog</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => { setEditTarget(null); setDrawerMode("add"); }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
              >
                <Plus className="h-4 w-4" /> Add Material
              </button>
            )}
            <button
              onClick={() => setBookTarget({ material: materials[0] })}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              <ShoppingCart className="h-4 w-4" /> Book Material
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Items",   val: stats.total, icon: Package,       cls: "text-blue-600",   bg: "bg-blue-50"   },
            { label: "Out of Stock",  val: stats.out,   icon: AlertTriangle, cls: "text-red-600",    bg: "bg-red-50"    },
            { label: "Low Stock",     val: stats.low,   icon: AlertTriangle, cls: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Healthy",       val: stats.ok,    icon: CheckCircle2,  cls: "text-green-600",  bg: "bg-green-50"  },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-3 px-4 py-3 ${s.bg} rounded-xl border border-white`}>
              <s.icon className={`h-6 w-6 ${s.cls} shrink-0`} />
              <div>
                <div className={`text-xl font-bold ${s.cls}`}>{s.val}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white border-b px-6 flex items-center gap-1">
        {[
          { key: "catalog", label: "Material Catalog", icon: Package },
          { key: "history", label: "Booking History",  icon: History },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "catalog" && (
          <>
            {/* Search */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by SKU, name, or description…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <span className="text-xs text-slate-400 ml-auto">{filtered.length} materials</span>
            </div>

            {/* Data grid */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600 font-medium text-left text-xs">
                    <th className="px-4 py-3 w-8" />
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Name / Description</th>
                    <th className="px-4 py-3">Locations</th>
                    <th className="px-4 py-3">Total Qty</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-14 text-slate-400">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p>No materials found</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map(m => {
                      const lvls  = levelsFor(m.id);
                      const total = totalQty(lvls);
                      const status = stockStatus(lvls);
                      const sCfg  = STATUS_BADGE[status];
                      const isExp = expanded.has(m.id);

                      return (
                        <>
                          <tr
                            key={m.id}
                            className={`border-b transition-colors ${isExp ? "bg-blue-50/40" : "hover:bg-slate-50"}`}
                          >
                            {/* Expand toggle */}
                            <td className="px-3 py-3">
                              <button
                                onClick={() => toggleExpand(m.id)}
                                className="flex items-center justify-center h-6 w-6 rounded text-slate-400 hover:bg-slate-200 transition-colors"
                              >
                                {isExp
                                  ? <ChevronDown className="h-4 w-4" />
                                  : <ChevronRight className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-semibold">
                                {m.sku}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-[280px]">
                              <div className="font-medium text-slate-800">{m.name}</div>
                              <div className="text-xs text-slate-400 truncate">{m.description}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Layers className="h-3.5 w-3.5 text-slate-300" />
                                {lvls.length} location{lvls.length !== 1 ? "s" : ""}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-bold text-base ${total === 0 ? "text-red-600" : "text-slate-800"}`}>
                                {total}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sCfg.cls}`}>
                                {sCfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                {isAdmin && (
                                  <>
                                    <button
                                      title="Edit"
                                      onClick={() => { setEditTarget(m); setDrawerMode("edit"); }}
                                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      title="Add Stock"
                                      onClick={() => setAddStockFor(m)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                                <button
                                  disabled={total === 0}
                                  onClick={() => setBookTarget({ material: m })}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  <ShoppingCart className="h-3 w-3" /> Book
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded location rows */}
                          <AnimatePresence>
                            {isExp && lvls.map(level => (
                              <LocationRow
                                key={level.id}
                                level={level}
                                onBook={l => setBookTarget({ material: m, levelId: l.id })}
                              />
                            ))}
                          </AnimatePresence>
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "history" && <BookingHistory bookings={bookings} />}
      </div>

      {/* ── Side Drawer ── */}
      <AnimatePresence>
        {drawerMode !== "none" && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setDrawerMode("none")}
            />
            <MaterialDrawer
              initial={drawerMode === "edit" ? editTarget ?? undefined : undefined}
              onSave={drawerMode === "edit" ? handleEditMaterial : handleAddMaterial}
              onClose={() => { setDrawerMode("none"); setEditTarget(null); }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Add Stock Modal ── */}
      <AnimatePresence>
        {addStockFor && (
          <AddStockModal
            material={addStockFor}
            existingLevels={levelsFor(addStockFor.id)}
            onSave={handleAddStock}
            onClose={() => setAddStockFor(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Booking Modal ── */}
      <AnimatePresence>
        {bookTarget && (
          <MaterialBookingModal
            open={true}
            onOpenChange={open => { if (!open) setBookTarget(null); }}
            materials={materials}
            inventoryLevels={levels}
            workOrders={mockWorkOrders}
            preselectedMaterialId={bookTarget.material.id}
            preselectedLevelId={bookTarget.levelId}
            onConfirm={handleConfirmBooking}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
