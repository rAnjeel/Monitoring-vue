<template>
    <CardNavbar
        :device-list="customDevices"
        :initial-visible-cards="4"
        @device-selected="handleDeviceSelect"
        @navigation-changed="handleNavigationChange"
        ref="deviceNav"
    />
    <div class="sub-navbar">
        <div class="nav nav-tabs">
            <h4 class="text-uppercase" style="color: #ecf0f1;">Devices List</h4>
        </div>
    </div>

    <div class="content-wrapper">
        <div class="filter-section">
            <div class="row">
                <div class="col-md-2">
                    <strong>EXCEL</strong> Add port status
                </div>
                <div class="col-md-3">
                    <label>Show</label>
                    <select class="form-control input-sm" style="display: inline-block; width: 80px; margin: 0 5px;">
                        <option>All</option>
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                    </select>
                    <span>entries</span>
                </div>
            </div>
        </div>
        <div class="app-container">
            <AgGridModule
                :column-defs="columns"
                :row-data="rows"
                :row-selection="{ mode: 'multiRow' }"
            />
        </div>
    </div>
</template>

<script setup>
    import '../assets/ListDevices.css';
    import CardNavbar from '../components/CardNavbar.vue';
    import AgGridModule from '../components/AgGridModule.vue';
    import { ref, onMounted } from 'vue';
    import { getDevices } from '../services/devices/devices';
    
    const customDevices = ref([
    { name: "ROUTER", value: 3, length: 10, status: "Active" },
    { name: "SWITCH", value: 3, length: 40, status: "Online" },
    { name: "IPDSLAM", value: 13, length: 20, status: "Online" },
    { name: "TCU", value: 3, length: 10, status: "Offline" },
    { name: "R6K", value: 3, length: 30, status: "Online" },
    { name: "2G", value: 3, length: 10, status: "Online" },
    { name: "3G", value: 2, length: 10, status: "Maintenance" },
    { name: "4G", value: 1, length: 10, status: "Online" },
    { name: "5G", value: 9, length: 10, status: "Online" },
    { name: "AIRPON", value: 3, length: 10, status: "Offline" },
    ]);


    const deviceNav = ref(null);
    const selectedDevice = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const lastUpdated = ref(null);

    // Gestion des événements
    function handleDeviceSelect(device, index) {
        selectedDevice.value = device;
        console.log('Appareil sélectionné:', device.name, 'Index:', index);
    }

    function handleNavigationChange(currentIndex, maxIndex) {
        console.log('Navigation:', currentIndex, '/', maxIndex);
    }

    const columns = ref([]);
    const rows = ref([]);

    async function loadDevices() {
        loading.value = true;
        error.value = null;
        try {
            console.log('[LoadDevices] Début du chargement des devices...');
            const data = await getDevices();
            const devices = Array.isArray(data) ? data : (data && data.data ? data.data : []);

            if (!Array.isArray(devices)) {
                throw new Error('Réponse inattendue du service devices');
            }

            const sample = devices[0] || {};
            const keys = Object.keys(sample || {});

            columns.value = keys.map(key => ({
                headerName: key.replace(/_/g, ' ').toUpperCase(),
                field: key
            }));

            rows.value = devices;
        } catch (err) {
            error.value = err.message;
            console.error('[LoadDevices] Erreur lors du chargement:', err);
        } finally {
            loading.value = false;
            lastUpdated.value = new Date();
        }
    }

    onMounted(() => {
        console.log('CardNavbar ref:', deviceNav.value);
        loadDevices();
    });
</script>