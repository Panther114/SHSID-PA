export interface Subject {
  name: string;
  levels: string[];
}

export interface Guide {
  id: number;
  title: string;
  subject: string;
  subject_level: string;
  issue_number: number;
  pdf_url: string;
  created_at?: string;
}

export type Theme = 'dark' | 'light' | 'pink';
export type AuthRole = 'admin' | 'student' | null;

export const SEMESTER_PERIODS = [
  { label: 'Semester 1 Midterms', value: 1, titlePrefix: 'Semester 1 Midterm' },
  { label: 'Semester 1 Finals',   value: 2, titlePrefix: 'Semester 1 Final'   },
  { label: 'Semester 2 Midterms', value: 3, titlePrefix: 'Semester 2 Midterm' },
  { label: 'Semester 2 Finals',   value: 4, titlePrefix: 'Semester 2 Final'   },
] as const;

export const SEMESTER_PERIOD_LABEL: Record<number, string> = Object.fromEntries(
  SEMESTER_PERIODS.map(p => [p.value, p.label])
);
