import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Calendar, Clock, AlertCircle, Coffee, X, Edit2, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'react-toastify'
import { useReactToPrint } from 'react-to-print'
import axiosInstance from '../../../lib/axiosInstance'
import { PayrollPayslipComponent } from '../payroll/PayrollPayslipComponent'

interface AttendanceLog {
  id: number
  date: string
  start_time: string | null
  end_time: string | null
  break_start: string | null
  break_end: string | null
  status: 'pending' | 'full' | 'half' | 'present' | 'absent' | 'holiday'
  holiday_type: 'none' | 'regular' | 'special_work' | 'non_working'
  is_paid: boolean
  overtime: number
  late: number
  total_earnings: number
  holiday_pay: number
}

interface EmployeeInfo {
  id: string
  name: string
  daily_rate: number
  ot_rate: number
  role?: string
}

const ManageAttendance: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [employee, setEmployee] = useState<EmployeeInfo | null>(null)
  const [logs, setLogs] = useState<AttendanceLog[]>([])

  // -----------------------
  // NEW RECORD FORM STATE
  // -----------------------
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [status, setStatus] = useState<'pending' | 'full' | 'half' | 'present' | 'absent' | 'holiday'>('full')
  const [holidayType, setHolidayType] = useState<'none' | 'regular' | 'special_work' | 'non_working'>('none')
  const [overtime, setOvertime] = useState<number>(0)
  const [late, setLate] = useState<number>(0)
  const [dailyRate, setDailyRate] = useState<number>(0)
  const [totalEarnings, setTotalEarnings] = useState<number>(0)
  const [isManualEarnings, setIsManualEarnings] = useState(false)
  const [holidayPay, setHolidayPay] = useState<number>(0)
  const [isEditManualEarnings, setIsEditManualEarnings] = useState(false)

  // Modals State
  const [editLog, setEditLog] = useState<AttendanceLog | null>(null)
  const [deleteLogTarget, setDeleteLogTarget] = useState<string | null>(null)
  const [selectedLogDates, setSelectedLogDates] = useState<string[]>([])
  const [bulkPayModalOpen, setBulkPayModalOpen] = useState(false)
  const [rowEndTarget, setRowEndTarget] = useState<AttendanceLog | null>(null)
  const [selectedLogMobile, setSelectedLogMobile] = useState<AttendanceLog | null>(null)

  // Print State & Refs
  interface PrintableReceiptRecord {
    id: string
    employee_id: string
    name: string
    role: string
    current_rate: number
    ot_rate: number
    weekly_total: number
    attendance: {
      date: string
      status: 'full' | 'half' | 'absent'
      applied_rate: number
      attendance_percentage: number
      overtime_hours: number
      late_minutes: number
      hours_worked: number
      computed_salary: number
    }[]
  }

  const [printableRecord, setPrintableRecord] = useState<PrintableReceiptRecord | null>(null)
  const [shouldTriggerPrint, setShouldTriggerPrint] = useState(false)
  const [printReceiptChecked, setPrintReceiptChecked] = useState(true)
  const payslipRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: payslipRef,
  })

  useEffect(() => {
    if (printableRecord && shouldTriggerPrint) {
      setShouldTriggerPrint(false)
      const timerId = setTimeout(() => {
        handlePrint()
      }, 150)
      return () => clearTimeout(timerId)
    }
  }, [printableRecord, shouldTriggerPrint, handlePrint])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    // Check if a record already exists for this selectedDate
    const existingLog = logs.find((l) => l.date === selectedDate)
    if (existingLog) {
      setStartTime(existingLog.start_time || '')
      setEndTime(existingLog.end_time || '')
      setStatus(existingLog.status)
      setHolidayType(existingLog.holiday_type)
      setHolidayPay(existingLog.holiday_pay)
      setOvertime(existingLog.overtime)
      setLate(existingLog.late)
      setTotalEarnings(existingLog.total_earnings)
      setIsManualEarnings(true)
    } else {
      // Reset form to defaults when creating new
      setStartTime(format(new Date(), 'HH:mm'))
      setEndTime('')
      setStatus('full')
      setHolidayType('none')
      setHolidayPay(0)
      setOvertime(0)
      setLate(0)
      setIsManualEarnings(false)
    }
  }, [selectedDate, logs])

  useEffect(() => {
    if (editLog) {
      setIsEditManualEarnings(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editLog?.id])

  useEffect(() => {
    if (employee) {
      setDailyRate(Number(employee.daily_rate))
    }
  }, [employee])

  // Auto-calculate Total Earnings for New Record if not manually edited
  useEffect(() => {
    if (isManualEarnings || !employee) return
    
    let base = 0
    if (status === 'full' || status === 'present') base = dailyRate
    else if (status === 'half') base = dailyRate / 2
    else if (status === 'holiday' && holidayType !== 'none') base = dailyRate // Assuming paid holiday by default
    
    const hourlyRate = dailyRate / 8
    const otEarned = overtime * hourlyRate
    const lateDeduction = late * (dailyRate / 480)
    const calculated = Math.max(0, base + otEarned - lateDeduction + holidayPay)
    
    setTotalEarnings(Number(calculated.toFixed(2)))
  }, [status, holidayType, overtime, late, holidayPay, dailyRate, isManualEarnings, employee])

  // Auto-calculate Total Earnings for Edit Record if not manually edited
  useEffect(() => {
    if (!editLog || isEditManualEarnings || !employee) return
    
    let base = 0
    const status = editLog.status
    const holidayType = editLog.holiday_type
    const overtime = editLog.overtime || 0
    const late = editLog.late || 0
    const holidayPay = editLog.holiday_pay || 0
    const rate = Number(employee.daily_rate)
    
    if (status === 'full' || status === 'present') base = rate
    else if (status === 'half') base = rate / 2
    else if (status === 'holiday' && holidayType !== 'none') base = rate
    
    const hourlyRate = rate / 8
    const otEarned = overtime * hourlyRate
    const lateDeduction = late * (rate / 480)
    const calculated = Math.max(0, base + otEarned - lateDeduction + holidayPay)
    
    if (Number(calculated.toFixed(2)) !== editLog.total_earnings) {
      setEditLog(prev => prev ? { ...prev, total_earnings: Number(calculated.toFixed(2)) } : null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editLog?.status, editLog?.holiday_type, editLog?.overtime, editLog?.late, editLog?.holiday_pay, isEditManualEarnings, employee])

  // Force total earnings to zero for non-working day
  useEffect(() => {
    if (status === 'holiday' && holidayType === 'non_working') {
      setTotalEarnings(0)
    }
  }, [status, holidayType])

  useEffect(() => {
    if (editLog && editLog.status === 'holiday' && editLog.holiday_type === 'non_working') {
      if (editLog.total_earnings !== 0) {
        setEditLog(prev => prev ? { ...prev, total_earnings: 0 } : null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editLog?.status, editLog?.holiday_type])

  const handleBulkPay = async () => {
    if (!employee) return
    setIsSaving(true)
    try {
      const selectedLogs = logs.filter(l => selectedLogDates.includes(l.date))
      const totalAmount = selectedLogs.reduce((sum, log) => sum + log.total_earnings, 0)

      const sortedDates = [...selectedLogDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      const startDate = sortedDates[0]
      const endDate = sortedDates[sortedDates.length - 1]
      const formattedStartDate = format(new Date(startDate), 'yyyy-MM-dd')
      const formattedEndDate = format(new Date(endDate), 'yyyy-MM-dd')
      const dateRangeStr = startDate === endDate ? formattedStartDate : `${formattedStartDate} to ${formattedEndDate}`

      // 1. Mark each log as paid in the database
      const payrollPromise = Promise.all(selectedLogDates.map(async (dateStr) => {
        const log = logs.find(l => l.date === dateStr)
        if (!log) return
        await axiosInstance.post(`/api/admin/payroll/manage/${id}`, {
          date: log.date,
          start_time: log.start_time,
          end_time: log.end_time,
          break_start: log.break_start,
          break_end: log.break_end,
          status: log.status,
          holiday_type: log.holiday_type,
          overtime: log.overtime,
          late: log.late,
          is_paid: true, // Mark as paid
          total_earnings: log.total_earnings,
          holiday_pay: log.holiday_pay,
        })
      }))

      // 2. Create expenditure record
      const expenditurePromise = totalAmount > 0
        ? axiosInstance.post('/api/admin/expenditures', {
            category: 'Employee Salaries',
            amount: totalAmount,
            description: `Payroll for ${employee.name} (${dateRangeStr})`,
          })
        : Promise.resolve()

      await Promise.all([payrollPromise, expenditurePromise])

      // 3. Print receipt if toggle is checked
      if (printReceiptChecked) {
        const attendanceDays = selectedLogs.map(log => {
          let statusStr: 'full' | 'half' | 'absent' = 'absent'
          if (log.status === 'full' || log.status === 'present' || log.status === 'holiday') {
            statusStr = 'full'
          } else if (log.status === 'half') {
            statusStr = 'half'
          }
          return {
            date: log.date,
            status: statusStr,
            applied_rate: employee.daily_rate,
            attendance_percentage: statusStr === 'full' ? 1 : statusStr === 'half' ? 0.5 : 0,
            overtime_hours: log.overtime,
            late_minutes: log.late,
            hours_worked: statusStr === 'full' ? 8 : statusStr === 'half' ? 4 : 0,
            computed_salary: log.total_earnings,
          }
        })

        const receiptRecord = {
          id: employee.id,
          employee_id: employee.id,
          name: employee.name,
          role: employee.role || 'Staff / Employee',
          current_rate: employee.daily_rate,
          ot_rate: employee.ot_rate,
          weekly_total: totalAmount,
          attendance: attendanceDays,
        }

        setPrintableRecord(receiptRecord)
        setShouldTriggerPrint(true)
      }

      toast.success('Selected records marked as paid.')
      setSelectedLogDates([])
      fetchData(true)
    } catch (error) {
      console.error('Failed to bulk pay', error)
      toast.error('Failed to mark selected records as paid.')
    } finally {
      setIsSaving(false)
      setBulkPayModalOpen(false)
    }
  }

  const handleSingleRowEnd = async () => {
    if (!rowEndTarget) return
    setIsSaving(true)
    try {
      const currentTime = format(new Date(), 'HH:mm')
      await axiosInstance.post(`/api/admin/payroll/manage/${id}`, {
        date: rowEndTarget.date,
        start_time: rowEndTarget.start_time,
        end_time: currentTime,
        break_start: rowEndTarget.break_start,
        break_end: rowEndTarget.break_end,
        status: rowEndTarget.status,
        holiday_type: rowEndTarget.holiday_type,
        overtime: rowEndTarget.overtime,
        late: rowEndTarget.late,
        is_paid: rowEndTarget.is_paid,
        total_earnings: rowEndTarget.total_earnings,
        holiday_pay: rowEndTarget.holiday_pay,
      })
      toast.success(`End time set to ${currentTime} for ${format(new Date(rowEndTarget.date), 'MMM dd')}`)
      setRowEndTarget(null)
      fetchData(true)
    } catch (error) {
      console.error('Failed to set end time', error)
      toast.error('Failed to set end time.')
    } finally {
      setIsSaving(false)
    }
  }

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const response = await axiosInstance.get(`/api/admin/payroll/manage/${id}`)
      setEmployee(response.data.employee)
      setLogs(response.data.attendance)
    } catch (error) {
      console.error('Failed to fetch attendance', error)
      toast.error('Failed to load employee attendance.')
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const handleNewRecordAction = () => {
    const existingLog = logs.find((l) => l.date === selectedDate)
    if (existingLog) {
      setEditLog({ ...existingLog })
    } else {
      handleCreateNew()
    }
  }

  const handleCreateNew = async () => {
    setIsSaving(true)
    const isUpdate = logs.some((l) => l.date === selectedDate)
    try {
      await axiosInstance.post(`/api/admin/payroll/manage/${id}`, {
        date: selectedDate,
        start_time: startTime || null,
        end_time: endTime || null,
        status,
        holiday_type: holidayType,
        overtime,
        late,
        is_paid: false, // creation/override is always is_paid == 0 on submit
        daily_rate: dailyRate,
        total_earnings: totalEarnings,
        holiday_pay: holidayPay,
      })
      toast.success(isUpdate ? 'Attendance updated.' : 'New attendance recorded.')
      fetchData(true)
    } catch (error) {
      console.error('Failed to save attendance', error)
      toast.error('Failed to save attendance.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteLogTarget) return

    setIsSaving(true)
    try {
      await axiosInstance.delete(`/api/admin/payroll/manage/${id}/${deleteLogTarget}`)
      toast.success('Attendance record deleted.')
      setDeleteLogTarget(null)
      fetchData(true)
    } catch (error) {
      console.error('Failed to delete attendance', error)
      toast.error('Failed to delete record.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateEdit = async () => {
    if (!editLog) return

    setIsSaving(true)
    try {
      await axiosInstance.post(`/api/admin/payroll/manage/${id}`, {
        date: editLog.date,
        start_time: editLog.start_time || null,
        end_time: editLog.end_time || null,
        break_start: editLog.break_start || null,
        break_end: editLog.break_end || null,
        status: editLog.status,
        holiday_type: editLog.holiday_type,
        overtime: editLog.overtime,
        late: editLog.late,
        is_paid: editLog.is_paid,
        total_earnings: editLog.total_earnings,
        holiday_pay: editLog.holiday_pay,
      })
      toast.success('Attendance updated.')
      setEditLog(null)
      fetchData(true)
    } catch (error) {
      console.error('Failed to update attendance', error)
      toast.error('Failed to update attendance.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBreakUpdate = async (dateStr: string, type: 'start' | 'end') => {
    setIsSaving(true)
    try {
      const currentTime = format(new Date(), 'HH:mm')
      await axiosInstance.patch(`/api/admin/payroll/manage/${id}/${dateStr}/break`, {
        type,
        time: currentTime
      })
      toast.success(`Break ${type} updated to ${currentTime}`)
      fetchData(true)
    } catch (error) {
      console.error('Failed to update break time', error)
      toast.error('Failed to update break time.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent" />
      </div>
    )
  }

  if (!employee) return <div>Employee not found.</div>

  return (
    <div className="mx-auto max-w-[1700px] space-y-8 px-6 py-12 lg:px-12 relative">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/payroll')}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xl shadow-slate-200/40 transition-all hover:scale-105"
        >
          <ArrowLeft size={20} className="text-slate-900" />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
            Manage Attendance
          </h1>
          <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
            {employee.name}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* NEW RECORD FORM */}
        <div className="h-fit space-y-6 rounded-[30px] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Calendar className="text-blue-500" size={20} />
            <h2 className="text-sm font-black tracking-widest text-slate-900 uppercase">
              New Record
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Target Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
            
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceLog['status'])}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold uppercase text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="full">Present (Full)</option>
                <option value="present">Present</option>
                <option value="half">Present (Half)</option>
                <option value="absent">Absent</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1">
                <Clock size={12} /> Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1">
                  <Clock size={12} /> End Time
                </label>
                <button
                  type="button"
                  onClick={() => setEndTime(format(new Date(), 'HH:mm'))}
                  className="text-[9px] font-black tracking-widest text-blue-600 hover:text-blue-800 uppercase px-2 py-0.5 bg-blue-50 hover:bg-blue-100 rounded-md transition-all active:scale-95"
                >
                  Set Current
                </button>
              </div>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1">
                <Clock size={12} /> OT Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={overtime}
                onChange={(e) => setOvertime(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1">
                <AlertCircle size={12} /> Late Mins
              </label>
              <input
                type="number"
                min="0"
                value={late}
                onChange={(e) => setLate(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Holiday Type
              </label>
              <select
                value={holidayType}
                onChange={(e) => {
                  const type = e.target.value as AttendanceLog['holiday_type']
                  setHolidayType(type)
                  if (type === 'special_work') {
                    setHolidayPay(dailyRate)
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold uppercase text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                <option value="none">None</option>
                <option value="regular">Regular</option>
                <option value="special_work">Special / Work</option>
                <option value="non_working">Non-Working</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Holiday Pay
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₱</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={holidayPay}
                  onChange={(e) => setHolidayPay(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 rounded-2xl bg-slate-50 p-6 border border-slate-100">
            <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4 border-b border-slate-200 pb-2">Financial Overrides</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-600 uppercase">
                  Daily Rate (Base)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-4 py-3 font-mono text-sm font-black text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Updates employee profile</p>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black tracking-widest text-emerald-600 uppercase">
                  Earned Amount (Total Earnings)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-emerald-500">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalEarnings}
                    onChange={(e) => {
                      setTotalEarnings(parseFloat(e.target.value) || 0)
                      setIsManualEarnings(true)
                    }}
                    className="w-full rounded-xl border border-emerald-200 bg-emerald-50 pl-8 pr-4 py-3 font-mono text-sm font-black text-emerald-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
                  {isManualEarnings ? 'Manual Override Active' : 'Auto-calculated based on status & OT'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 justify-center">
            <button
              onClick={handleNewRecordAction}
              disabled={isSaving}
              className="flex w-[250px] items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-[11px] font-black tracking-widest text-white uppercase shadow-xl hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save size={16} />
              )}
              {logs.some((l) => l.date === selectedDate) ? 'Update Record Today' : 'Create Record'}
            </button>
          </div>
        </div>

        {/* BOTTOM: HISTORY TABLE */}
        <div className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40 hidden md:block">
          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center justify-between min-h-[76px]">
            <h3 className="text-xs font-black tracking-widest text-slate-900 uppercase">
              Register History
            </h3>
            {selectedLogDates.length > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  {selectedLogDates.length} selected
                </span>
                <button
                  onClick={() => setBulkPayModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  Pay Selected
                </button>
              </div>
            )}
          </div>
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase w-12">
                    <input
                      type="checkbox"
                      checked={logs.length > 0 && selectedLogDates.length === logs.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLogDates(logs.map(l => l.date))
                        } else {
                          setSelectedLogDates([])
                        }
                      }}
                      className="rounded border-slate-200 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Start</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">End</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Break Start</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Break End</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">OT / Late</th>
                  <th className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Paid</th>
                  <th className="px-6 py-4 text-[10px] text-right font-black tracking-widest text-slate-400 uppercase">Earned</th>
                  <th className="px-6 py-4 text-[10px] text-right font-black tracking-widest text-slate-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      {!log.is_paid ? (
                        <input
                          type="checkbox"
                          checked={selectedLogDates.includes(log.date)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLogDates([...selectedLogDates, log.date])
                            } else {
                              setSelectedLogDates(selectedLogDates.filter(d => d !== log.date))
                            }
                          }}
                          className="rounded border-slate-200 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                        />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                      {format(new Date(log.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                      {log.start_time || '--:--'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                      {log.end_time || '--:--'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                      {log.break_start || '--:--'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                      {log.break_end || '--:--'}
                    </td>
                    <td className="px-6 py-4">
                      {log.holiday_type !== 'none' ? (
                         <span className="inline-flex rounded bg-rose-100 px-2 py-1 text-[9px] font-black uppercase text-rose-600">Holiday ({log.holiday_type.replace('_', ' ')})</span>
                      ) : log.status === 'full' || log.status === 'present' ? (
                         <span className="inline-flex rounded bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase text-emerald-600">Present</span>
                      ) : log.status === 'half' ? (
                         <span className="inline-flex rounded bg-amber-100 px-2 py-1 text-[9px] font-black uppercase text-amber-600">Half</span>
                      ) : log.status === 'pending' ? (
                         <span className="inline-flex rounded bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-600">Pending</span>
                      ) : (
                         <span className="inline-flex rounded bg-rose-100 px-2 py-1 text-[9px] font-black uppercase text-rose-600">Absent</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      {log.overtime > 0 && <span className="text-blue-500">{log.overtime}h OT </span>}
                      {log.late > 0 && <span className="text-rose-400">{log.late}m Late</span>}
                      {log.overtime === 0 && log.late === 0 && '-'}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">
                      {log.is_paid ? (
                        <span className="text-emerald-500">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-black text-slate-900">
                      ₱{log.total_earnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Break Quick Actions */}
                        {!log.break_start && (
                          <button
                            title="Start Break"
                            disabled={isSaving}
                            onClick={() => handleBreakUpdate(log.date, 'start')}
                            className="rounded-lg bg-amber-50 p-2 text-amber-500 transition-colors hover:bg-amber-500 hover:text-white disabled:opacity-50"
                          >
                            <Coffee size={14} />
                          </button>
                        )}
                        {!log.break_end && (
                          <button
                            title="End Break"
                            disabled={isSaving}
                            onClick={() => handleBreakUpdate(log.date, 'end')}
                            className="group relative rounded-lg bg-emerald-50 p-2 text-emerald-500 transition-colors hover:bg-emerald-500 hover:text-white disabled:opacity-50 overflow-hidden"
                          >
                            <Coffee size={14} />
                            <div className="absolute top-1/2 left-1/2 w-[18px] h-[2px] bg-emerald-500 -translate-x-1/2 -translate-y-1/2 -rotate-45 group-hover:bg-white"></div>
                          </button>
                        )}

                        {(!log.break_start || !log.break_end) && !log.end_time && (
                          <div className="w-px h-4 bg-slate-200 mx-1"></div>
                        )}

                        {/* End Paid Action Shortcuts */}
                        {!log.end_time && (
                          <button
                            disabled={isSaving}
                            onClick={() => setRowEndTarget(log)}
                            className="rounded-lg bg-slate-100 p-2 text-slate-700 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
                            title="Set End Time"
                          >
                            <Clock size={14} />
                          </button>
                        )}

                        {!log.is_paid && (
                          <button
                            disabled={isSaving}
                            onClick={() => {
                              setSelectedLogDates([log.date])
                              setBulkPayModalOpen(true)
                            }}
                            className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white disabled:opacity-50"
                            title="Mark as Paid"
                          >
                            <Save size={14} />
                          </button>
                        )}

                        <div className="w-px h-4 bg-slate-200 mx-1"></div>

                        {/* Standard Actions */}
                        <button
                          onClick={() => setEditLog({...log})} // open modal
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition-colors hover:bg-blue-500 hover:text-white"
                          title="Edit Record"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteLogTarget(log.date)}
                          className="rounded-lg bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-500 hover:text-white"
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-slate-400 text-sm font-bold">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card List for Register History */}
        <div className="block md:hidden space-y-4">
          <div className="bg-slate-50/80 px-6 py-4 rounded-[24px] border border-slate-100 flex items-center justify-between min-h-[60px]">
            <h3 className="text-xs font-black tracking-widest text-slate-900 uppercase">
              Register History
            </h3>
            {selectedLogDates.length > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  {selectedLogDates.length} selected
                </span>
                <button
                  onClick={() => setBulkPayModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  Pay Selected
                </button>
              </div>
            )}
          </div>

          {logs.map((log) => (
            <div key={log.id} className="relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  {!log.is_paid ? (
                    <input
                      type="checkbox"
                      checked={selectedLogDates.includes(log.date)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLogDates([...selectedLogDates, log.date])
                        } else {
                          setSelectedLogDates(selectedLogDates.filter(d => d !== log.date))
                        }
                      }}
                      className="rounded border-slate-200 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer mr-2"
                    />
                  ) : (
                    <div className="w-4 h-4 mr-2" />
                  )}
                  <div>
                    <div className="font-mono text-sm font-bold text-slate-900">
                      {format(new Date(log.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                      {log.is_paid ? (
                        <span className="text-emerald-500">Paid</span>
                      ) : (
                        <span className="text-slate-400">Unpaid</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {log.holiday_type !== 'none' ? (
                     <span className="inline-flex rounded bg-rose-100 px-2 py-0.5 text-[8px] font-black uppercase text-rose-600">Holiday</span>
                  ) : log.status === 'full' || log.status === 'present' ? (
                     <span className="inline-flex rounded bg-emerald-100 px-2 py-0.5 text-[8px] font-black uppercase text-emerald-600">Present</span>
                  ) : log.status === 'half' ? (
                     <span className="inline-flex rounded bg-amber-100 px-2 py-0.5 text-[8px] font-black uppercase text-amber-600">Half</span>
                  ) : log.status === 'pending' ? (
                     <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-[8px] font-black uppercase text-slate-600">Pending</span>
                  ) : (
                     <span className="inline-flex rounded bg-rose-100 px-2 py-0.5 text-[8px] font-black uppercase text-rose-600">Absent</span>
                  )}
                  <span className="font-mono text-sm font-black text-slate-900 mt-1">
                    ₱{log.total_earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                <div className="text-[10px] font-medium text-slate-400">
                  {log.start_time || '--:--'} - {log.end_time || '--:--'}
                </div>
                <button
                  onClick={() => setSelectedLogMobile(log)}
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800"
                >
                  View Actions
                </button>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="rounded-[24px] border border-slate-100 bg-white p-12 text-center text-slate-400 text-sm font-bold shadow-lg">
              No attendance records found.
            </div>
          )}
        </div>

        {/* Mobile Modal for Detailed Attendance Log Actions */}
        {selectedLogMobile && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setSelectedLogMobile(null)}
            />
            <div className="relative w-full max-w-md overflow-hidden rounded-[30px] bg-white p-8 shadow-2xl animate-in slide-in-from-bottom duration-250 sm:zoom-in-95 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h3 className="text-md font-black text-slate-900">
                    Log Details
                  </h3>
                  <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase mt-0.5">
                    {format(new Date(selectedLogMobile.date), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedLogMobile(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Detailed specs */}
                <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs">
                  <div>
                    <span className="block text-[8px] font-black tracking-widest text-slate-400 uppercase">Start Time</span>
                    <span className="block font-mono font-bold text-slate-800 mt-0.5">{selectedLogMobile.start_time || '--:--'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black tracking-widest text-slate-400 uppercase">End Time</span>
                    <span className="block font-mono font-bold text-slate-800 mt-0.5">{selectedLogMobile.end_time || '--:--'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black tracking-widest text-slate-400 uppercase">Break Start</span>
                    <span className="block font-mono font-bold text-slate-800 mt-0.5">{selectedLogMobile.break_start || '--:--'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black tracking-widest text-slate-400 uppercase">Break End</span>
                    <span className="block font-mono font-bold text-slate-800 mt-0.5">{selectedLogMobile.break_end || '--:--'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black tracking-widest text-slate-400 uppercase">Overtime</span>
                    <span className="block font-mono font-bold text-slate-800 mt-0.5">
                      {selectedLogMobile.overtime > 0 ? `${selectedLogMobile.overtime}h` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black tracking-widest text-slate-400 uppercase">Late Minutes</span>
                    <span className="block font-mono font-bold text-slate-800 mt-0.5">
                      {selectedLogMobile.late > 0 ? `${selectedLogMobile.late}m` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black tracking-widest text-slate-400 uppercase">Settlement Status</span>
                    <span className="block font-mono font-bold text-slate-800 mt-0.5">
                      {selectedLogMobile.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black tracking-widest text-slate-400 uppercase">Earned Amount</span>
                    <span className="block font-mono font-black text-emerald-600 mt-0.5">
                      ₱{selectedLogMobile.total_earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="space-y-3">
                  <span className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Actions</span>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Break controls */}
                    {!selectedLogMobile.break_start && (
                      <button
                        onClick={() => {
                          handleBreakUpdate(selectedLogMobile.date, 'start');
                          setSelectedLogMobile(null);
                        }}
                        className="inline-flex justify-center items-center gap-1.5 rounded-xl bg-amber-50 py-3 text-[10px] font-black uppercase tracking-widest text-amber-600 border border-amber-100 hover:bg-amber-100 transition-all animate-in fade-in"
                      >
                        <Coffee size={12} /> Start Break
                      </button>
                    )}
                    {selectedLogMobile.break_start && !selectedLogMobile.break_end && (
                      <button
                        onClick={() => {
                          handleBreakUpdate(selectedLogMobile.date, 'end');
                          setSelectedLogMobile(null);
                        }}
                        className="inline-flex justify-center items-center gap-1.5 rounded-xl bg-emerald-50 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-all animate-in fade-in"
                      >
                        <Coffee size={12} /> End Break
                      </button>
                    )}
                    
                    {/* End log control */}
                    {!selectedLogMobile.end_time && (
                      <button
                        onClick={() => {
                          setRowEndTarget(selectedLogMobile);
                          setSelectedLogMobile(null);
                        }}
                        className="inline-flex justify-center items-center gap-1.5 rounded-xl bg-slate-100 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-200 transition-all animate-in fade-in"
                      >
                        <Clock size={12} /> End Time
                      </button>
                    )}

                    {/* Mark as paid control */}
                    {!selectedLogMobile.is_paid && (
                      <button
                        onClick={() => {
                          setSelectedLogDates([selectedLogMobile.date]);
                          setBulkPayModalOpen(true);
                          setSelectedLogMobile(null);
                        }}
                        className="inline-flex justify-center items-center gap-1.5 rounded-xl bg-emerald-500 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-md hover:bg-emerald-600 transition-all animate-in fade-in"
                      >
                        <Save size={12} /> Settle
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setEditLog({...selectedLogMobile});
                          setSelectedLogMobile(null);
                        }}
                        className="inline-flex justify-center items-center gap-1.5 rounded-xl bg-blue-50 py-3 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-100 transition-all"
                      >
                        Edit Log
                      </button>
                      <button
                        onClick={() => {
                          setDeleteLogTarget(selectedLogMobile.date);
                          setSelectedLogMobile(null);
                        }}
                        className="inline-flex justify-center items-center gap-1.5 rounded-xl bg-rose-50 py-3 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedLogMobile(null)}
                      className="w-full rounded-xl bg-slate-50 py-3 text-[10px] font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- */}
      {/*     EDIT MODAL       */}
      {/* -------------------- */}
      {editLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditLog(null)}></div>
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[30px] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6">
              <div>
                <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase">
                  Edit Record
                </h3>
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-1">
                  {format(new Date(editLog.date), 'MMMM dd, yyyy')}
                </p>
              </div>
              <button
                onClick={() => setEditLog(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Status */}
                <div>
                  <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">Status</label>
                  <select
                    value={editLog.status}
                    onChange={(e) => setEditLog({...editLog, status: e.target.value as AttendanceLog['status']})}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold uppercase text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="full">Present (Full)</option>
                    <option value="present">Present</option>
                    <option value="half">Present (Half)</option>
                    <option value="absent">Absent</option>
                    <option value="holiday">Holiday</option>
                  </select>
                </div>

                {/* Holiday Type */}
                <div>
                  <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">Holiday Type</label>
                  <select
                    value={editLog.holiday_type}
                    onChange={(e) => setEditLog({...editLog, holiday_type: e.target.value as AttendanceLog['holiday_type']})}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold uppercase text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="none">None</option>
                    <option value="regular">Regular</option>
                    <option value="special_work">Special / Work</option>
                    <option value="non_working">Non-Working</option>
                  </select>
                </div>

                {/* Holiday Pay */}
                <div>
                  <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase">Holiday Pay</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₱</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editLog.holiday_pay || 0}
                      onChange={(e) => setEditLog({...editLog, holiday_pay: parseFloat(e.target.value) || 0})}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Times */}
                <div>
                  <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1"><Clock size={12}/> Start Time</label>
                  <input type="time" value={editLog.start_time || ''} onChange={(e) => setEditLog({...editLog, start_time: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1"><Clock size={12}/> End Time</label>
                    <button
                      type="button"
                      onClick={() => setEditLog(prev => prev ? { ...prev, end_time: format(new Date(), 'HH:mm') } : null)}
                      className="text-[9px] font-black tracking-widest text-blue-600 hover:text-blue-800 uppercase px-2 py-0.5 bg-blue-50 hover:bg-blue-100 rounded-md transition-all active:scale-95"
                    >
                      Set Current
                    </button>
                  </div>
                  <input type="time" value={editLog.end_time || ''} onChange={(e) => setEditLog({...editLog, end_time: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none" />
                </div>
                
                <div className="hidden lg:block"></div>

                <div>
                  <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1"><Coffee size={12}/> Break Start</label>
                  <input type="time" value={editLog.break_start || ''} onChange={(e) => setEditLog({...editLog, break_start: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1"><Coffee size={12}/> Break End</label>
                  <input type="time" value={editLog.break_end || ''} onChange={(e) => setEditLog({...editLog, break_end: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none" />
                </div>

                <div className="hidden lg:block"></div>

                {/* Offenses */}
                <div>
                  <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1">OT Hours</label>
                  <input type="number" min="0" step="0.5" value={editLog.overtime} onChange={(e) => setEditLog({...editLog, overtime: parseFloat(e.target.value) || 0})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1">Late Mins</label>
                  <input type="number" min="0" value={editLog.late} onChange={(e) => setEditLog({...editLog, late: parseInt(e.target.value) || 0})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none" />
                </div>
              </div>

              {/* Edit Modal Financials */}
              <div className="mt-6 rounded-2xl bg-slate-50 p-6 border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block text-[10px] font-black tracking-widest text-emerald-600 uppercase">
                      Total Earned
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-emerald-500">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editLog.total_earnings}
                        onChange={(e) => {
                          setEditLog({...editLog, total_earnings: parseFloat(e.target.value) || 0})
                          setIsEditManualEarnings(true)
                        }}
                        className="w-full rounded-xl border border-emerald-200 bg-emerald-50 pl-8 pr-4 py-3 font-mono text-sm font-black text-emerald-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center h-full pt-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={editLog.is_paid}
                          onChange={(e) => setEditLog({...editLog, is_paid: e.target.checked})}
                        />
                        <div className="block h-8 w-14 rounded-full bg-slate-200 transition-colors peer-checked:bg-emerald-500"></div>
                        <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform peer-checked:translate-x-6"></div>
                      </div>
                      <span className="text-[10px] font-black tracking-widest text-slate-900 uppercase">
                        Payment Settled
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setEditLog(null)}
                className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEdit}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-slate-900 text-xs font-black uppercase tracking-widest text-white shadow-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {isSaving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save size={16} />}
                Update Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- */}
      {/*    DELETE MODAL      */}
      {/* -------------------- */}
      {deleteLogTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteLogTarget(null)}></div>
          <div className="relative w-full max-w-sm overflow-hidden rounded-[30px] bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <AlertCircle size={32} />
            </div>
            <h3 className="mb-2 text-xl font-black tracking-tighter text-slate-900 uppercase">
              Delete Record?
            </h3>
            <p className="mb-8 text-sm font-medium text-slate-500">
              Are you sure you want to delete the attendance record for{' '}
              <strong className="text-slate-900 font-bold">{format(new Date(deleteLogTarget), 'MMM dd, yyyy')}</strong>? This action cannot be undone.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={isSaving}
                className="flex w-full items-center justify-center rounded-xl bg-rose-500 py-4 text-xs font-black tracking-widest text-white shadow-xl shadow-rose-500/20 uppercase transition-all hover:bg-rose-600 disabled:opacity-50"
              >
                {isSaving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setDeleteLogTarget(null)}
                className="w-full rounded-xl bg-slate-50 py-4 text-xs font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- */}
      {/* -------------------- */}
      {/*   BULK PAY MODAL     */}
      {/* -------------------- */}
      {bulkPayModalOpen && (() => {
        const selectedLogs = logs.filter(l => selectedLogDates.includes(l.date))
        const totalAmount = selectedLogs.reduce((sum, log) => sum + log.total_earnings, 0)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setBulkPayModalOpen(false)}></div>
            <div className="relative w-full max-w-md overflow-hidden rounded-[30px] bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                <Save size={32} />
              </div>
              <h3 className="mb-2 text-xl font-black tracking-tighter text-slate-900 uppercase">
                Pay Selected?
              </h3>
              <p className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Marking <strong>{selectedLogDates.length}</strong> record(s) as paid
              </p>

              {/* Show selected dates & amounts */}
              <div className="my-4 max-h-40 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left custom-scrollbar">
                <ul className="space-y-2 text-xs font-bold text-slate-700">
                  {selectedLogs.map((log) => (
                    <li key={log.id} className="flex justify-between border-b border-slate-200 pb-1.5 last:border-0 last:pb-0">
                      <span className="font-mono text-slate-500">{format(new Date(log.date), 'MMM dd, yyyy')}</span>
                      <span className="text-slate-900 font-bold">₱{log.total_earnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center rounded-2xl bg-emerald-50 px-5 py-4 mb-6 border border-emerald-100">
                <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">Total Earnings:</span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  ₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Toggle to print receipt */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-blue-500">
                    <Printer size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase text-slate-800 tracking-wider">Print Payslip Receipt</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Use official payslip template</span>
                  </div>
                </div>
                <label className="relative flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={printReceiptChecked}
                    onChange={(e) => setPrintReceiptChecked(e.target.checked)}
                  />
                  <div className="block h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-emerald-500"></div>
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                </label>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBulkPay}
                  disabled={isSaving}
                  className="flex w-full items-center justify-center rounded-xl bg-emerald-500 py-4 text-xs font-black tracking-widest text-white shadow-xl shadow-emerald-500/20 uppercase transition-all hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isSaving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Confirm Payment'}
                </button>
                <button
                  onClick={() => setBulkPayModalOpen(false)}
                  className="w-full rounded-xl bg-slate-50 py-4 text-xs font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* -------------------- */}
      {/*   ROW END MODAL      */}
      {/* -------------------- */}
      {rowEndTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRowEndTarget(null)}></div>
          <div className="relative w-full max-w-sm overflow-hidden rounded-[30px] bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-800">
              <Clock size={32} />
            </div>
            <h3 className="mb-2 text-xl font-black tracking-tighter text-slate-900 uppercase">
              Set End Time?
            </h3>
            <p className="mb-8 text-sm font-medium text-slate-500">
              Are you sure you want to set the end time of <strong>{format(new Date(rowEndTarget.date), 'MMM dd, yyyy')}</strong> to the current time today?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSingleRowEnd}
                disabled={isSaving}
                className="flex w-full items-center justify-center rounded-xl bg-slate-900 py-4 text-xs font-black tracking-widest text-white shadow-xl uppercase transition-all hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                {isSaving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Yes, Set Current Time'}
              </button>
              <button
                onClick={() => setRowEndTarget(null)}
                className="w-full rounded-xl bg-slate-50 py-4 text-xs font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable receipt */}
      <div className="hidden">
        {printableRecord && (
          <PayrollPayslipComponent ref={payslipRef} record={printableRecord} />
        )}
      </div>
    </div>
  )
}

export default ManageAttendance
