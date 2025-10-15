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
      @cell-context-menu="onCellContextMenu"
    />
  </div>
</template>

<script setup>
import { ref, defineProps, watch, defineExpose, defineEmits } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'

ModuleRegistry.registerModules([AllCommunityModule])

const emit = defineEmits(['filter-changed', 'filter-apply', 'cell-context-menu'])
const props = defineProps({
  gridId: { type: String, default: null },
  rowData: { type: Array, default: () => [] },
  columnDefs: { type: Array, required: true },
  rowSelection: { type: [String, Object], default: 'single' },
  pageSize: { type: Number, default: 20 },
  quickFilterText: { type: String, default: '' },
  filterModel: { type: Object, default: null },
  rowClassRules: { type: Object },
  suppressCellFocus: { type: Boolean, default: true }
})

// Config commune aux colonnes
const defaultColDef = {
  resizable: true,
  sortable: true,
  filter: true,
  filterParams: {
    buttons: ['apply', 'reset'],
    closeOnApply: true
  }
}

const gridApi = ref(null)

function onGridReady(params) {
  gridApi.value = params.api

  if (props.quickFilterText) {
    gridApi.value.setQuickFilter(props.quickFilterText)
  }

  const gridElement = document.querySelector(`#${props.gridId || 'ag-grid'}`)
  if (gridElement) {
    gridElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && event.target.closest('.ag-filter')) {
        event.preventDefault()
        emit('filter-apply')
      }
    })
  }
}

watch(() => props.quickFilterText, (val) => {
  if (gridApi.value) {
    gridApi.value.setQuickFilter(val || '')
  }
})

watch(() => props.filterModel, (val) => {
  if (gridApi.value) {
    console.log('[AgGridModule] Filter model changed but not applied automatically:', val)
  }
}, { deep: true })

function onFilterChanged() {
  const currentModel = gridApi.value?.getFilterModel() || {}
  console.log('[onFilterChanged] Nouveau modèle:', currentModel)

  // Appeler ta logique d'application de filtre custom
  emit('filter-apply', currentModel)
}

function onCellContextMenu(event) {
  emit('cell-context-menu', event)
}

defineExpose({
  setQuickFilter: (val) => {
    if (gridApi.value) gridApi.value.setQuickFilter(val || '')
  },
  setFilterModel: (val) => {
    if (gridApi.value) gridApi.value.setFilterModel(val || null)
  },
  getFilterModel: () => gridApi.value ? gridApi.value.getFilterModel() : null,
  getGridApi: () => gridApi.value
})
</script>

<style scoped>
.ag-grid-module {
  width: 100%;
}
</style>
