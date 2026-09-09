<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  Button, Card, DataTable, EmptyState, HistoryIcon, Input, Pagination, SearchIcon,
  TriangleAlertIcon, type DataTableColumn, type DataTableRow, type DataTableSortDirection
} from '@thiagoschoeffel/ts-components'
import type { PlatformApi } from '../services/platformApi'
import type { PlatformAuditEvent } from '../types/platform'

const props = defineProps<{ api?: PlatformApi }>()
const initial = new URLSearchParams(window.location.search)
const action = ref(initial.get('acao') ?? '')
const debouncedAction = ref(action.value)
const page = ref(Math.max(1, Number(initial.get('pagina')) || 1))
type AuditSortKey = 'action' | 'actorKind' | 'result' | 'occurredAt'
const sortKeys = new Set<AuditSortKey>(['action', 'actorKind', 'result', 'occurredAt'])
const requestedSortKey = initial.get('ordenar') as AuditSortKey
const sortKey = ref<AuditSortKey>(sortKeys.has(requestedSortKey) ? requestedSortKey : 'occurredAt')
const sortDirection = ref<DataTableSortDirection>(initial.get('direcao') === 'asc' ? 'asc' : 'desc')
const pageSize = 20
const total = ref(0)
const items = ref<PlatformAuditEvent[]>([])
const loading = ref(false)
const error = ref('')
let debounce: ReturnType<typeof setTimeout> | undefined

const columns: DataTableColumn[] = [
  { key: 'action', label: 'Ação', size: 'large', sortable: true },
  { key: 'actorKind', label: 'Ator', size: 'medium', sortable: true },
  { key: 'result', label: 'Resultado', size: 'small', sortable: true },
  { key: 'occurredAt', label: 'Data e hora', size: 'medium', sortable: true },
]
const rows = computed<DataTableRow[]>(() => items.value.map(item => ({ ...item })))
const range = computed(() => total.value ? `${(page.value - 1) * pageSize + 1}–${Math.min(page.value * pageSize, total.value)} de ${total.value}` : '0 de 0')
const hasSearch = computed(() => Boolean(debouncedAction.value.trim()))
const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
const asEvent = (row: DataTableRow) => row as unknown as PlatformAuditEvent

async function load() {
  if (!props.api) { error.value = 'O transporte autenticado da plataforma não está disponível.'; return }
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize) })
    params.set('sortBy', sortKey.value)
    params.set('sortDirection', sortDirection.value)
    if (debouncedAction.value.trim()) params.set('action', debouncedAction.value.trim())
    const result = await props.api.listAudit(params)
    items.value = result.items
    total.value = result.total
  } catch (reason) { error.value = reason instanceof Error ? reason.message : 'Não foi possível carregar a auditoria.' }
  finally { loading.value = false }
}
function persistUrl() {
  const url = new URL(window.location.href)
  if (debouncedAction.value.trim()) url.searchParams.set('acao', debouncedAction.value.trim()); else url.searchParams.delete('acao')
  if (page.value > 1) url.searchParams.set('pagina', String(page.value)); else url.searchParams.delete('pagina')
  if (sortKey.value !== 'occurredAt') url.searchParams.set('ordenar', sortKey.value); else url.searchParams.delete('ordenar')
  if (sortDirection.value !== 'desc') url.searchParams.set('direcao', sortDirection.value); else url.searchParams.delete('direcao')
  window.history.replaceState(window.history.state, '', url)
}
function clearSearch() { action.value = ''; debouncedAction.value = '' }
function updateSort(state: { key?: string; direction?: DataTableSortDirection }) {
  sortKey.value = sortKeys.has(state.key as AuditSortKey) ? state.key as AuditSortKey : 'occurredAt'
  sortDirection.value = state.direction ?? 'desc'
}

watch(action, value => {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => { debouncedAction.value = value; page.value = 1 }, 300)
})
watch([debouncedAction, sortKey, sortDirection], () => { page.value = 1 })
watch([debouncedAction, sortKey, sortDirection, page], () => { persistUrl(); void load() })
onMounted(load)
onBeforeUnmount(() => { if (debounce) clearTimeout(debounce) })
</script>

