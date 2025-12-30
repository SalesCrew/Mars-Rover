export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'gl' | 'admin';
  firstName: string;
  lastName: string;
  gebietsleiter_id?: string;
  avatarUrl?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  role: 'gl' | 'admin';
  firstName: string;
  lastName: string;
  gebietsleiter_id?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
