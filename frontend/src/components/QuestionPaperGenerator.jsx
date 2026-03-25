import React, { useState, useEffect, useMemo } from 'react';
import MarkdownWithMath from './MarkdownWithMath';
import {
  Book, Layers, FileText, Target, Check, CheckCircle, Search,
  ChevronDown, ChevronRight, ArrowLeft, Copy, Printer, Trash2,
  Filter, X, Info, AlertCircle
} from 'lucide-react';

// Configuration
const API_BASE_URL = 'https://qgen.smartlearners.ai/api';

// Math Text Renderer
const MathText = React.memo(({ text }) => {
  if (!text) return null;
  return <span><MarkdownWithMath content={text} /></span>;
});
MathText.displayName = 'MathText';

// Format question text with line breaks for paper preview
const formatQuestionText = (text) => {
  if (!text) return text;
  let formatted = text;

  // Replace literal \n with newline
  formatted = formatted.replace(/\\n/g, '\n');

  // Step 1: Mark combined patterns to keep them together on same line
  formatted = formatted.replace(/\((viii|vii|vi|iv|iii|ii|ix|v|i|x)\)\s*\(([a-z])\)/gi, '($1){{ALPHA:$2}}');
  formatted = formatted.replace(/(\s|^)(viii|vii|vi|iv|iii|ii|ix|v|i|x)\.\s*\(([a-z])\)/gi, '$1$2.{{ALPHA:$3}}');

  // Step 2: Add newlines before Roman numerals with parentheses
  formatted = formatted.replace(/(\s|^)\((viii|vii|vi|iv|iii|ii|ix|v|i|x)\)/gi, '$1\n($2)');
  formatted = formatted.replace(/(\s|^)(viii|vii|vi|iv|iii|ii|ix|v|i|x)\./gi, '$1\n$2.');

  // Step 3: Add newlines before standalone alphabetic options (unmarked ones only)
  formatted = formatted.replace(/(\s|^)\(([a-z])\)/gi, '$1\n($2)');

  // Step 4: Restore marked alpha patterns with space
  formatted = formatted.replace(/\{\{ALPHA:([a-z])\}\}/gi, ' ($1)');

  // Clean up multiple newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  formatted = formatted.replace(/^\n+/, '');

  return formatted.trim();
};

// Paper Question Text Renderer with formatting
const PaperQuestionText = React.memo(({ text }) => {
  if (!text) return null;
  const formattedText = formatQuestionText(text);
  return <span><MarkdownWithMath content={formattedText} /></span>;
});
PaperQuestionText.displayName = 'PaperQuestionText';

// Custom Hooks
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (e) { console.error(e); }
  };
  return [storedValue, setValue];
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// API Service
const api = {
  async getClasses() { return (await fetch(`${API_BASE_URL}/classes/`)).json(); },
  async getClassDetails(id) { return (await fetch(`${API_BASE_URL}/classes/${id}/`)).json(); },
  async getClassWeightage(id) { return (await fetch(`${API_BASE_URL}/classes/${id}/weightage/`)).json(); },
  async getChapters(classId) { return (await fetch(`${API_BASE_URL}/chapters/?class_id=${classId}`)).json(); },
  async getChapterQuestions(chapterId) { return (await fetch(`${API_BASE_URL}/chapters/${chapterId}/`)).json(); },
  async getDashboardStats() { return (await fetch(`${API_BASE_URL}/dashboard/`)).json(); },
};

// Section colors matching teacher dashboard theme
const getSectionStyle = (section) => ({
  A: { bg: '#f0f9ff', text: '#0369a1', border: '#0ea5e9' },
  B: { bg: '#f0fdf4', text: '#15803d', border: '#22c55e' },
  C: { bg: '#fffbeb', text: '#b45309', border: '#f59e0b' },
  D: { bg: '#fdf2f8', text: '#be185d', border: '#ec4899' },
  E: { bg: '#f5f3ff', text: '#0080B8', border: '#00A0E3' },
}[section] || { bg: '#f8fafc', text: '#475569', border: '#94a3b8' });

