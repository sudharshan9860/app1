import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine
} from 'recharts';

// Define all students data by class
const STUDENTS_BY_CLASS = {
  '6th': [
    { id: '6HPS17', name: 'Ram', rollNo: '6HPS17', class: '6th', baseEfficiency: 78 },
    { id: '6HPS18', name: 'Bhem', rollNo: '6HPS18', class: '6th', baseEfficiency: 82 },
    { id: '6HPS19', name: 'Shubam', rollNo: '6HPS19', class: '6th', baseEfficiency: 75 }
  ],
  '7th': [
    { id: '7HPS17', name: 'Vasu', rollNo: '7HPS17', class: '7th', baseEfficiency: 85 },
    { id: '7HPS18', name: 'Bhanu', rollNo: '7HPS18', class: '7th', baseEfficiency: 72 },
    { id: '7HPS19', name: 'Sreenu', rollNo: '7HPS19', class: '7th', baseEfficiency: 89 }
  ],
  '8th': [
    { id: '8HPS17', name: 'Gupta', rollNo: '8HPS17', class: '8th', baseEfficiency: 91 },
    { id: '8HPS18', name: 'Pranja', rollNo: '8HPS18', class: '8th', baseEfficiency: 68 },
    { id: '8HPS19', name: 'Srenija', rollNo: '8HPS19', class: '8th', baseEfficiency: 84 }
  ],
  '9th': [
    { id: '9HPS17', name: 'Viswa', rollNo: '9HPS17', class: '9th', baseEfficiency: 76 },
    { id: '9HPS18', name: 'Sana', rollNo: '9HPS18', class: '9th', baseEfficiency: 88 },
    { id: '9HPS19', name: 'Yaseen', rollNo: '9HPS19', class: '9th', baseEfficiency: 79 }
  ],
  '10th': [
    { id: '10HPS17', name: 'Pushpa', rollNo: '10HPS17', class: '10th', baseEfficiency: 93 },
    { id: '10HPS18', name: 'Arya', rollNo: '10HPS18', class: '10th', baseEfficiency: 87 },
    { id: '10HPS19', name: 'Bunny', rollNo: '10HPS19', class: '10th', baseEfficiency: 71 }
  ],
  '11th': [
    { id: '11HPS17', name: 'Virat', rollNo: '11HPS17', class: '11th', baseEfficiency: 95 },
    { id: '11HPS18', name: 'Rohit', rollNo: '11HPS18', class: '11th', baseEfficiency: 92 },
    { id: '11HPS19', name: 'Dhoni', rollNo: '11HPS19', class: '11th', baseEfficiency: 98 }
  ],
  '12th': [
    { id: '12HPS17', name: 'Udham', rollNo: '12HPS17', class: '12th', baseEfficiency: 86 },
    { id: '12HPS18', name: 'Mamatha', rollNo: '12HPS18', class: '12th', baseEfficiency: 90 },
    { id: '12HPS19', name: 'Vikram', rollNo: '12HPS19', class: '12th', baseEfficiency: 83 }
  ]
};

