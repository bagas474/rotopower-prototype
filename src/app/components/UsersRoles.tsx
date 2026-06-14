import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { UsersDirectory } from "./UsersDirectory";
import { RoleManagement } from "./RoleManagement";
import { ManageRolesTab } from "./ManageRolesTab";
import { User, Role } from "../types";

export interface Permission {
  role_id: number;
  module_id: number;
  module_name: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  sidebar: boolean;
}

interface UsersRolesProps {
  users: User[];
  onUsersChange: (users: User[]) => void;
  roles: Role[];
  onAddRole: (role: Omit<Role, "id">) => void;
  onUpdateRole: (role: Role) => void;
  onDeleteRole: (roleId: number) => void;
}

export function UsersRoles({
  users,
  onUsersChange,
  roles,
  onAddRole,
  onUpdateRole,
  onDeleteRole,
}: UsersRolesProps) {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Users & Roles</h2>
          <p className="text-slate-600">Manage user accounts and role-based access control</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users Directory</TabsTrigger>
            <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
            <TabsTrigger value="manage-roles">Manage Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-0">
            <UsersDirectory users={users} onUsersChange={onUsersChange} roles={roles} />
          </TabsContent>

          <TabsContent value="permissions" className="mt-0">
            <RoleManagement roles={roles} />
          </TabsContent>

          <TabsContent value="manage-roles" className="mt-0 h-full">
            <ManageRolesTab
              roles={roles}
              users={users}
              onAddRole={onAddRole}
              onUpdateRole={onUpdateRole}
              onDeleteRole={onDeleteRole}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