// Main Component
export default function QuestionPaperGenerator() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [chapterQuestions, setChapterQuestions] = useState({});
  const [selectedQuestions, setSelectedQuestions] = useLocalStorage('qpg-selected', {});
  const [weightageData, setWeightageData] = useState([]);
  const [view, setView] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examDuration, setExamDuration] = useState('3 Hours');
  const [expandedSections, setExpandedSections] = useState({ A: true, B: true, C: true, D: true, E: true });

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    Promise.all([
      api.getClasses().then(d => setClasses(d.results || d)),
      api.getDashboardStats().then(setDashboardStats)
    ]).catch(() => showNotification('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedClass) {
      api.getChapters(selectedClass.id).then(d => setChapters(d.results || d)).catch(() => showNotification('Failed to load chapters', 'error'));
      api.getClassWeightage(selectedClass.id).then(setWeightageData).catch(console.error);
    }
  }, [selectedClass]);

  const loadChapterQuestions = async (chapterId) => {
    if (chapterQuestions[chapterId]) return;
    try {
      const data = await api.getChapterQuestions(chapterId);
      setChapterQuestions(prev => ({ ...prev, [chapterId]: data.questions || [] }));
    } catch { showNotification('Failed to load questions', 'error'); }
  };

  const handleClassSelect = (cls) => { setSelectedClass(cls); setExpandedChapters({}); setView('questions'); };
  const handleChapterToggle = (chapter) => {
    const isExpanded = expandedChapters[chapter.id];
    setExpandedChapters(prev => ({ ...prev, [chapter.id]: !isExpanded }));
    if (!isExpanded) loadChapterQuestions(chapter.id);
  };
  const handleQuestionToggle = (question, chapter) => {
    const key = `${chapter.id}_${question.id}`;
    setSelectedQuestions(prev => prev[key]
      ? (({ [key]: _, ...rest }) => rest)(prev)
      : { ...prev, [key]: { ...question, chapter: chapter.name, chapterId: chapter.id } }
    );
  };
  const handleClearSelection = () => { setSelectedQuestions({}); showNotification('Selection cleared', 'info'); };
  const handleSectionToggle = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  const handleGeneratePaper = () => {
    if (!Object.keys(selectedQuestions).length) return showNotification('Please select at least one question', 'warning');
    setView('paper');
  };
  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  // Computed Values
  const totalSelectedQuestions = Object.keys(selectedQuestions).length;
  const totalSelectedMarks = Object.values(selectedQuestions).reduce((sum, q) => sum + (q.marks || 0), 0);
  const sectionCounts = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    Object.values(selectedQuestions).forEach(q => { if (counts[q.section] !== undefined) counts[q.section]++; });
    return counts;
  }, [selectedQuestions]);
  const selectedMarksPerChapter = useMemo(() => {
    const marks = {};
    Object.values(selectedQuestions).forEach(q => { if (q.chapterId) marks[q.chapterId] = (marks[q.chapterId] || 0) + (q.marks || 0); });
    return marks;
  }, [selectedQuestions]);
  const selectedMarksPerUnit = useMemo(() => {
    const marks = {};
    weightageData.forEach(unit => {
      marks[unit.id] = (unit.chapters || []).reduce((sum, ch) => sum + (selectedMarksPerChapter[ch.id] || 0), 0);
    });
    return marks;
  }, [weightageData, selectedMarksPerChapter]);
  const filteredChapters = useMemo(() => {
    if (!debouncedSearch) return chapters;
    const q = debouncedSearch.toLowerCase();
    return chapters.filter(ch => ch.name.toLowerCase().includes(q) || ch.unit_name?.toLowerCase().includes(q));
  }, [chapters, debouncedSearch]);

  // Notifications Component
  const Notifications = () => (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map(n => (
        <div key={n.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-right ${
          n.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          n.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          n.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {n.type === 'error' || n.type === 'warning' ? <AlertCircle size={18} /> :
           n.type === 'success' ? <CheckCircle size={18} /> : <Info size={18} />}
          <span>{n.message}</span>
          <button className="ml-2 hover:opacity-70" onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}><X size={16} /></button>
        </div>
      ))}
    </div>
  );

  // Dashboard View
  const DashboardView = () => (
    <div className="animate-in fade-in duration-300">
      {/* Stats Cards */}
      {dashboardStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-[#00A0E3]">
              <Book size={24} />
            </div>
            <div>
              <span className="block text-2xl font-bold text-[#0B1120]">{dashboardStats.total_classes || 0}</span>
              <span className="text-sm text-gray-500">Total Classes</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <Layers size={24} />
            </div>
            <div>
              <span className="block text-2xl font-bold text-[#0B1120]">{dashboardStats.total_units || 0}</span>
              <span className="text-sm text-gray-500">Total Units</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <FileText size={24} />
            </div>
            <div>
              <span className="block text-2xl font-bold text-[#0B1120]">{dashboardStats.total_chapters || 0}</span>
              <span className="text-sm text-gray-500">Total Chapters</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
              <Target size={24} />
            </div>
            <div>
              <span className="block text-2xl font-bold text-[#0B1120]">{dashboardStats.total_questions || 0}</span>
              <span className="text-sm text-gray-500">Total Questions</span>
            </div>
          </div>
        </div>
      )}

      {/* Class Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#0B1120]">Select a Class</h2>
          <p className="text-sm text-gray-500 mt-1">Choose a class to start building your question paper</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#00A0E3] hover:shadow-md cursor-pointer transition-all duration-200"
              onClick={() => handleClassSelect(cls)}
            >
              <div className="text-3xl">{cls.icon || '\uD83D\uDCDA'}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#0B1120] truncate">{cls.display_name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Layers size={14} /> {cls.total_units || '\u2014'} Units</span>
                  <span className="flex items-center gap-1"><FileText size={14} /> {cls.total_chapters || '\u2014'} Chapters</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Question Selection View
  const QuestionSelectionView = () => (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Class Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center gap-4">
            <button
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#0B1120] rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => { setSelectedClass(null); setView('dashboard'); }}
            >
              <ArrowLeft size={20} /> Back
            </button>
            <span className="text-2xl">{selectedClass?.icon || '\uD83D\uDCDA'}</span>
            <div>
              <h1 className="text-lg font-bold text-[#0B1120]">{selectedClass?.display_name}</h1>
              <p className="text-sm text-gray-500">{chapters.length} Chapters &bull; {selectedClass?.total_marks || 80} Marks</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search chapters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00A0E3] focus:border-[#00A0E3] outline-none text-sm"
              />
              {searchQuery && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setSearchQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-sm text-gray-500 font-medium"><Filter size={16} /> Section:</span>
              {['all', 'A', 'B', 'C', 'D', 'E'].map(s => (
                <button
                  key={s}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    sectionFilter === s
                      ? 'bg-[#00A0E3] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setSectionFilter(s)}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Chapters List */}
          <div className="flex flex-col gap-3">
            {filteredChapters.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center text-center">
                <Search size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-[#0B1120]">No chapters found</h3>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search query</p>
              </div>
            ) : filteredChapters.map(chapter => {
              const isExpanded = expandedChapters[chapter.id];
              const questions = chapterQuestions[chapter.id] || [];
              const selectedCount = Object.keys(selectedQuestions).filter(k => k.startsWith(`${chapter.id}_`)).length;
              const chapterMarks = selectedMarksPerChapter[chapter.id] || 0;
              let chapterTarget = 0;
              weightageData.forEach(u => { const ch = u.chapters?.find(c => c.id === chapter.id); if (ch) chapterTarget = ch.calculated_weightage || 0; });
              const filteredQs = sectionFilter === 'all' ? questions : questions.filter(q => q.section === sectionFilter);
              const grouped = {};
              filteredQs.forEach(q => { grouped[q.section] = grouped[q.section] || []; grouped[q.section].push(q); });

              return (
                <div key={chapter.id} className={`bg-white rounded-xl shadow-sm border ${isExpanded ? 'border-[#00A0E3]/30' : 'border-gray-100'} overflow-hidden`}>
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleChapterToggle(chapter)}
                  >
                    <span className="text-gray-400">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#0B1120] text-sm">{chapter.name}</h3>
                      <span className="text-xs text-gray-500">{chapter.total_questions || questions.length} questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {chapterTarget > 0 && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          chapterMarks > chapterTarget ? 'bg-red-100 text-red-700' :
                          chapterMarks >= chapterTarget * 0.8 ? 'bg-amber-100 text-amber-700' :
                          chapterMarks > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {chapterMarks}/{chapterTarget} marks
                        </span>
                      )}
                      {selectedCount > 0 && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#00A0E3]/10 text-[#00A0E3]">
                          {selectedCount} selected
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {!Object.keys(grouped).length ? (
                        <div className="p-6 text-center text-sm text-gray-500">
                          {questions.length === 0 ? 'Loading questions...' : 'No questions match the filter'}
                        </div>
                      ) : ['A', 'B', 'C', 'D', 'E'].map(section => {
                        const sectionQs = grouped[section];
                        if (!sectionQs?.length) return null;
                        const style = getSectionStyle(section);
                        const isSectionExpanded = expandedSections[section];
                        return (
                          <div key={section}>
                            <div
                              className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold cursor-pointer"
                              style={{ background: style.bg, color: style.text, borderLeft: `4px solid ${style.border}` }}
                              onClick={() => handleSectionToggle(section)}
                            >
                              <div className="flex items-center gap-2">
                                {isSectionExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                <span>Section {section}</span>
                              </div>
                              <span className="text-xs">{sectionQs.length} Qs &bull; {sectionQs.reduce((s, q) => s + (q.marks || 0), 0)} Marks</span>
                            </div>
                            {isSectionExpanded && sectionQs.map(q => {
                              const key = `${chapter.id}_${q.id}`;
                              const isSelected = !!selectedQuestions[key];
                              return (
                                <div
                                  key={q.id}
                                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                                    isSelected ? 'bg-[#00A0E3]/5' : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => handleQuestionToggle(q, chapter)}
                                >
                                  <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                                    isSelected ? 'bg-[#00A0E3] border-[#00A0E3] text-white' : 'border-gray-300'
                                  }`}>
                                    {isSelected && <Check size={14} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-[#0B1120]"><MathText text={q.question_text} /></div>
                                    {q.figure && (
                                      <div className="mt-2 max-w-xs">
                                        <img
                                          className="rounded-lg border border-gray-200"
                                          src={q.figure.startsWith('data:') ? q.figure : q.figure.startsWith('/9j/') || q.figure.startsWith('9j/') ? `data:image/jpeg;base64,${q.figure.startsWith('/') ? q.figure : '/' + q.figure}` : `data:image/png;base64,${q.figure}`}
                                          alt="Question figure"
                                        />
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.text }}>
                                        {q.question_subtype || q.question_type || `Section ${section}`}
                                      </span>
                                      <span className="text-xs text-gray-500 font-medium">{q.marks} Mark{q.marks !== 1 ? 's' : ''}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          {/* Selection Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#0B1120] mb-4">
              <CheckCircle size={18} className="text-[#00A0E3]" /> Selection Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <span className="block text-2xl font-bold text-[#0B1120]">{totalSelectedQuestions}</span>
                <span className="text-xs text-gray-500">Questions</span>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <span className="block text-2xl font-bold text-[#0B1120]">{totalSelectedMarks}</span>
                <span className="text-xs text-gray-500">Total Marks</span>
              </div>
            </div>
            {totalSelectedQuestions > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {Object.entries(sectionCounts).map(([s, c]) => c > 0 && (
                  <span key={s} className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: getSectionStyle(s).bg, color: getSectionStyle(s).text }}>
                    Sec {s}: {c}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGeneratePaper}
                disabled={!totalSelectedQuestions}
              >
                <FileText size={18} /> Generate Paper
              </button>
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleClearSelection}
                disabled={!totalSelectedQuestions}
              >
                <Trash2 size={18} /> Clear All
              </button>
            </div>
          </div>

          {/* Weightage Progress */}
          {weightageData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-[#0B1120] mb-4">Weightage Progress</h3>
              {(() => {
                const totalTarget = weightageData.reduce((sum, u) => sum + (u.weightage || 0), 0);
                const totalSelected = Object.values(selectedMarksPerUnit).reduce((sum, m) => sum + m, 0);
                const pct = totalTarget > 0 ? Math.min((totalSelected / totalTarget) * 100, 100) : 0;
                return (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Overall</span>
                      <span className={`font-semibold ${totalSelected > totalTarget ? 'text-red-600' : 'text-[#0B1120]'}`}>{totalSelected} / {totalTarget}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${totalSelected > totalTarget ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-[#00A0E3]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
              <div className="flex flex-col gap-3">
                {weightageData.map(unit => {
                  const unitSelected = selectedMarksPerUnit[unit.id] || 0;
                  const unitTarget = unit.weightage || 0;
                  const pct = unitTarget > 0 ? Math.min((unitSelected / unitTarget) * 100, 100) : 0;
                  return (
                    <div key={unit.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 truncate max-w-[60%]">{unit.short_name || unit.name?.split(': ')[1] || unit.name}</span>
                        <span className={`font-semibold ${unitSelected > unitTarget ? 'text-red-600' : 'text-gray-700'}`}>{unitSelected}/{unitTarget}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${unitSelected > unitTarget ? 'bg-red-500' : unitSelected >= unitTarget * 0.8 ? 'bg-amber-500' : 'bg-[#00A0E3]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {unit.chapters?.length > 0 && (
                        <div className="ml-3 mt-1.5 flex flex-col gap-1">
                          {unit.chapters.map(ch => {
                            const chMarks = selectedMarksPerChapter[ch.id] || 0;
                            const chTarget = ch.calculated_weightage || 0;
                            return (
                              <div key={ch.id} className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-500 truncate max-w-[60%]">{ch.short_name || ch.name}</span>
                                <span className={`font-medium ${chMarks > chTarget ? 'text-red-600' : 'text-gray-500'}`}>{chMarks}/{chTarget}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );

  // Paper Preview View
  const PaperPreviewView = () => {
    const questionsList = Object.values(selectedQuestions);
    const grouped = {};
    questionsList.forEach(q => { grouped[q.section] = grouped[q.section] || []; grouped[q.section].push(q); });
    let qNum = 1;

    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
            onClick={() => setView('questions')}
          >
            <ArrowLeft size={18} /> Back to Selection
          </button>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-600 font-medium">Duration:</label>
            <select
              value={examDuration}
              onChange={(e) => setExamDuration(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A0E3] focus:border-[#00A0E3] outline-none"
            >
              <option value="30 Minutes">30 Minutes</option>
              <option value="45 Minutes">45 Minutes</option>
              <option value="1 Hour">1 Hour</option>
              <option value="1.5 Hours">1.5 Hours</option>
              <option value="2 Hours">2 Hours</option>
              <option value="2.5 Hours">2.5 Hours</option>
              <option value="3 Hours">3 Hours</option>
              <option value="3.5 Hours">3.5 Hours</option>
              <option value="4 Hours">4 Hours</option>
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
              onClick={() => { navigator.clipboard.writeText(document.getElementById('paper-content')?.innerText || ''); showNotification('Copied to clipboard!', 'success'); }}
            >
              <Copy size={18} /> Copy
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-[#00A0E3] hover:bg-[#0080B8] text-white rounded-lg text-sm font-semibold transition-colors"
              onClick={() => window.print()}
            >
              <Printer size={18} /> Print
            </button>
          </div>
        </div>

        <div id="paper-content" className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto print:shadow-none print:border-none">
          <header className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#0B1120]">{selectedClass?.display_name}</h1>
            <h2 className="text-lg text-gray-600 mt-1">Question Paper</h2>
            <div className="flex items-center justify-center gap-6 mt-3 text-sm text-gray-500">
              <span>Total Questions: {questionsList.length}</span>
              <span>Total Marks: {totalSelectedMarks}</span>
              <span>Duration: {examDuration}</span>
            </div>
          </header>

          <hr className="border-gray-200 mb-6" />

          {['A', 'B', 'C', 'D', 'E'].map(section => {
            const sectionQs = grouped[section];
            if (!sectionQs?.length) return null;
            const style = getSectionStyle(section);
            const sectionMarks = sectionQs.reduce((s, q) => s + (q.marks || 0), 0);
            return (
              <section key={section} className="mb-8">
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-lg font-bold text-sm mb-4"
                  style={{ background: style.bg, color: style.text, borderLeft: `4px solid ${style.border}` }}
                >
                  <span>Section {section}</span>
                  <span className="text-xs font-semibold">{sectionQs.length} Questions &bull; {sectionMarks} Marks</span>
                </div>
                <div className="flex flex-col gap-4">
                  {sectionQs.map((q, i) => {
                    const num = qNum++;
                    return (
                      <div key={i} className="flex gap-3">
                        <span className="font-bold text-[#0B1120] text-sm min-w-[2rem]">{num}.</span>
                        <div className="flex-1 text-sm text-[#0B1120]">
                          <PaperQuestionText text={q.question_text} />
                          {q.figure && (
                            <div className="mt-2 max-w-sm">
                              <img
                                className="rounded-lg border border-gray-200"
                                src={q.figure.startsWith('data:') ? q.figure : q.figure.startsWith('/9j/') || q.figure.startsWith('9j/') ? `data:image/jpeg;base64,${q.figure.startsWith('/') ? q.figure : '/' + q.figure}` : `data:image/png;base64,${q.figure}`}
                                alt="Figure"
                              />
                            </div>
                          )}
                        </div>
                        <span
                          className="text-xs font-bold px-2 py-1 rounded-lg self-start whitespace-nowrap"
                          style={{ background: style.bg, color: style.text }}
                        >
                          [{q.marks}M]
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <footer className="text-center text-gray-400 text-sm pt-6 border-t border-gray-200 mt-8">
            <p>--- End of Question Paper ---</p>
          </footer>
        </div>
      </div>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#00A0E3] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500">Loading Question Paper Generator...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <Notifications />
      {view === 'dashboard' && <DashboardView />}
      {view === 'questions' && <QuestionSelectionView />}
      {view === 'paper' && <PaperPreviewView />}
    </div>
  );
}
