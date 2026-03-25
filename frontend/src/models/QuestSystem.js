export const QUEST_TYPES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    CHALLENGE: 'challenge'
  };
  
  export const QUEST_DIFFICULTIES = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
  };
  
  export class Quest {
    constructor({
      id,
      title,
      description,
      type = QUEST_TYPES.DAILY,
      difficulty = QUEST_DIFFICULTIES.EASY,
      goal,
      rewards = {},
      progress = 0,
      isCompleted = false,
      expiresAt = null
    }) {
      this.id = id;
      this.title = title;
      this.description = description;
      this.type = type;
      this.difficulty = difficulty;
      this.goal = goal;
      this.rewards = {
        points: rewards.points || 0,
        experience: rewards.experience || 0,
        items: rewards.items || []
      };
      this.progress = progress;
      this.isCompleted = isCompleted;
      this.expiresAt = expiresAt || this.calculateExpirationDate();
    }
  
    // Calculate quest expiration based on type
    calculateExpirationDate() {
      const now = new Date();
      switch (this.type) {
        case QUEST_TYPES.DAILY:
          now.setHours(23, 59, 59, 999);
          return now;
        case QUEST_TYPES.WEEKLY:
          const daysUntilEndOfWeek = 7 - now.getDay();
          now.setDate(now.getDate() + daysUntilEndOfWeek);
          now.setHours(23, 59, 59, 999);
          return now;
        case QUEST_TYPES.CHALLENGE:
          now.setDate(now.getDate() + 7);
          return now;
        default:
          return null;
      }
    }
  
    // Update quest progress
    updateProgress(amount) {
      this.progress = Math.min(this.progress + amount, this.goal);
      this.isCompleted = this.progress >= this.goal;
      return this.isCompleted;
    }
  
    // Check if quest is expired
    isExpired() {
      return this.expiresAt && new Date() > this.expiresAt;
    }
  
    // Calculate completion percentage
    getCompletionPercentage() {
      return Math.min((this.progress / this.goal) * 100, 100);
    }
  
    // Serialize quest to JSON
    toJSON() {
      return {
        id: this.id,
        title: this.title,
        description: this.description,
        type: this.type,
        difficulty: this.difficulty,
        goal: this.goal,
        rewards: this.rewards,
        progress: this.progress,
        isCompleted: this.isCompleted,
        expiresAt: this.expiresAt
      };
    }
  
    // Create quest from JSON
    static fromJSON(json) {
      return new Quest(json);
    }
  }
  
  // Quest Generation Factory
  export class QuestFactory {
    static generateDailyQuests() {
      return [
        new Quest({
          id: 'daily_solve_questions',
          title: 'Daily Problem Solver',
          description: 'Solve 5 questions today',
          type: QUEST_TYPES.DAILY,
          difficulty: QUEST_DIFFICULTIES.EASY,
          goal: 5,
          rewards: {
            points: 50,
            experience: 10
          }
        }),
        new Quest({
          id: 'daily_accuracy',
          title: 'Precision Master',
          description: 'Maintain 80% accuracy in solving questions',
          type: QUEST_TYPES.DAILY,
          difficulty: QUEST_DIFFICULTIES.MEDIUM,
          goal: 80,
          rewards: {
            points: 75,
            experience: 15
          }
        })
      ];
    }
  
    static generateWeeklyQuests() {
      return [
        new Quest({
          id: 'weekly_chapter_completion',
          title: 'Chapter Champion',
          description: 'Complete 3 chapters this week',
          type: QUEST_TYPES.WEEKLY,
          difficulty: QUEST_DIFFICULTIES.HARD,
          goal: 3,
          rewards: {
            points: 200,
            experience: 50,
            items: ['bonus_hint']
          }
        })
      ];
    }
  
    static generateChallengeQuests() {
      return [
        new Quest({
          id: 'challenge_learning_streak',
          title: 'Consistency Challenge',
          description: 'Maintain a 7-day learning streak',
          type: QUEST_TYPES.CHALLENGE,
          difficulty: QUEST_DIFFICULTIES.HARD,
          goal: 7,
          rewards: {
            points: 500,
            experience: 100,
            items: ['special_badge']
          }
        })
      ];
    }
  }