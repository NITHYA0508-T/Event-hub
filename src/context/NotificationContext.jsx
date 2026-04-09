import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { notificationsAPI } from "../api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(() => {
    if (!user) return;
    const data = notificationsAPI.getForUser(user._id);
    setNotifications(data);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = () => {
    if (!user) return;
    notificationsAPI.markAllRead(user._id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    notificationsAPI.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, fetchNotifications, markAllRead, markRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
