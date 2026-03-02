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
import { useState, useEffect } from "react";
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
  const [isDark, setIsDark] = useState(false);

  const toggleManualMode = useMutation(api.settings.toggleManualMode);
  const togglePump = useMutation(api.settings.togglePumpManual);
  const simulateReading = useMutation(api.readings.simulate);
  const exportData = useQuery(api.exports.exportToCSV);

  useEffect(() => {
    const check = () =>
      setIsDark(document.body.classList.contains("theme-dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

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
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: isDark ? "#070d09" : undefined }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
          <p style={{ color: isDark ? "rgba(255,255,255,0.50)" : "#6b7280" }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const isManualMode = settings?.manualMode || false;
  const pumpStatus = isManualMode
    ? settings?.pumpManualStatus || false
    : latestReading?.pumpStatus || false;

  const tk = isDark
    ? {
        pageBg: "var(--bg-page)",
        cardBg: "rgba(255,255,255,0.04)",
        cardBorder: "1px solid rgba(255,255,255,0.08)",
        cardShadow: "none",
        headTitle: "#e8f5e9",
        headSub: "rgba(255,255,255,0.45)",
        iconWrap: "rgba(255,255,255,0.08)",
        iconBorder: "1px solid rgba(255,255,255,0.10)",
        btnBg: "rgba(255,255,255,0.07)",
        btnBorder: "1px solid rgba(255,255,255,0.10)",
        btnIcon: "rgba(255,255,255,0.60)",
        btnShadow: "none",
        welcomeBg: "rgba(59,130,246,0.07)",
        welcomeBorder: "1px solid rgba(59,130,246,0.18)",
        welcomeIcon: "#60a5fa",
        welcomeTitle: "#e8f5e9",
        welcomeSub: "rgba(255,255,255,0.45)",
        placeholderText: "rgba(255,255,255,0.30)",
      }
    : {
        pageBg: "white",
        cardBg: "white",
        cardBorder: "none",
        cardShadow: "0 4px 24px rgba(0,0,0,0.08)",
        headTitle: "#111827",
        headSub: "#6b7280",
        iconWrap: "linear-gradient(135deg,#16a34a,#0d9488)",
        iconBorder: "none",
        btnBg: "white",
        btnBorder: "none",
        btnIcon: "#374151",
        btnShadow: "0 4px 16px rgba(0,0,0,0.08)",
        welcomeBg: "#eff6ff",
        welcomeBorder: "1px solid #bfdbfe",
        welcomeIcon: "#3b82f6",
        welcomeTitle: "#111827",
        welcomeSub: "#6b7280",
        placeholderText: "#6b7280",
      };

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      style={{ background: tk.pageBg, minHeight: "100vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: tk.iconWrap,
              border: tk.iconBorder,
              boxShadow: tk.cardShadow,
            }}
          >
            <img src="/images/logo.png" alt="AgriSense" className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: tk.headTitle }}>
              Dashboard
            </h1>
            <p className="text-sm" style={{ color: tk.headSub }}>
              Welcome back, {user?.name || "Farmer"}!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAlerts(true)}
            className="p-3 rounded-xl transition-all relative"
            style={{
              background: tk.btnBg,
              border: tk.btnBorder,
              boxShadow: tk.btnShadow,
            }}
          >
            <Bell className="w-5 h-5" style={{ color: tk.btnIcon }} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <button
            onClick={() => setShowCharts(true)}
            className="p-3 rounded-xl transition-all"
            style={{
              background: tk.btnBg,
              border: tk.btnBorder,
              boxShadow: tk.btnShadow,
            }}
          >
            <TrendingUp className="w-5 h-5" style={{ color: tk.btnIcon }} />
          </button>
        </div>
      </div>

      {/* Welcome Message if no data */}
      {!latestReading && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: tk.welcomeBg, border: tk.welcomeBorder }}
        >
          <Sprout
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: tk.welcomeIcon }}
          />
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: tk.welcomeTitle }}
          >
            Welcome to AgriSense!
          </h2>
          <p className="mb-6" style={{ color: tk.welcomeSub }}>
            Get started by adding your first sensor device or simulating a
            reading.
          </p>
          <button
            onClick={handleSimulate}
            className="px-6 py-3 text-white rounded-xl font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg,#16a34a,#0d9488)",
              boxShadow: "0 8px 24px rgba(22,163,74,0.28)",
            }}
          >
            Simulate First Reading
          </button>
        </div>
      )}

      {/* Rest of dashboard */}
      {latestReading && (
        <div className="text-center py-12">
          <p style={{ color: tk.placeholderText }}>
            Dashboard content coming soon...
          </p>
        </div>
      )}

      {/* Modals — logic untouched */}
      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
      {showCharts && <ChartsView onClose={() => setShowCharts(false)} />}
      {showAlerts && <AlertsPanel onClose={() => setShowAlerts(false)} />}
    </div>
  );
}
