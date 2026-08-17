<script setup lang="ts">
import { ref } from 'vue'

import {
  deleteAccount,
  previewDeletion,
  updateAccount,
  updatePassword,
} from '../api/account.api'
import AppAlert from '../components/AppAlert.vue'
import TimezoneSelect from '../components/TimezoneSelect.vue'
import { useAuthStore } from '../stores/auth.store'

const auth = useAuthStore()
const message = ref('')
const profile = ref({
  businessName: auth.user?.businessName ?? '',
  email: auth.user?.email ?? '',
  firstName: auth.user?.firstName ?? '',
  lastName: auth.user?.lastName ?? '',
  phone: auth.user?.phone ?? '',
  timezone: auth.user?.timezone ?? '',
})
const passwords = ref({ currentPassword: '', newPassword: '' })

const saveProfile = async () => {
  await updateAccount({
    ...profile.value,
    businessName: auth.user?.role === 'PROFESSIONAL'
      ? profile.value.businessName : undefined,
    expectedCalendarVersion: auth.user?.role === 'PROFESSIONAL'
      ? auth.user.calendarVersion ?? undefined : undefined,
  })
  await auth.load()
  message.value = 'Profil mis à jour.'
}

const savePassword = async () => {
  await updatePassword({
    currentPassword: passwords.value.currentPassword,
    newPassword: passwords.value.newPassword,
    newPasswordConfirmation: passwords.value.newPassword,
  })
  message.value = 'Mot de passe mis à jour.'
  passwords.value = { currentPassword: '', newPassword: '' }
}

const removeAccount = async () => {
  const password = prompt('Saisissez votre mot de passe pour continuer.')
  if (!password) return
  const preview = await previewDeletion(password)
  const question = `${preview.futureAppointmentCount} rendez-vous futur(s) `
    + 'seront annulés. Supprimer définitivement le compte ?'
  if (!confirm(question)) return
  await deleteAccount(password, preview.impactFingerprint)
  location.assign('/')
}
</script>

<template>
  <h1 class="h3">Paramètres du compte</h1>
  <AppAlert :message="message" type="success" />
  <div class="row g-4">
    <form class="col-lg-6 vstack gap-3" @submit.prevent="saveProfile">
      <h2 class="h5">Profil</h2>
      <input v-if="auth.user?.role === 'PROFESSIONAL'"
             v-model="profile.businessName" class="form-control" required>
      <input v-model="profile.firstName" class="form-control" required>
      <input v-model="profile.lastName" class="form-control" required>
      <input v-model="profile.email" class="form-control" type="email" required>
      <input v-model="profile.phone" class="form-control" required>
      <TimezoneSelect v-model="profile.timezone" />
      <button class="btn btn-primary">Enregistrer le profil</button>
    </form>
    <form class="col-lg-6 vstack gap-3" @submit.prevent="savePassword">
      <h2 class="h5">Mot de passe</h2>
      <input v-model="passwords.currentPassword" class="form-control"
             type="password" placeholder="Mot de passe actuel" required>
      <input v-model="passwords.newPassword" class="form-control"
             type="password" minlength="8" placeholder="Nouveau" required>
      <button class="btn btn-primary">Modifier le mot de passe</button>
    </form>
  </div>
  <hr class="my-5">
  <section>
    <h2 class="h5 text-danger">Zone dangereuse</h2>
    <button class="btn btn-danger" @click="removeAccount">
      Supprimer définitivement mon compte
    </button>
  </section>
</template>
