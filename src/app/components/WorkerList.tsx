import { Search, User } from "lucide-react";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { useState } from "react";

export interface Worker {
  id: number;
  site_id: number;
  user_id: number | null;
  display_name: string;
  employee_no: string;
  stress_level: number;
  psychological_load: number;
  availability_next_7d_pct: number;
}

interface WorkerListProps {
  workers: Worker[];
  selectedWorkerId: number | null;
  onSelectWorker: (worker: Worker) => void;
  isLoading?: boolean;
}

export function WorkerList({ workers, selectedWorkerId, onSelectWorker, isLoading }: WorkerListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWorkers = workers.filter(worker =>
    worker.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.employee_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-full flex flex-col border-r bg-slate-50">
        <div className="p-4 border-b bg-white">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-r bg-slate-50">
      <div className="p-4 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search workers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredWorkers.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No workers found</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredWorkers.map(worker => (
              <button
                key={worker.id}
                onClick={() => onSelectWorker(worker)}
                className={`w-full p-3 rounded-lg mb-2 text-left transition-all hover:bg-white hover:shadow-sm ${
                  selectedWorkerId === worker.id ? 'bg-white shadow-md ring-2 ring-blue-500' : 'bg-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      {worker.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900 truncate">{worker.display_name}</p>
                      {worker.user_id === null && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          No Login
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{worker.employee_no}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={worker.availability_next_7d_pct >= 80 ? "default" : worker.availability_next_7d_pct >= 50 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {worker.availability_next_7d_pct}% Available
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
