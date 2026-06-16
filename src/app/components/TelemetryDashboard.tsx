import { useState } from "react";
import { ChevronDown, ChevronRight, Database, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface SensorNode {
  id: string;
  name: string;
  type: "location" | "asset" | "sensor";
  children?: SensorNode[];
  sensorData?: {
    timestamp: string;
    value: number;
  }[];
  forecastData?: {
    timestamp: string;
    value: number;
    algorithm: string;
  }[];
}

interface TelemetryDashboardProps {
  isAdmin?: boolean;
}

// Mock asset hierarchy with sensor data
const mockAssetHierarchy: SensorNode[] = [
  {
    id: "loc1",
    name: "Suralaya Plant (PLTU1)",
    type: "location",
    children: [
      {
        id: "asset1",
        name: "Boiler Unit 1",
        type: "asset",
        children: [
          {
            id: "sensor1",
            name: "VIB-BFP-01A (Vibration)",
            type: "sensor",
            sensorData: generateSensorData("vibration", 24),
            forecastData: generateForecastData("vibration", 24)
          },
          {
            id: "sensor2",
            name: "TEMP-FWH-01 (Temperature)",
            type: "sensor",
            sensorData: generateSensorData("temperature", 24),
            forecastData: generateForecastData("temperature", 24)
          }
        ]
      },
      {
        id: "asset2",
        name: "Heat Exchanger HX-01",
        type: "asset",
        children: [
          {
            id: "sensor3",
            name: "TEMP-HX-01A (Inlet)",
            type: "sensor",
            sensorData: generateSensorData("temperature", 24),
            forecastData: generateForecastData("temperature", 24)
          },
          {
            id: "sensor4",
            name: "TEMP-HX-01B (Outlet)",
            type: "sensor",
            sensorData: generateSensorData("temperature", 24),
            forecastData: generateForecastData("temperature", 24)
          }
        ]
      }
    ]
  },
  {
    id: "loc2",
    name: "Tarahan Plant (PLTU2)",
    type: "location",
    children: [
      {
        id: "asset3",
        name: "Turbine Unit 1",
        type: "asset",
        children: [
          {
            id: "sensor5",
            name: "VIB-TRB-01 (Vibration)",
            type: "sensor",
            sensorData: generateSensorData("vibration", 24),
            forecastData: generateForecastData("vibration", 24)
          }
        ]
      }
    ]
  }
];

function generateSensorData(type: string, hours: number) {
  const now = new Date();
  const data = [];
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 3600000);
    const baseValue = type === "vibration" ? 4.5 : 75;
    const variance = Math.sin(i * 0.1) * 0.5 + Math.random() * 0.3;
    data.push({
      timestamp: timestamp.toISOString().slice(0, 16),
      value: parseFloat((baseValue + variance).toFixed(2))
    });
  }
  return data;
}

function generateForecastData(type: string, hours: number) {
  const now = new Date();
  const data = [];
  for (let i = 1; i <= hours; i++) {
    const timestamp = new Date(now.getTime() + i * 3600000);
    const baseValue = type === "vibration" ? 4.5 : 75;
    const trend = i * 0.02;
    const variance = Math.sin(i * 0.1) * 0.4;
    data.push({
      timestamp: timestamp.toISOString().slice(0, 16),
      value: parseFloat((baseValue + trend + variance).toFixed(2)),
      algorithm: "ARIMA"
    });
  }
  return data;
}

