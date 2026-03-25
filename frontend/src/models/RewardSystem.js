export const REWARD_CATEGORIES = {
    STREAK: 'streak',
    ACCURACY: 'accuracy',
    QUESTIONS_SOLVED: 'questions_solved',
    CHAPTER_COMPLETION: 'chapter_completion'
  };
  
  export class RewardSystem {
    constructor(userId) {
      this.userId = userId;
      this.rewards = {
        points: 0,
        badges: [],
        unlockedRewards: [],
        rewardHistory: []
      };
      this.rewardTiers = {
        [REWARD_CATEGORIES.STREAK]: [
          { days: 7, points: 50, badge: 'Weekly Warrior', type: 'bronze' },
          { days: 30, points: 250, badge: 'Month Master', type: 'silver' },
          { days: 90, points: 750, badge: 'Consistency Champion', type: 'gold' }
        ],
        [REWARD_CATEGORIES.ACCURACY]: [
          { accuracy: 70, points: 100, badge: 'Sharp Mind', type: 'bronze' },
          { accuracy: 85, points: 250, badge: 'Precision Pro', type: 'silver' },
          { accuracy: 95, points: 500, badge: 'Accuracy Ace', type: 'gold' }
        ],
        [REWARD_CATEGORIES.QUESTIONS_SOLVED]: [
          { questions: 50, points: 100, badge: 'Problem Solver', type: 'bronze' },
          { questions: 200, points: 500, badge: 'Question King', type: 'silver' },
          { questions: 500, points: 1000, badge: 'Knowledge Master', type: 'gold' }
        ],
        [REWARD_CATEGORIES.CHAPTER_COMPLETION]: [
          { chapters: 3, points: 75, badge: 'Chapter Explorer', type: 'bronze' },
          { chapters: 10, points: 250, badge: 'Knowledge Navigator', type: 'silver' },
          { chapters: 25, points: 750, badge: 'Curriculum Conqueror', type: 'gold' }
        ]
      };
    }
  
    // Add points to user's reward balance
    addPoints(points) {
      this.rewards.points += points;
      return this.rewards.points;
    }
  
    // Check and award streak-based rewards
    checkStreakRewards(currentStreak) {
      return this.checkRewardTiers(REWARD_CATEGORIES.STREAK, currentStreak, 'days');
    }
  
    // Check and award accuracy-based rewards
    checkAccuracyRewards(accuracy) {
      return this.checkRewardTiers(REWARD_CATEGORIES.ACCURACY, accuracy, 'accuracy');
    }
  
    // Check and award questions solved rewards
    checkQuestionsSolvedRewards(questionsSolved) {
      return this.checkRewardTiers(REWARD_CATEGORIES.QUESTIONS_SOLVED, questionsSolved, 'questions');
    }
  
    // Check and award chapter completion rewards
    checkChapterCompletionRewards(chaptersCompleted) {
      return this.checkRewardTiers(REWARD_CATEGORIES.CHAPTER_COMPLETION, chaptersCompleted, 'chapters');
    }
  
    // Generic method to check reward tiers
    checkRewardTiers(category, currentValue, valueKey) {
      const categoryTiers = this.rewardTiers[category];
      const unlockedRewards = [];
  
      categoryTiers.forEach(tier => {
        // Check if this tier hasn't been unlocked before and meets the criteria
        if (
          currentValue >= tier[valueKey] && 
          !this.rewards.unlockedRewards.includes(tier.badge)
        ) {
          // Add points
          this.addPoints(tier.points);
  
          // Add badge
          this.rewards.badges.push({
            name: tier.badge,
            type: tier.type,
            category: category
          });
  
          // Track unlocked rewards
          this.rewards.unlockedRewards.push(tier.badge);
  
          // Add to reward history
          this.rewards.rewardHistory.push({
            type: 'badge',
            name: tier.badge,
            points: tier.points,
            date: new Date().toISOString()
          });
  
          unlockedRewards.push(tier);
        }
      });
  
      return unlockedRewards;
    }
  
    // Redeem points for rewards
    redeemReward(rewardOption) {
      // Example reward redemption logic
      const availableRewards = [
        { name: 'Extra Practice Session', cost: 100 },
        { name: 'Hint Token', cost: 50 },
        { name: 'Bonus Question', cost: 75 }
      ];
  
      const selectedReward = availableRewards.find(r => r.name === rewardOption);
  
      if (!selectedReward) {
        throw new Error('Invalid reward');
      }
  
      if (this.rewards.points < selectedReward.cost) {
        throw new Error('Insufficient points');
      }
  
      // Deduct points
      this.rewards.points -= selectedReward.cost;
  
      // Record redemption
      this.rewards.rewardHistory.push({
        type: 'redemption',
        name: selectedReward.name,
        pointsSpent: selectedReward.cost,
        date: new Date().toISOString()
      });
  
      return selectedReward;
    }
  
    // Serialize rewards data
    toJSON() {
      return JSON.stringify(this.rewards);
    }
  
    // Deserialize rewards data
    static fromJSON(userId, jsonString) {
      const rewardSystem = new RewardSystem(userId);
      rewardSystem.rewards = JSON.parse(jsonString);
      return rewardSystem;
    }
  }