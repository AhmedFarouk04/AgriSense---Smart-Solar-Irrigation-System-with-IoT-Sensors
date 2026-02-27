import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  Droplets,
  Thermometer,
  Activity,
  Power,
  Settings,
  FileText,
  Zap,
  PlayCircle,
  PauseCircle,
  TrendingUp,
  Bell,
  Download,
  Sprout,
} from "lucide-react";
import { useState } from "react";
import { PlantSelector } from "../components/PlantSelector";
import { ReportModal } from "../components/ReportModal";
import { ChartsView } from "../components/ChartsView";
import { AlertsPanel } from "../components/AlertsPanel";
import { toast } from "sonner";

export default function Dashboard() {
  const stats = useQuery(api.readings.getStats);
  const latestReading = useQuery(api.readings.getLatest);
  const settings = useQuery(api.settings.get);
  const user = useQuery(api.auth.loggedInUser);
  const [showReport, setShowReport] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  const toggleManualMode = useMutation(api.settings.toggleManualMode);
  const togglePump = useMutation(api.settings.togglePumpManual);
  const simulateReading = useMutation(api.readings.simulate);
  const exportData = useQuery(api.exports.exportToCSV);

  const handleToggleMode = async () => {
    try {
      const newMode = await toggleManualMode();
      toast.success(
        newMode ? "Switched to manual mode" : "Switched to auto mode",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleTogglePump = async () => {
    try {
      const newStatus = await togglePump();
      toast.success(newStatus ? "Pump turned on" : "Pump turned off");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleSimulate = async () => {
    try {
      await simulateReading();
      toast.success("New reading added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleExport = () => {
    if (!exportData) return;

    const csvContent = [
      exportData.headers.join(","),
      ...exportData.rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = exportData.filename;
    link.click();
    toast.success("Data exported successfully");
  };

  if (
    stats === undefined ||
    latestReading === undefined ||
    settings === undefined ||
    user === undefined
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isManualMode = settings?.manualMode || false;
  const pumpStatus = isManualMode
    ? settings?.pumpManualStatus || false
    : latestReading?.pumpStatus || false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <img src="/images/logo.png" alt="AgriSense" className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">
              Welcome back, {user?.name || "Farmer"}!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAlerts(true)}
            className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all relative"
          >
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <button
            onClick={() => setShowCharts(true)}
            className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <TrendingUp className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Welcome Message if no data */}
      {!latestReading && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
          <Sprout className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to AgriSense!
          </h2>
          <p className="text-gray-600 mb-6">
            Get started by adding your first sensor device or simulating a
            reading.
          </p>
          <button
            onClick={handleSimulate}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Simulate First Reading
          </button>
        </div>
      )}

      {/* Rest of dashboard will be implemented later */}
      {latestReading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Dashboard content coming soon...</p>
        </div>
      )}
    </div>
  );
}
