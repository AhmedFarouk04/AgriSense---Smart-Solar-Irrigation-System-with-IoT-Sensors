import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Settings,
  Wifi,
  WifiOff,
  Droplets,
  Thermometer,
  Leaf,
  Trash2,
  MoreVertical,
  Activity,
} from "lucide-react";
import { AgriSenseLogo } from "../components/Logo";

const nav = (p: string) => {
  window.history.pushState({}, "", p);
  window.dispatchEvent(new Event("popstate"));
};

const PARTICLES = [
  { x: 8, y: 22, size: 7, color: "var(--particle-1)", delay: 0 },
  { x: 85, y: 15, size: 5, color: "var(--particle-2)", delay: 0.8 },
  { x: 92, y: 65, size: 8, color: "var(--particle-1)", delay: 0.4 },
  { x: 75, y: 40, size: 6, color: "var(--particle-3)", delay: 1.8 },
];

export default function DevicesList() {
  const devices = useQuery(api.devices.getDevices);
  const plants = useQuery(api.Plants.getPlants);
  const deleteDevice = useMutation(api.devices.deleteDevice);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const h = () => setOpenMenu(null);
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, []);

  const plantMap = Object.fromEntries(
    ((plants ?? []) as any[]).map((p) => [p._id, p]),
  );

  const handleDelete = async (deviceId: string, name: string) => {
    setDeletingId(deviceId);
    try {
      await deleteDevice({ deviceId: deviceId as Id<"devices"> });
      toast.success(`Zone "${name}" deleted`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main-gradient)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          className="grid-pattern"
          style={{ position: "absolute", inset: 0, opacity: 0.4 }}
        />
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -18, 0], opacity: [0.25, 0.7, 0.25] }}
            transition={{
              duration: 5 + p.delay,
              repeat: Infinity,
              delay: p.delay,
            }}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "var(--bg-nav)" : "transparent",
          backdropFilter: scrolled ? "blur(32px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(32px)" : "none",
          borderBottom: `1px solid ${scrolled ? "var(--border-base)" : "transparent"}`,
          transition: "all 0.35s ease",
          padding: "12px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => nav("/dashboard")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--glass-bg)",
                border: "1px solid var(--border-card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              <ArrowLeft size={16} />
            </motion.button>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Wifi size={15} style={{ color: "var(--brand-500)" }} />
                My Zones
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-faint)",
                  letterSpacing: "0.04em",
                }}
              >
                {devices?.length ?? 0} zone{devices?.length !== 1 ? "s" : ""}{" "}
                connected
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <motion.button
              whileHover={{
                scale: 1.04,
                boxShadow: "0 6px 20px rgba(22,163,74,0.3)",
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => nav("/add-zone")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                background: "var(--grad-brand)",
                border: "none",
                borderRadius: 12,
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> Add Zone
            </motion.button>
            <motion.a
              href="/dashboard"
              whileHover={{ scale: 1.02 }}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <AgriSenseLogo size={34} />
              <span
                className="fd grad-text"
                style={{ fontSize: 18, fontWeight: 900 }}
              >
                AgriSense
              </span>
            </motion.a>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "32px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Loading */}
        {devices === undefined && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid var(--border-card)",

                borderTopColor: "#4ade80",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        )}

        {/* Empty */}
        {devices !== undefined && devices.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", padding: "80px 24px" }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>🌱</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}
            >
              No zones yet
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                marginBottom: 28,
              }}
            >
              Add your first zone to start monitoring your farm.
            </div>
            <motion.button
              whileHover={{
                scale: 1.04,
                boxShadow: "0 8px 28px rgba(22,163,74,0.3)",
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => nav("/add-zone")}
              className="btn-primary"
            >
              <Plus size={16} /> Add Your First Zone
            </motion.button>
          </motion.div>
        )}

        {/* Devices grid */}
        {devices !== undefined && devices.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {devices.map((device, i) => {
              const plant = plantMap[device.plantId ?? ""];
              const isDeleting = deletingId === device._id;
              const menuOpen = openMenu === device._id;

              return (
                <motion.div
                  key={device._id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${device.isActive ? "var(--border-card)" : "rgba(107,114,128,0.2)"}`,
                    borderRadius: 20,
                    padding: "20px",
                    backdropFilter: "blur(12px)",
                    position: "relative",
                    opacity: isDeleting ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {/* Top row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: device.isActive
                            ? "rgba(74,222,128,0.12)"
                            : "rgba(107,114,128,0.1)",
                          border: `1px solid ${device.isActive ? "rgba(74,222,128,0.25)" : "rgba(107,114,128,0.2)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: device.isActive ? "#4ade80" : "#6b7280",
                        }}
                      >
                        {device.isActive ? (
                          <Wifi size={18} />
                        ) : (
                          <WifiOff size={18} />
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {device.name}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            marginTop: 2,
                          }}
                        >
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: device.isActive
                                ? "#4ade80"
                                : "#6b7280",
                            }}
                          />
                          <span
                            style={{
                              fontSize: 11,
                              color: device.isActive
                                ? "#4ade80"
                                : "var(--text-faint)",
                              fontWeight: 600,
                            }}
                          >
                            {device.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu */}
                    <div style={{ position: "relative" }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(menuOpen ? null : device._id);
                        }}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: "var(--glass-bg)",
                          border: "1px solid var(--border-base)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                        }}
                      >
                        <MoreVertical size={14} />
                      </motion.button>
                      <AnimatePresence>
                        {menuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: "absolute",
                              top: "calc(100% + 6px)",
                              right: 0,
                              background: "var(--bg-card)",
                              border: "1px solid var(--border-card)",
                              borderRadius: 12,
                              overflow: "hidden",
                              zIndex: 50,
                              minWidth: 160,
                              boxShadow: "var(--shadow-md)",
                            }}
                          >
                            {}

                            <button
                              onClick={() => {
                                handleDelete(device._id, device.name);
                                setOpenMenu(null);
                              }}
                              style={{
                                width: "100%",
                                padding: "10px 14px",
                                background: "transparent",
                                border: "none",
                                borderTop: "1px solid var(--border-base)",
                                color: "#f87171",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Plant */}
                  {plant && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 14,
                        padding: "6px 10px",
                        background: "rgba(74,222,128,0.06)",
                        border: "1px solid rgba(74,222,128,0.12)",
                        borderRadius: 8,
                        width: "fit-content",
                      }}
                    >
                      <Leaf size={12} color="#4ade80" />
                      <span
                        style={{
                          fontSize: 12,
                          color: "#4ade80",
                          fontWeight: 600,
                        }}
                      >
                        {plant.name}
                      </span>
                    </div>
                  )}

                  {/* Info rows */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {device.areaM2 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: "var(--text-faint)" }}>Area</span>
                        <span
                          style={{
                            color: "var(--text-secondary)",
                            fontWeight: 600,
                          }}
                        >
                          {device.areaM2} m²
                        </span>
                      </div>
                    )}
                    {device.customMinMoisture !== undefined && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: "var(--text-faint)" }}>
                          Moisture range
                        </span>
                        <span
                          style={{
                            color: "var(--text-secondary)",
                            fontWeight: 600,
                          }}
                        >
                          {device.customMinMoisture}% –{" "}
                          {device.customMaxMoisture ?? "—"}%
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: "var(--text-faint)" }}>Added</span>
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontWeight: 600,
                        }}
                      >
                        {new Date(device.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    </div>
                    {device.notes && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: "var(--text-faint)",
                          lineHeight: 1.5,
                          padding: "8px 10px",
                          background: "var(--glass-bg)",
                          borderRadius: 8,
                        }}
                      >
                        {device.notes}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => nav(`/device-details?id=${device._id}`)}
                      style={{
                        flex: 1,
                        padding: "9px",
                        background: "var(--glass-bg)",
                        border: "1px solid var(--border-card)",
                        borderRadius: 10,
                        color: "var(--text-secondary)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Activity size={13} /> Monitor
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => nav(`/device-settings?id=${device._id}`)}
                      style={{
                        flex: 1,
                        padding: "9px",
                        background: "var(--glass-bg)",
                        border: "1px solid var(--border-card)",
                        borderRadius: 10,
                        color: "var(--text-secondary)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <Settings size={13} /> Settings
                    </motion.button>
                  </div>

                  {/* Deleting overlay */}
                  {isDeleting && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 20,
                        background: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          border: "3px solid rgba(255,255,255,0.2)",
                          borderTopColor: "#f87171",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
