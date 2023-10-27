/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          background: '#0b152e',
          surface: '#182C61',
          primary: '#B33771',
          'primary-darken-1': '#6D214F',
          secondary: '#D6A2E8',
          'secondary-darken-1': '#82589F',
        },
      },
    },
  },
})
