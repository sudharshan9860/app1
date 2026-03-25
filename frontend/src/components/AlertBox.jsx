import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

const alertStyles = {
  success: "bg-green-50 border-green-400 text-green-800",
  error: "bg-red-50 border-red-400 text-red-800",
  warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
  info: "bg-blue-50 border-[#00A0E3] text-[#0B1120]",
};

const alertIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const AlertBox = ({ message, type = "success", onClose, autoHide = true, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const IconComponent = alertIcons[type] || Info;

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-lg border-l-4 shadow-sm transition-all duration-300 ${
        alertStyles[type] || alertStyles.info
      } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
    >
      <div className="flex items-center gap-2">
        <IconComponent className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button
        onClick={handleClose}
        aria-label="Close alert"
        className="ml-4 p-1 rounded-full hover:bg-black/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Hook for managing alerts
export const useAlert = () => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (message, type = "success", options = {}) => {
    const id = Date.now();
    const alert = {
      id,
      message,
      type,
      ...options,
    };

    setAlerts((prev) => [...prev, alert]);

    return id;
  };

  const hideAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const AlertContainer = () => (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {alerts.map((alert) => (
        <AlertBox
          key={alert.id}
          message={alert.message}
          type={alert.type}
          onClose={() => hideAlert(alert.id)}
          autoHide={alert.autoHide}
          duration={alert.duration}
        />
      ))}
    </div>
  );

  return { showAlert, hideAlert, AlertContainer };
};

export default AlertBox;
