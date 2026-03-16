import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// For development: use the same origin as the frontend
const isDevelopment = import.meta.env.DEV;
const apiUrl = isDevelopment ? window.location.origin : API_BASE_URL;

console.log('[API] Base URL:', apiUrl, 'isDevelopment:', isDevelopment);

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: { id: number; email: string; role: string };
  token: string;
}

export interface KnowledgeEntry {
  id: number;
  title: string;
  phenomenon: string;
  background: string;
  judgment: string;
  judgment_reason: string;
  alternative_options: string;
  future_verification: string;
  additional_1: string;
  additional_2: string;
  additional_3: string;
  additional_4: string;
  tags: Array<{ id: number; name: string; category: string; color: string }>;
  created_at: string;
  updated_at: string;
}

export interface CreateEntryRequest {
  title: string;
  phenomenon: string;
  background: string;
  judgment: string;
  judgment_reason: string;
  alternative_options: string;
  future_verification: string;
  additional_1: string;
  additional_2: string;
  additional_3: string;
  additional_4: string;
  tags: number[];
}

export interface Tag {
  id: number;
  name: string;
  category: string;
  color: string;
}

// Auth API
export const authAPI = {
  register: (email: string, password: string) =>
    api.post<LoginResponse>("/api/auth/register", { email, password }),
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/api/auth/login", { email, password }),
};

// Knowledge entries API
export const entriesAPI = {
  getAll: () => api.get<KnowledgeEntry[]>("/api/entries"),
  create: (data: CreateEntryRequest) => api.post<KnowledgeEntry>("/api/entries", data),
  update: (id: number, data: Partial<CreateEntryRequest>) =>
    api.put<KnowledgeEntry>(`/api/entries/${id}`, data),
  delete: (id: number) => api.delete(`/api/entries/${id}`),
};

// Tags API
export const tagsAPI = {
  getAll: () => api.get<Tag[]>("/api/tags"),
};

// Google Drive API
export const googleDriveAPI = {
  getAuthUrl: () => api.get("/api/google-drive/auth-url"),
  handleCallback: (code: string, userId: number) =>
    api.post("/api/google-drive/callback", { code, userId }),
  getStatus: () => api.get("/api/google-drive/status"),
  backup: () => api.post("/api/google-drive/backup", {}),
  exportCSV: () => api.get("/api/google-drive/export-csv"),
};

export default api;
