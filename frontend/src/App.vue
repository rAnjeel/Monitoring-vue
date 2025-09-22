<template>
  <div class="app-shell">
    <nav class="top-menu">
      <button class="tab" :class="{ active: activeView === 'devices' }" @click="activeView = 'devices'">
        <span class="glyphicon glyphicon-hdd" aria-hidden="true" style="margin-right:6px;"></span>
        Devices
      </button>
      <button class="tab" :class="{ active: activeView === 'ports' }" @click="activeView = 'ports'">
        <span class="glyphicon glyphicon-transfer" aria-hidden="true" style="margin-right:6px;"></span>
        Ports
      </button>
    </nav>

    <section>
      <ListDevices v-if="activeView === 'devices'" />
      <ListPorts v-else />
    </section>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import ListDevices from './views/ListDevices.vue';
  import ListPorts from './views/ListPorts.vue';
  import './assets/App.css';

  const activeView = ref('devices');
</script>