import React, { useState, useMemo, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import _ from 'lodash'
import { Calendar as CalendarIcon, Coffee, Trash2, Printer } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

// Modular Imports
import PayrollPrint from './PayrollPrint'
import { PayrollSystemHeader } from './PayrollSystemHeader'
import PayrollTable from './PayrollTable'
import { type EmployeeTodayRecord } from './types'

// Data Mock
import { useAuth } from '../../../context/AuthContext'
import axiosInstance from '../../../lib/axiosInstance'
import { toast } from 'react-toastify'

const Payroll: React.FC = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  // State Management
  const [employeesState, setEmployeesState] = useState<EmployeeTodayRecord[]>([])
  const [isFetching, setIsFetching] = useState<boolean>(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortOption, setSortOption] = useState('none')

  // Holiday Configuration
  const [holidayDate, setHolidayDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [isProcessingHoliday, setIsProcessingHoliday] = useState(false)
  const [holidayConfirmOpen, setHolidayConfirmOpen] = useState(false)
  const [holidayConfirmActionConfig, setHolidayConfirmActionConfig] = useState<{
    action: 'set' | 'undo'
    type?: 'non_working' | 'special_work' | 'regular'
  } | null>(null)

  // Late Minutes Modal
  const [lateModalOpen, setLateModalOpen] = useState(false)
  const [selectedEmpForLate, setSelectedEmpForLate] = useState<EmployeeTodayRecord | null>(null)
  const [lateMinutesInput, setLateMinutesInput] = useState('')

  // Bulk Payment Modal
  const [bulkPayModalOpen, setBulkPayModalOpen] = useState(false)
  const [printReceiptsChecked, setPrintReceiptsChecked] = useState(true)

  // Memoized unpaid list
  const unpaidEmployees = useMemo(() => {
    return employeesState.filter(emp => emp.status_today !== 'pending' && !emp.is_paid)
  }, [employeesState])

  const hasUnpaidEmployees = unpaidEmployees.length > 0

  const getFormattedHolidayDate = () => {
    if (!holidayDate) return ''
    try {
      const parts = holidayDate.split('-')
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      return format(dateObj, 'EEEE, MMMM dd, yyyy')
    } catch {
      return holidayDate
    }
  }

  const handleConfirmHolidayAction = async () => {
    if (!holidayConfirmActionConfig) return
    const { action, type } = holidayConfirmActionConfig
    setHolidayConfirmActionConfig(null)
    await handleHolidayAction(action, type)
  }

  // Print Ref
  const printRef = useRef<HTMLDivElement>(null)
  const triggerPrint = useReactToPrint({
    contentRef: printRef,
  })

  // Fetch from Backend
  const fetchPayrollData = useCallback(async () => {
    setIsFetching(true)
    try {
      const response = await axiosInstance.get('/api/admin/payroll/today')
      setEmployeesState(response.data.employees)
    } catch (error) {
      console.error('Failed to load today payroll data', error)
      toast.error('Failed to load today payroll data')
    } finally {
      setIsFetching(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPayrollData()
  }, [fetchPayrollData])

  // Unified Filtering & Sorting Selector
  const filteredData = useMemo(() => {
    let result = employeesState.filter((emp) => {
      const matchSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toString().includes(searchTerm.toLowerCase())
      const matchRole = roleFilter === 'all' || emp.role === roleFilter
      return matchSearch && matchRole
    })

    if (sortOption === 'name-asc') {
      result = _.orderBy(result, ['name'], ['asc'])
    }

    return result
  }, [employeesState, searchTerm, roleFilter, sortOption])

  // Holiday Actions
  const handleHolidayAction = async (
    action: 'set' | 'undo',
    type: 'non_working' | 'special_work' | 'regular' = 'regular'
  ) => {
    if (!isAdmin) return
    setIsProcessingHoliday(true)
    try {
      await axiosInstance.post('/api/admin/payroll/holiday', {
        dates: [holidayDate],
        action,
        holiday_type: type,
      })
      toast.success(
        action === 'undo'
          ? `Removed holiday status for ${holidayDate}.`
          : type === 'special_work'
          ? `Marked ${holidayDate} as a Special Day for all.`
          : `Marked ${holidayDate} as a holiday for all.`
      )
      // re-fetch data so "today's status" updates if the holiday was for today
      fetchPayrollData()
    } catch (error) {
      console.error('Failed to update holiday:', error)
      const err = error as { response?: { data?: { message?: string } } }
      const errorMsg = err.response?.data?.message || 'Failed to update holiday status.'
      toast.error(errorMsg)
    } finally {
      setIsProcessingHoliday(false)
    }
  }

  const handleUpdateAttendance = async (
    emp: EmployeeTodayRecord,
    status: string,
    totalEarnings: number,
    customFields: Partial<EmployeeTodayRecord> = {}
  ) => {
    setIsFetching(true)
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      
      const payload = {
        date: todayStr,
        status: status,
        total_earnings: totalEarnings,
        is_paid: customFields.is_paid !== undefined ? customFields.is_paid : emp.is_paid,
        start_time: customFields.start_time !== undefined ? customFields.start_time : emp.start_time,
        end_time: customFields.end_time !== undefined ? customFields.end_time : emp.end_time,
        break_start: customFields.break_start !== undefined ? customFields.break_start : emp.break_start,
        break_end: customFields.break_end !== undefined ? customFields.break_end : emp.break_end,
        overtime: emp.overtime,
        late: customFields.late !== undefined ? customFields.late : emp.late,
        holiday_pay: status === 'absent' ? 0 : emp.holiday_pay,
        holiday_type: emp.holiday_type || 'none',
        hours_worked: customFields.hours_worked !== undefined ? customFields.hours_worked : (status === 'full' ? 8 : (status === 'half' ? 4 : 0)),
      }

      await axiosInstance.post(`/api/admin/payroll/manage/${emp.id}`, payload)
      toast.success(`Attendance status updated to ${status}.`)
      fetchPayrollData()
    } catch (error) {
      console.error("Failed to update today's attendance", error)
      toast.error('Failed to update attendance.')
    } finally {
      setIsFetching(false)
    }
  }

  const handleSetNonWorkingHolidayToday = async () => {
    setIsFetching(true)
    setHolidayConfirmOpen(false)
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      await axiosInstance.post('/api/admin/payroll/holiday', {
        dates: [todayStr],
        action: 'set',
        holiday_type: 'non_working',
        total_earnings: 0,
      })
      toast.success(`Marked today (${todayStr}) as a non-working holiday for all employees.`)
      fetchPayrollData()
    } catch (error) {
      console.error('Failed to set non-working holiday today:', error)
      toast.error('Failed to update global holiday status.')
    } finally {
      setIsFetching(false)
    }
  }

  const handleBreakUpdate = async (empId: string, type: 'start' | 'end') => {
    setIsFetching(true)
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const currentTime = format(new Date(), 'HH:mm')
      await axiosInstance.patch(`/api/admin/payroll/manage/${empId}/${todayStr}/break`, {
        type,
        time: currentTime
      })
      toast.success(`Break ${type} updated to ${currentTime}`)
      fetchPayrollData()
    } catch (error) {
      console.error('Failed to update break time', error)
      toast.error('Failed to update break time.')
    } finally {
      setIsFetching(false)
    }
  }

  const handleConfirmLate = async () => {
    if (!selectedEmpForLate) return
    const lateMins = parseInt(lateMinutesInput) || 0
    setLateModalOpen(false)
    
    await handleUpdateAttendance(selectedEmpForLate, 'present', 0, {
      start_time: format(new Date(), 'HH:mm'),
      late: lateMins
    })
  }

  const handlePayAllEmployees = async () => {
    if (unpaidEmployees.length === 0) {
      toast.info("No unpaid employee records to pay today.")
      setBulkPayModalOpen(false)
      return
    }

    setIsFetching(true)
    setBulkPayModalOpen(false)
    
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      
      await Promise.all(unpaidEmployees.map(async (emp) => {
        const payload = {
          date: todayStr,
          status: emp.status_today,
          total_earnings: emp.total_earnings,
          is_paid: true,
          start_time: emp.start_time,
          end_time: emp.end_time,
          break_start: emp.break_start,
          break_end: emp.break_end,
          overtime: emp.overtime,
          late: emp.late,
          holiday_pay: emp.holiday_pay,
          holiday_type: emp.holiday_type || 'none',
          hours_worked: emp.hours_worked !== undefined ? emp.hours_worked : (emp.status_today === 'full' ? 8 : (emp.status_today === 'half' ? 4 : 0)),
        }

        const operations = [
          axiosInstance.post(`/api/admin/payroll/manage/${emp.id}`, payload),
        ]

        if (emp.total_earnings > 0) {
          operations.push(
            axiosInstance.post('/api/admin/expenditures', {
              category: 'Employee Salaries',
              amount: emp.total_earnings,
              description: `Salary for ${emp.name} on ${todayStr}`,
            }),
          )
        }

        await Promise.all(operations)
      }))

      toast.success(`Successfully processed payouts for all ${unpaidEmployees.length} employees today!`)
      
      if (printReceiptsChecked) {
        setTimeout(() => {
          triggerPrint()
        }, 300)
      }
      
      fetchPayrollData()
    } catch (error) {
      console.error('Failed to pay all employees:', error)
      toast.error('Failed to complete bulk payment process.')
    } finally {
      setIsFetching(false)
    }
  }

  return (
    <div className="PayrollPage animate-in fade-in mx-auto max-w-[1700px] space-y-10 px-6 pb-24 duration-700 lg:px-12">
      <PayrollSystemHeader />

      {/* Holiday Configuration Section */}
      <div className="group relative flex flex-col items-center text-center justify-center overflow-hidden rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-center gap-3">
            <Coffee className="text-amber-500" size={24} />
            <h4 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
              Global Holiday Configuration
            </h4>
          </div>
          <p className="mt-1 text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
            Mark or unmark a specific date as a paid holiday for all employees
          </p>
        </div>
        
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 w-full">
          <div className="relative">
             <CalendarIcon className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="date" 
               value={holidayDate}
               onChange={(e) => setHolidayDate(e.target.value)}
               className="h-14 rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-6 font-mono text-sm font-black uppercase text-slate-700 shadow-inner outline-none transition-all focus:border-blue-500 focus:bg-white"
             />
          </div>
          
          {isAdmin && (
            <>
              <button
                onClick={() => setHolidayConfirmActionConfig({ action: 'set', type: 'non_working' })}
                disabled={isProcessingHoliday}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 text-xs font-black tracking-widest text-white uppercase shadow-xl transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
              >
                Mark as Holiday
              </button>

              <button
                onClick={() => setHolidayConfirmActionConfig({ action: 'set', type: 'special_work' })}
                disabled={isProcessingHoliday}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 text-xs font-black tracking-widest text-white uppercase shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
              >
                Mark as Special Day
              </button>

              <button
                onClick={() => setHolidayConfirmActionConfig({ action: 'undo' })}
                disabled={isProcessingHoliday}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-8 text-xs font-black tracking-widest text-rose-600 uppercase shadow-sm transition-all hover:bg-rose-100 hover:text-rose-700 active:scale-95 disabled:opacity-50"
              >
                <Trash2 size={16} />
                Undo
              </button>
            </>
          )}
        </div>
      </div>

      {/* Payroll Payout Settlement Section */}
      {isAdmin && (
        <div className="group relative flex flex-col md:flex-row md:items-center justify-between overflow-hidden rounded-[40px] border border-emerald-200 bg-emerald-50/30 p-8 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <Printer className="text-emerald-500" size={24} />
              <h4 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
                Daily Payout & Settlement
              </h4>
            </div>
            <p className="mt-1 text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
              Settle all active employee logs for today and instantly output unified printouts
            </p>
          </div>
          
          <div className="relative z-10 mt-6 md:mt-0 flex items-center gap-4">
            <button
              onClick={() => setBulkPayModalOpen(true)}
              className="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 px-8 text-xs font-black tracking-widest text-white uppercase shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-95"
            >
              <Printer size={16} />
              Pay All Employees
            </button>
          </div>
        </div>
      )}

      {isFetching && (
        <div className="flex justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        </div>
      )}

      <PayrollTable
        data={filteredData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
        onUpdateAttendance={handleUpdateAttendance}
        onSetNonWorkingHoliday={() => setHolidayConfirmOpen(true)}
        onOpenLateModal={(emp) => { setSelectedEmpForLate(emp); setLateMinutesInput(''); setLateModalOpen(true); }}
        onBreakUpdate={handleBreakUpdate}
      />

      {/* Hidden A4 2/4 Grid Print Component */}
      <div className="hidden">
        <PayrollPrint ref={printRef} employees={employeesState.filter(emp => emp.status_today !== 'pending')} date={format(new Date(), 'yyyy-MM-dd')} />
      </div>

      {/* Premium Holiday Confirmation Modal for specific selected date and action */}
      {holidayConfirmActionConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setHolidayConfirmActionConfig(null)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-[30px] bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Coffee size={32} />
            </div>
            <h3 className="mb-2 text-xl font-black tracking-tighter text-slate-900 uppercase">
              Confirm Holiday Action
            </h3>
            
            <div className="my-6 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Selected Target Date</span>
              <span className="block text-md font-black text-slate-800 font-mono mt-1">
                {getFormattedHolidayDate()}
              </span>
            </div>

            <p className="mb-8 text-sm font-medium text-slate-500">
              {holidayConfirmActionConfig.action === 'undo' ? (
                <span>
                  Are you sure you want to <strong className="font-extrabold text-rose-600">UNDO</strong> the holiday configuration for this day? This will revert employees back to regular work day logs.
                </span>
              ) : holidayConfirmActionConfig.type === 'special_work' ? (
                <span>
                  Are you sure you want to mark this day as a <strong className="font-extrabold text-indigo-600">Special Non-Working / Work Day</strong>?
                </span>
              ) : (
                <span>
                  Are you sure you want to mark this day as a <strong className="font-extrabold text-slate-900">Regular Non-Working Holiday</strong> for all active employees?
                </span>
              )}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmHolidayAction}
                disabled={isProcessingHoliday}
                className="flex w-full items-center justify-center rounded-xl bg-amber-500 py-4 text-xs font-black tracking-widest text-white shadow-xl shadow-amber-500/20 uppercase transition-all hover:bg-amber-600 disabled:opacity-50"
              >
                {isProcessingHoliday ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Yes, Confirm'
                )}
              </button>
              <button
                onClick={() => setHolidayConfirmActionConfig(null)}
                className="w-full rounded-xl bg-slate-50 py-4 text-xs font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Holiday Confirmation Modal */}
      {holidayConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setHolidayConfirmOpen(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-[30px] bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Coffee size={32} />
            </div>
            <h3 className="mb-2 text-xl font-black tracking-tighter text-slate-900 uppercase">
              Declare Today as Holiday?
            </h3>
            <p className="mb-8 text-sm font-medium text-slate-500">
              Are you sure you want to mark today as a <strong className="font-extrabold text-slate-800">Global Non-Working Holiday</strong> for all active employees? This will log their attendance as Holiday (Non-working) with ₱0.00 earnings.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSetNonWorkingHolidayToday}
                disabled={isFetching}
                className="flex w-full items-center justify-center rounded-xl bg-amber-500 py-4 text-xs font-black tracking-widest text-white shadow-xl shadow-amber-500/20 uppercase transition-all hover:bg-amber-600 disabled:opacity-50"
              >
                {isFetching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Yes, Confirm'
                )}
              </button>
              <button
                onClick={() => setHolidayConfirmOpen(false)}
                className="w-full rounded-xl bg-slate-50 py-4 text-xs font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Late Minutes Input Modal */}
      {lateModalOpen && selectedEmpForLate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setLateModalOpen(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-[30px] bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Coffee size={32} />
            </div>
            <h3 className="mb-2 text-xl font-black tracking-tighter text-slate-900 uppercase">
              Enter Late Minutes
            </h3>
            <p className="mb-6 text-sm font-medium text-slate-500">
              Please enter the number of minutes late for <strong className="font-extrabold text-slate-800">{selectedEmpForLate.name}</strong>.
            </p>
            <div className="mb-6">
              <input
                type="number"
                min="1"
                placeholder="Minutes late (e.g. 15)"
                value={lateMinutesInput}
                onChange={(e) => setLateMinutesInput(e.target.value)}
                className="w-full text-center h-14 rounded-2xl border border-slate-200 bg-slate-50 text-lg font-black outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 animate-in fade-in"
              />
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmLate}
                className="flex w-full items-center justify-center rounded-xl bg-amber-500 py-4 text-xs font-black tracking-widest text-white shadow-xl shadow-amber-500/20 uppercase transition-all hover:bg-amber-600 animate-in fade-in duration-300"
              >
                Confirm & Log
              </button>
              <button
                onClick={() => setLateModalOpen(false)}
                className="w-full rounded-xl bg-slate-50 py-4 text-xs font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100 hover:text-slate-900 animate-in fade-in duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Payment Modal */}
      {bulkPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setBulkPayModalOpen(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-[30px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <Printer size={32} />
            </div>
            <h3 className="mb-2 text-xl font-black tracking-tighter text-slate-900 uppercase text-center">
              Pay All Employees Today?
            </h3>
            <p className="mb-6 text-sm font-medium text-slate-500 text-center">
              Are you sure you want to mark today's payroll logs as paid and settle transactions?
            </p>

            {/* Unpaid list view */}
            <div className="max-h-40 overflow-y-auto mb-6 border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              {unpaidEmployees.map(emp => (
                <div key={emp.id} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{emp.name}</span>
                  <span className="font-black text-slate-500 uppercase">₱{emp.total_earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              {!hasUnpaidEmployees && (
                <div className="text-center text-xs text-slate-400 font-medium py-4">No unpaid records for today.</div>
              )}
            </div>

            {/* Print Toggle */}
            {hasUnpaidEmployees && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-150 p-4 hover:bg-slate-50/55 transition-all">
                <input
                  type="checkbox"
                  id="printReceiptToggle"
                  checked={printReceiptsChecked}
                  onChange={(e) => setPrintReceiptsChecked(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="printReceiptToggle" className="cursor-pointer select-none">
                  <span className="block text-xs font-black text-slate-800 uppercase tracking-widest">Print Payslips (2/4 Layout)</span>
                  <span className="block text-[10px] font-medium text-slate-400">Prints 4 accounts grouped on single paper sheets</span>
                </label>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {hasUnpaidEmployees && (
                <button
                  onClick={handlePayAllEmployees}
                  className="flex w-full items-center justify-center rounded-xl bg-emerald-500 py-4 text-xs font-black tracking-widest text-white shadow-xl shadow-emerald-500/20 uppercase transition-all hover:bg-emerald-600"
                >
                  Confirm Payout
                </button>
              )}
              <button
                onClick={() => setBulkPayModalOpen(false)}
                className="w-full rounded-xl bg-slate-50 py-4 text-xs font-black tracking-widest text-slate-500 uppercase transition-all hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payroll
