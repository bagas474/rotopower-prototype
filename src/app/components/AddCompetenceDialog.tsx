import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";

interface Competence {
  id: number;
  name: string;
}

interface AddCompetenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCompetencies: Competence[];
  existingCompetenceIds: number[];
  onAdd: (competenceId: number, level: number, source: string) => void;
}

export function AddCompetenceDialog({
  open,
  onOpenChange,
  availableCompetencies,
  existingCompetenceIds,
  onAdd
}: AddCompetenceDialogProps) {
  const [selectedCompetenceId, setSelectedCompetenceId] = useState<string>("");
  const [level, setLevel] = useState<string>("5");
  const [source, setSource] = useState<string>("Certification");
  const [error, setError] = useState<string>("");

  const handleSubmit = () => {
    setError("");

    if (!selectedCompetenceId) {
      setError("Please select a competence");
      return;
    }

    const levelNum = parseInt(level);
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 10) {
      setError("Level must be between 1 and 10");
      return;
    }

    if (existingCompetenceIds.includes(parseInt(selectedCompetenceId))) {
      setError("This worker already holds this competency. Please edit the existing entry instead.");
      return;
    }

    onAdd(parseInt(selectedCompetenceId), levelNum, source);
    handleClose();
  };

  const handleClose = () => {
    setSelectedCompetenceId("");
    setLevel("5");
    setSource("Certification");
    setError("");
    onOpenChange(false);
  };

  const isDuplicate = selectedCompetenceId && existingCompetenceIds.includes(parseInt(selectedCompetenceId));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Competence</DialogTitle>
          <DialogDescription>
            Add a new competency to this worker's profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="competence">Competence</Label>
            <Select value={selectedCompetenceId} onValueChange={setSelectedCompetenceId}>
              <SelectTrigger id="competence" className={isDuplicate ? "border-yellow-400 bg-yellow-50" : ""}>
                <SelectValue placeholder="Select a competence" />
              </SelectTrigger>
              <SelectContent>
                {availableCompetencies.map(comp => (
                  <SelectItem key={comp.id} value={comp.id.toString()}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isDuplicate && (
              <p className="text-xs text-yellow-700">
                Worker already holds this competency
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Level (1-10)</Label>
            <Input
              id="level"
              type="number"
              min="1"
              max="10"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className={error.includes("Level") ? "border-red-500" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Certification">Certification</SelectItem>
                <SelectItem value="Peer Review">Peer Review</SelectItem>
                <SelectItem value="Manager Assessment">Manager Assessment</SelectItem>
                <SelectItem value="Self Assessment">Self Assessment</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
              </SelectContent>
            </Select>
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
          <Button onClick={handleSubmit} disabled={isDuplicate}>
            Add Competence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
