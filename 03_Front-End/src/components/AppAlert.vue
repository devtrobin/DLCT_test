<script setup lang="ts">
defineProps<{ message: string; type?: 'danger' | 'success' | 'warning' }>()
</script>

<template>
  <div
    v-if="message"
    class="alert"
    :class="`alert-${type ?? 'danger'}`"
    role="alert"
  >
    {{ message }}
  </div>
</template>
