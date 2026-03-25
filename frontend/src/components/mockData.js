// mockData.js - Comprehensive mock data for Enhanced Teacher Dashboard
// Includes reference data from AI team for classwork and homework submissions

export const classesData = {
  1: {
    id: 1,
    name: "Class 6th",
    students: [
      { id: 1, name: "Arjun Patel", class: "6th", efficiency: 78 },
      { id: 2, name: "Sneha Gupta", class: "6th", efficiency: 82 },
      { id: 3, name: "Rohit Sharma", class: "6th", efficiency: 75 }
    ]
  },
  2: {
    id: 2,
    name: "Class 7th",
    students: [
      { id: 4, name: "Kavya Singh", class: "7th", efficiency: 85 },
      { id: 5, name: "Amit Kumar", class: "7th", efficiency: 79 },
      { id: 6, name: "Riya Jain", class: "7th", efficiency: 88 }
    ]
  },
  3: {
    id: 3,
    name: "Class 8th",
    students: [
      { id: 7, name: "Dev Agarwal", class: "8th", efficiency: 90 },
      { id: 8, name: "Ananya Reddy", class: "8th", efficiency: 83 },
      { id: 9, name: "Karan Mehta", class: "8th", efficiency: 77 }
    ]
  },
  4: {
    id: 4,
    name: "Class 9th",
    students: [
      { id: 10, name: "Ishita Bansal", class: "9th", efficiency: 92 },
      { id: 11, name: "Varun Kapoor", class: "9th", efficiency: 86 },
      { id: 12, name: "Pooja Nair", class: "9th", efficiency: 81 }
    ]
  },
  5: {
    id: 5,
    name: "Class 10th",
    students: [
      { id: 13, name: "Aryan Shah", class: "10th", efficiency: 89 },
      { id: 14, name: "Sakshi Tiwari", class: "10th", efficiency: 94 },
      { id: 15, name: "Harsh Yadav", class: "10th", efficiency: 76 },
      // Adding reference students from AI data
      { id: 17, name: "Student 10HPS17", class: "10th", efficiency: 50, studentId: "10HPS17" },
      { id: 18, name: "Student 10HPS18", class: "10th", efficiency: 44, studentId: "10HPS18" },
      { id: 19, name: "Student 10HPS19", class: "10th", efficiency: 67, studentId: "10HPS19" },
      { id: 20, name: "Student 10HPS20", class: "10th", efficiency: 52, studentId: "10HPS20" },
      { id: 21, name: "Student 10HPS21", class: "10th", efficiency: 69, studentId: "10HPS21" }
    ]
  },
  6: {
    id: 6,
    name: "Class 11th",
    students: [
      { id: 16, name: "Nisha Chawla", class: "11th", efficiency: 87 },
      { id: 17, name: "Siddharth Roy", class: "11th", efficiency: 91 },
      { id: 18, name: "Deepika Sinha", class: "11th", efficiency: 84 }
    ]
  },
  7: {
    id: 7,
    name: "Class 12th",
    students: [
      { id: 19, name: "Vikram Singh", class: "12th", efficiency: 88 },
      { id: 20, name: "Meera Patel", class: "12th", efficiency: 92 },
      { id: 21, name: "Sanjay Kumar", class: "12th", efficiency: 78 }
    ]
  }
};

// Progress Trends Data from existing component
export const progressTrendsData = [
  { date: 'Jun 23', hwAverage: 20, cwAverage: 35, errorHw: 8, errorCw: 15 },
  { date: 'Jun 25', hwAverage: 32, cwAverage: 42, errorHw: 10, errorCw: 12 },
  { date: 'Jun 27', hwAverage: 72, cwAverage: 58, errorHw: 8, errorCw: 18 },
  { date: 'Jun 29', hwAverage: 78, cwAverage: 55, errorHw: 5, errorCw: 15 },
  { date: 'Jul 01', hwAverage: 80, cwAverage: 55, errorHw: 6, errorCw: 20 },
  { date: 'Jul 03', hwAverage: 82, cwAverage: 62, errorHw: 8, errorCw: 18 }
];

export const topPerformersData = [
  { student: '10HPS21', average: 69.0, trend: '+5.2%' },
  { student: '10HPS19', average: 66.8, trend: '+3.1%' },
  { student: '10HPS20', average: 52.2, trend: '-1.4%' },
  { student: '10HPS18', average: 44.0, trend: '+2.8%' },
  { student: '10HPS17', average: 50.1, trend: '+1.2%' }
];

