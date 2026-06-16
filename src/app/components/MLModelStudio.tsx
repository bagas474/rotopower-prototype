import { useState } from "react";
import { Upload, Trash2, Check, AlertCircle, Brain } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { AssetHierarchyTree, TreeNode } from "./AssetHierarchyTree";

interface MLModel {
  id: number;
  site_id: number;
  sensor_id: number;
  code: string;
  type: "ANOMALY" | "FORECAST";
  alg_name: string;
  description: string;
  path: string;
  is_valid: "VALID" | "INVALID" | "UNCHECKED";
  status: "ACTIVE" | "PENDING" | "RETIRED";
  created_at: string;
  updated_at: string;
}

interface SensorNode extends TreeNode {
  sensorType?: string;
  thresholds?: { normal: number; upper: number };
  sensorData?: any[];
  forecastData?: any[];
}

// Mock asset hierarchy data
const mockAssetHierarchy: SensorNode[] = [
  {
    id: "loc1",
    code: "PLTU1",
    name: "Suralaya Plant (PLTU1)",
    type: "location",
    children: [
      {
        id: "asset1",
        code: "BLR-01",
        name: "Boiler Unit 1",
        type: "asset",
        status: "running",
        children: [
          {
            id: "sensor1",
            code: "VIB-BFP-01A",
            name: "VIB-BFP-01A (Vibration)",
            type: "sensor",
            sensorType: "vibration"
          },
          {
            id: "sensor2",
            code: "TEMP-FWH-01",
            name: "TEMP-FWH-01 (Temperature)",
            type: "sensor",
            sensorType: "temperature"
          }
        ]
      },
      {
        id: "asset2",
        code: "HX-01",
        name: "Heat Exchanger HX-01",
        type: "asset",
        status: "running",
        children: [
          {
            id: "sensor3",
            code: "TEMP-HX-01A",
            name: "TEMP-HX-01A (Inlet)",
            type: "sensor",
            sensorType: "temperature"
          },
          {
            id: "sensor4",
            code: "TEMP-HX-01B",
            name: "TEMP-HX-01B (Outlet)",
            type: "sensor",
            sensorType: "temperature"
          }
        ]
      }
    ]
  },
  {
    id: "loc2",
    code: "PLTU2",
    name: "Tarahan Plant (PLTU2)",
    type: "location",
    children: [
      {
        id: "asset3",
        code: "TRB-01",
        name: "Turbine Unit 1",
        type: "asset",
        status: "tripped",
        children: [
          {
            id: "sensor5",
            code: "VIB-TRB-01",
            name: "VIB-TRB-01 (Vibration)",
            type: "sensor",
            sensorType: "vibration"
          }
        ]
      }
    ]
  }
];

// Mock models data
const mockModels: MLModel[] = [
  {
    id: 1,
    site_id: 1,
    sensor_id: 1,
    code: "ML-VIB-001",
    type: "ANOMALY",
    alg_name: "IFOREST",
    description: "Vibration anomaly detection for BFP",
    path: "models/iforest_vib.pkl",
    is_valid: "VALID",
    status: "ACTIVE",
    created_at: "2024-05-15",
    updated_at: "2024-05-18"
  },
  {
    id: 2,
    site_id: 1,
    sensor_id: 2,
    code: "ML-TEMP-001",
    type: "FORECAST",
    alg_name: "ARIMA",
    description: "Temperature forecasting for FWH inlet",
    path: "models/arima_temp.pkl",
    is_valid: "VALID",
    status: "ACTIVE",
    created_at: "2024-05-10",
    updated_at: "2024-05-20"
  },
  {
    id: 3,
    site_id: 1,
    sensor_id: 4,
    code: "ML-HX-001",
    type: "ANOMALY",
    alg_name: "LOF",
    description: "Local outlier detection for HX outlet",
    path: "models/lof_hx.pkl",
    is_valid: "INVALID",
    status: "PENDING",
    created_at: "2024-05-12",
    updated_at: "2024-05-19"
  }
];

const algorithmOptions = ["IFOREST", "LOF", "ZSCORE", "AUTOENCODER", "ARIMA"];