// Generate unique data based on student ID
const generateStudentData = (studentId, timeFilter = '1M') => {
  if (!studentId) return null;

  // Use student ID to generate consistent but unique data
  const seed = studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomFactor = (seed % 20) / 100; // 0-0.2 variation

  // Generate date ranges based on filter
  const getDates = () => {
    const today = new Date();
    const dates = [];
    let days = 30; // default 1M

    switch(timeFilter) {
      case '1D': days = 1; break;
      case '5D': days = 5; break;
      case '10D': days = 10; break;
      case '15D': days = 15; break;
      case '1M': days = 30; break;
      case 'Max': days = 90; break;
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates;
  };

  const dates = getDates();

  // Generate homework/classwork data with student-specific patterns
  const generateScores = (base, isHomework) => {
    return dates.map((date, index) => {
      const trend = index / dates.length; // 0 to 1 progress
      const improvement = isHomework ? trend * 20 : trend * 15;
      const variance = Math.sin(index * randomFactor) * 10;
      const score = Math.max(10, Math.min(100, base + improvement + variance));
      return Math.round(score);
    });
  };

  const baseHomework = 50 + (seed % 30);
  const baseClasswork = 40 + (seed % 25);

  const homeworkScores = generateScores(baseHomework, true);
  const classworkScores = generateScores(baseClasswork, false);

  return {
    dateWiseComparison: dates.map((date, i) => ({
      date,
      homework: homeworkScores[i],
      classwork: classworkScores[i]
    })),

    topicPerformance: [
      { topic: 'Calculus - Integration', homework: 75 + (seed % 25), classwork: 60 + (seed % 30) },
      { topic: 'Algebra - Linear Equations', homework: 80 + (seed % 20), classwork: 70 + (seed % 25) },
      { topic: 'Statistics', homework: 78 + (seed % 22), classwork: 65 + (seed % 30) },
      { topic: 'Algebra - Rational Functions', homework: 72 + (seed % 28), classwork: 62 + (seed % 28) },
      { topic: 'Probability', homework: 68 + (seed % 32), classwork: 55 + (seed % 35) },
      { topic: 'Trigonometry', homework: 85 + (seed % 15), classwork: 75 + (seed % 20) },
      { topic: 'Quadratic Applications', homework: 70 + (seed % 30), classwork: 60 + (seed % 30) },
      { topic: 'Calculus - Derivatives', homework: 65 + (seed % 35), classwork: 58 + (seed % 32) },
      { topic: 'Functions and Graphs', homework: 60 + (seed % 40), classwork: 50 + (seed % 40) },
      { topic: 'Coordinate Geometry', homework: 82 + (seed % 18), classwork: 72 + (seed % 25) }
    ].map(item => ({
      ...item,
      homework: Math.min(100, Math.round(item.homework)),
      classwork: Math.min(100, Math.round(item.classwork))
    })),

    answerCategories: [
      { name: 'Correct', value: 35 + (seed % 20), color: '#22c55e' },
      { name: 'Partially-Correct', value: 10 + (seed % 10), color: '#f59e0b' },
      { name: 'Numerical Error', value: 15 + (seed % 10), color: '#ef4444' },
      { name: 'Irrelevant', value: 20 + (seed % 15), color: '#00A0E3' },
      { name: 'Unattempted', value: 20 - (seed % 15), color: '#6b7280' }
    ].map(item => ({
      ...item,
      value: Math.max(5, item.value),
      count: Math.round(item.value * 0.3)
    })),

    mistakeAnalysis: generateMistakeAnalysisData(studentId, dates.length),

    priorityChapters: [
      {
        chapter: 'Calculus - Integration',
        performance: `${Math.round(20 + (seed % 30))}%`,
        weightage: '15%',
        priority: 'High',
        priorityColor: '#fee2e2'
      },
      {
        chapter: 'Quadratic Applications',
        performance: `${Math.round(35 + (seed % 25))}%`,
        weightage: '12%',
        priority: 'Medium',
        priorityColor: '#fef3c7'
      },
      {
        chapter: 'Trigonometry',
        performance: `${Math.round(70 + (seed % 20))}%`,
        weightage: '10%',
        priority: 'Maintain',
        priorityColor: '#d1fae5'
      }
    ],

    summaryStats: {
      overallPerformance: Math.round(((baseHomework + baseClasswork) / 2) + (dates.length / 10)),
      homeworkAverage: Math.round(homeworkScores.reduce((a, b) => a + b) / homeworkScores.length),
      classworkAverage: Math.round(classworkScores.reduce((a, b) => a + b) / classworkScores.length),
      improvementRate: Math.round(10 + (seed % 15)),
      totalAssessments: dates.length,
      chaptersAnalyzed: 10,
      questionsAttempted: dates.length * 5,
      overallAccuracy: Math.round(40 + (seed % 30))
    }
  };
};

// Generate mistake analysis data specific to each student
const generateMistakeAnalysisData = (studentId, dateCount) => {
  const seed = studentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const chapters = [
    'Quadratic Applications', 'Algebra - Linear Equations', 'Trigonometry',
    'Calculus - Integration', 'Coordinate Geometry', 'Statistics', 'Probability'
  ];

  const statuses = ['IRRELEVANT', 'NO ATTEMPT', 'NUMERICAL ERROR', 'CONCEPTUAL ERROR', 'VALUE ERROR', 'CORRECT', 'PARTIAL'];
  const mistakes = ['Irrelevant formula application', 'Fig = 5', '5y = 6', 'Area = \u00BD \u00D7 base \u00D7 height', 'cos(60\u00B0) = 0.5', 'Calculation error', 'Minor oversight'];

  const questions = [];
  for (let i = 0; i < Math.min(dateCount * 2, 20); i++) {
    const chapterIndex = (seed + i) % chapters.length;
    const performance = Math.max(0, Math.min(100, 30 + (seed % 50) + i * 2));
    const statusIndex = Math.floor((performance / 100) * statuses.length);

    questions.push({
      id: `Q${i + 1}`,
      chapter: chapters[chapterIndex],
      date: new Date(Date.now() - (dateCount - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      question: `Find the ${['shortest distance', 'vertex of parabola', 'system solution', 'equation of line', 'trigonometric value'][i % 5]}...`,
      myScore: `${Math.round(performance / 5)}/20`,
      performance: `${performance.toFixed(1)}%`,
      mistakeTracker: 'First submission, no prior mistakes',
      currentStatus: statuses[Math.min(statusIndex, statuses.length - 1)],
      studentMistake: mistakes[i % mistakes.length],
      correctApproach: 'Minimize the distance function using calculus'
    });
  }

  return questions;
};

const getStatusBadgeClasses = (status) => {
  const s = status.toLowerCase().replace(/\s+/g, '-');
  const map = {
    'irrelevant': 'bg-blue-100 text-blue-700',
    'no-attempt': 'bg-gray-100 text-gray-700',
    'numerical-error': 'bg-red-100 text-red-700',
    'conceptual-error': 'bg-red-100 text-red-700',
    'value-error': 'bg-amber-100 text-amber-700',
    'correct': 'bg-green-100 text-green-700',
    'partial': 'bg-amber-100 text-amber-700',
  };
  return map[s] || 'bg-gray-100 text-gray-700';
};

const StudentAnalysis = ({
  selectedClass,
  selectedStudent,
  onStudentSelect,
  classesData,
  onClassChange,
  isStudentView = false,
  readOnly = false  // Add readOnly prop
}) => {
    // Main tab state
  const [studentAnalysisMainTab, setStudentAnalysisMainTab] = useState('score-progression');

  // View states for interactive charts
  const [scoreDateView, setScoreDateView] = useState('combined');
  const [chapterView, setChapterView] = useState('combined');

  // Summary tab filters
  const [summaryFilter, setSummaryFilter] = useState('all');

  // Mistake Analysis states
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('All Chapters');
  const [selectedPerformanceFilter, setSelectedPerformanceFilter] = useState('All Percentages');

  // Animation states
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Time filter state
  const [timeFilter, setTimeFilter] = useState('1M');

  // Current student data
  const [currentStudentData, setCurrentStudentData] = useState(null);

  // Function to get students for selected class
  const getStudentsForClass = () => {
    const className = selectedClass?.name || 'Class 6th';
    const classGrade = className.replace('Class ', '').trim();
    return STUDENTS_BY_CLASS[classGrade] || STUDENTS_BY_CLASS['6th'];
  };

  // Disable class/student changes if in student view or readOnly
  const handleClassChange = (classId) => {
    if (!isStudentView && !readOnly && onClassChange) {
      onClassChange(classId);
    }
  };

  const handleStudentSelect = (student) => {
    if (!isStudentView && !readOnly && onStudentSelect) {
      onStudentSelect(student);
    }
  };

  // Update data when student or time filter changes
  useEffect(() => {
    if (selectedStudent) {
      const studentId = selectedStudent.rollNo || selectedStudent.id || '6HPS17';
      const data = generateStudentData(studentId, timeFilter);
      setCurrentStudentData(data);
    }
  }, [selectedStudent, timeFilter]);

  // Auto-select first student if none selected
  useEffect(() => {
    const students = getStudentsForClass();
    if (!selectedStudent && students.length > 0 && onStudentSelect) {
      onStudentSelect(students[0]);
    }
  }, [selectedClass, selectedStudent, onStudentSelect]);

  // Get filtered chart data based on view
  const getFilteredDateData = () => {
    if (!currentStudentData) return [];
    const data = currentStudentData.dateWiseComparison;

    if (scoreDateView === 'homework') {
      return data.map(item => ({ date: item.date, homework: item.homework }));
    } else if (scoreDateView === 'classwork') {
      return data.map(item => ({ date: item.date, classwork: item.classwork }));
    }
    return data;
  };

  const getFilteredChapterData = () => {
    if (!currentStudentData) return [];
    const data = currentStudentData.topicPerformance;

    if (chapterView === 'homework') {
      return data.map(item => ({ topic: item.topic, homework: item.homework }));
    } else if (chapterView === 'classwork') {
      return data.map(item => ({ topic: item.topic, classwork: item.classwork }));
    }
    return data;
  };

  // Enhanced Score Date-wise Progression with chart controls
  const renderScoreDatewiseProgression = () => {
    const chartData = getFilteredDateData();
    const stats = currentStudentData?.summaryStats || {};

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#0B1120]">{'\uD83D\uDCC8'} Homework vs Classwork: Date-wise Performance Analysis</h2>
          <p className="text-sm text-gray-500 mt-1">Score Comparison Over Time with All Submission Dates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  angle={timeFilter === 'Max' ? -45 : 0}
                  textAnchor={timeFilter === 'Max' ? "end" : "middle"}
                />
                <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                {(scoreDateView === 'combined' || scoreDateView === 'homework') && (
                  <Line type="monotone" dataKey="homework" stroke="#22c55e" strokeWidth={3} name="Homework Performance (%)" dot={{ fill: '#22c55e', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, fill: '#16a34a' }} />
                )}
                {(scoreDateView === 'combined' || scoreDateView === 'classwork') && (
                  <Line type="monotone" dataKey="classwork" stroke="#ef4444" strokeWidth={3} name="Classwork Performance (%)" dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, fill: '#dc2626' }} />
                )}
                <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {['1D', '5D', '10D', '15D', '1M', 'Max'].map((range) => (
                <button
                  key={range}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${timeFilter === range ? 'bg-[#00A0E3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => setTimeFilter(range)}
                >
                  {range}
                </button>
              ))}
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">{'\uD83D\uDCCA'} View Options:</div>
              <div className="space-y-1.5">
                {[
                  { key: 'combined', label: '\uD83D\uDCCA Combined View' },
                  { key: 'homework', label: '\uD83D\uDCDA Homework Only' },
                  { key: 'classwork', label: '\u270F Classwork Only' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${scoreDateView === opt.key ? 'bg-[#00A0E3] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setScoreDateView(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Improvement Trend:</span>
                <span className="text-xs font-semibold text-green-600">{stats.improvementRate || 15}% per assignment</span>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{'\uD83C\uDFC6'}</span>
                  <div>
                    <div className="text-xs font-bold text-[#0B1120]">YOU ARE AMONG TOP 20% STUDENTS</div>
                    <div className="flex gap-3 text-[10px] text-gray-500 mt-0.5">
                      <span>Your Score: {stats.homeworkAverage || 66}%</span>
                      <span>Class Avg: 62.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Chapter Analysis
  const renderChapterAnalysis = () => {
    const chartData = getFilteredChapterData();

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#0B1120]">{'\uD83D\uDCDA'} Topic Analysis</h2>
          <p className="text-sm text-gray-500 mt-1">Performance comparison across different topics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="topic" angle={-45} textAnchor="end" height={100} fontSize={11} stroke="#6b7280" />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                {(chapterView === 'combined' || chapterView === 'homework') && (
                  <Bar dataKey="homework" fill="#22c55e" name="Homework Performance" radius={[2, 2, 0, 0]} />
                )}
                {(chapterView === 'combined' || chapterView === 'classwork') && (
                  <Bar dataKey="classwork" fill="#ef4444" name="Classwork Performance" radius={[2, 2, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {['1D', '5D', '10D', '15D', '1M', 'Max'].map((range) => (
                <button
                  key={range}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${timeFilter === range ? 'bg-[#00A0E3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => setTimeFilter(range)}
                >
                  {range}
                </button>
              ))}
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">{'\uD83D\uDCCA'} View Options:</div>
              <div className="space-y-1.5">
                {[
                  { key: 'combined', label: '\uD83D\uDCCA Combined View' },
                  { key: 'homework', label: '\uD83D\uDCDA Homework Only' },
                  { key: 'classwork', label: '\u270F Classwork Only' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${chapterView === opt.key ? 'bg-[#00A0E3] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setChapterView(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <span>{'\uD83D\uDCA1'}</span>
                <span className="text-gray-600">Focus on Calculus Integration</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>{'\uD83D\uDCC8'}</span>
                <span className="text-gray-600">Strong in Coordinate Geometry</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Mistake Progress Analysis
  const renderMistakeProgressAnalysisTab = () => {
    if (!currentStudentData) return null;

    const filteredQuestions = currentStudentData.mistakeAnalysis.filter(question => {
      const chapterMatch = selectedChapterFilter === 'All Chapters' || question.chapter === selectedChapterFilter;
      const performanceMatch = selectedPerformanceFilter === 'All Percentages' ||
        (selectedPerformanceFilter === '0-25%' && parseFloat(question.performance) <= 25) ||
        (selectedPerformanceFilter === '26-50%' && parseFloat(question.performance) > 25 && parseFloat(question.performance) <= 50) ||
        (selectedPerformanceFilter === '51-75%' && parseFloat(question.performance) > 50 && parseFloat(question.performance) <= 75) ||
        (selectedPerformanceFilter === '76-100%' && parseFloat(question.performance) > 75);

      return chapterMatch && performanceMatch;
    });

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#0B1120]">{'\uD83D\uDD0D'} Mistake-Progress-Analysis</h2>
        </div>

        {/* How Well Did I Do Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-bold text-[#0B1120] mb-4">{'\uD83D\uDCCA'} How Well Did I Do? (Answer Categories)</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={currentStudentData.answerCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={160}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {currentStudentData.answerCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, name]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-xs text-gray-400">Total</div>
                <div className="text-2xl font-bold text-[#0B1120]">{currentStudentData.summaryStats.questionsAttempted}</div>
                <div className="text-xs text-gray-400">Questions</div>
              </div>
            </div>

            <div className="space-y-3">
              {currentStudentData.answerCategories.map((category, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }}></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#0B1120]">{category.name}</div>
                    <div className="text-xs text-gray-500">{category.count} questions</div>
                  </div>
                  <div className="text-sm font-bold" style={{ color: category.color }}>
                    {category.value}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Priority Chapters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-bold text-[#0B1120] mb-4">{'\uD83C\uDFAF'} Priority Chapters (Based on NCERT Weightage)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentStudentData.priorityChapters.map((chapter, index) => (
              <div key={index} className="rounded-lg p-4" style={{ backgroundColor: chapter.priorityColor }}>
                <div className="text-sm font-bold mb-1">
                  {chapter.priority === 'High' && '\uD83D\uDD25 High Priority:'}
                  {chapter.priority === 'Medium' && '\u26A0 Medium Priority:'}
                  {chapter.priority === 'Maintain' && '\u2705 Maintain:'}
                </div>
                <div className="text-sm font-semibold text-[#0B1120]">{chapter.chapter}</div>
                <div className="text-xs text-gray-600 mt-1">({chapter.performance} performance, {chapter.weightage} weightage)</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-bold text-[#0B1120] mb-4">{'\uD83D\uDD0D'} Explore Your Questions In Different Ways</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{'\uD83D\uDCCA'} Filter By Performance Percentage</label>
              <div className="text-xs text-gray-500 mb-2">Choose A Performance Range:</div>
              <select
                value={selectedPerformanceFilter}
                onChange={(e) => setSelectedPerformanceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3] focus:border-transparent"
              >
                <option value="All Percentages">All Percentages</option>
                <option value="0-25%">0-25%</option>
                <option value="26-50%">26-50%</option>
                <option value="51-75%">51-75%</option>
                <option value="76-100%">76-100%</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{'\uD83D\uDCDA'} Filter By Chapter</label>
              <div className="text-xs text-gray-500 mb-2">Choose A Chapter:</div>
              <select
                value={selectedChapterFilter}
                onChange={(e) => setSelectedChapterFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3] focus:border-transparent"
              >
                <option value="All Chapters">All Chapters</option>
                {[...new Set(currentStudentData.mistakeAnalysis.map(q => q.chapter))].map(chapter => (
                  <option key={chapter} value={chapter}>{chapter}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#0B1120]">{'\uD83D\uDCCB'} Filtered Results - {filteredQuestions.length} Questions Found</h3>
            <p className="text-sm text-gray-500 mt-1">Showing questions based on your selected filters</p>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Average Performance', value: `${currentStudentData.summaryStats.homeworkAverage}%` },
              { label: 'Room for Improvement', value: `${100 - currentStudentData.summaryStats.homeworkAverage}%` },
              { label: 'Chapters Covered', value: `${currentStudentData.summaryStats.chaptersAnalyzed} Chapters` },
              { label: 'Questions Found', value: `${filteredQuestions.length} Questions` },
            ].map((m, i) => (
              <div key={i} className="bg-[#F8FAFC] rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500">{m.label}</div>
                <div className="text-lg font-bold text-[#0B1120] mt-1">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Questions Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC]">
                  {['Question ID', 'Chapter', 'Date', 'Question', 'My Score', 'Performance', 'Mistake Tracker', 'Current Status', 'Student Mistake', 'Correct Approach'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-[#00A0E3]">{question.id}</td>
                    <td className="px-3 py-2 text-gray-700">{question.chapter}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{question.date}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{question.question}</td>
                    <td className="px-3 py-2 font-medium">{question.myScore}</td>
                    <td className="px-3 py-2">{question.performance}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{question.mistakeTracker}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(question.currentStatus)}`}>
                        {question.currentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 text-xs">{question.studentMistake}</td>
                    <td className="px-3 py-2 text-gray-600 text-xs">{question.correctApproach}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Summary Tab
  const renderSummaryTab = () => {
    if (!currentStudentData) return null;

    const getSummaryData = () => {
      const stats = currentStudentData.summaryStats;
      const performanceGap = stats.homeworkAverage - stats.classworkAverage;

      const baseData = {
        overallPerformance: stats.overallPerformance,
        homeworkAverage: stats.homeworkAverage,
        classworkAverage: stats.classworkAverage,
        performanceGap: performanceGap,
        improvementRate: stats.improvementRate,
        totalAssessments: stats.totalAssessments,
        chaptersAnalyzed: stats.chaptersAnalyzed,
        questionsAttempted: stats.questionsAttempted,
        overallAccuracy: stats.overallAccuracy
      };

      switch (summaryFilter) {
        case 'homework':
          return { ...baseData, focus: 'Homework Performance', mainMetric: baseData.homeworkAverage, insight: 'Strong homework performance with consistent improvement trend' };
        case 'classwork':
          return { ...baseData, focus: 'Classwork Performance', mainMetric: baseData.classworkAverage, insight: 'Classwork needs significant improvement - focus on time management' };
        default:
          return {
            ...baseData,
            focus: 'Overall Performance',
            mainMetric: baseData.overallPerformance,
            insight: performanceGap > 0 ?
              'Strong homework performance indicates good understanding' :
              'Focus on homework completion to improve understanding'
          };
      }
    };

    const summaryData = getSummaryData();

    return (
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-bold text-[#0B1120]">{'\uD83D\uDCCB'} Student Performance Summary</h2>
        </div>

        {/* Compact Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-gray-600">{'\uD83D\uDCCA'} View:</span>
            <div className="flex gap-2">
              {[
                { key: 'all', label: '\uD83D\uDCC8 All Data' },
                { key: 'homework', label: '\uD83D\uDCDA Homework' },
                { key: 'classwork', label: '\u270F Classwork' },
              ].map(opt => (
                <button
                  key={opt.key}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${summaryFilter === opt.key ? 'bg-[#00A0E3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => setSummaryFilter(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-bold text-[#0B1120] mb-4">{'\uD83D\uDCC8'} Performance Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { number: summaryData.totalAssessments, label: 'Assessments' },
              { number: summaryData.chaptersAnalyzed, label: 'Chapters' },
              { number: summaryData.questionsAttempted, label: 'Questions' },
              { number: `${summaryData.overallAccuracy}%`, label: 'Accuracy' },
            ].map((s, i) => (
              <div key={i} className="bg-[#F8FAFC] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[#00A0E3]">{s.number}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overall Performance Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{'\uD83C\uDFAF'}</span>
              <span className="text-sm font-bold text-[#0B1120]">{summaryData.focus}</span>
            </div>

            <div className="text-4xl font-bold text-[#00A0E3] mb-2">{summaryData.mainMetric}%</div>
            <div className="text-sm text-gray-500 mb-4">{summaryData.insight}</div>

            <div className="space-y-2">
              {[
                { label: 'Homework Avg:', value: `${summaryData.homeworkAverage}%` },
                { label: 'Classwork Avg:', value: `${summaryData.classworkAverage}%` },
                { label: 'Performance Gap:', value: `${summaryData.performanceGap > 0 ? '+' : ''}${summaryData.performanceGap.toFixed(1)}%`, cls: summaryData.performanceGap > 0 ? 'text-green-600' : 'text-red-500' },
                { label: 'Improvement Rate:', value: `+${summaryData.improvementRate}%`, cls: 'text-green-600' },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{m.label}</span>
                  <span className={`font-bold ${m.cls || 'text-[#0B1120]'}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Chapters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{'\uD83C\uDFAF'}</span>
              <span className="text-sm font-bold text-[#0B1120]">Priority Chapters (NCERT Weightage)</span>
            </div>

            <div className="space-y-2">
              {currentStudentData.priorityChapters.map((chapter, index) => (
                <div
                  key={index}
                  className="rounded-lg p-3"
                  style={{ backgroundColor: chapter.priorityColor }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {chapter.priority === 'High' && <span>{'\uD83D\uDD25'}</span>}
                    {chapter.priority === 'Medium' && <span>{'\u26A0'}</span>}
                    {chapter.priority === 'Maintain' && <span>{'\u2705'}</span>}
                    <span className="text-xs font-semibold">{chapter.priority} Priority</span>
                  </div>
                  <div className="text-sm font-bold text-[#0B1120]">{chapter.chapter}</div>
                  <div className="text-xs text-gray-600">
                    {chapter.performance} performance {'\u2022'} {chapter.weightage} weightage
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{'\uD83D\uDCA1'}</span>
            <span className="text-sm font-bold text-[#0B1120]">Recommendations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {summaryData.performanceGap < -10 && (
              <div className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                <span>{'\uD83C\uDFAF'}</span>
                <span className="text-gray-600">Focus on time management skills for classwork</span>
              </div>
            )}
            {summaryData.overallAccuracy < 50 && (
              <div className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                <span>{'\uD83D\uDCD6'}</span>
                <span className="text-gray-600">Review fundamental concepts thoroughly</span>
              </div>
            )}
            {summaryData.improvementRate < 10 && (
              <div className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                <span>{'\u23F1'}</span>
                <span className="text-gray-600">Practice more timed exercises</span>
              </div>
            )}
            <div className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded-lg">
              <span>{'\u2705'}</span>
              <span className="text-gray-600">Continue regular practice to maintain momentum</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render function for student analysis content
  const renderStudentAnalysisContent = () => {
    return (
      <div className="space-y-4">
        {/* Updated Main Tabs */}
        <div className="flex flex-wrap gap-2 bg-white rounded-xl shadow-sm border border-gray-100 p-3">
          {[
            { key: 'score-progression', icon: '\uD83D\uDCC8', label: 'Score- Date-wise progression' },
            { key: 'chapter-analysis', icon: '\uD83D\uDCDA', label: 'Chapter Analysis' },
            { key: 'mistakes', icon: '\uD83D\uDD0D', label: 'Mistake-Progress-Analysis' },
            { key: 'summary', icon: '\uD83D\uDCCB', label: 'Summary' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStudentAnalysisMainTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${studentAnalysisMainTab === tab.key ? 'bg-[#00A0E3] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className={isTransitioning ? 'opacity-50' : ''}>
          {studentAnalysisMainTab === 'score-progression' && renderScoreDatewiseProgression()}
          {studentAnalysisMainTab === 'chapter-analysis' && renderChapterAnalysis()}
          {studentAnalysisMainTab === 'mistakes' && renderMistakeProgressAnalysisTab()}
          {studentAnalysisMainTab === 'summary' && renderSummaryTab()}
        </div>
      </div>
    );
  };

    return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{'\uD83D\uDC64'}</div>
            <div>
              <h2 className="text-xl font-bold text-[#0B1120]">
                {isStudentView ? 'My Analysis Dashboard' : 'Student Analysis Dashboard'}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedStudent ?
                  (isStudentView
                    ? `Analyzing performance for ${selectedStudent.name} (${selectedStudent.rollNo})`
                    : `Analyzing performance for ${selectedStudent.name} (${selectedStudent.rollNo})`)
                  : 'Select a student to view detailed analysis'
                }
              </p>
            </div>
          </div>

          {/* Completely hide dropdowns for students */}
          {!isStudentView && !readOnly && (
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Class</label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3] focus:border-transparent"
                  value={selectedClass?.id || ''}
                  onChange={(e) => handleClassChange(parseInt(e.target.value))}
                >
                  <option value="">-- Select Class --</option>
                  {Object.values(classesData).map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Student</label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3] focus:border-transparent"
                  value={selectedStudent?.id || ''}
                  onChange={(e) => {
                    const student = getStudentsForClass().find(s => s.id === e.target.value);
                    if (student) handleStudentSelect(student);
                  }}
                  disabled={!selectedClass}
                >
                  <option value="">-- Select Student --</option>
                  {getStudentsForClass().map(student => (
                    <option key={student.id} value={student.id}>
                      {student.rollNo} - {student.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* For student view, show disabled dropdowns with their info */}
          {isStudentView && (
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Class</label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  value={selectedClass?.id || ''}
                  disabled={true}
                >
                  <option value={selectedClass?.id}>
                    {selectedClass?.name}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Student</label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  value={selectedStudent?.id || ''}
                  disabled={true}
                >
                  <option value={selectedStudent?.id}>
                    {selectedStudent?.rollNo} - {selectedStudent?.name}
                  </option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rest of the component remains the same */}
      {selectedStudent ? renderStudentAnalysisContent() : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">{'\uD83D\uDC46'}</div>
          <h3 className="text-lg font-bold text-[#0B1120] mb-2">Please select a student to view analysis</h3>
          <p className="text-sm text-gray-500">Choose a student from the dropdown above to see detailed performance analysis.</p>
        </div>
      )}
    </div>
  );
};

export default StudentAnalysis;
