<template>
  <div class="ag-grid-module">
    <ag-grid-vue
      class="ag-theme-quartz"
      :id="gridId"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :defaultColDef="defaultColDef"
      rowSelection="multiple"
      :rowMultiSelectWithClick="true"
      suppressCellFocus="true"
      :rowClassRules="rowClassRules"
      @grid-ready="onGridReady"
    />
  </div>
</template>

<script setup>
import { ref, defineProps, watch, defineExpose } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const props = defineProps({
  gridId: {
    type: String,
    default: null
  },
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
  pageSize: {
    type: Number,
    default: 20
  },
  quickFilterText: {
    type: String,
    default: ''
  },
  filterModel: {
    type: Object,
    default: null
  },
  rowClassRules: {
    type: Object,
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
    gridApi.value.setFilterModel(val || null);
  }
}, { deep: true });

defineExpose({
  setQuickFilter: (val) => {
    if (gridApi.value) {
      gridApi.value.setQuickFilter(val || '');
    }
  },
  setFilterModel: (val) => {
    if (gridApi.value) {
      gridApi.value.setFilterModel(val || null);
    }
  }
});
</script>

<style scoped>
.ag-grid-module {
  width: 100%;
}
</style>
