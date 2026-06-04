export interface AuditLog {
  id: string
  user_id: string | null
  user_type: string | null // customer, admin, staff, technician, inventory
  user_name: string | null
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | string
  action_label: string
  action_color: 'emerald' | 'blue' | 'rose' | 'purple' | 'slate' | string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown> | null
  ip_address: string
  user_agent?: string
  created_at: string
  created_at_formatted: string
}

export interface AuditLogStats {
  total: number
  today: number
  by_action: Record<string, number>
  by_entity: Record<string, number>
}

export interface AuditLogFilters {
  user_id?: string
  user_type?: string
  action?: string
  entity_type?: string
  start_date?: string
  end_date?: string
  search?: string
  page?: number
  per_page?: number
}

export interface AuditLogsResponse {
  status: 'success' | string
  data: AuditLog[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface AuditLogStatsResponse {
  status: 'success' | string
  data: AuditLogStats
}

export interface AuditLogDetailsResponse {
  status: 'success' | string
  data: AuditLog
}
