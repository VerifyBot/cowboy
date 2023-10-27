/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from './App.vue'


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAOY-Z3CBfxE7mNT7KkRW4vwaQNa1me0FU",
  authDomain: "play-cowboy.firebaseapp.com",
  projectId: "play-cowboy",
  storageBucket: "play-cowboy.appspot.com",
  messagingSenderId: "1031689680052",
  appId: "1:1031689680052:web:59aa9a4f90dcd1451f53e1",
  measurementId: "G-G5HB8SR1VY"
};

// Initialize Firebase
const fbApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(fbApp);



// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

const app = createApp(App)

app.config.productionTip = false;

// set as you would set Vue.prototype.$analytics = analytics
app.config.globalProperties.$analytics = analytics;
app.config.globalProperties.$logEvent = logEvent;

registerPlugins(app)

app.mount('#app')
