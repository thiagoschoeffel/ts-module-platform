<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowRightIcon, Badge, Button, Card, ClipboardListIcon, EmptyState, Pagination, TriangleAlertIcon, type BadgeVariant } from '@thiagoschoeffel/ts-components'
import { onboardingStatusLabels, type PlatformApi } from '../services/platformApi'
import type { OnboardingStatus, PlatformOnboardingSummary } from '../types/platform'
import { navigate } from '../utils/navigation'

const props = defineProps<{ api?: PlatformApi }>()
const items = ref<PlatformOnboardingSummary[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const error = ref('')
const pageSize = 20
const range = computed(() => total.value
  ? `${(page.value - 1) * pageSize + 1}–${Math.min(page.value * pageSize, total.value)} de ${total.value}` : '0 de 0')
const variants: Record<OnboardingStatus, BadgeVariant> = {
  Provisioning: 'info', AwaitingOwner: 'warning', Active: 'success', NeedsAttention: 'danger', Cancelled: 'neutral',
}

async function load() {
  if (!props.api) { error.value = 'O transporte autenticado da plataforma não está disponível.'; return }
  loading.value = true; error.value = ''
  try {
    const result = await props.api.listOnboardings(new URLSearchParams({ page: String(page.value), pageSize: String(pageSize) }))
    items.value = result.items; total.value = result.total
  } catch (reason) { error.value = reason instanceof Error ? reason.message : 'Não foi possível carregar os onboardings.' }
  finally { loading.value = false }
}
function details(id: string) { navigate(`/plataforma/onboardings/${id}`) }
onMounted(load)
</script>

<template>
  <section class="space-y-4" aria-label="Onboardings de empresas">
    <div class="flex justify-end"><Button size="small" @click="navigate('/plataforma/onboardings/novo')">Novo onboarding</Button></div>
    <Card class="[&>div]:p-4">
      <div v-if="loading" class="space-y-3" role="status" aria-label="Carregando onboardings">
        <div v-for="index in 4" :key="index" class="h-20 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
      </div>
      <EmptyState v-else-if="error || !items.length" :title="error ? 'Não foi possível carregar os onboardings' : 'Nenhum onboarding iniciado'" :description="error || 'Cadastre uma empresa para iniciar o provisionamento assistido.'" :role="error ? 'alert' : 'status'">
        <template #icon><TriangleAlertIcon v-if="error" /><ClipboardListIcon v-else /></template>
        <template #action><Button v-if="error" size="small" variant="secondary" @click="load">Tentar novamente</Button><Button v-else size="small" @click="navigate('/plataforma/onboardings/novo')">Novo onboarding</Button></template>
      </EmptyState>
      <div v-else class="divide-y divide-slate-100">
        <button v-for="item in items" :key="item.id" type="button" class="flex w-full items-center gap-4 py-4 text-left first:pt-0 last:pb-0 hover:bg-slate-50" @click="details(item.id)">
          <span class="min-w-0 flex-1"><span class="block truncate font-medium text-slate-800">{{ item.organizationName }}</span><span class="mt-1 block truncate text-xs text-slate-500">{{ item.ownerEmail }} · {{ item.organizationSlug }}</span></span>
          <span class="hidden text-right text-xs text-slate-400 sm:block">{{ item.attempts }} tentativa(s)<br>{{ new Date(item.updatedAt).toLocaleString('pt-BR') }}</span>
          <Badge :variant="variants[item.status]">{{ onboardingStatusLabels[item.status] }}</Badge>
          <ArrowRightIcon class="size-4 shrink-0 text-slate-400" aria-hidden="true" />
        </button>
      </div>
      <div v-if="!error && total" class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p class="text-sm text-slate-500">Mostrando {{ range }}</p>
        <Pagination v-model="page" :total="total" :items-per-page="pageSize" size="medium" label="Paginação de onboardings" @update:model-value="load" />
      </div>
    </Card>
  </section>
</template>
