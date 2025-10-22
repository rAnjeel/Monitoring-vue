<template>
  <div class="list-reporting-page">
    <div class="sub-navbar">
      <div class="nav nav-tabs">
        <h5 class="text-uppercase" style="color:#ecf0f1; gap:12px;">
          <span class="glyphicon glyphicon-triangle-right" aria-hidden="true" style="margin-right: 6px;"></span>
          <span>Reporting</span>
        </h5>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- Device Stability Section -->
      <div class="reporting-section">
        <div class="filter-section">
          <div class="row" style="align-items:center;">
            <div class="col-md-3">
              <label class="form-label">Device type</label>
              <select v-model="selectedDeviceType" class="form-control input-sm">
                <option value="">All</option>
                <option v-for="t in deviceTypes" :key="t.id" :value="t.id">
                  {{ t.name }}
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Start date</label>
              <input type="datetime-local" v-model="startDate" class="form-control input-sm" />
            </div>
            <div class="col-md-3">
              <label class="form-label">End date</label>
              <input type="datetime-local" v-model="endDate" class="form-control input-sm" />
            </div>
            <div class="col-md-3" style="display:flex;gap:8px;align-items:end;">
              <button @click="loadDeviceStability" class="btn btn-primary btn-sm" :disabled="loading">
                <span class="glyphicon glyphicon-refresh" :class="{ 'spinning': loading }"></span>
                Load Stability
              </button>
              <button @click="exportStabilityCsv" class="btn btn-success btn-sm" :disabled="(deviceStabilityData || []).length === 0">
                <span class="glyphicon glyphicon-download"></span>
                Export CSV
              </button>
              <button @click="exportStabilityExcel" class="btn btn-warning btn-sm" :disabled="(deviceStabilityData || []).length === 0">
                <span class="glyphicon glyphicon-file"></span>
                Export Excel
              </button>
            </div>
          </div>
        </div>

        <div class="sub-navbar">
          <div class="nav nav-tabs">
            <h5 class="text-uppercase" style="color:#ecf0f1; gap:12px;">
              <span class="glyphicon glyphicon-triangle-right" aria-hidden="true" style="margin-right: 6px;"></span>
              <span>Devices stability status</span>
              <span class="label label-primary" title="Total">{{ deviceStabilityData.length }}</span>
            </h5>
          </div>
        </div>

        <div class="app-container">
          <AgGridModule
            grid-id="reporting-stability-grid"
            :column-defs="stabilityColumns"
            :row-data="deviceStabilityData"
          />
        </div>
      </div>

      <!-- Latency Section -->
      <div class="reporting-section">
        <div class="filter-section">
          <div class="row" style="align-items:center;">
            <div class="col-md-2">
              <label class="form-label">Device type</label>
              <select v-model="latencyDeviceType" class="form-control input-sm">
                <option value="">All</option>
                <option v-for="t in deviceTypes" :key="t.id" :value="t.id">
                  {{ t.name }}
                </option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label">Status</label>
              <select v-model="latencyStatus" class="form-control input-sm">
                <option value="">All</option>
                <option value="up">Up</option>
                <option value="down">Down</option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label">Start date</label>
              <input type="datetime-local" v-model="latencyStartDate" class="form-control input-sm" />
            </div>
            <div class="col-md-2">
              <label class="form-label">End date</label>
              <input type="datetime-local" v-model="latencyEndDate" class="form-control input-sm" />
            </div>
            <div class="col-md-2" style="display:flex;gap:8px;align-items:end;">
              <button @click="loadLatency" class="btn btn-info btn-sm" :disabled="loadingLatency">
                <span class="glyphicon glyphicon-signal" :class="{ 'spinning': loadingLatency }"></span>
                Load Latency
              </button>
              <button @click="exportLatencyCsv" class="btn btn-success btn-sm" :disabled="(latencyData || []).length === 0">
                <span class="glyphicon glyphicon-download"></span>
                Export CSV
              </button>
              <button @click="exportLatencyExcel" class="btn btn-warning btn-sm" :disabled="(latencyData || []).length === 0">
                <span class="glyphicon glyphicon-file"></span>
                Export Excel
              </button>
            </div>
          </div>
        </div>

        <div class="sub-navbar">
          <div class="nav nav-tabs">
            <h5 class="text-uppercase" style="color:#ecf0f1; gap:12px;">
              <span class="glyphicon glyphicon-triangle-right" aria-hidden="true" style="margin-right: 6px;"></span>
              <span>Average latency by day and device</span>
              <span class="label label-primary" title="Total">{{ latencyData.length }}</span>
            </h5>
          </div>
        </div>

        <div class="app-container">
          <AgGridModule
            grid-id="reporting-latency-grid"
            :column-defs="latencyColumns"
            :row-data="latencyData"
          />
        </div>
      </div>

      <div v-if="error" class="alert alert-danger" style="margin-top: 10px;">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'ReportingView' };
</script>

