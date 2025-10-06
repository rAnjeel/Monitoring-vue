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
  position: fixed;
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
  padding: 14px 18px;
  background: linear-gradient(135deg, #425e7a 0%, #2c3e50 100%);
  color: #efefef;
  border-bottom: 0;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.close-btn {
  border: none;
  background: rgba(255,255,255,0.16);
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 18px;
  line-height: 32px;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.05s ease;
}

.close-btn:hover {
  background: rgba(255,255,255,0.28);
}

.close-btn:active {
  transform: scale(0.98);
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
</style>


