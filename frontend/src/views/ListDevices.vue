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
                <select v-model.number="pageSize" @change="onPageSizeChanged" class="form-control input-sm" style="display:inline-block;width:80px;margin:0 5px;">
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                </select>
                <span style="margin-right:6px;">entries |</span>
                <label class="form-label" style="margin-right:6px;">Go to page</label>
                <input type="number" min="1" v-model.number="targetPage" 
                        @change="jumpToPage" 
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
            :row-class-rules="rowClassRules"
            :page-size="pageSize"
            ref="agGridRef"
            @filter-apply="applyFilters"
            @cell-context-menu="onCellContextMenu"
            />
            <AgGridContextMenu :items="menuItems" />
        </div>
    </div>

    <CsvImport v-model="showImportDevices" :import-type="'devices'" @import="reloadGrid" />

    <!-- Device Events Modal -->
    <ModalComponent
        v-model="showEventsModal"
        :title="`Device events - ${selectedDeviceRow?.hostname || ''}`"
        :width="'min(1000px, 96vw)'"
    >
        <!-- Détails des champs masqués de l'équipement sélectionné -->
        <div class="device-details-block">
            <DetailsComponent :data="hiddenDetails" :max-lines="5" />
        </div>
        <eChartComponent
            :x="eventsChartX"
            :y="chartSeries"
            title="Latency"
            x-label="Time"
            y-label="ms"
            height="300px"
            :smooth=false
        />   
        <!-- Header -->
        <h4 class="events-section-title">Historic Events</h4>

        <!-- Toolbar -->
        <div class="events-toolbar" style="display:flex;gap:12px;align-items:center;margin-bottom:8px;">
        <label>Start
            <input type="datetime-local" v-model="eventsStartDate" @change="onEventsFilterChanged" />
        </label>
        <label>End
            <input type="datetime-local" v-model="eventsEndDate" @change="onEventsFilterChanged" />
        </label>
        <label>Page size
            <select v-model.number="eventsPageSize" @change="onEventsPageSizeChanged">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            </select>
        </label>
        <label>Status
            <select v-model="eventsStatus" @change="onEventsFilterChanged">
            <option value="">All</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
            </select>
        </label>
        <label>Go to page
            <input type="number" min="1" v-model.number="eventsTargetPage" 
                    @keyup.enter="jumpToEventsPage" 
                    class="form-control input-sm" 
                    style="display:inline-block;width:80px;margin-left:4px;" />
        </label>
        <button @click="loadDeviceEvents" class="btn btn-sm btn-primary" :disabled="loading">
            <span class="glyphicon glyphicon-refresh" :class="{ 'spinning': loading }"></span>
            Reload
        </button>
        </div>

        <!-- Grid -->
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
  </div>
</template>

