<template>
  <ListDevices/>
  <ListPorts/>
</template>

<script setup>
  import ListDevices from './views/ListDevices.vue';
  import ListPorts from './views/ListPorts.vue';
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>