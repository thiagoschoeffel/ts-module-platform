<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  ArrowRightIcon, Badge, Button, Card, ClipboardListIcon, DataTable, EmptyState,
  Pagination, TriangleAlertIcon, type BadgeVariant, type DataTableColumn,
  type DataTableRow, type DataTableSortDirection
} from '@thiagoschoeffel/ts-components'
import { onboardingStatusLabels, type PlatformApi } from '../services/platformApi'
import type { OnboardingStatus, PlatformOnboardingSummary } from '../types/platform'
import { navigate } from '../utils/navigation'

const props = defineProps<{ api?: PlatformApi }>()
const initial = new URLSearchParams(window.location.search)
type OnboardingSortKey = 'organizationName' | 'ownerEmail' | 'status' | 'attempts' | 'updatedAt'
const sortKeys = new Set<OnboardingSortKey>(['organizationName', 'ownerEmail', 'status', 'attempts', 'updatedAt'])
const requestedSortKey = initial.get('ordenar') as OnboardingSortKey
const items = ref<PlatformOnboardingSummary[]>([])
const total = ref(0)
const page = ref(Math.max(1, Number(initial.get('pagina')) || 1))
const sortKey = ref<OnboardingSortKey>(sortKeys.has(requestedSortKey) ? requestedSortKey : 'updatedAt')
const sortDirection = ref<DataTableSortDirection>(initial.get('direcao') === 'asc' ? 'asc' : 'desc')
const loading = ref(false)
const error = ref('')
const pageSize = 20
const range = computed(() => total.value
  ? `${(page.value - 1) * pageSize + 1}–${Math.min(page.value * pageSize, total.value)} de ${total.value}` : '0 de 0')
const variants: Record<OnboardingStatus, BadgeVariant> = {
  Provisioning: 'info', AwaitingOwner: 'warning', Active: 'success', NeedsAttention: 'danger', Cancelled: 'neutral',
}
const columns: DataTableColumn[] = [
  { key: 'organizationName', label: 'Empresa', size: 'large', sortable: true },
  { key: 'ownerEmail', label: 'Proprietário', size: 'large', sortable: true },
  { key: 'status', label: 'Status', size: 'medium', sortable: true },
  { key: 'attempts', label: 'Tentativas', size: 'small', align: 'center', sortable: true },
  { key: 'updatedAt', label: 'Atualização', size: 'medium', sortable: true },
]
const rows = computed<DataTableRow[]>(() => items.value.map(item => ({ ...item })))
const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'short'
}).format(new Date(value))
const asOnboarding = (row: DataTableRow) => row as unknown as PlatformOnboardingSummary

async function load() {
  if (!props.api) { error.value = 'O transporte autenticado da plataforma não está disponível.'; return }
  loading.value = true; error.value = ''
  try {
    const params = new URLSearchParams({
      page: String(page.value), pageSize: String(pageSize),
      sortBy: sortKey.value, sortDirection: sortDirection.value,
    })
    const result = await props.api.listOnboardings(params)
    items.value = result.items; total.value = result.total
  } catch (reason) { error.value = reason instanceof Error ? reason.message : 'Não foi possível carregar os onboardings.' }
  finally { loading.value = false }
}
function details(id: string) { navigate(`/plataforma/onboardings/${id}`) }
function persistUrl() {
  const url = new URL(window.location.href)
  if (page.value > 1) url.searchParams.set('pagina', String(page.value)); else url.searchParams.delete('pagina')
  if (sortKey.value !== 'updatedAt') url.searchParams.set('ordenar', sortKey.value); else url.searchParams.delete('ordenar')
  if (sortDirection.value !== 'desc') url.searchParams.set('direcao', sortDirection.value); else url.searchParams.delete('direcao')
  window.history.replaceState(window.history.state, '', url)
}
function updateSort(state: { key?: string; direction?: DataTableSortDirection }) {
  sortKey.value = sortKeys.has(state.key as OnboardingSortKey) ? state.key as OnboardingSortKey : 'updatedAt'
  sortDirection.value = state.direction ?? 'desc'
}
watch([sortKey, sortDirection], () => { page.value = 1 })
watch([sortKey, sortDirection, page], () => { persistUrl(); void load() })
onMounted(load)
</script>