<script setup>
    import CsvImport from '@/views/CsvImport.vue';
    import '@/assets/ListDevices.css';
    import '@/assets/Loading.css';
    import '@/assets/AgGrid.css';
    import CardNavbar from '@/components/CardNavbar.vue';
    import AgGridModule from '@/components/AgGridModule.vue';
    import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
    import { connect as connectSocket, disconnect as disconnectSocket, on as onSocket, off as offSocket } from '@/services/devices/deviceSocket';
    import { getCachedDevices } from '@/services/devices/devices';   
    import { getTypeDevicesCounts } from '@/services/type devices/typeDevices';   
    import { formatDate, stringifyStatusValue, badgeContainer, superposeValue} from '@/services/utils/utils';
    import AgGridContextMenu from '@/components/AgGridContextMenu.vue';
    import MenuModule from '@/modules/AgGridModule';
    import ModalComponent from '@/components/ModalComponent.vue';
    import eChartComponent from '@/components/eChartComponent.vue';
    import { getDeviceEventsByDeviceId } from '@/services/devices/deviceEvents';
    import DetailsComponent from '@/components/DetailsComponent.vue';

    const customDevices = ref([]);
    const deviceNav = ref(null);
    const selectedDevice = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const lastUpdated = ref(null);

    const columns = ref([]);
    const rows = ref([]);
    const allRows = ref([]);
    const pageSize = ref(20);
    const agGridRef = ref(null);
    const targetPage = ref(1);
    const totalPagesDisplay = ref(1);
    const totalCountDisplay = ref(0);
    const showImportDevices = ref(false);
    const showEventsModal = ref(false);
    const selectedDeviceRow = ref(null);
    const eventsRows = ref([]);
    const eventsPage = ref(1);
    const eventsPageSize = ref(20);
    const eventsStartDate = ref('');
    const eventsEndDate = ref('');
    const eventsStatus = ref('');
    const eventsHasNextPage = ref(false);
    const eventsTargetPage = ref(1);

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
    sortedEvents.value.map(r => r?.event_time ? formatDate(r.event_time, 'HH:mm:ss') : '')
    );

    const chartSeries = computed(() => {
        const threshold = Number( process.env.VUE_PING_LOSS_THRESHOLD || 10)
        const length = sortedEvents.value.length
        const thresholdLine = Array.from({ length }, () => threshold)
        return [
    { name: 'AVG',  data: sortedEvents.value.map(r => Number(r?.avg ?? 0)) },
    { name: 'MIN',  data: sortedEvents.value.map(r => Number(r?.min ?? 0)) },
    { name: 'MAX',  data: sortedEvents.value.map(r => Number(r?.max ?? 0)) },
    { name: 'LOSS', data: sortedEvents.value.map(r => Number(r?.loss ?? 0)) },
            { name: `UP THRESH (${threshold}%)`, data: thresholdLine }
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
            label: 'Edit',
            icon: 'glyphicon glyphicon-pencil',
            action: (row) => {
                // eslint-disable-next-line no-console
                console.log('[Action] Edit row:', row);
            }
        },
        {
            id: 'delete',
            label: 'Delete',
            icon: 'glyphicon glyphicon-trash',
            action: (row) => {
                // eslint-disable-next-line no-console
                console.log('[Action] Delete row:', row);
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
                showEventsModal.value = true;
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
            eventsRows.value = [];
            console.error('[DeviceEvents] Erreur lors du chargement:', error?.message || error );
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

            customDevices.value = types.map(t => ({
                name: t.type_device || t.name,
                value: t.total_devices || 0,
                length: t.down_devices || 0,
            }));
        } catch (err) {
            error.value = err.message;
            console.error('[LoadTypeDevices] Erreur lors du chargement:', err);
        } finally {
            loading.value = false;
            lastUpdated.value = new Date();
        }
    }


    // Load data
    async function loadDevices() {
        error.value = null;
        loading.value = true;
        try {
            console.log('[LoadDevices] Loading cached devices...');
            const devices = await getCachedDevices();

            totalCountDisplay.value = Array.isArray(devices) ? devices.length : 0;
            allRows.value = Array.isArray(devices) ? devices : [];

            generateColumns(allRows.value);
            rows.value = allRows.value;

            totalPagesDisplay.value = Math.max(1, Math.ceil(totalCountDisplay.value / pageSize.value));
        } catch (err) {
            error.value = err.message;
            console.error('[LoadDevices] Erreur lors du chargement:', err);
        } finally {
            loading.value = false;
            lastUpdated.value = new Date();
        }
    }

    function updateCountsFromGrid() {
        const api = agGridRef.value?.getGridApi?.()
        if (api && typeof api.getDisplayedRowCount === 'function') {
            const displayed = api.getDisplayedRowCount()
            totalCountDisplay.value = displayed
            totalPagesDisplay.value = Math.max(1, Math.ceil(displayed / (Number(pageSize.value) || 20)))
        } else {
            totalCountDisplay.value = rows.value?.length || 0
            totalPagesDisplay.value = Math.max(1, Math.ceil(totalCountDisplay.value / (Number(pageSize.value) || 20)))
        }
    }

    function onPageSizeChanged() {
        const grid = agGridRef.value?.getGridApi?.()
        if (grid && typeof grid.paginationSetPageSize === 'function') {
            grid.paginationSetPageSize(Number(pageSize.value) || 20)
        }
        updateCountsFromGrid()
    }

    function jumpToPage() {
        const total = Number(totalPagesDisplay.value) || 1;
        let page = Number(targetPage.value) || 1;
        if (page < 1) page = 1;
        if (page > total) page = total;
        targetPage.value = page;
        const grid = agGridRef.value?.getGridApi?.()
        if (grid && typeof grid.paginationGoToPage === 'function') {
            grid.paginationGoToPage(page - 1)
        }
    }

    function applyFilters() {
        updateCountsFromGrid()
    }

    async function handleDeviceSelect(device, index) {
        selectedDevice.value = device;
        const api = agGridRef.value?.getGridApi?.()
        if (!device || index < 0) {
            if (api) {
                api.setFilterModel(null)
                api.setQuickFilter('')
                api.onFilterChanged?.()
            }
            updateCountsFromGrid()
            return;
        }

        // Prefer column filter on 'type_device' when present; fallback to quick filter
        const hasTypeCol = (columns.value || []).some(col => col.field === 'type_device')
        if (api && hasTypeCol) {
            const current = api.getFilterModel?.() || {}
            const next = {
                ...current,
                type_device: { filterType: 'text', type: 'contains', filter: device.name }
            }
            api.setFilterModel(next)
            api.onFilterChanged?.()
        } else if (api) {
            api.setQuickFilter(device.name || '')
            api.onFilterChanged?.()
        }
        updateCountsFromGrid()
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
        console.log('[Socket] gridApi:', agGridRef.value.getGridApi?.());
        console.log('CardNavbar ref:', deviceNav.value);
        await loadDevices();
        await loadTypeDevices();

        connectSocket({
            url: "http://localhost:3000"
        });

        const handleBulkUpdate = async (ids) => {
            try {
                console.log('[Socket] devices:bulk_update ids:', ids)
                await loadDevices()
            } catch (e) {
                console.error('[BulkUpdate] reload failed:', e?.message || e)
            }
        }
        onSocket('devices:bulk_update', handleBulkUpdate)

        onSocket('deviceEvents:created', async (payload) => {
            const currentDeviceId = selectedDeviceRow.value?.id;
            if (!currentDeviceId) return;
            if (!payload?.device_id || Number(payload.device_id) === Number(currentDeviceId)) {
                await loadDeviceEvents();
            }
        });
    });

    onBeforeUnmount(() => {
        offSocket('devices:bulk_update');
        disconnectSocket();
    });

    // Watchers no longer trigger server fetch; keep for UI reactions
    watch(selectedDevice, (newDevice) => {
        if (!newDevice) {
            // clear external filter reference
        }
    });

    // Update total pages display when page size changes
    watch(() => pageSize.value, () => {
        totalPagesDisplay.value = Math.max(1, Math.ceil(totalCountDisplay.value / pageSize.value));
    });

    // Events pagination watchers remain server-based
    watch([() => eventsPage.value, () => eventsPageSize.value], async () => {
        if (selectedDeviceRow.value?.id) {
            await loadDeviceEvents();
        }
    });
    
</script>