export const strugglingTopicsData = [
  { topic: 'Algebra - Linear Equations', score: 47, fullName: 'Algebra - Linear Equations', trend: 'declining' },
  { topic: 'Calculus - Derivatives', score: 52, fullName: 'Calculus - Derivatives', trend: 'stable' },
  { topic: 'Statistics', score: 56, fullName: 'Statistics', trend: 'improving' },
  { topic: 'Trigonometry', score: 57, fullName: 'Trigonometry', trend: 'stable' },
  { topic: 'Functions and Graphs', score: 57, fullName: 'Functions and Graphs', trend: 'improving' }
];

export const excellingTopicsData = [
  { topic: 'Calculus - Integration', score: 58, trend: 'improving' },
  { topic: 'Quadratic Applications', score: 59, trend: 'stable' },
  { topic: 'Probability', score: 61, trend: 'improving' },
  { topic: 'Algebra - Rational Functions', score: 64, trend: 'stable' },
  { topic: 'Coordinate Geometry', score: 71, trend: 'improving' }
];

export const topicComparisonData = [
  { topic: 'Algebra - Linear Equations', hw: 58, cw: 40, fullName: 'Algebra - Linear Equations' },
  { topic: 'Calculus - Derivatives', hw: 55, cw: 47, fullName: 'Calculus - Derivatives' },
  { topic: 'Statistics', hw: 76, cw: 47, fullName: 'Statistics' },
  { topic: 'Trigonometry', hw: 64, cw: 35, fullName: 'Trigonometry' },
  { topic: 'Functions and Graphs', hw: 95, cw: 44, fullName: 'Functions and Graphs' },
  { topic: 'Calculus - Integration', hw: 97, cw: 45, fullName: 'Calculus - Integration' },
  { topic: 'Quadratic Applications', hw: 63, cw: 55, fullName: 'Quadratic Applications' },
  { topic: 'Probability', hw: 66, cw: 47, fullName: 'Probability' },
  { topic: 'Algebra - Rational Functions', hw: 84, cw: 54, fullName: 'Algebra - Rational Functions' },
  { topic: 'Coordinate Geometry', hw: 62, cw: 84, fullName: 'Coordinate Geometry' }
];

export const topicPerformanceDistribution = [
  { topic: 'Algebra - Linear Equations', q1: 15, q3: 70, median: 45, min: 5, max: 85 },
  { topic: 'Calculus - Derivatives', q1: 40, q3: 75, median: 60, min: 0, max: 95 },
  { topic: 'Statistics', q1: 35, q3: 85, median: 65, min: 0, max: 95 },
  { topic: 'Trigonometry', q1: 50, q3: 85, median: 70, min: 25, max: 100 },
  { topic: 'Functions and Graphs', q1: 35, q3: 85, median: 60, min: 0, max: 95 }
];

export const detailedTopicStats = [
  { id: 3, topic: 'Algebra - Linear Equations', overallAvg: 46.7, hwAvg: 58.3, cwAvg: 40.8, totalQuestions: 30, stdDev: 33.17 },
  { id: 0, topic: 'Calculus - Derivatives', overallAvg: 52.2, hwAvg: 55.1, cwAvg: 47.5, totalQuestions: 40, stdDev: 22.55 },
  { id: 4, topic: 'Statistics', overallAvg: 56.4, hwAvg: 76, cwAvg: 46.7, totalQuestions: 30, stdDev: 28.1 },
  { id: 8, topic: 'Trigonometry', overallAvg: 56.9, hwAvg: 64.2, cwAvg: 35, totalQuestions: 20, stdDev: 29.97 },
  { id: 5, topic: 'Functions and Graphs', overallAvg: 57, hwAvg: 51.7, cwAvg: 62.2, totalQuestions: 30, stdDev: 24.84 },
  { id: 2, topic: 'Calculus - Integration', overallAvg: 58.1, hwAvg: 96.7, cwAvg: 45.3, totalQuestions: 20, stdDev: 36.86 },
  { id: 6, topic: 'Quadratic Applications', overallAvg: 59, hwAvg: 62.8, cwAvg: 55.1, totalQuestions: 60, stdDev: 27.65 },
  { id: 9, topic: 'Probability', overallAvg: 60.8, hwAvg: 65.6, cwAvg: 46.7, totalQuestions: 20, stdDev: 23.73 },
  { id: 7, topic: 'Algebra - Rational Functions', overallAvg: 64, hwAvg: 84, cwAvg: 54, totalQuestions: 15, stdDev: 28.47 },
  { id: 1, topic: 'Coordinate Geometry', overallAvg: 71.4, hwAvg: 62.1, cwAvg: 83.7, totalQuestions: 35, stdDev: 31.83 }
];

