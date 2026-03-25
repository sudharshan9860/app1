import React, { useContext, useState } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { NotificationContext } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const LiveNotifications = () => {
  const {
    notifications = [],
    markNotificationAsRead,
    clearAllNotifications,
    getUnreadCount,
  } = useContext(NotificationContext);

  const [showOldNotifications, setShowOldNotifications] = useState(false);
  const [oldNotifications, setOldNotifications] = useState([]);
  const [loadingOldNotifications, setLoadingOldNotifications] = useState(false);
  const navigate = useNavigate();

  const unreadCount = getUnreadCount();

  // Show recent notifications (last 5) or all when expanded
  const displayNotifications = showOldNotifications ? oldNotifications : notifications.slice(0, 5);

  const getNotificationIcon = (type) => {
    const iconMap = {
      achievement: '\uD83C\uDFC6',
      progress: '\uD83D\uDCC8',
      recommendation: '\uD83D\uDCA1',
      reminder: '\u23F0',
      homework: '\uD83D\uDCD6'
    };
    return iconMap[type] || '\uD83D\uDD14';
  };

  const fetchOldNotifications = async () => {
    setLoadingOldNotifications(true);
    try {
      const response = await axiosInstance.get('studentnotifications/');
      setOldNotifications(response.data);
      setShowOldNotifications(true);
    } catch (error) {
      console.error('Error fetching old notifications:', error);
    } finally {
      setLoadingOldNotifications(false);
    }
  };

  const handleNotificationClick = (notification) => {
    console.log("Notification clicked:", notification);

    // Mark notification as read
    markNotificationAsRead(notification.id);

    // Determine if this is a homework notification
    const isHomeworkNotification =
      (notification.type === 'homework' && notification._notification?.id) ||
      notification.homework;

    if (isHomeworkNotification) {
      const notificationId = notification._notification?.id || notification.id;
      console.log("Navigating to homework submission with notification ID:", notificationId);

      navigate('/homework', {
        state: {
          notificationId: notificationId,
        }
      });
    }
  };

  const handleDismiss = (notificationId, e) => {
    e.stopPropagation();
    markNotificationAsRead(notificationId);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-[#0B1120] m-0">
          <Bell className="w-5 h-5 text-[#00A0E3]" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-[#00A0E3] text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </h3>
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {displayNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <CheckCircle className="w-10 h-10 mb-3 text-[#00A0E3]/40" />
            <p className="text-[#0B1120] font-medium mb-1">No new notifications</p>
            <span className="text-sm text-gray-400">You're all caught up!</span>
          </div>
        ) : (
          <>
            {displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-[#F8FAFC] border-b border-gray-50 ${
                  !notification.read ? 'bg-[#00A0E3]/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F8FAFC] flex items-center justify-center text-lg">
                  <span>{getNotificationIcon(notification.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#0B1120] leading-snug">
                    {notification.message}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatTimestamp(notification.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Load More Button */}
      {!showOldNotifications && notifications.length > 5 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <button
            className="w-full py-2 text-sm font-medium text-[#00A0E3] hover:text-[#0080B8] bg-transparent border border-[#00A0E3]/20 rounded-lg hover:bg-[#00A0E3]/5 transition-colors disabled:opacity-50"
            onClick={fetchOldNotifications}
            disabled={loadingOldNotifications}
          >
            {loadingOldNotifications ? 'Loading...' : `View All (${notifications.length})`}
          </button>
        </div>
      )}

      {/* Show Recent Button (when old notifications are shown) */}
      {showOldNotifications && (
        <div className="px-5 py-3 border-t border-gray-100">
          <button
            className="w-full py-2 text-sm font-medium text-[#00A0E3] hover:text-[#0080B8] bg-transparent border border-[#00A0E3]/20 rounded-lg hover:bg-[#00A0E3]/5 transition-colors"
            onClick={() => setShowOldNotifications(false)}
          >
            Show Recent Only
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveNotifications;
