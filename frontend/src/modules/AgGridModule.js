// Centralized lightweight state manager for Ag-Grid context menu (no Vuex/Pinia)
// Exposes reactive state and helper functions to open/close the menu

import { reactive, readonly } from 'vue'

const state = reactive({
	// Whether the context menu is visible
	visible: false,
	// Fixed position in viewport coordinates
	x: 0,
	y: 0,
	// Row data associated with the menu invocation
	rowData: null
})

function showMenu({ x, y, rowData }) {
	state.x = Math.max(0, Math.round(x))
	state.y = Math.max(0, Math.round(y))
	state.rowData = rowData ?? null
	state.visible = true
}

function hideMenu() {
	state.visible = false
	state.rowData = null
}

function setPosition(x, y) {
	state.x = Math.max(0, Math.round(x))
	state.y = Math.max(0, Math.round(y))
}

function getState() {
	return readonly(state)
}

export default {
	getState,
	showMenu,
	hideMenu,
	setPosition
}