<script setup>
  import '@/assets/App.css';
  import '@/assets/AgGrid.css';
  import '@/assets/Reporting.css';
  import { ref, onMounted } from 'vue';
  import { getTypeDevices } from '@/services/type devices/typeDevices';   
  import AgGridModule from '@/components/AgGridModule.vue';
  import reportingService from '@/services/reporting/reporting.js';
  import { exportJsonToCsv } from '@/services/csv/exportCSV';
  import { exportJsonToExcel } from '@/services/excel/exportExcel';

  const deviceTypes = ref([]);
  
  // Stability section variables
  const selectedDeviceType = ref('');
  const startDate = ref('');
  const endDate = ref('');
  const loading = ref(false);
  const deviceStabilityData = ref([]);

  // Latency section variables
  const latencyDeviceType = ref('');
  const latencyDeviceId = ref(null);
  const latencyStatus = ref('');
  const latencyStartDate = ref('');
  const latencyEndDate = ref('');
  const loadingLatency = ref(false);
  const latencyData = ref([]);

  const error = ref(null);

  const stabilityColumns = ref([
    { headerName: 'HOSTNAME', field: 'hostname', filter: 'agTextColumnFilter' },
    { headerName: 'SYSNAME', field: 'sysName', filter: 'agTextColumnFilter' },
    { headerName: 'TYPE ID', field: 'type_device_id', filter: 'agNumberColumnFilter' },
    { headerName: 'TOTAL EVENTS', field: 'total_events', filter: 'agNumberColumnFilter' },
    { headerName: 'NB DOWN', field: 'nb_down', filter: 'agNumberColumnFilter' },
    { headerName: 'FAILURE RATE (%)', field: 'taux_panne', filter: 'agNumberColumnFilter' },
    { headerName: 'STATUS', field: 'etat_stabilite', filter: 'agTextColumnFilter' },
  ]);

  const latencyColumns = ref([
    { headerName: 'DAY', field: 'jour', filter: 'agTextColumnFilter' },
    { headerName: 'HOSTNAME', field: 'hostname', filter: 'agTextColumnFilter' },
    { headerName: 'AVG (ms)', field: 'avg_latency_ms', filter: 'agNumberColumnFilter' },
    { headerName: 'MIN (ms)', field: 'min_latency_ms', filter: 'agNumberColumnFilter' },
    { headerName: 'MAX (ms)', field: 'max_latency_ms', filter: 'agNumberColumnFilter' },
    { headerName: 'JITTER (ms)', field: 'jitter_ms', filter: 'agNumberColumnFilter' },
    { headerName: 'AVAILABILITY (%)', field: 'availability_percent', filter: 'agNumberColumnFilter' },
  ]);

  async function loadDeviceTypes() {
    try {
      loading.value = true;
      const data = await getTypeDevices();
      deviceTypes.value = Array.isArray(data) ? data : (data?.rows || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Reporting] getTypeDevices failed:', e?.message || e);
      error.value = 'Failed to load device types';
    } finally {
      loading.value = false;
    }
  }

  function initDates() {
    const now = new Date();
    const ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Initialize stability dates
    endDate.value = now.toISOString().slice(0, 16);
    startDate.value = ago.toISOString().slice(0, 16);
    
    // Initialize latency dates
    latencyEndDate.value = now.toISOString().slice(0, 16);
    latencyStartDate.value = ago.toISOString().slice(0, 16);
  }

  async function loadDeviceStability() {
    if (!startDate.value || !endDate.value) {
      error.value = 'Please select start and end dates';
      return;
    }
    try {
      loading.value = true;
      error.value = null;
      const params = {
        start_date: new Date(startDate.value).toISOString(),
        end_date: new Date(endDate.value).toISOString(),
        type_device: selectedDeviceType.value || undefined,
      };
      const data = await reportingService.getDeviceStabilityStatus(params);
      deviceStabilityData.value = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Reporting] getDeviceStabilityStatus failed:', e?.message || e);
      error.value = 'Failed to load stability data';
      deviceStabilityData.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function loadLatency() {
    if (!latencyStartDate.value || !latencyEndDate.value) {
      error.value = 'Please select start and end dates for latency';
      return;
    }
    try {
      loadingLatency.value = true;
      error.value = null;
      const params = {
        start_date: new Date(latencyStartDate.value).toISOString(),
        end_date: new Date(latencyEndDate.value).toISOString(),
        type_device: latencyDeviceType.value || undefined,
        device_id: latencyDeviceId.value || undefined,
        status: latencyStatus.value || undefined,
      };
      const data = await reportingService.getAverageLatencyByDayAndSite(params);
      latencyData.value = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Reporting] getAverageLatencyByDayAndSite failed:', e?.message || e);
      error.value = 'Failed to load latency data';
      latencyData.value = [];
    } finally {
      loadingLatency.value = false;
    }
  }

  function exportStabilityCsv() {
    const rows = Array.isArray(deviceStabilityData.value) ? deviceStabilityData.value : [];
    if (!rows.length) return;
    exportJsonToCsv(rows, 'device-stability.csv');
  }

  function exportLatencyCsv() {
    const rows = Array.isArray(latencyData.value) ? latencyData.value : [];
    if (!rows.length) return;
    exportJsonToCsv(rows, 'latency-by-day.csv');
  }

  function exportStabilityExcel() {
    const rows = Array.isArray(deviceStabilityData.value) ? deviceStabilityData.value : [];
    if (!rows.length) return;
    exportJsonToExcel(rows, 'device-stability.xlsx', 'Device Stability');
  }

  function exportLatencyExcel() {
    const rows = Array.isArray(latencyData.value) ? latencyData.value : [];
    if (!rows.length) return;
    exportJsonToExcel(rows, 'latency-by-day.xlsx', 'Latency Report');
  }

  onMounted(async () => {
    initDates();
    await loadDeviceTypes();
  });
</script>

<style scoped>
  .app-container {
    margin-top: 10px;
  }
</style>
