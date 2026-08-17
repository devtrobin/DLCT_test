import { createI18n } from 'vue-i18n'

const messages = {
  fr: {
    app: {
      description: 'Réservez et gérez vos rendez-vous simplement.',
      title: 'Prise de rendez-vous Delicity',
    },
    notification: {
      APPOINTMENT_CANCELED: 'Rendez-vous annulé',
      APPOINTMENT_CREATED: 'Nouveau rendez-vous',
      CHANGE_ACCEPTED: 'Modification acceptée',
      CHANGE_PROPOSED: 'Nouveau créneau proposé',
      MANUAL_APPOINTMENT_CREATED: 'Rendez-vous créé',
    },
  },
}

export const i18n = createI18n({
  fallbackLocale: 'fr',
  legacy: false,
  locale: 'fr',
  messages,
})
