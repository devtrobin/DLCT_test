import { defineStore } from 'pinia'
import { ref } from 'vue'

import * as authApi from '../api/auth.api'
import type { Registration } from '../api/auth.api'
import type { Session, User } from '../types/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loaded = ref(false)

  const applySession = (session: Session) => {
    user.value = session.authenticated && session.user
      ? session.user : null
    loaded.value = true
  }

  const load = async () => applySession(await authApi.getSession())

  const login = async (
    input: Parameters<typeof authApi.login>[0],
  ) => applySession(await authApi.login(input))

  const register = async (input: Registration) =>
    applySession(await authApi.register(input))

  const logout = async () => {
    await authApi.logout()
    user.value = null
  }

  return { load, loaded, login, logout, register, user }
})
