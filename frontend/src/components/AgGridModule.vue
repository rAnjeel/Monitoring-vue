<template>
  <div class="ag-grid-module">
    <ag-grid-vue
      class="ag-theme-quartz"
      style="width: 100%; height: 400px;"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :defaultColDef="defaultColDef"
      :rowSelection="rowSelection"
      @grid-ready="onGridReady"
    />
  </div>
</template>

<script setup>
  import { ref, defineProps } from 'vue';
  import { AgGridVue } from 'ag-grid-vue3';
  import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

  ModuleRegistry.registerModules([AllCommunityModule]);

  defineProps({
    rowData: {
      type: Array,
      default: () => []
    },
    columnDefs: {
      type: Array,
      required: true
    },
    rowSelection: {
      type: Object,
      default: () => ({ mode: 'singleRow' })
    }
  });

  const defaultColDef = {
    resizable: true,
    sortable: true,
  };

  const gridApi = ref(null);
  function onGridReady(params) {
    gridApi.value = params.api;
  }
</script>

<style scoped>
  .ag-grid-module {
    width: 100%;
  }
</style>
