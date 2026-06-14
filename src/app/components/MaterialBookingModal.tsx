import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package, MapPin, Search, X, ChevronDown,
  CheckCircle2, ShoppingCart, AlertCircle,
} from "lucide-react";
import { MROmaterial, InventoryLevel, WorkOrder } from "../data/mockData";

interface MaterialBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: MROmaterial[];
  inventoryLevels: InventoryLevel[];
  workOrders: WorkOrder[];
  preselectedMaterialId?: number;
  preselectedLevelId?: number;
  onConfirm: (quantity: number, workOrderId?: number, assetId?: number) => void;
}

export function MaterialBookingModal({
  open,
  onOpenChange,
  materials,
  inventoryLevels,
  workOrders,
  preselectedMaterialId,
  preselectedLevelId,
  onConfirm,
}: MaterialBookingModalProps) {
  const [skuSearch, setSkuSearch]         = useState("");
  const [searching, setSearching]         = useState(false);
  const [showDropdown, setShowDropdown]   = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MROmaterial | null>(null);
  const [selectedLevelId, setSelectedLevelId]   = useState<number | undefined>(preselectedLevelId);
  const [quantity, setQuantity]           = useState("1");
  const [workOrderId, setWorkOrderId]     = useState<number | undefined>();
  const [qtyError, setQtyError]           = useState("");
  const [submitting, setSubmitting]       = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Preselect material on open
  useEffect(() => {
    if (open && preselectedMaterialId) {
      const m = materials.find(m => m.id === preselectedMaterialId);
      if (m) {
        setSelectedMaterial(m);
        setSkuSearch(m.sku);
        setSelectedLevelId(preselectedLevelId);
      }
    }
  }, [open, preselectedMaterialId]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSkuSearch(""); setSearching(false); setShowDropdown(false);
        setSelectedMaterial(null); setSelectedLevelId(undefined);
        setQuantity("1"); setWorkOrderId(undefined);
        setQtyError(""); setSubmitting(false); setSubmitted(false);
      }, 200);
    }
  }, [open]);

  // Simulate search spinner
  useEffect(() => {
    if (!skuSearch || selectedMaterial) return;
    setSearching(true);
    const t = setTimeout(() => setSearching(false), 350);
    return () => clearTimeout(t);
  }, [skuSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredMaterials = skuSearch && !selectedMaterial
    ? materials.filter(m =>
        m.sku.toLowerCase().includes(skuSearch.toLowerCase()) ||
        m.name.toLowerCase().includes(skuSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const levelsForSelected = selectedMaterial
    ? inventoryLevels.filter(l => l.material_id === selectedMaterial.id)
    : [];

  const activeLevel = selectedLevelId
    ? levelsForSelected.find(l => l.id === selectedLevelId) ?? levelsForSelected[0]
    : levelsForSelected[0];

  const maxQty = activeLevel?.qty_on_hand ?? 0;
  const parsedQty = parseInt(quantity, 10);
  const isQtyInvalid = !quantity || isNaN(parsedQty) || parsedQty < 1 || parsedQty > maxQty;
  const canSubmit = !!selectedMaterial && !isQtyInvalid && !submitting;

  const handleSelectMaterial = (m: MROmaterial) => {
    setSelectedMaterial(m);
    setSkuSearch(m.sku);
    setShowDropdown(false);
    setSelectedLevelId(undefined);
    setQuantity("1");
    setQtyError("");
    setTimeout(() => searchRef.current?.blur(), 0);
  };

  const handleQtyChange = (val: string) => {
    setQuantity(val);
    const n = parseInt(val, 10);
    if (!val || isNaN(n) || n < 1) {
      setQtyError("Quantity must be at least 1.");
    } else if (n > maxQty) {
      setQtyError(`Insufficient stock. Only ${maxQty} available.`);
    } else {
      setQtyError("");
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !selectedMaterial) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    setSubmitted(true);
    await new Promise(r => setTimeout(r, 700));
    onConfirm(parsedQty, workOrderId, activeLevel?.location_id);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Book Material</h2>
              <p className="text-xs text-slate-400">Reserve spare parts for a work order</p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* SKU Search */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Search by SKU or Name <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-400">
                {searching
                  ? <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  : <Search className="h-4 w-4 text-slate-400 shrink-0" />
                }
                <input
                  ref={searchRef}
                  value={skuSearch}
                  onChange={e => {
                    setSkuSearch(e.target.value);
                    setSelectedMaterial(null);
                    setShowDropdown(true);
                    setSelectedLevelId(undefined);
                  }}
                  onFocus={() => { if (skuSearch && !selectedMaterial) setShowDropdown(true); }}
                  placeholder="Type SKU or part name…"
                  className="flex-1 text-sm focus:outline-none bg-transparent font-mono"
                />
                {selectedMaterial && (
                  <button onClick={() => { setSkuSearch(""); setSelectedMaterial(null); setShowDropdown(false); }}
                    className="text-slate-300 hover:text-slate-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete dropdown */}
              <AnimatePresence>
                {showDropdown && filteredMaterials.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden"
                  >
                    {filteredMaterials.map(m => {
                      const lvls = inventoryLevels.filter(l => l.material_id === m.id);
                      const total = lvls.reduce((s, l) => s + l.qty_on_hand, 0);
                      return (
                        <button
                          key={m.id}
                          onClick={() => handleSelectMaterial(m)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b last:border-0"
                        >
                          <Package className="h-4 w-4 text-slate-300 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-blue-700">{m.sku}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${
                                total === 0 ? "bg-red-100 text-red-700 border-red-200"
                                : total < 5  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                : "bg-green-100 text-green-700 border-green-200"
                              }`}>{total} in stock</span>
                            </div>
                            <div className="text-xs text-slate-500 truncate">{m.name}</div>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
                {showDropdown && skuSearch && !selectedMaterial && filteredMaterials.length === 0 && !searching && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-10 px-4 py-3 text-sm text-slate-400"
                  >
                    No materials match "{skuSearch}"
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Slide-in material/location detail */}
          <AnimatePresence>
            {selectedMaterial && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
                  {/* Material header */}
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 text-sm">{selectedMaterial.name}</div>
                      <div className="text-xs text-slate-400 line-clamp-2 mt-0.5">{selectedMaterial.description}</div>
                    </div>
                  </div>

                  {/* Location selector */}
                  {levelsForSelected.length > 0 ? (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1.5">Select Location</label>
                      <div className="space-y-1.5">
                        {levelsForSelected.map(l => (
                          <button
                            key={l.id}
                            onClick={() => setSelectedLevelId(l.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                              (selectedLevelId === l.id || (!selectedLevelId && levelsForSelected[0].id === l.id))
                                ? "border-blue-400 bg-blue-50"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="text-slate-700 text-xs">{l.location_name}</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                              l.qty_on_hand === 0
                                ? "bg-red-100 text-red-700 border-red-200"
                                : l.qty_on_hand < l.min_stock
                                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                : "bg-green-100 text-green-700 border-green-200"
                            }`}>
                              {l.qty_on_hand} avail.
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="h-3.5 w-3.5" /> No inventory records for this material.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quantity */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Quantity to Book <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="1"
              value={quantity}
              onChange={e => handleQtyChange(e.target.value)}
              disabled={!selectedMaterial || maxQty === 0}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40 ${
                qtyError ? "border-red-400 bg-red-50" : "border-slate-200"
              }`}
            />
            {qtyError && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" /> {qtyError}
              </p>
            )}
          </div>

          {/* Work Order (optional) */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Link to Work Order <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <select
                value={workOrderId ?? ""}
                onChange={e => setWorkOrderId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-700"
              >
                <option value="">— None —</option>
                {workOrders
                  .filter(w => w.status !== "resolved")
                  .map(w => (
                    <option key={w.id} value={w.id}>
                      WO #{w.id} · {w.title.slice(0, 40)}{w.title.length > 40 ? "…" : ""}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            {workOrderId && (() => {
              const wo = workOrders.find(w => w.id === workOrderId);
              return wo ? (
                <p className="text-xs text-slate-400 mt-1">
                  Asset: <span className="font-medium text-slate-600">{wo.asset_name}</span> · {wo.location_name}
                </p>
              ) : null;
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-slate-50 rounded-b-2xl">
          <button
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex items-center justify-center gap-2 min-w-[150px] px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              submitted
                ? "bg-green-500 text-white"
                : canSubmit
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              submitted ? (
                <><CheckCircle2 className="h-4 w-4" /> Booked!</>
              ) : (
                <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Booking…</>
              )
            ) : (
              <><ShoppingCart className="h-4 w-4" /> Confirm Booking</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
