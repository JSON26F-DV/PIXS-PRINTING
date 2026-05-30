<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminPayrollController extends Controller
{
    /**
     * Get attendance data for today
     */
    public function today()
    {
        $today = Carbon::today()->format('Y-m-d');

        $employees = Employee::where('status', 'active')->get()->map(function ($employee) use ($today) {
            $attendance = EmployeeAttendance::where('employee_id', $employee->id)
                ->where('date', $today)
                ->first();

            return [
                'id' => $employee->id,
                'name' => $employee->first_name . ' ' . $employee->last_name,
                'email' => $employee->email,
                'role' => $employee->role,
                'status_today' => $attendance ? $attendance->status : 'pending',
                'holiday_type' => $attendance ? $attendance->holiday_type : 'none',
                'daily_rate' => (float)$employee->daily_rate,
                'start_time' => $attendance ? ($attendance->start_time ? Carbon::parse($attendance->start_time)->format('H:i') : null) : null,
                'end_time' => $attendance ? ($attendance->end_time ? Carbon::parse($attendance->end_time)->format('H:i') : null) : null,
                'break_start' => $attendance ? ($attendance->break_start ? Carbon::parse($attendance->break_start)->format('H:i') : null) : null,
                'break_end' => $attendance ? ($attendance->break_end ? Carbon::parse($attendance->break_end)->format('H:i') : null) : null,
                'overtime' => $attendance ? (float)$attendance->overtime : 0,
                'late' => $attendance ? (int)$attendance->late : 0,
                'holiday_pay' => $attendance ? (float)$attendance->holiday_pay : 0,
                'total_earnings' => $attendance ? (float)$attendance->total_earnings : 0,
                'is_paid' => $attendance ? (bool)$attendance->is_paid : false,
                'hours_worked' => $attendance ? (float)$attendance->hours_worked : 0,
            ];
        });

        return response()->json([
            'date' => $today,
            'employees' => $employees,
        ]);
    }

    /**
     * Mark specific dates as holidays for all employees
     */
    public function holiday(Request $request)
    {
        $request->validate([
            'dates' => 'required|array',
            'dates.*' => 'date',
            'action' => 'required|in:set,undo', // set or undo holidays
            'holiday_type' => 'nullable|string|in:none,regular,special_work,non_working',
            'total_earnings' => 'nullable|numeric|min:0',
        ]);

        $action = $request->action;
        $dates = $request->dates;
        $holidayType = $request->input('holiday_type', 'regular');
        $totalEarningsPassed = $request->has('total_earnings');
        $totalEarningsValue = $request->input('total_earnings', 0);

        $employees = Employee::where('status', 'active')->get();

        foreach ($dates as $date) {
            $formattedDate = Carbon::parse($date)->format('Y-m-d');

            if ($action === 'set') {
                $exists = EmployeeAttendance::where('date', $formattedDate)->exists();
                if ($exists) {
                    return response()->json([
                        'message' => 'Attendance records already exist for ' . $formattedDate . '. You cannot overwrite existing logs.',
                    ], 400);
                }

                foreach ($employees as $employee) {
                    if ($holidayType === 'special_work') {
                        EmployeeAttendance::updateOrCreate(
                            [
                                'employee_id' => $employee->id,
                                'date' => $formattedDate,
                            ],
                            [
                                'status' => 'pending',
                                'holiday_type' => 'special_work',
                                'holiday_pay' => $employee->daily_rate,
                                'total_earnings' => 0.00,
                                'is_holiday' => true,
                                'hours_worked' => 0.00,
                            ]
                        );
                    } else {
                        $earnings = ($holidayType === 'non_working') ? 0 : ($totalEarningsPassed ? $totalEarningsValue : $employee->daily_rate);

                        EmployeeAttendance::updateOrCreate(
                            [
                                'employee_id' => $employee->id,
                                'date' => $formattedDate,
                            ],
                            [
                                'status' => 'holiday',
                                'holiday_type' => $holidayType,
                                'total_earnings' => $earnings,
                                'is_holiday' => true,
                                'hours_worked' => 0.00,
                            ]
                        );
                    }
                }
            } else {
                // undo - delete all data of that day
                EmployeeAttendance::where('date', $formattedDate)->delete();
            }
        }

        return response()->json([
            'message' => 'Holidays ' . ($action === 'set' ? 'applied' : 'removed') . ' successfully.',
        ]);
    }

    /**
     * Show specific employee and their attendance history
     */
    public function manageShow($id)
    {
        $employee = Employee::findOrFail($id);
        
        $attendance = EmployeeAttendance::where('employee_id', $employee->id)
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'date' => $log->date->format('Y-m-d'),
                    'status' => $log->status,
                    'holiday_type' => $log->holiday_type,
                    'is_paid' => (bool)$log->is_paid,
                    'start_time' => $log->start_time ? Carbon::parse($log->start_time)->format('H:i') : null,
                    'end_time' => $log->end_time ? Carbon::parse($log->end_time)->format('H:i') : null,
                    'break_start' => $log->break_start ? Carbon::parse($log->break_start)->format('H:i') : null,
                    'break_end' => $log->break_end ? Carbon::parse($log->break_end)->format('H:i') : null,
                    'overtime' => (float)$log->overtime,
                    'late' => (int)$log->late,
                    'total_earnings' => (float)$log->total_earnings,
                    'holiday_pay' => (float)$log->holiday_pay,
                ];
            });

        return response()->json([
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->first_name . ' ' . $employee->last_name,
                'daily_rate' => (float)$employee->daily_rate,
                'ot_rate' => (float)$employee->ot_rate,
                'role' => $employee->role,
            ],
            'attendance' => $attendance,
        ]);
    }

    /**
     * Create or Edit an attendance log for an employee
     */
    public function manageStore(Request $request, $id)
    {
        $request->validate([
            'date' => 'required|date',
            'status' => 'required|in:pending,full,half,present,absent,holiday',
            'overtime' => 'numeric|min:0',
            'late' => 'integer|min:0',
            'is_paid' => 'boolean',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'break_start' => 'nullable|date_format:H:i',
            'break_end' => 'nullable|date_format:H:i',
            'holiday_pay' => 'nullable|numeric|min:0',
            'holiday_type' => 'nullable|in:none,regular,special_work,non_working',
            'daily_rate' => 'nullable|numeric|min:0',
            'total_earnings' => 'nullable|numeric|min:0',
            'hours_worked' => 'nullable|numeric|min:0',
        ]);

        $employee = Employee::findOrFail($id);

        if ($request->has('daily_rate') && $request->daily_rate != $employee->daily_rate) {
            $employee->daily_rate = $request->daily_rate;
            $employee->save();
        }
        $date = Carbon::parse($request->date)->format('Y-m-d');

        // Logic to calculate salary
        $dailyRate = $employee->daily_rate;
        $otRate = $employee->ot_rate;

        $totalEarnings = $request->total_earnings;
        
        if ($totalEarnings === null) {
            $attendancePercentage = 0;
            if (in_array($request->status, ['full', 'present'])) $attendancePercentage = 1;
            if ($request->status === 'half') $attendancePercentage = 0.5;

            $totalEarnings = max(0, ($attendancePercentage * $dailyRate) + ($request->overtime * $otRate));
        }

        $hoursWorked = $request->hours_worked;
        if ($hoursWorked === null) {
            if (in_array($request->status, ['full', 'present'])) {
                $hoursWorked = 8.00;
            } elseif ($request->status === 'half') {
                $hoursWorked = 4.00;
            } else {
                $hoursWorked = 0.00;
            }
        }

        $holidayPay = $request->holiday_pay ?? 0;
        if ($request->status === 'absent') {
            $totalEarnings = 0.00;
            $holidayPay = 0.00;
        }

        $log = EmployeeAttendance::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'date' => $date,
            ],
            [
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'break_start' => $request->break_start,
                'break_end' => $request->break_end,
                'status' => $request->status,
                'overtime' => $request->overtime ?? 0,
                'late' => $request->late ?? 0,
                'total_earnings' => $totalEarnings,
                'holiday_pay' => $holidayPay,
                'holiday_type' => $request->holiday_type ?? 'none',
                'is_paid' => $request->is_paid ?? false,
                'hours_worked' => $hoursWorked,
            ]
        );

        return response()->json([
            'message' => 'Attendance logged successfully',
            'log' => $log,
        ]);
    }

    /**
     * Instantly update break times
     */
    public function manageBreak(Request $request, $id, $date)
    {
        $request->validate([
            'type' => 'required|in:start,end',
            'time' => 'required|date_format:H:i',
        ]);

        $formattedDate = Carbon::parse($date)->format('Y-m-d');
        
        $log = EmployeeAttendance::where('employee_id', $id)
            ->where('date', $formattedDate)
            ->first();
            
        if (!$log) {
            // Create a pending record if none exists just to log the break? No, usually break is logged on an existing attendance.
            // But if they just hit break without starting, we should create a pending one.
            $log = EmployeeAttendance::create([
                'employee_id' => $id,
                'date' => $formattedDate,
                'status' => 'pending',
                'start_time' => Carbon::now()->format('H:i') // auto start if they hit break without starting
            ]);
        }

        if ($request->type === 'start') {
            $log->break_start = $request->time;
        } else {
            $log->break_end = $request->time;
        }
        $log->save();

        return response()->json(['message' => 'Break time updated.', 'log' => $log]);
    }

    /**
     * Delete an attendance log
     */
    public function manageDestroy($id, $date)
    {
        $formattedDate = Carbon::parse($date)->format('Y-m-d');
        
        $deleted = EmployeeAttendance::where('employee_id', $id)
            ->where('date', $formattedDate)
            ->delete();

        if ($deleted) {
            return response()->json(['message' => 'Attendance record deleted.']);
        }

        return response()->json(['message' => 'Record not found.'], 404);
    }
}
