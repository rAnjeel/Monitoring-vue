<template>
  <div class="ag-grid-module">
    <ag-grid-vue
      class="ag-theme-quartz"
      :id="gridId"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :defaultColDef="defaultColDef"
      :rowSelection="rowSelection"
      :rowMultiSelectWithClick="true"
      :suppressCellFocus="suppressCellFocus"
      :rowClassRules="rowClassRules"
      @grid-ready="onGridReady"
      @filter-changed="onFilterChanged"
    />
  </div>
</template>

<script setup>
import { ref, defineProps, watch, defineExpose, defineEmits } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const emit = defineEmits(['filter-changed']);
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
    type: [String, Object],
    default: 'multiple'
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
  },
  suppressCellFocus: {
    type: Boolean,
    default: true
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
  // Ne pas appliquer automatiquement le filterModel au démarrage
  // if (props.filterModel) {
  //   gridApi.value.setFilterModel(props.filterModel);
  // }
}

watch(() => props.quickFilterText, (val) => {
  if (gridApi.value) {
    gridApi.value.setQuickFilter(val || '');
  }
});

watch(() => props.filterModel, (val) => {
  if (gridApi.value) {
    // Ne pas appliquer automatiquement le filtre - laisser l'utilisateur contrôler
    // gridApi.value.setFilterModel(val || null);
    console.log('[AgGridModule] Filter model changed but not applied automatically:', val);
  }
}, { deep: true });

function onFilterChanged() {
  if (gridApi.value) {
    emit('filter-changed', gridApi.value.getFilterModel());
  }
}


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
  },
  getFilterModel: () => {
    if (gridApi.value) {
      return gridApi.value.getFilterModel();
    }
    return null;
  }
});
</script>

<style scoped>
.ag-grid-module {
  width: 100%;
}
</style>
