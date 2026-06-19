import { useState } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { WorkOrderDrawer } from "./WorkOrderDrawer";
import { toast } from "sonner";

interface WorkOrder {
  id: number;
  code: string;
  title: string;
  description: string;
  asset_id: number;
  asset_name: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimated_hours: number;
  assigned_to: number | null;
  created_by: number;
  created_at: string;
  material_ids?: number[];
  required_competencies?: string[];
  rca_id?: number;
}

interface ManagerApprovalInboxProps {
  workOrders: WorkOrder[];
  onApprove: (id: number) => void;
  onReject: (id: number, reason?: string) => void;
}

export function ManagerApprovalInbox({ workOrders, onApprove, onReject }: ManagerApprovalInboxProps) {
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter only draft and pending approval work orders
  const approvalPendingWOs = workOrders.filter(
    wo => wo.status === "DRAFT" || wo.status === "PENDING_APPROVAL"
  );

  const handleApprove = (id: number) => {
    onApprove(id);
    toast.success("Work order approved successfully");
    setDrawerOpen(false);
    setSelectedWO(null);
  };

  const handleReject = (id: number) => {
    onReject(id);
    toast.success("Work order rejected");
    setDrawerOpen(false);
    setSelectedWO(null);
  };

  const handleSelectWO = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setDrawerOpen(true);
  };

  const priorityColor = {
    LOW: "bg-blue-100 text-blue-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800"
  };

  const statusColor = {
    DRAFT: "bg-slate-100 text-slate-700",
    PENDING_APPROVAL: "bg-purple-100 text-purple-700",
    APPROVED: "bg-green-100 text-green-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700"
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
                      <p className="font-medium text-sm text-slate-900">{wo.code}</p>
                      <p className="text-xs text-slate-600 truncate">{wo.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${priorityColor[wo.priority]}`}>
                      {wo.priority}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${statusColor[wo.status]}`}>
                      {wo.status.replace("_", " ")}
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
                  <h3 className="font-semibold text-slate-900">{selectedWO.code}: {selectedWO.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedWO.asset_name}</p>
                </div>
                <Badge className={statusColor[selectedWO.status]}>
                  {selectedWO.status.replace("_", " ")}
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
                    {selectedWO.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Estimated Hours</p>
                  <p className="text-sm font-medium text-slate-900">{selectedWO.estimated_hours}h</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Created</p>
                  <p className="text-sm text-slate-600">{new Date(selectedWO.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Asset</p>
                  <p className="text-sm font-medium text-slate-900">{selectedWO.asset_name}</p>
                </div>
              </div>

              {/* Required Competencies */}
              {selectedWO.required_competencies && selectedWO.required_competencies.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Required Competencies</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedWO.required_competencies.map(comp => (
                      <Badge key={comp} variant="outline" className="text-xs">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* RCA Link */}
              {selectedWO.rca_id && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      Linked to RCA Investigation #{selectedWO.rca_id}
                    </p>
                  </div>
                </div>
              )}
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

      {/* Drawer for full details if needed */}
      {selectedWO && drawerOpen && (
        <WorkOrderDrawer
          workOrder={selectedWO}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          isReadOnly={false}
        />
      )}
    </div>
  );
}
