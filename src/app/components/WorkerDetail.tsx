import { Worker } from "./WorkerList";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Star, Plus, Pencil, Trash2, User, Activity, Brain, Calendar, AlertCircle } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Skeleton } from "./ui/skeleton";
import { Progress } from "./ui/progress";

export interface WorkRole {
  work_role_id: number;
  work_role_name: string;
  is_primary: boolean;
}

export interface UserCompetence {
  competence_id: number;
  competence_name: string;
  level: number;
  source: string;
}

interface WorkerDetailProps {
  worker: Worker | null;
  workRoles: WorkRole[];
  competencies: UserCompetence[];
  isLoading?: boolean;
  onAddCompetence?: () => void;
  onEditCompetence?: (competence: UserCompetence) => void;
  onDeleteCompetence?: (competence: UserCompetence) => void;
  onAddRole?: () => void;
}

export function WorkerDetail({
  worker,
  workRoles,
  competencies,
  isLoading,
  onAddCompetence,
  onEditCompetence,
  onDeleteCompetence,
  onAddRole
}: WorkerDetailProps) {
  if (isLoading) {
    return (
      <div className="h-full p-6 overflow-y-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">No Worker Selected</h3>
          <p className="text-slate-500">Select a worker from the list to view their profile</p>
        </div>
      </div>
    );
  }

  const radarData = competencies.map((comp, index) => {
    let displayName = comp.competence_name.length > 15
      ? comp.competence_name.slice(0, 15) + '...'
      : comp.competence_name;

    // Ensure uniqueness by appending index if there are duplicates
    const existingNames = competencies.slice(0, index).map(c =>
      c.competence_name.length > 15 ? c.competence_name.slice(0, 15) + '...' : c.competence_name
    );
    if (existingNames.includes(displayName)) {
      displayName = `${displayName} (${index + 1})`;
    }

    return {
      id: `${comp.competence_id}-${index}`,
      competence: displayName,
      level: comp.level,
      fullName: comp.competence_name
    };
  });

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-slate-900">{worker.display_name}</h2>
            {worker.user_id === null && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                System Login Not Provisioned
              </Badge>
            )}
          </div>
          <p className="text-slate-600">{worker.employee_no}</p>
        </div>

        {/* HR Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Stress Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{worker.stress_level}/10</div>
                <Progress value={worker.stress_level * 10} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Psychological Load
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{worker.psychological_load}/10</div>
                <Progress value={worker.psychological_load * 10} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Next 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{worker.availability_next_7d_pct}%</div>
                <Progress value={worker.availability_next_7d_pct} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Work Roles */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Work Roles</CardTitle>
              <Button size="sm" onClick={onAddRole}>
                <Plus className="h-4 w-4 mr-1" />
                Add Role
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {workRoles.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No roles assigned</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {workRoles.map(role => (
                  <Badge
                    key={role.work_role_id}
                    variant={role.is_primary ? "default" : "secondary"}
                    className="px-3 py-1.5 text-sm"
                  >
                    {role.is_primary && <Star className="h-3 w-3 mr-1 fill-current" />}
                    {role.work_role_name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competency Radar Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Competency Overview</CardTitle>
              <Button size="sm" onClick={onAddCompetence}>
                <Plus className="h-4 w-4 mr-1" />
                Add Competence
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {competencies.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative w-64 h-64 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-200">
                    <PolarGrid />
                  </svg>
                </div>
                <p className="text-slate-500">No skills recorded</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis
                    dataKey="competence"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Radar
                    name="Level"
                    dataKey="level"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    isAnimationActive={true}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Competency List */}
        <Card>
          <CardHeader>
            <CardTitle>Competency Details</CardTitle>
          </CardHeader>
          <CardContent>
            {competencies.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No competencies recorded</p>
            ) : (
              <div className="space-y-3">
                {competencies.map(comp => (
                  <div
                    key={comp.competence_id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-900">{comp.competence_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {comp.source}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={comp.level * 10} className="h-2 w-32" />
                        <span className="text-sm text-slate-600">Level {comp.level}/10</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditCompetence?.(comp)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteCompetence?.(comp)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
