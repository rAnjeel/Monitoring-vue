<template>
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-backdrop" @click.self="onBackdrop">
      <div ref="modalRef" class="modal" :style="modalStyle">
        <div class="modal-header" @mousedown="onHeaderMouseDown">
          <div class="header-content">
            <slot name="header">
              <h4 class="modal-title text-uppercase">{{ title }}</h4>
            </slot>
          </div>
          <button v-if="showClose" class="close-btn" @click="close" aria-label="Close modal">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <slot />
        </div>
        
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, defineProps, defineEmits, ref, onMounted, onBeforeUnmount, watch, nextTick, defineExpose } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: [String, Number], default: 'min(1100px, 96vw)' },
  maxHeight: { type: [String, Number], default: '90vh' },
  closeOnBackdrop: { type: Boolean, default: true },
  showClose: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'close'])

const computedWidth = computed(() => typeof props.width === 'number' ? `${props.width}px` : props.width)

// Draggable state (exposed)
const draggable = ref(true)
defineExpose({ draggable })

// Drag positions
const modalRef = ref(null)
const isDragging = ref(false)
const hasDragged = ref(false)
const left = ref(0)
const top = ref(0)
let startX = 0
let startY = 0
let startLeft = 0
let startTop = 0

const modalStyle = computed(() => {
  const base = { width: computedWidth.value }
  const computedMaxH = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
  base.maxHeight = computedMaxH
  if (hasDragged.value) {
    return {
      ...base,
      position: 'fixed',
      left: `${left.value}px`,
      top: `${top.value}px`,
      margin: '0',
    }
  }
  return base
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onBackdrop() {
  if (props.closeOnBackdrop) close()
}

function onHeaderMouseDown(e) {
  if (!draggable.value) return
  if (e.button !== 0) return
  const el = modalRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  startX = e.clientX
  startY = e.clientY
  // If first drag, initialize to current rect
  if (!hasDragged.value) {
    left.value = rect.left
    top.value = rect.top
  }
  startLeft = left.value
  startTop = top.value
  isDragging.value = true
  hasDragged.value = true
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e) {
  if (!isDragging.value) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  const el = modalRef.value
  const vw = window.innerWidth
  const vh = window.innerHeight
  const rect = el ? el.getBoundingClientRect() : { width: 0, height: 0 }
  let nextLeft = startLeft + dx
  let nextTop = startTop + dy
  // Constrain to viewport
  const minLeft = 0
  const minTop = 0
  const maxLeft = Math.max(0, vw - rect.width)
  const maxTop = Math.max(0, vh - rect.height)
  left.value = Math.min(Math.max(nextLeft, minLeft), maxLeft)
  top.value = Math.min(Math.max(nextTop, minTop), maxTop)
}

function onMouseUp() {
  if (!isDragging.value) return
  isDragging.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

onMounted(() => {
  // Reset drag state whenever opened
  watch(() => props.modelValue, async (val) => {
    if (val) {
      await nextTick()
      const el = modalRef.value
      if (!el) return
      const rect = el.getBoundingClientRect()
      // center by default (no hasDragged, so flex centering applies). Setup left/top for first drag usage.
      left.value = rect.left
      top.value = rect.top
      isDragging.value = false
    } else {
      isDragging.value = false
    }
  }, { immediate: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped>
/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

/* Modal Container */
.modal {
  max-height: 90vh;
  max-width: 95vw;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-appear 0.2s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 15px;
  background: #2c3e50;
  border-bottom: 1px solid #e5e7eb;
  min-height: 56px;
  cursor: move;
}

.header-content {
  flex: 1;
  min-width: 0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #e7e7e7;
  letter-spacing: -0.01em;
  line-height: 1.4;
}

/* Close Button */
.close-btn {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: #6b7280;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.close-btn:active {
  background: #e5e7eb;
  transform: scale(0.95);
}

.close-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Body */
.modal-body {
  padding: 24px;
  overflow: auto;
  flex: 1;
}

/* Custom Scrollbar */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f9fafb;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Footer */
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal {
  animation: modal-appear 0.2s ease-out;
}

.modal-fade-leave-active .modal {
  animation: modal-disappear 0.15s ease-in;
}

@keyframes modal-disappear {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .modal {
    max-height: 95vh;
    border-radius: 16px 16px 0 0;
    margin-top: auto;
  }
  
  .modal-header {
    padding: 16px 20px;
    min-height: 64px;
  }
  
  .modal-title {
    font-size: 18px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .modal-footer {
    padding: 12px 20px;
  }
}
</style>


