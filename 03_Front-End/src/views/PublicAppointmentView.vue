<script setup lang="ts">
import { onMounted, ref } from 'vue'

import {
  cancelPublicAppointment,
  getPublicAppointment,
  proposePublicChange,
  transitionPublicProposal,
} from '../api/appointment.api'
import AppAlert from '../components/AppAlert.vue'
import type { Appointment } from '../types/api'

const appointment = ref<Appointment | null>(null)
const error = ref('')
const code = sessionStorage.getItem('publicCode') ?? ''
const proposedStart = ref('')

const load = async () => {
  try {
    appointment.value = await getPublicAppointment(code)
  } catch {
    error.value = 'Réservation introuvable.'
  }
}

const cancel = async () => {
  if (!confirm('Annuler ce rendez-vous ?')) return
  appointment.value = await cancelPublicAppointment(code)
}

const propose = async () => {
  await proposePublicChange(code, new Date(proposedStart.value).toISOString())
  proposedStart.value = ''
  await load()
}

const decide = async (action: 'accept' | 'reject' | 'cancel') => {
  await transitionPublicProposal(
    code,
    appointment.value!.pendingProposal!.id,
    action,
  )
  await load()
}

onMounted(load)
</script>

<template>
  <section class="card">
    <div class="card-body">
      <h1 class="h3">Ma réservation</h1>
      <AppAlert :message="error" />
      <template v-if="appointment">
        <p><strong>État :</strong> {{ appointment.status }}</p>
        <p><strong>Restaurant :</strong>
          {{ appointment.professional.businessName }}</p>
        <p><strong>Début :</strong> {{ appointment.range.startAt }}</p>
        <button v-if="appointment.status === 'CONFIRMED'"
                class="btn btn-danger" @click="cancel">
          Annuler le rendez-vous
        </button>
        <div v-if="appointment.pendingProposal"
             class="alert alert-warning mt-3">
          Une modification est en attente.
          <button class="btn btn-success btn-sm ms-2" @click="decide('accept')">
            Accepter
          </button>
          <button class="btn btn-outline-danger btn-sm ms-2"
                  @click="decide('reject')">Refuser</button>
          <button class="btn btn-outline-secondary btn-sm ms-2"
                  @click="decide('cancel')">Retirer</button>
        </div>
        <form v-else-if="appointment.status === 'CONFIRMED'"
              class="input-group mt-3" @submit.prevent="propose">
          <input v-model="proposedStart" class="form-control"
                 type="datetime-local" required>
          <button class="btn btn-outline-primary">Proposer</button>
        </form>
      </template>
    </div>
  </section>
</template>
