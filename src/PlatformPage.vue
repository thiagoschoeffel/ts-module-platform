<script setup lang="ts">
import { computed } from 'vue'
import { Building2Icon, ClipboardListIcon, HistoryIcon, PageHeader } from '@thiagoschoeffel/ts-components'
import '@thiagoschoeffel/ts-components/style.css'
import './style.css'
import OrganizationDetailPage from './pages/OrganizationDetailPage.vue'
import OrganizationListPage from './pages/OrganizationListPage.vue'
import PlatformAuditPage from './pages/PlatformAuditPage.vue'
import UnavailableOnboardingPage from './pages/UnavailableOnboardingPage.vue'
import { createPlatformApi } from './services/platformApi'
import type { PlatformPageProps } from './types/platform'

const props = withDefaults(defineProps<PlatformPageProps>(), {
  section: 'organizations',
  organizationId: undefined,
  onboardingId: undefined,
  onboardingPage: 'list',
  platformRequest: undefined,
  capabilities: () => [],
})
const api = computed(() => props.platformRequest ? createPlatformApi(props.platformRequest) : undefined)
const header = computed(() => props.section === 'audit'
  ? { title: 'Auditoria da plataforma', subtitle: 'Consulte ações administrativas globais.', icon: HistoryIcon }
  : props.section === 'onboardings'
    ? { title: 'Onboardings', subtitle: 'Acompanhe a admissão assistida de empresas.', icon: ClipboardListIcon }
    : { title: props.organizationId ? 'Detalhe da empresa' : 'Empresas', subtitle: 'Consulte o registro administrativo do SaaS.', icon: Building2Icon })
</script>

<template>
  <div class="isolate space-y-6">
    <PageHeader :title="header.title" :subtitle="header.subtitle">
      <template #icon><component :is="header.icon" :size="32" :stroke-width="1.75" /></template>
    </PageHeader>
    <OrganizationListPage v-if="props.section === 'organizations' && !props.organizationId" :api="api" />
    <OrganizationDetailPage v-else-if="props.section === 'organizations'" :api="api" :organization-id="props.organizationId!" />
    <PlatformAuditPage v-else-if="props.section === 'audit'" :api="api" />
    <UnavailableOnboardingPage v-else />
  </div>
</template>
