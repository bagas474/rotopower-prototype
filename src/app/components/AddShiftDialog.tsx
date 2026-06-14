import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { Shift, ShiftTime, ShiftRequirement } from "./ShiftRosterCalendar";
import { Worker, UserCompetence } from "../types";

interface AddShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (shift: Omit<Shift, "id">) => void;
  workers: Worker[];
  workerCompetencies: Record<number, UserCompetence[]>;
  existingShifts: Shift[];
  preselectedDate?: Date | null;
  editingShift?: Shift | null;
}

const availableRequirements = [
  { id: 5, name: "Hydraulics", defaultLevel: 6 },
  { id: 8, name: "Climate Control Systems", defaultLevel: 8 },
  { id: 12, name: "TIG Welding", defaultLevel: 7 },
  { id: 18, name: "High Voltage Operations", defaultLevel: 8 },
  { id: 34, name: "Safety Protocols", defaultLevel: 9 },
  { id: 22, name: "High Pressure Systems", defaultLevel: 7 },
  { id: 11, name: "Process Control", defaultLevel: 9 }
];

export function AddShiftDialog({ 
  open, 
  onOpenChange, 
  onAdd, 
  workers, 
  workerCompetencies, 
  existingShifts, 
  preselectedDate,
  editingShift
}: AddShiftDialogProps) {
  const isEditMode = !!editingShift;
  
  const [date, setDate] = useState<Date | undefined>(editingShift?.shift_date ? new Date(editingShift.shift_date) : preselectedDate || undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [shiftTime, setShiftTime] = useState<ShiftTime>(editingShift?.shift_time || "MORNING");
  const [selectedRequirement, setSelectedRequirement] = useState<number | null>(editingShift?.requirements[0]?.competence_id || null);
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>(editingShift?.assigned_workers || []);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (preselectedDate && !isEditMode) {
      setDate(preselectedDate);
    }
  }, [preselectedDate, isEditMode]);

  const requirements: ShiftRequirement[] = selectedRequirement
    ? [{
        competence_id: selectedRequirement,
        competence_name: availableRequirements.find(r => r.id === selectedRequirement)!.name,
        min_level: availableRequirements.find(r => r.id === selectedRequirement)!.defaultLevel,
        weight: 1.5
      }]
    : [];

  useEffect(() => {
    if (!open) return;

    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    if (date && selectedWorkers.length > 0) {
      // Check competency requirements
      if (requirements.length > 0) {
        for (const req of requirements) {
          const hasQualifiedWorker = selectedWorkers.some(workerId => {
            const competencies = workerCompetencies[workerId] || [];
            return competencies.some(c => c.competence_id === req.competence_id && c.level >= req.min_level);
          });

          if (!hasQualifiedWorker) {
            newWarnings.push(`Missing Requirement: ${req.competence_name} Level ${req.min_level}`);
          }
        }
      }

      // Check fatigue violations
      const dateStr = format(date, "yyyy-MM-dd");
      for (const workerId of selectedWorkers) {
        const worker = workers.find(w => w.id === workerId);
        const currentShiftDate = new Date(dateStr);

        for (const shift of existingShifts) {
          if (shift.assigned_workers.includes(workerId)) {
            const existingShiftDate = new Date(shift.shift_date);
            const dayDifference = Math.abs((currentShiftDate.getTime() - existingShiftDate.getTime()) / (1000 * 60 * 60 * 24));

            if (dayDifference <= 1) {
              if (shift.shift_time === "NIGHT" && shiftTime === "MORNING") {
                newErrors.push(`Rest Period Violation: ${worker?.display_name} cannot work MORNING after NIGHT shift. Minimum 12 hours rest required.`);
              }
              if (shiftTime === "NIGHT" && shift.shift_time === "MORNING") {
                newErrors.push(`Rest Period Violation: ${worker?.display_name} cannot work NIGHT after MORNING shift on consecutive days. Minimum 12 hours rest required.`);
              }
            }
          }
        }
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
  }, [date, shiftTime, selectedWorkers, requirements, workers, workerCompetencies, existingShifts, open]);

  const handleSubmit = () => {
    if (!date) {
      setErrors(["Please select a date"]);
      return;
    }

    if (errors.length > 0) {
      return;
    }

    const shift: Omit<Shift, "id"> = {
      shift_date: format(date, "yyyy-MM-dd"),
      shift_time: shiftTime,
      assigned_workers: selectedWorkers,
      requirements
    };

    onAdd(shift);
    handleClose();
  };

  const handleClose = () => {
    setDate(undefined);
    setCalendarOpen(false);
    setShiftTime("MORNING");
    setSelectedRequirement(null);
    setSelectedWorkers([]);
    setErrors([]);
    setWarnings([]);
    onOpenChange(false);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setCalendarOpen(false);
    }
  };

  const toggleWorker = (workerId: number) => {
    setSelectedWorkers(prev =>
      prev.includes(workerId)
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const hasAllRequirementsMet = warnings.length === 0 && requirements.length > 0 && selectedWorkers.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Shift Assignment" : "Add New Shift"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Modify the shift details and worker assignments. The system will validate competency requirements and rest periods."
              : "Create a new shift and assign workers. The system will validate competency requirements and rest periods."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-picker">Shift Date</Label>
              <input
                id="date-picker"
                type="date"
                value={date ? format(date, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month, day] = e.target.value.split("-");
                    const selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    setDate(selectedDate);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500">
                {date ? format(date, "PPP") : "Select a date"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Shift Time</Label>
              <Select value={shiftTime} onValueChange={(value) => setShiftTime(value as ShiftTime)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MORNING">Morning</SelectItem>
                  <SelectItem value="EVENING">Evening</SelectItem>
                  <SelectItem value="NIGHT">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Required Competency (Optional)</Label>
            <Select
              value={selectedRequirement?.toString() || "none"}
              onValueChange={(value) => setSelectedRequirement(value === "none" ? null : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="No specific requirement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific requirement</SelectItem>
                {availableRequirements.map(req => (
                  <SelectItem key={req.id} value={req.id.toString()}>
                    {req.name} (Level {req.defaultLevel}+)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assign Workers</Label>
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {workers.map(worker => {
                const isSelected = selectedWorkers.includes(worker.id);
                const competencies = workerCompetencies[worker.id] || [];
                const meetsRequirement = !selectedRequirement || competencies.some(
                  c => c.competence_id === selectedRequirement &&
                    c.level >= availableRequirements.find(r => r.id === selectedRequirement)!.defaultLevel
                );

                return (
                  <button
                    key={worker.id}
                    onClick={() => toggleWorker(worker.id)}
                    className={`w-full p-2 rounded-md text-left transition-colors ${
                      isSelected
                        ? "bg-blue-100 border-2 border-blue-500"
                        : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{worker.display_name}</p>
                        <p className="text-xs text-slate-500">{worker.employee_no}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {worker.availability_next_7d_pct}% Available
                        </Badge>
                        {selectedRequirement && (
                          meetsRequirement ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedWorkers.length > 0 && (
            <div className="space-y-2">
              <Label>Assigned Workers List</Label>
              <div className="border rounded-lg p-3 space-y-2 bg-slate-50">
                {selectedWorkers.map(workerId => {
                  const worker = workers.find(w => w.id === workerId);
                  if (!worker) return null;
                  
                  return (
                    <div
                      key={workerId}
                      className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                    >
                      <div>
                        <p className="font-medium text-sm text-slate-900">{worker.display_name}</p>
                        <p className="text-xs text-slate-500">{worker.employee_no}</p>
                      </div>
                      <button
                        onClick={() => toggleWorker(workerId)}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                        aria-label="Remove worker"
                      >
                        <X className="h-4 w-4 text-slate-600 hover:text-red-600" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                {selectedWorkers.length} worker{selectedWorkers.length !== 1 ? 's' : ''} assigned
              </p>
            </div>
          )}

          {/* Validation Banner */}
          {selectedWorkers.length > 0 && (
            <div className="space-y-2">
              {requirements.length > 0 && (
                <Alert className={hasAllRequirementsMet ? "border-green-300 bg-green-50" : "border-yellow-300 bg-yellow-50"}>
                  {hasAllRequirementsMet ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>All Competencies Met:</strong> All shift requirements are satisfied by the assigned workers.
                      </AlertDescription>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>Requirements Not Met:</strong> Some competency requirements are missing.
                      </AlertDescription>
                    </>
                  )}
                </Alert>
              )}

              {errors.length > 0 && (
                <Alert variant="destructive" className="border-red-300 bg-red-50 text-red-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Validation Errors:</strong>
                    <ul className="space-y-1 text-sm mt-2">
                      {errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {warnings.length > 0 && errors.length === 0 && (
                <Alert variant="default" className="border-yellow-300 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Warnings:</strong>
                    <ul className="space-y-1 text-sm mt-2">
                      {warnings.map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}


        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!date || errors.length > 0}>
            Add Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
