import { useState, useEffect } from "react";
import { Bell, User, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { CreateRegionDialog } from "./CreateRegionDialog";
import { CreateSiteDialog } from "./CreateSiteDialog";
import { toast } from "sonner";

export interface Region {
  id: number;
  name: string;
  description: string;
}

export interface Site {
  id: number;
  code: string;
  name: string;
  region_id: number;
  description: string;
}

export interface GlobalContext {
  region_id: number | null;
  site_id: number | null;
}

interface TopNavigationProps {
  currentUser: {
    first_name: string;
    last_name: string;
    email: string;
    is_admin: boolean;
  };
  availableRegions: Region[];
  availableSites: Site[];
  context: GlobalContext;
  onContextChange: (context: GlobalContext) => void;
  notificationCount?: number;
}

export function TopNavigation({
  currentUser,
  availableRegions,
  availableSites,
  context,
  onContextChange,
  notificationCount = 0
}: TopNavigationProps) {
  const [isChangingContext, setIsChangingContext] = useState(false);
  const [createRegionOpen, setCreateRegionOpen] = useState(false);
  const [createSiteOpen, setCreateSiteOpen] = useState(false);
  const [hoveredRegionId, setHoveredRegionId] = useState<number | null>(null);
  const [hoveredSiteId, setHoveredSiteId] = useState<number | null>(null);

  const selectedRegion = availableRegions.find(r => r.id === context.region_id);
  const selectedSite = availableSites.find(s => s.id === context.site_id);

  // Filter sites by selected region
  const sitesInRegion = availableSites.filter(s => s.region_id === context.region_id);

  // Check if user has single region/site (should show as plain text)
  const isSingleRegion = availableRegions.length === 1;
  const isSingleSite = sitesInRegion.length === 1;

  const handleRegionChange = async (regionId: number) => {
    setIsChangingContext(true);

    // Simulate loading bar animation
    await new Promise(resolve => setTimeout(resolve, 300));

    const newRegion = availableRegions.find(r => r.id === regionId);
    const sitesInNewRegion = availableSites.filter(s => s.region_id === regionId);

    // Auto-select first site in the new region
    const newSiteId = sitesInNewRegion.length > 0 ? sitesInNewRegion[0].id : null;

    const newContext = {
      region_id: regionId,
      site_id: newSiteId
    };

    onContextChange(newContext);

    // Persist to localStorage
    localStorage.setItem('global_context', JSON.stringify(newContext));

    setIsChangingContext(false);
    toast.success(`Switched to ${newRegion?.name}`);
  };

  const handleSiteChange = async (siteId: number) => {
    setIsChangingContext(true);

    await new Promise(resolve => setTimeout(resolve, 300));

    const newSite = availableSites.find(s => s.id === siteId);
    const newContext = {
      region_id: context.region_id,
      site_id: siteId
    };

    onContextChange(newContext);
    localStorage.setItem('global_context', JSON.stringify(newContext));

    setIsChangingContext(false);
    toast.success(`Switched to [${newSite?.code}] ${newSite?.name}`);
  };

  const handleCreateRegion = (region: Omit<Region, "id">) => {
    // This would be passed up to parent to update the regions list
    toast.success(`Region "${region.name}" created`);
  };

  const handleCreateSite = (site: Omit<Site, "id">) => {
    // This would be passed up to parent to update the sites list
    toast.success(`Site "[${site.code}] ${site.name}" created`);
  };

  return (
    <>
      {/* Loading bar */}
      {isChangingContext && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-600 animate-pulse" />
      )}

      <header className="h-14 border-b bg-white flex items-center justify-between px-4 relative z-40">
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle */}
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />

          {/* Region Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Region:</span>
            {availableRegions.length === 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div>
                    <Button variant="outline" className="border-red-500 text-red-600">
                      No Region Selected
                    </Button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {currentUser.is_admin && (
                    <DropdownMenuItem onClick={() => setCreateRegionOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Region
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isSingleRegion ? (
              <span className="text-sm font-medium">{selectedRegion?.name}</span>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div>
                    <Button variant="outline" className="min-w-[200px] justify-start">
                      {selectedRegion?.name || "Select Region"}
                    </Button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {availableRegions.map(region => (
                    <DropdownMenuItem
                      key={region.id}
                      onClick={() => handleRegionChange(region.id)}
                      onMouseEnter={() => setHoveredRegionId(region.id)}
                      onMouseLeave={() => setHoveredRegionId(null)}
                      className="flex items-center justify-between"
                    >
                      <span className="flex-1">{region.name}</span>
                      {currentUser.is_admin && hoveredRegionId === region.id && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info("Edit region functionality");
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.warning("Delete region functionality");
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </DropdownMenuItem>
                  ))}
                  {currentUser.is_admin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setCreateRegionOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Region
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Site Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Site:</span>
            {!context.region_id ? (
              <span className="text-sm text-slate-400">Select a region first</span>
            ) : sitesInRegion.length === 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div>
                    <Button variant="outline" className="border-yellow-500 text-yellow-600">
                      No Sites Available
                    </Button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {currentUser.is_admin && (
                    <DropdownMenuItem onClick={() => setCreateSiteOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Site
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isSingleSite ? (
              <span className="text-sm font-medium">
                [{selectedSite?.code}] {selectedSite?.name}
              </span>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div>
                    <Button variant="outline" className="min-w-[200px] justify-start">
                      {selectedSite ? `[${selectedSite.code}] ${selectedSite.name}` : "Select Site"}
                    </Button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {sitesInRegion.map(site => (
                    <DropdownMenuItem
                      key={site.id}
                      onClick={() => handleSiteChange(site.id)}
                      onMouseEnter={() => setHoveredSiteId(site.id)}
                      onMouseLeave={() => setHoveredSiteId(null)}
                      className="flex items-center justify-between"
                    >
                      <span className="flex-1">[{site.code}] {site.name}</span>
                      {currentUser.is_admin && hoveredSiteId === site.id && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info("Edit site functionality");
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.warning("Delete site functionality");
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </DropdownMenuItem>
                  ))}
                  {currentUser.is_admin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setCreateSiteOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Site
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </Badge>
            )}
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                      {currentUser.first_name[0]}{currentUser.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium">{currentUser.first_name} {currentUser.last_name}</p>
                    <p className="text-xs text-slate-500">{currentUser.email}</p>
                  </div>
                </Button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CreateRegionDialog
        open={createRegionOpen}
        onOpenChange={setCreateRegionOpen}
        onCreate={handleCreateRegion}
      />

      <CreateSiteDialog
        open={createSiteOpen}
        onOpenChange={setCreateSiteOpen}
        regionId={context.region_id}
        onCreate={handleCreateSite}
      />
    </>
  );
}