// Class Performance Data
export const classPerformanceData = [
  { className: '10HPS17', homeworkAverage: 12, classworkAverage: 20 },
  { className: '10HPS18', homeworkAverage: 18, classworkAverage: 18 },
  { className: '10HPS19', homeworkAverage: 28, classworkAverage: 65 }
];

export const overallStatsData = [
  { type: 'Homework', average: 19, color: '#00A0E3' },
  { type: 'Classwork', average: 30, color: '#a855f7' }
];

// Student Analysis Mock Data
export const studentScoreProgressionData = [
  { date: 'Week 1', homework: 85, classwork: 78 },
  { date: 'Week 2', homework: 88, classwork: 82 },
  { date: 'Week 3', homework: 92, classwork: 85 },
  { date: 'Week 4', homework: 87, classwork: 88 },
  { date: 'Week 5', homework: 94, classwork: 91 },
  { date: 'Week 6', homework: 89, classwork: 87 }
];

export const studentQuestionPerformanceData = [
  { question: 'Q1', correct: 85, incorrect: 15, topic: 'Algebra' },
  { question: 'Q2', correct: 92, incorrect: 8, topic: 'Geometry' },
  { question: 'Q3', correct: 78, incorrect: 22, topic: 'Calculus' },
  { question: 'Q4', correct: 88, incorrect: 12, topic: 'Statistics' },
  { question: 'Q5', correct: 95, incorrect: 5, topic: 'Trigonometry' }
];

export const studentTopicAnalysisData = [
  { topic: 'Algebra', homework: 88, classwork: 85, average: 86.5 },
  { topic: 'Geometry', homework: 92, classwork: 89, average: 90.5 },
  { topic: 'Calculus', homework: 78, classwork: 82, average: 80 },
  { topic: 'Statistics', homework: 85, classwork: 87, average: 86 },
  { topic: 'Trigonometry', homework: 91, classwork: 88, average: 89.5 }
];

export const dateWiseComparisonData = [
  { date: '2024-01-15', homework: 85, classwork: 78, difference: 7 },
  { date: '2024-01-22', homework: 88, classwork: 82, difference: 6 },
  { date: '2024-01-29', homework: 92, classwork: 85, difference: 7 },
  { date: '2024-02-05', homework: 87, classwork: 88, difference: -1 },
  { date: '2024-02-12', homework: 94, classwork: 91, difference: 3 },
  { date: '2024-02-19', homework: 89, classwork: 87, difference: 2 }
];

