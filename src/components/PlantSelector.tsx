import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Leaf, Check } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface PlantSelectorProps {
  currentPlantId?: Id<"plants">;
}

export function PlantSelector({ currentPlantId }: PlantSelectorProps) {
  const plants = useQuery(api.plants.list);
  const updatePlant = useMutation(api.settings.updatePlant);

  const handleSelect = async (plantId: Id<"plants">) => {
    try {
      await updatePlant({ plantId });
      toast.success("تم تحديث نوع النبات");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ");
    }
  };

  if (!plants) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Leaf className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">نوع النبات</h3>
          <p className="text-sm text-gray-600">اختر النبات للحصول على توصيات دقيقة</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {plants.map((plant, index) => (
          <motion.button
            key={plant._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleSelect(plant._id)}
            className={`relative p-4 rounded-xl border-2 transition-all text-right ${
              currentPlantId === plant._id
                ? "border-green-500 bg-green-50 shadow-lg"
                : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
            }`}
          >
            {currentPlantId === plant._id && (
              <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="text-2xl mb-2">🌱</div>
            <div className="font-bold text-gray-900">{plant.nameAr}</div>
            <div className="text-xs text-gray-500">{plant.name}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
