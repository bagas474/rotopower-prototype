import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { toast } from "sonner";

interface DictionaryRow {
  id: number;
  code: string;
  label: string;
  description?: string;
}

interface ActionCodeRow extends DictionaryRow {
  category_id: number;
}

type TabId =
  | "modes"
  | "causes"
  | "mechanisms"
  | "effects"
  | "detection"
  | "consequence"
  | "categories"
  | "codes";

const TABS: { id: TabId; label: string; singular: string }[] = [
  { id: "modes", label: "Failure Modes", singular: "Mode" },
  { id: "causes", label: "Failure Causes", singular: "Cause" },
  { id: "mechanisms", label: "Failure Mechanisms", singular: "Mechanism" },
  { id: "effects", label: "Failure Effects", singular: "Effect" },
  { id: "detection", label: "Detection Methods", singular: "Detection Method" },
  { id: "consequence", label: "Consequence Classes", singular: "Consequence Class" },
  { id: "categories", label: "Maintenance Action Categories", singular: "Action Category" },
  { id: "codes", label: "Maintenance Action Codes", singular: "Action Code" },
];

const INITIAL_DATA: Record<Exclude<TabId, "codes">, DictionaryRow[]> = {
  modes: [
    { id: 1, code: "BRG-01", label: "Bearing Seizure", description: "Complete lockup of the bearing." },
    { id: 2, code: "LEAK-01", label: "External Leakage", description: "Fluid escaping from the boundary." },
    { id: 3, code: "VIB-01", label: "Excessive Vibration", description: "Vibration beyond acceptable limits." },
  ],
  causes: [
    { id: 1, code: "LUB-LOSS", label: "Loss of Lubrication", description: "Insufficient or contaminated lubricant." },
    { id: 2, code: "MISALIGN", label: "Shaft Misalignment", description: "Coupling or shaft alignment out of tolerance." },
  ],
  mechanisms: [
    { id: 1, code: "FATIGUE", label: "Fatigue", description: "Crack growth under cyclic loading." },
    { id: 2, code: "CORR", label: "Corrosion", description: "Material loss due to chemical reaction." },
  ],
  effects: [
    { id: 1, code: "STOP", label: "Production Stop", description: "Unplanned shutdown of the asset." },
    { id: 2, code: "DEGRADE", label: "Performance Degradation", description: "Reduced output or efficiency." },
  ],
  detection: [
    { id: 1, code: "VIB-MON", label: "Vibration Monitoring", description: "Detected via vibration analysis." },
    { id: 2, code: "VISUAL", label: "Visual Inspection", description: "Detected by operator walkdown." },
  ],
  consequence: [
    { id: 1, code: "SAFETY", label: "Safety", description: "Potential harm to personnel." },
    { id: 2, code: "ENV", label: "Environmental", description: "Potential environmental impact." },
  ],
  categories: [
    { id: 5, code: "REPLACE", label: "Replacement", description: "Replace failed components." },
    { id: 6, code: "REPAIR", label: "Repair", description: "Repair existing components." },
    { id: 7, code: "ADJUST", label: "Adjustment", description: "Adjust or calibrate." },
  ],
};

const INITIAL_CODES: ActionCodeRow[] = [
  { id: 1, category_id: 5, code: "RPL-PART", label: "Replace Part", description: "Replace the damaged part." },
  { id: 2, category_id: 6, code: "RPR-WELD", label: "Repair Weld", description: "Repair a cracked weld." },
];

interface RowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabId: TabId;
  singular: string;
  row?: DictionaryRow | ActionCodeRow;
  existingCodes: string[];
  categories: DictionaryRow[];
  onSave: (row: DictionaryRow | ActionCodeRow) => void;
}

