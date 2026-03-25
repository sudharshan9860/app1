// axiosInstance.jsx
import axios from "axios";
import { getErrorMessage } from "../utils/errorHandling";

// =============================
// Token management
// =============================
const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
const setAccessToken = (access) => localStorage.setItem(ACCESS_KEY, access);
const clearAccessToken = () => localStorage.removeItem(ACCESS_KEY);

const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
const setRefreshToken = (refresh) => localStorage.setItem(REFRESH_KEY, refresh);
const clearRefreshToken = () => localStorage.removeItem(REFRESH_KEY);

const clearAllTokens = () => {
  clearAccessToken();
  clearRefreshToken();
};

// =============================
// Create axios instance
// =============================
const axiosInstance = axios.create({
  baseURL: "https://autogen.aieducator.com",
  headers: { "Content-Type": "application/json" },
  timeout: 300000,
});

// =============================
// Refresh handling
// =============================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// =============================
// Request Interceptor
// =============================
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !config.url.includes("/api/token/")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =============================
// Response Interceptor
// =============================
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.code === "ECONNABORTED") {
      return Promise.reject(new Error("Request timed out. Please try again."));
    }

    // Handle expired access token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes("/api/token/") || originalRequest.url.includes("/api/logout/")) {
        clearAllTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token found");

        const response = await axios.post(
          "https://autogen.aieducator.com/api/token/refresh/",
          { refresh: refreshToken }
        );

        const { access } = response.data;
        setAccessToken(access);

        processQueue(null, access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAllTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const errorMessage = getErrorMessage(error);
    return Promise.reject(new Error(errorMessage));
  }
);

// =============================
// Authentication API methods
// =============================
axiosInstance.login = async (username, password) => {
  const response = await axiosInstance.post("/api/token/", {
    username,
    password,
  });
  const { access, refresh,fullname } = response.data;
  setAccessToken(access);
  setRefreshToken(refresh);
  if(fullname!=null) await localStorage.setItem("fullName", fullname || "");
  return response.data;
};

axiosInstance.logout = async () => {
  try {
    const refresh = localStorage.getItem("refreshToken");
    await axiosInstance.post("/api/logout/", { refresh });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearAllTokens();
  }
};

axiosInstance.verifyToken = async () => {
  const token = getAccessToken();
  if (!token) throw new Error("No token found");
  const response = await axiosInstance.get("/api/token/verify/");
  return response.data;
};

// =============================
// File upload with JWT
// =============================
axiosInstance.uploadFile = async (url, formData, progressCallback) => {
  try {
    const response = await axiosInstance.post(url, formData, {
      timeout: 180000,
      onUploadProgress: (progressEvent) => {
        if (progressCallback && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          progressCallback(percentCompleted);
        }
      },
    });
    return response;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      error.friendlyMessage = "Upload timed out. Please try again.";
    } else if (error.response?.status === 413) {
      error.friendlyMessage = "File too large. Please upload a smaller file.";
    } else {
      error.friendlyMessage = "Error uploading file. Please try again.";
    }
    throw error;
  }
};

// =============================
// Quiz CRUD (JWT-authenticated)
// =============================
axiosInstance.createQuiz = async (data) => {
  const response = await axiosInstance.post('/api/quizzes/', data);
  return response.data;
};

axiosInstance.fetchQuizzes = async () => {
  const response = await axiosInstance.get('/api/quizzes/');
  return response.data;
};

axiosInstance.updateQuizQuestions = async (quizId, questions) => {
  const response = await axiosInstance.put('/api/quizz/questions/update/', {
    quiz_id: quizId,
    questions,
  });
  return response.data;
};

// =============================
// Marketing API Instance (for registration, payments)
// =============================
const marketingApi = axios.create({
  baseURL: "https://smartgen.smartlearners.ai",
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

// Marketing API does not need JWT auth
marketingApi.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

marketingApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.detail || error.message || "An error occurred";
    return Promise.reject(new Error(errorMessage));
  }
);

// =============================
// Marketing API methods
// =============================

// Register a new user (paid subscription)
marketingApi.registerUser = async (data) => {
  const response = await marketingApi.post("/api/register", data);
  return response.data;
};

// Initiate payment with PhonePe
marketingApi.initiatePayment = async (registrationId) => {
  const response = await marketingApi.post("/api/payment/initiate", {
    registration_id: registrationId,
  });
  return response.data;
};

// Check payment status
marketingApi.checkPaymentStatus = async (orderId) => {
  const response = await marketingApi.get(`/api/payment/status/${orderId}`);
  return response.data;
};

// Register free trial user
marketingApi.createFreeTrialUser = async (data) => {
  const response = await marketingApi.post("/api/free-trial/register", data);
  return response.data;
};

// Contact form submission
marketingApi.submitContactForm = async (data) => {
  const response = await marketingApi.post("/api/contact", data);
  return response.data;
};

export { marketingApi };
export default axiosInstance;
