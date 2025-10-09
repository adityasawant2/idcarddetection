export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'police' | 'admin';
  is_approved: boolean;
  created_at: string;
}

export interface VerificationResult {
  id_number: string;
  verification: 'legit' | 'fake' | 'unknown';
  image_similarity?: number;
  confidence: number;
  parsed_fields: Record<string, any>;
  errors: string[];
}

export interface Log {
  id: string;
  police_user_id: string;
  dl_code_checked?: string;
  verification_result: 'legit' | 'fake' | 'unknown';
  image_similarity?: number;
  confidence?: number;
  parsed_fields?: Record<string, any>;
  created_at: string;
  police_user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LogFilter {
  user_id?: string;
  start_date?: string;
  end_date?: string;
  verification_result?: 'legit' | 'fake' | 'unknown';
  limit?: number;
  offset?: number;
}