export function MLModelStudio({ isAdmin }: { isAdmin: boolean }) {
  const [selectedSensor, setSelectedSensor] = useState<SensorNode | null>(null);
  const [models, setModels] = useState<MLModel[]>(mockModels);
  const [newModel, setNewModel] = useState<Partial<MLModel>>({
    type: "ANOMALY",
    status: "PENDING",
    is_valid: "UNCHECKED"
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const sensorModels = selectedSensor?.type === "sensor"
    ? models.filter(m => m.sensor_id === parseInt(selectedSensor.id.replace(/\D/g, "")))
    : [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pkl")) {
      toast.error("Invalid file type. Only .pkl files are supported.");
      return;
    }

    setUploadFile(file);
    toast.success("File selected: " + file.name);
  };

  const handleUploadModel = async () => {
    if (!uploadFile || !selectedSensor) {
      toast.error("Please select a sensor and a model file");
      return;
    }

    setIsUploading(true);

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newModelData: MLModel = {
        id: Math.max(...models.map(m => m.id), 0) + 1,
        site_id: 1,
        sensor_id: parseInt(selectedSensor.id.replace(/\D/g, "")),
        code: newModel.code || `ML-${Date.now()}`,
        type: newModel.type || "ANOMALY",
        alg_name: newModel.alg_name || "IFOREST",
        description: newModel.description || "",
        path: uploadFile.name,
        is_valid: "VALID",
        status: "ACTIVE",
        created_at: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString().split("T")[0]
      };

      setModels([...models, newModelData]);
      setUploadFile(null);
      setNewModel({ type: "ANOMALY", status: "PENDING", is_valid: "UNCHECKED" });
      toast.success("Model uploaded and mapped successfully");
    } catch (error) {
      toast.error("Failed to upload model");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteModel = (id: number) => {
    setModels(models.filter(m => m.id !== id));
    toast.success("Model deleted");
  };

  const getModelTypeColor = (type: "ANOMALY" | "FORECAST") => {
    return type === "ANOMALY" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "RETIRED":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getValidityColor = (validity: string) => {
    switch (validity) {
      case "VALID":
        return "bg-emerald-100 text-emerald-800";
      case "INVALID":
        return "bg-red-100 text-red-800";
      case "UNCHECKED":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">ML Model Studio</h1>
            <p className="text-sm text-slate-500 mt-0.5">Upload and map ML models to physical sensors</p>
          </div>
        </div>
      </div>

      {/* Main Content - Split Pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Asset Hierarchy Tree (25%) */}
        <div className="w-1/4 border-r bg-white shrink-0">
          <AssetHierarchyTree
            data={mockAssetHierarchy}
            depth="sensor"
            onSelectNode={(node) => {
              if (node.type === "sensor") {
                setSelectedSensor(node as SensorNode);
              }
            }}
            selectedNodeId={selectedSensor?.id}
          />
        </div>

        {/* Right Pane: Model Management (75%) */}
        <div className="flex-1 overflow-y-auto">
          {!selectedSensor ? (
            <div className="h-full flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <Brain className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Select a sensor to manage ML models</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Selected Sensor Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-600">Selected Sensor</p>
                <p className="text-lg font-semibold text-slate-900">{selectedSensor.name}</p>
                <p className="text-xs text-slate-500 mt-1">Code: {selectedSensor.code}</p>
              </div>

              {/* Upload Section */}
              {isAdmin && (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Model File (.pkl)
                      </label>
                      <input
                        type="file"
                        accept=".pkl"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Model Code
                        </label>
                        <input
                          type="text"
                          placeholder="ML-VIB-001"
                          maxLength={15}
                          value={newModel.code || ""}
                          onChange={(e) => setNewModel({ ...newModel, code: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">
                          Type
                        </label>
                        <select
                          value={newModel.type || "ANOMALY"}
                          onChange={(e) => setNewModel({ ...newModel, type: e.target.value as "ANOMALY" | "FORECAST" })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                        >
                          <option value="ANOMALY">Anomaly Detection</option>
                          <option value="FORECAST">Forecasting</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">
                        Algorithm
                      </label>
                      <select
                        value={newModel.alg_name || "IFOREST"}
                        onChange={(e) => setNewModel({ ...newModel, alg_name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                      >
                        {algorithmOptions.map(alg => (
                          <option key={alg} value={alg}>{alg}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-1">
                        Description
                      </label>
                      <textarea
                        placeholder="Context about this model..."
                        value={newModel.description || ""}
                        onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-none h-20"
                      />
                    </div>

                    <Button
                      onClick={handleUploadModel}
                      disabled={!uploadFile || isUploading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isUploading ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload & Deploy Model
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Models Grid */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Deployed Models ({sensorModels.length})
                </h2>

                {sensorModels.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <Brain className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No ML models deployed for this sensor</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sensorModels.map(model => (
                      <div
                        key={model.id}
                        className={`border rounded-lg p-4 flex items-start justify-between ${
                          model.is_valid === "INVALID" ? "bg-red-50 border-red-200" : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-slate-900">{model.code}</p>
                            <Badge className={getModelTypeColor(model.type)}>
                              {model.type}
                            </Badge>
                            <Badge className={getStatusColor(model.status)}>
                              {model.status}
                            </Badge>
                            <Badge className={getValidityColor(model.is_valid)}>
                              {model.is_valid === "VALID" && <Check className="h-3 w-3 mr-1" />}
                              {model.is_valid === "INVALID" && <AlertCircle className="h-3 w-3 mr-1" />}
                              {model.is_valid}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{model.description}</p>
                          <div className="flex gap-4 text-xs text-slate-500">
                            <span>Algorithm: {model.alg_name}</span>
                            <span>File: {model.path}</span>
                            <span>Created: {model.created_at}</span>
                          </div>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteModel(model.id)}
                            className="p-2 hover:bg-red-50 rounded transition-colors ml-4"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
