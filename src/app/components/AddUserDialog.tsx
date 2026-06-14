import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { User, Role } from "../types";
import { Checkbox } from "./ui/checkbox";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (user: Omit<User, "id">) => void;
  availableRoles: Role[];
}

const availableSites = [
  { id: 1, name: "Plant A" },
  { id: 2, name: "Plant B" },
  { id: 3, name: "Plant C" }
];

export function AddUserDialog({ open, onOpenChange, onAdd, availableRoles }: AddUserDialogProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [allSites, setAllSites] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");

    if (!username || !password || !firstName || !lastName) {
      setError("Please fill in all required fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (selectedRoles.length === 0) {
      setError("Please assign at least one role");
      return;
    }

    if (!allSites && selectedSites.length === 0) {
      setError("Please assign at least one site or enable 'All Sites'");
      return;
    }

    const newUser: Omit<User, "id"> = {
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      is_active: true,
      roles: selectedRoles,
      role_names: selectedRoles.map(id => availableRoles.find(r => r.id === id)?.name || ""),
      sites: allSites ? availableSites.map(s => s.id) : selectedSites,
      site_names: allSites ? availableSites.map(s => s.name) : selectedSites.map(id => availableSites.find(s => s.id === id)?.name || ""),
      all_sites: allSites
    };

    onAdd(newUser);
    handleClose();
  };

  const handleClose = () => {
    setUsername("");
    setEmail("");
    setFirstName("");
    setLastName("");
    setPassword("");
    setSelectedRoles([]);
    setSelectedSites([]);
    setAllSites(false);
    setError("");
    onOpenChange(false);
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleSite = (siteId: number) => {
    setSelectedSites(prev =>
      prev.includes(siteId) ? prev.filter(id => id !== siteId) : [...prev, siteId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with role assignments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jdoe_ops"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jdoe@rotopower.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
            {password && password.length < 8 && (
              <p className="text-xs text-yellow-600">Password should be at least 8 characters</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Assign Roles *</Label>
            <div className="border rounded-lg p-3 space-y-2">
              {availableRoles.map(role => (
                <div key={role.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                  />
                  <label htmlFor={`role-${role.id}`} className="text-sm cursor-pointer">
                    {role.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Site Access *</Label>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                id="all-sites"
                checked={allSites}
                onCheckedChange={(checked) => setAllSites(checked as boolean)}
              />
              <label htmlFor="all-sites" className="text-sm font-medium cursor-pointer">
                Grant access to all sites
              </label>
            </div>
            {!allSites && (
              <div className="border rounded-lg p-3 space-y-2">
                {availableSites.map(site => (
                  <div key={site.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`site-${site.id}`}
                      checked={selectedSites.includes(site.id)}
                      onCheckedChange={() => toggleSite(site.id)}
                    />
                    <label htmlFor={`site-${site.id}`} className="text-sm cursor-pointer">
                      {site.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
