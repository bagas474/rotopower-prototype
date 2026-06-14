import { useState } from "react";
import { Search, Plus, Ban, UserCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Switch } from "./ui/switch";
import { AddUserDialog } from "./AddUserDialog";
import { User, Role } from "../types";
import { toast } from "sonner";

interface UsersDirectoryProps {
  users: User[];
  onUsersChange: (users: User[]) => void;
  roles: Role[];
}

export function UsersDirectory({ users, onUsersChange, roles }: UsersDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleActive = (userId: number) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, is_active: !user.is_active } : user
    );
    onUsersChange(updatedUsers);
    const user = users.find(u => u.id === userId);
    if (user) {
      toast.success(user.is_active ? `${user.username} has been deactivated` : `${user.username} has been activated`);
    }
  };

  const handleAddUser = (newUser: Omit<User, "id">) => {
    const user: User = {
      ...newUser,
      id: Math.max(...users.map(u => u.id), 0) + 1
    };
    onUsersChange([...users, user]);
    toast.success(`User ${user.username} has been created`);
  };

  const activeUsersCount = users.filter(u => u.is_active).length;
  const inactiveUsersCount = users.filter(u => !u.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by username, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setAddUserDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{activeUsersCount}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Inactive Users</p>
                <p className="text-2xl font-bold text-red-600">{inactiveUsersCount}</p>
              </div>
              <Ban className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Sites</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px]">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => (
                  <TableRow
                    key={user.id}
                    className={!user.is_active ? "bg-slate-50 opacity-60" : ""}
                  >
                    <TableCell>
                      <span className={!user.is_active ? "line-through" : "font-medium"}>
                        {user.username}
                      </span>
                    </TableCell>
                    <TableCell className={!user.is_active ? "line-through" : ""}>
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell className={!user.is_active ? "line-through text-slate-500" : "text-slate-600"}>
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.role_names.map((role, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.all_sites ? (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                          All Sites
                        </Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {user.site_names.map((site, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {site}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.is_active
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => handleToggleActive(user.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onAdd={handleAddUser}
        availableRoles={roles}
      />
    </div>
  );
}
