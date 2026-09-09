<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArrowRightIcon, Badge, Building2Icon, Button, Card, DataTable, EmptyState, Input,
  Pagination, SearchIcon, Tabs, TriangleAlertIcon, type BadgeVariant, type DataTableColumn,
  type DataTableRow, type DataTableSortDirection, type TabItem
} from '@thiagoschoeffel/ts-components'
import type { PlatformApi } from '../services/platformApi'
import type { OrganizationStatus, PlatformOrganization } from '../types/platform'
import { navigate } from '../utils/navigation'

const props = defineProps<{ api?: PlatformApi }>()
const initial = new URLSearchParams(window.location.search)
type StatusFilter = 'all' | OrganizationStatus
const statusFilters = new Set<StatusFilter>(['all', 'Provisioning', 'Active', 'Suspended', 'Archived'])
type OrganizationSortKey = 'name' | 'slug' | 'status' | 'version'
const sortKeys = new Set<OrganizationSortKey>(['name', 'slug', 'status', 'version'])
const search = ref(initial.get('busca') ?? '')
const debouncedSearch = ref(search.value)
const requestedStatus = initial.get('status') as StatusFilter
const status = ref<StatusFilter>(statusFilters.has(requestedStatus) ? requestedStatus : 'all')
const currentPage = ref(Math.max(1, Number(initial.get('pagina')) || 1))
const requestedSortKey = initial.get('ordenar') as OrganizationSortKey
const sortKey = ref<OrganizationSortKey>(sortKeys.has(requestedSortKey) ? requestedSortKey : 'name')
const sortDirection = ref<DataTableSortDirection>(initial.get('direcao') === 'desc' ? 'desc' : 'asc')
const items = ref<PlatformOrganization[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const pageSize = 20
let debounce: ReturnType<typeof setTimeout> | undefined

const columns: DataTableColumn[] = [
  { key: 'name', label: 'Empresa', size: 'large', sortable: true },
  { key: 'slug', label: 'Identificador', size: 'medium', sortable: true },
  { key: 'status', label: 'Status', size: 'small', align: 'center', sortable: true },
  { key: 'version', label: 'Versão', size: 'small', align: 'center', sortable: true },
]
const tabs: TabItem[] = [
  { value: 'all', label: 'Todas' },
  { value: 'Active', label: 'Ativas' },
  { value: 'Provisioning', label: 'Em implantação' },
  { value: 'Suspended', label: 'Suspensas' },
  { value: 'Archived', label: 'Arquivadas' },
]
const statusLabel: Record<OrganizationStatus, string> = { Provisioning: 'Provisionando', Active: 'Ativa', Suspended: 'Suspensa', Archived: 'Arquivada' }
const statusVariant: Record<OrganizationStatus, BadgeVariant> = { Provisioning: 'info', Active: 'success', Suspended: 'danger', Archived: 'neutral' }
const rows = computed<DataTableRow[]>(() => items.value.map(item => ({ ...item })))
const range = computed(() => total.value ? `${(currentPage.value - 1) * pageSize + 1}–${Math.min(currentPage.value * pageSize, total.value)} de ${total.value}` : '0 de 0')
const hasFilters = computed(() => Boolean(debouncedSearch.value.trim()) || status.value !== 'all')

async function load() {
  if (!props.api) { error.value = 'O transporte autenticado da plataforma não está disponível.'; return }
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ page: String(currentPage.value), pageSize: String(pageSize) })
    params.set('sortBy', sortKey.value)
    params.set('sortDirection', sortDirection.value)
    if (debouncedSearch.value.trim()) params.set('search', debouncedSearch.value.trim())
    if (status.value !== 'all') params.set('status', status.value)
    const result = await props.api.listOrganizations(params)
    items.value = result.items
    total.value = result.total
  } catch (reason) { error.value = reason instanceof Error ? reason.message : 'Não foi possível carregar as empresas.' }
  finally { loading.value = false }
}
function persistUrl() {
  const url = new URL(window.location.href)
  if (debouncedSearch.value.trim()) url.searchParams.set('busca', debouncedSearch.value.trim()); else url.searchParams.delete('busca')
  if (status.value !== 'all') url.searchParams.set('status', status.value); else url.searchParams.delete('status')
  if (currentPage.value > 1) url.searchParams.set('pagina', String(currentPage.value)); else url.searchParams.delete('pagina')
  if (sortKey.value !== 'name') url.searchParams.set('ordenar', sortKey.value); else url.searchParams.delete('ordenar')
  if (sortDirection.value !== 'asc') url.searchParams.set('direcao', sortDirection.value); else url.searchParams.delete('direcao')
  window.history.replaceState(window.history.state, '', url)
}
function clearFilters() { search.value = ''; debouncedSearch.value = ''; status.value = 'all' }
function details(id: string) {
  const current = `${window.location.pathname}${window.location.search}`
  navigate(`/plataforma/empresas/${id}?retorno=${encodeURIComponent(current)}`)
}
function asOrganization(row: DataTableRow) { return row as unknown as PlatformOrganization }
function updateSort(state: { key?: string; direction?: DataTableSortDirection }) {
  sortKey.value = sortKeys.has(state.key as OrganizationSortKey) ? state.key as OrganizationSortKey : 'name'
  sortDirection.value = state.direction ?? 'asc'
}

