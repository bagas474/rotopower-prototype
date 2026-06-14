import { useState } from "react";
import { Shield, CheckSquare, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Permission } from "./UsersRoles";
import { Role } from "../types";
import { toast } from "sonner";

const modules = [
  { id: 1, name: "Craft Competency" },
  { id: 2, name: "Shift Roster" },
  { id: 3, name: "MRO Inventory" },
  { id: 4, name: "Work Orders" },
  { id: 5, name: "Asset Management" },
  { id: 6, name: "System Administration" }
];

const initialPermissions: Permission[] = [
  // Administrator - full access
  { role_id: 1, module_id: 1, module_name: "Craft Competency", create: true, read: true, update: true, delete: true, sidebar: true },
  { role_id: 1, module_id: 2, module_name: "Shift Roster", create: true, read: true, update: true, delete: true, sidebar: true },
  { role_id: 1, module_id: 3, module_name: "MRO Inventory", create: true, read: true, update: true, delete: true, sidebar: true },
  { role_id: 1, module_id: 4, module_name: "Work Orders", create: true, read: true, update: true, delete: true, sidebar: true },
  { role_id: 1, module_id: 5, module_name: "Asset Management", create: true, read: true, update: true, delete: true, sidebar: true },
  { role_id: 1, module_id: 6, module_name: "System Administration", create: true, read: true, update: true, delete: true, sidebar: true },

  // Technician - limited access
  { role_id: 2, module_id: 1, module_name: "Craft Competency", create: false, read: true, update: false, delete: false, sidebar: true },
  { role_id: 2, module_id: 2, module_name: "Shift Roster", create: false, read: true, update: false, delete: false, sidebar: true },
  { role_id: 2, module_id: 3, module_name: "MRO Inventory", create: true, read: true, update: false, delete: false, sidebar: true },
  { role_id: 2, module_id: 4, module_name: "Work Orders", create: true, read: true, update: true, delete: false, sidebar: true },
  { role_id: 2, module_id: 5, module_name: "Asset Management", create: false, read: true, update: false, delete: false, sidebar: true },
  { role_id: 2, module_id: 6, module_name: "System Administration", create: false, read: false, update: false, delete: false, sidebar: false },
];

interface RoleManagementProps {
  roles: Role[];
}

export function RoleManagement({ roles }: RoleManagementProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(roles[0]);
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);

  const currentPermissions = permissions.filter(p => p.role_id === selectedRole.id);

  const handlePermissionChange = (moduleId: number, permissionType: keyof Omit<Permission, 'role_id' | 'module_id' | 'module_name'>) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.role_id === selectedRole.id && p.module_id === moduleId);

      if (existing) {
        return prev.map(p =>
          p.role_id === selectedRole.id && p.module_id === moduleId
            ? { ...p, [permissionType]: !p[permissionType] }
            : p
        );
      } else {
        // Create new permission entry if it doesn't exist
        const module = modules.find(m => m.id === moduleId);
        const newPermission: Permission = {
          role_id: selectedRole.id,
          module_id: moduleId,
          module_name: module?.name || "",
          create: permissionType === 'create',
          read: permissionType === 'read',
          update: permissionType === 'update',
          delete: permissionType === 'delete',
          sidebar: permissionType === 'sidebar'
        };
        return [...prev, newPermission];
      }
    });
  };

  const handleSelectAllColumn = (permissionType: keyof Omit<Permission, 'role_id' | 'module_id' | 'module_name'>) => {
    const allChecked = currentPermissions.every(p => p[permissionType]);

    setPermissions(prev => {
      let updated = [...prev];

      modules.forEach(module => {
        const existing = updated.find(p => p.role_id === selectedRole.id && p.module_id === module.id);

        if (existing) {
          updated = updated.map(p =>
            p.role_id === selectedRole.id && p.module_id === module.id
              ? { ...p, [permissionType]: !allChecked }
              : p
          );
        } else {
          const newPermission: Permission = {
            role_id: selectedRole.id,
            module_id: module.id,
            module_name: module.name,
            create: permissionType === 'create' && !allChecked,
            read: permissionType === 'read' && !allChecked,
            update: permissionType === 'update' && !allChecked,
            delete: permissionType === 'delete' && !allChecked,
            sidebar: permissionType === 'sidebar' && !allChecked
          };
          updated.push(newPermission);
        }
      });

      return updated;
    });
  };

  const handleSelectAllRow = (moduleId: number) => {
    const permission = currentPermissions.find(p => p.module_id === moduleId);
    const allChecked = permission && permission.create && permission.read && permission.update && permission.delete && permission.sidebar;

    setPermissions(prev => {
      const existing = prev.find(p => p.role_id === selectedRole.id && p.module_id === moduleId);

      if (existing) {
        return prev.map(p =>
          p.role_id === selectedRole.id && p.module_id === moduleId
            ? { ...p, create: !allChecked, read: !allChecked, update: !allChecked, delete: !allChecked, sidebar: !allChecked }
            : p
        );
      } else {
        const module = modules.find(m => m.id === moduleId);
        const newPermission: Permission = {
          role_id: selectedRole.id,
          module_id: moduleId,
          module_name: module?.name || "",
          create: !allChecked,
          read: !allChecked,
          update: !allChecked,
          delete: !allChecked,
          sidebar: !allChecked
        };
        return [...prev, newPermission];
      }
    });
  };

  const handleSave = () => {
    toast.success(`Permissions for ${selectedRole.name} have been updated`);
  };

  const getPermissionValue = (moduleId: number, type: keyof Omit<Permission, 'role_id' | 'module_id' | 'module_name'>) => {
    const permission = currentPermissions.find(p => p.module_id === moduleId);
    return permission ? permission[type] : false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold">Permission Matrix</h3>
          <p className="text-sm text-slate-600">Configure module access for each role</p>
        </div>
      </div>

      <div className="flex gap-2">
        {roles.map(role => (
          <Button
            key={role.id}
            variant={selectedRole.id === role.id ? "default" : "outline"}
            onClick={() => setSelectedRole(role)}
          >
            {role.name}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Permissions for {selectedRole.name}</span>
            <Button onClick={handleSave}>Save Changes</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Module</TableHead>
                  <TableHead className="text-center w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>Create</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSelectAllColumn('create')}
                      >
                        {currentPermissions.every(p => p.create) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>Read</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSelectAllColumn('read')}
                      >
                        {currentPermissions.every(p => p.read) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>Update</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSelectAllColumn('update')}
                      >
                        {currentPermissions.every(p => p.update) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>Delete</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSelectAllColumn('delete')}
                      >
                        {currentPermissions.every(p => p.delete) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>Sidebar</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSelectAllColumn('sidebar')}
                      >
                        {currentPermissions.every(p => p.sidebar) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px]">Select All</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map(module => (
                  <TableRow key={module.id}>
                    <TableCell className="font-medium">{module.name}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={getPermissionValue(module.id, 'create')}
                          onCheckedChange={() => handlePermissionChange(module.id, 'create')}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={getPermissionValue(module.id, 'read')}
                          onCheckedChange={() => handlePermissionChange(module.id, 'read')}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={getPermissionValue(module.id, 'update')}
                          onCheckedChange={() => handlePermissionChange(module.id, 'update')}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={getPermissionValue(module.id, 'delete')}
                          onCheckedChange={() => handlePermissionChange(module.id, 'delete')}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={getPermissionValue(module.id, 'sidebar')}
                          onCheckedChange={() => handlePermissionChange(module.id, 'sidebar')}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAllRow(module.id)}
                      >
                        Select All
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
