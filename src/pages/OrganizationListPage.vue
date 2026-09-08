<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowRightIcon, Badge, Button, Card, EmptyState, Input, Pagination, SearchIcon, TriangleAlertIcon } from '@thiagoschoeffel/ts-components'
import type { BadgeVariant } from '@thiagoschoeffel/ts-components'
import type { PlatformApi } from '../services/platformApi'
import type { OrganizationStatus, PlatformOrganization } from '../types/platform'
import { navigate } from '../utils/navigation'

const props = defineProps<{ api?: PlatformApi }>()
const initial = new URLSearchParams(window.location.search)
const search = ref(initial.get('busca') ?? '')
const currentPage = ref(Math.max(1, Number(initial.get('pagina')) || 1))
const items = ref<PlatformOrganization[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const pageSize = 20
let debounce: ReturnType<typeof setTimeout> | undefined

const statusLabel: Record<OrganizationStatus, string> = { Provisioning: 'Provisionando', Active: 'Ativa', Suspended: 'Suspensa', Archived: 'Arquivada' }
const statusVariant: Record<OrganizationStatus, BadgeVariant> = { Provisioning: 'info', Active: 'success', Suspended: 'danger', Archived: 'neutral' }

async function load() {
  if (!props.api) { error.value = 'O transporte autenticado da plataforma não está disponível.'; return }
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ page: String(currentPage.value), pageSize: String(pageSize) })
    if (search.value.trim()) params.set('search', search.value.trim())
    const result = await props.api.listOrganizations(params)
    items.value = result.items
    total.value = result.total
  } catch (reason) { error.value = reason instanceof Error ? reason.message : 'Não foi possível carregar as empresas.' }
  finally { loading.value = false }
}

function persistUrl() {
  const url = new URL(window.location.href)
  if (search.value.trim()) url.searchParams.set('busca', search.value.trim()); else url.searchParams.delete('busca')
  if (currentPage.value > 1) url.searchParams.set('pagina', String(currentPage.value)); else url.searchParams.delete('pagina')
  window.history.replaceState(window.history.state, '', url)
}
watch(search, () => { currentPage.value = 1; if (debounce) clearTimeout(debounce); debounce = setTimeout(() => { persistUrl(); void load() }, 300) })
watch(currentPage, () => { persistUrl(); void load() })
onMounted(load)
const range = computed(() => total.value ? `${(currentPage.value - 1) * pageSize + 1}–${Math.min(currentPage.value * pageSize, total.value)} de ${total.value}` : '0 empresas')
</script>

<template>
  <Card>
    <template #header>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 class="font-semibold text-slate-800">Registro de empresas</h2><p class="mt-1 text-sm text-slate-500">Busca e paginação são processadas pela API.</p></div>
        <Input v-model="search" type="search" clearable aria-label="Buscar empresa" placeholder="Buscar nome ou slug…" class="w-full sm:max-w-sm"><template #leading><SearchIcon /></template></Input>
      </div>
    </template>
    <div v-if="loading" class="py-10 text-center text-sm text-slate-500" role="status">Carregando empresas…</div>
    <EmptyState v-else-if="error" title="Não foi possível carregar as empresas" :description="error" role="alert">
      <template #icon><TriangleAlertIcon /></template><template #action><Button size="small" variant="secondary" @click="load">Tentar novamente</Button></template>
    </EmptyState>
    <EmptyState v-else-if="!items.length" title="Nenhuma empresa encontrada" description="Altere a busca ou inicie um onboarding quando o fluxo estiver disponível." />
    <ul v-else class="divide-y divide-slate-200" aria-label="Empresas">
      <li v-for="organization in items" :key="organization.id" class="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0"><p class="truncate font-medium text-slate-800">{{ organization.name }}</p><p class="mt-1 text-xs text-slate-500">{{ organization.slug }} · versão {{ organization.version }}</p></div>
        <div class="flex items-center justify-between gap-4 sm:justify-end"><Badge :variant="statusVariant[organization.status]">{{ statusLabel[organization.status] }}</Badge><Button size="small" variant="secondary" @click="navigate(`/plataforma/empresas/${organization.id}`)">Detalhes <template #trailingIcon><ArrowRightIcon /></template></Button></div>
      </li>
    </ul>
    <template v-if="total > 0" #footer><div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p class="text-sm text-slate-500">{{ range }}</p><Pagination v-model="currentPage" :total="total" :items-per-page="pageSize" label="Paginação de empresas" /></div></template>
  </Card>
</template>
