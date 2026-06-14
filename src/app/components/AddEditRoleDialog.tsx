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
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { Role } from "../types";

interface AddEditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role;
  existingRoles: Role[];
  onSave: (role: Omit<Role, "id"> | Role) => void;
}

export function AddEditRoleDialog({
  open,
  onOpenChange,
  role,
  existingRoles,
  onSave,
}: AddEditRoleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const isEditMode = !!role;

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
    } else {
      setName("");
      setDescription("");
    }
    setError("");
  }, [role, open]);

  const validateRoleName = (roleName: string): string | null => {
    const trimmed = roleName.trim();

    if (!trimmed) {
      return "Role name is required";
    }

    if (trimmed.length < 2) {
      return "Role name must be at least 2 characters";
    }

    if (trimmed.length > 50) {
      return "Role name must be 50 characters or less";
    }

    if (trimmed !== trimmed.replace(/^\s+|\s+$/g, "")) {
      return "Role name cannot start or end with spaces";
    }

    const validPattern = /^[a-zA-Z0-9\s\-]+$/;
    if (!validPattern.test(trimmed)) {
      return "Role name can only contain letters, numbers, spaces, and hyphens";
    }

    const isDuplicate = existingRoles.some(
      (r) =>
        r.name.toLowerCase() === trimmed.toLowerCase() &&
        (!isEditMode || r.id !== role.id)
    );

    if (isDuplicate) {
      return "A role with this name already exists";
    }

    return null;
  };

  const handleSubmit = () => {
    setError("");

    const nameError = validateRoleName(name);
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
        ...role,
        name: name.trim(),
        description: description.trim(),
      });
    } else {
      onSave({
        name: name.trim(),
        description: description.trim(),
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Role" : "Create New Role"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the role details"
              : "Add a new role to the system"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Senior Technician"
              maxLength={50}
              disabled={isEditMode && role?.is_system}
            />
            {isEditMode && role?.is_system && (
              <p className="text-xs text-slate-500">
                System role names cannot be changed
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Experienced technician with specialized skills"
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
            {isEditMode ? "Save Changes" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
