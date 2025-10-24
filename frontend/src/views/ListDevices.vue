<template>
  <div class="list-devices-page">
    <div class="sub-navbar">
        <div class="nav nav-tabs">
            <h5 class="text-uppercase" style="color:#ecf0f1; gap:12px;">
                <span class="glyphicon glyphicon-triangle-right" aria-hidden="true" style="margin-right: 6px;"></span>
                <span>Type Devices</span>
                <span class="label label-primary" title="Nombre de types">{{ totalTypes }}</span>
            </h5>
        </div>
    </div>
    <CardNavbar
        :items="customDevices"
        :initial-visible-cards="4"
        :card-width-percent="12"
        :card-min-width="100"
        @device-selected="handleDeviceSelect"
        @navigation-changed="handleNavigationChange"
        ref="deviceNav"
    />
    <div class="sub-navbar">
        <div class="nav nav-tabs">
            <h5 class="text-uppercase" style="color: #ecf0f1; gap:12px;">
                <span class="glyphicon glyphicon-triangle-right" aria-hidden="true" style="margin-right: 6px;"></span>
                <span>Devices list</span>
                <span class="label label-primary" title="Total devices">{{ totalCountDisplay }}</span>
            </h5>
        </div>
    </div>

    <div class="content-wrapper">
        <div class="filter-section">
            <div class="row" style="align-items:center;">
                
                <!-- Bloc gauche -->
                <div class="col-md-6">
                <label class="form-label">Show</label>
                <select v-model.number="pageSize" class="form-control input-sm" style="display:inline-block;width:80px;margin:0 5px;">
                    <option :value="10">10</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                </select>
                <span style="margin-right:6px;">entries |</span>
                <label class="form-label" style="margin-right:6px;">Go to page</label>
                <input type="number" min="1" :max="totalPagesDisplay" v-model.number="targetPage" 
                        @keyup.enter="jumpToPage" 
                        class="form-control input-sm" 
                        style="display:inline-block;width:80px;margin-right: 6px;" />
                <span class="form-label">/ {{ totalPagesDisplay }}</span>
                </div>
                
                <!-- Bloc droite -->
                <div class="col-md-6 text-right">
                <div class="btn-group" role="group" style="gap:8px;">
                    <button @click="showImportDevices = true" class="btn btn-sm btn-primary" style="margin-right: 8px;">
                    <span class="glyphicon glyphicon-upload"></span>
                    Import CSV
                    </button>
                    <button @click="reloadGrid" class="btn btn-sm btn-info" :disabled="loading">
                    <span class="glyphicon glyphicon-refresh" :class="{ 'spinning': loading }"></span>
                    Reload
                    </button>
                </div>
                </div>

            </div>
        </div>

        <div class="app-container" @contextmenu.prevent>
            <AgGridModule
            grid-id="devices-grid"
            :column-defs="columns"
            :row-data="rows"
            :filter-model="gridFilterModel"
            :row-class-rules="rowClassRules"
            ref="agGridRef"
            @filter-changed="onFilterChanged"
            @filter-apply="applyFilters"
            @filter-reset="clearFilters"
            @cell-context-menu="onCellContextMenu"
            />
            <AgGridContextMenu :items="menuItems" />
        </div>
    </div>

    <CsvImport v-model="showImportDevices" :import-type="'devices'" @import="reloadGrid" />

    <!-- DETAILS DEVICE MODAL -->
    <ModalComponent
        v-model="showEventsModal"
        :title="`Device details - ${selectedDeviceRow?.hostname || ''}`"
        :width="'min(1000px, 96vw)'"
    >
        <!-- Détails des champs masqués de l'équipement sélectionné -->
        <div class="device-details-block">
            <DetailsComponent :data="hiddenDetails" />
        </div>
        <!-- Cards grid (modular) -->
        <CardModalComponent
            title="All ports"
            :data="portsCards"
            toggle-label="Monitoring"
            @toggle="onToggleItem"
            @action="onActionItem"
        >
          <template #header-actions>
            <button v-if="pendingCount > 0" type="button" class="btn btn-success btn-xs" @click="validatePortToggles">
              <span class="glyphicon glyphicon-ok"></span>
              Validate
            </button>
          </template>
        </CardModalComponent>

        <div class="events-header">
            <h3 class="events-section-title">Ping results variations</h3>
            <select v-model="selectedMetric" class="metric-select">
                <option value="latency">Latency</option>
                <option value="loss">Loss</option>
            </select>
        </div>
        <eChartComponent
            :x="eventsChartX"
            :y="chartSeries"
            :title="chartTitle"
            x-label="Time"
            y-label="ms"
            height="300px"
            :smooth=false
            :x-label-interval="0"
            :y-interval="30"
            :enable-zoom="true"
            :data-zoom="[
              { type: 'inside', xAxisIndex: 0, filterMode: 'weakFilter' },
              { type: 'slider', xAxisIndex: 0, height: 18, bottom: 8 }
            ]"
        />

        <h3 class="events-section-title">Historic Events</h3>

        <!-- Toolbar -->
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
          <div style="margin-left:auto;flex-direction:column;display:flex;gap:4px;">
            <div style="display:flex;gap:8px;">
              <button @click="loadDeviceEvents" class="btn btn-primary btn-sm" :disabled="loading">
                <span class="glyphicon glyphicon-refresh" :class="{ 'spinning': loading }"></span>
              </button>
              <button @click="openExportModal" class="btn btn-success btn-sm" :disabled="!selectedDeviceRow?.id">
                <span class="glyphicon glyphicon-export"></span>
                Export
              </button>
            </div>
          </div>
        </div>

        <!-- Events AgGrid -->
        <div v-if="eventsRows.length === 0" style="padding:8px 0;">No events</div>
        <AgGridModule
            v-else
            grid-id="device-events-modal-grid"
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

    <!-- EXPORT REPORT MODAL -->
    <ModalComponent
        v-model="showExportModal"
        :title="'Export device history'"
        :width="'max(520px, 36vw)'"
        :maxHeight="'60vh'"
    >
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="form-group" style="display:flex;flex-direction:column;gap:4px;">
          <label class="control-label" style="font-size:12px;color:#64748b;">Start date</label>
          <input type="datetime-local" v-model="exportStartDate" class="form-control input-sm" />
        </div>
        <div class="form-group" style="display:flex;flex-direction:column;gap:4px;">
          <label class="control-label" style="font-size:12px;color:#64748b;">End date</label>
          <input type="datetime-local" v-model="exportEndDate" class="form-control input-sm" />
        </div>
        <div class="form-group" style="display:flex;flex-direction:column;gap:4px;">
          <label class="control-label" style="font-size:12px;color:#64748b;">Filename</label>
          <input type="text" v-model="exportFilename" placeholder="device-report.csv" class="form-control input-sm" />
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:6px;">
          <button class="btn btn-default btn-sm" @click="showExportModal = false">Cancel</button>
          <button class="btn btn-success btn-sm" :disabled="isExportDisabled" @click="exportReporting">
            <span class="glyphicon glyphicon-download"></span>
            Export CSV
          </button>
        </div>
      </div>
    </ModalComponent>

    <!-- EDIT DEVICE MODAL -->
    <ModalComponent
        v-model="showEditDeviceModal"
        :title="`Update Device - ${editDeviceData?.hostname || ''}`"
        :width="'min(800px, 96vw)'"
        :maxHeight="'80vh'"
    >
        <FormComponent
            v-if="editDeviceData"
            :form-title="'Device Information'"
            :inputs="deviceFormInputs"
            :buttons="deviceFormButtons"
            :initial-data="editDeviceData"
            @submit="handleUpdateDevice"
            @cancel="handleCancelEdit"
        />
    </ModalComponent>
  </div>
