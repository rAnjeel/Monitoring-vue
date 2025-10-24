<template>
  <div class="dashboard-container">
    <!-- Header -->
    <div class="dashboard-header">
      <h3 class="text-uppercase">Dashboard Metrics</h3>
      <p class="subtitle">Device performance overview</p>
      <div class="chart-controls">
        <select v-model="selectedPeriod" class="period-selector" @change="loadAllChartData">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <button class="btn btn-sm btn-primary" @click="loadAllChartData">
          <span class="glyphicon glyphicon-refresh" :class="{ 'spinning': loadingCharts }"></span>
          Refresh
        </button>
      </div>
    </div>

    <!-- Top Section -->
    <div class="top-section">
      <!-- Left Panel: Device Info + Metrics -->
      <div class="left-panel">
        <!-- Device Information Card -->
        <div class="device-info-card">
          <div class="card-header">
            <h3>Device Information</h3>
            <div
              class="status-badge"
              :class="deviceInfo.status ? 'online' : 'offline'"
            >
              <span class="glyphicon" :class="deviceInfo.status ? 'glyphicon-ok-circle' : 'glyphicon-remove-circle'"></span>
              {{ deviceInfo.status ? 'UP' : 'DOWN' }}
            </div>
          </div>
          <div class="card-content">
            <div class="info-grid">
              <div class="info-column">
                <div class="info-item">
                  <label>Name</label>
                  <span>{{ deviceInfo.sysName || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <label>IP Address</label>
                  <span>{{ deviceInfo.hostname || 'N/A' }}</span>
                </div>
              </div>
              <div class="info-column">
                <div class="info-item">
                  <label>Type</label>
                  <span>{{ deviceInfo.type || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <label>Location</label>
                  <span>{{ deviceInfo.location || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Metrics Cards -->
        <div class="metrics-row">
          <!-- Availability Card -->
          <div class="metric-card availability-card">
            <div class="card-header">
              <div class="card-title">
                <span class="glyphicon glyphicon-ok-circle"></span>
                <h4>Availability</h4>
                <p>System Uptime Percentage</p>
              </div>
            </div>
            <div class="card-content">
              <div v-if="loadingAvailability" class="loading-spinner">
                <span class="glyphicon glyphicon-refresh spinning"></span>
                Loading...
              </div>
              <div v-else-if="deviceAvailabilityData.length > 0" class="metric-value">
                <span class="value">{{ formatPercentage(deviceAvailabilityData[0].availability_percent) }}</span>
              </div>
              <div v-else class="no-data">
                <span class="glyphicon glyphicon-info-sign"></span>
                No Availability data available
              </div>
            </div>
          </div>

          <!-- MTBF Card -->
          <div class="metric-card mtbf-card">
            <div class="card-header">
              <div class="card-title">
                <span class="glyphicon glyphicon-wrench"></span>
                <h4>MTBF</h4>
                <p>Mean Time Between Failures</p>
              </div>
            </div>
            <div class="card-content">
              <div v-if="loadingMTBF" class="loading-spinner">
                <span class="glyphicon glyphicon-refresh spinning"></span>
                Loading...
              </div>
              <div v-else-if="mtbfData.length > 0" class="metric-value">
                <span class="value">{{ mtbfData[0].MTBF_hours }} hours</span>
              </div>
              <div v-else class="no-data">
                <span class="glyphicon glyphicon-info-sign"></span>
                No MTBF data available
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Latency Chart with Min/Max Zones -->
        <div class="chart-section">
          <div class="chart-header">
            <div class="chart-title">
              <h3>Latency per Day</h3>
              <p>Network performance with min/max zones</p>
            </div>
            <div style="display: flex; gap: 8px; margin-left: auto;">
              <button 
                @click="toggleLatencyView" 
                class="btn btn-sm btn-default"
                :title="latencyViewMode === 'chart' ? 'Switch to Table' : 'Switch to Chart'"
              >
                <span class="glyphicon" :class="latencyViewMode === 'chart' ? 'glyphicon-th-list' : 'glyphicon-stats'"></span>
              </button>
              <template v-if="latencyViewMode === 'table'">
                <button @click="exportLatencyCSV" class="btn btn-sm btn-success">
                  <span class="glyphicon glyphicon-file"></span> CSV
                </button>
                <button @click="exportLatencyExcel" class="btn btn-sm btn-success">
                  <span class="glyphicon glyphicon-list-alt"></span> Excel
                </button>
              </template>
              <button 
                v-if="latencyViewMode === 'chart'"
                @click="toggleLatencyZoom" 
                class="btn btn-sm" 
                :class="latencyZoomEnabled ? 'btn-primary' : 'btn-default'"
              >
                <span class="glyphicon" :class="latencyZoomEnabled ? 'glyphicon-zoom-out' : 'glyphicon-zoom-in'"></span>
                {{ latencyZoomEnabled ? 'Reset Zoom' : 'Zoom to Fit' }}
              </button>
            </div>
          </div>
          
          <div class="chart-container">
            <template v-if="latencyViewMode === 'chart'">
              <eChartComponent
                v-if="latencyChartData.x.length > 0"
                :key="'latency-' + latencyZoomEnabled"
                :x="latencyChartData.x"
                :y="latencyChartData.y"
                :title="latencyChartTitle"
                y-label="Latency (ms)"
                x-label="Day"
                chart-style="line-dot"
                :x-label-interval="1"
                :y-interval="30"
                :y-axis-min="latencyAxisBounds.min"
                :y-axis-max="latencyAxisBounds.max"
                :enable-zoom="true"
                :data-zoom="[
                  { type: 'inside', xAxisIndex: 0, filterMode: 'weakFilter' },
                  { type: 'slider', xAxisIndex: 0, height: 18, bottom: 8 }
                ]"
              />
              <div v-else class="no-data-chart">
                <span class="glyphicon glyphicon-signal"></span>
                <p>No latency data available</p>
              </div>
            </template>
            <template v-else>
              <AgGridModule
                v-if="latencyTableRows.length > 0"
                grid-id="latency-table-grid"
                :column-defs="latencyTableColumns"
                :row-data="latencyTableRows"
                row-selection="single"
              />
              <div v-else class="no-data-chart">
                <span class="glyphicon glyphicon-signal"></span>
                <p>No latency data available</p>
              </div>
            </template>
          </div>
        </div>
    </div>

    <!-- Bottom Section: Charts -->
    <div class="bottom-section">
      <!-- First Chart Block: Jitter -->
      <div class="chart-section">
        <div class="chart-header">
          <div class="chart-title">
            <h3>Jitter per Day</h3>
            <p>Network stability analysis</p>
          </div>
          <div style="display: flex; gap: 8px; margin-left: auto;">
            <button 
              @click="toggleJitterView" 
              class="btn btn-sm btn-default"
              :title="jitterViewMode === 'chart' ? 'Switch to Table' : 'Switch to Chart'"
            >
              <span class="glyphicon" :class="jitterViewMode === 'chart' ? 'glyphicon-th-list' : 'glyphicon-stats'"></span>
            </button>
            <template v-if="jitterViewMode === 'table'">
              <button @click="exportJitterCSV" class="btn btn-sm btn-success">
                <span class="glyphicon glyphicon-file"></span> CSV
              </button>
              <button @click="exportJitterExcel" class="btn btn-sm btn-success">
                <span class="glyphicon glyphicon-list-alt"></span> Excel
              </button>
            </template>
          </div>
        </div>
        
        <div class="chart-container">
          <template v-if="jitterViewMode === 'chart'">
            <eChartComponent
              v-if="jitterChartData.x.length > 0"
              :x="jitterChartData.x"
              :y="jitterChartData.y"
              title=""
              y-label="Jitter (ms)"
              x-label="Day"
              chart-style="bar"
              :x-label-interval="1"
              :y-interval="30"
              :enable-zoom="true"
              :data-zoom="[
                { type: 'inside', xAxisIndex: 0, filterMode: 'weakFilter' },
                { type: 'slider', xAxisIndex: 0, height: 18, bottom: 8 }
              ]"
              color-palette="orange"
            />
            <div v-else class="no-data-chart">
              <span class="glyphicon glyphicon-signal"></span>
              <p>No jitter data available</p>
            </div>
          </template>
          <template v-else>
            <AgGridModule
              v-if="jitterTableRows.length > 0"
              grid-id="jitter-table-grid"
              :column-defs="jitterTableColumns"
              :row-data="jitterTableRows"
              row-selection="single"
            />
            <div v-else class="no-data-chart">
              <span class="glyphicon glyphicon-signal"></span>
              <p>No jitter data available</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Second Chart Block: Availability -->
      <div class="chart-section">
        <div class="chart-header">
          <div class="chart-title">
            <h3>Availability per Day</h3>
            <p>System uptime analysis</p>
          </div>
          <div style="display: flex; gap: 8px; margin-left: auto;">
            <button 
              @click="toggleAvailabilityView" 
              class="btn btn-sm btn-default"
              :title="availabilityViewMode === 'chart' ? 'Switch to Table' : 'Switch to Chart'"
            >
              <span class="glyphicon" :class="availabilityViewMode === 'chart' ? 'glyphicon-th-list' : 'glyphicon-stats'"></span>
            </button>
            <template v-if="availabilityViewMode === 'table'">
              <button @click="exportAvailabilityCSV" class="btn btn-sm btn-success">
                <span class="glyphicon glyphicon-file"></span> CSV
              </button>
              <button @click="exportAvailabilityExcel" class="btn btn-sm btn-success">
                <span class="glyphicon glyphicon-list-alt"></span> Excel
              </button>
            </template>
            <button 
              v-if="availabilityViewMode === 'chart'"
              @click="toggleAvailabilityZoom" 
              class="btn btn-sm" 
              :class="availabilityZoomEnabled ? 'btn-primary' : 'btn-default'"
            >
              <span class="glyphicon" :class="availabilityZoomEnabled ? 'glyphicon-zoom-out' : 'glyphicon-zoom-in'"></span>
              {{ availabilityZoomEnabled ? 'Reset Zoom' : 'Zoom to Fit' }}
            </button>
          </div>
        </div>
        
        <div class="chart-container">
          <template v-if="availabilityViewMode === 'chart'">
            <eChartComponent
              v-if="availabilityChartData.x.length > 0"
              :key="'availability-' + availabilityZoomEnabled"
              :x="availabilityChartData.x"
              :y="availabilityChartData.y"
              :title="availabilityChartTitle"
              y-label="Availability (%)"
              x-label="Day"
              chart-style="line-dot"
              :bar-width="0.3"
              :x-label-interval="0"
              :y-interval="10"
              :y-axis-min="availabilityAxisBounds.min"
              :y-axis-max="availabilityAxisBounds.max"
              :enable-zoom="true"
              :data-zoom="[
                { type: 'inside', xAxisIndex: 0, filterMode: 'weakFilter' },
                { type: 'slider', xAxisIndex: 0, height: 18, bottom: 8 }
              ]"
              color-palette="green"
            />
            <div v-else class="no-data-chart">
              <span class="glyphicon glyphicon-signal"></span>
              <p>No availability data available</p>
            </div>
          </template>
          <template v-else>
            <AgGridModule
              v-if="availabilityTableRows.length > 0"
              grid-id="availability-table-grid"
              :column-defs="availabilityTableColumns"
              :row-data="availabilityTableRows"
              row-selection="single"
            />
            <div v-else class="no-data-chart">
              <span class="glyphicon glyphicon-signal"></span>
              <p>No availability data available</p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Back Button -->
    <div class="action-buttons">
      <button class="btn btn-default" @click="goBack">
        <span class="glyphicon glyphicon-arrow-left"></span>
        Back to Devices
      </button>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="alert alert-danger">
      <span class="glyphicon glyphicon-exclamation-sign"></span>
      {{ error }}
    </div>
  </div>
</template>

<script>
export default { name: 'ReportingDeviceView' };
</script>

<script setup>
  import '@/assets/App.css';
  import '@/assets/CardContainer.css';
  import '@/assets/ReportingDevice.css';
  import { ref, computed, onMounted, watch } from 'vue';
  import reportingService from '@/services/reporting/reporting.js';
  import eChartComponent from '@/components/eChartComponent.vue';
  import AgGridModule from '@/components/AgGridModule.vue';
  import { formatDate, formatDateOnly } from '@/services/utils/utils.js';
  import { exportJsonToCsv } from '@/services/csv/exportCSV.js';
  import { exportJsonToExcel } from '@/services/excel/exportExcel.js';

  const deviceInfo = ref({});
  const deviceAvailabilityData = ref([]);
  const mtbfData = ref([]);
  const loadingAvailability = ref(false);
  const loadingMTBF = ref(false);
  const loadingCharts = ref(false);
  const error = ref(null);
  const selectedPeriod = ref('7');
  
  // Latency chart data
  const latencyData = ref([]);
  const latencyChartData = ref({ x: [], y: [], yMin: [], yMax: [] });
  const latencySummary = ref(null);
  
  // Jitter chart data
  const jitterData = ref([]);
  const jitterChartData = ref({ x: [], y: [] });
  const jitterSummary = ref(null);
  
  // Availability chart data
  const availabilityData = ref([]);
  const availabilityChartData = ref({ x: [], y: [] });
  const availabilitySummary = ref(null);

  // Zoom toggle states for each chart
  const latencyZoomEnabled = ref(true);
  const availabilityZoomEnabled = ref(true);

  // View mode toggle (chart or table)
  const latencyViewMode = ref('chart'); // 'chart' or 'table'
  const jitterViewMode = ref('chart');
  const availabilityViewMode = ref('chart');

  // Helper function to calculate Y-axis bounds with margin
  function calculateAxisBounds(dataArray, marginPercent = 10) {
    if (!dataArray || dataArray.length === 0) return { min: null, max: null };
    
    const validValues = dataArray.filter(v => v != null && !isNaN(v) && isFinite(v));
    if (validValues.length === 0) return { min: null, max: null };
    
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    
    // If all values are the same, add fixed margin
    if (min === max) {
      const margin = Math.max(Math.abs(min) * 0.1, 1);
      return {
        min: Math.floor(min - margin),
        max: Math.ceil(max + margin)
      };
    }
    
    const range = max - min;
    const margin = range * (marginPercent / 100);
    
    return {
      min: Math.floor(min - margin),
      max: Math.ceil(max + margin)
    };
  }

  // Computed properties for Y-axis bounds
  const latencyAxisBounds = computed(() => {
    if (!latencyZoomEnabled.value) return { min: null, max: null };
    // Use all data points from the chart (avg, min, max)
    const allValues = [
      ...latencyChartData.value.y,
    ];
    return calculateAxisBounds(allValues, 10);
  });


  const availabilityAxisBounds = computed(() => {
    if (!availabilityZoomEnabled.value) return { min: null, max: null };
    // For availability, use smaller margin since it's percentage-based
    const bounds = calculateAxisBounds(availabilityChartData.value.y, 5);
    // Ensure we don't go below 0 or above 100 for percentages
    return {
      min: Math.max(0, bounds.min),
      max: Math.min(100, bounds.max)
    };
  });

  // Computed titles with Y-axis range information
  const latencyChartTitle = computed(() => {
    if (!latencyZoomEnabled.value) return '';
    if (latencyAxisBounds.value.min === null || latencyAxisBounds.value.max === null) return '';
    return `Latency (Zoom: ${latencyAxisBounds.value.min}-${latencyAxisBounds.value.max}ms)`;
  });


  const availabilityChartTitle = computed(() => {
    if (!availabilityZoomEnabled.value) return '';
    if (availabilityAxisBounds.value.min === null || availabilityAxisBounds.value.max === null) return '';
    return `Availability (Zoom: ${availabilityAxisBounds.value.min}-${availabilityAxisBounds.value.max}%)`;
  });

  // Toggle functions
  function toggleLatencyZoom() {
    latencyZoomEnabled.value = !latencyZoomEnabled.value;
  }

  function toggleAvailabilityZoom() {
    availabilityZoomEnabled.value = !availabilityZoomEnabled.value;
  }

  // View mode toggle functions
  function toggleLatencyView() {
    latencyViewMode.value = latencyViewMode.value === 'chart' ? 'table' : 'chart';
  }

  function toggleJitterView() {
    jitterViewMode.value = jitterViewMode.value === 'chart' ? 'table' : 'chart';
  }

  function toggleAvailabilityView() {
    availabilityViewMode.value = availabilityViewMode.value === 'chart' ? 'table' : 'chart';
  }

  // Export functions
  function exportLatencyCSV() {
    if (latencyTableRows.value.length === 0) {
      alert('No data to export');
      return;
    }
    const filename = `latency_${deviceInfo.value.hostname || 'device'}_${new Date().toISOString().split('T')[0]}.csv`;
    exportJsonToCsv(latencyTableRows.value, filename);
  }

  function exportLatencyExcel() {
    if (latencyTableRows.value.length === 0) {
      alert('No data to export');
      return;
    }
    const filename = `latency_${deviceInfo.value.hostname || 'device'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportJsonToExcel(latencyTableRows.value, filename, 'Latency Data');
  }

  function exportJitterCSV() {
    if (jitterTableRows.value.length === 0) {
      alert('No data to export');
      return;
    }
    const filename = `jitter_${deviceInfo.value.hostname || 'device'}_${new Date().toISOString().split('T')[0]}.csv`;
    exportJsonToCsv(jitterTableRows.value, filename);
  }

  function exportJitterExcel() {
    if (jitterTableRows.value.length === 0) {
      alert('No data to export');
      return;
    }
    const filename = `jitter_${deviceInfo.value.hostname || 'device'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportJsonToExcel(jitterTableRows.value, filename, 'Jitter Data');
  }

  function exportAvailabilityCSV() {
    if (availabilityTableRows.value.length === 0) {
      alert('No data to export');
      return;
    }
    const filename = `availability_${deviceInfo.value.hostname || 'device'}_${new Date().toISOString().split('T')[0]}.csv`;
    exportJsonToCsv(availabilityTableRows.value, filename);
  }

  function exportAvailabilityExcel() {
    if (availabilityTableRows.value.length === 0) {
      alert('No data to export');
      return;
    }
    const filename = `availability_${deviceInfo.value.hostname || 'device'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportJsonToExcel(availabilityTableRows.value, filename, 'Availability Data');
  }

  // Table column definitions
  const latencyTableColumns = ref([
    { headerName: 'Day', field: 'day', minWidth: 120, valueFormatter: params => formatDateOnly(params.value) },
    { headerName: 'Average (ms)', field: 'avg', minWidth: 120 },
    { headerName: 'Min (ms)', field: 'min', minWidth: 120 },
    { headerName: 'Max (ms)', field: 'max', minWidth: 120 },
  ]);

  const jitterTableColumns = ref([
    { headerName: 'Day', field: 'day', minWidth: 90, valueFormatter: params => formatDateOnly(params.value) },
    { headerName: 'Jitter (ms)', field: 'jitter', minWidth: 100 },
  ]);

  const availabilityTableColumns = ref([
    { headerName: 'Day', field: 'day', minWidth: 360, valueFormatter: params => formatDateOnly(params.value) },
    { headerName: 'Availability (%)', field: 'availability', minWidth: 390 },
  ]);

  // Table data rows computed
  const latencyTableRows = computed(() => {
    if (!latencyData.value || latencyData.value.length === 0) return [];
    return latencyData.value.map(item => ({
      day: item.jour || '',
      avg: item.avg_latency_ms?.toFixed(2) || '0',
      min: item.min_latency_ms?.toFixed(2) || '0',
      max: item.max_latency_ms?.toFixed(2) || '0',
    }));
  });

  const jitterTableRows = computed(() => {
    if (!jitterData.value || jitterData.value.length === 0) return [];
    return jitterData.value.map(item => ({
      day: item.jour || '',
      jitter: item.jitter_ms?.toFixed(2) || '0',
    }));
  });

  const availabilityTableRows = computed(() => {
    if (!availabilityData.value || availabilityData.value.length === 0) return [];
    return availabilityData.value.map(item => ({
      day: item.jour || '',
      availability: item.availability_percent || '0',
    }));
  });

  function formatPercentage(percentage) {
    if (!percentage || percentage === 0) return '0%';
    return `${Math.round(percentage * 100) / 100}%`;
  }

  function goBack() {
    try {
      if (typeof window.__SET_ACTIVE_VIEW__ === 'function') {
        window.__SET_ACTIVE_VIEW__('devices');
      }
    } catch (e) {
      console.error('Error switching back to devices view:', e);
    }
  }


  async function loadAvailability() {
    if (!deviceInfo.value.device_id) return;
    
    try {
      loadingAvailability.value = true;
      error.value = null;
      const data = await reportingService.getAvailability(deviceInfo.value.device_id);
      deviceAvailabilityData.value = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[ReportingDevice] getAvailability failed:', e?.message || e);
      error.value = 'Failed to load Availability data';
      deviceAvailabilityData.value = [];
    } finally {
      loadingAvailability.value = false;
    }
  }

  async function loadMTBF() {
    if (!deviceInfo.value.device_id) return;
    
    try {
      loadingMTBF.value = true;
      error.value = null;
      const data = await reportingService.getMTBF(deviceInfo.value.device_id);
      mtbfData.value = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[ReportingDevice] getMTBF failed:', e?.message || e);
      error.value = 'Failed to load MTBF data';
      mtbfData.value = [];
    } finally {
      loadingMTBF.value = false;
    }
  }

  async function loadAllChartData() {
    if (!deviceInfo.value.device_id) return;
    
    try {
      loadingCharts.value = true;
      error.value = null;
      
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(selectedPeriod.value));
      
      const params = {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        device_id: deviceInfo.value.device_id,
        group_by: 'jour',
      };
      
      // Load all chart data in parallel
      const [latencyChart, rawData] = await Promise.all([
        reportingService.getLatencyChartData(params),
        reportingService.getAverageLatencyByDayAndSite(params)
      ]);
      
      // Process latency data with min/max zones
      latencyData.value = latencyChart.rows || [];
      latencyChartData.value = {
        x: latencyChart.x || [],
        y: latencyChart.y || [],
        yMin: latencyChart.yMin || [],
        yMax: latencyChart.yMax || []
      };
      latencySummary.value = latencyChart.summary || null;
      
      // Debug logs
      console.log('[ReportingDevice] Latency data:', {
        x: latencyChartData.value.x,
        y: latencyChartData.value.y,
        yMin: latencyChartData.value.yMin,
        yMax: latencyChartData.value.yMax
      });
      
      // Process jitter data
      const jitterRows = rawData.rows || [];
      if (jitterRows.length > 0) {
        const dayToJitter = new Map();
        jitterRows.forEach(item => {
          const dayKey = item.jour || 'Unknown';
          const jitterValue = Number(item.jitter_ms || 0);
          if (!dayToJitter.has(dayKey)) dayToJitter.set(dayKey, []);
          dayToJitter.get(dayKey).push(jitterValue);
        });
        
        const jitterX = Array.from(dayToJitter.keys()).sort();
        const jitterY = jitterX.map(day => {
          const list = dayToJitter.get(day) || [];
          if (!list.length) return 0;
          const sum = list.reduce((s, v) => s + v, 0);
          return Math.round((sum / list.length) * 100) / 100;
        });
        
        // Format dates for display
        const formattedJitterX = jitterX.map(day => {
          try {
            return formatDate(day, 'FR', 'dd/MM/yyyy');
          } catch (e) {
            return day;
          }
        });
        
        jitterChartData.value = { x: formattedJitterX, y: jitterY };
        jitterData.value = jitterRows;
        
        // Debug logs
        console.log('[ReportingDevice] Jitter data:', {
          x: jitterChartData.value.x,
          y: jitterChartData.value.y,
          rawData: jitterRows.length
        });
        
        // Calculate jitter summary
        const flatJitter = jitterRows
          .map(r => Number(r.jitter_ms || 0))
          .filter(n => Number.isFinite(n));
        
        jitterSummary.value = flatJitter.length ? {
          average: Math.round((flatJitter.reduce((s, v) => s + v, 0) / flatJitter.length) * 100) / 100,
          maximum: Math.max(...flatJitter),
          minimum: Math.min(...flatJitter)
        } : null;
      }
      
      // Process availability data
      if (jitterRows.length > 0) {
        const dayToAvailability = new Map();
        jitterRows.forEach(item => {
          const dayKey = item.jour || 'Unknown';
          const availabilityValue = Number(item.availability_percent || 0);
          if (!dayToAvailability.has(dayKey)) dayToAvailability.set(dayKey, []);
          dayToAvailability.get(dayKey).push(availabilityValue);
        });
        
        const availabilityX = Array.from(dayToAvailability.keys()).sort();
        const availabilityY = availabilityX.map(day => {
          const list = dayToAvailability.get(day) || [];
          if (!list.length) return 0;
          const sum = list.reduce((s, v) => s + v, 0);
          return Math.round((sum / list.length) * 100) / 100;
        });
        
        // Format dates for display
        const formattedAvailabilityX = availabilityX.map(day => {
          try {
            return formatDate(day, 'FR', 'dd/MM/yyyy');
          } catch (e) {
            return day;
          }
        });
        
        availabilityChartData.value = { x: formattedAvailabilityX, y: availabilityY };
        availabilityData.value = jitterRows;
        
        // Debug logs
        console.log('[ReportingDevice] Availability data:', {
          x: availabilityChartData.value.x,
          y: availabilityChartData.value.y,
          rawData: jitterRows.length
        });
        
        // Calculate availability summary
        const flatAvailability = jitterRows
          .map(r => Number(r.availability_percent || 0))
          .filter(n => Number.isFinite(n));
        
        availabilitySummary.value = flatAvailability.length ? {
          average: Math.round((flatAvailability.reduce((s, v) => s + v, 0) / flatAvailability.length) * 100) / 100,
          maximum: Math.max(...flatAvailability),
          minimum: Math.min(...flatAvailability)
        } : null;
      }
      
    } catch (e) {
      console.error('[ReportingDevice] Failed to load chart data:', e?.message || e);
      error.value = 'Failed to load chart data';
      latencyData.value = [];
      jitterData.value = [];
      availabilityData.value = [];
    } finally {
      loadingCharts.value = false;
    }
  }

  onMounted(async () => {
    try {
      const storedDeviceInfo = window.__REPORTING_DEVICE_INFO__;
      if (storedDeviceInfo) {
        deviceInfo.value = storedDeviceInfo;
        await Promise.all([loadAvailability(), loadMTBF(), loadAllChartData()]);
        watch(selectedPeriod, () => {
          loadAllChartData();
        });
      } else {
        error.value = 'No device information available';
      }
    } catch (e) {
      console.error('[ReportingDevice] Error on mount:', e?.message || e);
      error.value = 'Failed to initialize device reporting';
    }
  });
</script>