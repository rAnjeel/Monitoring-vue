<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <div>
        <h1 class="page-title">Supervision Overview</h1>
        <p class="page-subtitle">Real-time network infrastructure monitoring</p>
      </div>
      <div class="clock-widget">
        <div class="clock-time">{{ currentTime }}</div>
        <div class="clock-date">{{ currentDate }}</div>
      </div>
    </div>

    <div class="dashboard-grid-top">
      <div class="kpi-column">
        <div class="cards-row" v-if="summaryCards.length">
          <div v-for="card in summaryCards" :key="card.key" class="summary-card" :class="card.key">
            <div class="card-icon">
              <svg v-if="card.key === 'devices'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 01-2 2v4a2 2 0 012 2h14a2 2 0 012-2v-4a2 2 0 01-2-2m-2-4h.01M17 16h.01" /></svg>
              <svg v-if="card.key === 'ports'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <svg v-if="card.key === 'types'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            </div>
            <div class="card-content">
              <div class="summary-value">{{ card.value }}</div>
              <div class="summary-label">{{ card.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="system-column">
        <div class="modern-card">
          <div class="card-header">
            <h4 class="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
              System Information
            </h4>
            <button class="btn btn-primary" @click="loadSettingsForDashboard"><i class="glyphicon glyphicon-refresh"></i></button>
          </div>
          <div class="card-body scrollable-list">
            <ul class="status-list" v-if="systemInfoRows.length">
              <li v-for="row in systemInfoRows" :key="row.id" class="status-item">
                <div class="status-info">
                  <span class="param-name">{{ row.parameter }}</span>
                  <span class="param-detail">{{ row.details }}</span>
                </div>
                <div class="status-badge">{{ row.value }}</div>
              </li>
            </ul>
            <div v-else class="empty-placeholder">No system information yet</div>
          </div>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import reportingService from '@/services/reporting/reporting.js'
import { listSettings } from '@/services/settings/monitoringSettings.js'
import { getSupervisionStatus } from '@/services/supervision/supervision.js'

const now = ref(new Date())
const clockTimer = ref(null)

// --- Clock Computed ---
const currentTime = computed(() => {
  try {
    return now.value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (_) { return '' }
})

const currentDate = computed(() => {
  try {
    // Forcer l'affichage en anglais
    return now.value.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  } catch (_) { return '' }
})

// --- Data Refs ---
const inventorySummary = ref(null)
const settingsRows = ref([])
const agentsRows = ref([])

// --- Summary Cards ---
const summaryCards = computed(() => {
  const s = inventorySummary.value
  if (!s) return []
  const totalDevices = Number(s.total_devices || 0)
  const totalPorts = Number(s.total_monitored_ports || 0)
  const totalTypes = Number(s.total_device_types || 0)

  return [
    { key: 'devices', label: 'Total Devices', value: totalDevices },
    { key: 'ports', label: 'Monitored Ports', value: totalPorts },
    { key: 'types', label: 'Equipment Types', value: totalTypes },
  ]
})

// --- System Info ---
const systemInfoRows = computed(() => {
  return [...settingsRows.value, ...agentsRows.value]
})

// --- Loaders ---
async function loadInventorySummary() {
  try {
    const data = await reportingService.getInventorySummary()
    const rows = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : [])
    inventorySummary.value = rows[0] || null
  } catch (e) {
    console.error('[Dashboard] Failed summary', e)
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
    settingsRows.value = []
  }
}

async function loadSupervisionInfo() {
  try {
    const data = await getSupervisionStatus()
    const processes = Array.isArray(data?.processes) ? data.processes : []
    agentsRows.value = processes.map((p, idx) => ({
      id: `agent-${idx}-${p.name}`,
      parameter: p.name.toUpperCase(),
      value: p.status,
      details: `Instances: ${p.instances || 0}`
    }))
  } catch (e) {
    agentsRows.value = []
  }
}

onMounted(async () => {
  clockTimer.value = setInterval(() => { now.value = new Date() }, 1000)
  await Promise.all([
    loadInventorySummary(),
    loadSettingsForDashboard(),
    loadSupervisionInfo(),
  ])
})

onBeforeUnmount(() => {
  if (clockTimer.value) clearInterval(clockTimer.value)
})
</script>

<style scoped>
:root {
  --bg-dark: #0f172a;
  --card-bg: #1e293b;
  --card-bg-hover: #334155;
  --primary: #3b82f6;
  --text-main: #f1f5f9;
  --text-muted: #94a3b8;
  --border-color: #334155;
}

.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background-color: var(--bg-dark, #0f172a);
  min-height: 100vh;
  color: var(--text-main, #f1f5f9);
  font-family: 'Inter', sans-serif;
}

/* Header & Top Grid Styles (identiques à avant) */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(90deg, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-subtitle { margin: 4px 0 0; color: var(--text-muted); font-size: 14px; }
.clock-widget { text-align: right; }
.clock-time { font-size: 28px; font-weight: 700; color: var(--primary); line-height: 1; }
.clock-date { font-size: 13px; color: var(--text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }

.dashboard-grid-top {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}
@media (max-width: 1024px) { .dashboard-grid-top { grid-template-columns: 1fr; } }

.cards-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  height: 100%;
}

.summary-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.05);
}
.summary-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); background: var(--card-bg-hover); }

.summary-card.devices::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #3b82f6; }
.summary-card.ports::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #10b981; }
.summary-card.types::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #8b5cf6; }

.card-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); }
.devices .card-icon { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.ports .card-icon { color: #10b981; background: rgba(16, 185, 129, 0.1); }
.types .card-icon { color: #8b5cf6; background: rgba(139, 92, 246, 0.1); }
.card-icon svg { width: 28px; height: 28px; }
.card-content { display: flex; flex-direction: column; }
.summary-value { font-size: 24px; font-weight: 800; color: #fff; }
.summary-label { font-size: 12px; font-weight: 500; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }

.modern-card {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.card-header { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); }
.card-title { margin: 0; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; color: #fff; }
.icon-sm { width: 18px; height: 18px; color: var(--text-muted); }
.card-body { flex: 1; position: relative; }

.scrollable-list { max-height: 250px; overflow-y: auto; }
.status-list { list-style: none; padding: 0; margin: 0; }
.status-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.status-item:hover { background: rgba(255,255,255,0.02); }
.status-info { display: flex; flex-direction: column; gap: 2px; }
.param-name { font-size: 13px; font-weight: 600; color: #f1f5f9; }
.param-detail { font-size: 11px; color: var(--text-muted); }
.status-badge { font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 20px; background: rgba(255,255,255,0.1); color: #fff; }
.empty-placeholder { padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px; }
</style>