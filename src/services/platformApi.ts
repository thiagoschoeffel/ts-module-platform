import type { CreatePlatformOnboarding, OnboardingStatus, PageResult, PlatformAuditEvent,
  PlatformOnboardingAccepted, PlatformOnboardingDetail, PlatformOnboardingSummary,
  ExternalIntegration, OrganizationLifecycleResult, OrganizationSaasSubscription, PlatformOrganization,
  PlatformRequest, SaasPlanVersion, SaveWhatsAppIntegration } from '../types/platform'

export function createPlatformApi(request: PlatformRequest) {
  async function json<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await request(path, init)
    if (!response.ok) {
      const problem = await response.json().catch(() => undefined) as { detail?: string } | undefined
      throw new Error(problem?.detail || (response.status === 403
        ? 'Você não possui permissão para acessar esta área.'
        : 'Não foi possível concluir a operação na plataforma.'))
    }
    return response.json() as Promise<T>
  }

  return {
    listOrganizations(params: URLSearchParams) {
      return json<PageResult<PlatformOrganization>>(`/api/platform/organizations?${params}`)
    },
    getOrganization(id: string) {
      return json<PlatformOrganization>(`/api/platform/organizations/${encodeURIComponent(id)}`)
    },
    listSaasPlans() {
      return json<SaasPlanVersion[]>('/api/platform/saas-plans')
    },
    getSaasSubscription(id: string) {
      return json<OrganizationSaasSubscription | null>(`/api/platform/organizations/${encodeURIComponent(id)}/saas-subscription`)
    },
    assignSaasPlan(id: string, planVersionId: string, expectedVersion: number | null) {
      return json<OrganizationLifecycleResult>(`/api/platform/organizations/${encodeURIComponent(id)}/saas-subscription`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planVersionId, expectedVersion }),
      })
    },
    changeOrganizationStatus(id: string, action: 'activation' | 'suspension' | 'reactivation',
      expectedVersion: number, reason: string) {
      return json<OrganizationLifecycleResult>(`/api/platform/organizations/${encodeURIComponent(id)}/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedVersion, reason }),
      })
    },
    listIntegrations(id: string) {
      return json<ExternalIntegration[]>(`/api/platform/organizations/${encodeURIComponent(id)}/integrations`)
    },
    saveWhatsAppIntegration(id: string, input: SaveWhatsAppIntegration) {
      return json<ExternalIntegration>(`/api/platform/organizations/${encodeURIComponent(id)}/integrations/whatsapp`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
      })
    },
    disableIntegration(organizationId: string, connectionId: string, expectedVersion: number) {
      return json<ExternalIntegration>(`/api/platform/organizations/${encodeURIComponent(organizationId)}/integrations/${encodeURIComponent(connectionId)}/disable`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedVersion }),
      })
    },
    listAudit(params: URLSearchParams) {
      return json<PageResult<PlatformAuditEvent>>(`/api/platform/audit-events?${params}`)
    },
    listOnboardings(params: URLSearchParams) {
      return json<PageResult<PlatformOnboardingSummary>>(`/api/platform/onboardings?${params}`)
    },
    getOnboarding(id: string) {
      return json<PlatformOnboardingDetail>(`/api/platform/onboardings/${encodeURIComponent(id)}`)
    },
    createOnboarding(input: CreatePlatformOnboarding, idempotencyKey: string) {
      return json<PlatformOnboardingAccepted>('/api/platform/onboardings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(input),
      })
    },
    retryOnboarding(id: string, expectedVersion: number) {
      return json<PlatformOnboardingDetail>(`/api/platform/onboardings/${encodeURIComponent(id)}/retry`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedVersion }),
      })
    },
  }
}

export const onboardingStatusLabels: Record<OnboardingStatus, string> = {
  Provisioning: 'Provisionando', AwaitingOwner: 'Aguardando proprietário', Active: 'Ativo',
  NeedsAttention: 'Requer atenção', Cancelled: 'Cancelado',
}

export type PlatformApi = ReturnType<typeof createPlatformApi>
