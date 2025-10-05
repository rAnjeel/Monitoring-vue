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

        <!-- Loading overlay -->
        <!-- <div v-if="loading" class="loading-overlay">
          <div class="loading-box">
            <span class="glyphicon glyphicon-refresh spinning" style="font-size:24px; margin-right:8px;"></span>
            <span>Loading...</span>
          </div>
        </div> -->

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
    :width="'min(900px, 96vw)'"
  >
    <div v-if="eventsRows.length === 0" style="padding:8px 0;">No events</div>
    <table v-else class="table table-striped table-condensed">
      <thead>
        <tr>
          <th>Date</th>
          <th>Status</th>
          <th>Loss %</th>
          <th>Avg</th>
          <th>Min</th>
          <th>Max</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(e, idx) in eventsRows" :key="idx">
          <td>{{ formatDate(e.event_time, 'YYYY-MM-DD HH:mm:ss') }}</td>
          <td>{{ e.status }}</td>
          <td>{{ e.loss }}</td>
          <td>{{ e.avg }}</td>
          <td>{{ e.min }}</td>
          <td>{{ e.max }}</td>
        </tr>
      </tbody>
    </table>
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
    import { ref, onMounted, watch, computed } from 'vue';
    import { getLimitedDevices } from '@/services/devices/devices';   
    import { getTypeDevicesCounts } from '@/services/type devices/typeDevices';   
    import { formatDate, stringifyStatusValue, badgeContainer, superposeValue} from '@/services/utils/utils';
    import AgGridContextMenu from '@/components/AgGridContextMenu.vue';
    import MenuModule from '@/modules/AgGridModule';
    import ModalComponent from '@/components/ModalComponent.vue';
    import { getDeviceEventsByDeviceId } from '@/services/devices/deviceEvents';

    const customDevices = ref([]);
    const deviceNav = ref(null);
    const selectedDevice = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const lastUpdated = ref(null);

    const columns = ref([]);
    const rows = ref([]);
    const pageSize = ref(20);
    const gridFilterModel = ref(null);
    const agGridRef = ref(null);
    const targetPage = ref(1);
    const totalPagesDisplay = ref(1);
    const totalCountDisplay = ref(0);
    const showImportDevices = ref(false);
    const showEventsModal = ref(false);
    const selectedDeviceRow = ref(null);
    const eventsRows = ref([]);
    const eventsTotal = ref(0);
    const eventsPage = ref(1);
    const eventsPageSize = ref(20);
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

    // UX counters for cards header
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
        // loading.value = true;
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

            // Utiliser la fonction réutilisable pour générer les colonnes
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
            eventsTotal.value = 0;
            return;
        }
        try {
            const { rows, totalCount } = await getDeviceEventsByDeviceId(deviceId, {
                page: eventsPage.value,
                pageSize: eventsPageSize.value,
            });
            eventsRows.value = rows || [];
            eventsTotal.value = Number(totalCount || 0);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[DeviceEvents] load error:', e?.message || e);
            eventsRows.value = [];
            eventsTotal.value = 0;
        }
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
        selectedDevice.value = device;
        
        if (device && index >= 0) {
            console.log('Appareil sélectionné:', device.name, 'Index:', index);
            
            // Filtrer par type_device si la colonne existe
            const filterModel = columns.value.some(col => col.field === 'type_device')
                ? { type_device: { filter: device.name } }
                : { key: { filter: device.name } };

            // Appliquer via les hooks standard
            onFilterChanged(filterModel);
            await applyFilters();
        } else {
            console.log('Appareil désélectionné');
            const filterModel = null;
            onFilterChanged(filterModel || {});
            await applyFilters();
        }
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

        // Fusionner avec le filtre externe (ex: 'key' global) éventuellement défini par handleDeviceSelect
        const externalFilter = gridFilterModel.value && typeof gridFilterModel.value === 'object' ? gridFilterModel.value : {};
        const mergedFilter = { ...externalFilter, ...filterFromGrid };

        const finalFilter = Object.keys(mergedFilter).length > 0 ? mergedFilter : null;
        console.log('[ApplyFilters] Application des filtres (fusion):', finalFilter);

        gridFilterModel.value = finalFilter;

        // Recharger avec pagination et filtre
        await loadDevices();
    }

    // Effacer tous les filtres
    async function clearFilters() {
        console.log('[ClearFilters] Effacement des filtres...');
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
        console.log("TOTAL :", total);
        let page = Number(targetPage.value) || 1;
        console.log("page :", page);
        if (page < 1) page = 1;
        if (page > total) page = total;
        targetPage.value = page;
        // loadDevices();
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
        await loadDevices();
        await loadTypeDevices();
    });

    // Watch pour réinitialiser le filtre si pas de device sélectionné
    watch(selectedDevice, (newDevice) => {
        if (!newDevice) {
            gridFilterModel.value = null;
        }
    });

    watch([() => targetPage.value, () => pageSize.value], async () => {
     // Rechargez les données si la page ou la taille de page change
        await loadDevices();
    });
    
</script>