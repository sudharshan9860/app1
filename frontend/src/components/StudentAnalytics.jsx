// src/components/StudentAnalytics.jsx
import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Nav, Tab, Button, Form, Table, ProgressBar } from "react-bootstrap";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { AuthContext } from "./AuthContext";
import {
  TrendingUp,
  BookOpen,
  Target,
  ClipboardList,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StudentAnalytics = () => {
  const { username } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("datewise");
  const [viewOption, setViewOption] = useState("combined");
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [chapterFilter, setChapterFilter] = useState("all");
  const [viewMode, setViewMode] = useState("all"); // all, homework, classwork

  // Mock data for the student
  const studentData = {
    name: username || "Student",
    class: "Class 10th",
    studentId: "10HPS17",
  };

  // Date-wise progression data for line chart
  const dateWiseData = {
    labels: [
      "Aug 31", "Sep 1", "Sep 2", "Sep 3", "Sep 4", "Sep 5", "Sep 6",
      "Sep 7", "Sep 8", "Sep 9", "Sep 10", "Sep 11", "Sep 12", "Sep 13",
      "Sep 14", "Sep 15", "Sep 16", "Sep 17", "Sep 18", "Sep 19", "Sep 20",
      "Sep 21", "Sep 23", "Sep 25", "Sep 27", "Sep 29"
    ],
    datasets: [
      {
        label: "Homework Performance (%)",
        data: [60, 58, 62, 64, 65, 67, 66, 68, 70, 69, 71, 70, 72, 71, 73, 72, 74, 73, 75, 74, 75, 76, 75, 77, 76, 78],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Classwork Performance (%)",
        data: [58, 60, 61, 63, 62, 64, 65, 66, 67, 68, 69, 68, 70, 69, 71, 70, 72, 71, 73, 72, 73, 74, 73, 75, 74, 75],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 15,
        }
      },
      title: {
        display: true,
        text: "Score Comparison Over Time with All Submission Dates",
        font: {
          size: 14,
          weight: "normal",
        },
        padding: 20,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        displayColors: true,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
          callback: function(value) {
            return value;
          }
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
        },
        title: {
          display: false,
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
        }
      },
    },
  };

  // Chapter Analysis data
  const chapterData = {
    labels: [
      "Calculus Integration", "Algebra Linear Equations", "Geometry",
      "Algebra - System of Equations", "Algebra", "Probability",
      "Trigonometry", "Quadratic Equations", "Calculus Derivatives",
      "Functions and Graphs", "Coordinate Geometry"
    ],
    datasets: [
      {
        label: "Homework Performance",
        data: [92, 88, 95, 85, 78, 82, 75, 72, 78, 85, 90],
        backgroundColor: "rgba(75, 192, 192, 0.8)",
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 1,
      },
      {
        label: "Classwork Performance",
        data: [60, 85, 75, 65, 62, 65, 58, 60, 68, 82, 85],
        backgroundColor: "rgba(255, 99, 132, 0.8)",
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 15,
        }
      },
      title: {
        display: true,
        text: "Topic Analysis - Performance comparison across different topics",
        font: {
          size: 14,
          weight: "normal",
        },
        padding: 20,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Mistake Analysis data
  const mistakeData = {
    labels: ["Correct", "Partially-Correct", "Numerical Error", "Irrelevant", "Unattempted"],
    datasets: [{
      data: [72, 20, 27, 35, 26],
      backgroundColor: [
        'rgba(75, 192, 75, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(128, 128, 128, 0.8)'
      ],
      borderColor: [
        'rgba(75, 192, 75, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(128, 128, 128, 1)'
      ],
      borderWidth: 1,
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12
          },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const total = dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(0);
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i,
                  pointStyle: 'circle',
                };
              });
            }
            return [];
          }
        }
      },
      title: {
        display: true,
        text: 'How Well Did I Do? (Answer Categories)',
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${value} questions`;
          }
        }
      }
    },
  };

  // Filtered Results data
  const filteredResults = [
    { id: "Q1", chapter: "Algebra - Linear Equations", date: "8/30/2025", question: "Find the shortest distance...", score: "15/20", performance: 73, status: "CORRECT", studentMistake: "Irrelevant formula application", approach: "Minimize the distance function using calculus" },
    { id: "Q2", chapter: "Trigonometry", date: "8/31/2025", question: "Find the vertex of parabola...", score: "15/20", performance: 75, status: "CORRECT", studentMistake: "Fig = 5", approach: "Minimize the distance function using calculus" },
    { id: "Q3", chapter: "Calculus - Integration", date: "8/1/2025", question: "Find the system solution...", score: "15/20", performance: 77, status: "CORRECT", studentMistake: "Sy = 6", approach: "Minimize the distance function using calculus" },
    { id: "Q4", chapter: "Coordinate Geometry", date: "8/2/2025", question: "Find the equation of line...", score: "15/20", performance: 78, status: "CORRECT", studentMistake: "Area = 1/2 x base x height", approach: "Minimize the distance function using calculus" },
    { id: "Q5", chapter: "Statistics", date: "8/3/2025", question: "Find the trigonometric value...", score: "15/20", performance: 81, status: "CORRECT", studentMistake: "cos(60) = 0.5", approach: "Minimize the distance function using calculus" },
    { id: "Q6", chapter: "Probability", date: "9/4/2025", question: "Find the shortest distance...", score: "17/20", performance: 83, status: "CORRECT", studentMistake: "Calculation error", approach: "Minimize the distance function using calculus" },
    { id: "Q7", chapter: "Quadratic Applications", date: "9/5/2025", question: "Find the vertex of parabola...", score: "17/20", performance: 85, status: "CORRECT", studentMistake: "Minor oversight", approach: "Minimize the distance function using calculus" },
    { id: "Q8", chapter: "Algebra - Linear Equations", date: "9/6/2025", question: "Find the system solution...", score: "17/20", performance: 87, status: "PARTIAL", studentMistake: "Irrelevant formula application", approach: "Minimize the distance function using calculus" },
    { id: "Q9", chapter: "Trigonometry", date: "9/7/2025", question: "Find the equation of line...", score: "18/20", performance: 89, status: "PARTIAL", studentMistake: "Fig = 5", approach: "Minimize the distance function using calculus" },
    { id: "Q10", chapter: "Calculus - Integration", date: "9/8/2025", question: "Find the trigonometric value...", score: "18/20", performance: 91, status: "PARTIAL", studentMistake: "Sy = 6", approach: "Minimize the distance function using calculus" },
    { id: "Q11", chapter: "Coordinate Geometry", date: "9/9/2025", question: "Find the shortest distance...", score: "19/20", performance: 93, status: "PARTIAL", studentMistake: "Area = 1/2 x base x height", approach: "Minimize the distance function using calculus" },
  ];

  // Summary Statistics
  const summaryStats = {
    assessments: 30,
    chapters: 10,
    questions: 150,
    accuracy: 43,
    homeworkAvg: 67,
    classworkAvg: 70,
    performanceGap: -3,
    improvementRate: 13,
  };

  // Priority Chapters data
  const priorityChapters = {
    high: ["Calculus - Integration"],
    medium: ["Quadratic Applications"],
    maintain: ["Trigonometry"],
  };

  return (
    <Container fluid className="p-4 bg-[#F8FAFC] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h4 className="text-xl font-bold text-[#0B1120] mb-1 flex items-center gap-2">
          <TrendingUp size={22} className="text-[#00A0E3]" />
          Student Analysis Dashboard
        </h4>
        <p className="text-gray-400 text-sm">Analyzing performance for {studentData.name} ({studentData.studentId})</p>
      </div>

      {/* Main Tabs */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav variant="pills" className="flex flex-wrap gap-2 mb-6">
          <Nav.Item>
            <Nav.Link eventKey="datewise" className="px-4 flex items-center gap-2">
              <TrendingUp size={14} />
              Score- Date-wise progression
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="chapter" className="px-4 flex items-center gap-2">
              <BookOpen size={14} />
              Chapter Analysis
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="mistakes" className="px-4 flex items-center gap-2">
              <Target size={14} />
              Mistake-Progress-Analysis
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="summary" className="px-4 flex items-center gap-2">
              <ClipboardList size={14} />
              Summary
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* Date-wise Progression Tab */}
          <Tab.Pane eventKey="datewise">
            <Card className="border-0 shadow-sm rounded-xl">
              <Card.Header className="bg-gradient-to-r from-[#00A0E3] to-[#0080B8] text-white p-4 rounded-t-xl">
                <div className="flex flex-col gap-3">
                  <h6 className="mb-0 font-semibold">
                    Homework vs Classwork: Date-wise Performance Analysis
                  </h6>
                  <div className="flex gap-2 ml-auto">
                    <button
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        viewOption === 'combined'
                          ? 'bg-white text-[#0B1120]'
                          : 'bg-transparent border border-white/50 text-white hover:bg-white/10'
                      }`}
                      onClick={() => setViewOption('combined')}
                    >
                      Combined View
                    </button>
                    <button
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        viewOption === 'homework'
                          ? 'bg-white text-[#0B1120]'
                          : 'bg-transparent border border-white/50 text-white hover:bg-white/10'
                      }`}
                      onClick={() => setViewOption('homework')}
                    >
                      Homework Only
                    </button>
                    <button
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        viewOption === 'classwork'
                          ? 'bg-white text-[#0B1120]'
                          : 'bg-transparent border border-white/50 text-white hover:bg-white/10'
                      }`}
                      onClick={() => setViewOption('classwork')}
                    >
                      Classwork Only
                    </button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div style={{ height: "400px", padding: "20px" }}>
                  <Line
                    data={{
                      ...dateWiseData,
                      datasets: viewOption === 'combined' ? dateWiseData.datasets :
                               viewOption === 'homework' ? [dateWiseData.datasets[0]] :
                               [dateWiseData.datasets[1]]
                    }}
                    options={lineChartOptions}
                  />
                </div>
                <div className="text-right mt-3">
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">Improvement Trend: 13% per assignment</span>
                </div>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* Chapter Analysis Tab */}
          <Tab.Pane eventKey="chapter">
            <Card className="border-0 shadow-sm rounded-xl">
              <Card.Header className="bg-cyan-500 text-white rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h6 className="mb-0 font-semibold">Topic Analysis</h6>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs bg-white text-[#0B1120] rounded-lg">
                      View Options
                    </button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <div style={{ height: "400px", padding: "20px" }}>
                  <Bar data={chapterData} options={barChartOptions} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-[#F8FAFC] rounded-xl p-4">
                    <h6 className="font-semibold text-[#0B1120] mb-1">Focus on Calculus Integration</h6>
                    <span className="text-xs text-gray-400">23% performance, 10% weightage</span>
                  </div>
                  <div className="bg-[#F8FAFC] rounded-xl p-4">
                    <h6 className="font-semibold text-[#0B1120] mb-1">Strong in Coordinate Geometry</h6>
                    <span className="text-xs text-gray-400">93% performance, 8% weightage</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* Mistake Analysis Tab */}
          <Tab.Pane eventKey="mistakes">
            <Card className="border-0 shadow-sm rounded-xl">
              <Card.Body>
                <h5 className="mb-4 font-semibold text-[#0B1120] flex items-center gap-2">
                  <Target size={20} className="text-cyan-500" />
                  Mistake-Progress-Analysis
                </h5>
                <Row>
                  <Col md={6}>
                    <div style={{ height: "350px" }}>
                      <Doughnut data={mistakeData} options={doughnutOptions} />
                    </div>
                    <div className="text-center mt-3">
                      <p className="text-gray-400 text-sm">
                        Total: <strong className="text-[#0B1120]">150</strong> Questions
                      </p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mt-4">
                      <h6 className="mb-3 font-semibold text-[#0B1120]">Priority Chapters (Based on NCERT Weightage)</h6>
                      <div className="space-y-3">
                        <div className="bg-red-50 rounded-xl p-4">
                          <h6 className="text-red-600 font-semibold mb-2 text-sm">HIGH PRIORITY</h6>
                          <p className="mb-1 font-bold text-[#0B1120]">Calculus - Integration</p>
                          <span className="text-xs text-gray-400">23% performance, 10% weightage</span>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4">
                          <h6 className="text-amber-600 font-semibold mb-2 text-sm">MEDIUM PRIORITY</h6>
                          <p className="mb-1 font-bold text-[#0B1120]">Quadratic Applications</p>
                          <span className="text-xs text-gray-400">83% performance, 12% weightage</span>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-4">
                          <h6 className="text-emerald-600 font-semibold mb-2 text-sm">MAINTAIN</h6>
                          <p className="mb-1 font-bold text-[#0B1120]">Trigonometry</p>
                          <span className="text-xs text-gray-400">93% performance, 10% weightage</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Filtered Results Section */}
                <div className="mt-8">
                  <h6 className="mb-3 font-semibold text-[#0B1120] flex items-center gap-2">
                    <Filter size={16} className="text-[#00A0E3]" />
                    Explore Your Questions In Different Ways
                  </h6>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="text-sm text-gray-600">Filter By Performance Percentage</Form.Label>
                        <Form.Select value={performanceFilter} onChange={(e) => setPerformanceFilter(e.target.value)}>
                          <option value="all">All Percentages</option>
                          <option value="90-100">90-100%</option>
                          <option value="80-90">80-90%</option>
                          <option value="70-80">70-80%</option>
                          <option value="below70">Below 70%</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="text-sm text-gray-600">Filter By Chapter</Form.Label>
                        <Form.Select value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)}>
                          <option value="all">All Chapters</option>
                          <option value="algebra">Algebra</option>
                          <option value="trigonometry">Trigonometry</option>
                          <option value="calculus">Calculus</option>
                          <option value="geometry">Geometry</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Card.Body>
            </Card>

            {/* Filtered Results Table */}
            <Card className="mt-4 border-0 shadow-sm rounded-xl">
              <Card.Header className="bg-[#F8FAFC] rounded-t-xl">
                <h6 className="mb-0 font-semibold text-[#0B1120]">Filtered Results - 20 Questions Found</h6>
                <small className="text-gray-400">Showing questions based on your selected filters</small>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        <th style={{ width: '5%' }}>Question ID</th>
                        <th style={{ width: '15%' }}>Chapter</th>
                        <th style={{ width: '8%' }}>Date</th>
                        <th style={{ width: '20%' }}>Question</th>
                        <th style={{ width: '8%' }}>My Score</th>
                        <th style={{ width: '10%' }}>Performance</th>
                        <th style={{ width: '8%' }}>Mistake Tracker</th>
                        <th style={{ width: '10%' }}>Current Status</th>
                        <th style={{ width: '16%' }}>Student Mistake</th>
                        <th style={{ width: '15%' }}>Correct Approach</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((result) => (
                        <tr key={result.id}>
                          <td className="font-bold text-[#00A0E3]">{result.id}</td>
                          <td><small>{result.chapter}</small></td>
                          <td><small>{result.date}</small></td>
                          <td><small>{result.question}</small></td>
                          <td><strong>{result.score}</strong></td>
                          <td>
                            <div className="flex items-center gap-2">
                              <ProgressBar
                                now={result.performance}
                                variant={result.performance >= 80 ? 'success' : result.performance >= 60 ? 'warning' : 'danger'}
                                style={{ width: '60px', height: '6px' }}
                                className="me-2"
                              />
                              <small>{result.performance}%</small>
                            </div>
                          </td>
                          <td><small className="text-gray-400">First submission, no prior mistakes</small></td>
                          <td>
                            <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                              result.status === 'CORRECT'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {result.status}
                            </span>
                          </td>
                          <td><small className="text-red-500">{result.studentMistake}</small></td>
                          <td><small className="text-emerald-500">{result.approach}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
              <Card.Footer className="bg-white rounded-b-xl">
                <div className="flex justify-between items-center">
                  <small className="text-gray-400">Showing 1-11 of 20 results</small>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-sm border border-[#00A0E3] text-[#00A0E3] rounded-lg hover:bg-[#00A0E3] hover:text-white transition-colors">Previous</button>
                    <button className="px-3 py-1.5 text-sm border border-[#00A0E3] text-[#00A0E3] rounded-lg hover:bg-[#00A0E3] hover:text-white transition-colors">Next</button>
                  </div>
                </div>
              </Card.Footer>
            </Card>
          </Tab.Pane>

          {/* Summary Tab */}
          <Tab.Pane eventKey="summary">
            <div className="mb-4">
              <h5 className="mb-3 font-bold text-[#0B1120]">Student Performance Summary</h5>
              <div className="flex gap-2 mb-4">
                <button
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    viewMode === 'all'
                      ? 'bg-emerald-500 text-white'
                      : 'border border-emerald-500 text-emerald-500 hover:bg-emerald-50'
                  }`}
                  onClick={() => setViewMode('all')}
                >
                  All Data
                </button>
                <button
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    viewMode === 'homework'
                      ? 'bg-[#00A0E3] text-white'
                      : 'border border-[#00A0E3] text-[#00A0E3] hover:bg-blue-50'
                  }`}
                  onClick={() => setViewMode('homework')}
                >
                  Homework
                </button>
                <button
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    viewMode === 'classwork'
                      ? 'bg-gray-600 text-white'
                      : 'border border-gray-400 text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setViewMode('classwork')}
                >
                  Classwork
                </button>
              </div>

              {/* Performance Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm text-center p-5">
                  <h2 className="text-3xl font-bold text-[#00A0E3] mb-0">{summaryStats.assessments}</h2>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Assessments</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm text-center p-5">
                  <h2 className="text-3xl font-bold text-cyan-500 mb-0">{summaryStats.chapters}</h2>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Chapters</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm text-center p-5">
                  <h2 className="text-3xl font-bold text-emerald-500 mb-0">{summaryStats.questions}</h2>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Questions</span>
                </div>
                <div className="bg-white rounded-xl shadow-sm text-center p-5">
                  <h2 className="text-3xl font-bold text-amber-500 mb-0">{summaryStats.accuracy}%</h2>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Accuracy</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overall Performance Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 h-full">
                  <h6 className="text-gray-400 mb-4 flex items-center gap-2 text-sm">
                    <TrendingUp size={16} className="text-[#00A0E3]" />
                    Overall Performance
                  </h6>
                  <div className="text-center mb-6">
                    <h1 className="text-6xl font-bold text-[#00A0E3]">59%</h1>
                    <p className="text-gray-400 text-sm mt-2">Focus on homework completion to improve understanding</p>
                  </div>
                  <div className="grid grid-cols-2 text-center mb-4">
                    <div>
                      <p className="mb-1 text-gray-400 text-sm">Homework Avg:</p>
                      <h4 className="text-xl font-bold text-[#0B1120]">{summaryStats.homeworkAvg}%</h4>
                    </div>
                    <div>
                      <p className="mb-1 text-gray-400 text-sm">Classwork Avg:</p>
                      <h4 className="text-xl font-bold text-[#0B1120]">{summaryStats.classworkAvg}%</h4>
                    </div>
                  </div>
                  <hr className="border-gray-100" />
                  <div className="grid grid-cols-2 text-center mt-4">
                    <div>
                      <p className="mb-1 text-gray-400 text-sm">Performance Gap:</p>
                      <h5 className="text-lg font-bold text-red-500">{summaryStats.performanceGap}%</h5>
                    </div>
                    <div>
                      <p className="mb-1 text-gray-400 text-sm">Improvement Rate:</p>
                      <h5 className="text-lg font-bold text-emerald-500">+{summaryStats.improvementRate}%</h5>
                    </div>
                  </div>
                </div>

                {/* Priority Chapters Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 h-full">
                  <h6 className="text-gray-400 mb-4 flex items-center gap-2 text-sm">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Priority Chapters (NCERT Weightage)
                  </h6>

                  <div className="space-y-3">
                    <div className="bg-red-50 rounded-xl p-4">
                      <h6 className="text-red-600 font-semibold mb-2 text-sm">HIGH PRIORITY</h6>
                      <p className="mb-1 font-bold text-[#0B1120]">Calculus - Integration</p>
                      <span className="text-xs text-gray-400">23% performance - 10% weightage</span>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-4">
                      <h6 className="text-amber-600 font-semibold mb-2 text-sm">MEDIUM PRIORITY</h6>
                      <p className="mb-1 font-bold text-[#0B1120]">Quadratic Applications</p>
                      <span className="text-xs text-gray-400">83% performance - 12% weightage</span>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-4">
                      <h6 className="text-emerald-600 font-semibold mb-2 text-sm">MAINTAIN PRIORITY</h6>
                      <p className="mb-1 font-bold text-[#0B1120]">Trigonometry</p>
                      <span className="text-xs text-gray-400">93% performance - 10% weightage</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                <h6 className="mb-4 font-semibold text-[#0B1120] flex items-center gap-2">
                  <Lightbulb size={18} className="text-amber-500" />
                  Recommendations
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-xl">
                    <BookOpen size={32} className="text-[#00A0E3] flex-shrink-0" />
                    <div>
                      <h6 className="font-semibold text-[#0B1120] mb-1">Review fundamental concepts thoroughly</h6>
                      <span className="text-xs text-gray-400">Focus on understanding basic principles before solving complex problems</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-[#F8FAFC] rounded-xl">
                    <CheckCircle size={32} className="text-emerald-500 flex-shrink-0" />
                    <div>
                      <h6 className="font-semibold text-[#0B1120] mb-1">Continue regular practice to maintain momentum</h6>
                      <span className="text-xs text-gray-400">Your improvement trend shows consistent progress</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default StudentAnalytics;
