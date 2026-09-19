<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { SliderBounds } from '@/lib/catalog'
import { validateNumericInput, type JsonValue } from '@/lib/config'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

const props = defineProps<{ modelValue: JsonValue; bounds: SliderBounds; id: string; label: string; compact?: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: JsonValue]
  error: [message: string | null]
}>()

// Callers only enable this editor for documented ranges with compatible values.
// Keep the imported representation until the user makes a valid edit.
const pair = computed<[number, number]>(() => {
  const values = typeof props.modelValue === 'string'
    ? props.modelValue.split(',').map(Number)
    : props.modelValue as number[]
  return [values[0]!, values[1]!]
})
const drafts = ref<[string, string]>([String(pair.value[0]), String(pair.value[1])])
const edited = ref(false)
const validations = computed(() => drafts.value.map(value =>
  validateNumericInput(value, props.bounds.allowOutOfRange ? undefined : props.bounds)))
const rangeError = computed(() => {
  if (!validations.value[0]!.valid) return `Minimum: ${validations.value[0]!.error}`
  if (!validations.value[1]!.valid) return `Maximum: ${validations.value[1]!.error}`
  if (validations.value[0]!.value! > validations.value[1]!.value!) return 'Minimum must be less than or equal to maximum.'
  return null
})
const error = computed(() => edited.value ? rangeError.value : null)
const outsideSlider = computed(() => validations.value.some(result => result.valid
  && (result.value! < props.bounds.min || result.value! > props.bounds.max)))
const sliderDisabled = computed(() => !!rangeError.value || outsideSlider.value)
const hint = computed(() => {
  if (props.bounds.allowOutOfRange && outsideSlider.value && !rangeError.value) {
    return 'Values outside the slider range are preserved; use the number fields to edit them.'
  }
  return rangeError.value && !edited.value
    ? `Imported range preserved. ${rangeError.value} Correct the values to enable the slider.`
    : null
})
const descriptionId = computed(() => error.value ? `${props.id}-error` : hint.value ? `${props.id}-hint` : undefined)

function commit() {
  if (rangeError.value) return
  const next: [number, number] = [validations.value[0]!.value!, validations.value[1]!.value!]
  emit('update:modelValue', typeof props.modelValue === 'string' ? next.join(',') : next)
}

function updateInput(index: 0 | 1, value: string | number) {
  drafts.value[index] = String(value)
  edited.value = true
  commit()
}

function updateSlider(value: number[] | undefined) {
  if (!value || value.length !== 2 || sliderDisabled.value) return
  drafts.value = [String(value[0]), String(value[1])]
  edited.value = true
  commit()
}

watch(() => props.modelValue, () => {
  drafts.value = [String(pair.value[0]), String(pair.value[1])]
  edited.value = false
}, { deep: true })
watch(error, message => emit('error', message), { immediate: true })
onBeforeUnmount(() => emit('error', null))
</script>

<template>
  <div class="w-full max-w-sm space-y-3" :class="compact ? 'min-w-0' : 'min-w-48'" :data-range-control="id">
    <div class="px-2 pt-2">
      <Slider
        :id="`${id}-slider`"
        :model-value="pair"
        :min="bounds.min"
        :max="bounds.max"
        :step="bounds.step"
        :disabled="sliderDisabled"
        :thumb-labels="[`${label}: Minimum`, `${label}: Maximum`]"
        :thumb-described-by="descriptionId"
        @update:model-value="updateSlider"
      />
    </div>
    <div :class="compact ? 'grid grid-cols-2 gap-2' : 'flex items-start justify-between gap-4'">
      <div class="min-w-0 space-y-1.5">
        <label :for="`${id}-minimum`" class="block text-xs text-muted-foreground">Minimum</label>
        <Input
          :id="`${id}-minimum`"
          :model-value="drafts[0]"
          :aria-label="`${label}: Minimum`"
          :aria-invalid="!!error && (!validations[0]!.valid || validations[0]!.value! > validations[1]!.value!)"
          :aria-describedby="descriptionId"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          class="bg-background tabular-nums"
          :class="compact ? 'w-full min-w-0 px-2' : 'w-24'"
          @update:model-value="updateInput(0, $event)"
        />
      </div>
      <div class="min-w-0 space-y-1.5">
        <label :for="`${id}-maximum`" class="block text-xs text-muted-foreground">Maximum</label>
        <Input
          :id="`${id}-maximum`"
          :model-value="drafts[1]"
          :aria-label="`${label}: Maximum`"
          :aria-invalid="!!error && (!validations[1]!.valid || validations[0]!.value! > validations[1]!.value!)"
          :aria-describedby="descriptionId"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          class="bg-background tabular-nums"
          :class="compact ? 'w-full min-w-0 px-2' : 'w-24'"
          @update:model-value="updateInput(1, $event)"
        />
      </div>
    </div>
    <p v-if="error" :id="`${id}-error`" class="text-xs text-destructive" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="text-xs leading-relaxed text-muted-foreground">{{ hint }}</p>
  </div>
</template>
