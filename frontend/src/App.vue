<template>
  <CardNavbar/>
  <ListDevices/>
</template>

<script>
import ListDevices from './components/ListDevices.vue';
import CardNavbar from './components/utils/CardNavbar.vue';

export default {
  name: 'App',
  components: {
    ListDevices,
    CardNavbar
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
