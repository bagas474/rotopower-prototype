import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { Site } from "./TopNavigation";

interface CreateSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regionId: number | null;
  onCreate: (site: Omit<Site, "id">) => void;
}

export function CreateSiteDialog({ open, onOpenChange, regionId, onCreate }: CreateSiteDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");

    if (!code.trim()) {
      setError("Site code is required");
      return;
    }

    if (code.length > 5) {
      setError("Site code must be 5 characters or less");
      return;
    }

    if (!name.trim()) {
      setError("Site name is required");
      return;
    }

    if (!regionId) {
      setError("Please select a region first");
      return;
    }

    onCreate({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      region_id: regionId,
      description: description.trim()
    });

    handleClose();
  };

  const handleClose = () => {
    setCode("");
    setName("");
    setDescription("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Site</DialogTitle>
          <DialogDescription>
            Add a new plant site to the selected region
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Site Code * (Max 5 characters)</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., PLTU1"
              maxLength={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Site Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Suralaya"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Main coal power plant"
              rows={3}
            />
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
            Create Site
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