function AssetTreeNode({
  node,
  level = 0,
  onSelectSensor
}: {
  node: SensorNode;
  level?: number;
  onSelectSensor: (node: SensorNode) => void;
}) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSensor = node.type === "sensor";

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer ${
          isSensor ? "ml-4" : ""
        } ${level > 0 ? "ml-" + level * 2 : ""}`}
        style={{ marginLeft: `${level * 12}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:bg-slate-200 rounded"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3 text-slate-600" />
            ) : (
              <ChevronRight className="h-3 w-3 text-slate-600" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}

        {isSensor ? (
          <Zap className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
        ) : (
          <Database className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
        )}

        <button
          onClick={() => isSensor && onSelectSensor(node)}
          className={`text-xs font-medium flex-1 text-left truncate ${
            isSensor ? "text-slate-900 hover:text-blue-700" : "text-slate-700"
          }`}
        >
          {node.name}
        </button>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children!.map(child => (
            <AssetTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelectSensor={onSelectSensor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TimeSeriesChart({ sensor }: { sensor: SensorNode }) {
  const chartData = sensor.sensorData || [];
  const forecastData = sensor.forecastData || [];

  const allData = [...chartData, ...forecastData];
  const minValue = Math.min(...allData.map(d => d.value));
  const maxValue = Math.max(...allData.map(d => d.value));
  const range = maxValue - minValue || 1;
  const padding = range * 0.1;

  const yMin = minValue - padding;
  const yMax = maxValue + padding;
  const chartHeight = 300;
  const chartWidth = 800;

  const getX = (index: number) => (index / (allData.length - 1)) * chartWidth;
  const getY = (value: number) => chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;

  // Create path for actual data
  const actualPath = chartData
    .map((d, i) => `${getX(i)},${getY(d.value)}`)
    .join(" L ");

  // Create path for forecast data
  const forecastStart = chartData.length - 1;
  const forecastPath = forecastData
    .map((d, i) => `${getX(forecastStart + i)},${getY(d.value)}`)
    .join(" L ");

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">{sensor.name}</h3>
          <p className="text-xs text-slate-500 mt-1">Last 24 hours with 24h forecast</p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-blue-600" />
            <span className="text-slate-600">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-orange-500 border-t border-orange-500" style={{ borderTop: "2px dashed" }} />
            <span className="text-slate-600">Forecast</span>
          </div>
        </div>
      </div>

      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="border border-slate-100 rounded bg-slate-50">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={`grid-${pct}`}
            x1="0"
            y1={chartHeight * (1 - pct)}
            x2={chartWidth}
            y2={chartHeight * (1 - pct)}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}

        {/* Actual data line */}
        {chartData.length > 1 && (
          <polyline
            points={actualPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Forecast data line */}
        {forecastData.length > 1 && (
          <polyline
            points={forecastPath}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeDasharray="5,5"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Divider line between actual and forecast */}
        {chartData.length > 0 && (
          <line
            x1={getX(chartData.length - 1)}
            y1="0"
            x2={getX(chartData.length - 1)}
            y2={chartHeight}
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        )}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const value = yMin + (yMax - yMin) * pct;
          return (
            <text
              key={`label-${pct}`}
              x="-5"
              y={chartHeight * (1 - pct) + 4}
              textAnchor="end"
              fontSize="12"
              fill="#64748b"
            >
              {value.toFixed(1)}
            </text>
          );
        })}
      </svg>

      <div className="mt-2 text-xs text-slate-500">
        <p>Last value: {chartData[chartData.length - 1]?.value} • Forecast algorithm: {forecastData[0]?.algorithm}</p>
      </div>
    </div>
  );
}

export function TelemetryDashboard({ isAdmin = false }: TelemetryDashboardProps) {
  const [selectedSensor, setSelectedSensor] = useState<SensorNode | null>(null);
  const [dateRange, setDateRange] = useState("24h");

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Telemetry Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">Monitor real-time sensor data with ML forecasts</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-6">
            <Button variant="outline" size="sm">
              Sync All Charts
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Asset Hierarchy Tree (25%) */}
        <div className="w-1/4 border-r bg-white overflow-y-auto shrink-0">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-slate-600 mb-2 uppercase">Asset Hierarchy</h2>
            <div className="space-y-0">
              {mockAssetHierarchy.map(location => (
                <AssetTreeNode
                  key={location.id}
                  node={location}
                  onSelectSensor={setSelectedSensor}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Charts Container (75%) */}
        <div className="flex-1 overflow-y-auto">
          {!selectedSensor ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Database className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Select a Sensor from the hierarchy on the left</p>
                <p className="text-sm text-slate-400 mt-1">Drill down through Location → Asset → Sensor</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <TimeSeriesChart sensor={selectedSensor} />

              {/* Additional chart for multi-sensor view could go here */}
              <div className="text-xs text-slate-500 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p>
                  <strong>Live Mode:</strong> Click the "Live" button on a chart to enable real-time WebSocket updates
                  (1-second refresh interval).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
