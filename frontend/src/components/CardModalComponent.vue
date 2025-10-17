<template>
  <div class="mdc-section">
    <div v-if="title" class="mdc-section-title-row">
      <h3 class="mdc-section-title">{{ title }}</h3>
      <div class="mdc-section-actions">
        <slot name="header-actions" />
      </div>
    </div>

    <div class="mdc-cards-container">
      <button type="button" class="mdc-nav-arrow left" @click="scrollLeft" :disabled="!canScrollLeft">
        <i class="glyphicon glyphicon-chevron-left"></i>
      </button>
      <div class="mdc-cards-wrapper" ref="cardsRef" @scroll="updateNavState">
        <div
        v-for="(item, idx) in visibleItems"
        :key="getItemKey(item, idx)"
        class="mdc-card-item"
        :style="cardStyle"
        >
        <slot name="card" :item="item" :index="idx">
          <div class="mdc-card-header">
            <div class="mdc-card-info">
              <div class="mdc-card-title">{{ getItemTitle(item) }}</div>
              <div class="mdc-card-meta" v-if="getItemType(item)">
                <span class="mdc-meta-item">Type: {{ getItemType(item) }}</span>
              </div>
              <div class="mdc-card-meta" v-if="getItemName(item)">
                <span class="mdc-meta-item">{{ getItemName(item) }}</span>
              </div>

            </div>

            <div :class="['mdc-status-badge', indicatorClass(getItemStatus(item))]">
              {{ statusLabel(getItemStatus(item)) }}
            </div>
          </div>

          <div class="mdc-card-footer">
            <div class="mdc-toggle-section">
              <span class="mdc-label">{{ toggleLabel }}</span>
              <label class="mdc-switch">
                <input
                  type="checkbox"
                  :checked="!!getItemEnabled(item)"
                  @change="onToggle(item, $event.target.checked)"
                />
                <span class="mdc-slider"></span>
              </label>
            </div>

            <button
              type="button"
              class="mdc-action-btn"
              @click="onAction(item)"
            >
              <i class="glyphicon glyphicon-chevron-right"></i>
            </button>
            </div>
          </slot>
        </div>
      </div>
      <button type="button" class="mdc-nav-arrow right" @click="scrollRight" :disabled="!canScrollRight">
        <i class="glyphicon glyphicon-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, defineExpose, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import '../assets/CardModal.css'

const props = defineProps({
  // Data & mapping
  data: { type: Array, default: () => [] },
  keyField: { type: String, default: 'id' },
  titleField: { type: String, default: 'title' },
  typeField: { type: String, default: 'type' },
  nameField: { type: String, default: 'name' },
  statusField: { type: String, default: 'status' },
  enabledField: { type: String, default: 'enabled' },

  // Presentation
  title: { type: String, default: 'Items' },
  toggleLabel: { type: String, default: 'Monitoring' },
  cardStyle: { type: Object, default: () => ({}) },
  maxVisible: { type: Number, default: 8 },
})

const emit = defineEmits(['toggle', 'action'])
const maxCards = ref(props.maxVisible)
const cardsRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const items = computed(() => props.data)
const visibleItems = computed(() => items.value.slice(0, maxCards.value))

// Field accessors (customizable mapping)
function getItemKey(item, index) {
  return item?.[props.keyField] ?? `${index}`
}

function getItemTitle(item) {
  return item?.[props.titleField] ?? ''
}

function getItemType(item) {
  return item?.[props.typeField] ?? ''
}

function getItemName(item) {
  return item?.[props.nameField] ?? ''
}

function getItemStatus(item) {
  return item?.[props.statusField]
}

function getItemEnabled(item) {
  return item?.[props.enabledField]
}

function indicatorClass(status) {
  const v = String(status || '').toLowerCase()
  if (['up', 'on', 'success'].includes(v)) return 'success'
  if (['down', 'off', 'error'].includes(v)) return 'danger'
  return 'neutral'
}

function statusLabel(status) {
  const v = String(status || '').toLowerCase()
  if (['up', 'on', 'success'].includes(v)) return 'Up'
  if (['down', 'off', 'error'].includes(v)) return 'Down'
  return 'Unknown'
}

function onToggle(item, checked) {
  emit('toggle', { item, enabled: checked })
}

function onAction(item) {
  emit('action', { item })
}

defineExpose({ maxCards })

function updateNavState() {
  const el = cardsRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

function scrollLeft() {
  const el = cardsRef.value
  if (!el) return
  el.scrollBy({ left: -300, behavior: 'smooth' })
}

function scrollRight() {
  const el = cardsRef.value
  if (!el) return
  el.scrollBy({ left: 300, behavior: 'smooth' })
}

onMounted(async () => {
  await nextTick()
  updateNavState()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  updateNavState()
}

watch(items, async () => {
  await nextTick()
  updateNavState()
})

window.addEventListener('resize', handleResize)
</script>

<style scoped>
.mdc-section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mdc-section-actions :deep(button) {
  margin-left: 8px;
}
</style>
