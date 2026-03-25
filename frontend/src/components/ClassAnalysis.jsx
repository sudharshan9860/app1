// ClassAnalysis.jsx - Complete with Mock Data for All Classes and Time Periods

import React, { useState } from 'react';
import { Trophy, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ClassAnalysis = ({ selectedClass, classesData, onClassChange }) => {
  const [classAnalysisTab, setClassAnalysisTab] = useState('overview');
  const [selectedChapter, setSelectedChapter] = useState('All Chapters');
  const [trendPeriod, setTrendPeriod] = useState('1M'); // Added state for trend period
  
  // New state for Submitted Results filters
  const [dateFilter, setDateFilter] = useState('');
  const [submissionFilter, setSubmissionFilter] = useState('all'); // all, homework, classwork

  // Mock data for all classes
  const classSpecificData = {
    'Class 6th': {
      studentPerformance: [
        { student: '6HPS01', homeworkAverage: 75, classworkAverage: 70 },
        { student: '6HPS02', homeworkAverage: 82, classworkAverage: 78 },
        { student: '6HPS03', homeworkAverage: 68, classworkAverage: 72 },
        { student: '6HPS04', homeworkAverage: 90, classworkAverage: 85 },
        { student: '6HPS05', homeworkAverage: 73, classworkAverage: 80 }
      ],
      summary: { totalStudents: 5, averageScore: 78, assignments: 10, completionRate: 95 },
      topPerformers: [
        { student: '6HPS04', average: 88 },
        { student: '6HPS02', average: 80 },
        { student: '6HPS05', average: 76 },
        { student: '6HPS01', average: 72 },
        { student: '6HPS03', average: 70 }
      ],
      submittedResults: [
        { studentId: '6HPS01', marks: 75, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-10' },
        { studentId: '6HPS02', marks: 82, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-10' },
        { studentId: '6HPS03', marks: 68, homeworkSubmitted: false, classworkSubmitted: true, date: '2025-08-11' },
        { studentId: '6HPS04', marks: 90, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-11' },
        { studentId: '6HPS05', marks: 73, homeworkSubmitted: true, classworkSubmitted: false, date: '2025-08-12' }
      ]
    },
    'Class 7th': {
      studentPerformance: [
        { student: '7HPS11', homeworkAverage: 65, classworkAverage: 60 },
        { student: '7HPS12', homeworkAverage: 72, classworkAverage: 68 },
        { student: '7HPS13', homeworkAverage: 78, classworkAverage: 82 },
        { student: '7HPS14', homeworkAverage: 85, classworkAverage: 80 },
        { student: '7HPS15', homeworkAverage: 70, classworkAverage: 75 }
      ],
      summary: { totalStudents: 5, averageScore: 74, assignments: 11, completionRate: 88 },
      topPerformers: [
        { student: '7HPS14', average: 82 },
        { student: '7HPS13', average: 80 },
        { student: '7HPS15', average: 72 },
        { student: '7HPS12', average: 70 },
        { student: '7HPS11', average: 62 }
      ],
      submittedResults: [
        { studentId: '7HPS11', marks: 65, homeworkSubmitted: true, classworkSubmitted: false, date: '2025-08-10' },
        { studentId: '7HPS12', marks: 72, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-10' },
        { studentId: '7HPS13', marks: 78, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-11' },
        { studentId: '7HPS14', marks: 85, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-11' },
        { studentId: '7HPS15', marks: 70, homeworkSubmitted: false, classworkSubmitted: true, date: '2025-08-12' }
      ]
    },
    'Class 8th': {
      studentPerformance: [
        { student: '8HPS21', homeworkAverage: 70, classworkAverage: 65 },
        { student: '8HPS22', homeworkAverage: 88, classworkAverage: 85 },
        { student: '8HPS23', homeworkAverage: 75, classworkAverage: 78 },
        { student: '8HPS24', homeworkAverage: 92, classworkAverage: 90 },
        { student: '8HPS25', homeworkAverage: 80, classworkAverage: 82 }
      ],
      summary: { totalStudents: 5, averageScore: 81, assignments: 13, completionRate: 90 },
      topPerformers: [
        { student: '8HPS24', average: 91 },
        { student: '8HPS22', average: 86 },
        { student: '8HPS25', average: 81 },
        { student: '8HPS23', average: 76 },
        { student: '8HPS21', average: 67 }
      ],
      submittedResults: [
        { studentId: '8HPS21', marks: 70, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-10' },
        { studentId: '8HPS22', marks: 88, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-10' },
        { studentId: '8HPS23', marks: 75, homeworkSubmitted: true, classworkSubmitted: false, date: '2025-08-11' },
        { studentId: '8HPS24', marks: 92, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-11' },
        { studentId: '8HPS25', marks: 80, homeworkSubmitted: false, classworkSubmitted: true, date: '2025-08-12' }
      ]
    },
    'Class 9th': {
      studentPerformance: [
        { student: '9HPS31', homeworkAverage: 60, classworkAverage: 55 },
        { student: '9HPS32', homeworkAverage: 75, classworkAverage: 70 },
        { student: '9HPS33', homeworkAverage: 82, classworkAverage: 85 },
        { student: '9HPS34', homeworkAverage: 68, classworkAverage: 72 },
        { student: '9HPS35', homeworkAverage: 77, classworkAverage: 75 }
      ],
      summary: { totalStudents: 5, averageScore: 72, assignments: 14, completionRate: 85 },
      topPerformers: [
        { student: '9HPS33', average: 83 },
        { student: '9HPS35', average: 76 },
        { student: '9HPS32', average: 72 },
        { student: '9HPS34', average: 70 },
        { student: '9HPS31', average: 57 }
      ],
      submittedResults: [
        { studentId: '9HPS31', marks: 60, homeworkSubmitted: false, classworkSubmitted: true, date: '2025-08-10' },
        { studentId: '9HPS32', marks: 75, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-10' },
        { studentId: '9HPS33', marks: 82, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-11' },
        { studentId: '9HPS34', marks: 68, homeworkSubmitted: true, classworkSubmitted: false, date: '2025-08-11' },
        { studentId: '9HPS35', marks: 77, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-12' }
      ]
    },
    'Class 10th': {
      studentPerformance: [
        { student: '10HPS20', homeworkAverage: 55, classworkAverage: 49 },
        { student: '10HPS19', homeworkAverage: 57, classworkAverage: 76 },
        { student: '10HPS18', homeworkAverage: 62, classworkAverage: 27 },
        { student: '10HPS21', homeworkAverage: 69, classworkAverage: 70 },
        { student: '10HPS17', homeworkAverage: 67, classworkAverage: 33 }
      ],
      summary: { totalStudents: 5, averageScore: 85, assignments: 12, completionRate: 92 },
      topPerformers: [
        { student: '10HPS21', average: 58 },
        { student: '10HPS19', average: 52 },
        { student: '10HPS20', average: 48 },
        { student: '10HPS17', average: 46 },
        { student: '10HPS18', average: 42 }
      ],
      submittedResults: [
        { studentId: '10HPS17', marks: 67, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-10' },
        { studentId: '10HPS18', marks: 42, homeworkSubmitted: true, classworkSubmitted: false, date: '2025-08-10' },
        { studentId: '10HPS19', marks: 52, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-11' },
        { studentId: '10HPS20', marks: 48, homeworkSubmitted: false, classworkSubmitted: true, date: '2025-08-11' },
        { studentId: '10HPS21', marks: 58, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-12' }
      ]
    },
    'Class 11th': {
      studentPerformance: [
        { student: '11HPS41', homeworkAverage: 80, classworkAverage: 85 },
        { student: '11HPS42', homeworkAverage: 75, classworkAverage: 72 },
        { student: '11HPS43', homeworkAverage: 88, classworkAverage: 90 },
        { student: '11HPS44', homeworkAverage: 70, classworkAverage: 68 },
        { student: '11HPS45', homeworkAverage: 82, classworkAverage: 80 }
      ],
      summary: { totalStudents: 5, averageScore: 79, assignments: 15, completionRate: 87 },
      topPerformers: [
        { student: '11HPS43', average: 89 },
        { student: '11HPS41', average: 82 },
        { student: '11HPS45', average: 81 },
        { student: '11HPS42', average: 73 },
        { student: '11HPS44', average: 69 }
      ],
      submittedResults: [
        { studentId: '11HPS41', marks: 80, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-10' },
        { studentId: '11HPS42', marks: 75, homeworkSubmitted: true, classworkSubmitted: false, date: '2025-08-10' },
        { studentId: '11HPS43', marks: 88, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-11' },
        { studentId: '11HPS44', marks: 70, homeworkSubmitted: false, classworkSubmitted: true, date: '2025-08-11' },
        { studentId: '11HPS45', marks: 82, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-12' }
      ]
    },
    'Class 12th': {
      studentPerformance: [
        { student: '12HPS51', homeworkAverage: 85, classworkAverage: 88 },
        { student: '12HPS52', homeworkAverage: 90, classworkAverage: 92 },
        { student: '12HPS53', homeworkAverage: 78, classworkAverage: 75 },
        { student: '12HPS54', homeworkAverage: 95, classworkAverage: 93 },
        { student: '12HPS55', homeworkAverage: 83, classworkAverage: 85 }
      ],
      summary: { totalStudents: 5, averageScore: 86, assignments: 16, completionRate: 94 },
      topPerformers: [
        { student: '12HPS54', average: 94 },
        { student: '12HPS52', average: 91 },
        { student: '12HPS51', average: 86 },
        { student: '12HPS55', average: 84 },
        { student: '12HPS53', average: 76 }
      ],
      submittedResults: [
        { studentId: '12HPS51', marks: 85, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-10' },
        { studentId: '12HPS52', marks: 90, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-10' },
        { studentId: '12HPS53', marks: 78, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-11' },
        { studentId: '12HPS54', marks: 95, homeworkSubmitted: true, classworkSubmitted: true, date: '2025-08-11' },
        { studentId: '12HPS55', marks: 83, homeworkSubmitted: true, classworkSubmitted: false, date: '2025-08-12' }
      ]
    }
  };

  // Comprehensive mock data for different time periods for ALL classes - UNIQUE DATA FOR EACH CLASS AND PERIOD
  const getTrendDataForClass = (className) => {
    const trendDataTemplates = {
      'Class 6th': {
        '1D': [ // 1 Day - hourly (High performing class)
          [88, 89, 90, 91, 92], // Student 1
          [94, 95, 95, 96, 96], // Student 2
          [85, 86, 87, 88, 88], // Student 3
          [91, 92, 93, 94, 95], // Student 4
          [83, 84, 85, 86, 87]  // Student 5
        ],
        '5D': [ // 5 Days - Steady improvement
          [85, 86, 88, 90, 92],
          [92, 93, 94, 95, 96],
          [82, 83, 85, 87, 88],
          [89, 90, 91, 93, 95],
          [80, 81, 83, 85, 87]
        ],
        '10D': [ // 10 Days - Gradual growth
          [80, 81, 82, 84, 85, 86, 87, 89, 90, 92],
          [88, 89, 90, 91, 92, 93, 94, 95, 95, 96],
          [78, 79, 80, 81, 82, 83, 85, 86, 87, 88],
          [85, 86, 87, 88, 89, 90, 91, 92, 93, 95],
          [76, 77, 78, 79, 80, 81, 82, 84, 85, 87]
        ],
        '15D': [ // 15 Days - Consistent progress
          [75, 78, 80, 82, 84, 86, 88, 90, 92],
          [85, 87, 89, 91, 92, 93, 94, 95, 96],
          [73, 75, 77, 79, 81, 83, 85, 87, 88],
          [82, 84, 86, 88, 89, 90, 92, 94, 95],
          [71, 73, 75, 77, 79, 81, 83, 85, 87]
        ],
        '1M': [ // 1 Month - Weekly jumps
          [70, 78, 85, 92],
          [80, 87, 92, 96],
          [68, 75, 82, 88],
          [77, 84, 90, 95],
          [65, 72, 80, 87]
        ],
        'MAX': [ // 6 Months - Long term growth
          [60, 68, 75, 82, 88, 92],
          [70, 77, 84, 89, 93, 96],
          [58, 65, 72, 79, 85, 88],
          [67, 74, 81, 87, 92, 95],
          [55, 62, 69, 76, 83, 87]
        ]
      },
      'Class 7th': {
        '1D': [ // More variable performance
          [72, 74, 73, 75, 76],
          [68, 70, 71, 72, 73],
          [80, 81, 82, 83, 84],
          [64, 65, 66, 67, 68],
          [76, 77, 78, 79, 80]
        ],
        '5D': [ // Moderate improvement
          [70, 71, 73, 75, 76],
          [66, 67, 69, 71, 73],
          [78, 79, 81, 83, 84],
          [62, 63, 65, 67, 68],
          [74, 75, 77, 79, 80]
        ],
        '10D': [ // Steady but slower growth
          [68, 69, 70, 71, 72, 73, 74, 75, 75, 76],
          [64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
          [76, 77, 78, 79, 80, 81, 82, 83, 83, 84],
          [60, 61, 62, 63, 64, 65, 66, 67, 67, 68],
          [72, 73, 74, 75, 76, 77, 78, 79, 79, 80]
        ],
        '15D': [ // Mixed progress
          [65, 67, 69, 71, 72, 73, 74, 75, 76],
          [61, 63, 65, 67, 68, 69, 71, 72, 73],
          [73, 75, 77, 79, 80, 81, 82, 83, 84],
          [57, 59, 61, 63, 64, 65, 66, 67, 68],
          [69, 71, 73, 75, 76, 77, 78, 79, 80]
        ],
        '1M': [ // Variable weekly progress
          [62, 68, 72, 76],
          [58, 64, 69, 73],
          [70, 76, 80, 84],
          [54, 60, 64, 68],
          [66, 72, 76, 80]
        ],
        'MAX': [ // Moderate long-term gains
          [55, 60, 65, 70, 73, 76],
          [51, 56, 61, 66, 70, 73],
          [63, 68, 73, 78, 81, 84],
          [47, 52, 57, 62, 65, 68],
          [59, 64, 69, 74, 77, 80]
        ]
      },
      'Class 8th': {
        '1D': [ // Strong morning performance
          [82, 84, 85, 83, 84],
          [78, 80, 81, 82, 83],
          [86, 87, 88, 89, 90],
          [75, 76, 77, 78, 79],
          [80, 81, 82, 83, 84]
        ],
        '5D': [ // Good weekly progress
          [80, 81, 83, 84, 84],
          [76, 77, 79, 81, 83],
          [84, 85, 87, 89, 90],
          [73, 74, 76, 78, 79],
          [78, 79, 81, 83, 84]
        ],
        '10D': [ // Consistent improvement
          [78, 79, 80, 81, 81, 82, 82, 83, 84, 84],
          [74, 75, 76, 77, 78, 79, 80, 81, 82, 83],
          [82, 83, 84, 85, 86, 87, 88, 89, 89, 90],
          [71, 72, 73, 74, 75, 76, 77, 78, 78, 79],
          [76, 77, 78, 79, 80, 81, 82, 83, 83, 84]
        ],
        '15D': [ // Strong finish
          [75, 77, 79, 80, 81, 82, 83, 84, 84],
          [71, 73, 75, 77, 78, 79, 81, 82, 83],
          [79, 81, 83, 85, 86, 87, 88, 89, 90],
          [68, 70, 72, 74, 75, 76, 77, 78, 79],
          [73, 75, 77, 79, 80, 81, 82, 83, 84]
        ],
        '1M': [ // Solid monthly gains
          [72, 77, 81, 84],
          [68, 73, 78, 83],
          [76, 81, 86, 90],
          [65, 70, 75, 79],
          [70, 75, 80, 84]
        ],
        'MAX': [ // Strong semester performance
          [65, 70, 75, 79, 82, 84],
          [61, 66, 71, 76, 80, 83],
          [69, 74, 79, 84, 87, 90],
          [58, 63, 68, 73, 77, 79],
          [63, 68, 73, 78, 81, 84]
        ]
      },
      'Class 9th': {
        '1D': [ // Variable daily performance
          [65, 67, 66, 68, 69],
          [71, 72, 73, 74, 75],
          [58, 59, 60, 61, 62],
          [77, 78, 79, 80, 81],
          [63, 64, 65, 66, 67]
        ],
        '5D': [ // Mid-week dip pattern
          [63, 64, 62, 66, 69],
          [69, 70, 68, 72, 75],
          [56, 57, 55, 59, 62],
          [75, 76, 74, 78, 81],
          [61, 62, 60, 64, 67]
        ],
        '10D': [ // Fluctuating progress
          [61, 62, 63, 62, 64, 65, 66, 67, 68, 69],
          [67, 68, 69, 70, 71, 72, 73, 74, 74, 75],
          [54, 55, 56, 55, 57, 58, 59, 60, 61, 62],
          [73, 74, 75, 76, 77, 78, 79, 80, 80, 81],
          [59, 60, 61, 60, 62, 63, 64, 65, 66, 67]
        ],
        '15D': [ // Recovery pattern
          [58, 60, 61, 63, 64, 65, 66, 68, 69],
          [64, 66, 67, 69, 70, 71, 72, 74, 75],
          [51, 53, 54, 56, 57, 58, 59, 61, 62],
          [70, 72, 73, 75, 76, 77, 78, 80, 81],
          [56, 58, 59, 61, 62, 63, 64, 66, 67]
        ],
        '1M': [ // Challenging month
          [55, 60, 65, 69],
          [61, 66, 71, 75],
          [48, 53, 58, 62],
          [67, 72, 77, 81],
          [53, 58, 63, 67]
        ],
        'MAX': [ // Semester struggle and recovery
          [50, 52, 57, 62, 66, 69],
          [56, 58, 63, 68, 72, 75],
          [43, 45, 50, 55, 59, 62],
          [62, 64, 69, 74, 78, 81],
          [48, 50, 55, 60, 64, 67]
        ]
      },
      'Class 10th': {
        '1D': [ // Board exam pressure showing
          [55, 57, 58, 56, 58],
          [50, 51, 52, 53, 52],
          [46, 47, 48, 49, 48],
          [69, 70, 71, 70, 69],
          [40, 41, 42, 43, 42]
        ],
        '5D': [ // Stress patterns visible
          [54, 56, 57, 58, 58],
          [48, 50, 51, 52, 52],
          [45, 46, 47, 48, 48],
          [67, 68, 69, 70, 69],
          [38, 40, 41, 42, 42]
        ],
        '10D': [ // Slow improvement
          [52, 53, 54, 55, 56, 56, 57, 57, 58, 58],
          [46, 47, 48, 49, 50, 50, 51, 51, 52, 52],
          [43, 44, 45, 45, 46, 46, 47, 47, 48, 48],
          [65, 66, 67, 68, 68, 69, 69, 70, 70, 69],
          [36, 37, 38, 39, 40, 40, 41, 41, 42, 42]
        ],
        '15D': [ // Exam preparation impact
          [50, 52, 54, 55, 56, 57, 58, 58],
          [44, 46, 48, 49, 50, 51, 52, 52],
          [41, 43, 44, 45, 46, 47, 48, 48],
          [63, 65, 67, 68, 69, 70, 70, 69],
          [34, 36, 38, 39, 40, 41, 42, 42]
        ],
        '1M': [ // Monthly stress cycle
          [48, 52, 55, 58],
          [42, 46, 49, 52],
          [39, 43, 45, 48],
          [61, 65, 68, 69],
          [32, 36, 39, 42]
        ],
        'MAX': [ // Year-long preparation arc
          [40, 45, 48, 52, 55, 58],
          [35, 40, 43, 47, 50, 52],
          [32, 36, 40, 43, 45, 48],
          [55, 60, 63, 66, 68, 69],
          [25, 30, 34, 37, 40, 42]
        ]
      },
      'Class 11th': {
        '1D': [ // Science stream challenges
          [73, 74, 75, 76, 77],
          [69, 70, 71, 72, 73],
          [81, 82, 83, 84, 85],
          [65, 66, 67, 68, 69],
          [77, 78, 79, 80, 81]
        ],
        '5D': [ // Weekly workload impact
          [71, 72, 74, 76, 77],
          [67, 68, 70, 72, 73],
          [79, 80, 82, 84, 85],
          [63, 64, 66, 68, 69],
          [75, 76, 78, 80, 81]
        ],
        '10D': [ // Adaptation period
          [69, 70, 71, 72, 73, 74, 75, 76, 76, 77],
          [65, 66, 67, 68, 69, 70, 71, 72, 72, 73],
          [77, 78, 79, 80, 81, 82, 83, 84, 84, 85],
          [61, 62, 63, 64, 65, 66, 67, 68, 68, 69],
          [73, 74, 75, 76, 77, 78, 79, 80, 80, 81]
        ],
        '15D': [ // Mid-term recovery
          [66, 68, 70, 72, 73, 74, 75, 76, 77],
          [62, 64, 66, 68, 69, 70, 71, 72, 73],
          [74, 76, 78, 80, 81, 82, 83, 84, 85],
          [58, 60, 62, 64, 65, 66, 67, 68, 69],
          [70, 72, 74, 76, 77, 78, 79, 80, 81]
        ],
        '1M': [ // Competitive exam prep
          [63, 68, 73, 77],
          [59, 64, 69, 73],
          [71, 76, 81, 85],
          [55, 60, 65, 69],
          [67, 72, 77, 81]
        ],
        'MAX': [ // JEE/NEET preparation impact
          [58, 62, 66, 70, 74, 77],
          [54, 58, 62, 66, 70, 73],
          [66, 70, 74, 78, 82, 85],
          [50, 54, 58, 62, 66, 69],
          [62, 66, 70, 74, 78, 81]
        ]
      },
      'Class 12th': {
        '1D': [ // Peak performance period
          [87, 88, 89, 90, 91],
          [83, 84, 85, 86, 87],
          [92, 93, 94, 95, 96],
          [79, 80, 81, 82, 83],
          [89, 90, 91, 92, 93]
        ],
        '5D': [ // Consistent excellence
          [85, 86, 88, 90, 91],
          [81, 82, 84, 86, 87],
          [90, 91, 93, 95, 96],
          [77, 78, 80, 82, 83],
          [87, 88, 90, 92, 93]
        ],
        '10D': [ // Final year momentum
          [83, 84, 85, 86, 87, 88, 89, 90, 90, 91],
          [79, 80, 81, 82, 83, 84, 85, 86, 86, 87],
          [88, 89, 90, 91, 92, 93, 94, 95, 95, 96],
          [75, 76, 77, 78, 79, 80, 81, 82, 82, 83],
          [85, 86, 87, 88, 89, 90, 91, 92, 92, 93]
        ],
        '15D': [ // Board exam excellence
          [80, 82, 84, 86, 87, 88, 89, 90, 91],
          [76, 78, 80, 82, 83, 84, 85, 86, 87],
          [85, 87, 89, 91, 92, 93, 94, 95, 96],
          [72, 74, 76, 78, 79, 80, 81, 82, 83],
          [82, 84, 86, 88, 89, 90, 91, 92, 93]
        ],
        '1M': [ // Final preparation phase
          [77, 82, 87, 91],
          [73, 78, 83, 87],
          [82, 87, 92, 96],
          [69, 74, 79, 83],
          [79, 84, 89, 93]
        ],
        'MAX': [ // Complete year trajectory
          [70, 75, 80, 85, 89, 91],
          [66, 71, 76, 81, 85, 87],
          [75, 80, 85, 90, 94, 96],
          [62, 67, 72, 77, 81, 83],
          [72, 77, 82, 87, 91, 93]
        ]
      }
    };

    return trendDataTemplates[className] || trendDataTemplates['Class 10th'];
  };

  // Convert trend data template to the format needed by charts
  const formatTrendData = (template, period) => {
    const timeLabels = {
      '1D': ['8AM', '10AM', '12PM', '2PM', '4PM'],
      '5D': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      '10D': ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10'],
      '15D': ['1-2', '3-4', '5-6', '7-8', '9-10', '11-12', '13-14', '15'],
      '1M': ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      'MAX': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    };

    const result = {};
    const labels = timeLabels[period];
    
    // Create structure for 5 students
    for (let i = 0; i < 5; i++) {
      result[`student_${i}`] = template[period][i].map((score, index) => {
        const timeKey = period === '1D' ? 'time' : 
                       period === '5D' ? 'day' :
                       period === '10D' ? 'day' :
                       period === '15D' ? 'day' :
                       period === '1M' ? 'week' : 'month';
        return { [timeKey]: labels[index], score };
      });
    }
    
    return result;
  };

  // Get current class data based on selected class
  const getCurrentClassData = () => {
    const className = selectedClass?.name || 'Class 10th';
    return classSpecificData[className] || classSpecificData['Class 10th'];
  };

  // Get current class data
  const currentClassData = getCurrentClassData();

  // Chapter options for dropdown
  const chapterOptions = [
    'All Chapters',
    'Algebra',
    'Calculus', 
    'Coordinate Geometry',
    'Functions and Graphs',
    'Probability',
    'Quadratic Applications',
    'Statistics',
    'Trigonometry'
  ];

  // All topics data for main view
  const allTopicsRankedData = [
    { topic: 'Algebra - Linear Equations', average: 46.7 },
    { topic: 'Calculus - Derivatives', average: 52.2 },
    { topic: 'Statistics', average: 56.4 },
    { topic: 'Trigonometry', average: 56.9 },
    { topic: 'Functions and Graphs', average: 57.0 },
    { topic: 'Calculus - Integration', average: 58.1 },
    { topic: 'Quadratic Applications', average: 59.0 },
    { topic: 'Probability', average: 60.8 },
    { topic: 'Algebra - Rational Functions', average: 64.0 },
    { topic: 'Coordinate Geometry', average: 71.4 }
  ];

  // Chapter-specific sub-topic data - reformatted for bar chart
  const getChapterSubTopics = (chapter) => {
    const subTopicData = {
      'Algebra': {
        subTopics: [
          { name: 'Linear Equations', overallAvg: 46.7, hwAvg: 58.3, cwAvg: 40.8, totalQuestions: 30 },
          { name: 'Rational Functions', overallAvg: 64.0, hwAvg: 84.0, cwAvg: 54.0, totalQuestions: 15 }
        ],
        chartData: [
          { topic: 'Linear Equations', average: 46.7 },
          { topic: 'Rational Functions', average: 64.0 }
        ],
        stats: {
          subTopicsFound: 2,
          chapterAverage: 55.3,
          needsMostAttention: 46.7,
          bestPerformance: 64.0
        }
      },
      'Calculus': {
        subTopics: [
          { name: 'Derivatives', overallAvg: 52.2, hwAvg: 55.1, cwAvg: 47.5, totalQuestions: 40 },
          { name: 'Integration', overallAvg: 58.1, hwAvg: 96.7, cwAvg: 45.3, totalQuestions: 20 }
        ],
        chartData: [
          { topic: 'Derivatives', average: 52.2 },
          { topic: 'Integration', average: 58.1 }
        ],
        stats: {
          subTopicsFound: 2,
          chapterAverage: 55.2,
          needsMostAttention: 52.2,
          bestPerformance: 58.1
        }
      }
    };
    return subTopicData[chapter] || null;
  };

  // Overall class stats data - using current class data
  const overallClassStatsData = [
    { type: 'Homework', average: 62, color: '#0ea5e9' },
    { type: 'Classwork', average: 51, color: '#a855f7' }
  ];

  // Filter submitted results based on filters
  const getFilteredResults = () => {
    let filtered = [...currentClassData.submittedResults];
    
    if (dateFilter) {
      filtered = filtered.filter(item => item.date === dateFilter);
    }
    
    if (submissionFilter === 'homework') {
      filtered = filtered.filter(item => item.homeworkSubmitted);
    } else if (submissionFilter === 'classwork') {
      filtered = filtered.filter(item => item.classworkSubmitted);
    }
    
    return filtered;
  };

  // Get trend data based on selected period and class
  const getTrendData = () => {
    // Get the current class name and students
    const className = selectedClass?.name || 'Class 10th';
    const students = currentClassData.topPerformers.map(p => p.student);
    
    // Get class-specific trend data
    const classTrendData = getTrendDataForClass(className);
    const formattedData = formatTrendData(classTrendData, trendPeriod);
    
    // Get the time points from the first student's data
    const firstStudentData = formattedData['student_0'];
    if (!firstStudentData) return { data: [], students: [] };
    
    // Create combined data for line chart with current class students
    const combinedData = firstStudentData.map((point, index) => {
      const dataPoint = {};
      const timeKey = Object.keys(point)[0]; // 'time', 'day', 'week', or 'month'
      dataPoint.name = point[timeKey];
      
      // Map the scores to current class students
      students.forEach((student, studentIndex) => {
        const studentKey = `student_${studentIndex}`;
        if (formattedData[studentKey] && formattedData[studentKey][index]) {
          dataPoint[student] = formattedData[studentKey][index].score;
        }
      });
      
      return dataPoint;
    });
    
    return { data: combinedData, students };
  };

  // Class Overview Dashboard
  const renderClassOverviewDashboard = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-800">
        <div className="mb-6">
          <div className="">
            <h2 className="text-base font-semibold text-gray-800 m-0 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#00A0E3]" /> CLASS OVERVIEW DASHBOARD</h2>
            <p className="text-gray-500 mt-2 m-0 text-sm">Overall class performance metrics and insights</p>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 mb-8">
          <div className="p-4 rounded-xl flex flex-col relative overflow-hidden shadow-md transition-all duration-300 cursor-pointer min-h-[120px] text-white bg-gradient-to-br from-[#00A0E3] to-blue-700 hover:-translate-y-1 hover:shadow-lg">
            <div className="text-xl mb-2">👥</div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-2xl font-bold m-0 mb-1">{currentClassData.summary.totalStudents}</div>
              <div className="text-base font-medium m-0 opacity-90">Total Students</div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl flex flex-col relative overflow-hidden shadow-md transition-all duration-300 cursor-pointer min-h-[120px] text-white bg-gradient-to-br from-emerald-500 to-emerald-600 hover:-translate-y-1 hover:shadow-lg">
            <div><BarChart3 className="w-6 h-6 text-white" /></div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-2xl font-bold m-0 mb-1">{currentClassData.summary.averageScore}%</div>
              <div className="text-base font-medium m-0 opacity-90">Average Score</div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl flex flex-col relative overflow-hidden shadow-md transition-all duration-300 cursor-pointer min-h-[120px] text-white bg-gradient-to-br from-amber-500 to-amber-600 hover:-translate-y-1 hover:shadow-lg">
            <div className="text-xl mb-2">📝</div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-2xl font-bold m-0 mb-1">{currentClassData.summary.assignments}</div>
              <div className="text-base font-medium m-0 opacity-90">Assignments</div>
            </div>
          </div>
          
          <div className="p-4 rounded-xl flex flex-col relative overflow-hidden shadow-md transition-all duration-300 cursor-pointer min-h-[120px] text-white bg-gradient-to-br from-[#00A0E3] to-[#0080B8] hover:-translate-y-1 hover:shadow-lg">
            <div className="text-xl mb-2">✅</div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-2xl font-bold m-0 mb-1">{currentClassData.summary.completionRate}%</div>
              <div className="text-base font-medium m-0 opacity-90">Completion Rate</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[#F8FAFC] rounded-xl p-5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <h3 className="text-[15px] font-semibold m-0 mb-4 text-gray-800">Student Performance Comparison</h3>
            <div className="mb-3 h-[400px]">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={currentClassData.studentPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="student" 
                    fontSize={12} 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                  />
                  <YAxis 
                    fontSize={12} 
                    domain={[0, 100]} 
                    tickCount={6}
                    ticks={[0, 20, 40, 60, 80, 100]}
                  />
                  <Tooltip formatter={(value, name) => [value + '%', name === 'homeworkAverage' ? 'Homework Average' : 'Classwork Average']} />
                  <Legend />
                  <Bar dataKey="homeworkAverage" fill="#0ea5e9" name="Homework Average" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="classworkAverage" fill="#a855f7" name="Classwork Average" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#F8FAFC] rounded-xl p-5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <h3 className="text-[15px] font-semibold m-0 mb-4 text-gray-800">Class Performance Summary</h3>
            <div className="mb-3 h-[400px]">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={overallClassStatsData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="type" fontSize={12} />
                  <YAxis 
                    fontSize={12} 
                    domain={[0, 100]} 
                    tickCount={6}
                    ticks={[0, 20, 40, 60, 80, 100]}
                  />
                  <Tooltip formatter={(value) => [value + '%', 'Average Score']} />
                  <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                    {overallClassStatsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-gray-500 text-right">
              <div>Type: Classwork</div>
              <div>Average: 51.5%</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Class Progress Trends with Time Period Data
  const renderClassProgressTrends = () => {
    const trendResult = getTrendData();
    const trendData = trendResult.data || [];
    const students = trendResult.students || [];
    
    // Define colors for the lines
    const lineColors = ['#00A0E3', '#00A0E3', '#10b981', '#f59e0b', '#ef4444'];
    
    // Get period-specific top performers data
    const getPeriodTopPerformers = () => {
      const className = selectedClass?.name || 'Class 10th';
      const classTrendData = getTrendDataForClass(className);
      const periodData = classTrendData[trendPeriod];
      
      if (!periodData) return currentClassData.topPerformers;
      
      // Calculate average for each student in the selected period
      const performerData = students.map((student, index) => {
        const scores = periodData[index];
        const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        return {
          student: student,
          average: avgScore
        };
      });
      
      // Sort by average score (descending)
      return performerData.sort((a, b) => b.average - a.average);
    };
    
    const periodTopPerformers = getPeriodTopPerformers();
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-800">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 m-0 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#00A0E3]" /> Class Progress Trends</h2>
          <p className="text-gray-500 mt-2 m-0 text-sm">Top Performers Analysis</p>
        </div>

        <div className="flex gap-2 mb-6">
          {['1D', '5D', '10D', '15D', '1M', 'MAX'].map((filter) => (
            <button 
              key={filter} 
              className={`px-4 py-2 border-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${filter === trendPeriod ? 'bg-gradient-to-r from-[#00A0E3] to-blue-700 text-white border-[#00A0E3] shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#00A0E3] hover:text-[#00A0E3]'}`}
              onClick={() => setTrendPeriod(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Top Performers Bar Chart - Main Chart */}
        <div className="bg-[#F8FAFC] rounded-xl p-5">
          <h3 className="text-base font-semibold m-0 mb-5 text-gray-800 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Top Performers - {trendPeriod} Period</h3>
          <div className="mb-4 h-[500px]">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={periodTopPerformers} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="student" 
                  fontSize={12} 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                />
                <YAxis 
                  fontSize={12} 
                  domain={[0, 100]} 
                  tickCount={6}
                  ticks={[0, 20, 40, 60, 80, 100]}
                />
                <Tooltip formatter={(value) => [value + '%', 'Average Score']} />
                <Bar dataKey="average" fill="#00A0E3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 transition-all duration-300 hover:-translate-y-0.5">
              <div className="w-4 h-4 rounded bg-[#00A0E3]"></div>
              <span>Performance for {trendPeriod === '1D' ? '1 Day' : 
                                   trendPeriod === '5D' ? '5 Days' : 
                                   trendPeriod === '10D' ? '10 Days' : 
                                   trendPeriod === '15D' ? '15 Days' : 
                                   trendPeriod === '1M' ? '1 Month' : 
                                   '6 Months (MAX)'}</span>
            </div>
          </div>
        </div>

        {/* Performance Trend Line Chart - Secondary Chart */}
        {/* <div className="trend-chart-section">
          <h3 className="text-base font-semibold m-0 mb-5 text-gray-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#00A0E3]" /> Performance Trend - {trendPeriod}</h3>
          <div className="mb-4 h-[500px]">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12} 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                />
                <YAxis 
                  fontSize={12} 
                  domain={[0, 100]} 
                  tickCount={6}
                  ticks={[0, 20, 40, 60, 80, 100]}
                />
                <Tooltip formatter={(value) => [value + '%', 'Score']} />
                <Legend />
                {students.map((student, index) => (
                  <Line 
                    key={student}
                    type="monotone" 
                    dataKey={student} 
                    stroke={lineColors[index]} 
                    strokeWidth={2} 
                    name={student} 
                    dot={{ r: 4 }} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div> */}

        {/* Time Period Summary */}
        {/* <div className="period-summary">
          <h4 className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#00A0E3]" /> Period Summary for {trendPeriod}</h4>
          <div className="summary-stats">
            <div className="flex justify-between p-3 px-4 bg-white rounded-lg border-l-4 border-l-[#00A0E3] text-gray-800 transition-all duration-300 hover:translate-x-1 hover:shadow-md">
              <span className="text-[13px] text-gray-500 mt-1 m-0">Top Scorer:</span>
              <span className="text-xl font-bold text-gray-800 m-0">{periodTopPerformers[0]?.student} ({periodTopPerformers[0]?.average}%)</span>
            </div>
            <div className="flex justify-between p-3 px-4 bg-white rounded-lg border-l-4 border-l-[#00A0E3] text-gray-800 transition-all duration-300 hover:translate-x-1 hover:shadow-md">
              <span className="text-[13px] text-gray-500 mt-1 m-0">Lowest Scorer:</span>
              <span className="text-xl font-bold text-gray-800 m-0">{periodTopPerformers[4]?.student} ({periodTopPerformers[4]?.average}%)</span>
            </div>
            <div className="flex justify-between p-3 px-4 bg-white rounded-lg border-l-4 border-l-[#00A0E3] text-gray-800 transition-all duration-300 hover:translate-x-1 hover:shadow-md">
              <span className="text-[13px] text-gray-500 mt-1 m-0">Class Average:</span>
              <span className="text-xl font-bold text-gray-800 m-0">{Math.round(periodTopPerformers.reduce((sum, p) => sum + p.average, 0) / 5)}%</span>
            </div>
            <div className="flex justify-between p-3 px-4 bg-white rounded-lg border-l-4 border-l-[#00A0E3] text-gray-800 transition-all duration-300 hover:translate-x-1 hover:shadow-md">
              <span className="text-[13px] text-gray-500 mt-1 m-0">Score Range:</span>
              <span className="text-xl font-bold text-gray-800 m-0">{periodTopPerformers[4]?.average}% - {periodTopPerformers[0]?.average}%</span>
            </div>
          </div>
        </div> */}
      </div>
    );
  };

  // Enhanced Topic Analysis with Bar Chart for Sub-topics
  const renderTopicAnalysis = () => {
    const chapterData = getChapterSubTopics(selectedChapter);
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-800">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 m-0">🎯 Topic Analysis</h2>
          <p className="text-gray-500 mt-2 m-0 text-sm">Performance breakdown by academic topics</p>
        </div>

        <div className="mb-8">
          <label className="block font-medium text-gray-700 mb-2 text-xs uppercase tracking-wide">📚 Select Chapter (Main Topic):</label>
          <select 
            value={selectedChapter} 
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="w-full max-w-[300px] px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white text-gray-800 transition-all duration-300 hover:border-[#00A0E3] hover:ring-2 hover:ring-[#00A0E3]/10"
          >
            {chapterOptions.map(chapter => (
              <option key={chapter} value={chapter}>{chapter}</option>
            ))}
          </select>
        </div>

        {selectedChapter === 'All Chapters' ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-lg border-l-4 border-l-[#00A0E3] text-gray-800 transition-all duration-300 hover:translate-x-1 hover:shadow-md">
                <div><BarChart3 className="w-6 h-6 text-[#00A0E3]" /></div>
                <div className="">
                  <div className="text-xl font-bold text-gray-800 m-0">10</div>
                  <div className="text-[13px] text-gray-500 mt-1 m-0">Total Topics</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-lg border-l-4 border-l-[#00A0E3] text-gray-800 transition-all duration-300 hover:translate-x-1 hover:shadow-md">
                <div><TrendingUp className="w-6 h-6 text-[#00A0E3]" /></div>
                <div className="">
                  <div className="text-xl font-bold text-gray-800 m-0">58.3%</div>
                  <div className="text-[13px] text-gray-500 mt-1 m-0">Overall Average</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-lg border-l-4 border-l-[#00A0E3] text-gray-800 transition-all duration-300 hover:translate-x-1 hover:shadow-md">
                <div className="text-xl">📚</div>
                <div className="">
                  <div className="text-xl font-bold text-gray-800 m-0">8</div>
                  <div className="text-[13px] text-gray-500 mt-1 m-0">Available Chapters</div>
                </div>
              </div>
            </div>

            {/* All Topics Chart */}
            <div className="bg-[#F8FAFC] rounded-xl p-5 mb-6">
              <h3 className="text-[15px] font-semibold m-0 mb-4 text-gray-800">🎯 Class Topic Performance Analysis</h3>
              <p className="text-[13px] text-gray-500 mt-2 mb-5 m-0">All Topics Ranked by Class Performance (Lowest to Highest)</p>
              
              <div className="mb-4 h-[500px]">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={allTopicsRankedData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="topic" 
                      fontSize={10} 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      interval={0}
                    />
                    <YAxis 
                      fontSize={12} 
                      domain={[0, 100]} 
                      tickCount={11}
                      ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                    />
                    <Tooltip formatter={(value) => [value + '%', 'Average Performance']} />
                    <Bar dataKey="average" fill="#00A0E3" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : chapterData ? (
          <>
            {/* Chapter Sub-topic Performance as Bar Chart */}
            <div className="mt-6">
              <h3 className="text-base font-semibold m-0 mb-5 text-gray-800 flex items-center gap-2">🎯 Class Sub-topic Performance: {selectedChapter}</h3>
              <p className="text-sm text-gray-500 mt-1">Sub-topics Ranked by Class Performance (Lowest to Highest)</p>
              
              {/* Bar Chart for Sub-topics */}
              <div className="bg-[#F8FAFC] rounded-xl p-5 mb-6 relative overflow-hidden">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={chapterData.chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="topic" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      fontSize={12} 
                      domain={[0, 100]} 
                      tickCount={6}
                      ticks={[0, 20, 40, 60, 80, 100]}
                    />
                    <Tooltip formatter={(value) => [value + '%', 'Average']} />
                    <Bar dataKey="average" fill="#00A0E3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chapter Statistics */}
              <div className="bg-[#F8FAFC] rounded-xl p-5">
                <h4 className="text-base font-semibold text-gray-800 m-0 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#00A0E3]" /> {selectedChapter} Sub-topic Details</h4>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
                  <div className="flex justify-between p-3 px-4 bg-white rounded-lg border-l-4 border-l-[#00A0E3] text-gray-800 transition-all duration-300 hover:translate-x-1 hover:shadow-md">
                    <span className="text-[13px] text-gray-500 mt-1 m-0">Sub-topics Found</span>
                    <span className="text-xl font-bold text-gray-800 m-0">{chapterData.stats.subTopicsFound}</span>
                  </div>
                  <div className="flex justify-between p-3 px-4 bg-white rounded-lg border-l-4 border-l-[#00A0E3] text-gray-800 transition-all duration-300 hover:translate-x-1 hover:shadow-md">
                    <span className="text-[13px] text-gray-500 mt-1 m-0">Chapter Average</span>
                    <span className="text-xl font-bold text-gray-800 m-0">{chapterData.stats.chapterAverage}%</span>
                  </div>
                  <div className="flex justify-between p-3 px-4 bg-white rounded-lg border-l-4 border-l-[#00A0E3] text-gray-800 transition-all duration-300 hover:translate-x-1 hover:shadow-md">
                    <span className="text-[13px] text-gray-500 mt-1 m-0">Needs Most Attention</span>
                    <span className="text-xl font-bold text-gray-800 m-0">{chapterData.stats.needsMostAttention}%</span>
                  </div>
                  <div className="flex justify-between p-3 px-4 bg-white rounded-lg border-l-4 border-l-[#00A0E3] text-gray-800 transition-all duration-300 hover:translate-x-1 hover:shadow-md">
                    <span className="text-[13px] text-gray-500 mt-1 m-0">Best Performance</span>
                    <span className="text-xl font-bold text-gray-800 m-0">{chapterData.stats.bestPerformance}%</span>
                  </div>
                </div>

                {/* Detailed Performance Table */}
                <div className="mt-6">
                  <h5 className="text-sm font-semibold text-gray-800 m-0 mb-3">📋 Detailed Sub-topic Performance Table</h5>
                  <table>
                    <thead>
                      <tr>
                        <th>Sub-topic</th>
                        <th>Overall Avg (%)</th>
                        <th>HW Avg (%)</th>
                        <th>CW Avg (%)</th>
                        <th>Total Questions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chapterData.subTopics.map((subtopic, index) => (
                        <tr key={index}>
                          <td>{subtopic.name}</td>
                          <td>{subtopic.overallAvg}</td>
                          <td>{subtopic.hwAvg}</td>
                          <td>{subtopic.cwAvg}</td>
                          <td>{subtopic.totalQuestions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3">🚫</div>
              <h3 className="text-lg font-semibold text-[#0B1120] mb-2">No Sub-topics Found for Chapter: {selectedChapter}</h3>
              <p className="text-gray-500 text-sm">Please select a different chapter or check data format</p>
            </div>
            
            <div className="mt-4 text-xs text-gray-400">
              <h4>⚠ No sub-topics found for chapter '{selectedChapter}'. This might mean:</h4>
              <ul>
                <li>The chapter '{selectedChapter}' doesn't have sub-topics with '-' separator</li>
                <li>There's no performance data available for this chapter's sub-topics</li>
                <li>Check if your data follows the format: 'Chapter Name - Sub-Topic-Name'</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  // New Submitted Results Tab
  const renderSubmittedResults = () => {
    const filteredResults = getFilteredResults();
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-800">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 m-0">📝 Submitted Results</h2>
          <p className="text-gray-500 mt-2 m-0 text-sm">Track student submissions and marks</p>
        </div>

        {/* Filters Section */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="block font-medium text-gray-700 mb-2 text-xs uppercase tracking-wide">Date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800 transition-all duration-300 hover:border-[#00A0E3] focus:outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="block font-medium text-gray-700 mb-2 text-xs uppercase tracking-wide">Show:</label>
            <select
              value={submissionFilter}
              onChange={(e) => setSubmissionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-800 transition-all duration-300 hover:border-[#00A0E3] focus:outline-none focus:border-[#00A0E3] focus:ring-2 focus:ring-[#00A0E3]/10"
            >
              <option value="all">All</option>
              <option value="homework">Only Homework</option>
              <option value="classwork">Only Classwork</option>
            </select>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Marks</th>
                <th>Homework</th>
                <th>Classwork</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result, index) => (
                <tr key={index}>
                  <td>{result.studentId}</td>
                  <td>{result.marks}</td>
                  <td>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${result.homeworkSubmitted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {result.homeworkSubmitted ? '✓ Submitted' : '✗ Not Submitted'}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${result.classworkSubmitted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {result.classworkSubmitted ? '✓ Submitted' : '✗ Not Submitted'}
                    </span>
                  </td>
                  <td>{result.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Enhanced Summary with All Tab Data
  const renderSummary = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-800">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-semibold text-gray-800 m-0">📋 CLASSROOM PERFORMANCE SUMMARY</h2>
        </div>

        {/* Achievement Cards */}
        <div className="mb-8">
          <h3 className="text-base font-semibold m-0 mb-5 text-gray-800 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> ACHIEVEMENTS</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
            <div className="p-5 rounded-xl flex items-center gap-4 shadow-md transition-all duration-300 relative overflow-hidden text-white bg-gradient-to-br from-amber-400 to-amber-500 hover:-translate-y-1 hover:shadow-lg">
              <div className="text-3xl">🥇</div>
              <div className="">
                <div className="text-sm font-medium mb-1 text-white/95">Top Performer</div>
                <div className="text-base font-bold text-white">{currentClassData.topPerformers[0].student} - {currentClassData.topPerformers[0].average}%</div>
              </div>
            </div>
            
            <div className="p-5 rounded-xl flex items-center gap-4 shadow-md transition-all duration-300 relative overflow-hidden text-white bg-gradient-to-br from-emerald-500 to-emerald-600 hover:-translate-y-1 hover:shadow-lg">
              <div><TrendingUp className="w-8 h-8 text-white" /></div>
              <div className="">
                <div className="text-sm font-medium mb-1 text-white/95">Best Chapter</div>
                <div className="text-base font-bold text-white">Coordinate Geometry - 71.4%</div>
              </div>
            </div>
            
            <div className="p-5 rounded-xl flex items-center gap-4 shadow-md transition-all duration-300 relative overflow-hidden text-white bg-gradient-to-br from-[#00A0E3] to-[#0080B8] hover:-translate-y-1 hover:shadow-lg">
              <div className="text-3xl">✅</div>
              <div className="">
                <div className="text-sm font-medium mb-1 text-white/95">Completion Rate</div>
                <div className="text-base font-bold text-white">{currentClassData.summary.completionRate}% Overall</div>
              </div>
            </div>
          </div>
        </div>

        {/* Class Overview Summary */}
        <div className="mb-6 bg-[#F8FAFC] rounded-xl p-5 border border-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[#00A0E3]">
          <h3 className="text-base font-semibold text-gray-800 m-0 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#00A0E3]" /> Class Overview</h3>
          <div className="grid gap-3">
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Total Students:</span>
              <span className="text-[#0B1120] font-semibold">{currentClassData.summary.totalStudents}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Average Score:</span>
              <span className="text-[#0B1120] font-semibold">{currentClassData.summary.averageScore}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Total Assignments:</span>
              <span className="text-[#0B1120] font-semibold">{currentClassData.summary.assignments}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Completion Rate:</span>
              <span className="text-[#0B1120] font-semibold">{currentClassData.summary.completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Progress Trends Summary */}
        <div className="mb-6 bg-[#F8FAFC] rounded-xl p-5 border border-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[#00A0E3]">
          <h3 className="text-base font-semibold text-gray-800 m-0 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#00A0E3]" /> Progress Trends</h3>
          <div className="grid gap-3">
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Top Performer:</span>
              <span className="text-[#0B1120] font-semibold">{currentClassData.topPerformers[0].student} ({currentClassData.topPerformers[0].average}%)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Lowest Performer:</span>
              <span className="text-[#0B1120] font-semibold">{currentClassData.topPerformers[4].student} ({currentClassData.topPerformers[4].average}%)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Class Average:</span>
              <span className="text-[#0B1120] font-semibold">{Math.round(currentClassData.topPerformers.reduce((sum, p) => sum + p.average, 0) / 5)}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Trend Direction:</span>
              <span className="text-[#0B1120] font-semibold"><TrendingUp className="w-4 h-4 inline" /> Improving</span>
            </div>
          </div>
        </div>

        {/* Topic Analysis Summary */}
        <div className="mb-6 bg-[#F8FAFC] rounded-xl p-5 border border-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[#00A0E3]">
          <h3 className="text-base font-semibold text-gray-800 m-0 mb-4 flex items-center gap-2">🎯 Topic Analysis</h3>
          <div className="grid gap-3">
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Total Topics:</span>
              <span className="text-[#0B1120] font-semibold">10</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Best Topic:</span>
              <span className="text-[#0B1120] font-semibold">Coordinate Geometry (71.4%)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Weakest Topic:</span>
              <span className="text-[#0B1120] font-semibold">Linear Equations (46.7%)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Topics Average:</span>
              <span className="text-[#0B1120] font-semibold">58.3%</span>
            </div>
          </div>
        </div>

        {/* Submitted Results Summary */}
        <div className="mb-6 bg-[#F8FAFC] rounded-xl p-5 border border-gray-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-[#00A0E3]">
          <h3 className="text-base font-semibold text-gray-800 m-0 mb-4 flex items-center gap-2">📝 Submission Summary</h3>
          <div className="grid gap-3">
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Total Submissions:</span>
              <span className="text-[#0B1120] font-semibold">{currentClassData.submittedResults.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Homework Completion:</span>
              <span className="text-[#0B1120] font-semibold">{Math.round((currentClassData.submittedResults.filter(r => r.homeworkSubmitted).length / currentClassData.submittedResults.length) * 100)}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Classwork Completion:</span>
              <span className="text-[#0B1120] font-semibold">{Math.round((currentClassData.submittedResults.filter(r => r.classworkSubmitted).length / currentClassData.submittedResults.length) * 100)}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0 transition-all duration-300 hover:pl-2 hover:bg-white hover:-mx-2 hover:pr-2 hover:rounded">
              <span className="text-gray-500 text-sm">Average Marks:</span>
              <span className="text-[#0B1120] font-semibold">{Math.round(currentClassData.submittedResults.reduce((sum, r) => sum + r.marks, 0) / currentClassData.submittedResults.length)}</span>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-8">
          <h3 className="text-base font-semibold m-0 mb-5 text-gray-800 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-[#00A0E3]" /> KEY INSIGHTS & RECOMMENDATIONS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-green-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-xl">✅</div>
                <div className="font-semibold text-[#0B1120]">Strengths</div>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Consistent improvement over {trendPeriod} period</li>
                <li>Strong performance in Coordinate Geometry (71.4%)</li>
                <li>High completion rate ({currentClassData.summary.completionRate}%)</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-xl">⚠</div>
                <div className="font-semibold text-[#0B1120]">Areas for Improvement</div>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Linear Equations needs focus (46.7%)</li>
                <li>Classwork strategies need enhancement</li>
                <li>Support needed for lower performers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 bg-[#F8FAFC] min-h-screen relative text-gray-800">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div><BarChart3 className="w-8 h-8 text-[#00A0E3]" /></div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 m-0">Class Analysis Dashboard</h2>
              <p className="text-gray-500 mt-1 m-0 text-sm">Comprehensive performance analysis for {selectedClass?.name || 'Class 10th'}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-500">Select Class</span>
            <select
              value={selectedClass?.name || 'Class 10th'}
              onChange={(e) => {
                const classData = Object.values(classesData).find(cls => cls.name === e.target.value);
                if (classData) {
                  onClassChange(classData);
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white transition-all duration-300 hover:border-[#00A0E3] hover:ring-2 hover:ring-[#00A0E3]/10"
            >
              <option value="Class 6th">Class 6th 👥</option>
              <option value="Class 7th">Class 7th 👥</option>
              <option value="Class 8th">Class 8th 👥</option>
              <option value="Class 9th">Class 9th 👥</option>
              <option value="Class 10th">Class 10th 👥</option>
              <option value="Class 11th">Class 11th 👥</option>
              <option value="Class 12th">Class 12th 👥</option>
            </select>
          </div>
        </div>
      </div>

      {/* Updated Sub-tabs with 5 tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setClassAnalysisTab('overview')}
          className={`px-5 py-3 border-none rounded-lg font-medium cursor-pointer transition-all duration-300 shadow-sm ${classAnalysisTab === 'overview' ? 'bg-[#00A0E3] text-white -translate-y-0.5 shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 hover:-translate-y-px'}`}
        >
          <BarChart3 className="w-4 h-4 inline" /> Class Overview
        </button>
        <button
          onClick={() => setClassAnalysisTab('trends')}
          className={`px-5 py-3 border-none rounded-lg font-medium cursor-pointer transition-all duration-300 shadow-sm ${classAnalysisTab === 'trends' ? 'bg-[#00A0E3] text-white -translate-y-0.5 shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 hover:-translate-y-px'}`}
        >
          <TrendingUp className="w-4 h-4 inline" /> Class Progress Trends
        </button>
        <button
          onClick={() => setClassAnalysisTab('topics')}
          className={`px-5 py-3 border-none rounded-lg font-medium cursor-pointer transition-all duration-300 shadow-sm ${classAnalysisTab === 'topics' ? 'bg-[#00A0E3] text-white -translate-y-0.5 shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 hover:-translate-y-px'}`}
        >
          🎯 Chapter-Topic Analysis
        </button>
        <button
          onClick={() => setClassAnalysisTab('submitted')}
          className={`px-5 py-3 border-none rounded-lg font-medium cursor-pointer transition-all duration-300 shadow-sm ${classAnalysisTab === 'submitted' ? 'bg-[#00A0E3] text-white -translate-y-0.5 shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 hover:-translate-y-px'}`}
        >
          📝 Submitted Results
        </button>
        <button
          onClick={() => setClassAnalysisTab('summary')}
          className={`px-5 py-3 border-none rounded-lg font-medium cursor-pointer transition-all duration-300 shadow-sm ${classAnalysisTab === 'summary' ? 'bg-[#00A0E3] text-white -translate-y-0.5 shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 hover:-translate-y-px'}`}
        >
          📋 Summary
        </button>
      </div>

      {/* Class Analysis Content */}
      <div className="">
        {classAnalysisTab === 'overview' && renderClassOverviewDashboard()}
        {classAnalysisTab === 'trends' && renderClassProgressTrends()}
        {classAnalysisTab === 'topics' && renderTopicAnalysis()}
        {classAnalysisTab === 'submitted' && renderSubmittedResults()}
        {classAnalysisTab === 'summary' && renderSummary()}
      </div>
    </div>
  );
};

export default ClassAnalysis;