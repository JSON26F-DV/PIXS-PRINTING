import axiosInstance from '../lib/axiosInstance'
import type {
  AuditLog,
  AuditLogFilters,
  AuditLogsResponse,
  AuditLogStats,
  AuditLogStatsResponse,
  AuditLogDetailsResponse,
} from '../types/audit-log.types'

export const getAuditLogs = async (filters: AuditLogFilters): Promise<AuditLogsResponse> => {
  // Build query params, removing empty or undefined values
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  )

  const response = await axiosInstance.get<AuditLogsResponse>('/api/admin/audit-logs', {
    params,
  })
  return response.data
}

export const getAuditLogStats = async (): Promise<AuditLogStats> => {
  const response = await axiosInstance.get<AuditLogStatsResponse>('/api/admin/audit-logs/stats')
  return response.data.data
}

export const getAuditLogDetails = async (id: string): Promise<AuditLog> => {
  const response = await axiosInstance.get<AuditLogDetailsResponse>(`/api/admin/audit-logs/${id}`)
  return response.data.data
}

export const updateAuditLog = async (id: string, data: { details: unknown }): Promise<void> => {
  await axiosInstance.put(`/api/admin/audit-logs/${id}`, data)
}

export const deleteAuditLog = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/admin/audit-logs/${id}`)
}

export const deleteAllAuditLogs = async (): Promise<void> => {
  await axiosInstance.delete(`/api/admin/audit-logs/all`)
}

export const bulkDeleteAuditLogs = async (ids: string[]): Promise<void> => {
  await axiosInstance.post(`/api/admin/audit-logs/bulk-delete`, { ids })
}
