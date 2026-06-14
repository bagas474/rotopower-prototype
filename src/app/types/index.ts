export interface Role {
  id: number;
  name: string;
  description: string;
  is_system?: boolean;
}

export interface Competence {
  id: number;
  name: string;
  category?: string;
  description?: string;
  esco_uri?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: number[];
  role_names: string[];
  sites: number[];
  site_names: string[];
  all_sites: boolean;
}

export interface UserCompetence {
  competence_id: number;
  competence_name: string;
  level: number;
  source: string;
}

export interface WorkRole {
  role_id: number;
  role_name: string;
  is_primary: boolean;
}

export interface Worker {
  id: number;
  site_id: number;
  user_id: number | null;
  display_name: string;
  employee_no: string;
  stress_level: number;
  psychological_load: number;
  availability_next_7d_pct: number;
}
