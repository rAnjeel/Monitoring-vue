<template>
  <div class="dashboard-page">
    <div class="dashboard-top">
      <div class="dashboard-main">
        <div class="cards-row" v-if="summaryCards.length">
          <div
            v-for="card in summaryCards"
            :key="card.key"
            class="summary-card"
          >
            <div class="summary-label">{{ card.label }}</div>
            <div class="summary-value">{{ card.value }}</div>
            <div v-if="card.subLabel" class="summary-sub">{{ card.subLabel }}</div>
          </div>
        </div>

        <div class="system-card">
          <div class="system-card-header">
            <h4 class="system-title">System information</h4>
          </div>
          <div class="system-card-body">
            <table class="table table-condensed" v-if="systemInfoRows.length">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in systemInfoRows" :key="row.id">
                  <td>{{ row.parameter }}</td>
                  <td>{{ row.value }}</td>
                  <td>{{ row.details }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-placeholder">No system information yet</div>
          </div>
        </div>
      </div>

      <div class="dashboard-clock">
        <div class="clock-card">
          <div class="clock-time">{{ currentTime }}</div>
          <div class="clock-date">{{ currentDate }}</div>
        </div>
      </div>
    </div>

    <div class="dashboard-bottom">
      <div class="panel">
        <div class="panel-header">
          <h4 class="panel-title">Top 10 unstable devices</h4>
          <div class="panel-filters">
            <label class="control-label" style="margin-right:6px;">Equipment type</label>
            <select
              v-model="selectedTypeDevice"
              @change="onTypeDeviceChanged"
              class="form-control input-sm"
              style="min-width:160px;"
            >
              <option :value="null">All</option>
              <option
                v-for="t in deviceTypes"
                :key="t.id"
                :value="t.id"
              >
                {{ t.name || t.label || ('Type ' + t.id) }}
              </option>
            </select>
          </div>
        </div>
        <div class="panel-body">
          <AgGridModule
            grid-id="dashboard-top10-grid"
            :column-defs="top10Columns"
            :row-data="top10Rows"
            row-selection="single"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GlobalDashboardView',
}
</script>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import AgGridModule from '@/components/AgGridModule.vue'
import reportingService from '@/services/reporting/reporting.js'
import { listSettings } from '@/services/settings/monitoringSettings.js'
import { getSupervisionStatus } from '@/services/supervision/supervision.js'

const now = ref(new Date())
const clockTimer = ref(null)

const currentTime = computed(() => {
  try {
    return now.value.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch (_) {
    return ''
  }
})

const currentDate = computed(() => {
  try {
    return now.value.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch (_) {
    return ''
  }
})

const todaySummary = ref(null)
const deviceTypes = ref([])
const selectedTypeDevice = ref(null)
const top10Rows = ref([])

const settingsRows = ref([])
const agentsRows = ref([])

const top10Columns = [
  { headerName: 'Hostname', field: 'hostname', minWidth: 160 },
  { headerName: 'Total events', field: 'total_events', minWidth: 110 },
  { headerName: 'Down events', field: 'nb_down', minWidth: 110 },
  { headerName: 'Flapping Index (%)', field: 'taux_panne', minWidth: 150 },
]

const summaryCards = computed(() => {
  const s = todaySummary.value
  if (!s) return []
  const total = Number(s.total_events || 0)
  const down = Number(s.nb_down || 0)
  const up = Math.max(total - down, 0)
  const downRate = total > 0 ? Math.round((down / total) * 10000) / 100 : 0

  return [
    { key: 'total', label: 'Total events today', value: total },
    { key: 'down', label: 'Down events', value: down },
    { key: 'up', label: 'Up events', value: up },
    { key: 'downRate', label: 'Down rate (%)', value: downRate.toFixed(2) },
  ]
})

const systemInfoRows = computed(() => {
  return [
    ...settingsRows.value,
    ...agentsRows.value,
  ]
})

async function loadTodaySummary() {
  try {
    const typeId = selectedTypeDevice.value || null
    const data = await reportingService.getTodaySummary(typeId)
    const rows = Array.isArray(data?.rows)
      ? data.rows
      : Array.isArray(data)
        ? data
        : []
    todaySummary.value = rows[0] || null
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Dashboard] Failed to load today summary', e?.message || e)
    todaySummary.value = null
  }
}

async function loadTop10() {
  try {
    const typeId = selectedTypeDevice.value || null
    const data = await reportingService.getTop10UnstableDevices(typeId)
    const rows = Array.isArray(data?.rows)
      ? data.rows
      : Array.isArray(data)
        ? data
        : []
    top10Rows.value = rows
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Dashboard] Failed to load top 10 unstable devices', e?.message || e)
    top10Rows.value = []
  }
}

