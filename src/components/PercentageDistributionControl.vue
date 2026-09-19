<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { validateNumericInput } from '@/lib/config'
import { isPercentage, percentageTotal, rebalancePercentages } from '@/lib/percentage-distribution'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

const props = defineProps<{
  modelValue: number[]
  labels: string[]
  id: string
  label: string
  disabled?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: number[]]
  error: [message: string | null]
}>()

const drafts = ref(props.modelValue.map(String))
const edited = ref(props.modelValue.map(() => false))
let lastObserved = [...props.modelValue]
let lastEmitted: number[] | undefined
const sameValues = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((value, index) => Object.is(value, b[index]))
const hasMatchingShape = computed(() => props.labels.length > 0 && drafts.value.length === props.labels.length)
const isSingle = computed(() => hasMatchingShape.value && props.labels.length === 1)
const validation = computed(() => drafts.value.map(draft => validateNumericInput(draft, { min: 0, max: 100 })))
const fieldErrors = computed(() => validation.value.map((result, index) =>
  edited.value[index] && !result.valid ? result.error ?? 'Enter a valid percentage.' : null,
))
const error = computed(() => {
  const index = fieldErrors.value.findIndex(message => message !== null)
  if (index >= 0) return `${props.labels[index]}: ${fieldErrors.value[index]}`
  return edited.value.some(Boolean) && validation.value.some(result => !result.valid)
    ? 'Correct the remaining percentages before applying this distribution.' : null
})
const importedTotal = computed(() => percentageTotal(props.modelValue))
const hint = computed(() => {
  if (!hasMatchingShape.value) return 'Imported values preserved. The number of outcomes does not match this control.'
  if (isSingle.value) return props.modelValue[0] === 100 ? null : 'Imported value preserved. A single outcome must be 100%.'
  if (importedTotal.value === null) return 'Imported values preserved. Correct values outside 0–100 before the distribution can be updated.'
  return importedTotal.value === 100 ? null
    : `Imported total: ${importedTotal.value}%. Editing a chance adjusts the distribution to 100%.`
})
const total = computed(() => validation.value.every(result => result.valid)
  ? percentageTotal(validation.value.map(result => result.value!)) : null)

function descriptionId(index: number) {
  return [
    `${props.id}-hint`,
    fieldErrors.value[index] ? `${props.id}-${index}-error` : null,
    error.value ? `${props.id}-error` : null,
  ].filter(Boolean).join(' ')
}

function sliderValue(index: number): number {
  const result = validation.value[index]
  if (result?.valid) return result.value!
  const imported = props.modelValue[index]
  return imported !== undefined && isPercentage(imported) ? imported : 0
}

function commit(next: number[], editedIndex?: number) {
  drafts.value = next.map((value, index) => index === editedIndex ? drafts.value[index]! : String(value))
  edited.value = next.map(() => false)
  lastEmitted = [...next]
  emit('update:modelValue', next)
}

function updateInput(index: number, raw: string | number) {
  if (props.disabled || isSingle.value || !hasMatchingShape.value) return
  drafts.value[index] = String(raw)
  edited.value[index] = true
  if (validation.value.some(result => !result.valid)) return
  const values = validation.value.map(result => result.value!)
  const next = rebalancePercentages(values, index, values[index]!)
  if (next) commit(next, index)
}

function updateSlider(index: number, value: number[] | undefined) {
  if (!value || value.length !== 1 || !validation.value[index]?.valid) return
  updateInput(index, value[0]!)
}

function repairSingle() {
  if (!props.disabled && isSingle.value) commit([100])
}

watch(() => props.modelValue, value => {
  // Wrappers may rebuild an identical array when an unrelated sibling changes.
  if (sameValues(value, lastObserved)) return
  lastObserved = [...value]
  if (lastEmitted && sameValues(value, lastEmitted)) {
    lastEmitted = undefined
    return
  }
  lastEmitted = undefined
  drafts.value = value.map(String)
  edited.value = value.map(() => false)
}, { deep: true })
watch(error, message => emit('error', message), { immediate: true })
onBeforeUnmount(() => emit('error', null))
</script>

<template>
  <div :id="id" class="w-full min-w-0 space-y-4" :data-percentage-distribution="id">
    <div :id="`${id}-hint`" class="space-y-1 text-xs leading-relaxed text-muted-foreground">
      <p>{{ isSingle ? 'A single outcome has a 100% chance.' : 'Other chances adjust automatically to keep the total at 100%.' }}</p>
      <p v-if="hint">{{ hint }}</p>
    </div>

    <div v-for="(fieldLabel, index) in labels" :key="index" class="min-w-0 space-y-2">
      <label :for="`${id}-${index}`" class="block text-xs font-medium">{{ fieldLabel }}</label>
      <div class="flex min-w-0 items-center gap-4">
        <Slider
          :id="`${id}-${index}-slider`"
          :model-value="[sliderValue(index)]"
          :min="0"
          :max="100"
          :step="1"
          :disabled="disabled || isSingle || !hasMatchingShape || !validation[index]?.valid"
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
            :aria-invalid="!!fieldErrors[index]"
            :aria-describedby="descriptionId(index)"
            :disabled="disabled || !hasMatchingShape"
            :readonly="isSingle"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            class="w-24 tabular-nums"
            @update:model-value="updateInput(index, $event)"
          />
          <span class="text-xs text-muted-foreground">%</span>
        </div>
      </div>
      <p v-if="fieldErrors[index]" :id="`${id}-${index}-error`" class="text-xs text-destructive">{{ fieldErrors[index] }}</p>
    </div>

    <p v-if="error" :id="`${id}-error`" role="alert" class="text-xs text-destructive">{{ error }}</p>
    <p v-else-if="total !== null" class="text-xs text-muted-foreground">Total: {{ total }}%</p>
    <Button v-if="isSingle && modelValue[0] !== 100" type="button" variant="secondary" size="sm" :disabled="disabled" @click="repairSingle">Use 100%</Button>
  </div>
</template>
