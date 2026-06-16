import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, AlertCircle, Search, Building2, Zap, CircleDot, MoreVertical, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export type DepthLevel = "location" | "asset" | "sensor";

export interface TreeNode {
  id: string | number;
  code: string;
  name: string;
  type: "location" | "asset" | "sensor";
  parentId?: string | number;
  children?: TreeNode[];
  status?: "running" | "tripped" | "unknown";
  sensorType?: "vibration" | "temperature" | "pressure" | "flow";
  thresholds?: {
    normal: number;
    upper: number;
    lower?: number;
  };
}

interface AssetHierarchyTreeProps {
  data: TreeNode[];
  depth?: DepthLevel;
  onSelectNode?: (node: TreeNode) => void;
  onAddChild?: (parentNode: TreeNode, type: "asset" | "sensor") => void;
  onEdit?: (node: TreeNode) => void;
  loading?: boolean;
  selectedNodeId?: string | number;
}

function TreeNodeComponent({
  node,
  level = 0,
  depth = "sensor",
  onSelectNode,
  onAddChild,
  onEdit,
  selectedNodeId,
  expandedNodes,
  setExpandedNodes,
  nodeErrors,
  loadingNodes
}: {
  node: TreeNode;
  level?: number;
  depth?: DepthLevel;
  onSelectNode?: (node: TreeNode) => void;
  onAddChild?: (parentNode: TreeNode, type: "asset" | "sensor") => void;
  onEdit?: (node: TreeNode) => void;
  selectedNodeId?: string | number;
  expandedNodes: Set<string | number>;
  setExpandedNodes: (nodes: Set<string | number>) => void;
  nodeErrors: Set<string | number>;
  loadingNodes: Set<string | number>;
}) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren;
  const isSelected = selectedNodeId === node.id;
  const hasError = nodeErrors.has(node.id);
  const isLoading = loadingNodes.has(node.id);
  const depthLevels = { location: 0, asset: 1, sensor: 2 };
  const maxDepth = depthLevels[depth];
  const canExpand = level < maxDepth && (hasChildren || node.type === "asset");
  const canAddChildren = level < maxDepth && (node.type === "location" || node.type === "asset");
  const isSensor = node.type === "sensor";

  const handleToggleExpand = () => {
    const newExpanded = new Set(expandedNodes);
    if (isExpanded) {
      newExpanded.delete(node.id);
    } else {
      newExpanded.add(node.id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelectNode = () => {
    if (isSensor || (node.type === "asset" && depth !== "asset") || (node.type === "location" && depth === "location")) {
      onSelectNode?.(node);
    }
  };

  const getNodeIcon = () => {
    switch (node.type) {
      case "location":
        return <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />;
      case "asset":
        const statusColor = node.status === "running" ? "text-green-600" : node.status === "tripped" ? "text-red-600" : "text-slate-400";
        return <CircleDot className={`h-4 w-4 flex-shrink-0 ${statusColor}`} />;
      case "sensor":
        return <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer group ${
          isSelected ? "bg-blue-50 border-l-2 border-blue-600" : ""
        }`}
        style={{ marginLeft: `${level * 12}px` }}
      >
        {/* Expand/Collapse Chevron */}
        {canExpand ? (
          <button
            onClick={handleToggleExpand}
            className="p-0.5 hover:bg-slate-200 rounded flex-shrink-0"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-3 h-3 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin" />
            ) : hasError ? (
              <AlertCircle className="h-3 w-3 text-red-500" title="Failed to load children. Click to retry." />
            ) : isExpanded ? (
              <ChevronDown className="h-3 w-3 text-slate-600" />
            ) : (
              <ChevronRight className="h-3 w-3 text-slate-600" />
            )}
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}

        {/* Node Icon */}
        {getNodeIcon()}

        {/* Node Text */}
        <button
          onClick={handleSelectNode}
          className={`text-xs font-medium flex-1 text-left truncate transition-colors ${
            isSelected
              ? "text-blue-700 font-semibold"
              : isSensor
              ? "text-slate-900 hover:text-blue-600"
              : "text-slate-700 hover:text-slate-900"
          }`}
          disabled={isSensor ? false : (node.type === "location" && depth !== "location") || (node.type === "asset" && depth !== "sensor")}
        >
          {node.code || node.name}
        </button>

        {/* Context Menu - Hidden on Hover */}
        {canAddChildren && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={() => onAddChild?.(node, node.type === "location" ? "asset" : "sensor")}
              className="p-0.5 hover:bg-slate-200 rounded flex-shrink-0"
              title={`Add ${node.type === "location" ? "Asset" : "Sensor"}`}
            >
              <Plus className="h-3 w-3 text-slate-500" />
            </button>
            <button
              className="p-0.5 hover:bg-slate-200 rounded flex-shrink-0"
              title="More options"
            >
              <MoreVertical className="h-3 w-3 text-slate-500" />
            </button>
          </div>
        )}

        {/* Edit Button for Sensors */}
        {isSensor && (
          <button
            onClick={() => onEdit?.(node)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-200 rounded flex-shrink-0"
            title="Edit thresholds"
          >
            <MoreVertical className="h-3 w-3 text-slate-500" />
          </button>
        )}
      </div>

      {/* Child Nodes */}
      {canExpand && isExpanded && hasChildren && (
        <div>
          {node.children!.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              depth={depth}
              onSelectNode={onSelectNode}
              onAddChild={onAddChild}
              onEdit={onEdit}
              selectedNodeId={selectedNodeId}
              expandedNodes={expandedNodes}
              setExpandedNodes={setExpandedNodes}
              nodeErrors={nodeErrors}
              loadingNodes={loadingNodes}
            />
          ))}
        </div>
      )}

      {/* Empty State for Nodes with No Children */}
      {canExpand && isExpanded && !hasChildren && (
        <div className="text-xs text-slate-400 italic px-2 py-1" style={{ marginLeft: `${(level + 1) * 12}px` }}>
          No child components
        </div>
      )}
    </div>
  );
}

export function AssetHierarchyTree({
  data,
  depth = "sensor",
  onSelectNode,
  onAddChild,
  onEdit,
  loading = false,
  selectedNodeId
}: AssetHierarchyTreeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string | number>>(new Set());
  const [nodeErrors] = useState<Set<string | number>>(new Set());
  const [loadingNodes] = useState<Set<string | number>>(new Set());

  // Filter nodes based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return data;
    }

    const query = searchQuery.toLowerCase();
    const results: TreeNode[] = [];
    const visitedParents = new Set<string | number>();

    const search = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .filter(node => {
          const matches = node.code?.toLowerCase().includes(query) || node.name?.toLowerCase().includes(query);
          if (matches) {
            // Mark all parents as visited
            let parent = nodes.find(n => n.children?.includes(node));
            while (parent) {
              visitedParents.add(parent.id);
              parent = nodes.find(n => n.children?.includes(parent!));
            }
          }
          return matches;
        })
        .map(node => ({
          ...node,
          children: node.children ? search(node.children) : undefined
        }));
    };

    const filtered = search(data);
    
    // Auto-expand parents when searching
    if (searchQuery.trim()) {
      visitedParents.forEach(id => expandedNodes.add(id));
    }

    return filtered;
  }, [data, searchQuery, expandedNodes]);

  // Empty state
  if (!loading && (!data || data.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Building2 className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-sm text-slate-500 font-medium">No locations mapped for this Site</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Search className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs text-slate-500">No results for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredData.map(node => (
              <TreeNodeComponent
                key={node.id}
                node={node}
                depth={depth}
                onSelectNode={onSelectNode}
                onAddChild={onAddChild}
                onEdit={onEdit}
                selectedNodeId={selectedNodeId}
                expandedNodes={expandedNodes}
                setExpandedNodes={setExpandedNodes}
                nodeErrors={nodeErrors}
                loadingNodes={loadingNodes}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
