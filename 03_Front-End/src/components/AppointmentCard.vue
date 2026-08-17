<script setup lang="ts">
import { DateTime } from 'luxon'

import type { Appointment } from '../types/api'

defineProps<{ appointment: Appointment }>()

const format = (instant: string) => DateTime.fromISO(instant)
  .setLocale('fr').toLocaleString(DateTime.DATETIME_MED)
</script>

<template>
  <article class="card h-100">
    <div class="card-body">
      <span
        class="badge mb-2"
        :class="appointment.status === 'CONFIRMED'
          ? 'text-bg-success' : 'text-bg-secondary'"
      >
        {{ appointment.status }}
      </span>
      <h2 class="h6">
        {{ appointment.professional?.businessName ?? 'Rendez-vous' }}
      </h2>
      <p class="mb-2">
        {{ format(appointment.range.startAt) }}
      </p>
      <RouterLink
        class="btn btn-outline-primary btn-sm"
        :to="`/appointments/${appointment.id}`"
      >
        Voir le détail
      </RouterLink>
    </div>
  </article>
</template>
