import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster, toast } from "sonner";
import { useEffect, useState, useRef, Suspense, lazy } from "react";
import { ThemeProvider } from "./pages/ThemeContext";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Verify = lazy(() => import("./pages/Verify"));
const AddZone = lazy(() => import("./pages/AddZone"));
const DevicesList = lazy(() => import("./pages/DevicesList"));
const DeviceDetails = lazy(() => import("./pages/DeviceDetails"));
const DeviceSettings = lazy(() => import("./pages/DeviceSettings"));
const Reports = lazy(() => import("./pages/Reports"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Help = lazy(() => import("./pages/Help"));
const AgronomyCatalog = lazy(() => import("./pages/AgronomyCatalog"));
const WeeklyActionCenter = lazy(() => import("./pages/WeeklyActionCenter"));

const CRITICAL_TOAST_TYPES = new Set([
  "alert",
  "low_moisture",
  "tank_empty_suspected",
  "critical_escalation",
  "fertilization_safety_stop",
]);

const QUIET_TOAST_TYPES = new Set([
  "device_added",
  "weekly_agronomy_plan",
  "fertilizer_plan",
]);

function shouldToastEvent(event: any) {
  if (event.suppressToast || event.data?.suppressToast) return false;
  return !QUIET_TOAST_TYPES.has(event.type);
}

function buildSingleToast(event: any) {
  let title = "Update";
  let desc = "";
  let type: "info" | "success" | "warning" | "error" = "info";

  switch (event.type) {
    case "tank_empty_suspected":
      title = "Tank Empty Detected";
      desc = event.message?.includes("Fertilization")
        ? "Valve closed • Fertilization stopped"
        : "Valve closed • Pump protected";
      type = "error";
      break;
    case "high_temperature":
      title = "High Temperature";
      desc = event.message?.includes("Fertilization")
        ? "Session halted • Crop protected"
        : "Monitoring • High stress risk";
      type = "warning";
      break;
    case "low_moisture":
      title = "Low Moisture";
      desc = "Irrigation recommended";
      type = "warning";
      break;
    case "low_flow_warning":
      title = "Low Flow";
      desc = "Check tank and filters";
      type = "warning";
      break;
    case "flow_recovered":
      title = "Flow Recovered";
      desc = "Operating normally";
      type = "success";
      break;
    case "moisture_recovered":
      title = "Moisture Recovered";
      desc = "Optimal level reached";
      type = "success";
      break;
    case "temp_recovered":
      title = "Temp Normalized";
      desc = "Operating normally";
      type = "success";
      break;
    case "irrigation_started":
      title = "Irrigation Started";
      desc = "Valve opened";
      type = "info";
      break;
    case "irrigation_stopped":
      title = "Irrigation Stopped";
      desc = "Valve closed";
      type = "info";
      break;
    case "fertilization_started":
      title = "Fertilization Started";
      desc = "Session active";
      type = "info";
      break;
    case "fertilization_completed":
      title = "Fertilization Done";
      desc = "Session completed successfully";
      type = "success";
      break;
    case "fertilization_stopped":
      title = "Fertilization Stopped";
      desc = "Session halted manually";
      type = "info";
      break;
    case "fertilization_safety_stop":
    case "irrigation_safety_stop":
      title = "Safety Stop";
      desc = "Halted automatically";
      type = "error";
      break;
    case "critical_escalation":
      title = "Critical Alert";
      desc = "System requires attention";
      type = "error";
      break;
    default:
      if (event.message && event.message.includes("\n")) {
        const parts = event.message.split("\n");
        title = parts[0].trim();
        desc = parts.slice(1).join(" ").trim();
      } else {
        title = event.message || "Update";
        desc = "";
      }
  }

  // Strip emojis so Sonner native status icons cleanly take over the visual signaling
  title = title
    .replace(
      /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g,
      "",
    )
    .trim();

  if (desc.length > 55) {
    desc = desc.substring(0, 52) + "...";
  }

  return {
    title,
    description: desc,
    type,
    duration: CRITICAL_TOAST_TYPES.has(event.type) ? 8000 : 5000,
  };
}

function AppLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-faint)",
      }}
    >
      Loading...
    </div>
  );
}

