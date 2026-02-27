import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer } from "lucide-react";
import { useRef } from "react";

interface ReportModalProps {
  onClose: () => void;
}

export function ReportModal({ onClose }: ReportModalProps) {
  const readings = useQuery(api.readings.getHistory, { limit: 100 });
  const events = useQuery(api.events.list);
  const settings = useQuery(api.settings.get);
  const stats = useQuery(api.readings.getStats);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!readings || !events || !settings || !stats) {
    return null;
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
          <div className="flex items-center justify-between p-6 border-b print:hidden">
            <h2 className="text-2xl font-bold text-gray-900">تقرير النظام الشامل</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="طباعة"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div ref={reportRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Report Header */}
            <div className="text-center border-b pb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                تقرير نظام الري الذكي
              </h1>
              <p className="text-gray-600">
                تاريخ التقرير: {new Date().toLocaleDateString("ar-EG")}
              </p>
              {settings.plant && (
                <p className="text-green-600 font-semibold mt-2">
                  نوع النبات: {settings.plant.nameAr}
                </p>
              )}
            </div>

            {/* Statistics Summary */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">الإحصائيات العامة</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">إجمالي القراءات</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalReadings}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-700">متوسط الرطوبة</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.avgMoisture}%</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm text-orange-700">متوسط الملوحة</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.avgSalinity}</p>
                </div>
                <div className="p-4 bg-teal-50 rounded-xl">
                  <p className="text-sm text-teal-700">مرات التشغيل</p>
                  <p className="text-2xl font-bold text-teal-900">
                    {stats.pumpActivations}
                  </p>
                </div>
              </div>
            </div>

            {/* Events Log */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">سجل الأحداث</h3>
              <div className="space-y-2">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">لا توجد أحداث مسجلة</p>
                ) : (
                  events.map((event) => (
                    <div
                      key={event._id}
                      className="p-3 bg-gray-50 rounded-lg flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event._creationTime).toLocaleString("ar-EG")}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          event.type === "pump_on"
                            ? "bg-teal-100 text-teal-700"
                            : event.type === "pump_off"
                              ? "bg-gray-200 text-gray-700"
                              : event.type === "alert"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {event.type === "pump_on"
                          ? "تشغيل"
                          : event.type === "pump_off"
                            ? "إيقاف"
                            : event.type === "alert"
                              ? "تنبيه"
                              : "إعدادات"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Readings Table */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                سجل القراءات (آخر {readings.length} قراءة)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-right">التاريخ والوقت</th>
                      <th className="px-4 py-2 text-right">الرطوبة</th>
                      <th className="px-4 py-2 text-right">الملوحة</th>
                      <th className="px-4 py-2 text-right">الحرارة</th>
                      <th className="px-4 py-2 text-right">حالة المضخة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((reading) => (
                      <tr key={reading._id} className="border-b">
                        <td className="px-4 py-2">
                          {new Date(reading._creationTime).toLocaleString("ar-EG")}
                        </td>
                        <td className="px-4 py-2">{reading.moisture}%</td>
                        <td className="px-4 py-2">{reading.salinity.toFixed(1)}</td>
                        <td className="px-4 py-2">{reading.temperature}°C</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              reading.pumpStatus
                                ? "bg-teal-100 text-teal-700"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {reading.pumpStatus ? "تعمل" : "متوقفة"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
