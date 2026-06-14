import { useState, useMemo } from "react";
import { Search, Plus, Pencil, Trash2, Award, CheckCircle, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Competence, UserCompetence } from "../types";
import { RoleCompetenceRequirement } from "./RoleRequirementsMenu";
import { AddEditCompetencyDialog } from "./AddEditCompetencyDialog";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface ManageCompetenciesProps {
  competencies: Competence[];
  workerCompetencies: Record<number, UserCompetence[]>;
  roleRequirements: Record<number, RoleCompetenceRequirement[]>;
  onAddCompetency: (competency: Omit<Competence, "id">) => void;
  onUpdateCompetency: (competency: Competence) => void;
  onDeleteCompetency: (competencyId: number) => void;
}

export function ManageCompetencies({
  competencies,
  workerCompetencies,
  roleRequirements,
  onAddCompetency,
  onUpdateCompetency,
  onDeleteCompetency,
}: ManageCompetenciesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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

  const getRoleCountForCompetency = (competencyId: number) => {
    return Object.values(roleRequirements).filter((reqs) =>
      reqs.some((r) => r.competence_id === competencyId)
    ).length;
  };

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    competencies.forEach((comp) => {
      if (comp.category) {
        uniqueCategories.add(comp.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [competencies]);

  const filteredCompetencies = competencies.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "uncategorized" && !comp.category) ||
      comp.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalCompetencies = competencies.length;
  const competenciesInUse = competencies.filter(
    (c) => getWorkerCountForCompetency(c.id) > 0
  ).length;
  const unusedCompetencies = totalCompetencies - competenciesInUse;

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
    const roleCount = getRoleCountForCompetency(competency.id);

    if (workerCount > 0 || roleCount > 0) {
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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Competency Dictionary</h1>
          <p className="text-sm text-slate-600 mt-1">
            Master data dictionary for all official skills recognized by the organization
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Competencies
              </CardTitle>
              <Award className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCompetencies}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Competencies in Use
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {competenciesInUse}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Unused Competencies
              </CardTitle>
              <Award className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-500">
                {unusedCompetencies}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search, Filter and Add */}
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
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Skill
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Workers</TableHead>
                <TableHead className="text-center">Roles</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompetencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    {searchQuery || categoryFilter !== "all"
                      ? "No competencies found matching your filters"
                      : "No competencies available. Click 'Add Skill' to create one."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompetencies.map((competency) => {
                  const workerCount = getWorkerCountForCompetency(competency.id);
                  const roleCount = getRoleCountForCompetency(competency.id);
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
                      <TableCell className="text-center">
                        {workerCount > 0 ? (
                          <Badge variant="secondary">{workerCount}</Badge>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {roleCount > 0 ? (
                          <Badge variant="secondary">{roleCount}</Badge>
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
        message={`Cannot delete this competency because it is currently assigned to ${
          competencyToDelete ? getWorkerCountForCompetency(competencyToDelete.id) : 0
        } worker(s) and ${
          competencyToDelete ? getRoleCountForCompetency(competencyToDelete.id) : 0
        } role(s).`}
        impact="Please remove this competency from all workers and roles before deleting it."
        confirmText="OK"
        confirmVariant="default"
        onConfirm={() => {}}
      />
    </div>
  );
}
