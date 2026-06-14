import { useState, useEffect } from "react";
import { RootCauseAnalysis } from "./components/RootCauseAnalysis";
import { RCFACanvas } from "./components/RCFACanvas";
import { WorkOrders } from "./components/WorkOrders";
import { WorkerProfiles } from "./components/WorkerProfiles";
import { ShiftRosterCalendar } from "./components/ShiftRosterCalendar";
import { MROInventory } from "./components/MROInventory";
import { UsersRoles } from "./components/UsersRoles";
import { ManageCompetencies } from "./components/ManageCompetencies";
import { RoleRequirementsMenu, RoleCompetenceRequirement } from "./components/RoleRequirementsMenu";
import { AppSidebar } from "./components/AppSidebar";
import { TopNavigation, Region, Site, GlobalContext } from "./components/TopNavigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./components/ui/sidebar";
import { Separator } from "./components/ui/separator";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { mockUsers, mockWorkers, mockWorkRoles, mockCompetencies, mockRoles, mockRoleRequirements } from "./data/mockData";
import { User, Worker, WorkRole, UserCompetence, Role, Competence } from "./types";

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("worker-profiles");

  // Roles and Competencies state
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [competencies, setCompetencies] = useState<Competence[]>([
    { id: 5, name: "Hydraulics", category: "Mechanical" },
    { id: 8, name: "Climate Control Systems", category: "HVAC" },
    { id: 11, name: "Process Control", category: "Instrumentation" },
    { id: 12, name: "TIG Welding", category: "Welding" },
    { id: 13, name: "Pneumatics", category: "Mechanical" },
    { id: 15, name: "Pipe Fitting", category: "Mechanical" },
    { id: 18, name: "High Voltage Operations", category: "Electrical" },
    { id: 19, name: "Refrigeration", category: "HVAC" },
    { id: 22, name: "High Pressure Systems", category: "Mechanical" },
    { id: 24, name: "Sensor Calibration", category: "Instrumentation" },
    { id: 25, name: "PLC Programming", category: "Electrical" },
    { id: 27, name: "Machine Assembly", category: "Mechanical" },
    { id: 31, name: "Motor Control", category: "Electrical" },
    { id: 33, name: "Ventilation Design", category: "HVAC" },
    { id: 34, name: "Safety Protocols", category: "Safety" },
    { id: 37, name: "Data Analysis", category: "Instrumentation" },
    { id: 41, name: "Blueprint Reading", category: "Technical" },
    { id: 42, name: "Loop Tuning", category: "Instrumentation" },
    { id: 44, name: "Troubleshooting", category: "Technical" },
    { id: 46, name: "Energy Efficiency", category: "HVAC" }
  ]);

  // Global context state
  const [globalContext, setGlobalContext] = useState<GlobalContext>(() => {
    const stored = localStorage.getItem('global_context');
    return stored ? JSON.parse(stored) : { region_id: 1, site_id: 1 };
  });

  // Mock regions and sites
  const [regions] = useState<Region[]>([
    { id: 1, name: "Sumatra Fleet", description: "Sumatra island operations" },
    { id: 2, name: "Java Fleet", description: "Java island operations" }
  ]);

  const [sites] = useState<Site[]>([
    { id: 1, code: "PLTU1", name: "Suralaya", region_id: 1, description: "Main coal power plant" },
    { id: 2, code: "PLTU2", name: "Tarahan", region_id: 1, description: "Secondary coal plant" },
    { id: 3, code: "PLTG1", name: "Muara Karang", region_id: 2, description: "Gas turbine plant" }
  ]);

  // Current logged-in user
  const currentUser = {
    first_name: mockUsers[1].first_name,
    last_name: mockUsers[1].last_name,
    email: mockUsers[1].email,
    is_admin: mockUsers[1].role_names.includes("Administrator")
  };

  // Shared state for users/workers
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [workers, setWorkers] = useState<Worker[]>(mockWorkers);
  const [workerRoles, setWorkerRoles] = useState<Record<number, WorkRole[]>>(mockWorkRoles);
  const [workerCompetencies, setWorkerCompetencies] = useState<Record<number, UserCompetence[]>>(mockCompetencies);

  // Role requirements state (Phase 1: Worker role only)
  const [roleRequirements, setRoleRequirements] = useState<Record<number, RoleCompetenceRequirement[]>>(mockRoleRequirements);

  // Sync workers when users change
  const handleUserUpdate = (updatedUsers: User[]) => {
    setUsers(updatedUsers);

    // Update workers to match users
    const updatedWorkers = updatedUsers
      .filter(u => u.is_active) // Only active users appear as workers
      .map(user => ({
        id: user.id,
        site_id: user.sites[0] || 1,
        user_id: user.id,
        display_name: `${user.first_name} ${user.last_name}`,
        employee_no: `EMP-900${user.id}`,
        stress_level: workers.find(w => w.id === user.id)?.stress_level || 3,
        psychological_load: workers.find(w => w.id === user.id)?.psychological_load || 3,
        availability_next_7d_pct: workers.find(w => w.id === user.id)?.availability_next_7d_pct || 80
      }));

    setWorkers(updatedWorkers);
  };

  const handleAddCompetence = (workerId: number, competenceId: number, level: number, source: string) => {
    const competence = competencies.find(c => c.id === competenceId);
    if (!competence) return;

    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    const newCompetence: UserCompetence = {
      competence_id: competenceId,
      competence_name: competence.name,
      level,
      source
    };

    setWorkerCompetencies(prev => ({
      ...prev,
      [workerId]: [...(prev[workerId] || []), newCompetence]
    }));

    toast.success(`Added ${competence.name} to ${worker.display_name}'s profile`);
  };

  const handleEditCompetence = (competence: UserCompetence) => {
    toast.info("Edit functionality would open a dialog here");
  };

  const handleDeleteCompetence = (workerId: number, competence: UserCompetence) => {
    setWorkerCompetencies(prev => ({
      ...prev,
      [workerId]: (prev[workerId] || []).filter(c => c.competence_id !== competence.competence_id)
    }));

    toast.success(`Removed ${competence.competence_name}`);
  };

  const handleAddRole = () => {
    toast.info("Add role functionality would open a dialog here");
  };

  // Role CRUD handlers
  const handleAddRoleToSystem = (newRole: Omit<Role, "id">) => {
    const role: Role = {
      ...newRole,
      id: Math.max(...roles.map(r => r.id), 0) + 1
    };
    setRoles(prev => [...prev, role]);
    toast.success(`Role "${role.name}" has been created`);
  };

  const handleUpdateRole = (updatedRole: Role) => {
    const oldRole = roles.find(r => r.id === updatedRole.id);

    setRoles(prev => prev.map(r =>
      r.id === updatedRole.id ? updatedRole : r
    ));

    // Sync user role_names if role name changed
    if (oldRole && oldRole.name !== updatedRole.name) {
      setUsers(prev => prev.map(user => {
        if (user.roles.includes(updatedRole.id)) {
          const newRoleNames = user.roles.map(roleId => {
            const role = roleId === updatedRole.id
              ? updatedRole
              : roles.find(r => r.id === roleId);
            return role?.name || "";
          });
          return { ...user, role_names: newRoleNames };
        }
        return user;
      }));
    }

    toast.success("Role has been updated");
  };

  const handleDeleteRole = (roleId: number) => {
    const usersWithRole = users.filter(u => u.roles.includes(roleId));

    if (usersWithRole.length > 0) {
      toast.error(`Cannot delete role. ${usersWithRole.length} user(s) are assigned this role.`);
      return;
    }

    setRoles(prev => prev.filter(r => r.id !== roleId));
    toast.success("Role has been deleted");
  };

  // Competency CRUD handlers
  const handleAddCompetencyToSystem = (newComp: Omit<Competence, "id">) => {
    const competency: Competence = {
      ...newComp,
      id: Math.max(...competencies.map(c => c.id), 0) + 1
    };
    setCompetencies(prev => [...prev, competency]);
    toast.success(`Skill "${competency.name}" has been added to the dictionary`);
  };

  const handleUpdateCompetency = (updatedComp: Competence) => {
    const oldComp = competencies.find(c => c.id === updatedComp.id);

    setCompetencies(prev => prev.map(c =>
      c.id === updatedComp.id ? updatedComp : c
    ));

    // Sync competence_name in all workerCompetencies records
    if (oldComp && oldComp.name !== updatedComp.name) {
      setWorkerCompetencies(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(workerId => {
          updated[Number(workerId)] = updated[Number(workerId)].map(wc =>
            wc.competence_id === updatedComp.id
              ? { ...wc, competence_name: updatedComp.name }
              : wc
          );
        });
        return updated;
      });

      // Sync competence_name in all roleRequirements records
      setRoleRequirements(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(roleId => {
          updated[Number(roleId)] = updated[Number(roleId)].map(req =>
            req.competence_id === updatedComp.id
              ? { ...req, competence_name: updatedComp.name }
              : req
          );
        });
        return updated;
      });
    }

    toast.success("Skill has been updated");
  };

  const handleDeleteCompetency = (compId: number) => {
    // Check worker assignments
    const workerCount = new Set(
      Object.entries(workerCompetencies)
        .filter(([_, comps]) => comps.some(c => c.competence_id === compId))
        .map(([workerId]) => workerId)
    ).size;

    // Check role assignments
    const roleCount = Object.values(roleRequirements)
      .filter((reqs) => reqs.some((r) => r.competence_id === compId))
      .length;

    if (workerCount > 0 || roleCount > 0) {
      toast.error(`Cannot delete this skill because it is currently assigned to ${workerCount} worker(s) and ${roleCount} role(s).`);
      return;
    }

    setCompetencies(prev => prev.filter(c => c.id !== compId));
    toast.success("Skill has been deleted");
  };

  // Role Requirement CRUD handlers (Phase 1: Worker role only)
  const handleAddRequirement = (roleId: number, competenceId: number, minLevel: number) => {
    const competence = competencies.find(c => c.id === competenceId);
    if (!competence) return;

    const newRequirement: RoleCompetenceRequirement = {
      role_id: roleId,
      competence_id: competenceId,
      competence_name: competence.name,
      min_level: minLevel
    };

    setRoleRequirements(prev => ({
      ...prev,
      [roleId]: [...(prev[roleId] || []), newRequirement]
    }));

    toast.success(`Added ${competence.name} as a requirement`);
  };

  const handleUpdateRequirement = (roleId: number, requirement: RoleCompetenceRequirement) => {
    setRoleRequirements(prev => ({
      ...prev,
      [roleId]: (prev[roleId] || []).map(req =>
        req.competence_id === requirement.competence_id ? requirement : req
      )
    }));

    toast.success("Requirement has been updated");
  };

  const handleDeleteRequirement = (roleId: number, competenceId: number) => {
    setRoleRequirements(prev => ({
      ...prev,
      [roleId]: (prev[roleId] || []).filter(req => req.competence_id !== competenceId)
    }));

    toast.success("Requirement has been removed");
  };


  const getPageTitle = () => {
    switch (currentPage) {
      case "worker-profiles":
        return "Worker Profiles";
      case "shift-roster":
        return "Shift Roster";
      case "mro-inventory":
        return "MRO Inventory";
      case "users-roles":
        return "Users & Roles";
      case "role-requirements":
        return "Role Requirements";
      case "competency-dictionary":
        return "Competency Dictionary";
      case "work-orders":
        return "Work Orders";
      case "root-cause-analysis":
        return "Root Cause Analysis";
      default:
        if (currentPage.startsWith("rcfa-canvas-")) return "RCFA Canvas";
        return "CMMS";
    }
  };

  const rcfaCanvasId = currentPage.startsWith("rcfa-canvas-")
    ? parseInt(currentPage.replace("rcfa-canvas-", ""), 10)
    : null;

  const pageTitle = getPageTitle();

  return (
    <SidebarProvider>
      <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <SidebarInset className="overflow-hidden">
        <TopNavigation
          currentUser={currentUser}
          availableRegions={regions}
          availableSites={sites}
          context={globalContext}
          onContextChange={setGlobalContext}
          notificationCount={3}
        />
        <div className="flex flex-1 overflow-hidden">
          {currentPage === "worker-profiles" ? (
            <div className="flex-1 h-full overflow-hidden">
              <WorkerProfiles
                workers={workers}
                workerRoles={workerRoles}
                workerCompetencies={workerCompetencies}
                competencies={competencies}
                onAddCompetence={handleAddCompetence}
                onEditCompetence={handleEditCompetence}
                onDeleteCompetence={handleDeleteCompetence}
                onAddRole={handleAddRole}
              />
            </div>
          ) : currentPage === "shift-roster" ? (
            <div className="flex-1 h-full overflow-hidden">
              <ShiftRosterCalendar workers={workers} workerCompetencies={workerCompetencies} />
            </div>
          ) : currentPage === "mro-inventory" ? (
            <div className="flex-1 h-full overflow-hidden">
              <MROInventory isAdmin={currentUser.is_admin} />
            </div>
          ) : currentPage === "users-roles" ? (
            <div className="flex-1 h-full overflow-hidden">
              <UsersRoles
                users={users}
                onUsersChange={handleUserUpdate}
                roles={roles}
                onAddRole={handleAddRoleToSystem}
                onUpdateRole={handleUpdateRole}
                onDeleteRole={handleDeleteRole}
              />
            </div>
          ) : currentPage === "role-requirements" ? (
            <div className="flex-1 h-full overflow-hidden">
              <RoleRequirementsMenu
                roleRequirements={roleRequirements}
                competencies={competencies}
                onAddRequirement={handleAddRequirement}
                onUpdateRequirement={handleUpdateRequirement}
                onDeleteRequirement={handleDeleteRequirement}
              />
            </div>
          ) : currentPage === "competency-dictionary" ? (
            <div className="flex-1 h-full overflow-hidden">
              <ManageCompetencies
                competencies={competencies}
                workerCompetencies={workerCompetencies}
                roleRequirements={roleRequirements}
                onAddCompetency={handleAddCompetencyToSystem}
                onUpdateCompetency={handleUpdateCompetency}
                onDeleteCompetency={handleDeleteCompetency}
              />
            </div>
          ) : currentPage === "work-orders" ? (
            <div className="flex-1 h-full overflow-hidden">
              <WorkOrders
                isAdmin={currentUser.is_admin}
                onViewRCA={(faultTreeId) => setCurrentPage(`rcfa-canvas-${faultTreeId}`)}
              />
            </div>
          ) : currentPage === "root-cause-analysis" ? (
            <div className="flex-1 h-full overflow-hidden">
              <RootCauseAnalysis
                isAdmin={currentUser.is_admin}
                onInvestigate={(id) => setCurrentPage(`rcfa-canvas-${id}`)}
              />
            </div>
          ) : rcfaCanvasId !== null ? (
            <div className="flex-1 h-full overflow-hidden">
              <RCFACanvas
                faultTreeId={rcfaCanvasId}
                isAdmin={currentUser.is_admin}
                onBack={() => setCurrentPage("root-cause-analysis")}
              />
            </div>
          ) : null}
        </div>

        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}