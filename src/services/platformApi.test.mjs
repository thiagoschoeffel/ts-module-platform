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

test('inicia onboarding com corpo tipado e chave idempotente', async () => {
  let captured
  const api = createPlatformApi(async (path, init) => {
    captured = { path, init }
    return new Response(JSON.stringify({ onboardingId: 'onboarding-a', operationId: 'operation-a', status: 'Pending' }), { status: 202 })
  })

  await api.createOnboarding({ name: 'Empresa B', slug: 'empresa-b', ownerEmail: 'owner@empresa.test', timeZone: 'America/Sao_Paulo', locale: 'pt-BR' }, 'request-a')

  assert.equal(captured.path, '/api/platform/onboardings')
  assert.equal(captured.init.method, 'POST')
  assert.equal(captured.init.headers['Idempotency-Key'], 'request-a')
  assert.equal(JSON.parse(captured.init.body).slug, 'empresa-b')
})

test('preserva detalhe seguro de ProblemDetails', async () => {
  const api = createPlatformApi(async () => new Response(JSON.stringify({ detail: 'A chave idempotente já foi usada.' }), {
    status: 409, headers: { 'content-type': 'application/problem+json' },
  }))

  await assert.rejects(() => api.createOnboarding({ name: 'Empresa B', slug: 'empresa-b', ownerEmail: 'owner@empresa.test', timeZone: 'UTC', locale: 'pt-BR' }, 'request-a'), /chave idempotente/i)
})

test('envia versão concorrente e motivo nas ações administrativas', async () => {
  let captured
  const api = createPlatformApi(async (path, init) => {
    captured = { path, init }
    return new Response(JSON.stringify({ id: 'organization-a', status: 'Suspended', version: 8, subscription: null }), { status: 200 })
  })

  await api.changeOrganizationStatus('organization-a', 'suspension', 7, 'Solicitação administrativa.')

  assert.equal(captured.path, '/api/platform/organizations/organization-a/suspension')
  assert.equal(captured.init.method, 'POST')
  assert.deepEqual(JSON.parse(captured.init.body), { expectedVersion: 7, reason: 'Solicitação administrativa.' })
})
