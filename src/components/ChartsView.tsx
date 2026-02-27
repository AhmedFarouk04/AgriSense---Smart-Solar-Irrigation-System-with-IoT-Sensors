import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartsViewProps {
  onClose: () => void;
}

export function ChartsView({ onClose }: ChartsViewProps) {
  const readings = useQuery(api.readings.getHistory, { limit: 50 });

  if (!readings) {
    return null;
  }

  // تحويل البيانات لتنسيق Recharts
  const chartData = readings
    .slice()
    .reverse()
    .map((reading, index) => ({
      index: index + 1,
      رطوبة: reading.moisture,
      ملوحة: reading.salinity,
      حرارة: reading.temperature,
      time: new Date(reading._creationTime).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              الرسوم البيانية التفاعلية
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Charts Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {chartData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>لا توجد بيانات كافية لعرض الرسوم البيانية</p>
                <p className="text-sm mt-2">أضف المزيد من القراءات لرؤية التحليلات</p>
              </div>
            ) : (
              <>
                {/* رطوبة التربة */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 text-start">
                    تطور رطوبة التربة
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="رطوبة"
                        stroke="#3B82F6"
                        fillOpacity={1}
                        fill="url(#colorMoisture)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* الملوحة ودرجة الحرارة */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-orange-900 mb-4 text-start">
                    الملوحة ودرجة الحرارة
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="ملوحة"
                        stroke="#F97316"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="حرارة"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* جميع القراءات معاً */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 text-start">
                    نظرة شاملة على جميع القراءات
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="رطوبة"
                        stroke="#3B82F6"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="ملوحة"
                        stroke="#F97316"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="حرارة"
                        stroke="#EF4444"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
