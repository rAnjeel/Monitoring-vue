<template>
  <div class="ag-grid-module">
    <ag-grid-vue
      class="ag-theme-quartz"
      style="width: 100%; height: 500px;"
      :columnDefs="columnDefs"
      :rowData="rowData"
      :defaultColDef="defaultColDef"
      rowSelection="multiple"
      :rowMultiSelectWithClick="true"
      suppressCellFocus="true"
      :pagination="pagination"
      :paginationPageSize="pageSize"
      :rowClassRules="rowClassRules"
      @grid-ready="onGridReady"
    />
  </div>
  <div class="pagination-info">
    Total de pages : {{ totalPages }}
  </div>
</template>

<script setup>
  import { ref, defineProps, watch, defineExpose, defineEmits } from 'vue';
  import { AgGridVue } from 'ag-grid-vue3';
  import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

  ModuleRegistry.registerModules([AllCommunityModule]);

  const emit = defineEmits(['pagination-changed']);

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
    pageTotal: {
      type: Number,
      default: 1
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
    // Fire initial pagination info
    try {
      const total = props.pageTotal;
      const current = params.api.paginationGetCurrentPage ? (params.api.paginationGetCurrentPage() + 1) : 1;
      emit('pagination-changed', { totalPages: total, currentPage: current });
    } catch (e) {
      console.warn('[AgGridModule] pagination init error', e);
    }

    // Listen to pagination changes
    if (params.api && params.api.addEventListener) {
      params.api.addEventListener('paginationChanged', () => {
        const total = props.pageTotal;
        const current = params.api.paginationGetCurrentPage ? (params.api.paginationGetCurrentPage() + 1) : 1;
        emit('pagination-changed', { totalPages: total, currentPage: current });
      });
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

  // Expose pagination helpers to parent via component ref
  defineExpose({
    getTotalPages: () => (gridApi.value && gridApi.value.paginationGetTotalPages ? gridApi.value.paginationGetTotalPages() : 0),
    goToPage: (pageIndex) => {
      if (gridApi.value && gridApi.value.paginationGoToPage) {
        gridApi.value.paginationGoToPage(pageIndex);
      }
    },
    getCurrentPage: () => {
      if (gridApi.value) {
        return gridApi.value.paginationGetCurrentPage() + 1;
      }
      return 1;
    }
  });
</script>

<style scoped>
  .ag-grid-module {
    width: 100%;
  }
</style>
