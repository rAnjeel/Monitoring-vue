<template>
    <div class="sub-navbar">
        <div class="nav nav-tabs">
            <h4 class="text-uppercase" style="color:#ecf0f1;">
                <span class="glyphicon glyphicon-triangle-right" aria-hidden="true" style="margin-right: 6px;"></span>
                <span>Ports List</span>
                <span class="label label-primary" title="Total ports">{{ totalPorts }}</span>
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
        <div class="app-container">
            <AgGridModule
                :column-defs="columns"
                :row-data="rows"
                :row-selection="{ mode: 'multiRow' }"
                :pagination="true"
                :page-size="pageSize"
                ref="agGridRef"
                @pagination-changed="onPaginationChanged"
            />
        </div>
    </div>
    <CsvImport v-model="showImportPorts" :import-type="'ports'" @import="reloadGrid" />
</template>

<script setup>
    import CsvImport from '@/views/CsvImport.vue';
    import '@/assets/ListDevices.css';
    import AgGridModule from '@/components/AgGridModule.vue';
    import { ref, onMounted, computed } from 'vue';
    import { getPorts } from '@/services/ports/ports';

    const loading = ref(false);
    const error = ref(null);
    const lastUpdated = ref(null);

    const columns = ref([]);
    const rows = ref([]);
    const pageSize = ref(20);
    const agGridRef = ref(null);
    const targetPage = ref(1);
    const totalPagesDisplay = ref(1);
    const totalPorts = computed(() => Array.isArray(rows.value) ? rows.value.length : 0);
    const showImportPorts = ref(false);


    async function loadPorts() {
        loading.value = true;
        error.value = null;
        try {
            console.log('[LoadPorts] Début du chargement des ports...');
            const data = await getPorts();
            const ports = Array.isArray(data) ? data : (data && data.data ? data.data : []);
            
            const columnsToHide = ['ne_id', 'device_id', 'hostname', 'sysName', 'sysname'];

            if (!Array.isArray(ports)) {
                throw new Error('Réponse inattendue du service ports');
            }

            const sample = ports[0] || {};
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

    function onPaginationChanged({ totalPages, currentPage }) {
        totalPagesDisplay.value = totalPages > 0 ? totalPages : 1;
        targetPage.value = currentPage > 0 ? currentPage : 1;
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

    onMounted(async () => {
        await loadPorts();
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


