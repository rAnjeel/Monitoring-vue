<template>
  <div class="list-ports-page">
    <div class="sub-navbar">
        <div class="nav nav-tabs">
            <h5 class="text-uppercase" style="color:#ecf0f1;">
                <span class="glyphicon glyphicon-triangle-right" aria-hidden="true" style="margin-right: 6px;"></span>
                <span>Ports List</span>
                <span class="label label-primary" title="Total ports">{{ totalCountDisplay }}</span>
            </h5>
        </div>
    </div>

    <div class="content-wrapper">
       <div class="filter-section">
            <div class="row" style="align-items:center;">
                
                <!-- Bloc gauche -->
                <div class="col-md-8">
                  <label class="form-label">Show</label>
                  <select v-model.number="pageSize" class="form-control input-sm" style="display:inline-block;width:80px;margin:0 5px;">
                      <option :value="20">20</option>
                      <option :value="50">50</option>
                      <option :value="100">100</option>
                  </select>
                  <span style="margin-right:6px;">entries |</span>
                  <label class="form-label" style="margin-right:6px;">Go to page</label>
                  <input type="number" min="1" :max="totalPagesDisplay" v-model.number="targetPage" 
                          @keyup.enter="jumpToPage" 
                          class="form-control input-sm" 
                          style="display:inline-block;width:80px;margin-right: 6px;" />
                  <span class="form-label" style="margin-right:6px;">/ {{ totalPagesDisplay }} |</span>
                  <label class="form-label" style="margin-right:6px;">Hostname</label>
                  <input type="text" class="form-control input-sm" placeholder="hostname" v-model="hostnameFilter" @input="onHostnameInput" style="display:inline-block;width:180px;margin-right:8px;" />
                  <label class="form-label" style="margin-right:6px;">OnlyMonitored</label>
                  <input type="checkbox" v-model="onlyMonitored" @change="onToggleOnlyMonitored" />
                </div>
                
                <!-- Bloc droite -->
                <div class="col-md-4 text-right">
                   <div class="btn-group" role="group" style="gap:8px;">
                      <button @click="showImportPorts = true" class="btn btn-sm btn-primary" style="margin-right: 8px;">
                      <span class="glyphicon glyphicon-upload"></span>
                      Import CSV
                      </button>
                       <button v-if="hasActiveFilters" @click="resetFilters" style="margin-right: 8px;" class="btn btn-sm btn-default" :disabled="loading">
                       <span class="glyphicon glyphicon-filter" style="transform:rotate(180deg);"></span>
                       Reset Filters
                       </button>
                      <button @click="reloadGrid" class="btn btn-sm btn-info" :disabled="loading">
                      <span class="glyphicon glyphicon-refresh" :class="{ 'spinning': loading }"></span>
                      Reload
                      </button>
                  </div>
                </div>

            </div>
        </div>

        <!-- Loading overlay -->
        <!-- <div v-if="loading" class="loading-overlay">
          <div class="loading-box">
            <span class="glyphicon glyphicon-refresh spinning" style="font-size:24px; margin-right:8px;"></span>
            <span>Loading...</span>
          </div>
        </div> -->
        <div class="app-container" @contextmenu.prevent>
            <AgGridModule
                grid-id="ports-grid"
                :column-defs="columns"
                :row-data="rows"
                :filter-model="gridFilterModel"
                ref="agGridRef"
                @filter-changed="onFilterChanged"
                @filter-apply="applyFilters"
                @filter-reset="clearFilters"
                @cell-context-menu="onCellContextMenu"
            />
            <AgGridContextMenu :items="menuItems" />
        </div>
    </div>
    <CsvImport v-model="showImportPorts" :import-type="'ports'" @import="reloadGrid" />

    <!-- Port Events Modal -->
    <ModalComponent
      v-model="showEventsModal"
      :title="`Port Details - ${selectedPortRow?.name || selectedPortRow?.ifName || ''}`"
      :width="'min(1000px, 96vw)'"
    >
      <div class="device-details-block">
        <DetailsComponent :data="hiddenDetails" :max-lines="8" />
      </div>

      <h4 class="events-section-title">Historic Port Events</h4>

      <eChartComponent
        :key="'traffic-' + trafficZoomEnabled"
        :x="eventsChartX"
        :y="chartSeries"
        :title="trafficChartTitle"
        x-label="Time"
        y-label="Octets"
        height="300px"
        :smooth=false
        :x-label-interval="0"
        :y-axis-min="trafficAxisBounds.min"
        :y-axis-max="trafficAxisBounds.max"
        :enable-zoom="true"
        :data-zoom="[
          { type: 'inside', xAxisIndex: 0, filterMode: 'weakFilter' },
          { type: 'slider', xAxisIndex: 0, height: 18, bottom: 8 }
        ]"
      />

        <div class="events-toolbar" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0 10px;">
          <div class="form-group" style="display:flex;flex-direction:column;gap:4px;min-width:180px;">
            <label class="control-label" style="font-size:12px;color:#64748b;">Start</label>
            <input type="datetime-local" v-model="eventsStartDate" @change="onEventsFilterChanged" class="form-control input-sm" />
          </div>
          <div class="form-group" style="display:flex;flex-direction:column;gap:4px;min-width:180px;">
            <label class="control-label" style="font-size:12px;color:#64748b;">End</label>
            <input type="datetime-local" v-model="eventsEndDate" @change="onEventsFilterChanged" class="form-control input-sm" />
          </div>
          <div class="form-group" style="display:flex;flex-direction:column;gap:4px;min-width:120px;">
            <label class="control-label" style="font-size:12px;color:#64748b;">Page size</label>
            <select v-model.number="eventsPageSize" @change="onEventsPageSizeChanged" class="form-control input-sm">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
          <div class="form-group" style="display:flex;flex-direction:column;gap:4px;min-width:140px;">
            <label class="control-label" style="font-size:12px;color:#64748b;">Status</label>
            <select v-model="eventsStatus" @change="onEventsFilterChanged" class="form-control input-sm">
              <option value="">All</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
            </select>
          </div>
          <div class="form-group" style="display:flex;flex-direction:column;gap:4px;min-width:120px;">
            <label class="control-label" style="font-size:12px;color:#64748b;">Go to page</label>
            <input type="number" min="1" v-model.number="eventsTargetPage" @keyup.enter="jumpToEventsPage" class="form-control input-sm" />
          </div>
          <div style="margin-left:auto;display:flex;gap:8px;">
            <button 
              @click="toggleTrafficZoom" 
              class="btn btn-sm" 
              :class="trafficZoomEnabled ? 'btn-primary' : 'btn-default'"
            >
              <span class="glyphicon" :class="trafficZoomEnabled ? 'glyphicon-zoom-out' : 'glyphicon-zoom-in'"></span>
              {{ trafficZoomEnabled ? 'Reset Zoom' : 'Zoom to Fit' }}
            </button>
            <button @click="loadDeviceEvents" class="btn btn-primary btn-sm" :disabled="loading">
              <span class="glyphicon glyphicon-refresh" :class="{ 'spinning': loading }"></span>
              Reload
            </button>
          </div>
        </div>

      <div v-if="eventsRows.length === 0" style="padding:8px 0;">No events</div>
      <AgGridModule
        v-else
        grid-id="port-events-modal-grid"
        :column-defs="eventColumns"
        :row-data="eventsRows"
        row-selection="single"
      />

      <div class="events-pagination" style="display:flex;gap:12px;justify-content:flex-end;padding-top:8px;">
        <button :disabled="eventsPage <= 1" @click="changeEventsPage(eventsPage - 1)">Prev</button>
        <span>Page {{ eventsPage }} {{ eventsHasNextPage ? '+' : '' }}</span>
        <button :disabled="!eventsHasNextPage" @click="changeEventsPage(eventsPage + 1)">Next</button>
      </div>
    </ModalComponent>

    <!-- EDIT PORT MODAL -->
    <ModalComponent
        v-model="showEditPortModal"
        :title="`Update Port - ${editPortData?.ifName || editPortData?.name || ''}`"
        :width="'min(800px, 96vw)'"
        :maxHeight="'80vh'"
    >
        <FormComponent
            v-if="editPortData"
            :form-title="'Port Information'"
            :inputs="portFormInputs"
            :buttons="portFormButtons"
            :initial-data="editPortData"
            @submit="handleUpdatePort"
            @cancel="handleCancelEdit"
        />
    </ModalComponent>
  </div>
