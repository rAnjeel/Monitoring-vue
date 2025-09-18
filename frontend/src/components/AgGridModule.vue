<template>
  <div class="ag-grid-module">
    <ag-grid-vue
      class="ag-theme-quartz"
      style="width: 100%; height: 400px;"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :defaultColDef="defaultColDef"
      :rowSelection="rowSelection"
      :pagination="pagination"
      :paginationPageSize="pageSize"
      @grid-ready="onGridReady"
    />
  </div>
</template>

<script setup>
  import { ref, defineProps, watch } from 'vue';
  import { AgGridVue } from 'ag-grid-vue3';
  import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

  ModuleRegistry.registerModules([AllCommunityModule]);

  const props = defineProps({
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
    },
    pagination: {
      type: Boolean,
      default: true
    },
    pageSize: {
      type: Number,
      default: 25
    },
    quickFilterText: {
      type: String,
      default: ''
    },
    filterModel: {
      type: Object,
      default: null
    }
  });

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  const gridApi = ref(null);
  function onGridReady(params) {
    gridApi.value = params.api;
    if (props.quickFilterText) {
      gridApi.value.setQuickFilter(props.quickFilterText);
    }
    if (props.filterModel) {
      gridApi.value.setFilterModel(props.filterModel);
    }
  }

  watch(() => props.quickFilterText, (val) => {
    if (gridApi.value) {
      gridApi.value.setQuickFilter(val || '');
    }
  });

  watch(() => props.filterModel, (val) => {
    if (gridApi.value) {
      if (val) {
        gridApi.value.setFilterModel(val);
      } else {
        gridApi.value.setFilterModel(null);
      }
    }
  }, { deep: true });
</script>

<style scoped>
  .ag-grid-module {
    width: 100%;
  }
</style>
