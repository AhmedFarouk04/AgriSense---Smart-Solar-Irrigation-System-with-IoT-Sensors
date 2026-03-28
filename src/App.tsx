import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster, toast } from "sonner";
import { useEffect, useState, useRef } from "react";
// ✅ تم استيراد الـ ThemeProvider
import { ThemeProvider } from "./pages/ThemeContext";
// Pages
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Verify from "./pages/Verify";
import AddZone from "./pages/AddZone";
import DevicesList from "./pages/DevicesList";
import DeviceDetails from "./pages/DeviceDetails";
import DeviceSettings from "./pages/DeviceSettings";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Help from "./pages/Help";

function NotificationWatcher() {
  const events = useQuery(api.users.getEvents);
  const previousEventsLength = useRef<number | null>(null);
  const audioEnabled = useRef(false);

  useEffect(() => {
    const enableAudio = () => {
      audioEnabled.current = true;
      console.log("🔊 Audio interaction enabled");
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

    if (previousEventsLength.current === null) {
      previousEventsLength.current = events.length;
      return;
    }

    if (events.length > previousEventsLength.current) {
      const newEvents = events.slice(
        0,
        events.length - previousEventsLength.current,
      );
      const hasCriticalAlert = newEvents.some(
        (e: any) => e.type === "alert" || e.type === "low_moisture",
      );

      if (hasCriticalAlert) {
        console.log("🚨 New Alert Detected! Trying to play sound...");
        const audio = new Audio("/alert.mp3");
        audio.volume = 1.0;

        audio
          .play()
          .then(() => console.log("🎵 Sound played successfully"))
          .catch((e) => {
            console.error(
              "⚠️ Browser blocked sound. Click anywhere on the page first.",
              e,
            );
            toast.error("🚨 New critical alert detected!");
          });
      }
    }

    previousEventsLength.current = events.length;
  }, [events]);

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

  return <Dashboard />;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // ❌ مسحنا استخدام الـ THEME الثابت من هنا لأن الـ ThemeContext هيتكفل بيها

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
    // ✅ تغليف التطبيق بالـ ThemeProvider
    <ThemeProvider>
      <div className="min-h-screen flex flex-col" dir="ltr">
        <Toaster position="top-center" richColors />

        <Unauthenticated>
          {currentPath === "/login" && <Login />}
          {currentPath === "/register" && <Register />}
          {currentPath === "/forgot-password" && <ForgotPassword />}
          {currentPath === "/reset-password" && <ResetPassword />}
          {currentPath === "/verify" && <Verify />}
          {!unauthPublicRoutes.includes(currentPath) && <Landing />}
        </Unauthenticated>

        <Authenticated>
          <NotificationWatcher />
          <AuthenticatedRouter currentPath={currentPath} />
        </Authenticated>
      </div>
    </ThemeProvider>
  );
}
