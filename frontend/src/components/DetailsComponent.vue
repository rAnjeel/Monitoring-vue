<template>
  <div class="details-component">
    <div class="details-columns">
      <div
        v-for="(columnItems, columnIndex) in columns"
        :key="columnIndex"
        class="details-column"
      >
        <ul class="details-list">
          <li v-for="(item, idx) in columnItems" :key="idx" class="details-item">
            <span class="details-label">{{ item.label }}</span>
            <span class="details-separator">:</span>
            <span class="details-value">{{ formatValue(item.value) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { computed, defineProps } from 'vue'

const props = defineProps({
  // Accepts either an object (key/value) or an array of { label, value }
  data: { type: [Object, Array], required: true },
  maxLines: { type: Number, default: 8 },
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

const columns = computed(() => {
  const chunkSize = Math.max(1, Number(props.maxLines) || 1)
  const chunks = []
  for (let i = 0; i < items.value.length; i += chunkSize) {
    chunks.push(items.value.slice(i, i + chunkSize))
  }
  return chunks.length ? chunks : [[]]
})

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

.details-columns {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap; /* allows responsive wrapping */
}

.details-column {
  flex: 1 1 260px; /* grow/shrink with a reasonable min width */
  min-width: 240px;
}

.details-list {
  margin: 0;
  padding-left: 18px; /* bullet indentation */
  list-style: disc;
}

.details-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 2px 0;
  word-break: break-word;
}

.details-label {
  font-weight: 600;
}

.details-separator {
  opacity: 0.7;
}

.details-value {
  color: #2c3e50;
}

@media (max-width: 640px) {
  .details-column {
    flex: 1 1 100%; /* stack on small screens */
    min-width: 100%;
  }
}
</style>


