<template>
  <div class="app-shell">
    <nav class="top-menu">
      <button class="tab" :class="{ active: activeView === 'dashboard' }" @click="activeView = 'dashboard'">
        <span class="glyphicon glyphicon-dashboard" aria-hidden="true" style="margin-right:6px;"></span>
        Dashboard
      </button>
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
      <div style="display:flex;align-items:center;margin-left:auto;gap:6px;">
        <button class="tab" @click="openSupervisionModal">
          <span class="glyphicon glyphicon-tasks" aria-hidden="true" style="margin-right:4px;"></span>
          Supervision
        </button>
        <span v-if="supervisionStatusLabel" style="color:#e2e8f0;font-size:12px;margin-left:4px;">
          Supervision: <span v-html="supervisionBadgeHtml"></span>
        </span>
        <button class="tab" @click="openSettings">
          <span class="glyphicon glyphicon-cog" aria-hidden="true" style="margin-right:6px;"></span>
          Settings
        </button>
      </div>
    </nav>

    <section>
      <Dashboard v-if="activeView === 'dashboard'" />
      <ListDevices v-else-if="activeView === 'devices'" />
      <ListPorts v-else-if="activeView === 'ports'" />
      <Reporting v-else-if="activeView === 'reporting'" />
      <ReportingDevice v-else-if="activeView === 'reporting-device'" />
    </section>

    <ModalComponent
      :model-value="isSettingsOpen"
      title="Monitoring Settings"
      :width="'400px'"
      :maxHeight="'70vh'"
      @update:modelValue="(v) => isSettingsOpen = v"
    >
      <div v-if="settingsLoading">Loading...</div>
      <div v-else>
        <div v-if="settingsError" style="color:#b91c1c; margin-bottom:8px;">{{ settingsError }}</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div v-for="s in settings" :key="s.id" class="form-group" style="display:flex;align-items:flex-start;gap:12px;">
            <label class="control-label" style="min-width:240px;">
              <span class="mono">{{ s.key }}</span>
              <div v-if="s.description" style="color:#64748b;font-size:12px;margin-top:2px;">{{ s.description }}</div>
            </label>
            <div style="flex:1;max-width:320px;">
              <input
                v-if="s.type === 'number'"
                type="number"
                class="form-control input-sm"
                v-model="editedValues[s.id]"
                :placeholder="s.value ?? ''"
              />
              <input
                v-else
                type="text"
                class="form-control input-sm"
                v-model="editedValues[s.id]"
                :placeholder="s.value ?? ''"
              />
            </div>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
          <button class="btn btn-default btn-sm" @click="closeSettings">Cancel</button>
          <button class="btn btn-primary btn-sm" :disabled="saving" @click="saveSettings">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </ModalComponent>

    <ModalComponent
      v-model="isSupervisionOpen"
      title="Supervision Control"
      :width="'420px'"
      :maxHeight="'60vh'"
    >
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div class="form-group" style="display:flex;flex-direction:column;gap:4px;min-width:160px;">
            <label class="control-label" style="font-size:12px;color:#64748b;">Ping agent instances</label>
            <input type="number" min="1" v-model.number="pingInstancesInput" class="form-control input-sm" />
          </div>
          <div class="form-group" style="display:flex;flex-direction:column;gap:4px;min-width:160px;">
            <label class="control-label" style="font-size:12px;color:#64748b;">Traffic agent instances</label>
            <input type="number" min="1" v-model.number="trafficInstancesInput" class="form-control input-sm" />
          </div>
        </div>

        <div v-if="supervisionState && Array.isArray(supervisionState.processes) && supervisionState.processes.length" style="margin-top:6px;">
          <table class="table table-condensed" style="margin-bottom:8px;">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Status</th>
                <th>Instances</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in supervisionState.processes" :key="p.name">
                <td>{{ p.name }}</td>
                <td>{{ p.status }}</td>
                <td>{{ p.instances }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
          <button class="btn btn-default btn-sm" @click="onRefreshSupervisionStatus" :disabled="supervisionLoading">Refresh</button>
          <button class="btn btn-success btn-sm" @click="onStartSupervision" :disabled="supervisionLoading">
            <span class="glyphicon glyphicon-play"></span>
            Start
          </button>
          <button class="btn btn-danger btn-sm" @click="onStopSupervision" :disabled="supervisionLoading">
            <span class="glyphicon glyphicon-stop"></span>
            Stop
          </button>
        </div>
      </div>
    </ModalComponent>
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue';
  import ListDevices from './views/ListDevices.vue';
  import ListPorts from './views/ListPorts.vue';
  import Reporting from './views/ReportingGlobal.vue';
  import ReportingDevice from './views/ReportingDevice.vue';
  import Dashboard from './views/Dashboard.vue';
  import './assets/App.css';
  import ModalComponent from './components/ModalComponent.vue';
  import { listSettings, updateSetting } from './services/settings/monitoringSettings.js';
  import { getSupervisionStatus, startSupervision, stopSupervision } from './services/supervision/supervision.js';
  import { badgeContainer } from './services/utils/utils';

  const activeView = ref('dashboard');
  const isSettingsOpen = ref(false)
  const settings = ref([])
  const editedValues = ref({})
  const settingsLoading = ref(false)
  const settingsError = ref('')
  const saving = ref(false)

  const supervisionLoading = ref(false)
  const supervisionState = ref(null)
  const isSupervisionOpen = ref(false)
  const pingInstancesInput = ref(1)
  const trafficInstancesInput = ref(1)

  const supervisionStatusLabel = computed(() => {
    const state = supervisionState.value
    if (!state || !Array.isArray(state.processes)) return ''
    const procs = state.processes
    if (!procs.length) return 'stopped'
    const allOnline = procs.every(p => p.status === 'online')
    const someOnline = procs.some(p => p.status === 'online')
    if (allOnline) return 'running'
    if (someOnline) return 'partial'
    return procs[0].status || 'unknown'
  })

  const supervisionBadgeHtml = computed(() => {
    const value = supervisionStatusLabel.value;
    if (!value) return '';
    return badgeContainer(value).outerHTML;
  });

  try {
    window.__SET_ACTIVE_VIEW__ = (view) => { 
      if (view === 'dashboard') activeView.value = 'dashboard';
      else if (view === 'ports') activeView.value = 'ports';
      else if (view === 'reporting') activeView.value = 'reporting';
      else if (view === 'reporting-device') activeView.value = 'reporting-device';
      else activeView.value = 'devices';
    };
  } catch (_) { /* noop */ }

  async function openSettings() {
    isSettingsOpen.value = true
    await loadSettings()
  }

  async function refreshSupervisionStatus() {
    try {
      const data = await getSupervisionStatus()
      supervisionState.value = data
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Supervision] Failed to get status', e?.message || e)
    }
  }

  async function onStartSupervision() {
    try {
      supervisionLoading.value = true
      const data = await startSupervision({
        pingInstances: pingInstancesInput.value,
        trafficInstances: trafficInstancesInput.value,
      })
      supervisionState.value = data
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Supervision] Failed to start', e?.message || e)
    } finally {
      supervisionLoading.value = false
    }
  }

  async function onRefreshSupervisionStatus() {
    await refreshSupervisionStatus()
  }

  async function openSupervisionModal() {
    isSupervisionOpen.value = true
    await refreshSupervisionStatus()
    const state = supervisionState.value
    if (state && Array.isArray(state.processes) && state.processes.length) {
      const ping = state.processes.find(p => p.key === 'ping' || p.name === 'ping-agent')
      const traffic = state.processes.find(p => p.key === 'traffic' || p.name === 'traffic-agent')
      if (ping && typeof ping.instances === 'number') pingInstancesInput.value = ping.instances || 1
      if (traffic && typeof traffic.instances === 'number') trafficInstancesInput.value = traffic.instances || 1
    }
  }

  async function onStopSupervision() {
    try {
      supervisionLoading.value = true
      const data = await stopSupervision()
      supervisionState.value = data
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Supervision] Failed to stop', e?.message || e)
    } finally {
      supervisionLoading.value = false
    }
  }

  function closeSettings() {
    isSettingsOpen.value = false
  }

  async function loadSettings() {
    settingsLoading.value = true
    settingsError.value = ''
    editedValues.value = {}
    try {
      const rows = await listSettings()
      settings.value = rows
      for (const r of rows) editedValues.value[r.id] = r.value ?? ''
    } catch (e) {
      settingsError.value = e?.message || 'Failed to load settings'
    } finally {
      settingsLoading.value = false
    }
  }

  async function saveSettings() {
    try {
      saving.value = true
      const updates = []
      for (const r of settings.value) {
        const newVal = editedValues.value[r.id]
        if (newVal !== r.value) {
          updates.push(updateSetting(r.id, { value: newVal }))
        }
      }
      await Promise.all(updates)
      await loadSettings()
      isSettingsOpen.value = false
    } catch (e) {
      settingsError.value = e?.message || 'Failed to save settings'
    } finally {
      saving.value = false
    }
  }
</script>