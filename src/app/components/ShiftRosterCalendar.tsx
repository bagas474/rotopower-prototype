import { useState } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { Plus, AlertTriangle, CheckCircle2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { AddShiftDialog } from "./AddShiftDialog";
import { Worker } from "../types";
import { UserCompetence } from "../types";

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

interface ShiftRosterCalendarProps {
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

const workRolesList = [
  { id: 0, name: "All Roles" },
  { id: 5, name: "Senior Boiler Fitter" },
  { id: 8, name: "Welding Specialist" },
  { id: 12, name: "Electrical Technician" },
  { id: 3, name: "Mechanical Fitter" },
  { id: 7, name: "Safety Officer" },
  { id: 15, name: "HVAC Specialist" },
];

export function ShiftRosterCalendar({ workers, workerCompetencies }: ShiftRosterCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedRole, setSelectedRole] = useState("0");
  const [addShiftDialogOpen, setAddShiftDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: 1,
      shift_date: "2026-06-06",
      shift_time: "MORNING",
      assigned_workers: [1, 2],
      requirements: [
        { competence_id: 12, competence_name: "TIG Welding", min_level: 7, weight: 1.5 },
        { competence_id: 18, competence_name: "High Voltage Operations", min_level: 8, weight: 2.0 }
      ]
    },
    {
      id: 2,
      shift_date: "2026-06-06",
      shift_time: "EVENING",
      assigned_workers: [3],
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
      shift_date: "2026-06-09",
      shift_time: "MORNING",
      assigned_workers: [4, 5],
      requirements: [
        { competence_id: 8, competence_name: "Climate Control Systems", min_level: 8, weight: 1.5 }
      ]
    },
    {
      id: 5,
      shift_date: "2026-06-10",
      shift_time: "EVENING",
      assigned_workers: [1, 3],
      requirements: [
        { competence_id: 13, competence_name: "Pneumatics", min_level: 6, weight: 1.0 }
      ]
    }
  ]);

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  });

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

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handleAddShiftClick = (date: Date) => {
    setSelectedDate(date);
    setAddShiftDialogOpen(true);
  };

  const getShiftsForDate = (date: Date): Shift[] => {
    return shifts.filter(shift => isSameDay(new Date(shift.shift_date), date));
  };

  const hasShifts = shifts.length > 0;
  const weekHasShifts = weekDays.some(day => getShiftsForDate(day).length > 0);

  if (!hasShifts) {
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

        <AddShiftDialog
          open={addShiftDialogOpen}
          onOpenChange={setAddShiftDialogOpen}
          onAdd={handleAddShift}
          workers={workers}
          workerCompetencies={workerCompetencies}
          existingShifts={shifts}
          preselectedDate={selectedDate}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Shift Roster</h2>
            <p className="text-slate-600">Interactive calendar view for managing shift schedules</p>
          </div>
          <Button onClick={() => handleAddShiftClick(new Date())}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <label className="text-sm font-medium text-slate-700">Filter by Role:</label>
          </div>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {workRolesList.map(role => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Week
          </Button>
          <h3 className="text-lg font-semibold">
            {format(currentWeekStart, "MMM d")} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}
          </h3>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            Next Week
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Calendar Grid */}
        {!weekHasShifts ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 mb-4">No shifts scheduled for this week</p>
                <Button onClick={() => handleAddShiftClick(currentWeekStart)}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Generate Standard Roster
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map(day => {
              const dayShifts = getShiftsForDate(day);
              const isToday = isSameDay(day, new Date());

              return (
                <Card key={day.toISOString()} className={isToday ? "border-2 border-blue-500" : ""}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      <div className="flex items-center justify-between">
                        <span className={isToday ? "text-blue-600" : "text-slate-700"}>
                          {format(day, "EEE")}
                        </span>
                        <span className={`text-lg ${isToday ? "text-blue-600 font-bold" : "text-slate-900"}`}>
                          {format(day, "d")}
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dayShifts.length === 0 ? (
                      <button
                        onClick={() => handleAddShiftClick(day)}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-slate-400 hover:text-blue-600 text-sm"
                      >
                        + Add Shift
                      </button>
                    ) : (
                      dayShifts.map(shift => {
                        const validation = checkCompetencyRequirements(shift);
                        const hasNoWorkers = shift.assigned_workers.length === 0;

                        return (
                          <div
                            key={shift.id}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              hasNoWorkers
                                ? "border-orange-500 bg-orange-50 animate-pulse"
                                : validation.met
                                ? "border-green-200 bg-green-50 hover:border-green-300"
                                : "border-yellow-200 bg-yellow-50 hover:border-yellow-300"
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className={getShiftTimeBadgeColor(shift.shift_time)}>
                                  {shift.shift_time}
                                </Badge>
                                {validation.met && !hasNoWorkers && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                                {!validation.met && !hasNoWorkers && (
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                )}
                                {hasNoWorkers && (
                                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                                )}
                              </div>

                              {hasNoWorkers ? (
                                <p className="text-xs text-orange-600 font-medium">No workers assigned</p>
                              ) : (
                                <TooltipProvider>
                                  <div className="space-y-1">
                                    {shift.assigned_workers.map(workerId => (
                                      <Tooltip key={workerId}>
                                        <TooltipTrigger asChild>
                                          <div className="text-xs font-medium text-slate-700 truncate cursor-help">
                                            • {getWorkerName(workerId)}
                                          </div>
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

                              {!validation.met && !hasNoWorkers && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-xs text-yellow-700 cursor-help">
                                        Missing requirements
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-medium mb-1">Missing:</p>
                                      <ul className="text-xs space-y-1">
                                        {validation.missingRequirements.map((req, i) => (
                                          <li key={i}>• {req}</li>
                                        ))}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Fatigue Management Alert */}
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
        preselectedDate={selectedDate}
      />
    </div>
  );
}
