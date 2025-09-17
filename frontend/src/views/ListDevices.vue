<template>
    <CardNavbar
        :device-list="customDevices"
        :initial-visible-cards="4"
        @device-selected="handleDeviceSelect"
        @navigation-changed="handleNavigationChange"
        ref="deviceNav"
    />
    <div class="app-container">
        <AgGridModule
            :column-defs="columns"
            :row-data="rows"
            :row-selection="{ mode: 'multiRow' }"
        />
    </div>
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

        <div class="data-table">
            <table class="table table-condensed" style="margin: 0;">
                <thead class="table-header">
                    <tr>
                        <th>Device</th>
                        <th>IfIndex</th>
                        <th>Interface</th>
                        <th>Up</th>
                        <th>Down</th>
                        <th>LastChange</th>
                        <th>IfAlias</th>
                        <th>Community</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="data-row">
                        <td class="device-cell">
                            <span class="status-indicator"></span>
                            <div class="ip-address">154.126.76.2</div>
                            <div class="hostname">hw-mg-gal-smak-cr-1.mg</div>
                        </td>
                        <td>9</td>
                        <td class="interface-name">GigabitEthernet0/1/1</td>
                        <td class="stats-up">232089200997783</td>
                        <td class="stats-down">672582293479</td>
                        <td>37d 21h 24m 42s</td>
                        <td>networkHW-mg-gal-smak-cr-1-mgpe-01/1| v2c hw-mg-cr1-mg2020|backup_FH_OMA</td>
                        <td>75.3com15av2</td>
                    </tr>
                    <tr class="data-row">
                        <td class="device-cell">
                            <span class="status-indicator"></span>
                            <div class="ip-address">154.126.76.2</div>
                            <div class="hostname">hw-mg-gal-smak-cr-1.mg</div>
                        </td>
                        <td>10</td>
                        <td class="interface-name">GigabitEthernet0/1/2</td>
                        <td class="stats-up">981287079527</td>
                        <td class="stats-down">117415606439</td>
                        <td>05h 31m 49s</td>
                        <td>networkHW-mg-gal-smak-cr-1-mgpe-01/2| v2c hw-mm-cr-1-mg|01/4| backup_hw_FH_OMA</td>
                        <td>75.3com15av2</td>
                    </tr>
                    <tr class="data-row">
                        <td class="device-cell">
                            <span class="status-indicator"></span>
                            <div class="ip-address">154.126.76.2</div>
                            <div class="hostname">hw-mg-gal-smak-cr-1.mg</div>
                        </td>
                        <td>29</td>
                        <td class="interface-name">GigabitEthernet0/3/1</td>
                        <td class="stats-up">875147524420050B</td>
                        <td class="stats-down">993604527787754</td>
                        <td>31d 06h 16m 18s</td>
                        <td>networkHW-mg-gal-smak-cr-1-mgpe-03/1| v2c HW-mg-ans-smak-cr-1-mgpe-03/1</td>
                        <td>75.3com15av2</td>
                    </tr>
                    <tr class="data-row">
                        <td class="device-cell">
                            <span class="status-indicator"></span>
                            <div class="ip-address">154.126.76.2</div>
                            <div class="hostname">hw-mg-gal-smak-cr-1.mg</div>
                        </td>
                        <td>30</td>
                        <td class="interface-name">GigabitEthernet0/3/2</td>
                        <td class="stats-up">137470773866B272</td>
                        <td class="stats-down">110193564617198B</td>
                        <td>16d 03h 18m 50s</td>
                        <td>networkHW-mg-gal-smak-cr-1-mgpe-03/2| v2c Hw-mm-cr-1-mgpe-1/0/0</td>
                        <td>75.3com15av2</td>
                    </tr>
                    <tr class="data-row">
                        <td class="device-cell">
                            <span class="status-indicator"></span>
                            <div class="ip-address">154.126.76.2</div>
                            <div class="hostname">hw-mg-gal-smak-cr-1.mg</div>
                        </td>
                        <td>31</td>
                        <td class="interface-name">GigabitEthernet0/3/3</td>
                        <td class="stats-up">984248126893261B</td>
                        <td class="stats-down">-</td>
                        <td>13d 10h 12m 56s</td>
                        <td>networkHW-mg-gal-smak-cr-1-mgpe-03/3| v2c HW-gal-cr-1-mgpe-1/0/0</td>
                        <td>75.3com15av2</td>
                    </tr>
                    <tr class="data-row">
                        <td class="device-cell">
                            <span class="status-indicator"></span>
                            <div class="ip-address">154.126.76.2</div>
                            <div class="hostname">hw-mg-gal-smak-cr-1.mg</div>
                        </td>
                        <td>32</td>
                        <td class="interface-name">GigabitEthernet0/3/4</td>
                        <td class="stats-up">274154634650425</td>
                        <td class="stats-down">-</td>
                        <td>13d 10h 12m 56s</td>
                        <td>networkHW-mg-gal-smak-cr-1-mgpe-03/4| v2c HW-gal-cr-1-mgpe-1/0/0</td>
                        <td>75.3com15av2</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
<script setup>
    import '../assets/ListDevices.css';
    import CardNavbar from '../components/utils/CardNavbar.vue';
    import AgGridModule from '../components/utils/AgGridModule.vue';
    import { ref, onMounted } from 'vue';
    
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

    // Gestion des événements
    function handleDeviceSelect(device, index) {
        selectedDevice.value = device;
        console.log('Appareil sélectionné:', device.name, 'Index:', index);
    }

    function handleNavigationChange(currentIndex, maxIndex) {
        console.log('Navigation:', currentIndex, '/', maxIndex);
    }

    onMounted(() => {
        console.log('CardNavbar ref:', deviceNav.value);
    });
    
    const columns = ref([
        { headerName: "ID", field: "id" },
        { headerName: "Nom", field: "name" },
        { headerName: "Statut", field: "status" }
    ]);

    const rows = ref([
        { id: 1, name: "Routeur", status: "Actif" },
        { id: 2, name: "Switch", status: "En ligne" },
        { id: 3, name: "Serveur", status: "Hors ligne" }
    ]);
</script>