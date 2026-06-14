import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { WorkerList } from "./WorkerList";
import { WorkerDetail } from "./WorkerDetail";
import { RoleRequirements } from "./RoleRequirements";
import { MasterSkillsDictionary } from "./MasterSkillsDictionary";
import { AddCompetenceDialog } from "./AddCompetenceDialog";
import { Worker, WorkRole, UserCompetence, Competence } from "../types";
import { toast } from "sonner";

interface CraftCompetencyProps {
  workers: Worker[];
  workerRoles: Record<number, WorkRole[]>;
  workerCompetencies: Record<number, UserCompetence[]>;
  competencies: Competence[];
  onAddCompetence: (workerId: number, competenceId: number, level: number, source: string) => void;
  onEditCompetence: (competence: UserCompetence) => void;
  onDeleteCompetence: (workerId: number, competence: UserCompetence) => void;
  onAddRole: () => void;
  onAddCompetencyToSystem: (competency: Omit<Competence, "id">) => void;
  onUpdateCompetency: (competency: Competence) => void;
  onDeleteCompetency: (competencyId: number) => void;
}

export function CraftCompetency({
  workers,
  workerRoles,
  workerCompetencies,
  competencies,
  onAddCompetence,
  onEditCompetence,
  onDeleteCompetence,
  onAddRole,
  onAddCompetencyToSystem,
  onUpdateCompetency,
  onDeleteCompetency,
}: CraftCompetencyProps) {
  const [activeTab, setActiveTab] = useState("worker-profiles");
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
    <div className="h-full flex flex-col overflow-hidden bg-slate-50">
      <div className="flex-shrink-0 p-6 bg-white border-b">
        <h2 className="text-2xl font-bold text-slate-900">Craft & Competency</h2>
        <p className="text-slate-600">Manage workforce skills, roles, and competency requirements</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-6 pt-4 bg-white border-b">
          <TabsList>
            <TabsTrigger value="worker-profiles">Worker Profiles</TabsTrigger>
            <TabsTrigger value="role-requirements">Role Requirements</TabsTrigger>
            <TabsTrigger value="master-skills">Master Skills Dictionary</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="worker-profiles" className="flex-1 flex overflow-hidden m-0 data-[state=active]:flex">
          <div className="w-80 flex-shrink-0 h-full">
            <WorkerList
              workers={workers}
              selectedWorkerId={selectedWorker?.id || null}
              onSelectWorker={setSelectedWorker}
            />
          </div>
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
        </TabsContent>

        <TabsContent value="role-requirements" className="flex-1 overflow-hidden m-0 data-[state=active]:block">
          <RoleRequirements
            workerRoles={workerRoles}
            competencies={competencies}
          />
        </TabsContent>

        <TabsContent value="master-skills" className="flex-1 overflow-hidden m-0 data-[state=active]:block">
          <MasterSkillsDictionary
            competencies={competencies}
            workerCompetencies={workerCompetencies}
            onAddCompetency={onAddCompetencyToSystem}
            onUpdateCompetency={onUpdateCompetency}
            onDeleteCompetency={onDeleteCompetency}
          />
        </TabsContent>
      </Tabs>

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