<template>
  <section class="md:flex md:h-full md:min-h-0 md:flex-col" aria-label="Onboardings de empresas">
    <Card class="md:min-h-0 md:flex-1 [&>div]:flex [&>div]:min-h-0 [&>div]:flex-col [&>div]:p-4">
      <div class="space-y-3 md:hidden">
        <template v-if="loading">
          <div v-for="index in 4" :key="index" class="h-36 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
        </template>
        <EmptyState v-else-if="error || !items.length" :title="error ? 'Não foi possível carregar os onboardings' : 'Nenhum onboarding iniciado'" :description="error || 'Cadastre uma empresa para iniciar o provisionamento assistido.'" :role="error ? 'alert' : 'status'">
          <template #icon><TriangleAlertIcon v-if="error" /><ClipboardListIcon v-else /></template>
          <template #action><Button v-if="error" size="small" variant="secondary" @click="load">Tentar novamente</Button><Button v-else size="small" variant="secondary" @click="navigate('/plataforma/onboardings/novo')">Novo onboarding</Button></template>
        </EmptyState>
        <Card v-for="item in loading ? [] : items" v-else :key="item.id">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0"><p class="truncate font-semibold text-slate-800">{{ item.organizationName }}</p><p class="mt-1 truncate text-xs text-slate-500">{{ item.ownerEmail }} · {{ item.organizationSlug }}</p></div>
            <Badge :variant="variants[item.status]">{{ onboardingStatusLabels[item.status] }}</Badge>
          </div>
          <p class="mt-3 text-xs text-slate-400">{{ item.attempts }} tentativa(s) · {{ formatDate(item.updatedAt) }}</p>
          <template #footer><button type="button" class="-mx-6 -my-4 flex w-[calc(100%+3rem)] items-center justify-between px-6 py-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50" @click="details(item.id)"><span>Ver detalhes</span><ArrowRightIcon class="size-4" aria-hidden="true" /></button></template>
        </Card>
      </div>

      <DataTable class="desktop-only-flex min-h-0 flex-1" :columns="columns" :rows="error ? [] : rows" :selectable="false" :loading="loading" sort-mode="manual" :sort-key="sortKey" :sort-direction="sortDirection" row-key="id" label="Onboardings de empresas" actions-label="Ação" @sort="updateSort">
        <template #cell-organizationName="{ row }"><p class="font-medium text-slate-800">{{ asOnboarding(row).organizationName }}</p><p class="mt-1 text-xs text-slate-400">{{ asOnboarding(row).organizationSlug }}</p></template>
        <template #cell-ownerEmail="{ row }"><span class="text-slate-700">{{ asOnboarding(row).ownerEmail }}</span></template>
        <template #cell-status="{ row }"><Badge :variant="variants[asOnboarding(row).status]">{{ onboardingStatusLabels[asOnboarding(row).status] }}</Badge></template>
        <template #cell-attempts="{ row }"><span class="text-slate-600">{{ asOnboarding(row).attempts }}</span></template>
        <template #cell-updatedAt="{ row }"><time class="text-slate-600">{{ formatDate(asOnboarding(row).updatedAt) }}</time></template>
        <template #actions="{ row }"><Button size="small" variant="secondary" @click="details(asOnboarding(row).id)">Detalhes<template #trailingIcon><ArrowRightIcon /></template></Button></template>
        <template #empty><EmptyState :bordered="false" size="large" :title="error ? 'Não foi possível carregar os onboardings' : 'Nenhum onboarding iniciado'" :description="error || 'Cadastre uma empresa para iniciar o provisionamento assistido.'" :role="error ? 'alert' : 'status'"><template #icon><TriangleAlertIcon v-if="error" /><ClipboardListIcon v-else /></template><template #action><Button v-if="error" size="small" variant="secondary" @click="load">Tentar novamente</Button><Button v-else size="small" variant="secondary" @click="navigate('/plataforma/onboardings/novo')">Novo onboarding</Button></template></EmptyState></template>
      </DataTable>

      <div v-if="!error" class="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p class="text-sm text-slate-500">Mostrando {{ range }}</p>
        <Pagination v-model="page" :total="total" :items-per-page="pageSize" size="medium" label="Paginação de onboardings" />
      </div>
    </Card>
  </section>
</template>
