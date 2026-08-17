<script setup lang="ts">
import { onMounted, ref } from 'vue'

import {
  listNotifications,
  markAllRead,
  markRead,
} from '../api/notification.api'
import type { Notification } from '../types/api'

const notifications = ref<Notification[]>([])

const load = async () => {
  notifications.value = (await listNotifications()).items
}

const read = async (notification: Notification) => {
  await markRead(notification.id)
  await load()
}

const readAll = async () => {
  await markAllRead()
  await load()
}

onMounted(load)
</script>

<template>
  <header class="d-flex justify-content-between mb-3">
    <h1 class="h3">Notifications</h1>
    <button class="btn btn-outline-primary" @click="readAll">
      Tout marquer comme lu
    </button>
  </header>
  <div class="list-group">
    <button v-for="item in notifications" :key="item.id"
            class="list-group-item list-group-item-action"
            :class="{ active: !item.readAt }" @click="read(item)">
      <strong>{{ item.type }}</strong>
      <small class="d-block">{{ item.createdAt }}</small>
    </button>
  </div>
  <p v-if="!notifications.length" class="alert alert-info">
    Aucune notification.
  </p>
</template>
