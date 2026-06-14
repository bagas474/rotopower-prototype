import { useState } from "react";
import { Search, Plus, Pencil, Trash2, Users, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
import { Role, User } from "../types";
import { AddEditRoleDialog } from "./AddEditRoleDialog";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface ManageRolesTabProps {
  roles: Role[];
  users: User[];
  onAddRole: (role: Omit<Role, "id">) => void;
  onUpdateRole: (role: Role) => void;
  onDeleteRole: (roleId: number) => void;
}

export function ManageRolesTab({
  roles,
  users,
  onAddRole,
  onUpdateRole,
  onDeleteRole,
}: ManageRolesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const getUserCountForRole = (roleId: number) => {
    return users.filter((u) => u.roles.includes(roleId)).length;
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRoles = roles.length;
  const rolesInUse = roles.filter((r) => getUserCountForRole(r.id) > 0).length;
  const unusedRoles = totalRoles - rolesInUse;

  const handleAddClick = () => {
    setSelectedRole(undefined);
    setAddEditDialogOpen(true);
  };

  const handleEditClick = (role: Role) => {
    setSelectedRole(role);
    setAddEditDialogOpen(true);
  };

  const handleDeleteClick = (role: Role) => {
    const userCount = getUserCountForRole(role.id);
    if (userCount > 0) {
      setRoleToDelete(role);
      setDeleteConfirmOpen(true);
    } else {
      onDeleteRole(role.id);
    }
  };

  const handleSaveRole = (role: Omit<Role, "id"> | Role) => {
    if ("id" in role) {
      onUpdateRole(role);
    } else {
      onAddRole(role);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Roles
              </CardTitle>
              <Shield className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRoles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Roles in Use
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{rolesInUse}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Unused Roles
              </CardTitle>
              <Shield className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-500">{unusedRoles}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Add */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search roles by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Users</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    {searchQuery
                      ? "No roles found matching your search"
                      : "No roles available. Click 'Add Role' to create one."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => {
                  const userCount = getUserCountForRole(role.id);
                  return (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-slate-600">
                        {role.description || (
                          <span className="text-slate-400 italic">No description</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {userCount > 0 ? (
                          <Badge variant="secondary">{userCount}</Badge>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {role.is_system ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            System
                          </Badge>
                        ) : (
                          <Badge variant="outline">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(role)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(role)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={role.is_system}
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

      <AddEditRoleDialog
        open={addEditDialogOpen}
        onOpenChange={setAddEditDialogOpen}
        role={selectedRole}
        existingRoles={roles}
        onSave={handleSaveRole}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Cannot Delete Role"
        message={`The role "${roleToDelete?.name}" is currently assigned to users and cannot be deleted.`}
        impact={`${roleToDelete ? getUserCountForRole(roleToDelete.id) : 0} user(s) have this role. Please remove this role from all users before deleting it.`}
        confirmText="OK"
        confirmVariant="default"
        onConfirm={() => {}}
      />
    </div>
  );
}
