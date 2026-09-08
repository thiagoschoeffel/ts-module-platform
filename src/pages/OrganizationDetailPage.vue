<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Badge, Button, Card, EmptyState, TriangleAlertIcon } from '@thiagoschoeffel/ts-components'
import type { BadgeVariant } from '@thiagoschoeffel/ts-components'
import type { PlatformApi } from '../services/platformApi'
import type { OrganizationStatus, PlatformOrganization } from '../types/platform'

const props = defineProps<{ api?: PlatformApi; organizationId: string }>()
const item = ref<PlatformOrganization>()
const loading = ref(false)
const error = ref('')
const labels: Record<OrganizationStatus, string> = { Provisioning: 'Provisionando', Active: 'Ativa', Suspended: 'Suspensa', Archived: 'Arquivada' }
const variants: Record<OrganizationStatus, BadgeVariant> = { Provisioning: 'info', Active: 'success', Suspended: 'danger', Archived: 'neutral' }
async function load() {
  if (!props.api) { error.value = 'O transporte autenticado da plataforma não está disponível.'; return }
  loading.value = true; error.value = ''
  try { item.value = await props.api.getOrganization(props.organizationId) }
  catch (reason) { error.value = reason instanceof Error ? reason.message : 'Não foi possível carregar a empresa.' }
  finally { loading.value = false }
}
onMounted(load); watch(() => props.organizationId, load)
</script>

<template>
  <div v-if="loading" class="py-10 text-center text-sm text-slate-500" role="status">Carregando empresa…</div>
  <EmptyState v-else-if="error" title="Não foi possível carregar a empresa" :description="error" role="alert"><template #icon><TriangleAlertIcon /></template><template #action><Button size="small" variant="secondary" @click="load">Tentar novamente</Button></template></EmptyState>
  <div v-else-if="item" class="grid gap-4 md:grid-cols-2">
    <Card><template #header><h2 class="font-semibold text-slate-800">Cadastro</h2></template><dl class="grid gap-4"><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Nome</dt><dd class="mt-1 text-slate-800">{{ item.name }}</dd></div><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Slug</dt><dd class="mt-1 text-slate-800">{{ item.slug }}</dd></div><div><dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Identificador</dt><dd class="mt-1 break-all font-mono text-xs text-slate-600">{{ item.id }}</dd></div></dl></Card>
    <Card><template #header><h2 class="font-semibold text-slate-800">Situação administrativa</h2></template><div class="flex items-center justify-between gap-3"><span class="text-slate-500">Estado atual</span><Badge :variant="variants[item.status]">{{ labels[item.status] }}</Badge></div><p class="mt-4 text-sm text-slate-500">Versão {{ item.version }}. Ações de ativação e suspensão serão exibidas somente após os contratos S06.</p></Card>
  </div>
</template>
