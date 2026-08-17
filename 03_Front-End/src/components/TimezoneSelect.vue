<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{
  'update:modelValue': [timezone: string]
}>()

const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const supportedTimezones = Intl.supportedValuesOf('timeZone')
const timezones = computed(() => Array.from(new Set([
  props.modelValue,
  browserTimezone,
  ...supportedTimezones,
])).filter(Boolean).sort())

const update = (event: Event) => {
  const select = event.target as HTMLSelectElement
  emit('update:modelValue', select.value)
}
</script>

<template>
  <select class="form-select" :value="modelValue" required @change="update">
    <option v-for="timezone in timezones" :key="timezone" :value="timezone">
      {{ timezone }}
    </option>
  </select>
</template>
