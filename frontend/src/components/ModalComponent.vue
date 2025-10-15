<template>
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-backdrop" @click.self="onBackdrop">
      <div class="modal" :style="{ width: computedWidth }">
        <div class="modal-header">
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
import { computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: [String, Number], default: 'min(1100px, 96vw)' },
  closeOnBackdrop: { type: Boolean, default: true },
  showClose: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'close'])

const computedWidth = computed(() => typeof props.width === 'number' ? `${props.width}px` : props.width)

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onBackdrop() {
  if (props.closeOnBackdrop) close()
}
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


