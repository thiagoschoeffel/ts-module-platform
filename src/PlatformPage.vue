<script setup lang="ts">
import { computed } from 'vue'
import { Building2Icon, ChevronLeftIcon, ClipboardListIcon, HistoryIcon, PageHeader } from '@thiagoschoeffel/ts-components'
import '@thiagoschoeffel/ts-components/style.css'
import './style.css'
import OrganizationDetailPage from './pages/OrganizationDetailPage.vue'
import OrganizationListPage from './pages/OrganizationListPage.vue'
import OnboardingDetailPage from './pages/OnboardingDetailPage.vue'
import OnboardingListPage from './pages/OnboardingListPage.vue'
import NewOnboardingPage from './pages/NewOnboardingPage.vue'
import PlatformAuditPage from './pages/PlatformAuditPage.vue'
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

function organizationsReturnUrl() {
  const candidate = new URLSearchParams(window.location.search).get('retorno')
  return candidate && /^\/plataforma\/empresas(?:\?.*)?$/.test(candidate) ? candidate : '/plataforma/empresas'
}

const showReturn = computed(() => (props.section === 'organizations' && props.organizationId)
  || (props.section === 'onboardings' && props.onboardingPage !== 'list'))
const returnUrl = computed(() => props.section === 'onboardings'
  ? '/plataforma/onboardings' : organizationsReturnUrl())
</script>

<template>
  <div class="isolate flex h-full min-h-0 flex-col gap-4">
    <div class="ts-responsive-row gap-4">
      <PageHeader :title="header.title" :subtitle="header.subtitle">
        <template #icon><component :is="header.icon" :size="32" :stroke-width="1.75" /></template>
      </PageHeader>
      <a
        v-if="showReturn"
        :href="returnUrl"
        class="inline-flex items-center gap-1 text-sm font-medium text-slate-400 transition-colors hover:text-slate-800 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
        <ChevronLeftIcon class="size-4" aria-hidden="true" />
        Voltar para empresas
      </a>
    </div>
    <div class="min-h-0 flex-1">
      <OrganizationListPage v-if="props.section === 'organizations' && !props.organizationId" :api="api" />
      <OrganizationDetailPage v-else-if="props.section === 'organizations'" :api="api" :organization-id="props.organizationId!" />
      <PlatformAuditPage v-else-if="props.section === 'audit'" :api="api" />
      <OnboardingListPage v-else-if="props.onboardingPage === 'list'" :api="api" />
      <NewOnboardingPage v-else-if="props.onboardingPage === 'new'" :api="api" />
      <OnboardingDetailPage v-else :api="api" :onboarding-id="props.onboardingId!" />
    </div>
  </div>
</template>