</template>

<script setup>
    import CsvImport from '@/views/CsvImport.vue';
    import '@/assets/ListDevices.css';
    import '@/assets/Loading.css';
    import '@/assets/AgGrid.css';
    import '@/assets/App.css';
    import CardNavbar from '@/components/CardNavbar.vue';
    import AgGridModule from '@/components/AgGridModule.vue';
    import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
    import { connect as connectSocket, disconnect as disconnectSocket, on as onSocket, off as offSocket } from '@/services/devices/deviceSocket';
    import { getLimitedDevices, getPortsDevice, exportDeviceReportingCsv, updateDevice } from '@/services/devices/devices';   
    import { switchPortMonitored } from '@/services/ports/ports';
    import { getTypeDevicesCounts } from '@/services/type devices/typeDevices';   
    import { formatDate, formatDateMinuteSecond, stringifyStatusValue, badgeContainer, superposeValue} from '@/services/utils/utils';
    import AgGridContextMenu from '@/components/AgGridContextMenu.vue';
    import MenuModule from '@/modules/AgGridModule';
    import ModalComponent from '@/components/ModalComponent.vue';
    import eChartComponent from '@/components/eChartComponent.vue';
    import { getDeviceEventsByDeviceId } from '@/services/devices/deviceEvents';
    import DetailsComponent from '@/components/DetailsComponent.vue';
    import CardModalComponent from '@/components/CardModalComponent.vue';
    import FormComponent from '@/components/FormComponent.vue';

    const customDevices = ref([]);
    const deviceNav = ref(null);
    const selectedDevice = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const lastUpdated = ref(null);
    const lastSocketUpdate = ref(null);

    const columns = ref([]);
    const rows = ref([]);
    const pageSize = ref(10);
    const gridFilterModel = ref(null);
    const agGridRef = ref(null);
    const targetPage = ref(1);
    const totalPagesDisplay = ref(1);
    const totalCountDisplay = ref(0);
    const showImportDevices = ref(false);
    const showEventsModal = ref(false);
    const showEditDeviceModal = ref(false);
    const selectedDeviceRow = ref(null);
    const editDeviceData = ref(null);
    const eventsRows = ref([]);
    const portsCards = ref([]);
    const pendingToggles = ref(new Map());
    const pendingCount = computed(() => pendingToggles.value.size);
    const selectedMetric = ref('latency');
    const eventsPage = ref(1);
    const eventsPageSize = ref(20);
    const eventsStartDate = ref('');
    const eventsEndDate = ref('');
    const eventsStatus = ref('');
    const eventsHasNextPage = ref(false);
    const eventsTargetPage = ref(1);
    const showExportModal = ref(false);
    const exportStartDate = ref('');
    const exportEndDate = ref('');
    const exportFilename = ref('device-report.csv');
    const isExportDisabled = computed(() => {
        return !selectedDeviceRow.value?.id || !exportStartDate.value || !exportEndDate.value || !exportFilename.value;
    });

    // Device form inputs based on device.model.js
    const deviceFormInputs = ref([
        { field: 'hostname', title: 'Hostname', type: 'text', required: true, maxLength: 50 },
        { field: 'ip', title: 'IP Address', type: 'text', maxLength: 30 },
        { field: 'sysName', title: 'System Name', type: 'text', maxLength: 200 },
        { field: 'ne_id', title: 'NE ID', type: 'text', maxLength: 45 },
        { field: 'codesite', title: 'Code Site', type: 'text', maxLength: 45 },
        { field: 'snmp_disable', title: 'SNMP Disabled', type: 'checkbox', checkboxLabel: 'Disable SNMP monitoring' },
        { field: 'community', title: 'SNMP Community', type: 'text', helpText: 'SNMP v1/v2c community string' },
        { field: 'snmpver', title: 'SNMP Version', type: 'select', options: [
            { label: 'v1', value: 'v1' },
            { label: 'v2c', value: 'v2c' },
            { label: 'v3', value: 'v3' }
        ]},
        { field: 'authlevel', title: 'Auth Level (v3)', type: 'select', options: [
            { label: 'noAuthNoPriv', value: 'noAuthNoPriv' },
            { label: 'authNoPriv', value: 'authNoPriv' },
            { label: 'authPriv', value: 'authPriv' }
        ]},
        { field: 'authname', title: 'Auth Name (v3)', type: 'text' },
        { field: 'authpass', title: 'Auth Password (v3)', type: 'password' },
        { field: 'authalgo', title: 'Auth Algorithm (v3)', type: 'select', options: [
            { label: 'MD5', value: 'MD5' },
            { label: 'SHA', value: 'SHA' },
            { label: 'SHA512', value: 'SHA512' }
        ]},
        { field: 'cryptopass', title: 'Crypto Password (v3)', type: 'password' },
        { field: 'cryptoalgo', title: 'Crypto Algorithm (v3)', type: 'select', options: [
            { label: 'AES', value: 'AES' }
        ]}
    ]);

    const deviceFormButtons = ref([
        { label: 'Cancel', type: 'button', class: 'btn-default', action: 'cancel' },
        { label: 'Update Device', type: 'submit', class: 'btn-primary', icon: 'glyphicon glyphicon-ok', action: 'submit' }
    ]);

    const eventColumns = ref([
      { headerName: 'Status', field: 'status', minWidth: 80 },
      { headerName: 'Loss %', field: 'loss', minWidth: 80, valueFormatter: params => params.value ?? 0 },
      { headerName: 'Avg', field: 'avg', minWidth: 80 },
      { headerName: 'Min', field: 'min', minWidth: 80 },
      { headerName: 'Max', field: 'max', minWidth: 80 },
      { headerName: 'Date', field: 'event_time', valueFormatter: params => formatDate(params.value, 'YYYY-MM-DD HH:mm:ss'), minWidth: 180 },

    ]);
    
    // Données pour le graphique des événements (x: event_time, y: avg)
    const sortedEvents = computed(() =>
    (eventsRows.value || []).slice().sort((a, b) => new Date(a.event_time) - new Date(b.event_time))
    );

    const eventsChartX = computed(() =>
    sortedEvents.value.map(r => r?.event_time ? formatDateMinuteSecond(r.event_time) : '')
    );

    const chartTitle = computed(() => {
        return selectedMetric.value === 'latency' ? 'Latency' : 'Loss'
    });


    const chartSeries = computed(() => {
        const threshold = Number( process.env.VUE_PING_LOSS_THRESHOLD || 10)
        const length = sortedEvents.value.length
        const thresholdLine = Array.from({ length }, () => threshold)
        if (selectedMetric.value === 'loss') {
            return [
                { name: 'LOSS', data: sortedEvents.value.map(r => Number(r?.loss ?? 0)) },
                { name: `UP THRESH (${threshold}%)`, data: thresholdLine }
            ]
        }
        return [
            { name: 'AVG',  data: sortedEvents.value.map(r => Number(r?.avg ?? 0)) },
            { name: 'MIN',  data: sortedEvents.value.map(r => Number(r?.min ?? 0)) },
            { name: 'MAX',  data: sortedEvents.value.map(r => Number(r?.max ?? 0)) },
        ]
    });


    const detailsColumns = ['device_id', 'hostname', 'sysName', 'snmp_disable', 'community', 'authlevel', 'authname', 'authalgo', 'snmpver'];
    const hiddenDetails = computed(() => {
        const row = selectedDeviceRow.value || null;
        if (!row || typeof row !== 'object') return {};
        const result = {};
        for (const key of detailsColumns) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
                result[key] = row[key];
            }
        }
        return result;
    });

    const menuItems = ref([
        {
            id: 'edit',
            label: 'Update',
            icon: 'glyphicon glyphicon-pencil',
            action: (row) => {
                console.log('[Action] Edit row:', row);
                editDeviceData.value = { ...row };
                showEditDeviceModal.value = true;
            }
        },
        {
            id: 'details',
            label: 'Details',
            icon: 'glyphicon glyphicon-info-sign',
            action: async (row) => {
                selectedDeviceRow.value = row;
                eventsPage.value = 1;
                await loadDeviceEvents();
                await loadDevicePorts();
                showEventsModal.value = true;
            }
        },
        {
            id: 'export',
            label: 'Export History',
            icon: 'glyphicon glyphicon-export',
            action: async (row) => {
                selectedDeviceRow.value = row;
                showExportModal.value = true;
            }
        },
        {
            id: 'reporting',
            label: 'Overview',
            icon: 'glyphicon glyphicon-stats',
            action: async (row) => {
                try {
                    if (typeof window.__SET_ACTIVE_VIEW__ === 'function') {
                        window.__SET_ACTIVE_VIEW__('reporting-device');
                    }
                    // Store device info for reporting page
                    window.__REPORTING_DEVICE_INFO__ = {
                        device_id: row.id,
                        hostname: row.hostname,
                        sysName: row.sysName,
                        location: row.location,
                        type: row.type_device,
                        status: row.ping_status
                    };
                } catch (e) {
                    console.error('Error switching to reporting view:', e);
                }
            }
        }
    ]);

    const totalTypes = computed(() => customDevices.value?.length || 0);
    const rowClassRules = {
    'up-row': params => params.data?.ping_status == 1,
    'down-row': params => params.data?.ping_status == 0,
    'row-default': params => params.data?.ping_status === null
    };

    // Fonction réutilisable pour générer les colonnes
    function generateColumns(devices) {
            const columnsToHide = ['id', 'hostname', 'sysName', 'status', 'uptime', 'ping_status', 'device_id', 'snmp_disable', 'community', 'authlevel', 'authname', 'authalgo', 'cryptopass', 'cryptoalgo', 'snmpver'];

            const sample = devices[0] || {};
            const keys = Object.keys(sample || {});
            const visibleKeys = keys.filter(key => !columnsToHide.includes(key));

            const otherColumns = visibleKeys
                .filter(key => !['hostname', 'sysName', 'sysname'].includes(key))
                .map(key => ({
                    headerName: key.replace(/_/g, ' ').toUpperCase(),
                field: key,
                filter: 'agTextColumnFilter',
                filterParams: {
                    filterOptions: ['contains', 'startsWith', 'endsWith', 'equals'],
                    defaultOption: 'contains'
                }
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
                        minWidth: 200,
                    filter: 'agTextColumnFilter',
                    filterParams: {
                        filterOptions: ['contains', 'startsWith', 'endsWith', 'equals'],
                        defaultOption: 'contains'
                    },
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
                        headerName: 'UPTIME',
                        colId: 'uptime',
                        width: 180,
                        minWidth: 180,
                    filter: 'agTextColumnFilter',
                    filterParams: {
                        filterOptions: ['contains', 'startsWith', 'endsWith', 'equals'],
                        defaultOption: 'contains'
                    },
                        valueGetter: (params) => {
                            if (!params.data?.uptime) return '';
                            return formatDate(params.data?.uptime, 'YYYY-MM-DD HH:mm:ss');
                        }
                    },
                    {
                        headerName: 'STATUS',
                        colId: 'ping_status',
                        autoHeight: true,
                        width: 120,
                        minWidth: 120,
                    filter: 'agTextColumnFilter',
                    filterParams: {
                        filterOptions: ['contains', 'startsWith', 'endsWith', 'equals'],
                        defaultOption: 'contains'
                    },
                        valueGetter: (params) => {
                            return stringifyStatusValue(params.data?.ping_status);
                        },
                        cellRenderer: (params) => {
                            const value = stringifyStatusValue(params.data?.ping_status);
                            return badgeContainer(value);
                        }
                    }
                ];
                columns.value = [...deviceCol, ...otherColumns];
            } else {
                columns.value = otherColumns;
            }
    }


    // Load data
    async function loadDevices() {
        if (loading.value) {
            console.log('[LoadDevices] Déjà en cours de chargement, ignoré');
            return;
        }
        loading.value = true;
        error.value = null;
        try {
            console.log('[LoadDevices] Début du chargement des devices...');
            // Préparer le filtre à partir du modèle courant si disponible
            let filter = {};
            if (gridFilterModel.value && Object.keys(gridFilterModel.value).length > 0) {
                filter = { ...gridFilterModel.value };
            }
            const { rows: data, totalCount: fetchedTotalCount } = await getLimitedDevices({
                page: targetPage.value,
                pageSize: pageSize.value,
                filter,
            });
            console.log('Total devices:', fetchedTotalCount)

            // Update the component's state
            totalCountDisplay.value = fetchedTotalCount;
            totalPagesDisplay.value = Math.max(1, Math.ceil(fetchedTotalCount / pageSize.value));
            console.log('Total pages display:', totalPagesDisplay.value);
            const devices = Array.isArray(data) ? data : (data && data.data ? data.data : []);

            if (!Array.isArray(devices)) {
                throw new Error('Réponse inattendue du service devices');
            }

            generateColumns(devices);

            rows.value = devices;
        } catch (err) {
            error.value = err.message;
            console.error('[LoadDevices] Erreur lors du chargement:', err);
        } finally {
            loading.value = false;
            lastUpdated.value = new Date();
        }
    }

    // Load device events for the selected device
    async function loadDeviceEvents() {
        const deviceId = selectedDeviceRow.value?.id;
        if (!deviceId) {
            eventsRows.value = [];
            return;
        }
        try {
            const { rows, page, pageSize, hasNextPage } = await getDeviceEventsByDeviceId(deviceId, {
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
            console.log('[DeviceEvents] Chargement des événements:', eventsRows.value);
        } catch (error) {
            // eslint-disable-next-line no-console
            eventsRows.value = [];
            console.error('[DeviceEvents] Erreur lors du chargement:', error?.message || error );
        }
    }

    // Load device ports and map to card items
    async function loadDevicePorts() {
        const deviceId = selectedDeviceRow.value?.id;
        if (!deviceId) {
            portsCards.value = [];
            return;
        }
        try {
            const ports = await getPortsDevice(deviceId);
            portsCards.value = (ports || []).map(p => ({
                title: `${p.name} ${p.name ? `(Idx: ${p.ifIndex})` : ''}`,
                name: p.speed ? `${Math.ceil(p.speed / 1000000000)} Gbp/s` : undefined,
                type: p.type || '-',
                status: p.status === 'undefined' 
                    ? 'undefined'
                    : (p.status || '').toLowerCase() === 'up' 
                        ? 'up' 
                        : 'down',              
                enabled: p.isMonitored,
                port_id: p.port_id,
                __originalEnabled: p.isMonitored,
            }));
            pendingToggles.value.clear()
        } catch (error) {
            console.error('[DevicePorts] Erreur lors du chargement:', error?.message || error);
            portsCards.value = [];
        }
    }

    function openExportModal() {
        if (!selectedDeviceRow.value?.id) return;
        if (!exportStartDate.value) exportStartDate.value = '';
        if (!exportEndDate.value) exportEndDate.value = '';
        if (!exportFilename.value) exportFilename.value = 'device-report.csv';
        showExportModal.value = true;
    }

    async function exportReporting() {
        const deviceId = selectedDeviceRow.value?.id;
        if (!deviceId) return;
        if (isExportDisabled.value) return;
        try {
            await exportDeviceReportingCsv(deviceId, {
                start_date: exportStartDate.value,
                end_date: exportEndDate.value,
                filename: exportFilename.value
            });
            showExportModal.value = false;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[ExportReporting] Failed:', e?.message || e);
        }
    }

    function onToggleItem(payload) {
        const portId = payload?.item?.port_id
        if (portId == null) return
        const idx = portsCards.value.findIndex(p => p.port_id === portId)
        if (idx >= 0) portsCards.value[idx].enabled = !!payload.enabled
        const original = portsCards.value[idx]?.__originalEnabled
        if (original === payload.enabled) {
            pendingToggles.value.delete(portId)
        } else {
            pendingToggles.value.set(portId, !!payload.enabled)
        }
    }

    function onActionItem(payload) {
        const portId = payload?.item?.port_id;
        if (portId == null) return;
        try {
            const hostname = selectedDeviceRow.value?.hostname || '';
            if (hostname) {
                window.__PORTS_INITIAL_FILTER__ = { hostname };
            } else {
                window.__PORTS_INITIAL_FILTER__ = null;
            }
        } catch (e) {
            // noop
        }
        try {
            if (typeof window.__SET_ACTIVE_VIEW__ === 'function') {
                window.__SET_ACTIVE_VIEW__('ports');
            }
        } catch (e) {
            // noop
        }
    }

    async function validatePortToggles() {
        const updates = Array.from(pendingToggles.value.entries())
        if (updates.length === 0) return
        try {
            await Promise.all(updates.map(([portId, isMonitored]) => switchPortMonitored(portId, isMonitored)))
            pendingToggles.value.clear()
            await loadDevicePorts()
        } catch (e) {
            console.error('[ValidatePortToggles] Failed:', e?.message || e)
        }
    }

    function onEventsFilterChanged() {
        eventsPage.value = 1;
        eventsTargetPage.value = 1;
        loadDeviceEvents();
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
        // Le watcher se chargera de recharger les données
    }

    async function handleUpdateDevice(formData) {
        if (!editDeviceData.value?.id) {
            console.error('[UpdateDevice] No device ID found');
            return;
        }
        try {
            loading.value = true;
            await updateDevice(editDeviceData.value.id, formData);
            showEditDeviceModal.value = false;
            editDeviceData.value = null;
            await loadDevices();
            console.log('[UpdateDevice] Device updated successfully');
        } catch (error) {
            console.error('[UpdateDevice] Failed:', error?.message || error);
            alert(`Failed to update device: ${error?.message || 'Unknown error'}`);
        } finally {
            loading.value = false;
        }
    }

    function handleCancelEdit() {
        showEditDeviceModal.value = false;
        editDeviceData.value = null;
    }

    async function loadTypeDevices() {
        loading.value = true;
        error.value = null;
        try {
            console.log('[LoadTypeDevices] Début du chargement des types devices (avec compteurs)...');
            const data = await getTypeDevicesCounts();
            const types = Array.isArray(data) ? data : (data && data.data ? data.data : []);

            if (!Array.isArray(types)) {
                throw new Error('Réponse inattendue du service type devices');
            }
            console.log('[LoadTypeDevices] Types:', types);

            // data attendu du backend: [{ type_device_id, type_device, total_devices, down_devices }]
            customDevices.value = types.map(t => ({
                name: t.type_device || t.name,
                value: t.total_devices || 0,
                length: t.down_devices || 0,
            }));

            // Sélectionner automatiquement le "router" par défaut
            const routerDevice = customDevices.value.find(device => 
                device.name && device.name.toLowerCase().includes('router')
            );
            if (routerDevice) {
                selectedDevice.value = routerDevice;
                // Appliquer le filtre pour le router
                const filterModel = columns.value.some(col => col.field === 'type_device')
                    ? { type_device: { filter: routerDevice.name } }
                    : { key: { filter: routerDevice.name } };
                onFilterChanged(filterModel);
                await applyFilters();
            }
        } catch (err) {
            error.value = err.message;
            console.error('[LoadTypeDevices] Erreur lors du chargement:', err);
        } finally {
            loading.value = false;
            lastUpdated.value = new Date();
        }
    }

    // Gestion des événements
    async function handleDeviceSelect(device, index) {
        // Ne pas permettre la désélection complète
        if (!device || index < 0) {
            console.log('Sélection de device invalide, ignorée');
            return;
        }
        
        selectedDevice.value = device;
        console.log('Appareil sélectionné:', device.name, 'Index:', index);
        
        // Filtrer par type_device si la colonne existe
        const filterModel = columns.value.some(col => col.field === 'type_device')
            ? { type_device: { filter: device.name } }
            : { key: { filter: device.name } };

        // Appliquer via les hooks standard
        onFilterChanged(filterModel);
        await applyFilters();
    }

    function handleNavigationChange(currentIndex, maxIndex) {
        console.log('Navigation:', currentIndex, '/', maxIndex);
    }

    function onFilterChanged(filterModel) {
        // Synchroniser AgGrid avec le modèle fourni (ou le vider si null)
        if (agGridRef.value) {
            agGridRef.value.setFilterModel(filterModel || null);
        }

        // Si pas de modèle, on efface le filtre côté backend
        if (!filterModel || Object.keys(filterModel).length === 0) {
            console.log('[onFilterChanged] Aucun filtre, réinitialisation.');
            gridFilterModel.value = null;
            return;
        }

        // Convertir le modèle de filtre AgGrid en format compatible avec le backend
        const filter = {};
        for (const key in filterModel) {
            const f = filterModel[key];
            if (f && typeof f === 'object' && 'filter' in f && f.filter !== undefined && f.filter !== null && f.filter !== '') {
                filter[key] = f.filter;
            }
        }

        const newFilter = Object.keys(filter).length > 0 ? filter : null;
        console.log('[onFilterChanged] Filtre synchronisé:', newFilter);
        gridFilterModel.value = newFilter;
    }


    async function applyFilters() {
        if (!agGridRef.value) {
            console.log('[ApplyFilters] AgGrid ref non disponible');
            return;
        }

        if (!selectedDevice.value) {
            console.log('[ApplyFilters] Aucun device sélectionné, impossible d\'appliquer les filtres');
            return;
        }

        const currentFilterModel = agGridRef.value.getFilterModel();
        console.log('[ApplyFilters] Filtre actuel depuis AgGrid:', currentFilterModel);

        const filterFromGrid = {};
        for (const key in currentFilterModel) {
            const f = currentFilterModel[key];
            if (f && f.filter !== undefined && f.filter !== null && f.filter !== '') {
                filterFromGrid[key] = f.filter;
            }
        }

        const deviceFilter = columns.value.some(col => col.field === 'type_device')
            ? { type_device: { filter: selectedDevice.value.name } }
            : { key: { filter: selectedDevice.value.name } };

        const deviceFilterBackend = {};
        for (const key in deviceFilter) {
            const f = deviceFilter[key];
            if (f && f.filter !== undefined && f.filter !== null && f.filter !== '') {
                deviceFilterBackend[key] = f.filter;
            }
        }

        const finalFilter = { ...deviceFilterBackend, ...filterFromGrid };
        console.log('[ApplyFilters] Application des filtres (device + grille):', finalFilter);
        gridFilterModel.value = finalFilter;
        await loadDevices();
    }

    async function clearFilters() {
        console.log('[ClearFilters] Effacement des filtres...');
        
        if (!selectedDevice.value) {
            console.log('[ClearFilters] Aucun device sélectionné, impossible d\'effacer les filtres');
            return;
        }
        
        gridFilterModel.value = null;
        if (agGridRef.value) {
            agGridRef.value.setFilterModel(null);
        }
        await loadDevices();
    }

    async function reloadGrid() {
        console.log('[ReloadGrid] Rechargement des données...');
        await loadDevices();
        await loadTypeDevices();
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

    
    onMounted(async () => {
        console.log('CardNavbar ref:', deviceNav.value);
        await loadTypeDevices();
        await loadDevices();

        connectSocket({
            url: "http://localhost:3000"
        });

        onSocket('devices:bulk_update', async () => {
            const now = Date.now();
            if (lastSocketUpdate.value && (now - lastSocketUpdate.value) < 1000) {
                console.log('[Socket] Ignore bulk_update (trop fréquent)');
                return;
            }
            lastSocketUpdate.value = now;
            await loadDevices();
        });

        onSocket('deviceEvents:created', async (payload) => {
            const currentDeviceId = selectedDeviceRow.value?.id;
            if (!currentDeviceId) return;
            if (!payload?.device_id || Number(payload.device_id) === Number(currentDeviceId)) {
                await loadDeviceEvents();
            }
        });
    });

    onBeforeUnmount(() => {
        offSocket('devices:updated');
        offSocket('deviceEvents:created');
        disconnectSocket();
    });

    // Watcher pour la pagination des devices
    watch([() => targetPage.value, () => pageSize.value], async () => {
        await loadDevices();
    });

    // Watcher pour la pagination des historiques
    watch([() => eventsPage.value, () => eventsPageSize.value, () => selectedMetric.value ], async () => {
        if (selectedDeviceRow.value?.id) {
            await loadDeviceEvents();
        }
    });
    
</script>