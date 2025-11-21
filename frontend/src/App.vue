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
      <button class="tab" style="margin-left:auto" @click="openSettings">
        <span class="glyphicon glyphicon-cog" aria-hidden="true" style="margin-right:6px;"></span>
        Settings
      </button>
    </nav>

    <section>
      <ListDevices v-if="activeView === 'devices'" />
      <ListPorts v-else-if="activeView === 'ports'" />
      <Reporting v-else-if="activeView === 'reporting'" />
      <ReportingDevice v-else-if="activeView === 'reporting-device'" />
    </section>

    <ModalComponent
      :model-value="isSettingsOpen"
      title="Monitoring Settings"
      :width="'400px'"
      :maxHeight="'50vh'"
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
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import ListDevices from './views/ListDevices.vue';
  import ListPorts from './views/ListPorts.vue';
  import Reporting from './views/ReportingGlobal.vue';
  import ReportingDevice from './views/ReportingDevice.vue';
  import './assets/App.css';
  import ModalComponent from './components/ModalComponent.vue';
  import { listSettings, updateSetting } from './services/settings/monitoringSettings.js';

  const activeView = ref('devices');
  const isSettingsOpen = ref(false)
  const settings = ref([])
  const editedValues = ref({})
  const settingsLoading = ref(false)
  const settingsError = ref('')
  const saving = ref(false)

  try {
    window.__SET_ACTIVE_VIEW__ = (view) => { 
      if (view === 'ports') activeView.value = 'ports';
      else if (view === 'reporting') activeView.value = 'reporting';
      else if (view === 'reporting-device') activeView.value = 'reporting-device';
      else activeView.value = 'devices';
    };
  } catch (_) { /* noop */ }

  async function openSettings() {
    isSettingsOpen.value = true
    await loadSettings()
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