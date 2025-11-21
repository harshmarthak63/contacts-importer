export interface Contact {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  agentUid?: string;
  createdOn: Date | string;
  [key: string]: any; // For custom fields
}

export interface ContactField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'phone' | 'email' | 'datetime';
  core: boolean;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  designation?: 'Agent' | 'Sales' | 'Developer' | 'HR';
  agentId?: string;
}

export interface FieldMapping {
  fileColumn: string;
  systemField: string;
  confidence?: number;
}

export interface ImportSummary {
  created: number;
  merged: number;
  skipped: number;
  errors: string[];
}

export interface ParsedFileData {
  headers: string[];
  rows: Record<string, any>[];
}

