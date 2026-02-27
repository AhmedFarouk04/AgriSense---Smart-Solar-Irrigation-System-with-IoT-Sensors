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
} from "lucide-react";
import { useState } from "react";
import { PlantSelector } from "./PlantSelector";
import { ReportModal } from "./ReportModal";
import { ChartsView } from "./ChartsView";
import { AlertsPanel } from "./AlertsPanel";
import { toast } from "sonner";

export function Dashboard() {
  const stats = useQuery(api.readings.getStats);
  const latestReading = useQuery(api.readings.getLatest);
  const settings = useQuery(api.settings.get);
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
        newMode ? "تم التبديل إلى الوضع اليدوي" : "تم التبديل إلى الوضع التلقائي"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ");
    }
  };

  const handleTogglePump = async () => {
    try {
      const newStatus = await togglePump();
      toast.success(newStatus ? "تم تشغيل المضخة" : "تم إيقاف المضخة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ");
    }
  };

  const handleSimulate = async () => {
    try {
      await simulateReading();
      toast.success("تم إضافة قراءة جديدة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ");
    }
  };

  const handleExport = () => {
    if (!exportData) return;
    
    const csvContent = [
      exportData.headers.join(","),
      ...exportData.rows.map((row) => row.join(",")),
    ].join("\n");
    
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = exportData.filename;
    link.click();
    toast.success("تم تحميل البيانات بنجاح");
  };

  if (stats === undefined || latestReading === undefined || settings === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!stats || !settings) {
    return null;
  }

  const isManualMode = settings.manualMode;
  const pumpStatus = isManualMode
    ? settings.pumpManualStatus
    : latestReading?.pumpStatus || false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plant Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <PlantSelector currentPlantId={settings.selectedPlantId} />
        </motion.div>

        {/* Mode Toggle & Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">التحكم</h3>
            <div className="space-y-3">
              <button
                onClick={handleToggleMode}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                  isManualMode
                    ? "bg-gradient-to-l from-orange-500 to-red-600 text-white shadow-lg"
                    : "bg-gradient-to-l from-green-500 to-teal-600 text-white shadow-lg"
                }`}
              >
                <span>{isManualMode ? "وضع يدوي" : "وضع تلقائي"}</span>
                {isManualMode ? (
                  <Settings className="w-5 h-5" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => setShowReport(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <FileText className="w-5 h-5" />
                طباعة التقرير
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Current Readings */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">القراءات الحالية</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={!exportData}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              تصدير CSV
            </button>
            <button
              onClick={handleSimulate}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              محاكاة قراءة
            </button>
          </div>
        </div>

        {latestReading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">رطوبة التربة</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {latestReading.moisture}%
                  </p>
                </div>
              </div>
              {settings.plant && (
                <div className="text-xs text-blue-600">
                  المثالي: {settings.plant.minMoisture}-{settings.plant.maxMoisture}%
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">نسبة الملوحة</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {latestReading.salinity.toFixed(1)}
                  </p>
                </div>
              </div>
              {settings.plant && (
                <div className="text-xs text-orange-600">
                  المثالي: {settings.plant.minSalinity}-{settings.plant.maxSalinity}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <Thermometer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-red-700 font-medium">درجة الحرارة</p>
                  <p className="text-3xl font-bold text-red-900">
                    {latestReading.temperature}°C
                  </p>
                </div>
              </div>
              {settings.plant && (
                <div className="text-xs text-red-600">
                  المثالي: {settings.plant.optimalTemp}°C
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className={`p-6 rounded-2xl ${
                pumpStatus
                  ? "bg-gradient-to-br from-teal-50 to-teal-100"
                  : "bg-gradient-to-br from-gray-50 to-gray-100"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    pumpStatus ? "bg-teal-500" : "bg-gray-400"
                  }`}
                >
                  <Power className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      pumpStatus ? "text-teal-700" : "text-gray-700"
                    }`}
                  >
                    حالة المضخة
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      pumpStatus ? "text-teal-900" : "text-gray-900"
                    }`}
                  >
                    {pumpStatus ? "تعمل" : "متوقفة"}
                  </p>
                </div>
              </div>
              {isManualMode && (
                <button
                  onClick={handleTogglePump}
                  className={`w-full mt-2 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    pumpStatus
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-teal-500 hover:bg-teal-600 text-white"
                  }`}
                >
                  {pumpStatus ? (
                    <>
                      <PauseCircle className="w-4 h-4" />
                      إيقاف
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      تشغيل
                    </>
                  )}
                </button>
              )}
              {!isManualMode && latestReading.autoTriggered && (
                <div className="text-xs text-teal-600 mt-2">تشغيل تلقائي</div>
              )}
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد قراءات بعد</p>
            <button
              onClick={handleSimulate}
              className="mt-4 px-6 py-3 bg-gradient-to-l from-green-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              إضافة أول قراءة
            </button>
          </div>
        )}

        {latestReading && (
          <div className="text-center text-sm text-gray-500 mt-6 pt-6 border-t">
            آخر تحديث: {new Date(latestReading._creationTime).toLocaleString("ar-EG")}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-lg text-center"
        >
          <p className="text-sm text-gray-600 mb-1">إجمالي القراءات</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalReadings}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-lg text-center"
        >
          <p className="text-sm text-gray-600 mb-1">متوسط الرطوبة</p>
          <p className="text-2xl font-bold text-blue-600">{stats.avgMoisture}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-lg text-center"
        >
          <p className="text-sm text-gray-600 mb-1">متوسط الملوحة</p>
          <p className="text-2xl font-bold text-orange-600">{stats.avgSalinity}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-lg text-center"
        >
          <p className="text-sm text-gray-600 mb-1">مرات التشغيل</p>
          <p className="text-2xl font-bold text-teal-600">{stats.pumpActivations}</p>
        </motion.div>
      </div>

      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
      {showCharts && <ChartsView onClose={() => setShowCharts(false)} />}
      {showAlerts && <AlertsPanel onClose={() => setShowAlerts(false)} />}
    </div>
  );
}
