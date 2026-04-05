import { format, startOfWeek, addDays } from 'date-fns';

export type AttendanceStatus = 'full' | 'half' | 'absent';

export interface AttendanceDay {
  date: string;
  status: AttendanceStatus;
  applied_rate: number;
  attendance_percentage: number;
  overtime_hours: number;
  computed_salary: number;
}

export interface ProductionLog {
  log_id: string;
  user_id: string;
  user_name: string;
  order_id: string;
  product_name: string;
  quantity: number;
  category?: string;
  completed_at: string;
}

export interface PayrollRecord {
  employee_id: string;
  name: string;
  role: string;
  current_rate: number;
  ot_rate: number;
  attendance: AttendanceDay[];
  weekly_total: number;
  logs?: ProductionLog[]; 
}

export interface WeeklySalaryData {
  employee_id: string;
  week_start: string;
  attendance: AttendanceDay[];
  weekly_total: number;
}

export const calculateDailySalary = (day: Partial<AttendanceDay>, dailyRate: number, otRate: number): number => {
  const percentage = day.status === 'full' ? 1 : day.status === 'half' ? 0.5 : 0;
  const overtime = day.overtime_hours || 0;
  return (percentage * (day.applied_rate || dailyRate)) + (overtime * otRate);
};

export const generateEmptyWeek = (startDate: Date): AttendanceDay[] => {
  const start = startOfWeek(startDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }).map((_, i) => ({
    date: format(addDays(start, i), 'yyyy-MM-dd'),
    status: 'absent',
    applied_rate: 0,
    attendance_percentage: 0,
    overtime_hours: 0,
    computed_salary: 0
  }));
};