watch(search, value => {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => { debouncedSearch.value = value; currentPage.value = 1 }, 300)
})
watch([debouncedSearch, status, sortKey, sortDirection], () => { currentPage.value = 1 })
watch([debouncedSearch, status, sortKey, sortDirection, currentPage], () => { persistUrl(); void load() })
onMounted(load)
onBeforeUnmount(() => { if (debounce) clearTimeout(debounce) })
</script>

<template>
  <section class="md:flex md:h-full md:min-h-0 md:flex-col" aria-label="Registro de empresas">
    <Card class="md:shrink-0 [&>div]:p-4">
      <Tabs v-model="status" :tabs="tabs" aria-label="Empresas por status" size="medium">
        <template #content>
          <Input v-model="search" type="search" clearable aria-label="Buscar empresa por nome ou identificador" placeholder="Buscar nome ou identificador..." class="w-full sm:max-w-sm">
            <template #leading><SearchIcon class="size-4 text-slate-400" aria-hidden="true" /></template>
          </Input>
        </template>
      </Tabs>
    </Card>

    <Card class="mt-4 md:min-h-0 md:flex-1 [&>div]:flex [&>div]:min-h-0 [&>div]:flex-col [&>div]:p-4">
      <div class="space-y-3 md:hidden">
        <template v-if="loading">
          <div v-for="index in 4" :key="index" class="animate-pulse rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div class="h-4 w-40 rounded bg-slate-200" /><div class="mt-3 h-3 w-28 rounded bg-slate-100" />
          </div>
        </template>
        <EmptyState v-else-if="error || !items.length" :title="error ? 'Não foi possível carregar as empresas' : 'Nenhuma empresa encontrada'" :description="error || (hasFilters ? 'Nenhuma empresa corresponde aos filtros selecionados.' : 'As empresas cadastradas aparecerão aqui.')" :role="error ? 'alert' : 'status'">
          <template #icon><TriangleAlertIcon v-if="error" /><SearchIcon v-else-if="hasFilters" /><Building2Icon v-else /></template>
          <template #action><Button v-if="error" size="small" variant="secondary" @click="load">Tentar novamente</Button><Button v-else-if="hasFilters" size="small" variant="secondary" @click="clearFilters">Limpar filtros</Button></template>
        </EmptyState>
        <Card v-for="organization in loading ? [] : items" v-else :key="organization.id">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0"><p class="truncate font-semibold text-slate-800">{{ organization.name }}</p><p class="mt-1 truncate text-xs text-slate-500">{{ organization.slug }}</p></div>
            <Badge :variant="statusVariant[organization.status]">{{ statusLabel[organization.status] }}</Badge>
          </div>
          <p class="mt-3 text-xs text-slate-400">Versão {{ organization.version }}</p>
          <template #footer><button type="button" class="-mx-6 -my-4 flex w-[calc(100%+3rem)] items-center justify-between px-6 py-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50" @click="details(organization.id)"><span>Ver detalhes</span><ArrowRightIcon class="size-4" aria-hidden="true" /></button></template>
        </Card>
      </div>

      <DataTable class="desktop-only-flex min-h-0 flex-1" :columns="columns" :rows="error ? [] : rows" :selectable="false" :loading="loading" sort-mode="manual" :sort-key="sortKey" :sort-direction="sortDirection" row-key="id" label="Empresas cadastradas" actions-label="Ação" @sort="updateSort">
        <template #cell-name="{ row }"><p class="font-medium text-slate-800">{{ asOrganization(row).name }}</p><p class="mt-1 text-xs text-slate-400">{{ asOrganization(row).id }}</p></template>
        <template #cell-slug="{ row }"><span class="font-medium text-slate-700">{{ asOrganization(row).slug }}</span></template>
        <template #cell-status="{ row }"><Badge :variant="statusVariant[asOrganization(row).status]">{{ statusLabel[asOrganization(row).status] }}</Badge></template>
        <template #cell-version="{ row }"><span class="text-slate-600">{{ asOrganization(row).version }}</span></template>
        <template #actions="{ row }"><Button size="small" variant="secondary" @click="details(asOrganization(row).id)">Detalhes<template #trailingIcon><ArrowRightIcon /></template></Button></template>
        <template #empty><EmptyState :bordered="false" size="large" :title="error ? 'Não foi possível carregar as empresas' : 'Nenhuma empresa encontrada'" :description="error || (hasFilters ? 'Nenhuma empresa corresponde aos filtros selecionados.' : 'As empresas cadastradas aparecerão aqui.')" :role="error ? 'alert' : 'status'"><template #icon><TriangleAlertIcon v-if="error" /><SearchIcon v-else-if="hasFilters" /><Building2Icon v-else /></template><template #action><Button v-if="error" size="small" variant="secondary" @click="load">Tentar novamente</Button><Button v-else-if="hasFilters" size="small" variant="secondary" @click="clearFilters">Limpar filtros</Button></template></EmptyState></template>
      </DataTable>

      <div v-if="!error" class="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-500" aria-live="polite">Mostrando {{ range }}</p>
        <Pagination v-model="currentPage" :total="total" :items-per-page="pageSize" size="medium" label="Paginação de empresas" />
      </div>
    </Card>
  </section>
</template>
