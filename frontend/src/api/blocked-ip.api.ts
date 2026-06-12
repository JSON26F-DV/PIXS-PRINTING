import axiosInstance from '../lib/axiosInstance'

export interface BlockedIp {
  id: number
  ip_address: string
  reason: string | null
  blocked_at: string
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BlockedIpsResponse {
  status: 'success' | string
  data: {
    temporary: BlockedIp[]
    permanent: BlockedIp[]
    total: number
    active_count: number
  }
}

export const getBlockedIps = async (): Promise<BlockedIpsResponse['data']> => {
  const response = await axiosInstance.get<BlockedIpsResponse>('/api/admin/blocked-ips')
  return response.data.data
}

export const blockIp = async (data: {
  ip_address: string
  reason?: string
  duration?: string
}): Promise<void> => {
  await axiosInstance.post('/api/admin/blocked-ips', data)
}

export const unblockIp = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/api/admin/blocked-ips/${id}`)
}

export const unblockAllIps = async (): Promise<void> => {
  await axiosInstance.delete('/api/admin/blocked-ips/all')
}

export const blockFromAudit = async (
  ip: string,
  data: { reason?: string; duration?: string }
): Promise<void> => {
  await axiosInstance.post(`/api/admin/blocked-ips/block-from-audit/${ip}`, data)
}
