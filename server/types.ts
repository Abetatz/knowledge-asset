// Backend type definitions

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEntry {
  id: number;
  user_id: number;
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
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  category: string;
  color: string;
  created_at: string;
}

export interface GoogleDriveToken {
  id: number;
  user_id: number;
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  created_at: string;
  updated_at: string;
}

export interface JWTPayload {
  id: number;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface KnowledgeEntryRequest {
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
