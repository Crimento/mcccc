<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { CsvNumberFieldsMeta } from '@/lib/catalog'
import { validateNumericInput } from '@/lib/config'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

const props = defineProps<{ modelValue: string; meta: CsvNumberFieldsMeta; id: string; label: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  error: [message: string | null]
}>()

const tokens = computed(() => props.modelValue.split(','))
const indices = computed(() => props.meta.indices ?? props.meta.labels.map((_, index) => index))
const values = computed(() => indices.value.map(index => validateNumericInput(tokens.value[index]!).value!))
const drafts = ref(values.value.map(String))
const edited = ref(props.meta.labels.map(() => false))
let lastEmitted: string | undefined

// The slider has discrete keyboard steps. Precise fields accept fractional
// percentages because the reference does not restrict these values to integers.
const validation = computed(() => drafts.value.map(draft => validateNumericInput(draft, {
  min: props.meta.min,
  max: props.meta.max,
})))
const errors = computed(() => validation.value.map((result, index) =>
  edited.value[index] && !result.valid ? result.error ?? 'Enter a valid number.' : null))
const error = computed(() => {
  const index = errors.value.findIndex(message => message !== null)
  return index < 0 ? null : `${props.meta.labels[index]}: ${errors.value[index]}`
})

function fieldHint(index: number) {
  return !edited.value[index] && !validation.value[index]!.valid
    ? 'Imported value preserved. Enter a value within the allowed range to enable this slider.'
    : null
}

function descriptionId(index: number) {
  return [
    props.meta.unit ? `${props.id}-${index}-unit` : null,
    errors.value[index] ? `${props.id}-${index}-error` : fieldHint(index) ? `${props.id}-${index}-hint` : null,
  ].filter(Boolean).join(' ') || undefined
}

function updateInput(index: number, value: string | number) {
  drafts.value[index] = String(value)
  edited.value[index] = true
  const result = validation.value[index]!
  if (!result.valid || result.value === undefined) return

  // Replace only this position. Whitespace, numeric formatting, and values in
  // every untouched token remain exactly as they appeared in the imported CSV.
  const next = [...tokens.value]
  next[indices.value[index]!] = String(result.value)
  lastEmitted = next.join(',')
  emit('update:modelValue', lastEmitted)
}

function updateSlider(index: number, next: number[] | undefined) {
  if (!next || next.length !== 1 || !validation.value[index]!.valid) return
  updateInput(index, next[0]!)
}

watch(() => props.modelValue, value => {
  if (value === lastEmitted) {
    lastEmitted = undefined
    return
  }
  lastEmitted = undefined
  drafts.value = values.value.map(String)
  edited.value = props.meta.labels.map(() => false)
})
watch(error, message => emit('error', message), { immediate: true })
onBeforeUnmount(() => emit('error', null))
</script>

<template>
  <div class="w-full min-w-0 max-w-sm space-y-4" :data-csv-number-fields="id">
    <div v-for="(fieldLabel, index) in meta.labels" :key="fieldLabel" class="space-y-2">
      <label :for="`${id}-${index}`" class="block text-xs font-medium">{{ fieldLabel }}</label>
      <div class="flex min-w-0 items-center gap-4">
        <Slider
          :id="`${id}-${index}-slider`"
          :model-value="[values[index]!]"
          :min="meta.min"
          :max="meta.max"
          :step="meta.step"
          :disabled="!validation[index]!.valid"
          :thumb-labels="[`${label}: ${fieldLabel}`]"
          :thumb-described-by="descriptionId(index)"
          class="ml-2 min-w-16 flex-1"
          @update:model-value="updateSlider(index, $event)"
        />
        <div class="flex shrink-0 items-center gap-2">
          <Input
            :id="`${id}-${index}`"
            :model-value="drafts[index]"
            :aria-label="`${label}: ${fieldLabel}`"
            :aria-invalid="!!errors[index]"
            :aria-describedby="descriptionId(index)"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            class="w-20 tabular-nums"
            @update:model-value="updateInput(index, $event)"
          />
          <span v-if="meta.unit" :id="`${id}-${index}-unit`" class="text-xs text-muted-foreground">{{ meta.unit }}</span>
        </div>
      </div>
      <p v-if="errors[index]" :id="`${id}-${index}-error`" class="text-xs text-destructive" role="alert">{{ errors[index] }}</p>
      <p v-else-if="fieldHint(index)" :id="`${id}-${index}-hint`" class="text-xs leading-relaxed text-muted-foreground">{{ fieldHint(index) }} ({{ meta.min }}–{{ meta.max }}{{ meta.unit }})</p>
    </div>
  </div>
</template>
