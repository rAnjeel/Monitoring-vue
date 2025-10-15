<template>
  <div class="details-component">
    <div class="section">
      <!-- <h3 class="section-title">{{ title }}</h3> -->
      <div class="device-details">
        <div v-for="(item, idx) in items" :key="idx" class="detail-item">
          <span class="detail-label">{{ item.label }}</span>
          <span class="detail-value">{{ formatValue(item.value) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'

const props = defineProps({
  // Accepts either an object (key/value) or an array of { label, value }
  data: { type: [Object, Array], required: true },
  // title: { type: String, default: 'Details' },
})

function normalizeItems(input) {
  if (Array.isArray(input)) {
    return input
      .filter(Boolean)
      .map((it) => {
        if (it && typeof it === 'object' && 'label' in it && 'value' in it) return it
        // Fallback if provided as [label, value]
        if (Array.isArray(it) && it.length >= 2) return { label: String(it[0]), value: it[1] }
        return null
      })
      .filter(Boolean)
  }
  if (input && typeof input === 'object') {
    return Object.entries(input).map(([label, value]) => ({ label, value }))
  }
  return []
}

const items = computed(() => normalizeItems(props.data))

function formatValue(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    try { return JSON.stringify(value) } catch (_) { return String(value) }
  }
  return String(value)
}
</script>

<style scoped>
.details-component {
  width: 100%;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0px;
}

/* Device Details */
.device-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
  /* font-family: 'Courier New', monospace; */
  word-break: break-word;
}
</style>


