import { useState } from "react";
import { Award, Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Competence } from "../types";
import { AddEditRoleRequirementDialog } from "./AddEditRoleRequirementDialog";
import { ConfirmationDialog } from "./ConfirmationDialog";

export interface WorkRoleMaster {
  id: number;
  name: string;
  description: string;
}

export interface RoleCompetenceRequirement {
  role_id: number;
  competence_id: number;
  competence_name: string;
  min_level: number;
}

interface RoleRequirementsMenuProps {
  roleRequirements: Record<number, RoleCompetenceRequirement[]>;
  competencies: Competence[];
  onAddRequirement: (roleId: number, competenceId: number, minLevel: number) => void;
  onUpdateRequirement: (roleId: number, requirement: RoleCompetenceRequirement) => void;
  onDeleteRequirement: (roleId: number, competenceId: number) => void;
}

// Phase 1: Hardcoded Worker role ID
const WORKER_ROLE_ID = 1;

export function RoleRequirementsMenu({
  roleRequirements,
  competencies,
  onAddRequirement,
  onUpdateRequirement,
  onDeleteRequirement,
}: RoleRequirementsMenuProps) {
  const [addEditRequirementDialogOpen, setAddEditRequirementDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<RoleCompetenceRequirement | undefined>(undefined);
  const [deleteRequirementConfirmOpen, setDeleteRequirementConfirmOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState<RoleCompetenceRequirement | null>(null);

  const currentRequirements = roleRequirements[WORKER_ROLE_ID] || [];

  const handleAddRequirementClick = () => {
    setEditingRequirement(undefined);
    setAddEditRequirementDialogOpen(true);
  };

  const handleEditRequirementClick = (requirement: RoleCompetenceRequirement) => {
    setEditingRequirement(requirement);
    setAddEditRequirementDialogOpen(true);
  };

  const handleDeleteRequirementClick = (requirement: RoleCompetenceRequirement) => {
    setRequirementToDelete(requirement);
    setDeleteRequirementConfirmOpen(true);
  };

  const handleSaveRequirement = (competenceId: number, minLevel: number) => {
    if (editingRequirement) {
      const updatedRequirement: RoleCompetenceRequirement = {
        role_id: WORKER_ROLE_ID,
        competence_id: competenceId,
        competence_name: competencies.find(c => c.id === competenceId)?.name || "",
        min_level: minLevel,
      };
      onUpdateRequirement(WORKER_ROLE_ID, updatedRequirement);
    } else {
      onAddRequirement(WORKER_ROLE_ID, competenceId, minLevel);
    }
  };

  const existingCompetenceIds = currentRequirements.map(r => r.competence_id);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="flex-shrink-0 p-6 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-semibold">Role Requirements</h1>
          </div>
          <p className="text-sm text-slate-600">
            Define prerequisite skills required for the Worker role
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-base px-3 py-1">
              Role: Worker
            </Badge>
            <span className="text-sm text-slate-500">
              {currentRequirements.length} {currentRequirements.length === 1 ? 'requirement' : 'requirements'}
            </span>
          </div>
          <Button onClick={handleAddRequirementClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Requirement
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {currentRequirements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Award className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">
              No Prerequisites Defined
            </h3>
            <p className="text-slate-500 mb-4">
              Click "Add Requirement" to define required skills for the Worker role
            </p>
          </div>
        ) : (
          <div className="border rounded-lg bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competency</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Minimum Level</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRequirements.map(req => {
                  const competence = competencies.find(c => c.id === req.competence_id);
                  return (
                    <TableRow key={req.competence_id}>
                      <TableCell className="font-medium">{req.competence_name}</TableCell>
                      <TableCell>
                        {competence?.category ? (
                          <Badge variant="outline">{competence.category}</Badge>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">
                          Level {req.min_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRequirementClick(req)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteRequirementClick(req)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AddEditRoleRequirementDialog
        open={addEditRequirementDialogOpen}
        onOpenChange={setAddEditRequirementDialogOpen}
        requirement={editingRequirement}
        availableCompetencies={competencies}
        existingCompetenceIds={existingCompetenceIds}
        onSave={handleSaveRequirement}
      />

      <ConfirmationDialog
        open={deleteRequirementConfirmOpen}
        onOpenChange={setDeleteRequirementConfirmOpen}
        title="Delete Requirement"
        message={`Remove "${requirementToDelete?.competence_name}" as a requirement for the Worker role?`}
        confirmText="Remove"
        confirmVariant="destructive"
        onConfirm={() => {
          if (requirementToDelete) {
            onDeleteRequirement(WORKER_ROLE_ID, requirementToDelete.competence_id);
          }
        }}
      />
    </div>
  );
}
