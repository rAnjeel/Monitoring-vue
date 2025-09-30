<template>
	<div class="grid-parent">
		<ag-grid-vue
			class="ag-theme-quartz"
			style="width: 100%; height: 500px;"
			:columnDefs="columnDefs"
			:rowData="rowData"
			:defaultColDef="defaultColDef"
			:rowSelection="'single'"
			@grid-ready="onGridReady"
			@cell-context-menu="onCellContextMenu"
		/>

		<AgGridContextMenu />
	</div>
</template>

<script setup>
import { ref } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import AgGridContextMenu from '@/components/AgGridContextMenu.vue'
import MenuModule from '@/modules/AgGridModule'

// Register community modules once here (example page)
ModuleRegistry.registerModules([AllCommunityModule])

const gridApi = ref(null)
const columnDefs = ref([
	{ field: 'id', headerName: 'ID', width: 100 },
	{ field: 'name', headerName: 'Name', flex: 1 },
	{ field: 'status', headerName: 'Status', width: 160 }
])

const defaultColDef = {
	sortable: true,
	filter: true,
	resizable: true
}

const rowData = ref([
	{ id: 1, name: 'Device A', status: 'ONLINE' },
	{ id: 2, name: 'Device B', status: 'OFFLINE' },
	{ id: 3, name: 'Device C', status: 'MAINTENANCE' }
])

function onGridReady(params) {
	gridApi.value = params.api
}

function onCellContextMenu(event) {
	// Prevent native browser menu to display our custom menu instead
	event.event.preventDefault()

	// Coordinates relative to viewport for fixed positioning
	const x = event.event.clientX
	const y = event.event.clientY

	// Keep the row data for actions in the context menu component
	MenuModule.showMenu({ x, y, rowData: event.data })
}
</script>

<style scoped>
.grid-parent {
	position: relative;
}
</style>


