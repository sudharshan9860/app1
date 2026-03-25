export const POINT_CATEGORIES = {
    QUESTION_SOLVED: 'question_solved',
    CHAPTER_COMPLETED: 'chapter_completed',
    ACCURACY_BONUS: 'accuracy_bonus',
    DAILY_STREAK: 'daily_streak',
    CHALLENGE_COMPLETED: 'challenge_completed'
  };
  
  export const POINT_RULES = {
    [POINT_CATEGORIES.QUESTION_SOLVED]: {
      basePoints: 10,
      bonusPointsForAccuracy: {
        90: 5,   // 5 bonus points for 90% accuracy
        95: 10,  // 10 bonus points for 95% accuracy
        100: 15  // 15 bonus points for 100% accuracy
      }
    },
    [POINT_CATEGORIES.CHAPTER_COMPLETED]: {
      basePoints: 50,
      bonusPointsPerChapter: 10
    },
    [POINT_CATEGORIES.ACCURACY_BONUS]: {
      pointsPerPercentage: 1
    },
    [POINT_CATEGORIES.DAILY_STREAK]: {
      dailyBasePoints: 5,
      bonusPointsPerConsecutiveWeek: 10
    },
    [POINT_CATEGORIES.CHALLENGE_COMPLETED]: {
      basePoints: 100,
      complexityCoefficent: {
        easy: 1,
        medium: 1.5,
        hard: 2
      }
    }
  };
  
  export class LeaderboardEntry {
    constructor(userId, username) {
      this.userId = userId;
      this.username = username;
      this.totalPoints = 0;
      this.pointBreakdown = {
        questionsSolved: 0,
        chaptersCompleted: 0,
        accuracyBonus: 0,
        dailyStreak: 0,
        challengesCompleted: 0
      };
      this.rank = null;
      this.badges = [];
      this.lastUpdated = new Date().toISOString();
    }
  
    calculatePointsForQuestionSolved(accuracy) {
      const { basePoints, bonusPointsForAccuracy } = POINT_RULES[POINT_CATEGORIES.QUESTION_SOLVED];
      
      let points = basePoints;
      
      // Add accuracy bonus points
      Object.entries(bonusPointsForAccuracy).forEach(([accuracyThreshold, bonusPoints]) => {
        if (accuracy >= parseFloat(accuracyThreshold)) {
          points += bonusPoints;
        }
      });
  
      this.totalPoints += points;
      this.pointBreakdown.questionsSolved += points;
      this.lastUpdated = new Date().toISOString();
  
      return points;
    }
  
    calculatePointsForChapterCompletion(chaptersCompleted) {
      const { basePoints, bonusPointsPerChapter } = POINT_RULES[POINT_CATEGORIES.CHAPTER_COMPLETED];
      
      const points = basePoints + (chaptersCompleted * bonusPointsPerChapter);
      
      this.totalPoints += points;
      this.pointBreakdown.chaptersCompleted += points;
      this.lastUpdated = new Date().toISOString();
  
      return points;
    }
  
    calculateAccuracyBonus(overallAccuracy) {
      const { pointsPerPercentage } = POINT_RULES[POINT_CATEGORIES.ACCURACY_BONUS];
      
      const points = Math.floor(overallAccuracy * pointsPerPercentage);
      
      this.totalPoints += points;
      this.pointBreakdown.accuracyBonus += points;
      this.lastUpdated = new Date().toISOString();
  
      return points;
    }
  
    calculateDailyStreakPoints(consecutiveDays) {
      const { dailyBasePoints, bonusPointsPerConsecutiveWeek } = POINT_RULES[POINT_CATEGORIES.DAILY_STREAK];
      
      let points = dailyBasePoints;
      points += Math.floor(consecutiveDays / 7) * bonusPointsPerConsecutiveWeek;
      
      this.totalPoints += points;
      this.pointBreakdown.dailyStreak += points;
      this.lastUpdated = new Date().toISOString();
  
      return points;
    }
  
    calculateChallengeCompletionPoints(challengeComplexity) {
      const { basePoints, complexityCoefficent } = POINT_RULES[POINT_CATEGORIES.CHALLENGE_COMPLETED];
      
      const points = basePoints * (complexityCoefficent[challengeComplexity] || 1);
      
      this.totalPoints += points;
      this.pointBreakdown.challengesCompleted += points;
      this.lastUpdated = new Date().toISOString();
  
      return points;
    }
  
    awardBadge(badge) {
      if (!this.badges.some(b => b.name === badge.name)) {
        this.badges.push(badge);
      }
    }
  
    toJSON() {
      return {
        userId: this.userId,
        username: this.username,
        totalPoints: this.totalPoints,
        pointBreakdown: this.pointBreakdown,
        rank: this.rank,
        badges: this.badges,
        lastUpdated: this.lastUpdated
      };
    }
  
    static fromJSON(jsonData) {
      const entry = new LeaderboardEntry(jsonData.userId, jsonData.username);
      entry.totalPoints = jsonData.totalPoints;
      entry.pointBreakdown = jsonData.pointBreakdown;
      entry.rank = jsonData.rank;
      entry.badges = jsonData.badges;
      entry.lastUpdated = jsonData.lastUpdated;
      return entry;
    }
  }
  
  export class Leaderboard {
    constructor() {
      this.entries = [];
    }
  
    addOrUpdateEntry(leaderboardEntry) {
      const existingEntryIndex = this.entries.findIndex(
        entry => entry.userId === leaderboardEntry.userId
      );
  
      if (existingEntryIndex !== -1) {
        this.entries[existingEntryIndex] = leaderboardEntry;
      } else {
        this.entries.push(leaderboardEntry);
      }
  
      this.updateRankings();
    }
  
    updateRankings() {
      // Sort entries by total points in descending order
      this.entries.sort((a, b) => b.totalPoints - a.totalPoints);
  
      // Assign ranks
      this.entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });
    }
  
    getTopEntries(limit = 10) {
      return this.entries.slice(0, limit);
    }
  
    getUserRank(userId) {
      const entry = this.entries.find(entry => entry.userId === userId);
      return entry ? entry.rank : null;
    }
  
    toJSON() {
      return JSON.stringify(this.entries.map(entry => entry.toJSON()));
    }
  
    static fromJSON(jsonString) {
      const leaderboard = new Leaderboard();
      const entries = JSON.parse(jsonString);
      leaderboard.entries = entries.map(entry => LeaderboardEntry.fromJSON(entry));
      leaderboard.updateRankings();
      return leaderboard;
    }
  }