// REFERENCE DATA FROM AI TEAM - Detailed Classwork Submissions
export const classworkReferenceData = {
  "10HPS17": [
    {
      "submission_date": "2025-06-24",
      "classwork_id": "CW001",
      "questions": [
        {
          "question_id": "Q1",
          "question": "Find the roots of 2x² - 7x + 3 = 0 using quadratic formula",
          "topic": "Quadratic Applications",
          "total_score": 2,
          "max_score": 8,
          "answer_category": "Partially-Correct",
          "concept_required": ["Quadratic Formula", "Discriminant"],
          "comment": "Student wrote 'x = (-b ± √(b²-4ac))/2a' but made errors in substitution.",
          "correction_comment": "Formula correct but check substitution: a=2, b=-7, c=3."
        },
        {
          "question_id": "Q2",
          "question": "Solve the linear system: x + 2y = 5, 3x - y = 4",
          "topic": "Algebra - Linear Equations",
          "total_score": 1,
          "max_score": 6,
          "answer_category": "Irrelevant",
          "concept_required": ["Elimination Method", "System of Equations"],
          "comment": "Student wrote slope formula which is unrelated to solving linear systems.",
          "correction_comment": "Use elimination or substitution method for system solving."
        },
        {
          "question_id": "Q3",
          "question": "Find the derivative of f(x) = 2x³ - x² + 4",
          "topic": "Calculus - Derivatives",
          "total_score": 3,
          "max_score": 8,
          "answer_category": "Numerical Error",
          "concept_required": ["Power Rule", "Basic Differentiation"],
          "comment": "Student wrote f'(x) = 6x² - x + 0 missing coefficient 2 in middle term.",
          "correction_comment": "Check middle term: f'(x) = 6x² - 2x."
        },
        {
          "question_id": "Q4",
          "question": "Find the midpoint of A(1,3) and B(5,7)",
          "topic": "Coordinate Geometry",
          "total_score": 4,
          "max_score": 5,
          "answer_category": "Correct",
          "concept_required": ["Midpoint Formula"],
          "comment": "Perfect application of midpoint formula.",
          "correction_comment": "Perfect solution. Midpoint = (3,5)."
        },
        {
          "question_id": "Q5",
          "question": "Evaluate cos(0°) + sin(90°)",
          "topic": "Trigonometry",
          "total_score": 2,
          "max_score": 4,
          "answer_category": "Partially-Correct",
          "concept_required": ["Trigonometric Values", "Special Angles"],
          "comment": "Student wrote cos(0°) = 0 when correct value is cos(0°) = 1.",
          "correction_comment": "Check values: cos(0°) = 1, sin(90°) = 1. Total = 2."
        }
      ]
    }
  ],
  "10HPS18": [
    {
      "submission_date": "2025-06-24",
      "classwork_id": "CW001",
      "questions": [
        {
          "question_id": "Q1",
          "question": "Find the roots of 2x² - 7x + 3 = 0 using quadratic formula",
          "topic": "Quadratic Applications",
          "total_score": 0,
          "max_score": 8,
          "answer_category": "Irrelevant",
          "concept_required": ["Quadratic Formula", "Discriminant"],
          "comment": "Student wrote distance formula which is unrelated to quadratic formula.",
          "correction_comment": "Use quadratic formula: x = (-b ± √(b²-4ac))/2a"
        }
      ]
    }
  ],
  "10HPS19": [
    {
      "submission_date": "2025-06-24",
      "classwork_id": "CW001",
      "questions": [
        {
          "question_id": "Q1",
          "question": "Find the roots of 2x² - 7x + 3 = 0 using quadratic formula",
          "topic": "Quadratic Applications",
          "total_score": 5,
          "max_score": 8,
          "answer_category": "Partially-Correct",
          "concept_required": ["Quadratic Formula", "Discriminant"],
          "comment": "Good method but missed simplifying one root.",
          "correction_comment": "Excellent method. Roots: x = 3, x = 1/2."
        }
      ]
    }
  ],
  "10HPS20": [
    {
      "submission_date": "2025-06-24",
      "classwork_id": "CW001",
      "questions": [
        {
          "question_id": "Q1",
          "question": "Find the roots of 2x² - 7x + 3 = 0 using quadratic formula",
          "topic": "Quadratic Applications",
          "total_score": 1,
          "max_score": 8,
          "answer_category": "Partially-Correct",
          "concept_required": ["Quadratic Formula", "Discriminant"],
          "comment": "Formula structure known but execution errors.",
          "correction_comment": "Check substitution: a=2, b=-7, c=3."
        }
      ]
    }
  ],
  "10HPS21": [
    {
      "submission_date": "2025-06-24",
      "classwork_id": "CW001",
      "questions": [
        {
          "question_id": "Q1",
          "question": "Find the roots of 2x² - 7x + 3 = 0 using quadratic formula",
          "topic": "Quadratic Applications",
          "total_score": 3,
          "max_score": 8,
          "answer_category": "Partially-Correct",
          "concept_required": ["Quadratic Formula", "Discriminant"],
          "comment": "Good understanding but small error in final roots.",
          "correction_comment": "Excellent method. Roots: x = 3, x = 1/2."
        }
      ]
    }
  ]
};

