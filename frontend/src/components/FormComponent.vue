<template>
  <div class="form-component">
    <form @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div v-for="(input, index) in inputs" :key="index" class="form-group" :class="getFieldClass(input)">
          <label :for="`input-${index}`" class="control-label">
            {{ input.title }}
            <span v-if="input.required" class="text-danger">*</span>
          </label>
        
        <!-- Text Input -->
        <input
          v-if="input.type === 'text' || input.type === 'email' || input.type === 'number'"
          :id="`input-${index}`"
          v-model="formData[input.field]"
          :type="input.type"
          :placeholder="input.placeholder || ''"
          :required="input.required || false"
          :disabled="input.disabled || false"
          :maxlength="input.maxLength"
          class="form-control input-sm"
        />
        
        <!-- Password Input -->
        <input
          v-else-if="input.type === 'password'"
          :id="`input-${index}`"
          v-model="formData[input.field]"
          type="password"
          :placeholder="input.placeholder || ''"
          :required="input.required || false"
          :disabled="input.disabled || false"
          class="form-control input-sm"
        />
        
        <!-- Textarea -->
        <textarea
          v-else-if="input.type === 'textarea'"
          :id="`input-${index}`"
          v-model="formData[input.field]"
          :placeholder="input.placeholder || ''"
          :required="input.required || false"
          :disabled="input.disabled || false"
          :rows="input.rows || 3"
          class="form-control input-sm"
        />
        
        <!-- Select -->
        <select
          v-else-if="input.type === 'select'"
          :id="`input-${index}`"
          v-model="formData[input.field]"
          :required="input.required || false"
          :disabled="input.disabled || false"
          class="form-control input-sm"
        >
          <option value="" disabled>{{ input.placeholder || 'Select...' }}</option>
          <option
            v-for="(option, optIdx) in input.options"
            :key="optIdx"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        
        <!-- Checkbox -->
        <div v-else-if="input.type === 'checkbox'" class="checkbox">
          <label>
            <input
              :id="`input-${index}`"
              v-model="formData[input.field]"
              type="checkbox"
              :disabled="input.disabled || false"
            />
            {{ input.checkboxLabel || '' }}
          </label>
        </div>
        
        <!-- Date/Datetime -->
        <input
          v-else-if="input.type === 'date' || input.type === 'datetime-local'"
          :id="`input-${index}`"
          v-model="formData[input.field]"
          :type="input.type"
          :required="input.required || false"
          :disabled="input.disabled || false"
          class="form-control input-sm"
        />
        
        <!-- Help text -->
        <small v-if="input.helpText" class="help-block text-muted">
          {{ input.helpText }}
        </small>
        </div>
      </div>
      
      <!-- Buttons -->
      <div class="form-buttons" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
        <button
          v-for="(button, btnIdx) in buttons"
          :key="btnIdx"
          :type="button.type || 'button'"
          :class="['btn', 'btn-sm', button.class || 'btn-default']"
          :disabled="button.disabled || false"
          @click="handleButtonClick(button)"
        >
          <span v-if="button.icon" :class="button.icon" style="margin-right: 4px;"></span>
          {{ button.label }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  formTitle: {
    type: String,
    default: ''
  },
  inputs: {
    type: Array,
    required: true,
    // Format: [{ field: 'name', title: 'Name', type: 'text', defaultValue: '', required: true, ... }]
  },
  buttons: {
    type: Array,
    default: () => [
      { label: 'Cancel', type: 'button', class: 'btn-default', action: 'cancel' },
      { label: 'Submit', type: 'submit', class: 'btn-primary', action: 'submit' }
    ]
  },
  initialData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['submit', 'cancel', 'button-click']);

// Initialize form data from inputs and initialData
const formData = ref({});

function initializeFormData() {
  const data = {};
  props.inputs.forEach(input => {
    // Priority: initialData > defaultValue > empty
    if (props.initialData && Object.prototype.hasOwnProperty.call(props.initialData, input.field)) {
      data[input.field] = props.initialData[input.field];
    } else if (Object.prototype.hasOwnProperty.call(input, 'defaultValue')) {
      data[input.field] = input.defaultValue;
    } else {
      // Default values based on type
      if (input.type === 'checkbox') {
        data[input.field] = false;
      } else if (input.type === 'number') {
        data[input.field] = 0;
      } else {
        data[input.field] = '';
      }
    }
  });
  formData.value = data;
}

// Initialize on mount
initializeFormData();

// Watch for changes in initialData
watch(() => props.initialData, () => {
  initializeFormData();
}, { deep: true });

function handleSubmit() {
  emit('submit', { ...formData.value });
}

function handleButtonClick(button) {
  if (button.action === 'cancel') {
    emit('cancel');
  } else if (button.action === 'submit') {
    handleSubmit();
  } else {
    emit('button-click', { action: button.action, data: { ...formData.value } });
  }
}

function getFieldClass(input) {
  // Déterminer la largeur du champ selon le type
  if (input.type === 'checkbox') return 'field-full';
  if (input.type === 'textarea') return 'field-full';
  if (input.type === 'password') return 'field-medium';
  if (input.field === 'hostname' || input.field === 'ip') return 'field-medium';
  return 'field-medium'; // Par défaut
}
</script>

<style scoped>
.form-component {
  padding: 8px 0;
  max-width: 900px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.field-full {
  grid-column: 1 / -1;
}

.field-medium {
  grid-column: span 1;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .field-medium {
    grid-column: 1 / -1;
  }
}

.control-label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  font-size: 12px;
  color: #475569;
}

.form-control {
  width: 100%;
  font-size: 13px;
}

.help-block {
  display: block;
  margin-top: 3px;
  font-size: 11px;
}

.checkbox label {
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.form-buttons {
  grid-column: 1 / -1;
  margin-top: 8px;
}
</style>
