import axios from 'axios';

const QUIZ_API_BASE = 'https://quizmode.smartlearners.ai';

const quizApi = axios.create({
  baseURL: QUIZ_API_BASE,
  timeout: 1200000,
  headers: { 'Content-Type': 'application/json' },
});

export const fetchClasses = (subject) => {
  const params = subject && subject !== 'PHYSICS' ? { subject } : {};
  return quizApi.get('/api/v1/classes', { params });
};

export const fetchChapters = (classNum, subject) => {
  const params = subject ? { subject } : {};
  return quizApi.get(`/api/v1/classes/${classNum}/chapters`, { params });
};

export const generateQuestions = (payload) =>
  quizApi.post('/api/v1/generate-questions', payload);

export const evaluateAnswers = (payload) =>
  quizApi.post('/api/evaluate-exam/', payload);

export const fetchCheatsheet = (payload) =>
  quizApi.post('/api/v1/fetch-cheatsheet', payload);

// learning path questions targeting broken/weak bridges
export const generateLearningPath = (payload) =>
  quizApi.post('/api/generate-learning-path', payload);

export default quizApi;
