<script setup lang="ts">
import { DateTime } from 'luxon'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import {
  cancelAppointment,
  getAppointment,
  proposeChange,
  transitionProposal,
} from '../api/appointment.api'
import AppAlert from '../components/AppAlert.vue'
import { useAuthStore } from '../stores/auth.store'
import type { Appointment } from '../types/api'

const route = useRoute()
const auth = useAuthStore()
const id = Number(route.params.id)
const appointment = ref<Appointment | null>(null)
const proposedStart = ref('')
const message = ref('')

const load = async () => {
  appointment.value = await getAppointment(id)
}

const cancel = async () => {
  const reason = auth.user?.role === 'PROFESSIONAL'
    ? prompt('Motif de l’annulation') ?? '' : undefined
  if (auth.user?.role === 'PROFESSIONAL' && !reason) return
  if (!confirm('Confirmer l’annulation ?')) return
  appointment.value = await cancelAppointment(id, reason)
}

const propose = async () => {
  await proposeChange(id, new Date(proposedStart.value).toISOString())
  message.value = 'Proposition envoyée.'
  await load()
}

const decide = async (action: 'accept' | 'reject' | 'cancel' | 'force') => {
  await transitionProposal(id, appointment.value!.pendingProposal!.id, action)
  await load()
}

onMounted(load)
</script>

<template>
  <section v-if="appointment" class="card">
    <div class="card-body">
      <h1 class="h3">Détail du rendez-vous</h1>
      <AppAlert :message="message" type="success" />
      <dl class="row">
        <dt class="col-sm-3">État</dt><dd class="col-sm-9">
          {{ appointment.status }}</dd>
        <dt class="col-sm-3">Début</dt><dd class="col-sm-9">
          {{ DateTime.fromISO(appointment.range.startAt).toLocaleString(
            DateTime.DATETIME_MED) }}</dd>
        <dt class="col-sm-3">Code public</dt><dd class="col-sm-9">
          <code>{{ appointment.publicCode }}</code></dd>
      </dl>
      <button v-if="appointment.status === 'CONFIRMED'"
              class="btn btn-danger mb-4" @click="cancel">
        Annuler le rendez-vous
      </button>
      <div v-if="appointment.pendingProposal" class="alert alert-warning">
        Une proposition est en attente.
        <div class="mt-2 d-flex gap-2">
          <button class="btn btn-success btn-sm" @click="decide('accept')">
            Accepter
          </button>
          <button class="btn btn-outline-danger btn-sm"
                  @click="decide('reject')">Refuser</button>
          <button class="btn btn-outline-secondary btn-sm"
                  @click="decide('cancel')">Retirer</button>
          <button
            v-if="auth.user?.role === 'PROFESSIONAL'
              && appointment.pendingProposal.authorParty === 'PROFESSIONAL'"
                  class="btn btn-warning btn-sm" @click="decide('force')">
            Forcer après accord du client
          </button>
        </div>
      </div>
      <form v-else-if="appointment.status === 'CONFIRMED'"
            class="row g-2" @submit.prevent="propose">
        <div class="col-auto">
          <input v-model="proposedStart" class="form-control"
                 type="datetime-local" required>
        </div>
        <div class="col-auto">
          <button class="btn btn-outline-primary">Proposer ce créneau</button>
        </div>
      </form>
    </div>
  </section>
</template>
