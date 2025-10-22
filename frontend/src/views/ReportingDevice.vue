<template>
  <div class="dashboard-container">
    <!-- Header -->
    <div class="dashboard-header">
      <h1>Dashboard Metrics</h1>
      <p class="subtitle">System performance overview</p>
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
          <!-- MTTR Card -->
          <div class="metric-card mttr-card">
            <div class="card-header">
              <div class="card-title">
                <span class="glyphicon glyphicon-time"></span>
                <h4>MTTR</h4>
                <p>Mean Time To Recovery</p>
              </div>
            </div>
            <div class="card-content">
              <div v-if="loadingMTTR" class="loading-spinner">
                <span class="glyphicon glyphicon-refresh spinning"></span>
                Loading...
              </div>
              <div v-else-if="mttrData.length > 0" class="metric-value">
                <span class="value">{{ formatHours(mttrData[0].MTTR_hours) }}</span>
                <div class="mini-chart">
                  <div class="bar" style="height: 60%"></div>
                  <div class="bar" style="height: 80%"></div>
                  <div class="bar" style="height: 45%"></div>
                  <div class="bar" style="height: 90%"></div>
                  <div class="bar" style="height: 70%"></div>
                </div>
              </div>
              <div v-else class="no-data">
                <span class="glyphicon glyphicon-info-sign"></span>
                No MTTR data available
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
                <span class="value">{{ formatHours(mtbfData[0].MTBF_hours) }}</span>
                <div class="mini-chart">
                  <div class="bar" style="height: 70%"></div>
                  <div class="bar" style="height: 85%"></div>
                  <div class="bar" style="height: 60%"></div>
                  <div class="bar" style="height: 95%"></div>
                  <div class="bar" style="height: 80%"></div>
                </div>
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
          </div>
          
          <div class="chart-container">
            <eChartComponent
              v-if="latencyChartData.x.length > 0"
              :x="latencyChartData.x"
              :y="latencyChartData.y"
              :y-min="latencyChartData.yMin"
              :y-max="latencyChartData.yMax"
              title=""
              y-label="Latency (ms)"
              x-label="Day"
              :smooth="true"
            />
            <div v-else class="no-data-chart">
              <span class="glyphicon glyphicon-signal"></span>
              <p>No latency data available</p>
            </div>
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
        
        <div class="chart-container">
          <eChartComponent
            v-if="jitterChartData.x.length > 0"
            :x="jitterChartData.x"
            :y="jitterChartData.y"
            title=""
            y-label="Jitter (ms)"
            x-label="Day"
            :smooth="true"
          />
          <div v-else class="no-data-chart">
            <span class="glyphicon glyphicon-signal"></span>
            <p>No jitter data available</p>
          </div>
        </div>
      </div>

      <!-- Second Chart Block: Availability -->
      <div class="chart-section">
        <div class="chart-header">
          <div class="chart-title">
            <h3>Availability per Day</h3>
            <p>System uptime analysis</p>
          </div>
        </div>
        
        <div class="chart-container">
          <eChartComponent
            v-if="availabilityChartData.x.length > 0"
            :x="availabilityChartData.x"
            :y="availabilityChartData.y"
            title=""
            y-label="Availability (%)"
            x-label="Day"
            :smooth="true"
          />
          <div v-else class="no-data-chart">
            <span class="glyphicon glyphicon-signal"></span>
            <p>No availability data available</p>
          </div>
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
  import { ref, onMounted, watch } from 'vue';
  import reportingService from '@/services/reporting/reporting.js';
  import eChartComponent from '@/components/eChartComponent.vue';
  import { formatDate } from '@/services/utils/utils.js';

  const deviceInfo = ref({});
  const mttrData = ref([]);
  const mtbfData = ref([]);
  const loadingMTTR = ref(false);
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

  function formatHours(hours) {
    if (!hours || hours === 0) return '0h 0m';
    
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    return `${h}h ${m}m`;
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


  async function loadMTTR() {
    if (!deviceInfo.value.device_id) return;
    
    try {
      loadingMTTR.value = true;
      error.value = null;
      const data = await reportingService.getMTTR(deviceInfo.value.device_id);
      mttrData.value = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[ReportingDevice] getMTTR failed:', e?.message || e);
      error.value = 'Failed to load MTTR data';
      mttrData.value = [];
    } finally {
      loadingMTTR.value = false;
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
        device_id: deviceInfo.value.device_id
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
    // Get device info from global variable
    try {
      const storedDeviceInfo = window.__REPORTING_DEVICE_INFO__;
      if (storedDeviceInfo) {
        deviceInfo.value = storedDeviceInfo;
        // Default to last 7 days is already set via selectedPeriod = '7'
        await Promise.all([loadMTTR(), loadMTBF(), loadAllChartData()]);
        // React to period changes
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