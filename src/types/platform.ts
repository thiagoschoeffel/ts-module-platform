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

export interface SaasPlanVersion {
  id: string
  code: string
  name: string
  version: number
  entitlements: string[]
}

export interface OrganizationSaasSubscription {
  planVersionId: string
  planCode: string
  planName: string
  planVersion: number
  entitlements: string[]
  version: number
}

export interface OrganizationLifecycleResult {
  id: string
  status: OrganizationStatus
  version: number
  subscription: OrganizationSaasSubscription | null
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

export type OnboardingStatus = 'Provisioning' | 'AwaitingOwner' | 'Active' | 'NeedsAttention' | 'Cancelled'
export type ProvisioningOperationStatus = 'Pending' | 'Running' | 'Succeeded' | 'NeedsAttention'

export interface PlatformOnboardingSummary {
  id: string
  organizationId: string
  organizationName: string
  organizationSlug: string
  ownerEmail: string
  status: OnboardingStatus
  operationStatus: ProvisioningOperationStatus
  attempts: number
  updatedAt: string
  version: number
}

export interface PlatformOnboardingDetail extends PlatformOnboardingSummary {
  timeZone: string
  locale: string
  operationId: string
  currentStep: string
  nextAttemptAt: string | null
  lastError: string | null
  createdAt: string
  operationVersion: number
}

export interface CreatePlatformOnboarding {
  name: string
  slug: string
  ownerEmail: string
  timeZone: string
  locale: string
}

export interface PlatformOnboardingAccepted {
  onboardingId: string
  operationId: string
  status: ProvisioningOperationStatus
}
