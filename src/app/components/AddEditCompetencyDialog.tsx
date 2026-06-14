import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { Competence } from "../types";

interface AddEditCompetencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competency?: Competence;
  existingCompetencies: Competence[];
  onSave: (competency: Omit<Competence, "id"> | Competence) => void;
}

const CATEGORIES = [
  "Electrical",
  "HVAC",
  "Instrumentation",
  "Mechanical",
  "Safety",
  "Technical",
  "Welding"
];

export function AddEditCompetencyDialog({
  open,
  onOpenChange,
  competency,
  existingCompetencies,
  onSave,
}: AddEditCompetencyDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const isEditMode = !!competency;

  useEffect(() => {
    if (competency) {
      setName(competency.name);
      setCategory(competency.category || "");
      setDescription(competency.description || "");
    } else {
      setName("");
      setCategory("");
      setDescription("");
    }
    setError("");
  }, [competency, open]);

  const validateCompetencyName = (compName: string): string | null => {
    const trimmed = compName.trim();

    if (!trimmed) {
      return "Skill name is required";
    }

    if (trimmed.length < 2) {
      return "Skill name must be at least 2 characters";
    }

    if (trimmed.length > 100) {
      return "Skill name must be 100 characters or less";
    }

    const isDuplicate = existingCompetencies.some(
      (c) =>
        c.name.toLowerCase() === trimmed.toLowerCase() &&
        (!isEditMode || c.id !== competency.id)
    );

    if (isDuplicate) {
      return "Skill already exists in the dictionary";
    }

    return null;
  };

  const handleSubmit = () => {
    setError("");

    const nameError = validateCompetencyName(name);
    if (nameError) {
      setError(nameError);
      return;
    }

    if (description.length > 200) {
      setError("Description must be 200 characters or less");
      return;
    }

    if (isEditMode) {
      onSave({
        ...competency,
        name: name.trim(),
        category: category || undefined,
        description: description.trim() || undefined,
      });
    } else {
      onSave({
        name: name.trim(),
        category: category || undefined,
        description: description.trim() || undefined,
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setName("");
    setCategory("");
    setDescription("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Skill" : "Add New Skill"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the skill details in the master dictionary"
              : "Define a new skill in the master dictionary"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Skill Label *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Voltage Operations"
              maxLength={100}
            />
            <p className="text-xs text-slate-500">
              Use standardized naming to prevent duplicates
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Categorization helps organize and filter competencies
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Ability to perform tungsten inert gas welding"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-slate-500 text-right">
              {description.length}/200
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditMode ? "Save Changes" : "Create Skill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
