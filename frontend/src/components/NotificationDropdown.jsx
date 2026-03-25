import React, { useContext, useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Bell, X, Loader2, Trophy, TrendingUp, Lightbulb, Clock, BookOpen } from 'lucide-react';
import { NotificationContext } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from './AuthContext';

const NotificationDropdown = () => {
  const {
    notifications = [],
    markNotificationAsRead,
    clearAllNotifications,
    getUnreadCount,
  } = useContext(NotificationContext);

  const { username, fullName, role } = useContext(AuthContext);

  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [oldNotifications, setOldNotifications] = useState([]);
  const [loadingOldNotifications, setLoadingOldNotifications] = useState(false);
  const [oldNotificationsLoaded, setOldNotificationsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = getUnreadCount();

  const allNotifications = oldNotificationsLoaded
    ? oldNotifications
    : notifications;

  const notificationIconMap = {
    achievement: { Icon: Trophy, color: 'text-amber-500 bg-amber-50' },
    progress: { Icon: TrendingUp, color: 'text-green-500 bg-green-50' },
    recommendation: { Icon: Lightbulb, color: 'text-[#00A0E3] bg-blue-50' },
    reminder: { Icon: Clock, color: 'text-orange-500 bg-orange-50' },
    homework: { Icon: BookOpen, color: 'text-purple-500 bg-purple-50' },
  };
  const defaultNotifIcon = { Icon: Bell, color: 'text-gray-500 bg-gray-50' };

  const fetchOldNotifications = async () => {
    setLoadingOldNotifications(true);
    try {
      const response = await axiosInstance.get('studentnotifications/');
      setOldNotifications(response.data);
      setOldNotificationsLoaded(true);
    } catch (error) {
      console.error('Error fetching old notifications:', error);
    } finally {
      setLoadingOldNotifications(false);
    }
  };

  // Calculate dropdown position when opening
  const toggleDropdown = () => {
    if (!isOpen && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: Math.max(8, rect.left - 280 + rect.width),
      });
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        bellRef.current && !bellRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setOldNotifications([]);
        setOldNotificationsLoaded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification.id);

    const isHomeworkNotification =
      (notification.type === 'homework' && notification._notification?.id) ||
      notification.homework;

    if (isHomeworkNotification) {
      const notificationId = notification._notification?.id || notification.id;
      navigate('/homework', {
        state: {
          notificationId: notificationId,
        }
      });
      setIsOpen(false);
    } else {
      setSelectedNotification(notification);
      setShowModal(true);
      setIsOpen(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNotification(null);
  };

  return (
    <>
      <div className="relative">
{/* Bell trigger */}
<button
  ref={bellRef}
  onClick={toggleDropdown}
  className={`
    relative p-2 rounded-full transition-all duration-300 border-none cursor-pointer
    ${isOpen
      ? 'bg-[#00A0E3] text-white shadow-lg shadow-[#00A0E3]/40 scale-110'
      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white hover:scale-105'
    }
  `}
>
  <Bell size={18} strokeWidth={2.5} />

  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 flex h-4 w-4">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-[8px] font-bold text-white border border-[#0B1120]">
        {unreadCount}
      </span>
    </span>
  )}
</button>

        {/* Dropdown - rendered via portal to escape sidebar stacking context */}
        {isOpen && ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            className="fixed w-80 bg-white rounded-xl shadow-2xl border border-gray-100"
            style={{ top: dropdownPos.top, left: '15vw', zIndex: 999999 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-[#0B1120]">Notifications</span>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-[#00A0E3] hover:text-[#0080B8] font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Load old notifications button */}
            {!oldNotificationsLoaded && role === "student" && (
              <div className="px-3 py-2 border-b border-gray-50">
                <button
                  onClick={fetchOldNotifications}
                  disabled={loadingOldNotifications}
                  className="w-full px-3 py-1.5 text-xs font-medium text-[#00A0E3] border border-[#00A0E3] rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  {loadingOldNotifications ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load Old Notifications'
                  )}
                </button>
              </div>
            )}

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto">
              {allNotifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">
                  No notifications
                </div>
              ) : (
                allNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${!notification.read ? 'bg-blue-50/30' : ''
                      }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {(() => {
                        const { Icon, color } = notificationIconMap[notification.type] || defaultNotifIcon;
                        return (
                          <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                            <Icon size={16} />
                          </span>
                        );
                      })()}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Modal for showing non-homework notification details */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-[#0B1120]">
                {selectedNotification?.title || 'Notification Details'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Message:</span> {selectedNotification?.message}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Date:</span>{' '}
                {selectedNotification?.timestamp
                  ? new Date(selectedNotification.timestamp).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
            <div className="flex justify-end px-5 py-3 border-t border-gray-100">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationDropdown;
