import { useState, useEffect } from "react";
import { RoleCompetenceRequirement } from "./RoleRequirementsMenu";
import { Competence } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";

interface AddEditRoleRequirementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement?: RoleCompetenceRequirement;
  availableCompetencies: Competence[];
  existingCompetenceIds: number[];
  onSave: (competenceId: number, minLevel: number) => void;
}

export function AddEditRoleRequirementDialog({
  open,
  onOpenChange,
  requirement,
  availableCompetencies,
  existingCompetenceIds,
  onSave,
}: AddEditRoleRequirementDialogProps) {
  const [competenceId, setCompetenceId] = useState<string>("");
  const [minLevel, setMinLevel] = useState(5);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (requirement) {
        setCompetenceId(requirement.competence_id.toString());
        setMinLevel(requirement.min_level);
      } else {
        setCompetenceId("");
        setMinLevel(5);
      }
      setErrors({});
    }
  }, [open, requirement]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!competenceId) {
      newErrors.competence = "Please select a competency";
    } else if (!requirement) {
      // When adding new requirement, check for duplicates
      const compId = parseInt(competenceId);
      if (existingCompetenceIds.includes(compId)) {
        newErrors.competence = "This competency is already a requirement";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave(parseInt(competenceId), minLevel);
    onOpenChange(false);
  };

  // Filter competencies: when editing, include the current one; when adding, exclude existing
  const filteredCompetencies = requirement
    ? availableCompetencies
    : availableCompetencies.filter(c => !existingCompetenceIds.includes(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {requirement ? "Edit Requirement" : "Add Requirement"}
          </DialogTitle>
          <DialogDescription>
            {requirement
              ? "Update the minimum competency level required for this role."
              : "Define a competency prerequisite for this role."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="competency">Competency</Label>
            <Select
              value={competenceId}
              onValueChange={setCompetenceId}
              disabled={!!requirement}
            >
              <SelectTrigger
                id="competency"
                className={errors.competence ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select a competency..." />
              </SelectTrigger>
              <SelectContent>
                {filteredCompetencies.length === 0 ? (
                  <div className="p-2 text-sm text-slate-500">
                    No competencies available
                  </div>
                ) : (
                  filteredCompetencies.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id.toString()}>
                      {comp.name}
                      {comp.category && (
                        <span className="text-slate-500 ml-2">
                          ({comp.category})
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.competence && (
              <p className="text-sm text-red-600">{errors.competence}</p>
            )}
            {requirement && (
              <p className="text-xs text-slate-500">
                Competency cannot be changed when editing
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="min-level">Minimum Level Required</Label>
              <span className="text-lg font-semibold text-blue-600">
                Level {minLevel}
              </span>
            </div>
            <Slider
              id="min-level"
              min={1}
              max={10}
              step={1}
              value={[minLevel]}
              onValueChange={(value) => setMinLevel(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Beginner (1)</span>
              <span>Expert (10)</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {requirement ? "Save Changes" : "Add Requirement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
