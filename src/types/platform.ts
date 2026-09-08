export type PlatformRequest = (path: string, init?: RequestInit) => Promise<Response>
export type PlatformSection = 'organizations' | 'onboardings' | 'audit'
export type OrganizationStatus = 'Provisioning' | 'Active' | 'Suspended' | 'Archived'

export interface PlatformPageProps {
  section: PlatformSection
  organizationId?: string
  onboardingId?: string
  onboardingPage?: 'list' | 'new' | 'detail'
  platformRequest?: PlatformRequest
  capabilities: readonly string[]
}

export interface PlatformOrganization {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
  version: number
}

export interface PlatformAuditEvent {
  id: string
  actorUserId: string | null
  actorKind: string
  action: string
  targetType: string
  targetId: string
  result: string
  reason: string
  occurredAt: string
  correlationId: string
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}
