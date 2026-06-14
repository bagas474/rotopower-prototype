import { useState } from "react";
import { Search, Plus, Pencil, Trash2, Award } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Competence, UserCompetence } from "../types";
import { AddEditCompetencyDialog } from "./AddEditCompetencyDialog";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface MasterSkillsDictionaryProps {
  competencies: Competence[];
  workerCompetencies: Record<number, UserCompetence[]>;
  onAddCompetency: (competency: Omit<Competence, "id">) => void;
  onUpdateCompetency: (competency: Competence) => void;
  onDeleteCompetency: (competencyId: number) => void;
}

export function MasterSkillsDictionary({
  competencies,
  workerCompetencies,
  onAddCompetency,
  onUpdateCompetency,
  onDeleteCompetency,
}: MasterSkillsDictionaryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState<Competence | undefined>(
    undefined
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [competencyToDelete, setCompetencyToDelete] = useState<Competence | null>(null);

  const getWorkerCountForCompetency = (competencyId: number) => {
    return Object.values(workerCompetencies).filter((comps) =>
      comps.some((c) => c.competence_id === competencyId)
    ).length;
  };

  const filteredCompetencies = competencies.filter(
    (comp) =>
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClick = () => {
    setSelectedCompetency(undefined);
    setAddEditDialogOpen(true);
  };

  const handleEditClick = (competency: Competence) => {
    setSelectedCompetency(competency);
    setAddEditDialogOpen(true);
  };

  const handleDeleteClick = (competency: Competence) => {
    const workerCount = getWorkerCountForCompetency(competency.id);
    if (workerCount > 0) {
      setCompetencyToDelete(competency);
      setDeleteConfirmOpen(true);
    } else {
      onDeleteCompetency(competency.id);
    }
  };

  const handleSaveCompetency = (competency: Omit<Competence, "id"> | Competence) => {
    if ("id" in competency) {
      onUpdateCompetency(competency);
    } else {
      onAddCompetency(competency);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="flex-shrink-0 p-6 space-y-4 bg-white border-b">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Master Skills Dictionary
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Central repository of all recognized competencies in the system
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search competencies by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Competency
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="border rounded-lg bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">ID</TableHead>
                <TableHead>Competency Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Workers</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompetencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-12">
                    {searchQuery
                      ? "No competencies found matching your search"
                      : "No competencies available. Click 'Add Competency' to create one."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompetencies.map((competency) => {
                  const workerCount = getWorkerCountForCompetency(competency.id);
                  return (
                    <TableRow key={competency.id}>
                      <TableCell className="font-mono text-sm text-slate-500">
                        {competency.id}
                      </TableCell>
                      <TableCell className="font-medium">{competency.name}</TableCell>
                      <TableCell>
                        {competency.category ? (
                          <Badge variant="outline">{competency.category}</Badge>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-md">
                        {competency.description ? (
                          <span className="line-clamp-2">{competency.description}</span>
                        ) : (
                          <span className="text-slate-400 italic text-sm">No description</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {workerCount > 0 ? (
                          <Badge variant="secondary">{workerCount}</Badge>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(competency)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(competency)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddEditCompetencyDialog
        open={addEditDialogOpen}
        onOpenChange={setAddEditDialogOpen}
        competency={selectedCompetency}
        existingCompetencies={competencies}
        onSave={handleSaveCompetency}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Cannot Delete Competency"
        message={`The competency "${competencyToDelete?.name}" is currently assigned to workers and cannot be deleted.`}
        impact={`${
          competencyToDelete ? getWorkerCountForCompetency(competencyToDelete.id) : 0
        } worker(s) have this competency assigned. Please remove this competency from all workers before deleting it.`}
        confirmText="OK"
        confirmVariant="default"
        onConfirm={() => {}}
      />
    </div>
  );
}
