<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Button, Card, EmptyState, Input, Pagination, SearchIcon, TriangleAlertIcon } from '@thiagoschoeffel/ts-components'
import type { PlatformApi } from '../services/platformApi'
import type { PlatformAuditEvent } from '../types/platform'

const props = defineProps<{ api?: PlatformApi }>()
const action = ref(new URLSearchParams(window.location.search).get('acao') ?? '')
const page = ref(1); const pageSize = 20; const total = ref(0)
const items = ref<PlatformAuditEvent[]>([]); const loading = ref(false); const error = ref('')
let debounce: ReturnType<typeof setTimeout> | undefined
async function load() {
  if (!props.api) { error.value = 'O transporte autenticado da plataforma não está disponível.'; return }
  loading.value = true; error.value = ''
  try { const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize) }); if (action.value.trim()) params.set('action', action.value.trim()); const result = await props.api.listAudit(params); items.value = result.items; total.value = result.total }
  catch (reason) { error.value = reason instanceof Error ? reason.message : 'Não foi possível carregar a auditoria.' }
  finally { loading.value = false }
}
watch(action, () => { page.value = 1; if (debounce) clearTimeout(debounce); debounce = setTimeout(load, 300) }); watch(page, load); onMounted(load)
const formatDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
</script>

<template><Card><template #header><div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="font-semibold text-slate-800">Eventos administrativos</h2><p class="mt-1 text-sm text-slate-500">Resultados globais, sem dados operacionais dos clientes.</p></div><Input v-model="action" type="search" clearable placeholder="Filtrar pela ação…" aria-label="Filtrar auditoria pela ação" class="w-full sm:max-w-sm"><template #leading><SearchIcon /></template></Input></div></template><div v-if="loading" class="py-10 text-center text-sm text-slate-500" role="status">Carregando auditoria…</div><EmptyState v-else-if="error" title="Não foi possível carregar a auditoria" :description="error" role="alert"><template #icon><TriangleAlertIcon /></template><template #action><Button size="small" variant="secondary" @click="load">Tentar novamente</Button></template></EmptyState><EmptyState v-else-if="!items.length" title="Nenhum evento encontrado" description="Os eventos administrativos autorizados aparecerão aqui." /><ul v-else class="divide-y divide-slate-200"><li v-for="event in items" :key="event.id" class="py-4 first:pt-0 last:pb-0"><div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><p class="font-medium text-slate-800">{{ event.action }}</p><time class="text-xs text-slate-400">{{ formatDate(event.occurredAt) }}</time></div><p class="mt-1 text-sm text-slate-500">{{ event.actorKind }} · {{ event.result }} · {{ event.reason }}</p><p class="mt-1 break-all font-mono text-[0.6875rem] text-slate-400">{{ event.correlationId }}</p></li></ul><template v-if="total" #footer><Pagination v-model="page" :total="total" :items-per-page="pageSize" label="Paginação da auditoria" /></template></Card></template>
