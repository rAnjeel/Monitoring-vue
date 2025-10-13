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
    import { getLimitedDevices } from '@/services/devices/devices';   
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


    // Load data
    async function loadDevices() {
        // Éviter les appels simultanés
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

    function onEventsFilterChanged() {
        eventsPage.value = 1;
        eventsTargetPage.value = 1;
        loadDeviceEvents();
    }

    function onEventsPageSizeChanged() {
        eventsPage.value = 1;
        eventsTargetPage.value = 1;
        // Le watcher se chargera de recharger les données
    }

    function changeEventsPage(p) {
        let page = Number(p) || 1;
        if (page < 1) page = 1;
        eventsPage.value = page;
        eventsTargetPage.value = page; // Synchroniser l'input
        // Le watcher se chargera de recharger les données
    }

    function jumpToEventsPage() {
        let page = Number(eventsTargetPage.value) || 1;
        if (page < 1) page = 1;
        eventsPage.value = page;
        eventsTargetPage.value = page;
        // Le watcher se chargera de recharger les données
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


    // Appliquer les filtres manuellement
    async function applyFilters() {
        if (!agGridRef.value) {
            console.log('[ApplyFilters] AgGrid ref non disponible');
            return;
        }

        // Vérifier qu'au moins un device est sélectionné
        if (!selectedDevice.value) {
            console.log('[ApplyFilters] Aucun device sélectionné, impossible d\'appliquer les filtres');
            return;
        }

        // Récupérer le filtre actuel depuis AgGrid
        const currentFilterModel = agGridRef.value.getFilterModel();
        console.log('[ApplyFilters] Filtre actuel depuis AgGrid:', currentFilterModel);

        // Convertir le modèle de filtre AgGrid en format compatible avec le backend
        const filterFromGrid = {};
        for (const key in currentFilterModel) {
            const f = currentFilterModel[key];
            if (f && f.filter !== undefined && f.filter !== null && f.filter !== '') {
                filterFromGrid[key] = f.filter;
            }
        }

        // Utiliser uniquement le filtre du device sélectionné (pas de fusion)
        const deviceFilter = columns.value.some(col => col.field === 'type_device')
            ? { type_device: { filter: selectedDevice.value.name } }
            : { key: { filter: selectedDevice.value.name } };

        // Convertir le filtre du device en format backend
        const deviceFilterBackend = {};
        for (const key in deviceFilter) {
            const f = deviceFilter[key];
            if (f && f.filter !== undefined && f.filter !== null && f.filter !== '') {
                deviceFilterBackend[key] = f.filter;
            }
        }

        // Combiner le filtre du device avec les filtres de la grille (sans fusion externe)
        const finalFilter = { ...deviceFilterBackend, ...filterFromGrid };
        console.log('[ApplyFilters] Application des filtres (device + grille):', finalFilter);

        gridFilterModel.value = finalFilter;

        // Recharger avec pagination et filtre
        await loadDevices();
    }

    // Effacer tous les filtres
    async function clearFilters() {
        console.log('[ClearFilters] Effacement des filtres...');
        
        // Vérifier qu'au moins un device est sélectionné
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

    // Bouton reload
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
        // Blocage du menu natif pour utiliser notre menu personnalisé
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

        // Socket connection (no auth)
        connectSocket({
            url: "http://localhost:3000"
        });

        // Refresh devices list on bulk update (avec protection contre les appels trop fréquents)
        onSocket('devices:bulk_update', async () => {
            const now = Date.now();
            // Éviter les appels trop fréquents (minimum 1 seconde entre les appels)
            if (lastSocketUpdate.value && (now - lastSocketUpdate.value) < 1000) {
                console.log('[Socket] Ignore bulk_update (trop fréquent)');
                return;
            }
            lastSocketUpdate.value = now;
            await loadDevices();
        });

        // Refresh device events when a new event is created
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
    watch([() => eventsPage.value, () => eventsPageSize.value], async () => {
        if (selectedDeviceRow.value?.id) {
            await loadDeviceEvents();
        }
    });
    
</script>