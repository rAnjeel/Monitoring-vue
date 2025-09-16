<template>
  <div class="form-container light-form">
    <!-- Header -->
    <div class="form-header" v-if="title || subtitle">
      <h2 class="form-title" v-if="title">{{ title }}</h2>
      <p class="form-subtitle" v-if="subtitle">{{ subtitle }}</p>
    </div>

    <!-- Form -->
    <Form :validation-schema="schema" @submit="handleSubmit" @reset="handleReset">
      <div v-for="field in fields" :key="field.name" class="form-group">
        <label :for="field.name" class="control-label">{{ field.label }}</label>

        <!-- Input text / email / tel -->
        <template v-if="['text','email','tel'].includes(field.type)">
          <Field
            :type="field.type"
            class="form-control"
            :id="field.name"
            :name="field.name"
            :placeholder="field.placeholder"
          />
          <ErrorMessage :name="field.name" class="text-danger small" />
        </template>

        <!-- Textarea -->
        <template v-else-if="field.type === 'textarea'">
          <Field
            as="textarea"
            class="form-control"
            :id="field.name"
            :name="field.name"
            :rows="field.rows || 4"
            :placeholder="field.placeholder"
          />
          <ErrorMessage :name="field.name" class="text-danger small" />
        </template>

        <!-- Select -->
        <template v-else-if="field.type === 'select'">
          <Field
            as="select"
            class="form-control"
            :id="field.name"
            :name="field.name"
          >
            <option value="">-- Select --</option>
            <option
              v-for="opt in field.options"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </Field>
          <ErrorMessage :name="field.name" class="text-danger small" />
        </template>
      </div>

      <div class="form-actions mt-3">
        <button type="submit" class="btn btn-primary">Submit</button>
        <button type="reset" class="btn btn-secondary">Reset</button>
      </div>
    </Form>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { Form, Field, ErrorMessage } from "vee-validate";
import * as yup from "yup";

// Props
const props = defineProps({
  title: String,
  subtitle: String,
  fields: {
    type: Array,
    required: true,
    validator: (value) => {
      return value.every(field => 
        field.name && field.label && field.type
      );
    }
  },
});

// Emits
const emit = defineEmits(["submit", "reset"]);

// Validation schema dynamique basé sur fields
const schema = yup.object().shape(
  props.fields.reduce((acc, field) => {
    let validator = yup.mixed();
    
    switch (field.type) {
      case 'text':
      case 'textarea':
        validator = yup.string();
        if (field.required) {
          validator = validator.required(`${field.label} is required`);
        }
        if (field.minLength) {
          validator = validator.min(field.minLength, `${field.label} must be at least ${field.minLength} characters`);
        }
        break;
      
      case 'email':
        validator = yup.string().email('Invalid email');
        if (field.required) {
          validator = validator.required('Email is required');
        }
        break;
      
      case 'tel':
        validator = yup.string()
          .matches(/^[0-9+\-\s]+$/, 'Invalid phone number');
        if (field.required) {
          validator = validator.required('Phone is required');
        }
        break;
      
      case 'select':
        validator = yup.string();
        if (field.required) {
          validator = validator.required('Please select an option');
        }
        break;
    }
    
    acc[field.name] = validator;
    return acc;
  }, {})
);

// Handlers
function handleSubmit(values) {
  emit("submit", values);
}

function handleReset() {
  emit("reset");
}
</script>