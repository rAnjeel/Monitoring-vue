<template>
    <div class="sub-navbar">
        <div class="nav nav-tabs">
            <h4 class="text-uppercase" style="color: #ecf0f1;">Devices List</h4>
        </div>
    </div>

    <!-- Content Area -->
    <div class="content-wrapper">
        <!-- Filter Section -->
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

        <!-- Data Table -->
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

<style>
    body {
        background-color: #f5f5f5;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
    }

    .navbar-custom {
        background-color: #2c3e50;
        border: none;
        margin-bottom: 0;
        border-radius: 0;
    }

    .navbar-custom .navbar-nav > li > a {
        color: #ecf0f1;
        font-size: 13px;
        padding: 15px 20px;
    }

    .navbar-custom .navbar-nav > li > a:hover,
    .navbar-custom .navbar-nav > li.active > a {
        background-color: #34495e;
        color: #3498db;
    }

    .sub-navbar {
        background-color: #34495e;
        padding: 10px 0;
        border-bottom: 1px solid #2c3e50;
    }

    .sub-navbar .nav-tabs {
        border-bottom: none;
        margin-left: 15px;
    }

    .sub-navbar .nav-tabs > li > a {
        background: none;
        border: none;
        color: #bdc3c7;
        font-size: 12px;
        padding: 8px 15px;
    }

    .sub-navbar .nav-tabs > li.active > a,
    .sub-navbar .nav-tabs > li > a:hover {
        background-color: #3498db;
        color: white;
        border-radius: 3px;
    }

    .content-wrapper {
        padding: 20px;
        background-color: white;
        margin: 0;
    }

    .filter-section {
        background-color: #ecf0f1;
        padding: 15px;
        margin-bottom: 20px;
        border-radius: 4px;
    }

    .data-table {
        background-color: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
    }

    .table-header {
        background-color: #f1c40f;
        color: #2c3e50;
        font-weight: bold;
        font-size: 12px;
    }

    .table-header th {
        padding: 10px 8px;
        border-right: 1px solid #e67e22;
        text-align: center;
    }

    .data-row {
        border-bottom: 1px solid #ecf0f1;
        font-size: 11px;
    }

    .data-row:nth-child(even) {
        background-color: #f9f9f9;
    }

    .data-row:hover {
        background-color: #e8f4fd;
    }

    .data-row td {
        padding: 8px;
        border-right: 1px solid #ecf0f1;
        vertical-align: middle;
    }

    .status-indicator {
        width: 4px;
        height: 100%;
        background-color: #27ae60;
        display: inline-block;
        margin-right: 8px;
    }

    .device-cell {
        position: relative;
    }

    .ip-address {
        font-weight: bold;
        color: #2c3e50;
    }

    .hostname {
        color: #7f8c8d;
        font-size: 10px;
    }

    .stats-up {
        color: #27ae60;
    }

    .stats-down {
        color: #e74c3c;
    }

    .interface-name {
        color: #3498db;
    }
</style>

<script setup>
</script>