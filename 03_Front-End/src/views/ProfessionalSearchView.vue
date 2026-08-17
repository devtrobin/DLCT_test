<script setup lang="ts">
import { ref } from 'vue'

import { searchProfessionals } from '../api/calendar.api'
import type { Professional } from '../types/api'

const query = ref('')
const results = ref<Professional[]>([])
const searched = ref(false)

const search = async () => {
  results.value = (await searchProfessionals(query.value)).items
  searched.value = true
}
</script>

<template>
  <section>
    <h1 class="h3">Rechercher un restaurateur</h1>
    <form class="input-group mb-4" @submit.prevent="search">
      <input v-model="query" class="form-control" required
             placeholder="Nom commercial">
      <button class="btn btn-primary">Rechercher</button>
    </form>
    <div class="list-group">
      <RouterLink v-for="item in results" :key="item.id"
                  class="list-group-item list-group-item-action"
                  :to="`/professionals/${item.id}/slots`">
        <strong>{{ item.businessName }}</strong>
        <span class="text-muted ms-2">{{ item.timezone }}</span>
      </RouterLink>
    </div>
    <p v-if="searched && !results.length" class="alert alert-info">
      Aucun restaurateur trouvé.
    </p>
  </section>
</template>
