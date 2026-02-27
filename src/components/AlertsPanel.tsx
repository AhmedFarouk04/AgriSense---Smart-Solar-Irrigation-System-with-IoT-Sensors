import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle, Info, Zap } from "lucide-react";

interface AlertsPanelProps {
  onClose: () => void;
}

export function AlertsPanel({ onClose }: AlertsPanelProps) {
  const events = useQuery(api.events.list);
  const latestReading = useQuery(api.readings.getLatest);
  const settings = useQuery(api.settings.get);

  if (!events || !latestReading || !settings) {
    return null;
  }

  // تصنيف الأحداث
  const alerts = events.filter((e) => e.type === "alert");
  const pumpEvents = events.filter((e) => e.type === "pump_on" || e.type === "pump_off");
  const settingsEvents = events.filter(
    (e) => e.type === "settings_change" || e.type === "mode_change"
  );

  // التحقق من التنبيهات النشطة
  const activeAlerts = [];
  if (settings.plant && latestReading) {
    if (latestReading.moisture < settings.plant.minMoisture) {
      activeAlerts.push({
        type: "warning",
        message: `رطوبة التربة منخفضة (${latestReading.moisture}%)`,
        detail: `الحد الأدنى المطلوب: ${settings.plant.minMoisture}%`,
      });
    }
    if (latestReading.moisture > settings.plant.maxMoisture) {
      activeAlerts.push({
        type: "warning",
        message: `رطوبة التربة مرتفعة (${latestReading.moisture}%)`,
        detail: `الحد الأقصى المسموح: ${settings.plant.maxMoisture}%`,
      });
    }
    if (latestReading.salinity > settings.plant.maxSalinity) {
      activeAlerts.push({
        type: "danger",
        message: `نسبة الملوحة مرتفعة (${latestReading.salinity.toFixed(1)})`,
        detail: `الحد الأقصى المسموح: ${settings.plant.maxSalinity}`,
      });
    }
    const tempDiff = Math.abs(latestReading.temperature - settings.plant.optimalTemp);
    if (tempDiff > 5) {
      activeAlerts.push({
        type: "warning",
        message: `درجة الحرارة ${latestReading.temperature > settings.plant.optimalTemp ? "مرتفعة" : "منخفضة"}`,
        detail: `الحالية: ${latestReading.temperature}°C، المثالية: ${settings.plant.optimalTemp}°C`,
      });
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">مركز التنبيهات</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alerts Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* التنبيهات النشطة */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                التنبيهات النشطة
              </h3>
              {activeAlerts.length === 0 ? (
                <div className="p-6 bg-green-50 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-semibold text-green-900">
                      كل شيء على ما يرام! ✨
                    </p>
                    <p className="text-sm text-green-700">
                      جميع القراءات ضمن النطاق المثالي
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl flex items-start gap-3 ${
                        alert.type === "danger"
                          ? "bg-red-50 border-2 border-red-200"
                          : "bg-yellow-50 border-2 border-yellow-200"
                      }`}
                    >
                      <AlertTriangle
                        className={`w-6 h-6 flex-shrink-0 ${
                          alert.type === "danger" ? "text-red-500" : "text-yellow-500"
                        }`}
                      />
                      <div className="flex-1">
                        <p
                          className={`font-semibold ${
                            alert.type === "danger" ? "text-red-900" : "text-yellow-900"
                          }`}
                        >
                          {alert.message}
                        </p>
                        <p
                          className={`text-sm mt-1 ${
                            alert.type === "danger" ? "text-red-700" : "text-yellow-700"
                          }`}
                        >
                          {alert.detail}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* سجل التنبيهات */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-500" />
                سجل التنبيهات السابقة
              </h3>
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">لا توجد تنبيهات مسجلة</p>
              ) : (
                <div className="space-y-2">
                  {alerts.slice(0, 10).map((event) => (
                    <div
                      key={event._id}
                      className="p-3 bg-gray-50 rounded-lg flex items-start gap-3"
                    >
                      <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event._creationTime).toLocaleString("ar-EG")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* أحداث المضخة */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-teal-500" />
                سجل تشغيل المضخة
              </h3>
              {pumpEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  لم يتم تشغيل المضخة بعد
                </p>
              ) : (
                <div className="space-y-2">
                  {pumpEvents.slice(0, 10).map((event) => (
                    <div
                      key={event._id}
                      className="p-3 bg-gray-50 rounded-lg flex items-start gap-3"
                    >
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${
                          event.type === "pump_on" ? "bg-teal-500" : "bg-gray-400"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event._creationTime).toLocaleString("ar-EG")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
