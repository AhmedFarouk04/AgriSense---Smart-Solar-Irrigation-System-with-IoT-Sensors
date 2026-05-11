import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
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
  const previousEventsLength = useRef<number | null>(null);
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

    if (previousEventsLength.current === null) {
      previousEventsLength.current = events.length;
      return;
    }

    if (events.length > previousEventsLength.current) {
      const newEvents = events.slice(
        0,
        events.length - previousEventsLength.current,
      );
      const hasCriticalAlert = newEvents.some((e: any) =>
        [
          "alert",
          "low_moisture",
          "tank_empty_suspected",
          "critical_escalation",
          "fertilization_safety_stop",
        ].includes(e.type),
      );

      if (notificationsEnabled && hasCriticalAlert) {
        if (audioEnabled.current) {
          const audio = new Audio("/alert.mp3");
          audio.volume = 1.0;
          audio.play().catch(() => {
            toast.error("New critical alert detected!");
          });
        } else {
          toast.error("New critical alert detected!");
        }
      }

      if (notificationsEnabled) {
        const latestFirst = newEvents.slice(0, 3);
        latestFirst.forEach((event: any) => {
          toast(event.message, { duration: 5000 });
        });
      }
    }

    previousEventsLength.current = events.length;
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
        <Toaster position="top-center" richColors />

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
            <NotificationWatcher />
            <AuthenticatedRouter currentPath={currentPath} />
          </Suspense>
        </Authenticated>
      </div>
    </ThemeProvider>
  );
}
