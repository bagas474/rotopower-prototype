import { useState } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { Plus, AlertTriangle, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Alert, AlertDescription } from "./ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { AddShiftDialog } from "./AddShiftDialog";
import { Worker } from "./WorkerList";
import { UserCompetence } from "./WorkerDetail";

export type ShiftTime = "MORNING" | "EVENING" | "NIGHT";

export interface Shift {
  id: number;
  shift_date: string;
  shift_time: ShiftTime;
  assigned_workers: number[];
  requirements: ShiftRequirement[];
}

export interface ShiftRequirement {
  competence_id: number;
  competence_name: string;
  min_level: number;
  weight: number;
}

interface ShiftRosterProps {
  workers: Worker[];
  workerCompetencies: Record<number, UserCompetence[]>;
}

const getShiftTimeBadgeColor = (shiftTime: ShiftTime) => {
  switch (shiftTime) {
    case "MORNING":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "EVENING":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "NIGHT":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
  }
};

export function ShiftRoster({ workers, workerCompetencies }: ShiftRosterProps) {
  // Use actual user IDs from the system
  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: 1,
      shift_date: "2026-06-06",
      shift_time: "MORNING",
      assigned_workers: [1, 2], // John Doe, Sarah Chen
      requirements: [
        { competence_id: 12, competence_name: "TIG Welding", min_level: 7, weight: 1.5 },
        { competence_id: 18, competence_name: "High Voltage Operations", min_level: 8, weight: 2.0 }
      ]
    },
    {
      id: 2,
      shift_date: "2026-06-06",
      shift_time: "EVENING",
      assigned_workers: [3], // Michael Torres
      requirements: [
        { competence_id: 5, competence_name: "Hydraulics", min_level: 6, weight: 1.0 }
      ]
    },
    {
      id: 3,
      shift_date: "2026-06-06",
      shift_time: "NIGHT",
      assigned_workers: [],
      requirements: [
        { competence_id: 34, competence_name: "Safety Protocols", min_level: 9, weight: 2.0 }
      ]
    },
    {
      id: 4,
      shift_date: "2026-06-07",
      shift_time: "MORNING",
      assigned_workers: [4, 5], // Emily Watson, David Kim
      requirements: [
        { competence_id: 8, competence_name: "Climate Control Systems", min_level: 8, weight: 1.5 }
      ]
    }
  ]);

  const [addShiftDialogOpen, setAddShiftDialogOpen] = useState(false);

  const checkCompetencyRequirements = (shift: Shift): { met: boolean; missingRequirements: string[] } => {
    const missingRequirements: string[] = [];

    for (const req of shift.requirements) {
      let requirementMet = false;

      for (const workerId of shift.assigned_workers) {
        const competencies = workerCompetencies[workerId] || [];
        const hasCompetence = competencies.find(
          c => c.competence_id === req.competence_id && c.level >= req.min_level
        );

        if (hasCompetence) {
          requirementMet = true;
          break;
        }
      }

      if (!requirementMet) {
        missingRequirements.push(`${req.competence_name} Level ${req.min_level}`);
      }
    }

    return { met: missingRequirements.length === 0, missingRequirements };
  };

  const checkFatigueViolation = (workerId: number, shiftDate: string, shiftTime: ShiftTime): boolean => {
    const currentShiftDate = new Date(shiftDate);

    for (const shift of shifts) {
      if (shift.assigned_workers.includes(workerId)) {
        const existingShiftDate = new Date(shift.shift_date);
        const dayDifference = Math.abs((currentShiftDate.getTime() - existingShiftDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDifference <= 1) {
          if (shift.shift_time === "NIGHT" && shiftTime === "MORNING") {
            return true;
          }
          if (shiftTime === "NIGHT" && shift.shift_time === "MORNING") {
            return true;
          }
        }
      }
    }

    return false;
  };

  const getWorkerName = (workerId: number): string => {
    return workers.find(w => w.id === workerId)?.display_name || "Unknown";
  };

  const getWorkerTopSkills = (workerId: number): string => {
    const competencies = workerCompetencies[workerId] || [];
    const topSkills = competencies
      .sort((a, b) => b.level - a.level)
      .slice(0, 3)
      .map(c => `${c.competence_name} (${c.level})`)
      .join(", ");
    return topSkills || "No skills recorded";
  };

  const handleAddShift = (newShift: Omit<Shift, "id">) => {
    const shift: Shift = {
      ...newShift,
      id: Math.max(...shifts.map(s => s.id), 0) + 1
    };
    setShifts([...shifts, shift]);
  };

  const groupedShifts = shifts.reduce((acc, shift) => {
    if (!acc[shift.shift_date]) {
      acc[shift.shift_date] = [];
    }
    acc[shift.shift_date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  const sortedDates = Object.keys(groupedShifts).sort();

  if (shifts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-md">
          <CalendarIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No Shifts Scheduled</h2>
          <p className="text-slate-500 mb-6">Get started by generating a standard roster or adding individual shifts</p>
          <div className="flex gap-3 justify-center">
            <Button size="lg">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Generate Standard Roster
            </Button>
            <Button size="lg" variant="outline" onClick={() => setAddShiftDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Shift
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Shift Roster</h2>
            <p className="text-slate-600">Manage shift schedules and worker assignments</p>
          </div>
          <Button onClick={() => setAddShiftDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead className="w-[120px]">Shift Time</TableHead>
                  <TableHead>Assigned Workers</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDates.map(date => (
                  groupedShifts[date].map((shift, index) => {
                    const validation = checkCompetencyRequirements(shift);
                    const hasNoWorkers = shift.assigned_workers.length === 0;

                    return (
                      <TableRow key={shift.id} className={hasNoWorkers ? "bg-orange-50" : ""}>
                        {index === 0 && (
                          <TableCell rowSpan={groupedShifts[date].length} className="font-medium">
                            {format(new Date(date), "EEE, MMM d, yyyy")}
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge variant="outline" className={getShiftTimeBadgeColor(shift.shift_time)}>
                            {shift.shift_time}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {hasNoWorkers ? (
                            <div className="flex items-center gap-2 text-orange-600">
                              <AlertTriangle className="h-4 w-4 animate-pulse" />
                              <span className="text-sm font-medium">No workers assigned</span>
                            </div>
                          ) : (
                            <TooltipProvider>
                              <div className="flex flex-wrap gap-1">
                                {shift.assigned_workers.map(workerId => (
                                  <Tooltip key={workerId}>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help">
                                        <Badge variant="secondary">
                                          {getWorkerName(workerId)}
                                        </Badge>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-medium mb-1">{getWorkerName(workerId)}</p>
                                      <p className="text-xs text-slate-500">Top Skills:</p>
                                      <p className="text-xs">{getWorkerTopSkills(workerId)}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasNoWorkers ? (
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                              Empty Shift
                            </Badge>
                          ) : validation.met ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              All Met
                            </Badge>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help inline-block">
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Missing
                                    </Badge>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium mb-1">Missing Requirements:</p>
                                  <ul className="text-xs space-y-1">
                                    {validation.missingRequirements.map((req, i) => (
                                      <li key={i}>• {req}</li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Fatigue Management:</strong> The system automatically validates rest periods between shifts.
            Workers cannot be assigned to NIGHT shifts followed by MORNING shifts (minimum 12 hours rest required).
          </AlertDescription>
        </Alert>
      </div>

      <AddShiftDialog
        open={addShiftDialogOpen}
        onOpenChange={setAddShiftDialogOpen}
        onAdd={handleAddShift}
        workers={workers}
        workerCompetencies={workerCompetencies}
        existingShifts={shifts}
      />
    </div>
  );
}
