import { useState } from "react";
import { WorkerList } from "./WorkerList";
import { WorkerDetail } from "./WorkerDetail";
import { AddCompetenceDialog } from "./AddCompetenceDialog";
import { Worker, WorkRole, UserCompetence, Competence } from "../types";
import { toast } from "sonner";

interface WorkerProfilesProps {
  workers: Worker[];
  workerRoles: Record<number, WorkRole[]>;
  workerCompetencies: Record<number, UserCompetence[]>;
  competencies: Competence[];
  onAddCompetence: (workerId: number, competenceId: number, level: number, source: string) => void;
  onEditCompetence: (competence: UserCompetence) => void;
  onDeleteCompetence: (workerId: number, competence: UserCompetence) => void;
  onAddRole: () => void;
}

export function WorkerProfiles({
  workers,
  workerRoles,
  workerCompetencies,
  competencies,
  onAddCompetence,
  onEditCompetence,
  onDeleteCompetence,
  onAddRole,
}: WorkerProfilesProps) {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [addCompetenceDialogOpen, setAddCompetenceDialogOpen] = useState(false);

  const currentRoles = selectedWorker ? workerRoles[selectedWorker.id] || [] : [];
  const currentCompetencies = selectedWorker ? workerCompetencies[selectedWorker.id] || [] : [];
  const existingCompetenceIds = currentCompetencies.map(c => c.competence_id);

  const handleAddCompetenceSubmit = (competenceId: number, level: number, source: string) => {
    if (!selectedWorker) return;
    onAddCompetence(selectedWorker.id, competenceId, level, source);
  };

  const handleDeleteCompetence = (competence: UserCompetence) => {
    if (!selectedWorker) return;
    onDeleteCompetence(selectedWorker.id, competence);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Pane - Worker List */}
      <div className="w-80 flex-shrink-0 h-full">
        <WorkerList
          workers={workers}
          selectedWorkerId={selectedWorker?.id || null}
          onSelectWorker={setSelectedWorker}
        />
      </div>

      {/* Right Pane - Worker Detail */}
      <div className="flex-1 h-full overflow-hidden">
        <WorkerDetail
          worker={selectedWorker}
          workRoles={currentRoles}
          competencies={currentCompetencies}
          onAddCompetence={() => setAddCompetenceDialogOpen(true)}
          onEditCompetence={onEditCompetence}
          onDeleteCompetence={handleDeleteCompetence}
          onAddRole={onAddRole}
        />
      </div>

      {/* Add Competence Dialog */}
      <AddCompetenceDialog
        open={addCompetenceDialogOpen}
        onOpenChange={setAddCompetenceDialogOpen}
        availableCompetencies={competencies}
        existingCompetenceIds={existingCompetenceIds}
        onAdd={handleAddCompetenceSubmit}
      />
    </div>
  );
}
