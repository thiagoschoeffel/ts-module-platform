<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button, Card, Input, TriangleAlertIcon } from '@thiagoschoeffel/ts-components'
import type { PlatformApi } from '../services/platformApi'
import { navigate } from '../utils/navigation'

const props = defineProps<{ api?: PlatformApi }>()
const name = ref('')
const slug = ref('')
const ownerEmail = ref('')
const timeZone = ref('America/Sao_Paulo')
const locale = ref('pt-BR')
const slugEdited = ref(false)
const submitting = ref(false)
const error = ref('')
let idempotencyKey = crypto.randomUUID()

watch(name, value => {
  if (!slugEdited.value) slug.value = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
})
async function submit() {
  if (!props.api) { error.value = 'O transporte autenticado da plataforma não está disponível.'; return }
  submitting.value = true; error.value = ''
  try {
    const result = await props.api.createOnboarding({ name: name.value, slug: slug.value,
      ownerEmail: ownerEmail.value, timeZone: timeZone.value, locale: locale.value }, idempotencyKey)
    idempotencyKey = crypto.randomUUID()
    navigate(`/plataforma/onboardings/${result.onboardingId}`)
  } catch (reason) { error.value = reason instanceof Error ? reason.message : 'Não foi possível iniciar o onboarding.' }
  finally { submitting.value = false }
}
</script>

<template>
  <Card>
    <template #header><div><h2 class="font-semibold text-slate-800">Cadastrar empresa</h2><p class="mt-1 text-sm text-slate-500">A empresa será criada em provisionamento e o proprietário receberá um convite.</p></div></template>
    <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="submit">
      <Input v-model="name" class="sm:col-span-2" label="Nome da empresa" required :maxlength="160" autofocus />
      <Input v-model="slug" label="Identificador" description="Usado em URLs e integrações." required :maxlength="100" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" @input="slugEdited = true" />
      <Input v-model="ownerEmail" type="email" label="E-mail do proprietário" required :maxlength="254" autocomplete="email" />
      <Input v-model="timeZone" label="Fuso horário" required :maxlength="100" />
      <Input v-model="locale" label="Localidade" required :maxlength="20" />
      <div v-if="error" class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2" role="alert"><TriangleAlertIcon class="mt-0.5 size-4 shrink-0" />{{ error }}</div>
      <div class="flex justify-end gap-2 sm:col-span-2"><Button variant="secondary" @click="navigate('/plataforma/onboardings')">Cancelar</Button><Button type="submit" :loading="submitting">Iniciar onboarding</Button></div>
    </form>
  </Card>
</template>
