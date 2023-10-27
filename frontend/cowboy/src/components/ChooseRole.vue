<template>
  <span>
    <div class="pref-title" :size="size">אני רוצה לשחק בתור</div>


    <v-chip attr-role="random" class="ma-2 role-chip" color="blue-grey-lighten-2" label :size="size" @click="chipClick">
      <v-icon start icon="mdi-dice-multiple"></v-icon>
      אקראי
    </v-chip>

    <v-chip attr-role="Defender" class="ma-2 role-chip" color="teal" label text-color="white" :size="size"
      @click="chipClick">
      <v-icon start icon="mdi-dog"></v-icon>
      כלבים
    </v-chip>

    <v-chip attr-role="Cowboy" class="ma-2 role-chip" color="amber-darken-2" label :size="size" @click="chipClick">
      <v-icon start icon="mdi-cow"></v-icon>
      פרות
    </v-chip>
  </span>
</template>

<script>
export default {
  props: {
    size: String
  },
  methods: {
    chipClick(e) {
      this.$emit('roleChosen', e.currentTarget.getAttribute('attr-role'));
    }
  },
}
</script>