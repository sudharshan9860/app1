// ProgressTab.jsx - 
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { BarChart3, TrendingUp, TrendingDown, User, Clock, Eye } from 'lucide-react';

const ProgressTab = ({ teacherData }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Class-related states - MODIFIED: No ALL option
  const [detectedClasses, setDetectedClasses] = useState([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  
  // Filter states
  const [performanceTrend, setPerformanceTrend] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [maxPerformance, setMaxPerformance] = useState(100);
  const [sortBy, setSortBy] = useState('overallPerformance');
  const [sortOrder, setSortOrder] = useState('lowToHigh');
  const [patternFilter, setPatternFilter] = useState('All');
  
  // Data states
  const [availableTopics, setAvailableTopics] = useState([]);
  const [homeworkData, setHomeworkData] = useState({});
  const [allAnalysis, setAllAnalysis] = useState({});
  const [topicHomeworkCounts, setTopicHomeworkCounts] = useState({});
  
  // Activity data state
  const [activityData, setActivityData] = useState({});
  
  // REMOVED: Auto-refresh related states
  const [fetchState, setFetchState] = useState(null);
  
  // Constants
  const BATCH_SIZE = 5;
  
  // ============= UTILITY FUNCTIONS =============
  
  // Robust date parsing matching Streamlit
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === 'Unknown') {
      return new Date(0);
    }
    
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[2].length === 2) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = 2000 + parseInt(parts[2]);
        return new Date(year, month, day);
      }
    } catch (e) {
      // Continue to next format
    }
    
    try {
      if (dateStr.includes('T') || dateStr.includes('Z')) {
        return new Date(dateStr.replace('Z', '+00:00'));
      }
    } catch (e) {
      // Continue to fallback
    }
    
    try {
      return new Date(dateStr);
    } catch (e) {
      return new Date(0);
    }
  };
  
  // Load fetch state
  const loadFetchState = useCallback(() => {
    try {
      const saved = localStorage.getItem('progressTabFetchState');
      return saved ? JSON.parse(saved) : {
        last_fetch_timestamp: null,
        processed_homeworks: {},
        homework_submission_ids: {}
      };
    } catch (e) {
      console.error('Error loading fetch state:', e);
      return {
        last_fetch_timestamp: null,
        processed_homeworks: {},
        homework_submission_ids: {}
      };
    }
  }, []);
  
  // Save fetch state
  const saveFetchState = useCallback((state) => {
    try {
      localStorage.setItem('progressTabFetchState', JSON.stringify(state));
    } catch (e) {
      console.error('Error saving fetch state:', e);
    }
  }, []);
  
  // Normalize teacher data structure
  const normalizedTeacherData = useMemo(() => {
    if (!teacherData) return { available_students: [] };
    
    if (Array.isArray(teacherData)) {
      return { available_students: teacherData };
    }
    
    return {
      available_students: teacherData.available_students || 
                         teacherData.students || 
                         [],
    };
  }, [teacherData]);

  // Class detection function
  const detectClassFromStudentId = (studentId) => {
    const pattern = /^(\d+[A-Z]+)/;
    const match = studentId.match(pattern);
    return match ? match[1] : null;
  };

  const detectClassesFromAllStudents = (studentList) => {
    const classesSet = new Set();
    
    studentList.forEach(student => {
      const studentId = typeof student === 'string' ? student : student.id;
      const className = detectClassFromStudentId(studentId);
      if (className) {
        classesSet.add(className);
      }
    });
    
    return Array.from(classesSet).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  };

  // ============= ACTIVITY DATA FUNCTIONS =============
  
  const fetchActivityData = async (studentId) => {
    try {
      const response = await axiosInstance.get(`/student-activity/${studentId}/`);
      return response.data;
    } catch (error) {
      console.debug(`No activity data for ${studentId}`);
      return {
        total_active_time: 'N/A',
        total_active_minutes: 0,
        total_sessions: 0,
        last_seen: 'No data',
        engagement_score: 0
      };
    }
  };
  
  const fetchAllActivityData = async (studentList) => {
    const activityMap = {};
    
    const batchPromises = [];
    for (let i = 0; i < studentList.length; i += BATCH_SIZE) {
      const batch = studentList.slice(i, i + BATCH_SIZE);
      const batchPromise = Promise.all(
        batch.map(async (student) => {
          const studentId = typeof student === 'string' ? student : student.id;
          const activity = await fetchActivityData(studentId);
          return { studentId, activity };
        })
      );
      batchPromises.push(batchPromise);
    }
    
    const results = await Promise.all(batchPromises);
    results.flat().forEach(({ studentId, activity }) => {
      activityMap[studentId] = activity;
    });
    
    return activityMap;
  };

  // Performance pattern detection
  const detectPerformancePattern = (scores) => {
    if (scores.length < 2) {
      return {
        trend: 'Only-1 Submission',
        pattern_details: {
          pattern: 'Not enough data',
          pattern_category: 'Not enough data',
          lowest_score: 0,
          best_score: scores[0] || 0,
          worst_score: scores[0] || 0,
          current_vs_avg: 0
        }
      };
    }

    const latest = scores[scores.length - 1];
    const previous = scores.length > 1 ? scores[scores.length - 2] : latest;
    const best = Math.max(...scores);
    const worst = Math.min(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const firstScore = scores[0];
    
    const baselineScores = scores.slice(0, Math.min(2, scores.length));
    const baselineAvg = baselineScores.reduce((a, b) => a + b, 0) / baselineScores.length;
    
    const variance = scores.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const lowest_score = avg > 0 ? (stdDev / avg * 100) : 0;

    const patternDetails = {
      lowest_score: lowest_score.toFixed(2),
      best_score: best.toFixed(2),
      worst_score: worst.toFixed(2),
      current_vs_avg: (latest - avg).toFixed(2),
      short_ma: scores.length >= 2 ? 
        (scores.slice(-2).reduce((a, b) => a + b, 0) / Math.min(2, scores.length)).toFixed(2) : avg.toFixed(2),
      long_ma: avg.toFixed(2),
      pattern: '',
      pattern_category: ''
    };

    // Special handling for exactly 2 homeworks
    if (scores.length === 2) {
      const change = latest - previous;
      if (change > 0) {
        patternDetails.pattern = 'Improvement from first homework';
        patternDetails.pattern_category = 'Improvement';
        return { trend: 'improving', pattern_details: patternDetails };
      } else if (change < 0) {
        patternDetails.pattern = 'Decline from first homework';
        patternDetails.pattern_category = 'Decline';
        return { trend: 'declining', pattern_details: patternDetails };
      } else {
        patternDetails.pattern = 'Stable performance';
        patternDetails.pattern_category = 'Stable';
        return { trend: 'stagnant', pattern_details: patternDetails };
      }
    }

    const improvementFromBaseline = latest - baselineAvg;
    
    if (firstScore < 30 && latest > firstScore * 1.5) {
      patternDetails.pattern = 'Recovery from low baseline';
      patternDetails.pattern_category = 'Strong improvement';
      return { trend: 'improving', pattern_details: patternDetails };
    }

    if (improvementFromBaseline > 20 && latest > baselineAvg) {
      patternDetails.pattern = 'Improvement from baseline';
      patternDetails.pattern_category = 'Improvement';
      return { trend: 'improving', pattern_details: patternDetails };
    }

    if (latest < baselineAvg * 0.8 && latest < previous - 5) {
      patternDetails.pattern = 'Downward trend';
      patternDetails.pattern_category = 'Gradual decline';
      return { trend: 'declining', pattern_details: patternDetails };
    }

    if (lowest_score > 30) {
      if (latest > firstScore * 1.3) {
        patternDetails.pattern = 'Volatile but improving';
        patternDetails.pattern_category = 'Improvement';
        return { trend: 'improving', pattern_details: patternDetails };
      } else if (latest < avg && latest < baselineAvg) {
        patternDetails.pattern = 'Volatile with downward bias';
        patternDetails.pattern_category = 'Inconsistent performance';
        return { trend: 'declining', pattern_details: patternDetails };
      }
    }

    if (latest > baselineAvg * 1.2) {
      patternDetails.pattern = 'Above baseline';
      patternDetails.pattern_category = 'Improvement';
      return { trend: 'improving', pattern_details: patternDetails };
    } else if (latest < baselineAvg * 0.8) {
      patternDetails.pattern = 'Below baseline';
      patternDetails.pattern_category = 'Gradual decline';
      return { trend: 'declining', pattern_details: patternDetails };
    } else {
      patternDetails.pattern = 'Stable performance';
      patternDetails.pattern_category = 'Stable';
      if (avg >= 80) {
        patternDetails.pattern = 'Stable at excellence';
        patternDetails.pattern_category = 'High performer - stable';
        return { trend: 'improving', pattern_details: patternDetails };
      }
      return { trend: 'stagnant', pattern_details: patternDetails };
    }
  };

  const normalizeErrorType = (errorType) => {
    const errorLower = errorType.toLowerCase().trim()
      .replace('_error', '').replace(' error', '').trim();
    
    if (errorLower.includes('concept')) return 'Conceptual';
    if (errorLower.includes('logic')) return 'Logical';
    if (errorLower.includes('calcul')) return 'Calculation';
    return '';
  };

  // CRITICAL FIX: Exclude completely unattempted topics from analysis and calculations

// 1. UPDATED analyzeStudentPerformance - Skip topics with all zeros
// CRITICAL FIX: Complete update to analyzeStudentPerformance
// This matches Streamlit by EXCLUDING 0% scores from calculations

const analyzeStudentPerformance = (studentId, homeworks, topicHomeworkTotals) => {
  const topicHomeworks = {};
  
  const sortedHomeworks = [...homeworks].sort((a, b) => {
    const dateA = parseDate(a.date || a.creation_date);
    const dateB = parseDate(b.date || b.creation_date);
    return dateA - dateB;
  });

  // Group by topic and calculate scores
  sortedHomeworks.forEach(hw => {
    hw.questions?.forEach(question => {
      const topic = (question.topic || hw.topic || 'Unknown').split('Exercise')[0].trim();
      
      if (!topicHomeworks[topic]) {
        topicHomeworks[topic] = {
          homeworks: [],
          scores: [],
          errors: {},
          notAttempted: 0,
          correct: 0,
          totalQuestions: 0
        };
      }

      const answerCat = (question.answer_category || '').trim();
      const totalScore = question.total_score || 0;
      const maxScore = question.max_score || 0;

      topicHomeworks[topic].totalQuestions++;
      
      if ((answerCat === 'None' || 
           answerCat === 'no-error' || 
           answerCat === 'no_error' || 
           answerCat.toLowerCase() === 'none') && 
          totalScore === maxScore && 
          maxScore > 0) {
        topicHomeworks[topic].correct++;
      }
      else if (answerCat === 'Unattempted' || 
               (totalScore === 0 && (answerCat === 'no_error' || answerCat === 'no-error'))) {
        topicHomeworks[topic].notAttempted++;
      }
      else if (answerCat && 
               answerCat !== 'None' && 
               answerCat !== 'no_error' && 
               answerCat !== 'no-error' && 
               answerCat !== '') {
        
        const errorTypes = answerCat.split(',').map(e => e.trim()).filter(e => e);
        const weight = errorTypes.length > 0 ? 1.0 / errorTypes.length : 0;
        
        errorTypes.forEach(errorType => {
          if (errorType.toLowerCase() === 'unattempted') {
            topicHomeworks[topic].notAttempted += weight;
          } else {
            const normalized = normalizeErrorType(errorType);
            if (normalized) {
              if (!topicHomeworks[topic].errors[normalized]) {
                topicHomeworks[topic].errors[normalized] = 0;
              }
              topicHomeworks[topic].errors[normalized] += weight;
            }
          }
        });
      }
    });

    // Calculate homework score for each topic
    Object.keys(topicHomeworks).forEach(topic => {
      const hwQuestions = hw.questions?.filter(q => 
        (q.topic || hw.topic || 'Unknown').split('Exercise')[0].trim() === topic
      ) || [];
      
      const hwTotalScore = hwQuestions.reduce((sum, q) => sum + (q.total_score || 0), 0);
      const hwMaxScore = hwQuestions.reduce((sum, q) => sum + (q.max_score || 0), 0);
      const hwScore = hwMaxScore > 0 ? (hwTotalScore / hwMaxScore) * 100 : 0;
      
      if (!topicHomeworks[topic].homeworks.find(h => h.hw_id === hw.id)) {
        topicHomeworks[topic].homeworks.push({
          date: hw.date || hw.creation_date,
          hw_id: hw.id || hw.homework_id,
          score: hwScore
        });
        
        // CRITICAL: Only add non-zero scores to the scores array for calculation
        if (hwScore > 0) {
          topicHomeworks[topic].scores.push(hwScore);
        }
      }
    });
  });

  const analysisResult = {};
  
  Object.keys(topicHomeworks).forEach(topic => {
    const data = topicHomeworks[topic];
    
    // CRITICAL: Filter to only non-zero homework submissions
    const nonZeroHomeworks = data.homeworks.filter(hw => hw.score > 0);
    
    if (nonZeroHomeworks.length === 0) {
      console.log(`✗ Skipping topic ${topic} for ${studentId} - no non-zero submissions`);
      return;
    }
    
    // Use only non-zero scores for calculations
    const scores = data.scores; // Already filtered above
    const overallPerformance = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

    if (overallPerformance === 0) {
      console.log(`✗ Skipping topic ${topic} for ${studentId} - 0% overall performance`);
      return;
    }

    // Calculate test attendance based on NON-ZERO submissions only
    const uniqueHwIds = new Set(nonZeroHomeworks.map(h => h.hw_id));
    const topicAttendanceCount = uniqueHwIds.size;
    const totalHomeworksForTopic = topicHomeworkTotals[topic] || 0;
    
    const testAttendancePct = totalHomeworksForTopic > 0 
      ? Math.min((topicAttendanceCount / totalHomeworksForTopic) * 100, 100)
      : 0;

    if (testAttendancePct === 0) {
      console.log(`✗ Skipping topic ${topic} for ${studentId} - 0% test attendance`);
      return;
    }

    const errorPercentages = {};
    Object.keys(data.errors).forEach(errorType => {
      errorPercentages[errorType] = data.totalQuestions > 0
        ? ((data.errors[errorType] / data.totalQuestions) * 100).toFixed(2)
        : '0.00';
    });

    const notAttemptedPct = data.totalQuestions > 0
      ? ((data.notAttempted / data.totalQuestions) * 100).toFixed(2)
      : '0.00';
    
    const correctPct = data.totalQuestions > 0
      ? ((data.correct / data.totalQuestions) * 100).toFixed(2)
      : '0.00';

    const { trend, pattern_details } = detectPerformancePattern(scores);

    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const bestScoreIdx = scores.indexOf(bestScore);
    const hwAgo = scores.length - bestScoreIdx - 1;
    const latestScore = scores[scores.length - 1] || 0;
    const previousScore = scores[scores.length - 2] || 0;

    console.log(`✓ Including topic ${topic} for ${studentId} - ${overallPerformance.toFixed(2)}% (${nonZeroHomeworks.length} non-zero HWs)`);

    analysisResult[topic] = {
      overall_performance: overallPerformance.toFixed(2),
      best_performance: {
        score: bestScore.toFixed(2),
        hw_ago: hwAgo,
        indicator: hwAgo > 0 ? `↑ ${hwAgo} HW ago` : 'Current'
      },
      performance_decline: {
        from_best: (latestScore - bestScore).toFixed(2),
        from_previous: scores.length >= 2 ? (latestScore - previousScore).toFixed(2) : '0.00'
      },
      correct: correctPct,
      not_attempted: notAttemptedPct,
      errors: errorPercentages,
      hw_scores: nonZeroHomeworks.reduce((acc, hw) => {
        acc[hw.date] = hw.score.toFixed(2);
        return acc;
      }, {}),
      hw_details: nonZeroHomeworks, // ONLY non-zero homeworks
      trend: trend,
      pattern_details: pattern_details,
      homework_count: nonZeroHomeworks.length, // Count of non-zero only
      unique_homeworks_submitted: topicAttendanceCount,
      test_attendance_pct: testAttendancePct.toFixed(2)
    };
  });

  return analysisResult;
};

  // ============= DATA FETCHING FUNCTIONS =============
  
  const processHomeworkBatch = async (homeworkBatch, validStudentIds, classData, 
                                      topicHomeworkTotalsMap, topicsSet) => {
    const promises = homeworkBatch.map(async (homework) => {
      const homework_code = Array.isArray(homework) ? homework[0] : homework;
      const creation_date = Array.isArray(homework) ? homework[1] : null;
      
      if (!homework_code) return null;
      
      try {
        const [submissionsResponse, questionsResponse] = await Promise.allSettled([
          axiosInstance.get('/homework-details/', { params: { homework_code } }),
          axiosInstance.get('/homework-questions/', { params: { homework_code } })
        ]);
        
        if (submissionsResponse.status !== 'fulfilled' || questionsResponse.status !== 'fulfilled') {
          return null;
        }
        
        const submissions = submissionsResponse.value.data[homework_code] || [];
        const questions = questionsResponse.value.data;
        
        const topicValue = questions.title || homework_code;
        const cleanTopic = topicValue.split('Exercise')[0].trim();
        
        if (cleanTopic) {
          topicsSet.add(cleanTopic);
          if (!topicHomeworkTotalsMap[cleanTopic]) {
            topicHomeworkTotalsMap[cleanTopic] = new Set();
          }
          topicHomeworkTotalsMap[cleanTopic].add(homework_code);
        }
        
        let formattedDate = 'Unknown';
        if (creation_date) {
          try {
            const dt = new Date(creation_date.replace('Z', '+00:00'));
            formattedDate = dt.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            }).replace(/\//g, '-');
          } catch (e) {
            formattedDate = creation_date;
          }
        }
        
        submissions.forEach(submission => {
          const studentId = submission.student_id;
          
          if (!validStudentIds.has(studentId)) return;
          
          const className = detectClassFromStudentId(studentId);
          
          if (!classData[className]) {
            classData[className] = {};
          }
          
          if (!classData[className][studentId]) {
            classData[className][studentId] = [];
          }
          
          const questionsOut = [];
          const resultJson = submission.result_json || {};
          const questionsList = resultJson.questions || [];
          
          questionsList.forEach(qres => {
            questionsOut.push({
              question_id: qres.question_id || qres.question_number || '',
              topic: cleanTopic,
              total_score: qres.total_score || qres.total_marks_obtained || 0,
              max_score: qres.max_score || qres.max_marks || 0,
              answer_category: qres.answer_category || qres.error_type || '',
              concept_required: qres.concept_required || qres.concepts_required || '',
              comment: qres.comment || qres.gap_analysis || '',
              correction_comment: qres.correction_comment || qres.mistakes_made || ''
            });
          });
          
          const existingIndex = classData[className][studentId].findIndex(
            hw => hw.id === homework_code || hw.homework_id === homework_code
          );
          
          const hwData = {
            creation_date: formattedDate,
            date: formattedDate,
            homework_id: homework_code,
            id: homework_code,
            topic: cleanTopic,
            questions: questionsOut,
            submission_id: submission.id
          };
          
          if (existingIndex >= 0) {
            const existing = classData[className][studentId][existingIndex];
            if (!existing.submission_id || submission.id > existing.submission_id) {
              classData[className][studentId][existingIndex] = hwData;
            }
          } else {
            classData[className][studentId].push(hwData);
          }
        });
        
        return { homework_code, processed: true };
      } catch (error) {
        console.debug(`Error processing homework ${homework_code}:`, error);
        return null;
      }
    });
    
    return await Promise.all(promises);
  };

  const fetchAndProcessHomeworkData = async (studentList, initialStudents) => {
    try {
      const validStudentIds = new Set(studentList.map(s => typeof s === 'string' ? s : s.id));
      
      const homeworkListResponse = await axiosInstance.get('/all-homeworks-codes/');
      
      if (!homeworkListResponse.data?.homework_codes) {
        console.log('No homework codes found');
        setStudents(initialStudents);
        setFilteredStudents(initialStudents);
        return;
      }

      const homeworkCodes = homeworkListResponse.data.homework_codes;
      const classData = {};
      const topicHomeworkTotalsMap = {};
      const topicsSet = new Set();

      console.log(`Processing ${homeworkCodes.length} homework assignments`);
      
      // Process in batches
      for (let i = 0; i < homeworkCodes.length; i += BATCH_SIZE) {
        const batch = homeworkCodes.slice(i, i + BATCH_SIZE);
        await processHomeworkBatch(
          batch, 
          validStudentIds, 
          classData, 
          topicHomeworkTotalsMap, 
          topicsSet
        );
        
        console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(homeworkCodes.length / BATCH_SIZE)}`);
      }
      
      const topicCounts = {};
      Object.keys(topicHomeworkTotalsMap).forEach(topic => {
        topicCounts[topic] = topicHomeworkTotalsMap[topic] instanceof Set 
          ? topicHomeworkTotalsMap[topic].size 
          : topicHomeworkTotalsMap[topic];
      });
      
      setTopicHomeworkCounts(topicCounts);
      setAvailableTopics(Array.from(topicsSet).sort());
      
      // Fetch activity data
      const activityDataMap = await fetchAllActivityData(studentList);
      setActivityData(activityDataMap);
      
      // Analyze all students
      const allStudentAnalysis = {};
      
      Object.keys(classData).forEach(className => {
        Object.keys(classData[className]).forEach(studentId => {
          const homeworks = classData[className][studentId];
          const analysis = analyzeStudentPerformance(studentId, homeworks, topicCounts);
          allStudentAnalysis[studentId] = analysis;
        });
      });
      
      setAllAnalysis(allStudentAnalysis);
      setHomeworkData(classData);
      
      // Update students with analyzed data
      const updatedStudents = initialStudents.map(student => {
        const analysis = allStudentAnalysis[student.id];
        const activity = activityDataMap[student.id];
        
        if (analysis && Object.keys(analysis).length > 0) {
          const topics = Object.keys(analysis);
          const overallAvg = topics.reduce((sum, topic) => 
            sum + parseFloat(analysis[topic].overall_performance), 0) / topics.length;
          
          const totalHw = topics.reduce((sum, topic) => 
            sum + analysis[topic].homework_count, 0);
          
          const worstTrend = topics.some(topic => 
            analysis[topic].trend === 'declining') ? 'declining' :
            topics.some(topic => analysis[topic].trend === 'improving') ? 'improving' : 
            topics.some(topic => analysis[topic].trend === 'stagnant') ? 'stagnant' : 'No Data';
          
          return {
            ...student,
            overallPerformance: overallAvg,
            homeworkAttendance: totalHw,
            performanceTrend: worstTrend,
            topics: topics,
            hasData: true,
            analysis: analysis,
            activity: activity || {
              total_active_time: 'N/A',
              total_active_minutes: 0,
              total_sessions: 0,
              last_seen: 'No data',
              engagement_score: 0
            }
          };
        }
        
        return {
          ...student,
          performanceTrend: 'No Data',
          activity: activity || {
            total_active_time: 'N/A',
            total_active_minutes: 0,
            total_sessions: 0,
            last_seen: 'No data',
            engagement_score: 0
          }
        };
      });
      
      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents);
      
      console.log(`Analysis complete: ${Object.keys(allStudentAnalysis).length} students analyzed`);
      
    } catch (error) {
      console.error('Error fetching homework data:', error);
    }
  };

  // ============= INITIAL LOAD =============
  
  const loadInitialData = async () => {
    try {
      setDataLoading(true);
      
      const studentList = normalizedTeacherData.available_students;
      
      if (studentList.length === 0) {
        console.warn('No students found');
        setDataLoading(false);
        return;
      }

      const detectedClassList = detectClassesFromAllStudents(studentList);
      setDetectedClasses(detectedClassList);
      
      // MODIFIED: Set first class as default (no ALL option)
      if (detectedClassList.length > 0) {
        setSelectedClassFilter(detectedClassList[0]);
      }
      
      const initialStudents = studentList.map(studentId => ({
        id: typeof studentId === 'string' ? studentId : studentId.id,
        name: typeof studentId === 'string' ? studentId : studentId.id,
        class: detectClassFromStudentId(typeof studentId === 'string' ? studentId : studentId.id) || 'Unknown',
        overallPerformance: 0,
        performanceTrend: 'No Data',
        homeworkAttendance: 0,
        testAttendance: 0,
        topics: [],
        homeworks: [],
        hasData: false,
        activity: {
          total_active_time: 'N/A',
          total_active_minutes: 0,
          total_sessions: 0,
          last_seen: 'No data',
          engagement_score: 0
        }
      }));
      
      setStudents(initialStudents);
      setFilteredStudents(initialStudents);
      
      await fetchAndProcessHomeworkData(studentList, initialStudents);
      
      setDataLoading(false);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setDataLoading(false);
    }
  };

  // ============= EFFECTS =============
  
  useEffect(() => {
    loadInitialData();
  }, [normalizedTeacherData]);

  // Apply filters
  useEffect(() => {
  let filtered = [...students];
  
  // Always filter by selected class
  filtered = filtered.filter(student => student.class === selectedClassFilter);
  
  // FIXED: Performance trend filter - check student's overall trend
  if (performanceTrend.length > 0) {
    filtered = filtered.filter(student => {
      // For students with no data
      if (!student.analysis || Object.keys(student.analysis).length === 0) {
        return performanceTrend.includes('No Data');
      }
      
      // Check the student's overall performance trend
      return performanceTrend.includes(student.performanceTrend);
    });
  }
  
  if (selectedTopics.length > 0 && selectedTopics.length < availableTopics.length) {
    filtered = filtered.filter(student => 
      student.topics?.some(topic => selectedTopics.includes(topic))
    );
  }
  
  filtered = filtered.filter(student => 
    (student.overallPerformance || 0) <= maxPerformance
  );
  
  if (patternFilter !== 'All') {
    filtered = filtered.filter(student => {
      if (!student.analysis) return false;
      return Object.values(student.analysis).some(topic => 
        topic.pattern_details?.pattern_category === patternFilter
      );
    });
  }
  
  if (sortBy) {
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch(sortBy) {
        case 'studentId':
          return sortOrder === 'highToLow' 
            ? b.id.localeCompare(a.id)
            : a.id.localeCompare(b.id);
        case 'overallPerformance':
          aVal = a.overallPerformance || 0;
          bVal = b.overallPerformance || 0;
          break;
        case 'homeworkAttendance':
          aVal = a.homeworkAttendance || 0;
          bVal = b.homeworkAttendance || 0;
          break;
        case 'activeTime':
          aVal = a.activity?.total_active_minutes || 0;
          bVal = b.activity?.total_active_minutes || 0;
          break;
        default:
          return 0;
      }
      
      if (sortBy !== 'studentId') {
        return sortOrder === 'highToLow' ? bVal - aVal : aVal - bVal;
      }
    });
  }
  
  setFilteredStudents(filtered);
}, [students, selectedClassFilter, performanceTrend, selectedTopics, maxPerformance, sortBy, sortOrder, patternFilter, availableTopics]);

// 2. UPDATED student update logic - Calculate averages only from attempted topics
const updateStudentsWithAnalysis = (initialStudents, allStudentAnalysis, activityDataMap) => {
  return initialStudents.map(student => {
    const analysis = allStudentAnalysis[student.id];
    const activity = activityDataMap[student.id];
    
    if (analysis && Object.keys(analysis).length > 0) {
      // CRITICAL: Filter out topics with 0% overall performance before calculating average
      const attemptedTopics = Object.entries(analysis).filter(([topic, data]) => {
        const performance = parseFloat(data.overall_performance);
        const attendance = parseFloat(data.test_attendance_pct || 0);
        
        // Must have both performance AND attendance > 0
        return performance > 0 && attendance > 0;
      });
      
      console.log(`Student ${student.id}: ${Object.keys(analysis).length} total topics, ${attemptedTopics.length} attempted topics`);
      
      // If no topics have been attempted, treat as No Data
      if (attemptedTopics.length === 0) {
        console.log(`⚠ Student ${student.id} has NO attempted topics - treating as No Data`);
        return {
          ...student,
          overallPerformance: 0,
          homeworkAttendance: 0,
          performanceTrend: 'No Data',
          topics: [],
          hasData: false,
          analysis: {}, // Clear analysis
          activity: activity || {
            total_active_time: 'N/A',
            total_active_minutes: 0,
            total_sessions: 0,
            last_seen: 'No data',
            engagement_score: 0
          }
        };
      }
      
      // Calculate average ONLY from attempted topics
      const topics = attemptedTopics.map(([topic, data]) => topic);
      const overallAvg = attemptedTopics.reduce((sum, [topic, data]) => 
        sum + parseFloat(data.overall_performance), 0) / attemptedTopics.length;
      
      const totalHw = attemptedTopics.reduce((sum, [topic, data]) => 
        sum + data.homework_count, 0);
      
      // Determine worst trend from attempted topics only
      const worstTrend = attemptedTopics.some(([topic, data]) => 
        data.trend === 'declining') ? 'declining' :
        attemptedTopics.some(([topic, data]) => 
        data.trend === 'improving') ? 'improving' : 
        attemptedTopics.some(([topic, data]) => 
        data.trend === 'stagnant') ? 'stagnant' : 'No Data';
      
      console.log(`✓ Student ${student.id}: Avg=${overallAvg.toFixed(2)}%, HW=${totalHw}, Trend=${worstTrend}`);
      
      return {
        ...student,
        overallPerformance: overallAvg,
        homeworkAttendance: totalHw,
        performanceTrend: worstTrend,
        topics: topics,
        hasData: true,
        analysis: analysis, // Keep full analysis for reference
        activity: activity || {
          total_active_time: 'N/A',
          total_active_minutes: 0,
          total_sessions: 0,
          last_seen: 'No data',
          engagement_score: 0
        }
      };
    }
    
    // No analysis available
    return {
      ...student,
      performanceTrend: 'No Data',
      overallPerformance: 0,
      homeworkAttendance: 0,
      topics: [],
      hasData: false,
      analysis: {},
      activity: activity || {
        total_active_time: 'N/A',
        total_active_minutes: 0,
        total_sessions: 0,
        last_seen: 'No data',
        engagement_score: 0
      }
    };
  });
};

// 3. UPDATED fetchStudentDetails - Extra filtering for display
const fetchStudentDetails = (studentId) => {
  const student = students.find(s => s.id === studentId);
  if (student?.analysis) {
    const filteredAnalysis = {};
    
    Object.entries(student.analysis).forEach(([topic, data]) => {
      // CRITICAL: Skip topics with 0% test attendance
      const testAttendance = parseFloat(data.test_attendance_pct || 0);
      if (testAttendance === 0) {
        console.log(`Filtering out ${topic} - 0% attendance`);
        return;
      }
      
      // CRITICAL: Skip topics with 0% overall performance
      if (parseFloat(data.overall_performance) === 0) {
        console.log(`Filtering out ${topic} - 0% performance`);
        return;
      }
      
      // Skip topics with all 0% scores
      const hasNonZeroScore = data.hw_details?.some(hw => parseFloat(hw.score) > 0);
      if (!hasNonZeroScore) {
        console.log(`Filtering out ${topic} - all zero scores`);
        return;
      }
      
      // Apply performance trend filter if set
      if (performanceTrend.length > 0 && !performanceTrend.includes(data.trend)) {
        return;
      }
      
      // Apply topic filter if set
      if (selectedTopics.length > 0 && 
          selectedTopics.length < availableTopics.length && 
          !selectedTopics.includes(topic)) {
        return;
      }
      
      filteredAnalysis[topic] = data;
    });
    
    setStudentDetails({
      id: studentId,
      analysis: filteredAnalysis,
      class: student.class,
      overallPerformance: student.overallPerformance,
      activity: student.activity
    });
  }
};

  const getStats = () => {
    const stats = {
      totalStudents: filteredStudents.length,
      decliningCount: 0,
      improvingCount: 0,
      needsAttention: 0
    };
    
    filteredStudents.forEach(student => {
      if (student.performanceTrend === 'declining') stats.decliningCount++;
      if (student.performanceTrend === 'improving') stats.improvingCount++;
      if (student.overallPerformance < 40) stats.needsAttention++;
    });
    
    return stats;
  };

  const stats = getStats();

  if (dataLoading) {
    return (
      <div className="p-5 bg-gradient-to-br from-[#f0f4f8] to-[#d9e2ec] min-h-[calc(100vh-140px)]">
        <div className="flex flex-col items-center justify-center h-[400px]">
          <div className="w-[60px] h-[60px] border-4 border-gray-200 border-t-[#00A0E3] rounded-full animate-spin"></div>
          <p>Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gradient-to-br from-[#f0f4f8] to-[#d9e2ec] min-h-[calc(100vh-140px)]">
      {/* Header - MODIFIED: Shows current class */}
      <div className="flex justify-between items-center p-5 bg-white rounded-xl mb-5 shadow-sm max-md:flex-col max-md:gap-4">
        <h2><BarChart3 className="w-5 h-5 inline text-[#00A0E3]" /> Student Progress Analysis - Class {selectedClassFilter}</h2>
        <div className="flex gap-3">
          {/* Class selector - Only if multiple classes */}
          {detectedClasses.length > 1 && (
            <select 
              className="px-5 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-semibold bg-white cursor-pointer transition-all min-w-[160px] hover:border-[#00A0E3] focus:outline-none focus:border-[#00A0E3]"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
            >
              {detectedClasses.map(cls => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-5 px-6 py-4 bg-white rounded-xl mb-5 shadow-sm max-md:flex-col max-md:gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-sm text-gray-500 font-medium">Total Students:</span>
          <span className="text-xl font-bold px-3 py-1 rounded-lg bg-gray-100">{stats.totalStudents}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm text-gray-500 font-medium">Declining:</span>
          <span className="text-xl font-bold px-3 py-1 rounded-lg bg-red-100 text-red-600">{stats.decliningCount}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm text-gray-500 font-medium">Improving:</span>
          <span className="text-xl font-bold px-3 py-1 rounded-lg bg-green-100 text-green-600">{stats.improvingCount}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm text-gray-500 font-medium">Critical (&lt;40%):</span>
          <span className="text-xl font-bold px-3 py-1 rounded-lg bg-orange-100 text-orange-500">{stats.needsAttention}</span>
        </div>
      </div>

      {/* Rest of the component remains the same... */}
      {/* Filters Section */}
      <div className="flex gap-5 mb-5 max-lg:flex-col">
        <div className="flex-1 bg-white p-5 rounded-xl shadow-sm border-2 border-[#00A0E3]">
          <label className="block text-[11px] font-bold text-gray-500 mb-2.5 uppercase tracking-wide">PERFORMANCE TREND</label>
          <div className="relative">
            <div 
              className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg cursor-pointer flex justify-between items-center transition-all text-sm font-medium hover:border-[#00A0E3] hover:bg-white"
              onClick={(e) => {
                e.currentTarget.nextElementSibling.classList.toggle('show');
              }}
            >
              {performanceTrend.length === 0 ? 'Select trends...' : 
              performanceTrend.length === 1 ? performanceTrend[0] :
              `${performanceTrend.length} selected`}
              <span className="text-gray-500 transition-transform">▼</span>
            </div>
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border-2 border-gray-200 rounded-lg max-h-[200px] overflow-y-auto z-[1000] hidden shadow-lg">
              {['declining', 'stagnant', 'improving', 'No Data'].map(trend => (
                <label key={trend} className="flex items-center px-4 py-2.5 cursor-pointer transition-colors text-sm hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={performanceTrend.includes(trend)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPerformanceTrend([...performanceTrend, trend]);
                      } else {
                        setPerformanceTrend(performanceTrend.filter(t => t !== trend));
                      }
                    }}
                  />
                  <span>{trend.charAt(0).toUpperCase() + trend.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white p-5 rounded-xl shadow-sm border-2 border-[#00A0E3]">
          <label className="block text-[11px] font-bold text-gray-500 mb-2.5 uppercase tracking-wide">TOPICS</label>
          <div className="relative">
            <div 
              className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg cursor-pointer flex justify-between items-center transition-all text-sm font-medium hover:border-[#00A0E3] hover:bg-white"
              onClick={(e) => {
                e.currentTarget.nextElementSibling.classList.toggle('show');
              }}
            >
              {selectedTopics.length === 0 || selectedTopics.length === availableTopics.length ? 
              'All Topics Selected' : 
              selectedTopics.length === 1 ? selectedTopics[0] :
              `${selectedTopics.length} selected`}
              <span className="text-gray-500 transition-transform">▼</span>
            </div>
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border-2 border-gray-200 rounded-lg max-h-[250px] overflow-y-auto z-[1000] hidden shadow-lg">
              {availableTopics.map(topic => (
                <label key={topic} className="flex items-center px-4 py-2.5 cursor-pointer transition-colors text-sm hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedTopics.length === 0 || selectedTopics.includes(topic)}
                    onChange={(e) => {
                      if (selectedTopics.length === 0) {
                        setSelectedTopics(availableTopics.filter(t => t !== topic));
                      } else if (e.target.checked) {
                        const newSelected = [...selectedTopics, topic];
                        if (newSelected.length === availableTopics.length) {
                          setSelectedTopics([]);
                        } else {
                          setSelectedTopics(newSelected);
                        }
                      } else {
                        setSelectedTopics(selectedTopics.filter(t => t !== topic));
                      }
                    }}
                  />
                  <span className="text-[13px] overflow-hidden text-ellipsis whitespace-nowrap">{topic}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="flex gap-5 mb-5 max-lg:flex-col">
        <div className="flex-1 bg-white px-5 py-4 rounded-xl shadow-sm">
          <label className="block text-[11px] font-bold text-gray-500 mb-2.5 uppercase tracking-wide">MAX PERFORMANCE</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={maxPerformance}
              onChange={(e) => setMaxPerformance(Number(e.target.value))}
              className="flex-1 appearance-none h-1.5 bg-gray-200 rounded-full outline-none accent-[#00A0E3]"
            />
            <span className="text-2xl font-bold text-[#00A0E3] min-w-[50px] text-center">{maxPerformance}</span>
            <span className="text-base text-gray-500 font-semibold">%</span>
          </div>
        </div>

        <div className="flex-1 bg-white px-5 py-4 rounded-xl shadow-sm">
          <label className="block text-[11px] font-bold text-gray-500 mb-2.5 uppercase tracking-wide">SORT BY</label>
          <select 
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium bg-white cursor-pointer transition-all hover:border-[#00A0E3] focus:outline-none focus:border-[#00A0E3]"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="studentId">Student ID</option>
            <option value="overallPerformance">Performance</option>
            <option value="homeworkAttendance">Attendance</option>
            <option value="activeTime">Active Time</option>
          </select>
        </div>

        <div className="flex-1 bg-white px-5 py-4 rounded-xl shadow-sm">
          <label className="block text-[11px] font-bold text-gray-500 mb-2.5 uppercase tracking-wide">ORDER</label>
          <select 
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium bg-white cursor-pointer transition-all hover:border-[#00A0E3] focus:outline-none focus:border-[#00A0E3]"
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="lowToHigh">Low to High</option>
            <option value="highToLow">High to Low</option>
          </select>
        </div>

        <div className="flex-1 bg-white px-5 py-4 rounded-xl shadow-sm">
          <label className="block text-[11px] font-bold text-gray-500 mb-2.5 uppercase tracking-wide">PATTERN</label>
          <select 
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-medium bg-white cursor-pointer transition-all hover:border-[#00A0E3] focus:outline-none focus:border-[#00A0E3]"
            value={patternFilter} 
            onChange={(e) => setPatternFilter(e.target.value)}
          >
            <option value="All">All Patterns</option>
            <option value="Sharp decline">Sharp decline</option>
            <option value="Gradual decline">Gradual decline</option>
            <option value="Inconsistent performance">Inconsistent</option>
          </select>
        </div>
      </div>

      {/* Student Selection Section */}
      <div className="bg-white p-5 rounded-xl mb-5 shadow-sm">
        <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">SELECT STUDENT:</label>
        <select 
          className="w-full px-4 py-3 border-2 border-[#00A0E3] rounded-lg text-sm font-medium bg-white cursor-pointer transition-all mb-4 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00A0E3]/20"
          value={selectedStudent || ''}
          onChange={(e) => {
            setSelectedStudent(e.target.value);
            fetchStudentDetails(e.target.value);
          }}
        >
          <option value="">Choose a student...</option>
          {filteredStudents.map(student => (
            <option key={student.id} value={student.id}>
              {student.id} - {student.overallPerformance?.toFixed(1)}% 
              {student.performanceTrend === 'declining' ? ' [↓]' :
              student.performanceTrend === 'improving' ? ' [↑]' : ' [—]'}
            </option>
          ))}
        </select>
        
        {/* Quick Student Cards */}
        <div className="flex gap-3 flex-wrap max-md:flex-col">
          {filteredStudents.slice(0, 5).map(student => (
            <div
              key={student.id}
              className={`flex-1 min-w-[140px] max-w-[180px] p-4 border-2 rounded-xl cursor-pointer transition-all relative overflow-hidden hover:-translate-y-0.5 hover:shadow-md hover:border-[#00A0E3] max-md:max-w-full ${selectedStudent === student.id ? 'bg-gradient-to-br from-[#00A0E3] to-[#0080B8] text-white border-transparent' : 'bg-white border-gray-200'} ${student.performanceTrend === 'declining' ? 'border-l-4 border-l-red-500' : student.performanceTrend === 'improving' ? 'border-l-4 border-l-green-500' : student.performanceTrend === 'stagnant' ? 'border-l-4 border-l-orange-400' : ''}`}
              onClick={() => {
                setSelectedStudent(student.id);
                fetchStudentDetails(student.id);
              }}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">{student.id}</span>
                <span className="bg-black/10 px-2 py-1 rounded-md font-bold text-xs">{student.overallPerformance?.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Details Section - Shows only topics with attempts */}
      {studentDetails && (
        <div className="animate-[fadeInUp_0.4s_ease]">
          <div className="bg-white px-6 py-5 rounded-xl mb-5 shadow-sm">
            <h3><User className="w-5 h-5 inline text-[#00A0E3]" /> STUDENT: {studentDetails.id}</h3>
            <div className="flex gap-8 text-sm text-gray-500">
              <span>Total Active <Clock className="w-4 h-4 inline text-[#00A0E3]" /> <strong>{studentDetails.activity?.total_active_time || 'N/A'}</strong></span>
              <span><BarChart3 className="w-4 h-4 inline text-[#00A0E3]" /> <strong>{studentDetails.activity?.total_sessions || 0}</strong> sessions</span>
              <span>Last-Active <Eye className="w-4 h-4 inline text-[#00A0E3]" /> <strong>{studentDetails.activity?.last_seen || 'No data'}</strong></span>
            </div>
          </div>

          {Object.keys(studentDetails.analysis).length > 0 ? (
            Object.entries(studentDetails.analysis).map(([topic, data]) => (
              <div key={topic} className="bg-white rounded-xl p-6 mb-5 shadow-sm border-2 border-transparent transition-all relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-gradient-to-r before:from-[#00A0E3] before:to-[#0080B8] hover:border-[#00A0E3] hover:-translate-y-0.5">
                <div className="flex justify-between items-center mb-4">
                  <h4>CHAPTER {topic.replace('Mathematics - ', '')}</h4>
                  <span className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${data.trend === 'declining' ? 'bg-red-100 text-red-700' : data.trend === 'improving' ? 'bg-green-100 text-green-800' : data.trend === 'stagnant' ? 'bg-orange-100 text-yellow-800' : 'bg-purple-100 text-purple-700'}`}>
                    {data.trend.toUpperCase().replace('-', ' ')}
                  </span>
                </div>
                
                {data.pattern_details?.pattern && (
                  <div className="italic text-gray-500 text-[13px] mb-5 px-3 py-2 bg-gray-50 rounded-md">
                    Pattern: {data.pattern_details.pattern}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 mb-6 max-lg:grid-cols-1">
                  <div className="text-center p-5 bg-gray-50 rounded-xl border border-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <label>OVERALL PERFORMANCE</label>
                    <div className="text-3xl font-extrabold text-gray-800">{data.overall_performance}%</div>
                  </div>
                  <div className="text-center p-5 bg-gray-50 rounded-xl border border-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <label>BEST SCORE</label>
                    <div className="text-3xl font-extrabold bg-gradient-to-br from-yellow-400 to-orange-400 bg-clip-text text-transparent">{data.best_performance.score}%</div>
                    <span className="block text-[11px] text-gray-500 mt-1 font-semibold">{data.best_performance.indicator}</span>
                  </div>
                  <div className="text-center p-5 bg-gray-50 rounded-xl border border-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <label>TEST ATTENDANCE</label>
                    <div className="text-3xl font-extrabold text-gray-800">{data.test_attendance_pct}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 [&_h5]:m-0 [&_h5]:mb-4 [&_h5]:text-xs [&_h5]:font-bold [&_h5]:text-[#00A0E3] [&_h5]:uppercase [&_h5]:tracking-wide">
                    <h5>PERFORMANCE METRICS:</h5>
                    <ul className="list-none p-0 m-0 [&_li]:py-1.5 [&_li]:text-[13px] [&_li]:text-gray-600">
                      <li>Current vs Average: {data.pattern_details?.current_vs_avg}%</li>
                      <li>Lowest Score: {data.pattern_details?.lowest_score}%</li>
                      <li className="!text-green-800 !font-semibold">✓ Perfect-Score: {data.correct}%</li>
                      <li className="!text-red-700 !font-semibold">• Q.Not Attempt: {data.not_attempted}%</li>
                    </ul>
                    
                    {Object.keys(data.errors).length > 0 && (
                      <>
                        <h5>ERROR DISTRIBUTION:</h5>
                        {Object.entries(data.errors).map(([errorType, percentage]) => (
                          <div key={errorType} className="mb-3">
                            <span className="block text-xs text-gray-600 mb-1 font-semibold">{errorType}: {percentage}%</span>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-pink-400 to-[#00A0E3] rounded-full transition-all duration-500" style={{width: `${percentage}%`}}></div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 [&_h5]:m-0 [&_h5]:mb-4 [&_h5]:text-xs [&_h5]:font-bold [&_h5]:text-[#00A0E3] [&_h5]:uppercase [&_h5]:tracking-wide">
                    <h5>HOMEWORK SCORES TIMELINE:</h5>
                    <table className="w-full border-separate border-spacing-y-2 [&_th]:p-2.5 [&_th]:text-[10px] [&_th]:font-bold [&_th]:text-gray-500 [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-left [&_td]:p-2.5 [&_td]:text-[13px] [&_td]:text-gray-600 [&_td]:bg-white [&_td]:border [&_td]:border-gray-200">
                      <thead>
                        <tr>
                          <th>DATE</th>
                          <th>HW ID</th>
                          <th>SCORE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.hw_details?.map((hw, idx) => (
                          <tr key={idx}>
                            <td>{hw.date}</td>
                            <td>{hw.hw_id}</td>
                            <td>
                              <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${hw.score >= 80 ? 'bg-green-100 text-green-800' : hw.score >= 60 ? 'bg-orange-100 text-yellow-800' : 'bg-red-100 text-red-700'}`}>
                                {hw.score.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No homework submissions found for this student.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!studentDetails && (
        <div className="text-center px-10 py-20 bg-white rounded-xl shadow-sm [&_h3]:m-0 [&_h3]:mb-2.5 [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-gray-800 [&_p]:m-0 [&_p]:text-base [&_p]:text-gray-500">
          <div className="text-7xl mb-5 opacity-30"><BarChart3 className="w-16 h-16 inline text-[#00A0E3]" /></div>
          <h3>No Student Selected</h3>
          <p>Select a student from the dropdown above to view their detailed progress analysis</p>
        </div>
      )}
    </div>
  );
};

export default ProgressTab;