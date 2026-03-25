import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";

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
import DeviceDetails from "./pages/DeviceDetails"; // ✅ ضفنا الـ Import
import DeviceSettings from "./pages/DeviceSettings";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Help from "./pages/Help";

const THEME = "theme-dark";

function AuthenticatedRouter({ currentPath }: { currentPath: string }) {
  const user = useQuery(api.auth.loggedInUser);

  if (user === undefined) return null;
  if (!user?.emailVerificationTime) return <Verify />;

  const searchParams = new URLSearchParams(window.location.search);
  const deviceId = searchParams.get("id");

  if (currentPath === "/add-zone") return <AddZone />;
  if (currentPath === "/devices") return <DevicesList />;

  // ✅ ضفنا مسار صفحة تفاصيل الجهاز
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

  useEffect(() => {
    document.body.classList.add(THEME);
    return () => document.body.classList.remove(THEME);
  }, []);

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
        <AuthenticatedRouter currentPath={currentPath} />
      </Authenticated>
    </div>
  );
}
