import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Verify from "./pages/Verify";

const THEME = "theme-dark";

function AuthenticatedRouter({ currentPath }: { currentPath: string }) {
  const user = useQuery(api.auth.loggedInUser);

  if (user === undefined) return null;

  if (!user?.emailVerificationTime) {
    return <Verify />;
  }

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

  return (
    <div className="min-h-screen flex flex-col" dir="ltr">
      <Toaster position="top-center" richColors />

      <Unauthenticated>
        {currentPath === "/login" && <Login />}
        {currentPath === "/register" && <Register />}
        {currentPath === "/forgot-password" && <ForgotPassword />}
        {currentPath === "/reset-password" && <ResetPassword />}
        {currentPath === "/verify" && <Verify />}
        {![
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify",
        ].includes(currentPath) && <Landing />}
      </Unauthenticated>

      <Authenticated>
        <AuthenticatedRouter currentPath={currentPath} />
      </Authenticated>
    </div>
  );
}
