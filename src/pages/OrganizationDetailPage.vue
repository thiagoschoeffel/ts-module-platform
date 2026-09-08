<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Badge, Button, Card, EmptyState, Input, Select, TriangleAlertIcon } from '@thiagoschoeffel/ts-components'
import type { BadgeVariant, SelectOption } from '@thiagoschoeffel/ts-components'
import type { PlatformApi } from '../services/platformApi'
import type { OrganizationSaasSubscription, OrganizationStatus, PlatformOrganization, SaasPlanVersion } from '../types/platform'

const props = defineProps<{ api?: PlatformApi; organizationId: string; capabilities: readonly string[] }>()
const item = ref<PlatformOrganization>()
const subscription = ref<OrganizationSaasSubscription | null>(null)
const plans = ref<SaasPlanVersion[]>([])
const selectedPlanId = ref('')
const reason = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const labels: Record<OrganizationStatus, string> = { Provisioning: 'Provisionando', Active: 'Ativa', Suspended: 'Suspensa', Archived: 'Arquivada' }
const variants: Record<OrganizationStatus, BadgeVariant> = { Provisioning: 'info', Active: 'success', Suspended: 'danger', Archived: 'neutral' }
const canAdminister = computed(() => props.capabilities.includes('platform.organizations.administer'))
const planOptions = computed<SelectOption[]>(() => plans.value.map(plan => ({
  value: plan.id, label: `${plan.name} · v${plan.version}`,
  description: plan.entitlements.filter(value => value !== 'business.access').join(', '),
})))

async function load() {
  if (!props.api) { error.value = 'O transporte autenticado da plataforma não está disponível.'; return }
  loading.value = true; error.value = ''
  try {
    const [organization, currentSubscription, availablePlans] = await Promise.all([
      props.api.getOrganization(props.organizationId), props.api.getSaasSubscription(props.organizationId),
      props.api.listSaasPlans(),
    ])
    item.value = organization; subscription.value = currentSubscription; plans.value = availablePlans
    selectedPlanId.value = currentSubscription?.planVersionId ?? availablePlans[0]?.id ?? ''
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Não foi possível carregar a empresa.' }
  finally { loading.value = false }
}

async function assignPlan() {
  if (!props.api || !item.value || !selectedPlanId.value) return
  saving.value = true; error.value = ''
  try {
    const result = await props.api.assignSaasPlan(item.value.id, selectedPlanId.value, subscription.value?.version ?? null)
    item.value = { ...item.value, status: result.status, version: result.version }
    subscription.value = result.subscription
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Não foi possível atribuir o plano.' }
  finally { saving.value = false }
}

async function changeStatus(action: 'activation' | 'suspension' | 'reactivation') {
  if (!props.api || !item.value || !reason.value.trim()) return
  saving.value = true; error.value = ''
  try {
    const result = await props.api.changeOrganizationStatus(item.value.id, action, item.value.version, reason.value)
    item.value = { ...item.value, status: result.status, version: result.version }
    subscription.value = result.subscription; reason.value = ''
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Não foi possível alterar o estado.' }
  finally { saving.value = false }
}

onMounted(load); watch(() => props.organizationId, load)
</script>

<template>
  <div v-if="loading" class="py-10 text-center text-sm text-slate-500" role="status">Carregando empresa…</div>
  <EmptyState v-else-if="error && !item" title="Não foi possível carregar a empresa" :description="error" role="alert"><template #icon><TriangleAlertIcon /></template><template #action><Button size="small" variant="secondary" @click="load">Tentar novamente</Button></template></EmptyState>
  <div v-else-if="item" class="grid gap-4 md:grid-cols-2">
    <Card><template #header><h2 class="font-semibold text-slate-800">Cadastro</h2></template><dl class="grid gap-4"><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Nome</dt><dd class="mt-1 text-slate-800">{{ item.name }}</dd></div><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Slug</dt><dd class="mt-1 text-slate-800">{{ item.slug }}</dd></div><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Identificador</dt><dd class="mt-1 break-all font-mono text-xs text-slate-600">{{ item.id }}</dd></div></dl></Card>
    <Card><template #header><h2 class="font-semibold text-slate-800">Situação administrativa</h2></template><div class="flex items-center justify-between gap-3"><span class="text-slate-500">Estado atual</span><Badge :variant="variants[item.status]">{{ labels[item.status] }}</Badge></div><p class="mt-4 text-sm text-slate-500">Versão {{ item.version }}. Organizações suspensas preservam seus dados, mas não acessam APIs de negócio.</p></Card>
    <Card class="md:col-span-2"><template #header><h2 class="font-semibold text-slate-800">Plano SaaS e habilitações</h2></template>
      <div v-if="subscription" class="mb-4 flex flex-wrap items-center gap-2"><span class="font-medium text-slate-800">{{ subscription.planName }} · v{{ subscription.planVersion }}</span><Badge v-for="entitlement in subscription.entitlements" :key="entitlement" variant="neutral">{{ entitlement }}</Badge></div>
      <p v-else class="mb-4 text-sm text-slate-500">Nenhum plano atribuído. A empresa não pode ser ativada nem acessar APIs de negócio.</p>
      <div v-if="canAdminister" class="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><Select v-model="selectedPlanId" label="Versão do plano" :options="planOptions" placeholder="Selecione" /><Button :loading="saving" :disabled="!selectedPlanId || selectedPlanId === subscription?.planVersionId" @click="assignPlan">Atribuir plano</Button></div>
    </Card>
    <Card v-if="canAdminister && item.status !== 'Archived'" class="md:col-span-2"><template #header><h2 class="font-semibold text-slate-800">Alterar situação</h2></template>
      <div class="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><Input v-model="reason" label="Motivo" description="Obrigatório e registrado na auditoria global." :maxlength="1000" /><Button v-if="item.status === 'Provisioning'" :loading="saving" :disabled="!reason.trim() || !subscription" @click="changeStatus('activation')">Ativar empresa</Button><Button v-else-if="item.status === 'Active'" variant="danger" :loading="saving" :disabled="!reason.trim()" @click="changeStatus('suspension')">Suspender empresa</Button><Button v-else-if="item.status === 'Suspended'" :loading="saving" :disabled="!reason.trim()" @click="changeStatus('reactivation')">Reativar empresa</Button></div>
    </Card>
    <div v-if="error" class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-2" role="alert"><TriangleAlertIcon class="mt-0.5 size-4 shrink-0" />{{ error }}</div>
  </div>
</template>
