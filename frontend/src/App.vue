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
      <button class="tab" :class="{ active: activeView === 'reporting' }" @click="activeView = 'reporting'">
        <span class="glyphicon glyphicon-stats" aria-hidden="true" style="margin-right:6px;"></span>
        Reporting
      </button>
    </nav>

    <section>
      <ListDevices v-if="activeView === 'devices'" />
      <ListPorts v-else-if="activeView === 'ports'" />
      <Reporting v-else-if="activeView === 'reporting'" />
    </section>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import ListDevices from './views/ListDevices.vue';
  import ListPorts from './views/ListPorts.vue';
  import Reporting from './views/Reporting.vue';
  import './assets/App.css';

  const activeView = ref('devices');

  try {
    window.__SET_ACTIVE_VIEW__ = (view) => { 
      activeView.value = view === 'ports' ? 'ports' : view === 'reporting' ? 'reporting' : 'devices'; 
    };
  } catch (_) { /* noop */ }
</script>