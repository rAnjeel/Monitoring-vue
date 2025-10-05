<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="onBackdrop">
    <div class="modal" :style="{ width: computedWidth }">
      <div class="modal-header">
        <slot name="header">
          <h3 class="modal-title">{{ title }}</h3>
        </slot>
        <button v-if="showClose" class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <slot />
      </div>

      <div class="modal-footer">
        <slot name="footer">
          <button class="primary" @click="close">Fermer</button>
        </slot>
      </div>
    </div>
  </div>
  
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
.modal-backdrop {
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  max-height: 90vh;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  padding: 12px 16px;
  overflow: auto;
}

.modal-footer {
  padding: 10px 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.primary {
  background: #2f74c0;
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}
</style>


