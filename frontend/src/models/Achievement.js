export const ACHIEVEMENT_TYPES = {
    QUESTION_SOLVED: 'question_solved',
    CHAPTER_COMPLETED: 'chapter_completed',
    STREAK: 'learning_streak',
    ACCURACY: 'accuracy_milestone',
    CONCEPT_MASTERY: 'concept_mastery'
  };
  
  export const ACHIEVEMENT_LEVELS = {
    BRONZE: 'bronze',
    SILVER: 'silver',
    GOLD: 'gold',
    PLATINUM: 'platinum'
  };
  
  export class Achievement {
    constructor(type, level, criteria, reward) {
      this.id = `${type}_${level}`;
      this.type = type;
      this.level = level;
      this.criteria = criteria;
      this.reward = reward;
      this.unlocked = false;
      this.progress = 0;
    }
  
    checkProgress(currentValue) {
      this.progress = Math.min(
        (currentValue / this.criteria.target) * 100, 
        100
      );
      this.unlocked = currentValue >= this.criteria.target;
      return this.unlocked;
    }
  }
  
  export const DEFAULT_ACHIEVEMENTS = [
    // Question Solved Achievements
    new Achievement(
      ACHIEVEMENT_TYPES.QUESTION_SOLVED, 
      ACHIEVEMENT_LEVELS.BRONZE, 
      { target: 10 }, 
      { points: 50, badge: 'first_steps' }
    ),
    new Achievement(
      ACHIEVEMENT_TYPES.QUESTION_SOLVED, 
      ACHIEVEMENT_LEVELS.SILVER, 
      { target: 50 }, 
      { points: 250, badge: 'problem_solver' }
    ),
    
    // Chapter Completion Achievements
    new Achievement(
      ACHIEVEMENT_TYPES.CHAPTER_COMPLETED, 
      ACHIEVEMENT_LEVELS.BRONZE, 
      { target: 3 }, 
      { points: 100, badge: 'chapter_explorer' }
    ),
    
    // Learning Streak Achievements
    new Achievement(
      ACHIEVEMENT_TYPES.STREAK, 
      ACHIEVEMENT_LEVELS.BRONZE, 
      { target: 7 }, 
      { points: 75, badge: 'consistent_learner' }
    ),
    
    // Accuracy Milestones
    new Achievement(
      ACHIEVEMENT_TYPES.ACCURACY, 
      ACHIEVEMENT_LEVELS.BRONZE, 
      { target: 70 }, 
      { points: 100, badge: 'accurate_mind' }
    )
  ];