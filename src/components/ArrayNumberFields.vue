<script setup lang="ts">
import type { CsvNumberFieldsMeta } from '@/lib/catalog'
import CsvNumberFields from './CsvNumberFields.vue'

defineProps<{ modelValue: number[]; meta: CsvNumberFieldsMeta; id: string; label: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: number[]]
  error: [message: string | null]
}>()
</script>

<template>
  <CsvNumberFields
    :id="id"
    :label="label"
    :model-value="modelValue.join(',')"
    :meta="meta"
    @update:model-value="emit('update:modelValue', $event.split(',').map(Number))"
    @error="emit('error', $event)"
  />
</template>
