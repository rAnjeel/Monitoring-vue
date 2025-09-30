<template>
	<div
		v-if="menu.visible"
		ref="menuRef"
		class="ag-grid-context-menu"
		:style="menuStyle"
		@mousedown.stop
	>
		<ul class="menu-list">
			<li
				v-for="item in normalizedItems"
				:key="item.id"
				class="menu-item"
				@click="onItemClick(item)"
			>
				<span v-if="item.icon" class="menu-icon">
					<i :class="item.icon" aria-hidden="true"></i>
				</span>
				<span class="menu-label">{{ item.label }}</span>
			</li>
		</ul>
	</div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch, defineProps } from 'vue'
import MenuModule from '@/modules/AgGridModule'
import '@/assets/AgGridContextMenu.css'

const props = defineProps({
	// Array of { id: string|number, label: string, icon?: string, action?: (rowData, item) => void }
	items: {
		type: Array,
		default: () => [
			{ id: 'idButton', label: 'labelButton', icon: 'iconButton' },
		]
	}
})

const menu = MenuModule.getState()
const menuRef = ref(null)

// Compute fixed-position style; overflow is handled in onNextTick adjust
const menuStyle = computed(() => ({
	position: 'fixed',
	left: `${menu.x}px`,
	top: `${menu.y}px`,
	zIndex: 9999
}))

const normalizedItems = computed(() => {
	return (props.items || []).map((it) => ({
		id: it?.id ?? String(it?.label ?? ''),
		label: it?.label ?? String(it?.id ?? ''),
		icon: it?.icon ?? '',
		action: typeof it?.action === 'function' ? it.action : null
	}))
})

function closeOnOutsideMouseDown(event) {
	// If click is outside the menu, close it
	const target = event.target
	if (!menuRef.value || (target && !menuRef.value.contains(target))) {
		MenuModule.hideMenu()
	}
}

function adjustWithinViewport() {
	// Ensure the menu stays inside the viewport after it renders
	const el = menuRef.value
	if (!el) return
	const rect = el.getBoundingClientRect()
	const vw = window.innerWidth
	const vh = window.innerHeight
	let nextX = menu.x
	let nextY = menu.y
	if (rect.right > vw) nextX = Math.max(0, vw - rect.width - 8)
	if (rect.bottom > vh) nextY = Math.max(0, vh - rect.height - 8)
	if (nextX !== menu.x || nextY !== menu.y) {
		MenuModule.setPosition(nextX, nextY)
	}
}

function onItemClick(item) {
	try {
		if (item && typeof item.action === 'function') {
			item.action(menu.rowData, item)
		} else {
			// eslint-disable-next-line no-console
			console.log('[ContextMenu] Item clicked:', { item, rowData: menu.rowData })
		}
	} finally {
		MenuModule.hideMenu()
	}
}

watch(() => menu.visible, (visible) => {
	if (visible) {
		// Delay adjustments till after DOM paint
		requestAnimationFrame(() => adjustWithinViewport())
	}
})

onMounted(() => {
	document.addEventListener('mousedown', closeOnOutsideMouseDown, true)
})

onBeforeUnmount(() => {
	document.removeEventListener('mousedown', closeOnOutsideMouseDown, true)
})
</script>


