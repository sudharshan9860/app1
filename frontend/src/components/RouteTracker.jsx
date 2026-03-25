import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const ignoredRoutes = ["/", "/login", "/signup"];
    if (!ignoredRoutes.includes(location.pathname)) {
      localStorage.setItem("lastRoute", location.pathname);
    }
    // Reset question context sharing on any route change
    localStorage.setItem("include_question_context", "false");
  }, [location]);

  return null;
};

export default RouteTracker;