// REFERENCE DATA FROM AI TEAM - Detailed Homework Submissions
export const homeworkReferenceData = {
  "10HPS21": [
    {
      "submission_date": "2025-06-23",
      "homework_id": "HW001",
      "questions": [
        {
          "question_id": "Q1",
          "question": "Find the shortest distance of the point (0,1) from the parabola y = x² where 1/2 ≤ c ≤ 5.",
          "topic": "Quadratic Applications",
          "total_score": 3,
          "max_score": 10,
          "answer_category": "Partially-Correct",
          "concept_required": ["Minimization", "Distance from a Curve"],
          "comment": "Good start with distance formula but needs calculus for minimization.",
          "correction_comment": "Need to minimize D = √[x² + (x²-1)²] using calculus."
        },
        {
          "question_id": "Q2",
          "question": "Find the derivative of f(x) = 3x³ + 2x² - 5x + 1",
          "topic": "Calculus - Derivatives",
          "total_score": 4,
          "max_score": 8,
          "answer_category": "Partially-Correct",
          "concept_required": ["Power Rule", "Basic Differentiation"],
          "comment": "Good power rule application with minor constant handling unclear.",
          "correction_comment": "Final answer: f'(x) = 9x² + 4x - 5."
        }
      ]
    }
  ],
  "10HPS17": [
    {
      "submission_date": "2025-06-23",
      "homework_id": "HW001",
      "questions": [
        {
          "question_id": "Q1",
          "question": "Find the shortest distance of the point (0,1) from the parabola y = x² where 1/2 ≤ c ≤ 5.",
          "topic": "Quadratic Applications",
          "total_score": 0,
          "max_score": 10,
          "answer_category": "Irrelevant",
          "concept_required": ["Minimization", "Distance from a Curve"],
          "comment": "Used irrelevant distance formula without understanding minimization.",
          "correction_comment": "Apply minimization of distance function using calculus."
        }
      ]
    }
  ]
};

// Time filter options
export const TIME_FILTERS = {
  '1D': { label: '1D', days: 1 },
  '5D': { label: '5D', days: 5 },
  '10D': { label: '10D', days: 10 },
  '15D': { label: '15D', days: 15 },
  '1M': { label: '1M', days: 30 },
  'MAX': { label: 'MAX', days: 90 }
};

// Generate realistic trend data based on time periods
export const generateTrendData = (days) => {
  const now = new Date();
  const data = [];
  const baseHwAvg = 62;
  const baseCwAvg = 51;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const variation = Math.sin(i / 3) * 8 + Math.random() * 6 - 3;
    const hwVariation = Math.sin(i / 4) * 6 + Math.random() * 4 - 2;
    
    data.push({
      date: date.toISOString().split('T')[0],
      displayDate: formatDateForDisplay(date, days),
      hwAverage: Math.max(20, Math.min(95, baseHwAvg + variation + hwVariation)),
      cwAverage: Math.max(15, Math.min(90, baseCwAvg + variation)),
      errorHw: Math.max(2, Math.min(15, 8 + Math.random() * 4 - 2)),
      errorCw: Math.max(5, Math.min(25, 15 + Math.random() * 6 - 3)),
      tasksCompleted: Math.floor(40 + Math.random() * 20),
      avgTime: 1.5 + Math.random() * 1.2
    });
  }
  
  return data;
};

const formatDateForDisplay = (date, totalDays) => {
  if (totalDays <= 10) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (totalDays <= 30) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
};

