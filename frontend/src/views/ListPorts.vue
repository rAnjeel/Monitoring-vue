<template>
  <div class="list-ports-page">
    <div class="sub-navbar">
        <div class="nav nav-tabs">
            <h4 class="text-uppercase" style="color:#ecf0f1;">
                <span class="glyphicon glyphicon-triangle-right" aria-hidden="true" style="margin-right: 6px;"></span>
                <span>Ports List</span>
                <span class="label label-primary" title="Total ports">{{ totalCountDisplay }}</span>
            </h4>
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
                    <button @click="showImportPorts = true" class="btn btn-sm btn-primary" style="margin-right: 8px;">
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
  </div>
</template>

<script setup>
    import CsvImport from '@/views/CsvImport.vue';
    import '@/assets/ListPorts.css';
    import '@/assets/Loading.css';
    import AgGridModule from '@/components/AgGridModule.vue';
    import { ref, onMounted, watch } from 'vue';
    import { getLimitedPorts } from '@/services/ports/ports';
    import { badgeContainer, superposeValue} from '@/services/utils/utils';
    import AgGridContextMenu from '@/components/AgGridContextMenu.vue';
    import MenuModule from '@/modules/AgGridModule';


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
    const menuItems = ref([
        {
            id: 'details',
            label: 'Details',
            icon: 'glyphicon glyphicon-list-alt',
            action: (row) => {
                // eslint-disable-next-line no-console
                console.log('[Ports] Details:', row);
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
        const columnsToHide = ['ifIndex', 'ne_id', 'device_id', 'hostname', 'sysName', 'sysname', 'adminStatus', 'operStatus', 'port_id', 'mtu', 'HighSpeed', 'PromiscuousMode', 'ConnectorPresent', 'in_octets', 'out_octets', 'Speed'];

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

            // Utiliser la fonction réutilisable pour générer les colonnes
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

    // --- Helpers robustes pour interagir avec le wrapper / api ag-grid ---
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
        // Wrapper method if present
        if (typeof agGridRef.value.setFilterModel === 'function') {
        agGridRef.value.setFilterModel(model);
        }
        // Underlying grid API if present
        const api = getGridApi();
        if (api && typeof api.setFilterModel === 'function') {
        api.setFilterModel(model);
        // ensure UI is refreshed
        api.onFilterChanged && api.onFilterChanged();
        api.refreshFilters && api.refreshFilters();
        // For client-side row model
        api.refreshClientSideRowModel && api.refreshClientSideRowModel('filter');
        }
    } catch (e) {
        console.warn('setGridFilterModel error', e);
    }
    }

    // --- onFilterChanged : ne renvoie plus le model dans le grid (évite la boucle) ---
    function onFilterChanged(filterModel) {
    // Convertir le filterModel ag-grid en format backend (simple: prendre .filter ou .values)
    if (!filterModel || Object.keys(filterModel).length === 0) {
        gridFilterModel.value = null;
        return;
    }

    const mapped = {};
    for (const key in filterModel) {
        const f = filterModel[key];
        if (!f) continue;
        // text filter
        if (f.filter !== undefined && f.filter !== null && f.filter !== '') {
        mapped[key] = f.filter;
        continue;
        }
        // set filter (values)
        if (Array.isArray(f.values) && f.values.length > 0) {
        mapped[key] = f.values;
        continue;
        }
        // range / other types can be added if needed
    }

    gridFilterModel.value = Object.keys(mapped).length > 0 ? mapped : null;
    }

    // --- applyFilters : utilise le helper pour lire le modèle actuel, construit le filter backend et recharge ---
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

    // retourner à la page 1 et charger
    targetPage.value = 1;
    await loadPorts();
    }

    // --- clearFilters : vide le modèle interne, force la grid UI à se réinitialiser et recharge les données ---
    async function clearFilters() {
    console.log('[ClearFilters Ports] Effacement des filtres...');

    // Reset backend filter state
    gridFilterModel.value = null;
    targetPage.value = 1;

    // Force clear côté Ag-Grid (wrapper + api)
    setGridFilterModel(null);

    // En plus, tenter de vider individuellement les instances de filtre (sécurise l'UI)
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

    // S'assurer que la référence wrapper (si elle garde un model interne) soit aussi vidée
    if (agGridRef.value && typeof agGridRef.value.setFilterModel === 'function') {
        try { agGridRef.value.setFilterModel(null); } catch (e) { /* noop */ }
    }

    // Recharger les données
    await loadPorts();
    }


    onMounted(async () => {
        await loadPorts();
    });

    watch([() => targetPage.value, () => pageSize.value], async () => {
     // Rechargez les données si la page ou la taille de page change
        await loadPorts();
    });

</script>

<style scoped>
</style>