function NotificationWatcher() {
  const events = useQuery(api.users.getEvents);
  const settings = useQuery(api.users.getSettings);
  const seenEventIds = useRef<Set<string>>(new Set());
  const audioEnabled = useRef(false);

  useEffect(() => {
    const enableAudio = () => {
      audioEnabled.current = true;
      const silentAudio = new Audio("/alert.mp3");
      silentAudio.volume = 0;
      silentAudio.play().catch(() => {});
      window.removeEventListener("click", enableAudio);
    };

    window.addEventListener("click", enableAudio);
    return () => window.removeEventListener("click", enableAudio);
  }, []);

  useEffect(() => {
    if (events === undefined) return;
    const notificationsEnabled = settings?.notificationsEnabled ?? true;

    if (seenEventIds.current.size === 0) {
      events.forEach((event: any) => {
        seenEventIds.current.add(String(event._id));
      });
      return;
    }

    const unseenEvents = events.filter(
      (event: any) => !seenEventIds.current.has(String(event._id)),
    );
    if (unseenEvents.length === 0) return;

    unseenEvents.forEach((event: any) => {
      seenEventIds.current.add(String(event._id));
    });

    // Keep the dedupe set bounded to recent events only.
    if (seenEventIds.current.size > 300) {
      const recentIds = new Set(
        events.slice(0, 200).map((event: any) => String(event._id)),
      );
      seenEventIds.current = recentIds;
    }

    if (!notificationsEnabled) return;

    const sortedUnseen = unseenEvents
      .slice()
      .sort((a: any, b: any) => b.timestamp - a.timestamp);
    const toastEvents = sortedUnseen.filter(shouldToastEvent);
    if (toastEvents.length === 0) return;

    const hasCriticalAlert = toastEvents.some((e: any) =>
      CRITICAL_TOAST_TYPES.has(e.type),
    );

    if (hasCriticalAlert && audioEnabled.current) {
      const audio = new Audio("/alert.mp3");
      audio.volume = 1.0;
      audio.play().catch(() => {});
    }

    // Individually emit minimal toasts (reversing so latest drops in from top naturally)
    toastEvents
      .slice(0, 3)
      .reverse()
      .forEach((event: any) => {
        const payload = buildSingleToast(event);
        const options = {
          id: `event-${String(event._id)}`,
          description: payload.description,
          duration: payload.duration,
        };

        if (payload.type === "error") toast.error(payload.title, options);
        else if (payload.type === "warning")
          toast.warning(payload.title, options);
        else if (payload.type === "success")
          toast.success(payload.title, options);
        else toast.info(payload.title, options);
      });
  }, [events, settings]);

  return null;
}

function AgronomyBootstrapper() {
  const catalogStatus = useQuery(api.agronomy.getCatalogStatus, {});
  const ensureSeeded = useMutation(api.agronomy.ensureAgronomyCatalogSeeded);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (catalogStatus === undefined || requestedRef.current) return;
    if (catalogStatus.seeded) return;

    requestedRef.current = true;

    ensureSeeded({})
      .then((result: any) => {
        if (result?.seededNow) {
          toast.success("Agronomy database has been initialized.");
        }
      })
      .catch(() => {
        toast.error("Failed to initialize agronomy database.");
        requestedRef.current = false;
      });
  }, [catalogStatus, ensureSeeded]);

  return null;
}

function PlantsBootstrapper() {
  const plantsStatus = useQuery(api.plants.getCatalogStatus, {});
  const ensurePlantsSeeded = useMutation(api.plants.ensurePlantCatalogSeeded);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (plantsStatus === undefined || requestedRef.current) return;
    if (plantsStatus.seeded) return;

    requestedRef.current = true;

    ensurePlantsSeeded({})
      .then((result: any) => {
        if (result?.seededNow) {
          toast.success("Crop catalog has been initialized.");
        }
      })
      .catch(() => {
        toast.error("Failed to initialize crop catalog.");
        requestedRef.current = false;
      });
  }, [plantsStatus, ensurePlantsSeeded]);

  return null;
}

function AuthenticatedRouter({ currentPath }: { currentPath: string }) {
  const user = useQuery(api.auth.loggedInUser);

  if (user === undefined) return null;
  if (!user?.emailVerificationTime) return <Verify />;

  const searchParams = new URLSearchParams(window.location.search);
  const deviceId = searchParams.get("id");

  if (currentPath === "/add-zone") return <AddZone />;
  if (currentPath === "/devices") return <DevicesList />;
  if (currentPath.startsWith("/device-details"))
    return <DeviceDetails deviceId={deviceId} />;
  if (currentPath.startsWith("/device-settings"))
    return <DeviceSettings deviceId={deviceId} />;
  if (currentPath === "/reports") return <Reports />;
  if (currentPath === "/profile") return <Profile />;
  if (currentPath === "/settings") return <Settings />;
  if (currentPath === "/notifications") return <Notifications />;
  if (currentPath === "/help") return <Help />;
  if (currentPath === "/agronomy-catalog") return <AgronomyCatalog />;
  if (currentPath === "/weekly-actions") return <WeeklyActionCenter />;

  return <Dashboard />;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    const originalPushState = history.pushState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      history.pushState = originalPushState;
    };
  }, []);

  const unauthPublicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify",
  ];

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col" dir="ltr">
        <Toaster
          position="top-right"
          richColors
          visibleToasts={3}
          expand={true}
          gap={12}
          toastOptions={{
            style: {
              maxWidth: "320px",
              padding: "14px 16px",
              borderRadius: "14px",
            },
          }}
        />

        <Unauthenticated>
          <Suspense fallback={<AppLoader />}>
            {currentPath === "/login" && <Login />}
            {currentPath === "/register" && <Register />}
            {currentPath === "/forgot-password" && <ForgotPassword />}
            {currentPath === "/reset-password" && <ResetPassword />}
            {currentPath === "/verify" && <Verify />}
            {!unauthPublicRoutes.includes(currentPath) && <Landing />}
          </Suspense>
        </Unauthenticated>

        <Authenticated>
          <Suspense fallback={<AppLoader />}>
            <AgronomyBootstrapper />
            <PlantsBootstrapper />
            <NotificationWatcher />
            <AuthenticatedRouter currentPath={currentPath} />
          </Suspense>
        </Authenticated>
      </div>
    </ThemeProvider>
  );
}
