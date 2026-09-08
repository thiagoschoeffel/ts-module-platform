import type { PageResult, PlatformAuditEvent, PlatformOrganization, PlatformRequest } from '../types/platform'

export function createPlatformApi(request: PlatformRequest) {
  async function json<T>(path: string): Promise<T> {
    const response = await request(path)
    if (!response.ok) throw new Error(response.status === 403
      ? 'Você não possui permissão para consultar esta área.'
      : 'Não foi possível carregar os dados da plataforma.')
    return response.json() as Promise<T>
  }

  return {
    listOrganizations(params: URLSearchParams) {
      return json<PageResult<PlatformOrganization>>(`/api/platform/organizations?${params}`)
    },
    getOrganization(id: string) {
      return json<PlatformOrganization>(`/api/platform/organizations/${encodeURIComponent(id)}`)
    },
    listAudit(params: URLSearchParams) {
      return json<PageResult<PlatformAuditEvent>>(`/api/platform/audit-events?${params}`)
    },
  }
}

export type PlatformApi = ReturnType<typeof createPlatformApi>
