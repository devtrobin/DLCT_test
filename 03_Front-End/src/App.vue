<script setup lang="ts">
import AppNav from './components/AppNav.vue'
</script>

<template>
  <AppNav />
  <main class="container py-4">
    <RouterView />
  </main>
</template>
