// API Types
export interface User {
  id: string
  email: string
  is_active: boolean
  is_verified: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  type: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  project_id?: string
  type: 'pdf' | 'docx' | 'url' | 'text'
  filename?: string
  url?: string
  content: string
  doc_metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

// CV Matcher Specific Types
export interface CVData {
  name: string
  email?: string
  phone?: string
  skills: string[]
  experience: ExperienceItem[]
  education: EducationItem[]
  rawText: string
}

export interface ExperienceItem {
  title: string
  company: string
  duration: string
  description: string
}

export interface EducationItem {
  degree: string
  institution: string
  year: string
}

export interface JobDescription {
  title: string
  company: string
  requirements: string[]
  responsibilities: string[]
  rawText: string
}

export interface MatchResult {
  overallScore: number
  strengths: string[]
  gaps: string[]
  recommendations: string[]
  detailedAnalysis: string
}