<template>
  <section class="md:flex md:h-full md:min-h-0 md:flex-col" aria-label="Auditoria da plataforma">
    <Card class="md:shrink-0 [&>div]:p-4">
      <div class="flex justify-start">
        <Input v-model="action" type="search" clearable placeholder="Buscar pela ação..." aria-label="Buscar auditoria pela ação" class="w-full sm:max-w-sm"><template #leading><SearchIcon class="size-4 text-slate-400" aria-hidden="true" /></template></Input>
      </div>
    </Card>

    <Card class="mt-4 md:min-h-0 md:flex-1 [&>div]:flex [&>div]:min-h-0 [&>div]:flex-col [&>div]:p-4">
      <div class="space-y-3 md:hidden">
        <template v-if="loading"><div v-for="index in 4" :key="index" class="animate-pulse rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div class="h-4 w-48 rounded bg-slate-200" /><div class="mt-3 h-3 w-32 rounded bg-slate-100" /></div></template>
        <EmptyState v-else-if="error || !items.length" :title="error ? 'Não foi possível carregar a auditoria' : 'Nenhum evento encontrado'" :description="error || (hasSearch ? 'Nenhum evento corresponde à ação informada.' : 'Os eventos administrativos aparecerão aqui.')" :role="error ? 'alert' : 'status'"><template #icon><TriangleAlertIcon v-if="error" /><SearchIcon v-else-if="hasSearch" /><HistoryIcon v-else /></template><template #action><Button v-if="error" size="small" variant="secondary" @click="load">Tentar novamente</Button><Button v-else-if="hasSearch" size="small" variant="secondary" @click="clearSearch">Limpar busca</Button></template></EmptyState>
        <Card v-for="event in loading ? [] : items" v-else :key="event.id"><div class="flex items-start justify-between gap-3"><p class="font-semibold text-slate-800">{{ event.action }}</p><time class="shrink-0 text-xs text-slate-400">{{ formatDate(event.occurredAt) }}</time></div><p class="mt-2 text-sm text-slate-500">{{ event.actorKind }} · {{ event.result }}</p><p class="mt-1 text-sm text-slate-500">{{ event.reason }}</p><p class="mt-2 break-all font-mono text-[0.6875rem] text-slate-400">{{ event.correlationId }}</p></Card>
      </div>

      <DataTable class="desktop-only-flex min-h-0 flex-1" :columns="columns" :rows="error ? [] : rows" :selectable="false" :loading="loading" sort-mode="manual" :sort-key="sortKey" :sort-direction="sortDirection" row-key="id" label="Eventos administrativos" @sort="updateSort">
        <template #cell-action="{ row }"><p class="font-medium text-slate-800">{{ asEvent(row).action }}</p><p class="mt-1 text-xs text-slate-400">{{ asEvent(row).targetType }} · {{ asEvent(row).targetId }}</p></template>
        <template #cell-actorKind="{ row }"><span class="text-slate-700">{{ asEvent(row).actorKind }}</span></template>
        <template #cell-result="{ row }"><p class="font-medium text-slate-700">{{ asEvent(row).result }}</p><p class="mt-1 max-w-60 whitespace-normal text-xs text-slate-500">{{ asEvent(row).reason }}</p></template>
        <template #cell-occurredAt="{ row }"><time class="text-slate-600">{{ formatDate(asEvent(row).occurredAt) }}</time></template>
        <template #empty><EmptyState :bordered="false" size="large" :title="error ? 'Não foi possível carregar a auditoria' : 'Nenhum evento encontrado'" :description="error || (hasSearch ? 'Nenhum evento corresponde à ação informada.' : 'Os eventos administrativos aparecerão aqui.')" :role="error ? 'alert' : 'status'"><template #icon><TriangleAlertIcon v-if="error" /><SearchIcon v-else-if="hasSearch" /><HistoryIcon v-else /></template><template #action><Button v-if="error" size="small" variant="secondary" @click="load">Tentar novamente</Button><Button v-else-if="hasSearch" size="small" variant="secondary" @click="clearSearch">Limpar busca</Button></template></EmptyState></template>
      </DataTable>

      <div v-if="!error" class="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3"><p class="text-sm text-slate-500" aria-live="polite">Mostrando {{ range }}</p><Pagination v-model="page" :total="total" :items-per-page="pageSize" size="medium" label="Paginação da auditoria" /></div>
    </Card>
  </section>
</template>
