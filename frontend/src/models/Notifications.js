export const NOTIFICATION_TYPES = {
  ACHIEVEMENT: 'achievement',
  PROGRESS: 'progress',
  RECOMMENDATION: 'recommendation',
  REMINDER: 'reminder'
};

export class NotificationManager {
  constructor(userId) {
    this.userId = userId;
    this.notifications = [];
    this.maxNotifications = 20;
  }

  addAchievementNotification(achievement) {
    const notification = {
      id: `achievement_${Date.now()}`,
      type: NOTIFICATION_TYPES.ACHIEVEMENT,
      title: `Achievement Unlocked: ${achievement.level} ${achievement.type}`,
      message: `Congratulations! You've earned the ${achievement.reward?.badge || 'new'} badge.`,
      timestamp: new Date().toISOString(),
      icon: this.getIconForAchievement(achievement),
      read: false
    };

    this.pushNotification(notification);
    return notification;
  }

  addProgressNotification(progressType, details) {
    const notificationTemplates = {
      streak: {
        title: 'Learning Streak',
        message: `You've maintained a ${details.days}-day learning streak!`
      },
      chapter_completion: {
        title: 'Chapter Completed',
        message: `Congratulations on completing ${details.chapterName}!`
      },
      accuracy_improvement: {
        title: 'Accuracy Improvement',
        message: `Your accuracy has improved to ${details.accuracy}%`
      }
    };

    const template = notificationTemplates[progressType] || {
      title: 'Progress Update',
      message: 'You\'ve made progress in your learning journey!'
    };

    const notification = {
      id: `progress_${Date.now()}`,
      type: NOTIFICATION_TYPES.PROGRESS,
      ...template,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.pushNotification(notification);
    return notification;
  }

  addRecommendationNotification(recommendation) {
    const notification = {
      id: `recommendation_${Date.now()}`,
      type: NOTIFICATION_TYPES.RECOMMENDATION,
      title: 'Recommended for You',
      message: recommendation,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.pushNotification(notification);
    return notification;
  }

  addReminderNotification(reminderType, details) {
    const notificationTemplates = {
      incomplete_chapter: {
        title: 'Incomplete Chapter',
        message: `You haven't completed ${details.chapterName || 'this chapter'} yet. Want to continue?`
      },
      low_accuracy: {
        title: 'Accuracy Alert',
        message: `Your accuracy in ${details.subject || 'this subject'} is below 60%. Practice more!`
      }
    };

    const template = notificationTemplates[reminderType] || {
      title: 'Reminder',
      message: 'You have pending learning tasks.'
    };

    const notification = {
      id: `reminder_${Date.now()}`,
      type: NOTIFICATION_TYPES.REMINDER,
      ...template,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.pushNotification(notification);
    return notification;
  }

  pushNotification(notification) {
    // Remove oldest notification if max limit reached
    if (this.notifications.length >= this.maxNotifications) {
      this.notifications.shift();
    }

    this.notifications.unshift(notification);
  }

  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  clearNotifications() {
    this.notifications = [];
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  getIconForAchievement(achievement) {
    const iconMap = {
      question_solved: '🏆',
      chapter_completed: '📚',
      learning_streak: '🔥',
      accuracy_milestone: '🎯'
    };
    return iconMap[achievement?.type] || '🌟';
  }
}