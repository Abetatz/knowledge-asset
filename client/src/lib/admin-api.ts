import api from "./api";

export interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: "admin" | "user";
}

export const adminAPI = {
  getUsers: () => api.get<User[]>("/api/admin/users"),
  createUser: (data: CreateUserRequest) => api.post<User>("/api/admin/users", data),
  deleteUser: (id: number) => api.delete(`/api/admin/users/${id}`),
  updatePassword: (id: number, password: string) =>
    api.put(`/api/admin/users/${id}/password`, { password }),
};
