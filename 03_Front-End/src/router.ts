import { createRouter, createWebHistory } from 'vue-router'

import AppointmentDetailView from './views/AppointmentDetailView.vue'
import CalendarView from './views/CalendarView.vue'
import DashboardView from './views/DashboardView.vue'
import ForgotPasswordView from './views/ForgotPasswordView.vue'
import HomeView from './views/HomeView.vue'
import ManualBookingView from './views/ManualBookingView.vue'
import NotFoundView from './views/NotFoundView.vue'
import NotificationsView from './views/NotificationsView.vue'
import ProfessionalSearchView from './views/ProfessionalSearchView.vue'
import PublicAppointmentView from './views/PublicAppointmentView.vue'
import RegisterView from './views/RegisterView.vue'
import SettingsView from './views/SettingsView.vue'
import SlotsView from './views/SlotsView.vue'
import UnavailabilityView from './views/UnavailabilityView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { component: HomeView, path: '/' },
    { component: RegisterView, path: '/register' },
    { component: ForgotPasswordView, path: '/forgot-password' },
    { component: PublicAppointmentView, path: '/public-appointment' },
    { component: DashboardView, meta: { auth: true }, path: '/dashboard' },
    {
      component: ProfessionalSearchView,
      meta: { auth: true, role: 'CLIENT' },
      path: '/professionals',
    },
    {
      component: SlotsView,
      meta: { auth: true, role: 'CLIENT' },
      path: '/professionals/:id/slots',
    },
    {
      component: AppointmentDetailView,
      meta: { auth: true },
      path: '/appointments/:id',
    },
    {
      component: CalendarView,
      meta: { auth: true, role: 'PROFESSIONAL' },
      path: '/calendar',
    },
    {
      component: UnavailabilityView,
      meta: { auth: true, role: 'PROFESSIONAL' },
      path: '/unavailabilities',
    },
    {
      component: ManualBookingView,
      meta: { auth: true, role: 'PROFESSIONAL' },
      path: '/manual-booking',
    },
    {
      component: NotificationsView,
      meta: { auth: true },
      path: '/notifications',
    },
    { component: SettingsView, meta: { auth: true }, path: '/settings' },
    { component: NotFoundView, path: '/:pathMatch(.*)*' },
  ],
})
