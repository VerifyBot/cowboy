<template>
  <v-app>
    <!-- <default-bar /> -->
    <v-container class="fill-height">
      <v-responsive class="text-center fill-height" style="direction: rtl">
        <default-view />
    </v-responsive>
  </v-container>
  </v-app>
</template>

<script setup>
  // import DefaultBar from './AppBar.vue'
  import DefaultView from './View.vue'
</script>

<style>
  *::selection {
    background-color: rgba(253, 253, 253, .2);
  }

  .fill-height {
    padding: 0 !important;
  }
</style>