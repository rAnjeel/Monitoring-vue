<template>
    <div class="sub-navbar">
        <div class="nav nav-tabs">
            <h4 class="text-uppercase" style="color:#ecf0f1; gap:12px;">
                <span class="glyphicon glyphicon-triangle-right" aria-hidden="true" style="margin-right: 6px;"></span>
                <span>Type Devices</span>
                <span class="label label-primary" title="Nombre de types">{{ totalTypes }}</span>
            </h4>
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
            <h4 class="text-uppercase" style="color: #ecf0f1; gap:12px;">
                <span class="glyphicon glyphicon-triangle-right" aria-hidden="true" style="margin-right: 6px;"></span>
                <span>Devices list</span>
                <span class="label label-primary" title="Total devices">{{ totalDevices }}</span>
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

        <div class="app-container">
            <AgGridModule
                :column-defs="columns"
                :row-data="rows"
                :row-selection="{ mode: 'multiRow' }"
                :pagination="true"
                :page-size="pageSize"
                :filter-model="gridFilterModel"
                ref="agGridRef"
                @pagination-changed="onPaginationChanged"
            />
        </div>
    </div>
    <CsvImport v-model="showImportDevices" :import-type="'devices'" @import="reloadGrid" />
</template>

<script setup>
    import CsvImport from '@/views/CsvImport.vue';
    import '@/assets/ListDevices.css';
    import CardNavbar from '@/components/CardNavbar.vue';
    import AgGridModule from '@/components/AgGridModule.vue';
    import { ref, onMounted, watch, computed } from 'vue';
    import { getDevices } from '@/services/devices/devices';
    import { getTypeDevices } from '@/services/type devices/typeDevices';   
    
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
    const showImportDevices = ref(false);

    // UX counters for cards header
    const totalTypes = computed(() => customDevices.value?.length || 0);
    const totalDevices = computed(() => (customDevices.value || []).reduce((sum, t) => sum + (Number(t.value) || 0), 0));

    // Load data
    async function loadDevices() {
        loading.value = true;
        error.value = null;
        try {
            console.log('[LoadDevices] Début du chargement des devices...');
            const data = await getDevices();
            const devices = Array.isArray(data) ? data : (data && data.data ? data.data : []);

            const columnsToHide = ['id', 'hostname', 'sysName', 'sysname'];

            if (!Array.isArray(devices)) {
                throw new Error('Réponse inattendue du service devices');
            }

            const sample = devices[0] || {};
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
                const deviceCol = {
                    headerName: 'DEVICE',
                    colId: 'device',
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
                        const container = document.createElement('div');
                        container.style.display = 'flex';
                        container.style.flexDirection = 'column';
                        container.style.justifyContent = 'center';
                        container.style.lineHeight = '1.2';
                        const line1 = document.createElement('div');
                        line1.style.fontWeight = '600';
                        line1.style.color = '#2c3e50';
                        line1.textContent = hostname || sysName || '';
                        container.appendChild(line1);
                        if (hostname && sysName && hostname !== sysName) {
                            const line2 = document.createElement('div');
                            line2.style.fontSize = '12px';
                            line2.style.color = '#7f8c8d';
                            line2.textContent = sysName;
                            container.appendChild(line2);
                        }
                        return container;
                    }
                };
                columns.value = [deviceCol, ...otherColumns];
            } else {
                columns.value = otherColumns;
            }

            rows.value = devices;
        } catch (err) {
            error.value = err.message;
            console.error('[LoadDevices] Erreur lors du chargement:', err);
        } finally {
            loading.value = false;
            lastUpdated.value = new Date();
        }
    }

    async function loadTypeDevices() {
        loading.value = true;
        error.value = null;
        try {
            console.log('[LoadTypeDevices] Début du chargement des types devices...');
            const data = await getTypeDevices();
            const types = Array.isArray(data) ? data : (data && data.data ? data.data : []);

            if (!Array.isArray(types)) {
                throw new Error('Réponse inattendue du service type devices');
            }

            const deviceCountByType = {};
            if (rows.value && rows.value.length > 0) {
                rows.value.forEach(device => {
                    const typeName = device.type_device || 'Unknown';
                    deviceCountByType[typeName] = (deviceCountByType[typeName] || 0) + 1;
                });
            }

            customDevices.value = types.map(t => ({
                name: t.name,
                value: deviceCountByType[t.name] || 0,
                length: deviceCountByType[t.name] || 0,
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
    function handleDeviceSelect(device, index) {
        selectedDevice.value = device;
        
        if (device && index >= 0) {
            console.log('Appareil sélectionné:', device.name, 'Index:', index);
            
            // Filtrer par type_device si la colonne existe
            if (columns.value.some(col => col.field === 'type_device')) {
                gridFilterModel.value = {
                    type_device: { 
                        filterType: 'text', 
                        type: 'contains', 
                        filter: device.name 
                    }
                };
            } else {
                gridFilterModel.value = {
                    global: { 
                        filterType: 'text', 
                        type: 'contains', 
                        filter: device.name 
                    }
                };
            }
        } else {
            console.log('Appareil désélectionné');
            gridFilterModel.value = null;
        }
    }

    function handleNavigationChange(currentIndex, maxIndex) {
        console.log('Navigation:', currentIndex, '/', maxIndex);
    }

    // Bouton reload
    async function reloadGrid() {
        console.log('[ReloadGrid] Rechargement des données...');
        await loadDevices();
        await loadTypeDevices();
    }

    function jumpToPage() {
        const api = agGridRef.value;
        const total = Number(totalPagesDisplay.value) || 1;
        let page = Number(targetPage.value) || 1;
        if (page < 1) page = 1;
        if (page > total) page = total;
        targetPage.value = page;
        if (api && api.goToPage) {
            api.goToPage(page - 1);
        }
    }

    function onPaginationChanged({ totalPages, currentPage }) {
        totalPagesDisplay.value = totalPages > 0 ? totalPages : 1;
        targetPage.value = currentPage > 0 ? currentPage : 1;
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
    
</script>

<style scoped>

.spinning {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>