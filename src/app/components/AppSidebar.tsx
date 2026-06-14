import { Users, Wrench, Calendar, Package, Shield, Award, Briefcase, GitBranch, ClipboardList } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./ui/sidebar";

interface AppSidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function AppSidebar({ currentPage = "worker-profiles", onNavigate }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">CMMS</span>
            <span className="text-xs text-slate-500">Maintenance Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Work Execution</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === "root-cause-analysis" || currentPage?.startsWith("rcfa-canvas")}
                  onClick={() => onNavigate?.("root-cause-analysis")}
                >
                  <GitBranch className="h-4 w-4" />
                  <span>Root Cause Analysis</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === "work-orders"}
                  onClick={() => onNavigate?.("work-orders")}
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>Work Orders</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === "mro-inventory"}
                  onClick={() => onNavigate?.("mro-inventory")}
                >
                  <Package className="h-4 w-4" />
                  <span>MRO Inventory</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workforce Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === "worker-profiles"}
                  onClick={() => onNavigate?.("worker-profiles")}
                >
                  <Users className="h-4 w-4" />
                  <span>Worker Profiles</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === "shift-roster"}
                  onClick={() => onNavigate?.("shift-roster")}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Shift Roster</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === "role-requirements"}
                  onClick={() => onNavigate?.("role-requirements")}
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Role Requirements</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === "competency-dictionary"}
                  onClick={() => onNavigate?.("competency-dictionary")}
                >
                  <Award className="h-4 w-4" />
                  <span>Competency Dictionary</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === "users-roles"}
                  onClick={() => onNavigate?.("users-roles")}
                >
                  <Shield className="h-4 w-4" />
                  <span>Users & Roles</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