// Helper function to generate basic student data (for students without reference data)
export const generateStudentData = (studentName, classId) => {
  const baseEfficiency = Math.floor(Math.random() * 30) + 60;
  
  return {
    weeklyEfficiency: [
      { week: 'May 01 - May 01', efficiency: baseEfficiency - 5 + Math.random() * 10 },
      { week: 'May 08 - May 08', efficiency: baseEfficiency - 3 + Math.random() * 10 },
      { week: 'May 15 - May 15', efficiency: baseEfficiency + Math.random() * 10 },
      { week: 'May 22 - May 22', efficiency: baseEfficiency - 2 + Math.random() * 10 },
      { week: 'May 29 - May 29', efficiency: baseEfficiency + 2 + Math.random() * 8 }
    ],
    errorAnalysis: [
      { week: 'May 01 - May 01', Conceptual: 80, Computational: 15, Careless: 5, 'No Error': 20 },
      { week: 'May 08 - May 08', Conceptual: 75, Computational: 18, Careless: 7, 'No Error': 25 },
      { week: 'May 15 - May 15', Conceptual: 60, Computational: 20, Careless: 5, 'No Error': 40 },
      { week: 'May 22 - May 22', Conceptual: 85, Computational: 10, Careless: 5, 'No Error': 18 },
      { week: 'May 29 - May 29', Conceptual: 70, Computational: 15, Careless: 8, 'No Error': 38 }
    ],
    chapterPerformance: [
      { week: 'Week 1', 'Chapter 1': 90, 'Chapter 2': 67, 'Chapter 3': 70, 'Chapter 4': 85, 'Chapter 5': 88, 'Chapter 6': 93, 'Chapter 7': 80, 'Chapter 8': 75, 'Chapter 9': 70, overallAverage: 78 },
      { week: 'Week 2', 'Chapter 1': 92, 'Chapter 2': 70, 'Chapter 3': 72, 'Chapter 4': 87, 'Chapter 5': 90, 'Chapter 6': 95, 'Chapter 7': 82, 'Chapter 8': 77, 'Chapter 9': 72, overallAverage: 80 },
      { week: 'Week 3', 'Chapter 1': 94, 'Chapter 2': 68, 'Chapter 3': 74, 'Chapter 4': 89, 'Chapter 5': 92, 'Chapter 6': 96, 'Chapter 7': 84, 'Chapter 8': 79, 'Chapter 9': 74, overallAverage: 82 },
      { week: 'Week 4', 'Chapter 1': 96, 'Chapter 2': 65, 'Chapter 3': 76, 'Chapter 4': 91, 'Chapter 5': 94, 'Chapter 6': 98, 'Chapter 7': 86, 'Chapter 8': 81, 'Chapter 9': 76, overallAverage: 84 },
      { week: 'Week 5', 'Chapter 1': 98, 'Chapter 2': 62, 'Chapter 3': 78, 'Chapter 4': 93, 'Chapter 5': 96, 'Chapter 6': 100, 'Chapter 7': 88, 'Chapter 8': 83, 'Chapter 9': 78, overallAverage: 86 }
    ]
  };
};

// HELPER FUNCTIONS FOR REFERENCE DATA

// Get student classwork data from reference
export const getStudentClassworkData = (studentId) => {
  return classworkReferenceData[studentId] || [];
};

// Get student homework data from reference
export const getStudentHomeworkData = (studentId) => {
  return homeworkReferenceData[studentId] || [];
};

// Get combined student data from reference
export const getStudentCombinedData = (studentId) => {
  const classwork = getStudentClassworkData(studentId);
  const homework = getStudentHomeworkData(studentId);
  
  return {
    classwork,
    homework,
    combined: [...classwork, ...homework].sort((a, b) => 
      new Date(a.submission_date) - new Date(b.submission_date)
    )
  };
};

// Calculate topic performance from reference data
export const calculateStudentTopicPerformance = (studentId) => {
  const data = getStudentCombinedData(studentId);
  const topicPerformance = {};
  
  [...data.classwork, ...data.homework].forEach(submission => {
    submission.questions.forEach(question => {
      if (!topicPerformance[question.topic]) {
        topicPerformance[question.topic] = {
          totalScore: 0,
          maxScore: 0,
          questionCount: 0,
          scores: []
        };
      }
      
      topicPerformance[question.topic].totalScore += question.total_score;
      topicPerformance[question.topic].maxScore += question.max_score;
      topicPerformance[question.topic].questionCount += 1;
      topicPerformance[question.topic].scores.push({
        score: question.total_score,
        maxScore: question.max_score,
        percentage: (question.total_score / question.max_score) * 100,
        date: submission.submission_date,
        type: submission.classwork_id ? 'classwork' : 'homework',
        questionId: question.question_id,
        category: question.answer_category
      });
    });
  });
  
  // Convert to percentage and add trend analysis
  Object.keys(topicPerformance).forEach(topic => {
    const data = topicPerformance[topic];
    topicPerformance[topic].percentage = ((data.totalScore / data.maxScore) * 100).toFixed(1);
    
    // Calculate trend (improvement over time)
    const scores = data.scores.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (scores.length > 1) {
      const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, s) => sum + s.percentage, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, s) => sum + s.percentage, 0) / secondHalf.length;
      
      topicPerformance[topic].trend = secondAvg - firstAvg;
      topicPerformance[topic].trendDirection = secondAvg > firstAvg ? 'improving' : 'declining';
    }
    
    // Calculate homework vs classwork split
    const hwScores = data.scores.filter(s => s.type === 'homework');
    const cwScores = data.scores.filter(s => s.type === 'classwork');
    
    if (hwScores.length > 0) {
      topicPerformance[topic].hwAverage = (hwScores.reduce((sum, s) => sum + s.percentage, 0) / hwScores.length).toFixed(1);
    }
    if (cwScores.length > 0) {
      topicPerformance[topic].cwAverage = (cwScores.reduce((sum, s) => sum + s.percentage, 0) / cwScores.length).toFixed(1);
    }
  });
  
  return topicPerformance;
};

