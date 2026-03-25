export class StreakTracker {
    constructor(userId) {
      this.userId = userId;
      this.streakData = {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
        dailyStudyLog: {},
        totalStudyDays: 0
      };
    }
  
    // Update daily study log
    logStudySession(date = new Date().toISOString().split('T')[0]) {
      if (!this.streakData.dailyStudyLog[date]) {
        this.streakData.dailyStudyLog[date] = {
          date,
          studyTime: 0,
          questionsAttempted: 0,
          accuracy: 0
        };
      }
      return this.streakData.dailyStudyLog[date];
    }
  
    // Update study session details
    updateStudySession(date, studyTime, questionsAttempted, accuracy) {
      const dailyLog = this.logStudySession(date);
      
      dailyLog.studyTime += studyTime;
      dailyLog.questionsAttempted += questionsAttempted;
      dailyLog.accuracy = (dailyLog.accuracy + accuracy) / 2;
    }
  
    // Manage learning streak
    updateStreak(currentDate = new Date().toISOString().split('T')[0]) {
      const lastStudyDate = this.streakData.lastStudyDate;
  
      if (!lastStudyDate) {
        // First study day
        this.streakData.currentStreak = 1;
        this.streakData.longestStreak = 1;
        this.streakData.totalStudyDays = 1;
      } else {
        const lastDate = new Date(lastStudyDate);
        const currentDateObj = new Date(currentDate);
        const dayDifference = this.getDayDifference(lastDate, currentDateObj);
  
        if (dayDifference === 1) {
          // Consecutive day
          this.streakData.currentStreak++;
          this.streakData.longestStreak = Math.max(
            this.streakData.currentStreak, 
            this.streakData.longestStreak
          );
          this.streakData.totalStudyDays++;
        } else if (dayDifference > 1) {
          // Streak broken
          this.streakData.currentStreak = 1;
          this.streakData.totalStudyDays++;
        }
      }
  
      this.streakData.lastStudyDate = currentDate;
      return this.streakData.currentStreak;
    }
  
    // Calculate day difference
    getDayDifference(date1, date2) {
      const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
      return Math.round(Math.abs((date2 - date1) / oneDay));
    }
  
    // Get daily study statistics
    getDailyStudyStats(date = new Date().toISOString().split('T')[0]) {
      return this.streakData.dailyStudyLog[date] || null;
    }
  
    // Get weekly study summary
    getWeeklySummary(endDate = new Date()) {
      const sevenDaysAgo = new Date(endDate);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
      const weeklySummary = {
        totalStudyTime: 0,
        totalQuestionsAttempted: 0,
        averageAccuracy: 0
      };
  
      Object.values(this.streakData.dailyStudyLog).forEach(dailyLog => {
        const logDate = new Date(dailyLog.date);
        if (logDate >= sevenDaysAgo && logDate <= endDate) {
          weeklySummary.totalStudyTime += dailyLog.studyTime;
          weeklySummary.totalQuestionsAttempted += dailyLog.questionsAttempted;
          weeklySummary.averageAccuracy += dailyLog.accuracy;
        }
      });
  
      // Calculate averages
      const entriesCount = Object.keys(this.streakData.dailyStudyLog).length;
      weeklySummary.averageAccuracy = entriesCount > 0 
        ? weeklySummary.averageAccuracy / entriesCount 
        : 0;
  
      return weeklySummary;
    }
  
    // Serialize streak data
    toJSON() {
      return JSON.stringify(this.streakData);
    }
  
    // Deserialize streak data
    static fromJSON(userId, jsonString) {
      const tracker = new StreakTracker(userId);
      tracker.streakData = JSON.parse(jsonString);
      return tracker;
    }
  }