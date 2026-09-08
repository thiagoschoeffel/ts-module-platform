<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Badge, Button, Card, EmptyState, TriangleAlertIcon, type BadgeVariant } from '@thiagoschoeffel/ts-components'
import { onboardingStatusLabels, type PlatformApi } from '../services/platformApi'
import type { OnboardingStatus, PlatformOnboardingDetail } from '../types/platform'

const props = defineProps<{ api?: PlatformApi; onboardingId: string }>()
const item = ref<PlatformOnboardingDetail>()
const loading = ref(false)
const retrying = ref(false)
const error = ref('')
let polling: ReturnType<typeof setTimeout> | undefined
const variants: Record<OnboardingStatus, BadgeVariant> = { Provisioning: 'info', AwaitingOwner: 'warning', Active: 'success', NeedsAttention: 'danger', Cancelled: 'neutral' }
const shouldPoll = computed(() => item.value?.operationStatus === 'Pending' || item.value?.operationStatus === 'Running')

async function load(silent = false) {
  if (!props.api) { error.value = 'O transporte autenticado da plataforma não está disponível.'; return }
  if (!silent) loading.value = true
  error.value = ''
  try { item.value = await props.api.getOnboarding(props.onboardingId) }
  catch (reason) { error.value = reason instanceof Error ? reason.message : 'Não foi possível carregar o onboarding.' }
  finally {
    loading.value = false
    if (polling) clearTimeout(polling)
    if (shouldPoll.value) polling = setTimeout(() => void load(true), 2000)
  }
}
async function retry() {
  if (!props.api || !item.value) return
  retrying.value = true; error.value = ''
  try { item.value = await props.api.retryOnboarding(item.value.id, item.value.operationVersion); await load(true) }
  catch (reason) { error.value = reason instanceof Error ? reason.message : 'Não foi possível retomar o onboarding.' }
  finally { retrying.value = false }
}
onMounted(() => load()); onBeforeUnmount(() => { if (polling) clearTimeout(polling) })
</script>

<template>
  <div v-if="loading" class="py-10 text-center text-sm text-slate-500" role="status">Carregando onboarding…</div>
  <EmptyState v-else-if="error && !item" title="Não foi possível carregar o onboarding" :description="error" role="alert"><template #icon><TriangleAlertIcon /></template><template #action><Button size="small" variant="secondary" @click="load()">Tentar novamente</Button></template></EmptyState>
  <div v-else-if="item" class="grid gap-4 md:grid-cols-2">
    <Card><template #header><h2 class="font-semibold text-slate-800">Empresa e proprietário</h2></template><dl class="grid gap-4"><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Empresa</dt><dd class="mt-1 text-slate-800">{{ item.organizationName }}</dd></div><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Identificador</dt><dd class="mt-1 text-slate-800">{{ item.organizationSlug }}</dd></div><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Proprietário convidado</dt><dd class="mt-1 text-slate-800">{{ item.ownerEmail }}</dd></div><div class="grid grid-cols-2 gap-4"><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Fuso</dt><dd class="mt-1 text-slate-800">{{ item.timeZone }}</dd></div><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Localidade</dt><dd class="mt-1 text-slate-800">{{ item.locale }}</dd></div></div></dl></Card>
    <Card><template #header><div class="flex items-center justify-between gap-3"><h2 class="font-semibold text-slate-800">Provisionamento</h2><Badge :variant="variants[item.status]">{{ onboardingStatusLabels[item.status] }}</Badge></div></template><dl class="grid gap-4"><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Etapa</dt><dd class="mt-1 text-slate-800">Envio do convite do proprietário</dd></div><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Tentativas</dt><dd class="mt-1 text-slate-800">{{ item.attempts }} de 5</dd></div><div v-if="item.nextAttemptAt"><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Próxima tentativa</dt><dd class="mt-1 text-slate-800">{{ new Date(item.nextAttemptAt).toLocaleString('pt-BR') }}</dd></div><div v-if="item.lastError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{{ item.lastError }}</div><p v-if="shouldPoll" class="text-sm text-slate-500" aria-live="polite">A operação é retomada automaticamente mesmo após reinício da API.</p><Button v-if="item.operationStatus === 'NeedsAttention'" size="small" variant="secondary" :loading="retrying" @click="retry">Tentar novamente</Button><p v-if="error" class="text-sm text-red-600" role="alert">{{ error }}</p></dl></Card>
  </div>
</template>
