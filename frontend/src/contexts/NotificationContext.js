import React, { createContext, useEffect, useState, useContext, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { AuthContext } from "../components/AuthContext";
import { sanitizeNotificationMessage } from "../utils/errorHandling"; // ✅ NEW IMPORT

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { username } = useContext(AuthContext);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const shouldReconnectRef = useRef(false);

  // Clear notifications when user changes (logout or different user login)
  useEffect(() => {
    setNotifications([]);
  }, [username]);

  useEffect(() => {
    if (!username) {
      // No user — make sure everything is cleaned up
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent onclose from triggering reconnect
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    shouldReconnectRef.current = true;

    const connectWebSocket = () => {
      // Don't reconnect if flag is off (logout happened)
      if (!shouldReconnectRef.current) return;

      // Avoid duplicate connections
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        console.log("WebSocket already connected/connecting");
        return;
      }

      wsRef.current = new WebSocket(
        `wss://autogen.aieducator.com/ws/notifications/${username}/`
      );

      wsRef.current.onopen = () => {
        console.log("WebSocket connected for", username);
      };

      wsRef.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          console.log("WS message received:", msg);

          // Student homework notification
          if (msg.type === "homework_notification" && msg.role === "student") {
            const { notification, homework } = msg;
            const newNotification = {
              id: notification?.id ?? Date.now().toString(),
              title: homework?.title || "New Homework",
              image: homework?.attachment || "/default-homework-image.jpeg",
              message: sanitizeNotificationMessage(
                // ✅ CHANGED
                notification?.message,
                "You have a new homework update.",
              ),
              timestamp:
                notification?.timestamp ||
                homework?.date_assigned ||
                new Date().toISOString(),
              read: false,
              type: "homework",
              homework,
              _notification: notification,
            };

            setNotifications((prev) => {
              const exists = prev.some((n) => n.id === newNotification.id);
              return exists ? prev : [newNotification, ...prev];
            });
          }

          // Teacher acknowledgment
          else if (msg.type === "teacher_ack") {
            const uniqueId = `${msg.class_work_id || msg.homework_id || msg.submission_id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const newNotification = {
              id: uniqueId,
              title: msg.title || "Action Acknowledged",
              message: sanitizeNotificationMessage(
                // ✅ CHANGED
                msg.message,
                "Homework successfully dispatched to class.",
              ),
              timestamp: msg.timestamp || new Date().toISOString(),
              read: false,
              type: "homework-dispatch",
              _raw: msg,
            };

            setNotifications((prev) => [newNotification, ...prev]);
          }

          // Classwork completion
          else if (msg.type === "classwork_completion_notification") {
            const newNotification = {
              id: msg.submission_id ?? Date.now().toString(),
              title: "Classwork Completed",
              message: sanitizeNotificationMessage(
                // ✅ CHANGED
                msg.message,
                "Your classwork has been processed.",
              ),
              summary: msg.summary || null,
              timestamp: msg.timestamp || new Date().toISOString(),
              read: false,
              type: "classwork",
              submissionId: msg.submission_id,
              _raw: msg,
            };

            setNotifications((prev) => {
              const exists = prev.some((n) => n.id === newNotification.id);
              return exists ? prev : [newNotification, ...prev];
            });
          }

          // Homework completion
          else if (msg.type === "homework_completion_notification") {
            const newNotification = {
              id: msg.submission_id ?? Date.now().toString(),
              title: "Homework Completed",
              message: sanitizeNotificationMessage(
                // ✅ CHANGED
                msg.message,
                "Your homework has been processed.",
              ),
              summary: msg.summary || null,
              timestamp: msg.timestamp || new Date().toISOString(),
              read: false,
              type: "homework-completion",
              submissionId: msg.submission_id,
              _raw: msg,
            };

            setNotifications((prev) => {
              const exists = prev.some((n) => n.id === newNotification.id);
              return exists ? prev : [newNotification, ...prev];
            });
          }

          else {
            console.log("Unhandled WS message:", msg);
          }
        } catch (err) {
          console.error("Error parsing WS message", err);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error("WebSocket error", err);
      };

      wsRef.current.onclose = () => {
        console.log("⚠ WebSocket closed, reconnecting...");
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // detach onclose to prevent reconnect during cleanup
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [username]);

  const markNotificationAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ action: "mark_read", notification_id: id })
        );
      }
    } catch (_) {}

    try {
      await axiosInstance.post(`/notifications/${id}/read/`);
    } catch (error) {
      console.warn("⚠ Could not mark as read on server", error);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read: false } : notif
        )
      );
    }
  };

  const clearAllNotifications = async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await Promise.all(
        unread.map((n) =>
          axiosInstance.post(`/notifications/${n.id}/read/`).catch(() => null)
        )
      );
    } catch (error) {
      console.warn("⚠ Could not clear notifications on server:", error);
    }
  };

  const getUnreadCount = () =>
    notifications.filter((notif) => !notif.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        getUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;