function RowDialog({
  open,
  onOpenChange,
  tabId,
  singular,
  row,
  existingCodes,
  categories,
  onSave,
}: RowDialogProps) {
  const isActionCode = tabId === "codes";
  const isEditMode = !!row;

  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [codeError, setCodeError] = useState("");
  const [labelError, setLabelError] = useState("");

  useEffect(() => {
    if (row) {
      setCode(row.code);
      setLabel(row.label);
      setDescription(row.description || "");
      setCategoryId("category_id" in row ? String(row.category_id) : "");
    } else {
      setCode("");
      setLabel("");
      setDescription("");
      setCategoryId("");
    }
    setCodeError("");
    setLabelError("");
  }, [row, open]);

  const noCategories = isActionCode && categories.length === 0;

  const handleSubmit = () => {
    setCodeError("");
    setLabelError("");

    const trimmedCode = code.trim();
    const trimmedLabel = label.trim();
    let hasError = false;

    if (!trimmedCode) {
      setCodeError("Code is required");
      hasError = true;
    } else if (/\s/.test(trimmedCode)) {
      setCodeError("Code cannot contain spaces");
      hasError = true;
    } else if (
      existingCodes.some(
        (c) => c.toLowerCase() === trimmedCode.toLowerCase() && (!isEditMode || c !== row?.code)
      )
    ) {
      setCodeError("Kode ini sudah terdaftar");
      hasError = true;
    }

    if (!trimmedLabel) {
      setLabelError("Label is required");
      hasError = true;
    }

    if (isActionCode && !categoryId) {
      hasError = true;
      toast.error("Please select an action category");
    }

    if (hasError) return;

    const base: DictionaryRow = {
      id: row?.id ?? 0,
      code: trimmedCode,
      label: trimmedLabel,
      description: description.trim() || undefined,
    };

    if (isActionCode) {
      onSave({ ...base, category_id: Number(categoryId) } as ActionCodeRow);
    } else {
      onSave(base);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Edit ${singular}` : `Add ${singular}`}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Update this entry in the failure dictionary.`
              : `Create a new entry in the failure dictionary.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isActionCode && (
            <div className="space-y-2">
              <Label htmlFor="category">Action Category *</Label>
              {noCategories ? (
                <p className="text-sm text-amber-600 border border-amber-200 bg-amber-50 rounded-md p-2">
                  Belum ada kategori. Silakan buat Action Category terlebih dahulu di tab sebelumnya.
                </p>
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.label} ({cat.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onBlur={(e) => setCode(e.target.value.trim())}
              placeholder="e.g., BRG-01"
            />
            {codeError ? (
              <p className="text-xs text-red-600">{codeError}</p>
            ) : (
              <p className="text-xs text-slate-500">
                Must be globally unique and cannot contain spaces.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Bearing Seizure"
            />
            {labelError && <p className="text-xs text-red-600">{labelError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={noCategories}>
            {isEditMode ? "Save Changes" : `Create ${singular}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FailureDictionaryAdmin() {
  const [activeTab, setActiveTab] = useState<TabId>("modes");
  const [searchQuery, setSearchQuery] = useState("");
  const [dictionaries, setDictionaries] = useState(INITIAL_DATA);
  const [codes, setCodes] = useState<ActionCodeRow[]>(INITIAL_CODES);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<DictionaryRow | ActionCodeRow | undefined>(undefined);

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const isActionCode = activeTab === "codes";

  const currentRows: (DictionaryRow | ActionCodeRow)[] = isActionCode
    ? codes
    : dictionaries[activeTab as Exclude<TabId, "codes">];

  const categoryLookup = useMemo(() => {
    const map = new Map<number, DictionaryRow>();
    dictionaries.categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [dictionaries.categories]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return currentRows;
    return currentRows.filter(
      (r) => r.code.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)
    );
  }, [currentRows, searchQuery]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabId);
    setSearchQuery("");
  };

  const handleAddClick = () => {
    setEditingRow(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (row: DictionaryRow | ActionCodeRow) => {
    setEditingRow(row);
    setDialogOpen(true);
  };

  const handleDelete = (row: DictionaryRow | ActionCodeRow) => {
    // Edge case: block deletion when category is referenced by action codes
    if (activeTab === "categories" && codes.some((c) => c.category_id === row.id)) {
      toast.error(
        "Aksi Ditolak: Kamus ini tidak dapat dihapus karena sedang aktif digunakan pada riwayat kegagalan aset atau RCA."
      );
      return;
    }

    if (isActionCode) {
      setCodes((prev) => prev.filter((c) => c.id !== row.id));
    } else {
      setDictionaries((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab as Exclude<TabId, "codes">].filter((r) => r.id !== row.id),
      }));
    }
    toast.success(`${currentTab.singular} deleted`);
  };

  const handleSave = (row: DictionaryRow | ActionCodeRow) => {
    const isEdit = !!editingRow;

    if (isActionCode) {
      setCodes((prev) => {
        if (isEdit) {
          return prev.map((c) => (c.id === row.id ? (row as ActionCodeRow) : c));
        }
        const nextId = Math.max(0, ...prev.map((c) => c.id)) + 1;
        return [...prev, { ...(row as ActionCodeRow), id: nextId }];
      });
    } else {
      const key = activeTab as Exclude<TabId, "codes">;
      setDictionaries((prev) => {
        const list = prev[key];
        if (isEdit) {
          return { ...prev, [key]: list.map((r) => (r.id === row.id ? row : r)) };
        }
        const nextId = Math.max(0, ...list.map((r) => r.id)) + 1;
        return { ...prev, [key]: [...list, { ...row, id: nextId }] };
      });
    }

    toast.success(isEdit ? `${currentTab.singular} updated` : `${currentTab.singular} created`);
  };

  const existingCodes = useMemo(() => currentRows.map((r) => r.code), [currentRows]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Failure Dictionary Admin</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage the global taxonomy for classifying equipment failures based on ISO 14224 and FMEA.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex-none">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={`Search ${tab.label.toLowerCase()} by code or label...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleAddClick}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {tab.singular}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="w-[160px]">Code</TableHead>
                <TableHead>Label</TableHead>
                {isActionCode && <TableHead>Category</TableHead>}
                <TableHead>Description</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isActionCode ? 6 : 5}
                    className="text-center text-slate-500 py-8"
                  >
                    {searchQuery
                      ? "No entries found matching your search."
                      : `No entries found. Click 'Add ${currentTab.singular}' to create the first dictionary row.`}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-sm text-slate-500">{row.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {row.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {isActionCode && (
                      <TableCell>
                        {categoryLookup.get((row as ActionCodeRow).category_id)?.label ?? (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-slate-600 max-w-[320px] truncate">
                      {row.description || <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(row)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(row)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <RowDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tabId={activeTab}
        singular={currentTab.singular}
        row={editingRow}
        existingCodes={existingCodes}
        categories={dictionaries.categories}
        onSave={handleSave}
      />
    </div>
  );
}
