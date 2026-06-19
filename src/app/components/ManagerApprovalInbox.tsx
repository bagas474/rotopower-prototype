import { useState } from "react";
import { Check, X, AlertCircle, Clock, MapPin, User } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { WorkOrder } from "../data/mockData";

interface ManagerApprovalInboxProps {
  workOrders: WorkOrder[];
  onApprove: (id: number) => void;
  onReject: (id: number, reason?: string) => void;
}

export function ManagerApprovalInbox({ workOrders, onApprove, onReject }: ManagerApprovalInboxProps) {
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  // Filter only draft and pending_planner work orders (awaiting manager approval)
  const approvalPendingWOs = workOrders.filter(
    wo => wo.status === "draft" || wo.status === "pending_planner"
  );

  const handleApprove = (id: number) => {
    onApprove(id);
    toast.success("Work order approved successfully");
    setSelectedWO(null);
  };

  const handleReject = (id: number) => {
    onReject(id);
    toast.success("Work order rejected");
    setSelectedWO(null);
  };

  const priorityColor: Record<number, string> = {
    1: "bg-red-100 text-red-800",      // HIGH
    2: "bg-orange-100 text-orange-800", // MEDIUM
    3: "bg-blue-100 text-blue-800"      // LOW
  };

  const statusColor: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    pending_planner: "bg-purple-100 text-purple-700",
    planned: "bg-green-100 text-green-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700"
  };

  const priorityLabel: Record<number, string> = {
    1: "HIGH",
    2: "MEDIUM",
    3: "LOW"
  };

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Left Pane: Approval List (30%) */}
      <div className="w-3/10 border-r flex flex-col bg-white shrink-0">
        {/* Header */}
        <div className="border-b p-4 bg-slate-50 shrink-0">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Pending Approvals</h2>
          <p className="text-xs text-slate-500">{approvalPendingWOs.length} work orders awaiting review</p>
        </div>

        {/* Inbox List */}
        <div className="flex-1 overflow-y-auto">
          {approvalPendingWOs.length === 0 ? (
            <div className="flex items-center justify-center h-full flex-col p-6 text-center">
              <Check className="h-12 w-12 text-green-200 mb-2" />
              <p className="text-sm font-medium text-slate-600">All caught up!</p>
              <p className="text-xs text-slate-500 mt-1">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-0">
              {approvalPendingWOs.map(wo => (
                <button
                  key={wo.id}
                  onClick={() => handleSelectWO(wo)}
                  className={`w-full p-4 border-b text-left transition-colors hover:bg-slate-50 ${
                    selectedWO?.id === wo.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-sm text-slate-900">WO-{wo.id}</p>
                      <p className="text-xs text-slate-600 truncate">{wo.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${priorityColor[wo.priority]}`}>
                      {priorityLabel[wo.priority]}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${statusColor[wo.status]}`}>
                      {wo.status.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{wo.asset_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Detail View & Actions (70%) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedWO ? (
          <>
            {/* Detail Header */}
            <div className="border-b p-4 bg-slate-50 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">WO-{selectedWO.id}: {selectedWO.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedWO.asset_name}</p>
                </div>
                <Badge className={statusColor[selectedWO.status]}>
                  {selectedWO.status.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Description</h4>
                <p className="text-sm text-slate-600">{selectedWO.description}</p>
              </div>

              {/* Work Order Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Priority</p>
                  <Badge className={priorityColor[selectedWO.priority]}>
                    {priorityLabel[selectedWO.priority]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Location</p>
                  <p className="text-sm font-medium text-slate-900">{selectedWO.location_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Planned Start</p>
                  <p className="text-sm text-slate-600">{new Date(selectedWO.planned_start).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Planned End</p>
                  <p className="text-sm text-slate-600">{new Date(selectedWO.planned_end).toLocaleDateString()}</p>
                </div>
              </div>

              {/* RCA Link */}
              {selectedWO.asset_fault_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      Linked to Asset Fault #{selectedWO.asset_fault_id}
                    </p>
                  </div>
                </div>
              )}

              {/* Created By */}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Created By</p>
                <p className="text-sm font-medium text-slate-900">{selectedWO.created_by}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t p-4 bg-slate-50 shrink-0 flex gap-3">
              <Button
                onClick={() => handleReject(selectedWO.id)}
                variant="outline"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleApprove(selectedWO.id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center flex-col">
            <AlertCircle className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Select a work order to review</p>
            <p className="text-xs text-slate-400 mt-1">Choose from the list to view details and approve or reject</p>
          </div>
        )}
      </div>


    </div>
  );
}
