import { format, startOfWeek, addDays } from 'date-fns'

export type AttendanceStatus = 'full' | 'half' | 'absent'

export interface AttendanceDay {
  date: string
  status: AttendanceStatus
  applied_rate: number
  attendance_percentage: number
  overtime_hours: number
  late_minutes: number
  hours_worked: number
  computed_salary: number
}

export interface ProductionLog {
  log_id: string
  user_id: string
  user_name: string
  order_id: string
  product_name: string
  quantity: number
  category?: string
  completed_at: string
}

export interface PayrollRecord {
  id: string
  employee_id: string
  name: string
  role?: string
  current_rate: number
  daily_rate?: number
  ot_rate: number
  attendance: AttendanceDay[]
  weekly_total: number
  profile_picture?: string
  attendance_days?: number
  overtime_hours?: number
  gross_pay?: number
  basic_salary?: number
  overtime_pay?: number
  deductions?: number
  net_salary?: number
  status?: string
}


export interface EmployeeTodayRecord {
  id: string
  name: string
  email: string
  role: string
  status_today: 'pending' | 'full' | 'half' | 'present' | 'absent' | 'holiday'
  holiday_type: 'none' | 'regular' | 'special_work' | 'non_working'
  daily_rate: number
  start_time: string | null
  end_time: string | null
  break_start: string | null
  break_end: string | null
  overtime: number
  late: number
  holiday_pay: number
  total_earnings: number
  is_paid: boolean
  hours_worked?: number
}

export const calculateDailySalary = (
  day: Partial<AttendanceDay>,
  dailyRate: number,
  otRate: number,
): number => {
  const percentage = day.status === 'full' ? 1 : day.status === 'half' ? 0.5 : 0
  const overtime = day.overtime_hours || 0
  const lateMins = day.late_minutes || 0
  const appliedDailyRate = day.applied_rate || dailyRate

  const hourlyRate = appliedDailyRate / 8 // Assuming 8-hour workday for deduction purposes
  const lateDeduction = (lateMins / 60) * hourlyRate

  return Math.max(
    0,
    percentage * appliedDailyRate + overtime * otRate - lateDeduction,
  )
}

export const generateEmptyWeek = (
  startDate: Date,
  baseRate: number = 0,
): AttendanceDay[] => {
  const start = startOfWeek(startDate, { weekStartsOn: 1 })
  return Array.from({ length: 7 }).map((_, i) => {
    // i = 0 (Monday) through i = 6 (Sunday) because weekStartsOn: 1
    const isSunday = i === 6
    return {
      date: format(addDays(start, i), 'yyyy-MM-dd'),
      status: isSunday ? 'absent' : 'full',
      applied_rate: isSunday ? 0 : baseRate,
      attendance_percentage: isSunday ? 0 : 1,
      overtime_hours: 0,
      late_minutes: 0,
      hours_worked: isSunday ? 0 : 8,
      computed_salary: isSunday ? 0 : baseRate,
    }
  })
}
