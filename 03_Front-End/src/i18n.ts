import { createI18n } from 'vue-i18n'

const messages = {
  fr: {
    app: {
      description: 'Le socle technique est prêt.',
      title: 'Prise de rendez-vous Delicity',
    },
  },
}

export const i18n = createI18n({
  fallbackLocale: 'fr',
  legacy: false,
  locale: 'fr',
  messages,
})
