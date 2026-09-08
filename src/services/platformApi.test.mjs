import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlatformApi } from './platformApi.ts'

test('consulta empresas somente pelo transporte de plataforma recebido do host', async () => {
  let requestedPath = ''
  const api = createPlatformApi(async path => {
    requestedPath = path
    return new Response(JSON.stringify({ items: [], page: 1, pageSize: 20, total: 0 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })

  await api.listOrganizations(new URLSearchParams({ page: '1', pageSize: '20' }))

  assert.equal(requestedPath, '/api/platform/organizations?page=1&pageSize=20')
})

test('não transforma resposta proibida em sucesso local', async () => {
  const api = createPlatformApi(async () => new Response(null, { status: 403 }))

  await assert.rejects(() => api.getOrganization('organization-a'), /não possui permissão/i)
})
