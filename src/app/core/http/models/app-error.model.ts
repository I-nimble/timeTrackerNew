export interface AppErrorValidationIssue {
  field: string;
  error: string;
}

export interface AppError {
  message: string;
  status?: number;
  url?: string;
  technical?: string;
  timestamp: Date;
  validation?: AppErrorValidationIssue[];
  original?: unknown;
}
