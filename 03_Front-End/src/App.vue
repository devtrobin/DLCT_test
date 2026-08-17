<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <main class="container py-5">
    <section class="card shadow-sm" aria-labelledby="app-title">
      <div class="card-body p-4">
        <h1 id="app-title" class="card-title h3">
          {{ t('app.title') }}
        </h1>
        <p class="card-text mb-0">
          {{ t('app.description') }}
        </p>
      </div>
    </section>
  </main>
</template>
