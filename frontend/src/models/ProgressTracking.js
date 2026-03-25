export class ProgressTracker {
    constructor(userId) {
      this.userId = userId;
      this.progress = {
        totalQuestionsAttempted: 0,
        correctQuestions: 0,
        completedChapters: [],
        learningStreak: 0,
        lastStudyDate: null,
        subjectProgress: {},
        conceptMastery: {}
      };
    }
  
    updateQuestionAttempt(isCorrect, subjectId, topicId) {
      this.progress.totalQuestionsAttempted++;
      
      if (isCorrect) {
        this.progress.correctQuestions++;
        
        // Update subject progress
        if (!this.progress.subjectProgress[subjectId]) {
          this.progress.subjectProgress[subjectId] = {
            questionsAttempted: 0,
            correctQuestions: 0
          };
        }
        
        const subjectProgress = this.progress.subjectProgress[subjectId];
        subjectProgress.questionsAttempted++;
        subjectProgress.correctQuestions++;
      }
    }
  
    updateChapterCompletion(subjectId, chapterId) {
      const chapterKey = `${subjectId}_${chapterId}`;
      if (!this.progress.completedChapters.includes(chapterKey)) {
        this.progress.completedChapters.push(chapterKey);
      }
    }
  
    updateLearningStreak(studyDate) {
      const today = new Date().toISOString().split('T')[0];
      const lastStudyDate = this.progress.lastStudyDate;
  
      if (!lastStudyDate || this.isDayAfter(lastStudyDate, studyDate)) {
        this.progress.learningStreak++;
      } else if (lastStudyDate !== studyDate) {
        // Reset streak if not continuous
        this.progress.learningStreak = 1;
      }
  
      this.progress.lastStudyDate = studyDate;
    }
  
    calculateAccuracy() {
      return this.progress.totalQuestionsAttempted > 0
        ? (this.progress.correctQuestions / this.progress.totalQuestionsAttempted) * 100
        : 0;
    }
  
    updateConceptMastery(conceptId, proficiencyScore) {
      this.progress.conceptMastery[conceptId] = {
        proficiencyScore,
        lastUpdated: new Date().toISOString()
      };
    }
  
    isDayAfter(dateString1, dateString2) {
      const date1 = new Date(dateString1);
      const date2 = new Date(dateString2);
      const nextDay = new Date(date1);
      nextDay.setDate(nextDay.getDate() + 1);
      
      return (
        nextDay.getFullYear() === date2.getFullYear() &&
        nextDay.getMonth() === date2.getMonth() &&
        nextDay.getDate() === date2.getDate()
      );
    }
  
    toJSON() {
      return JSON.stringify(this.progress);
    }
  
    static fromJSON(userId, jsonString) {
      const tracker = new ProgressTracker(userId);
      tracker.progress = JSON.parse(jsonString);
      return tracker;
    }
  }