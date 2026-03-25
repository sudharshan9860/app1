import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine
} from 'recharts';

const StudentAnalysis = ({ selectedClass, selectedStudent, onStudentSelect, classesData, onClassChange }) => {
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

  // Function to get students for selected class
  const getStudentsForClass = () => {
    if (!selectedClass || !classesData[selectedClass.id]) {
      // Return sample students if no class data
      return [
        { id: 1, name: "Arjun Patel", rollNo: "10HPS21", class: "6th", efficiency: 78 },
        { id: 2, name: "Sneha Gupta", rollNo: "10HPS17", class: "6th", efficiency: 82 },
        { id: 3, name: "Rohit Sharma", rollNo: "10HPS18", class: "6th", efficiency: 75 },
        { id: 4, name: "Priya Sharma", rollNo: "10HPS02", class: "6th", efficiency: 85 },
        { id: 5, name: "Ravi Kumar", rollNo: "10HPS19", class: "6th", efficiency: 72 },
        { id: 6, name: "Anita Singh", rollNo: "10HPS20", class: "6th", efficiency: 89 }
      ];
    }

    // Add rollNo to existing students if not present
    const students = classesData[selectedClass.id].students || [];
    return students.map((student, index) => ({
      ...student,
      rollNo: student.rollNo || `10HPS${String(index + 21).padStart(2, '0')}`
    }));
  };

  // Auto-select first student if none selected (for testing)
  useEffect(() => {
    const students = getStudentsForClass();
    if (!selectedStudent && students.length > 0 && onStudentSelect) {
      onStudentSelect(students[0]);
    }
  }, [selectedClass, classesData, selectedStudent, onStudentSelect]);

  // Enhanced data for Score Date-wise Progression
  const studentDateWiseComparisonData = [
    { date: 'Jun 23', homework: 18, classwork: 38 },
    { date: 'Jun 25', homework: 35, classwork: 20 },
    { date: 'Jun 27', homework: 78, classwork: 47 },
    { date: 'Jun 29', homework: 80, classwork: 28 },
    { date: 'Jul 01', homework: 85, classwork: 25 },
    { date: 'Jul 03', homework: 92, classwork: 44 }
  ];

  // Enhanced Topic-wise Performance Data for Chapter Analysis
  const topicWisePerformanceData = [
    { topic: 'Calculus - Integration', homework: 100, classwork: 12 },
    { topic: 'Algebra - Linear Equations', homework: 75, classwork: 15 },
    { topic: 'Statistics', homework: 78, classwork: 20 },
    { topic: 'Algebra - Rational Functions', homework: 80, classwork: 32 },
    { topic: 'Probability', homework: 72, classwork: 35 },
    { topic: 'Trigonometry', homework: 79, classwork: 49 },
    { topic: 'Quadratic Applications', homework: 68, classwork: 40 },
    { topic: 'Calculus - Derivatives', homework: 59, classwork: 32 },
    { topic: 'Functions and Graphs', homework: 51, classwork: 58 },
    { topic: 'Coordinate Geometry', homework: 66, classwork: 93 }
  ];

  // Answer Categories Data for Pie Chart
  const answerCategoriesData = [
    { name: 'Correct', value: 43.3, count: 13, color: '#22c55e' },
    { name: 'Partially-Correct', value: 10, count: 3, color: '#f59e0b' },
    { name: 'Numerical Error', value: 13.3, count: 4, color: '#ef4444' },
    { name: 'Irrelevant', value: 23.3, count: 7, color: '#00A0E3' },
    { name: 'Unattempted', value: 10, count: 3, color: '#6b7280' }
  ];

  // Mistake Analysis Questions Data
  const mistakeAnalysisData = [
    {
      id: 'Q1',
      chapter: 'Quadratic Applications',
      date: '2023-06-23',
      question: 'Find the shortest distance...',
      myScore: '0/20',
      performance: '0.0%',
      mistakeTracker: 'First submission, no prior mistakes',
      currentStatus: 'IRRELEVANT',
      studentMistake: 'Irrelevant formula application',
      correctApproach: 'Minimize the distance function using calculus'
    },
    {
      id: 'Q2',
      chapter: 'Quadratic Applications',
      date: '2023-06-25',
      question: 'Find the vertex of the parabola...',
      myScore: '0/8',
      performance: '0.0%',
      mistakeTracker: 'First submission, no prior mistakes',
      currentStatus: 'NO ATTEMPT',
      studentMistake: 'Fig = 5',
      correctApproach: 'Minimize the distance function using calculus'
    },
    {
      id: 'Q3',
      chapter: 'Algebra - Linear Equations',
      date: '2023-06-23',
      question: 'Solve the system: 2x + 3y = ...',
      myScore: '3/6',
      performance: '50.0%',
      mistakeTracker: 'First submission, no prior mistakes',
      currentStatus: 'NUMERICAL ERROR',
      studentMistake: '5y = 6',
      correctApproach: 'Minimize the distance function using calculus'
    },
    {
      id: 'Q4',
      chapter: 'Coordinate Geometry',
      date: '2023-06-23',
      question: 'Find the equation of line passing...',
      myScore: '1/5',
      performance: '20.0%',
      mistakeTracker: 'First submission, no prior mistakes',
      currentStatus: 'CONCEPTUAL ERROR',
      studentMistake: 'Area = \u00BD \u00D7 base \u00D7 height',
      correctApproach: 'Minimize the distance function using calculus'
    },
    {
      id: 'Q5',
      chapter: 'Coordinate Geometry',
      date: '2023-06-25',
      question: 'Evaluate sin(30\u00B0) + cos(60\u00B0)',
      myScore: '2/4',
      performance: '50.0%',
      mistakeTracker: 'First submission, no prior mistakes',
      currentStatus: 'VALUE ERROR',
      studentMistake: 'cos(60\u00B0) = 0.5',
      correctApproach: 'Minimize the distance function using calculus'
    }
  ];

  // Priority chapters data based on NCERT weightage
  const priorityChaptersData = [
    {
      chapter: 'Calculus - Integration',
      performance: '0%',
      weightage: '15%',
      priority: 'High',
      priorityColor: '#fee2e2',
      recommendation: '\uD83D\uDD25 High Priority'
    },
    {
      chapter: 'Quadratic Applications',
      performance: '38%',
      weightage: '12%',
      priority: 'Medium',
      priorityColor: '#fef3c7',
      recommendation: '\u26A0 Medium Priority'
    },
    {
      chapter: 'Trigonometry',
      performance: '81%',
      weightage: '10%',
      priority: 'Maintain',
      priorityColor: '#d1fae5',
      recommendation: '\u2705 Maintain'
    }
  ];

  // Function to get filtered chart data based on view
  const getFilteredDateData = () => {
    if (scoreDateView === 'homework') {
      return studentDateWiseComparisonData.map(item => ({
        date: item.date,
        homework: item.homework
      }));
    } else if (scoreDateView === 'classwork') {
      return studentDateWiseComparisonData.map(item => ({
        date: item.date,
        classwork: item.classwork
      }));
    }
    return studentDateWiseComparisonData;
  };

  const getFilteredChapterData = () => {
    if (chapterView === 'homework') {
      return topicWisePerformanceData.map(item => ({
        topic: item.topic,
        homework: item.homework
      }));
    } else if (chapterView === 'classwork') {
      return topicWisePerformanceData.map(item => ({
        topic: item.topic,
        classwork: item.classwork
      }));
    }
    return topicWisePerformanceData;
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

  // Enhanced Score Date-wise Progression with chart controls
  const renderScoreDatewiseProgression = () => {
    const chartData = getFilteredDateData();

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
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
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
              {['1D', '5D', '10D', '15D', '1M', 'Max'].map((range, idx) => (
                <button key={range} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${idx === 0 ? 'bg-[#00A0E3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
                <span className="text-xs font-semibold text-green-600">15.07% per assignment</span>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{'\uD83C\uDFC6'}</span>
                  <div>
                    <div className="text-xs font-bold text-[#0B1120]">YOU ARE AMONG TOP 20% STUDENTS</div>
                    <div className="flex gap-3 text-[10px] text-gray-500 mt-0.5">
                      <span>Your Score: 66.8%</span>
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
              {['1D', '5D', '10D', '15D', '1M', 'Max'].map((range, idx) => (
                <button key={range} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${idx === 0 ? 'bg-[#00A0E3] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
    const filteredQuestions = mistakeAnalysisData.filter(question => {
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
                    data={answerCategoriesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={160}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {answerCategoriesData.map((entry, index) => (
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
                <div className="text-2xl font-bold text-[#0B1120]">30</div>
                <div className="text-xs text-gray-400">Questions</div>
              </div>
            </div>

            <div className="space-y-3">
              {answerCategoriesData.map((category, index) => (
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
            {priorityChaptersData.map((chapter, index) => (
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
                <option value="Quadratic Applications">Quadratic Applications</option>
                <option value="Algebra - Linear Equations">Algebra - Linear Equations</option>
                <option value="Coordinate Geometry">Coordinate Geometry</option>
                <option value="Calculus - Integration">Calculus - Integration</option>
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
              { label: 'Average Performance', value: '66.8%' },
              { label: 'Room for Improvement', value: '33.2%' },
              { label: 'Chapters Covered', value: '10 Chapters' },
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
    const getSummaryData = () => {
      const baseData = {
        overallPerformance: 50.3,
        homeworkAverage: 66.8,
        classworkAverage: 33.8,
        performanceGap: -33.0,
        improvementRate: 15.07,
        totalAssessments: 6,
        chaptersAnalyzed: 10,
        questionsAttempted: 30,
        overallAccuracy: 43.3
      };

      switch (summaryFilter) {
        case 'homework':
          return { ...baseData, focus: 'Homework Performance', mainMetric: baseData.homeworkAverage, insight: 'Strong homework performance with consistent improvement trend' };
        case 'classwork':
          return { ...baseData, focus: 'Classwork Performance', mainMetric: baseData.classworkAverage, insight: 'Classwork needs significant improvement - focus on time management' };
        default:
          return { ...baseData, focus: 'Overall Performance', mainMetric: baseData.overallPerformance, insight: 'Large gap between homework and classwork performance indicates time management issues' };
      }
    };

    const summaryData = getSummaryData();

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#0B1120]">{'\uD83D\uDCCB'} Student Performance Summary</h2>
        </div>

        {/* Summary Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-600">{'\uD83D\uDCCA'} Filter Summary View:</h3>
            <div className="flex gap-2">
              {[
                { key: 'all', label: '\uD83D\uDCC8 All Data' },
                { key: 'homework', label: '\uD83D\uDCDA Homework Only' },
                { key: 'classwork', label: '\u270F Classwork Only' },
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

        {/* Main Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{'\uD83C\uDFAF'}</span>
              <span className="text-sm font-bold text-[#0B1120]">{summaryData.focus} Overview</span>
            </div>
            <div className="text-4xl font-bold text-[#00A0E3] mb-2">{summaryData.mainMetric}%</div>
            <div className="text-sm text-gray-500">{summaryData.insight}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{'\uD83D\uDCCA'}</span>
              <span className="text-sm font-bold text-[#0B1120]">Key Metrics</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Homework Average:', value: `${summaryData.homeworkAverage}%`, note: '(Above class average of 62.2%)' },
                { label: 'Classwork Average:', value: `${summaryData.classworkAverage}%`, note: '(Below class average of 51.5%)' },
                { label: 'Performance Gap:', value: `${summaryData.performanceGap}%`, note: '(Significant difference between HW and CW)', negative: true },
                { label: 'Improvement Rate:', value: `${summaryData.improvementRate}%`, note: 'in homework assignments', positive: true },
              ].map((m, i) => (
                <div key={i} className="flex items-baseline gap-2 text-sm">
                  <span className="text-gray-500">{m.label}</span>
                  <span className={`font-bold ${m.positive ? 'text-green-600' : m.negative ? 'text-red-500' : 'text-[#0B1120]'}`}>{m.value}</span>
                  <span className="text-xs text-gray-400">{m.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{'\uD83D\uDCA1'}</span>
              <span className="text-sm font-bold text-[#0B1120]">Recommendations</span>
            </div>
            <div className="space-y-2">
              {[
                { icon: '\u23F0', text: 'Focus on time management skills for classwork' },
                { icon: '\uD83D\uDD04', text: 'Practice more timed exercises' },
                { icon: '\uD83C\uDFAF', text: 'Reinforce conceptual understanding through targeted practice' },
                { icon: '\u2705', text: 'Reduce careless errors through careful review processes' },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span>{r.icon}</span>
                  <span className="text-gray-600">{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-bold text-[#0B1120] mb-4">{'\uD83D\uDCC8'} Performance Statistics Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { number: summaryData.totalAssessments, label: 'Total Assessment Dates' },
              { number: summaryData.chaptersAnalyzed, label: 'Chapters Analyzed' },
              { number: summaryData.questionsAttempted, label: 'Total Questions Attempted' },
              { number: `${summaryData.overallAccuracy}%`, label: 'Overall Accuracy Rate' },
            ].map((s, i) => (
              <div key={i} className="bg-[#F8FAFC] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[#00A0E3]">{s.number}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* NCERT Priority Chapters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-bold text-[#0B1120] mb-4">{'\uD83C\uDFAF'} Priority Chapters (Based on NCERT Weightage)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {priorityChaptersData.map((chapter, index) => (
              <div key={index} className="rounded-lg p-4" style={{ backgroundColor: chapter.priorityColor }}>
                <div className="flex items-center gap-2 mb-1">
                  {chapter.priority === 'High' && <span>{'\uD83D\uDD25'}</span>}
                  {chapter.priority === 'Medium' && <span>{'\u26A0'}</span>}
                  {chapter.priority === 'Maintain' && <span>{'\u2705'}</span>}
                  <span className="text-sm font-semibold">{chapter.recommendation}</span>
                </div>
                <div className="text-sm font-bold text-[#0B1120]">{chapter.chapter}</div>
                <div className="text-xs text-gray-600 mt-1">({chapter.performance} performance, {chapter.weightage} weightage)</div>
              </div>
            ))}
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
              <h2 className="text-xl font-bold text-[#0B1120]">Student Analysis Dashboard</h2>
              <p className="text-sm text-gray-500">
                {selectedStudent ?
                  `Detailed performance analysis for ${selectedStudent.rollNo} - ${selectedStudent.name}` :
                  'Select a student from the dropdown above to view detailed analysis'
                }
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Select Class */}
            <div>
              <span className="block text-xs font-medium text-gray-500 mb-1">Select Class</span>
              <select
                value={selectedClass.name}
                onChange={(e) => {
                  const classData = Object.values(classesData).find(cls => cls.name === e.target.value);
                  if (classData) {
                    onClassChange(classData);
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3] focus:border-transparent"
              >
                <option value="Class 6th">Class 6th</option>
                <option value="Class 7th">Class 7th</option>
                <option value="Class 8th">Class 8th</option>
                <option value="Class 9th">Class 9th</option>
                <option value="Class 10th">Class 10th</option>
                <option value="Class 11th">Class 11th</option>
                <option value="Class 12th">Class 12th</option>
              </select>
            </div>

            {/* Select Student */}
            <div>
              <span className="block text-xs font-medium text-gray-500 mb-1">Select Student</span>
              <select
                value={selectedStudent ? selectedStudent.rollNo : ''}
                onChange={(e) => {
                  const studentRollNo = e.target.value;
                  if (studentRollNo) {
                    const student = getStudentsForClass().find(s => s.rollNo === studentRollNo);
                    if (student && onStudentSelect) {
                      onStudentSelect(student);
                    }
                  } else {
                    if (onStudentSelect) {
                      onStudentSelect(null);
                    }
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A0E3] focus:border-transparent"
              >
                <option value="">Select Student</option>
                {getStudentsForClass().map(student => (
                  <option key={student.id || student.rollNo} value={student.rollNo}>
                    {student.rollNo} - {student.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

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
