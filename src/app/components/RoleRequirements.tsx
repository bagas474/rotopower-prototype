import { useState } from "react";
import { Search, Shield, Award, Plus } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { WorkRole, Competence } from "../types";
import { toast } from "sonner";

interface RoleRequirementsProps {
  workerRoles: Record<number, WorkRole[]>;
  competencies: Competence[];
}

// Mock data for work roles and their required competencies
const workRolesList = [
  { id: 5, name: "Senior Boiler Fitter", description: "Senior level boiler maintenance" },
  { id: 8, name: "Welding Specialist", description: "Certified welding operations" },
  { id: 12, name: "Electrical Technician", description: "Electrical systems maintenance" },
  { id: 3, name: "Mechanical Fitter", description: "General mechanical work" },
  { id: 7, name: "Safety Officer", description: "Safety compliance and monitoring" },
  { id: 15, name: "HVAC Specialist", description: "HVAC systems expert" },
  { id: 9, name: "Instrumentation Tech", description: "Instrument calibration and repair" },
  { id: 11, name: "Calibration Expert", description: "Precision calibration specialist" }
];

// Mock required competencies for each role
const roleRequiredCompetencies: Record<number, number[]> = {
  5: [12, 15, 22, 34, 41], // Senior Boiler Fitter: TIG Welding, Pipe Fitting, High Pressure Systems, Safety, Blueprint Reading
  8: [12, 15, 34], // Welding Specialist: TIG Welding, Pipe Fitting, Safety
  12: [18, 25, 31, 44], // Electrical Technician: High Voltage, PLC Programming, Motor Control, Troubleshooting
  3: [5, 13, 27], // Mechanical Fitter: Hydraulics, Pneumatics, Machine Assembly
  7: [34, 37, 44], // Safety Officer: Safety Protocols, Data Analysis, Troubleshooting
  15: [8, 19, 33, 46], // HVAC Specialist: Climate Control, Refrigeration, Ventilation, Energy Efficiency
  9: [11, 24, 37, 42], // Instrumentation Tech: Process Control, Sensor Calibration, Data Analysis, Loop Tuning
  11: [24, 37, 42] // Calibration Expert: Sensor Calibration, Data Analysis, Loop Tuning
};

export function RoleRequirements({ competencies }: RoleRequirementsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<typeof workRolesList[0] | null>(
    workRolesList[0]
  );

  const filteredRoles = workRolesList.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const requiredCompetencyIds = selectedRole
    ? roleRequiredCompetencies[selectedRole.id] || []
    : [];

  const requiredCompetencies = competencies.filter(comp =>
    requiredCompetencyIds.includes(comp.id)
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Pane - Role List */}
      <div className="w-80 flex-shrink-0 h-full flex flex-col border-r bg-white">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filteredRoles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No roles found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedRole?.id === role.id
                      ? "bg-blue-50 border-2 border-blue-500"
                      : "bg-white hover:bg-slate-50 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">
                        {role.name}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane - Required Competencies */}
      <div className="flex-1 h-full overflow-y-auto bg-slate-50">
        {selectedRole ? (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-slate-900">{selectedRole.name}</h3>
              </div>
              <p className="text-slate-600">{selectedRole.description}</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-slate-600" />
                    Required Competencies
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => toast.info("Add competency requirement functionality")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Requirement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {requiredCompetencies.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">No competency requirements defined for this role</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Click "Add Requirement" to define required skills
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Competency</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requiredCompetencies.map(comp => (
                          <TableRow key={comp.id}>
                            <TableCell className="font-medium">{comp.name}</TableCell>
                            <TableCell>
                              {comp.category ? (
                                <Badge variant="outline">{comp.category}</Badge>
                              ) : (
                                <span className="text-slate-400 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => toast.info("Remove requirement functionality")}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">No Role Selected</h3>
              <p className="text-slate-500">Select a role from the list to view requirements</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
