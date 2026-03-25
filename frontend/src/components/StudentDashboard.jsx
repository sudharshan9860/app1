import React from 'react';
import { Bell, Calendar, CheckCircle, Clock } from 'lucide-react';

const StudentDashboard = ({ user, assignments, notifications, submissions, onNotificationClick }) => {
  const unreadNotifications = notifications.filter((n) => !n.isRead);

  const getSubmissionStatus = (assignmentId) => {
    return submissions.find((s) => s.assignmentId === assignmentId);
  };

  const isOverdue = (dueDate) => {
    return new Date() > dueDate;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <div className="relative">
            <Bell className="w-6 h-6 text-[#00A0E3]" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadNotifications.length}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#0B1120]">Notifications</h2>
            <p className="text-sm text-gray-500">New homework assignments and updates</p>
          </div>
        </div>

        <div className="p-5">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell className="w-12 h-12 mb-3 stroke-1" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'
                    } hover:bg-blue-50`}
                    onClick={() => onNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-[#0B1120]">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.createdAt.toLocaleString()}</p>
                      </div>
                      {!notification.isRead && <div className="w-2 h-2 rounded-full bg-[#00A0E3] mt-1 flex-shrink-0"></div>}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Assignments Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100">
          <Calendar className="w-6 h-6 text-[#00A0E3]" />
          <div>
            <h2 className="text-lg font-semibold text-[#0B1120]">All Assignments</h2>
            <p className="text-sm text-gray-500">View all assignments and their status</p>
          </div>
        </div>

        <div className="p-5">
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Calendar className="w-12 h-12 mb-3 stroke-1" />
                <p>No assignments available</p>
              </div>
            ) : (
              assignments
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .map((assignment) => {
                  const submission = getSubmissionStatus(assignment.id);
                  const overdue = isOverdue(assignment.dueDate);

                  return (
                    <div key={assignment.id} className="p-4 border border-gray-100 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-[#0B1120]">{assignment.title}</h3>
                        <div>
                          {submission ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Submitted
                            </span>
                          ) : overdue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                              <Clock className="w-3.5 h-3.5" />
                              Overdue
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                              <Clock className="w-3.5 h-3.5" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {assignment.description && (
                        <p className="text-sm text-gray-600 mb-3">{assignment.description}</p>
                      )}

                      {assignment.imageUrl && (
                        <img
                          src={assignment.imageUrl}
                          alt="Assignment"
                          className="w-full rounded-lg mb-3 max-h-48 object-cover"
                        />
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Assigned: {assignment.createdAt.toLocaleDateString()}</span>
                        <span className={overdue ? "text-red-500 font-medium" : ""}>
                          Due: {assignment.dueDate.toLocaleDateString()}
                        </span>
                      </div>

                      {submission && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Submitted on {submission.submittedAt.toLocaleDateString()}
                          </p>
                          {submission.textResponse && (
                            <p className="text-xs text-gray-600 mt-1">
                              Response: {submission.textResponse.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
