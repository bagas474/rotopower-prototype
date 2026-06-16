import { useState, useEffect } from "react";
import { AlertCircle, Shield, Search, Filter, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Skeleton } from "./ui/skeleton";

interface Anomaly {
  id: string;
  timestamp: string;
  sensor_id: number;
  sensor_name: string;
  anomaly_alg: string;
  score: number;
  sensor_data: {
    value: number;
    unit: string;
    timestamp: string;
  };
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

interface AnomalyAlertCenterProps {
  isAdmin?: boolean;
}

// Mock data generator for anomalies
const generateMockAnomalies = (): Anomaly[] => {
  const algorithms = ["IFOREST", "LOF", "ZSCORE", "AUTOENCODER"];
  const sensorNames = [
    "VIB-BFP-01A",
    "TEMP-FWH-01",
    "TEMP-HX-01A",
    "TEMP-HX-01B",
    "VIB-TRB-01",
    "PRESS-HX-02"
  ];

  const anomalies: Anomaly[] = [];
  const now = new Date();

  for (let i = 0; i < 8; i++) {
    const timestamp = new Date(now.getTime() - i * 30 * 60000);
    anomalies.push({
      id: `anomaly-${i + 1}`,
      timestamp: timestamp.toISOString(),
      sensor_id: 10 + i,
      sensor_name: sensorNames[i % sensorNames.length],
      anomaly_alg: algorithms[i % algorithms.length],
      score: Math.floor(Math.random() * 40) + 60,
      sensor_data: {
        value: Math.random() * 100 + 50,
        unit: i % 3 === 0 ? "°C" : "mm/s",
        timestamp: timestamp.toISOString()
      },
      acknowledged: false
    });
  }

  return anomalies.sort((a, b) => b.score - a.score);
};

// Gauge component for anomaly score visualization
function AnomalyGauge({ score }: { score: number }) {
  const getGaugeColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 60) return "text-orange-500";
    return "text-yellow-500";
  };

  const getGaugeBgColor = (score: number) => {
    if (score >= 80) return "bg-red-50";
    if (score >= 60) return "bg-orange-50";
    return "bg-yellow-50";
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-lg ${getGaugeBgColor(score)}`}>
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-200"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${Math.min((score / 100) * 314, 314)} 314`}
            className={getGaugeColor(score)}
          />
        </svg>
        <div className="absolute text-center">
          <div className={`text-4xl font-bold ${getGaugeColor(score)}`}>{score}</div>
          <div className="text-xs text-slate-600">Anomaly Score</div>
        </div>
      </div>
    </div>
  );
}