// Get class performance overview from reference data
export const getClassPerformanceOverview = () => {
  const students = ['10HPS17', '10HPS18', '10HPS19', '10HPS20', '10HPS21'];
  const overview = {};
  
  students.forEach(studentId => {
    const topicPerformance = calculateStudentTopicPerformance(studentId);
    const data = getStudentCombinedData(studentId);
    
    // Calculate overall student stats
    let totalScore = 0;
    let totalMaxScore = 0;
    let hwScore = 0;
    let hwMaxScore = 0;
    let cwScore = 0;
    let cwMaxScore = 0;
    
    [...data.classwork, ...data.homework].forEach(submission => {
      submission.questions.forEach(question => {
        totalScore += question.total_score;
        totalMaxScore += question.max_score;
        
        if (submission.classwork_id) {
          cwScore += question.total_score;
          cwMaxScore += question.max_score;
        } else {
          hwScore += question.total_score;
          hwMaxScore += question.max_score;
        }
      });
    });
    
    overview[studentId] = {
      topicPerformance,
      overallPercentage: totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 100).toFixed(1) : 0,
      hwPercentage: hwMaxScore > 0 ? ((hwScore / hwMaxScore) * 100).toFixed(1) : 0,
      cwPercentage: cwMaxScore > 0 ? ((cwScore / cwMaxScore) * 100).toFixed(1) : 0,
      totalSubmissions: data.combined.length,
      totalQuestions: [...data.classwork, ...data.homework].reduce((sum, sub) => sum + sub.questions.length, 0)
    };
  });
  
  return overview;
};

// Generate chart data from reference data
export const generateChartDataFromReference = (studentId, chartType = 'progression') => {
  const data = getStudentCombinedData(studentId);
  
  switch (chartType) {
    case 'progression':
      // Generate score progression over time
      const progressionData = [];
      data.combined.forEach(submission => {
        const totalScore = submission.questions.reduce((sum, q) => sum + q.total_score, 0);
        const maxScore = submission.questions.reduce((sum, q) => sum + q.max_score, 0);
        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        
        progressionData.push({
          date: submission.submission_date,
          type: submission.classwork_id ? 'classwork' : 'homework',
          percentage: percentage.toFixed(1),
          score: totalScore,
          maxScore: maxScore
        });
      });
      return progressionData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
    case 'topicAnalysis':
      // Generate topic-wise performance
      const topicPerformance = calculateStudentTopicPerformance(studentId);
      return Object.keys(topicPerformance).map(topic => ({
        topic,
        percentage: parseFloat(topicPerformance[topic].percentage),
        hwAverage: parseFloat(topicPerformance[topic].hwAverage || 0),
        cwAverage: parseFloat(topicPerformance[topic].cwAverage || 0),
        questionCount: topicPerformance[topic].questionCount,
        trend: topicPerformance[topic].trendDirection || 'stable'
      }));
      
    case 'questionPerformance':
      // Generate question-wise performance
      const questionData = [];
      data.combined.forEach(submission => {
        submission.questions.forEach(question => {
          questionData.push({
            questionId: question.question_id,
            topic: question.topic,
            score: question.total_score,
            maxScore: question.max_score,
            percentage: (question.total_score / question.max_score) * 100,
            category: question.answer_category,
            date: submission.submission_date,
            type: submission.classwork_id ? 'classwork' : 'homework'
          });
        });
      });
      return questionData;
      
    default:
      return [];
  }
};

// Check if student has reference data
export const hasReferenceData = (studentId) => {
  return !!(classworkReferenceData[studentId] || homeworkReferenceData[studentId]);
};

// Get all students with reference data
export const getStudentsWithReferenceData = () => {
  const classworkStudents = Object.keys(classworkReferenceData);
  const homeworkStudents = Object.keys(homeworkReferenceData);
  return [...new Set([...classworkStudents, ...homeworkStudents])];
};