</template>

<script setup>
    import CsvImport from '@/views/CsvImport.vue';
    import '@/assets/ListPorts.css';
    import '@/assets/Loading.css';
    import AgGridModule from '@/components/AgGridModule.vue';
    import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
    import { getLimitedPorts, updatePort, connectSocket, disconnectSocket, onSocket, offSocket } from '@/services/ports/ports';
    import { badgeContainer, superposeValue, formatDate } from '@/services/utils/utils';
    import AgGridContextMenu from '@/components/AgGridContextMenu.vue';
    import MenuModule from '@/modules/AgGridModule';
    import ModalComponent from '@/components/ModalComponent.vue';
    import DetailsComponent from '@/components/DetailsComponent.vue';
    import { getPortEventsByPortId } from '@/services/ports/portEvents';
    import eChartComponent from '@/components/eChartComponent.vue';
    import FormComponent from '@/components/FormComponent.vue';


    const loading = ref(false);
    const error = ref(null);
    const lastUpdated = ref(null);

    const columns = ref([]);
    const rows = ref([]);
    const pageSize = ref(20);
    const agGridRef = ref(null);
    const gridFilterModel = ref(null);
    const targetPage = ref(1);
    const totalPagesDisplay = ref(1);
    const totalCountDisplay = ref(0);
    const showImportPorts = ref(false);
    const showEventsModal = ref(false);
    const showEditPortModal = ref(false);
    const selectedPortRow = ref(null);
    const editPortData = ref(null);
    const eventsRows = ref([]);
    const eventsPage = ref(1);
    const eventsPageSize = ref(20);
    const eventsStartDate = ref('');
    const eventsEndDate = ref('');
    const eventsStatus = ref('');
    const eventsHasNextPage = ref(false);
    const eventsTargetPage = ref(1);
    const onlyMonitored = ref(false);
    const hostnameFilter = ref('');
    const trafficZoomEnabled = ref(true);
    const hasActiveFilters = computed(() => {
      const gf = gridFilterModel.value;
      return !!(gf && typeof gf === 'object' && Object.keys(gf).length > 0);
    });

    const eventColumns = ref([
      { headerName: 'Status', field: 'status', minWidth: 80 },
      { headerName: 'InOctets', field: 'ifInOctets', minWidth: 100 },
      { headerName: 'OutOctets', field: 'ifOutOctets', minWidth: 100 },
      { headerName: 'Date', field: 'event_time', minWidth: 180 },
    ]);

    // Port form inputs based on port.model.js
    const portFormInputs = ref([
      { field: 'ifName', title: 'Interface Name', type: 'text' },
      { field: 'ifDescr', title: 'Description', type: 'textarea', rows: 2 },
      { field: 'ifAlias', title: 'Alias', type: 'textarea', rows: 2 },
      { field: 'isMonitored', title: 'Monitored', type: 'checkbox', checkboxLabel: 'Enable monitoring for this port' },
      { field: 'ifIndex', title: 'Interface Index', type: 'number', disabled: true, helpText: 'Read-only field' },
      { field: 'ifType', title: 'Interface Type', type: 'text', maxLength: 45 },
      { field: 'ifMtu', title: 'MTU', type: 'number', helpText: 'Maximum Transmission Unit' },
      { field: 'ifSpeed', title: 'Speed', type: 'number', helpText: 'Interface speed in bits per second' },
      { field: 'ifHighSpeed', title: 'High Speed', type: 'number', helpText: 'Speed in Mbps for high-speed interfaces' },
      { field: 'ifPhysAddress', title: 'Physical Address', type: 'text', maxLength: 45, helpText: 'MAC address' },
      { field: 'ifAdminStatus', title: 'Admin Status', type: 'select', options: [
        { label: 'Up', value: 'up' },
        { label: 'Down', value: 'down' },
        { label: 'Testing', value: 'testing' }
      ]},
      { field: 'ifOperStatus', title: 'Operational Status', type: 'select', options: [
        { label: 'Up', value: 'up' },
        { label: 'Down', value: 'down' },
        { label: 'Testing', value: 'testing' },
        { label: 'Unknown', value: 'unknown' },
        { label: 'Dormant', value: 'dormant' },
        { label: 'Not Present', value: 'notPresent' },
        { label: 'Lower Layer Down', value: 'lowerLayerDown' }
      ]},
      { field: 'ifPromiscuousMode', title: 'Promiscuous Mode', type: 'checkbox', checkboxLabel: 'Enable promiscuous mode' },
      { field: 'ifConnectorPresent', title: 'Connector Present', type: 'checkbox', checkboxLabel: 'Physical connector is present' }
    ]);

    const portFormButtons = ref([
      { label: 'Cancel', type: 'button', class: 'btn-default', action: 'cancel' },
      { label: 'Update Port', type: 'submit', class: 'btn-primary', icon: 'glyphicon glyphicon-ok', action: 'submit' }
    ]);

    // Données pour le graphique des événements (x: event_time, y: ifInOctets/ifOutOctets)
    const sortedEvents = computed(() =>
      (eventsRows.value || []).slice().sort((a, b) => new Date(a.event_time) - new Date(b.event_time))
    );

    const eventsChartX = computed(() =>
      sortedEvents.value.map(r => r?.event_time ? formatDate(r.event_time, 'HH:mm:ss') : '')
    );

    const chartSeries = computed(() => {
      const inData = sortedEvents.value.map(r => Number(r?.ifInOctets ?? 0));
      const outData = sortedEvents.value.map(r => Number(r?.ifOutOctets ?? 0));
      return [
        { name: 'InOctets', data: inData },
        { name: 'OutOctets', data: outData }
      ]
    });

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

    // Computed property for Y-axis bounds
    const trafficAxisBounds = computed(() => {
      if (!trafficZoomEnabled.value) return { min: null, max: null };
      // Collect all data points from InOctets and OutOctets
      const allValues = [
        ...chartSeries.value[0].data,
        ...chartSeries.value[1].data
      ];
      return calculateAxisBounds(allValues, 10);
    });

    // Computed title with Y-axis range information
    const trafficChartTitle = computed(() => {
      if (!trafficZoomEnabled.value) return 'Traffic';
      if (trafficAxisBounds.value.min === null || trafficAxisBounds.value.max === null) return 'Traffic';
      return `Traffic (Zoom: ${trafficAxisBounds.value.min}-${trafficAxisBounds.value.max} Octets)`;
    });

    function toggleTrafficZoom() {
      trafficZoomEnabled.value = !trafficZoomEnabled.value;
    }

    // Map grid data to form fields (handle different field naming)
    function mapPortDataToForm(row) {
      if (!row) return null;
      
      return {
        // Keep all original fields
        ...row,
        // Ensure form field names are properly set
        ifName: row.ifName ?? row.name ?? '',
        ifDescr: row.ifDescr ?? row.description ?? '',
        ifAlias: row.ifAlias ?? row.alias ?? '',
        ifAdminStatus: row.ifAdminStatus ?? row.adminStatus ?? '',
        ifOperStatus: row.ifOperStatus ?? row.operStatus ?? '',
        ifSpeed: row.ifSpeed ?? row.Speed ?? row.speed ?? 0,
        ifHighSpeed: row.ifHighSpeed ?? row.HighSpeed ?? 0,
        ifMtu: row.ifMtu ?? row.mtu ?? 0,
        ifType: row.ifType ?? row.type ?? '',
        ifPhysAddress: row.ifPhysAddress ?? row.physAddress ?? '',
        ifPromiscuousMode: row.ifPromiscuousMode ?? row.PromiscuousMode ?? false,
        ifConnectorPresent: row.ifConnectorPresent ?? row.ConnectorPresent ?? false,
        ifIndex: row.ifIndex ?? row.index ?? 0,
        isMonitored: row.isMonitored ?? false,
      };
    }

    const menuItems = ref([
        {
            id: 'update',
            label: 'Update',
            icon: 'glyphicon glyphicon-pencil',
            action: (row) => {
                editPortData.value = mapPortDataToForm(row);
                showEditPortModal.value = true;
            }
        },
        {
            id: 'details',
            label: 'Details',
            icon: 'glyphicon glyphicon-list-alt',
            action: async (row) => {
                selectedPortRow.value = row;
                eventsPage.value = 1;
                await loadPortEvents();
                showEventsModal.value = true;
            }
        },
        {
            id: 'disable',
            label: 'Disable Port',
            icon: 'glyphicon glyphicon-ban-circle',
            action: (row) => {
                // eslint-disable-next-line no-console
                console.log('[Ports] Disable:', row);
            }
        }
    ]);

    // Générer dynamiquement les colonnes en s'inspirant de ListDevices.vue
    function generateColumns(portsData) {
        const columnsToHide = ['description', 'status', 'ne_id', 'device_id', 'hostname', 'sysName', 'sysname', 'adminStatus', 'operStatus', 'port_id', 'mtu', 'HighSpeed', 'PromiscuousMode', 'ConnectorPresent', 'in_octets', 'out_octets', 'Speed'];

        const sample = (Array.isArray(portsData) && portsData.length > 0) ? portsData[0] : {};
        const keys = Object.keys(sample || {});
        const visibleKeys = keys.filter(key => !columnsToHide.includes(key));

        const otherColumns = visibleKeys
            .filter(key => !['hostname', 'sysName', 'sysname'].includes(key))
            .map(key => ({
                headerName: key.replace(/_/g, ' ').toUpperCase(),
                field: key
            }));

        const hasHostOrSys = keys.includes('hostname') || keys.includes('sysName') || keys.includes('sysname');

        if (hasHostOrSys) {
            const deviceCol = [
                {
                    headerName: 'DEVICE',
                    field: 'hostname',
                    colId: 'hostname',
                    wrapText: true,
                    autoHeight: true,
                    minWidth: 220,
                    valueGetter: (params) => {
                        const hostname = params.data?.hostname || '';
                        const sysName = params.data?.sysName || params.data?.sysname || '';
                        return [hostname, sysName].filter(Boolean).join(' ');
                    },
                    cellRenderer: (params) => {
                        const hostname = params.data?.hostname || '';
                        const sysName = params.data?.sysName || params.data?.sysname || '';
                        return superposeValue(hostname, sysName);
                    }
                },
                {
                    headerName: 'ADMIN STATUS',
                    field: 'adminStatus',
                    colId: 'adminStatus',
                    cellRenderer: (params) => {
                        const value = params.data?.adminStatus;
                        return value ? badgeContainer(String(value).toUpperCase()) : '';
                    }
                },
                {
                    headerName: 'OPER STATUS',
                    colId: 'operStatus',
                    cellRenderer: (params) => {
                        const value = params.data?.operStatus;
                        return value ? badgeContainer(String(value).toUpperCase()) : '';
                    }
                },
                {
                    headerName: 'SPEED',
                    colId: 'Speed',
                    cellRenderer: (params) => {
                        const value = params.data?.Speed;
                        return value;
                    }
                },
                {
                    headerName: 'INOCTETS',
                    colId: 'inOctets',
                    cellRenderer: (params) => {
                        const value = params.data?.in_octets;
                        return value;
                    }
                },
                {
                    headerName: 'OUTOCTETS',
                    colId: 'outOctets',
                    cellRenderer: (params) => {
                        const value = params.data?.out_octets;
                        return value;
                    }
              },
              {
                headerName: 'STATUS',
                colId: 'status',
                cellRenderer: (params) => {
                    const value = params.data?.status;
                    return value ? badgeContainer(String(value).toUpperCase()) : '';
                }
              }
            ];
            columns.value = [...deviceCol, ...otherColumns];
        } else {
            columns.value = otherColumns;
        }
    }


    async function loadPorts() {
        // loading.value = true;
        error.value = null;
        try {
            console.log('[LoadPorts] Début du chargement des ports...');
            let filter = {};
            if (gridFilterModel.value && Object.keys(gridFilterModel.value).length > 0) {
                filter = { ...gridFilterModel.value };
            }
            const { rows: ports, totalCount: fetchedTotalCount } = await getLimitedPorts({
                page: targetPage.value,
                pageSize: pageSize.value,
                filter,
            });
            console.log('Total ports:', fetchedTotalCount);
            const total = Number(fetchedTotalCount) || 0;
            totalCountDisplay.value = total;
            totalPagesDisplay.value = Math.max(1, Math.ceil(total / pageSize.value));
            console.log('Total pages display:', totalPagesDisplay.value);
            if (!Array.isArray(ports)) {
                throw new Error('Réponse inattendue du service ports');
            }
            generateColumns(ports);
            rows.value = ports;
        } catch (err) {
            error.value = err.message;
            console.error('[LoadPorts] Erreur lors du chargement:', err);
        } finally {
            loading.value = false;
            lastUpdated.value = new Date();
        }
    }

    async function reloadGrid() {
        console.log('[ReloadPorts] Rechargement des données...');
        await loadPorts();
    }

    function onToggleOnlyMonitored() {
      console.log('[Ports] OnlyMonitored changed:', onlyMonitored.value);
      const current = (gridFilterModel.value && typeof gridFilterModel.value === 'object') ? { ...gridFilterModel.value } : {};
      if (onlyMonitored.value) {
          current.isMonitored = true;
      } else {
          delete current.isMonitored;
      }
      gridFilterModel.value = Object.keys(current).length > 0 ? current : null;
      targetPage.value = 1;
      loadPorts();
    }

    function onHostnameInput() {
      console.log('[Ports] Hostname input:', hostnameFilter.value);
      const current = (gridFilterModel.value && typeof gridFilterModel.value === 'object') ? { ...gridFilterModel.value } : {};
      if (hostnameFilter.value && hostnameFilter.value.trim() !== '') {
          current.hostname = hostnameFilter.value.trim();
      } else {
          delete current.hostname;
      }
      gridFilterModel.value = Object.keys(current).length > 0 ? current : null;
      targetPage.value = 1;
      loadPorts();
    }

    function resetFilters() {
        console.log('[Ports] Reset filters');
        hostnameFilter.value = '';
        onlyMonitored.value = false;
        gridFilterModel.value = null;
        targetPage.value = 1;
        try { window.__PORTS_INITIAL_FILTER__ = null; } catch (_) { /* noop */ }
        loadPorts();
    }

    // Show in modal details the same fields as those hidden in the grid
    const detailsColumns = ['ifIndex', 'status', 'port_id', 'hostname', 'name','description', 'adminStatus', 'operStatus', 'mtu', 'Speed','HighSpeed', 'PromiscuousMode', 'ConnectorPresent', 'in_octets', 'out_octets'];
    const hiddenDetails = computed(() => {
      const row = selectedPortRow.value || null;
      if (!row || typeof row !== 'object') return {};
      const result = {};
      for (const key of detailsColumns) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          result[key] = row[key];
        }
      }
      return result;
    });

    async function loadPortEvents() {
      const portId = selectedPortRow.value?.port_id;
      if (!portId) {
        eventsRows.value = [];
        return;
      }
      try {
        const { rows, page, pageSize, hasNextPage } = await getPortEventsByPortId(portId, {
          page: eventsPage.value,
          pageSize: eventsPageSize.value,
          status: eventsStatus.value || undefined,
          start_date: eventsStartDate.value || undefined,
          end_date: eventsEndDate.value || undefined,
        });
        eventsRows.value = rows || [];
        eventsHasNextPage.value = hasNextPage || false;
        eventsPage.value = page || 1;
        eventsPageSize.value = pageSize || 20;
        eventsTargetPage.value = eventsPage.value;
      } catch (error) {
        eventsRows.value = [];
        // eslint-disable-next-line no-console
        console.error('[PortEvents] Erreur lors du chargement:', error?.message || error );
      }
    }

    function onEventsFilterChanged() {
      eventsPage.value = 1;
      eventsTargetPage.value = 1;
      loadPortEvents();
    }

    function onEventsPageSizeChanged() {
      eventsPage.value = 1;
      eventsTargetPage.value = 1;
    }

    function changeEventsPage(p) {
      let page = Number(p) || 1;
      if (page < 1) page = 1;
      eventsPage.value = page;
      eventsTargetPage.value = page;
    }

    function jumpToEventsPage() {
      let page = Number(eventsTargetPage.value) || 1;
      if (page < 1) page = 1;
      eventsPage.value = page;
      eventsTargetPage.value = page;
    }

    async function handleUpdatePort(formData) {
      if (!editPortData.value.id) {
        console.error('[UpdatePort] No port ID found');
        return;
      }
      try {
        loading.value = true;
        await updatePort(editPortData.value.id, formData);
        showEditPortModal.value = false;
        editPortData.value = null;
        await loadPorts();
        console.log('[UpdatePort] Port updated successfully');
      } catch (error) {
        console.error('[UpdatePort] Failed:', error?.message || error);
        alert(`Failed to update port: ${error?.message || 'Unknown error'}`);
      } finally {
        loading.value = false;
      }
    }

    function handleCancelEdit() {
      showEditPortModal.value = false;
      editPortData.value = null;
    }

    function jumpToPage() {
        const total = Number(totalPagesDisplay.value) || 1;
        let page = Number(targetPage.value) || 1;
        if (page < 1) page = 1;
        if (page > total) page = total;
        targetPage.value = page;
    }

    function onCellContextMenu(event) {
        if (event && event.event && typeof event.event.preventDefault === 'function') {
            event.event.preventDefault();
        }
        const x = event?.event?.clientX ?? 0;
        const y = event?.event?.clientY ?? 0;
        const rowData = event?.data ?? null;
        MenuModule.showMenu({ x, y, rowData });
    }

    function getGridApi() {
      if (!agGridRef.value) return null;
      return agGridRef.value.api || agGridRef.value.gridApi || (agGridRef.value.getApi && agGridRef.value.getApi()) || null;
      }

      function getGridFilterModel() {
      try {
          if (!agGridRef.value) return {};
          if (typeof agGridRef.value.getFilterModel === 'function') return agGridRef.value.getFilterModel();
          const api = getGridApi();
          if (api && typeof api.getFilterModel === 'function') return api.getFilterModel();
      } catch (e) {
          console.warn('getGridFilterModel error', e);
      }
      return {};
    }

    function setGridFilterModel(model) {
      try {
          if (!agGridRef.value) return;
          if (typeof agGridRef.value.setFilterModel === 'function') {
          agGridRef.value.setFilterModel(model);
          }
          const api = getGridApi();
          if (api && typeof api.setFilterModel === 'function') {
          api.setFilterModel(model);
          api.onFilterChanged && api.onFilterChanged();
          api.refreshFilters && api.refreshFilters();
          api.refreshClientSideRowModel && api.refreshClientSideRowModel('filter');
          }
      } catch (e) {
          console.warn('setGridFilterModel error', e);
      }
    }

    function onFilterChanged(filterModel) {
      if (!filterModel || Object.keys(filterModel).length === 0) {
          gridFilterModel.value = null;
          return;
      }

      const mapped = {};
      for (const key in filterModel) {
          const f = filterModel[key];
          if (!f) continue;
          if (f.filter !== undefined && f.filter !== null && f.filter !== '') {
          mapped[key] = f.filter;
          continue;
          }
          if (Array.isArray(f.values) && f.values.length > 0) {
          mapped[key] = f.values;
          continue;
          }
      }

      gridFilterModel.value = Object.keys(mapped).length > 0 ? mapped : null;
    }

    async function applyFilters() {
    if (!agGridRef.value) {
        console.log('[ApplyFilters Ports] AgGrid ref non disponible');
        return;
    }

    const currentFilterModel = getGridFilterModel();
    console.log('[ApplyFilters Ports] Filtre actuel depuis AgGrid:', currentFilterModel);

    const filterFromGrid = {};
    for (const key in currentFilterModel) {
        const f = currentFilterModel[key];
        if (!f) continue;
        if (f.filter !== undefined && f.filter !== null && f.filter !== '') {
        filterFromGrid[key] = f.filter;
        } else if (Array.isArray(f.values) && f.values.length) {
        filterFromGrid[key] = f.values;
        }
    }

    const externalFilter = gridFilterModel.value && typeof gridFilterModel.value === 'object' ? gridFilterModel.value : {};
    const mergedFilter = { ...externalFilter, ...filterFromGrid };
    gridFilterModel.value = Object.keys(mergedFilter).length > 0 ? mergedFilter : null;
    targetPage.value = 1;
    await loadPorts();
    }

    async function clearFilters() {
        console.log('[ClearFilters Ports] Effacement des filtres...');
        gridFilterModel.value = null;
        targetPage.value = 1;
        setGridFilterModel(null);

        try {
            const api = getGridApi();
            if (api && typeof api.getFilterModel === 'function') {
            const curr = api.getFilterModel() || {};
            for (const colId of Object.keys(curr)) {
                try {
                const inst = api.getFilterInstance && api.getFilterInstance(colId);
                if (inst && typeof inst.setModel === 'function') {
                    inst.setModel(null);
                }
                } catch (inner) {
                // ignore per-filter errors
                }
            }
            api.setFilterModel && api.setFilterModel(null);
            api.onFilterChanged && api.onFilterChanged();
            api.refreshFilters && api.refreshFilters();
            }
        } catch (e) {
            console.warn('clearFilters: erreur en forçant reset ag-grid', e);
        }

        if (agGridRef.value && typeof agGridRef.value.setFilterModel === 'function') {
            try { agGridRef.value.setFilterModel(null); } catch (e) { /* noop */ }
        }
        await loadPorts();
    }


    onMounted(async () => {
        try {
          const initial = window.__PORTS_INITIAL_FILTER__ || null;
          if (initial && typeof initial === 'object') {
            if (initial.hostname) {
              hostnameFilter.value = String(initial.hostname);
            }
            gridFilterModel.value = { ...(gridFilterModel.value || {}), ...initial };
            targetPage.value = 1;
            window.__PORTS_INITIAL_FILTER__ = null;
          }
        } catch (_) { /* noop */ }
        await loadPorts();

        // sockets
        connectSocket({ url: 'http://localhost:3000' });
        onSocket('ports:bulk_update', async () => {
          await loadPorts();
        });
        onSocket('portEvents:created', async () => {
          if (showEventsModal.value && selectedPortRow.value?.port_id) {
            await loadPortEvents();
          }
        });
    });

    watch([() => targetPage.value, () => pageSize.value], async () => {
        await loadPorts();
    });

    onBeforeUnmount(() => {
      offSocket('ports:bulk_update');
      offSocket('portEvents:created');
      disconnectSocket();
    });

</script>

<style scoped>
</style>