async function loadDeviceTypes() {
  try {
    const data = await reportingService.getDeviceTypes()
    const list = Array.isArray(data?.rows)
      ? data.rows
      : Array.isArray(data)
        ? data
        : []
    deviceTypes.value = list

    if (!selectedTypeDevice.value && Array.isArray(list) && list.length) {
      const routerType = list.find(t => /router/i.test(t.name || t.label || ''))
      if (routerType && routerType.id != null) {
        selectedTypeDevice.value = routerType.id
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Dashboard] Failed to load device types', e?.message || e)
    deviceTypes.value = []
  }
}

async function loadSettingsForDashboard() {
  try {
    const rows = await listSettings()
    settingsRows.value = (rows || []).map((r) => ({
      id: `setting-${r.id}`,
      parameter: r.key,
      value: r.value,
      details: r.description || '',
    }))
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Dashboard] Failed to load monitoring settings', e?.message || e)
    settingsRows.value = []
  }
}

async function loadSupervisionInfo() {
  try {
    const data = await getSupervisionStatus()
    const processes = Array.isArray(data?.processes)
      ? data.processes
      : []

    agentsRows.value = processes.map((p, idx) => ({
      id: `agent-${idx}-${p.name}`,
      parameter: `Agent: ${p.name}`,
      value: p.status,
      details: `${p.instances || 0} instance(s)`
    }))
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Dashboard] Failed to load supervision info', e?.message || e)
    agentsRows.value = []
  }
}

function onTypeDeviceChanged() {
  loadTop10()
  loadTodaySummary()
}

onMounted(async () => {
  clockTimer.value = setInterval(() => {
    now.value = new Date()
  }, 1000)

  await Promise.all([
    loadDeviceTypes(),
    loadTodaySummary(),
    loadTop10(),
    loadSettingsForDashboard(),
    loadSupervisionInfo(),
  ])
})

onBeforeUnmount(() => {
  if (clockTimer.value) {
    clearInterval(clockTimer.value)
    clockTimer.value = null
  }
})

watch(selectedTypeDevice, () => {
  // Quand le type change via code (ex: détection auto Router), on recharge
  loadTop10()
  loadTodaySummary()
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
}

.dashboard-top {
  display: flex;
  gap: 16px;
}

.dashboard-main {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-clock {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
}

.clock-card {
  flex: 1;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.4);
}

.clock-time {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 2px;
}

.clock-date {
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.8;
}

.cards-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-card {
  flex: 1 1 150px;
  min-width: 150px;
  background: #0b1120;
  color: #e2e8f0;
  border-radius: 6px;
  padding: 10px 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.5);
}

.summary-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
}

.summary-value {
  margin-top: 4px;
  font-size: 20px;
  font-weight: 600;
}

.summary-sub {
  margin-top: 2px;
  font-size: 11px;
  opacity: 0.7;
}

.system-card {
  background: #0b1120;
  color: #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.5);
}

.system-card-header {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}

.system-title {
  margin: 0;
  font-size: 14px;
}

.system-card-body {
  padding: 8px 12px;
}

.empty-placeholder {
  font-size: 12px;
  opacity: 0.7;
}

.dashboard-bottom {
  display: flex;
  flex-direction: column;
}

.panel {
  background: #0b1120;
  color: #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.5);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}

.panel-title {
  margin: 0;
  font-size: 14px;
}

.panel-filters {
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-body {
  padding: 8px 12px 12px;
}
</style>