// Anomaly card component for the inbox list
function AnomalyCard({
  anomaly,
  selected,
  onSelect
}: {
  anomaly: Anomaly;
  selected: boolean;
  onSelect: () => void;
}) {
  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-red-100 text-red-800";
    if (score >= 60) return "bg-orange-100 text-orange-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return time.toLocaleDateString();
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <p className="font-semibold text-slate-900 text-sm truncate">{anomaly.sensor_name}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            {timeAgo(anomaly.timestamp)}
          </p>
        </div>
        <Badge className={getScoreBadgeColor(anomaly.score)} variant="outline">
          {anomaly.score}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {anomaly.anomaly_alg}
        </Badge>
        {anomaly.acknowledged && (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
      </div>
    </button>
  );
}

export function AnomalyAlertCenter({ isAdmin }: AnomalyAlertCenterProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [algorithmFilter, setAlgorithmFilter] = useState("all");
  const [scoreThreshold, setScoreThreshold] = useState("0");

  // Mock data initialization
  useEffect(() => {
    setLoading(true);
    // Simulate API call delay
    const timer = setTimeout(() => {
      const data = generateMockAnomalies();
      setAnomalies(data);
      if (data.length > 0) {
        setSelectedAnomaly(data[0]);
      }
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Filter anomalies based on search and filters
  const filteredAnomalies = anomalies.filter(anomaly => {
    const matchesSearch = anomaly.sensor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAlgorithm = algorithmFilter === "all" || anomaly.anomaly_alg === algorithmFilter;
    const matchesScore = anomaly.score >= parseInt(scoreThreshold);
    return matchesSearch && matchesAlgorithm && matchesScore && !anomaly.acknowledged;
  });

  const handleAcknowledge = (anomalyId: string) => {
    setAnomalies(prev =>
      prev.map(a =>
        a.id === anomalyId
          ? {
              ...a,
              acknowledged: true,
              acknowledged_by: "Current User",
              acknowledged_at: new Date().toISOString()
            }
          : a
      )
    );
    setSelectedAnomaly(null);
  };

  const handleCreateDefect = () => {
    if (selectedAnomaly) {
      handleAcknowledge(selectedAnomaly.id);
      // In a real app, this would open a work order creation modal
      console.log("[v0] Create defect for anomaly:", selectedAnomaly.id);
    }
  };

  const getAlgorithms = () => {
    const algorithms = new Set(anomalies.map(a => a.anomaly_alg));
    return Array.from(algorithms).sort();
  };

  // Empty state
  if (!loading && filteredAnomalies.length === 0 && selectedAnomaly === null) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">All Clear!</h2>
            <p className="text-slate-600">No pending anomalies detected. Keep monitoring your systems.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Anomaly Alert Center</h1>
            <p className="text-sm text-slate-500 mt-0.5">Monitor and acknowledge equipment anomalies</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{filteredAnomalies.length}</p>
            <p className="text-xs text-slate-500">Pending Alerts</p>
          </div>
        </div>
      </div>

      {/* Main Content - Split Pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Inbox List (30%) */}
        <div className="w-[30%] border-r bg-slate-50 flex flex-col shrink-0">
          {/* Filters */}
          <div className="p-4 border-b space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search sensors..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={algorithmFilter} onValueChange={setAlgorithmFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Algorithm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Algorithms</SelectItem>
                  {getAlgorithms().map(algo => (
                    <SelectItem key={algo} value={algo}>
                      {algo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={scoreThreshold} onValueChange={setScoreThreshold}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Scores</SelectItem>
                  <SelectItem value="60">Score ≥ 60</SelectItem>
                  <SelectItem value="80">Score ≥ 80 (Critical)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Anomaly List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="w-full h-24 rounded-lg" />
                ))}
              </div>
            ) : filteredAnomalies.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No anomalies match your filters</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredAnomalies.map(anomaly => (
                  <AnomalyCard
                    key={anomaly.id}
                    anomaly={anomaly}
                    selected={selectedAnomaly?.id === anomaly.id}
                    onSelect={() => setSelectedAnomaly(anomaly)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Detail View (70%) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedAnomaly ? (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center max-w-md">
                <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Select an anomaly to view details</p>
              </div>
            </div>
          ) : (
            <>
              {/* Detail Header */}
              <div className="border-b px-6 py-4 shrink-0 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{selectedAnomaly.sensor_name}</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Detected {new Date(selectedAnomaly.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge className={
                    selectedAnomaly.score >= 80
                      ? "bg-red-100 text-red-800"
                      : selectedAnomaly.score >= 60
                      ? "bg-orange-100 text-orange-800"
                      : "bg-yellow-100 text-yellow-800"
                  }>
                    {selectedAnomaly.anomaly_alg}
                  </Badge>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* Anomaly Score Gauge */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Anomaly Score</h3>
                  <AnomalyGauge score={selectedAnomaly.score} />
                </div>

                {/* Sensor Data */}
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Sensor Reading</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-600">Value</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {selectedAnomaly.sensor_data.value.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Unit</p>
                      <p className="text-lg font-semibold text-slate-900">{selectedAnomaly.sensor_data.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Timestamp</p>
                      <p className="text-xs text-slate-900 font-mono">
                        {new Date(selectedAnomaly.sensor_data.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Metadata</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sensor ID:</span>
                      <span className="font-medium text-slate-900">{selectedAnomaly.sensor_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Algorithm:</span>
                      <span className="font-medium text-slate-900">{selectedAnomaly.anomaly_alg}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t px-6 py-4 shrink-0 bg-white space-y-2">
                <Button
                  onClick={handleCreateDefect}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Defect / Work Order
                </Button>
                <Button
                  onClick={() => handleAcknowledge(selectedAnomaly.id)}
                  variant="outline"
                  className="w-full"
                >
                  Acknowledge Alert
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
