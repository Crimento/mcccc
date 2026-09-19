<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { CsvNumberFieldsMeta } from '@/lib/catalog'
import { validateNumericInput } from '@/lib/config'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

const props = defineProps<{
  modelValue: string
  meta: CsvNumberFieldsMeta
  id: string
  label: string
  disabled?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  error: [message: string | null]
}>()

const tokens = computed(() => props.modelValue.split(','))
const indices = computed(() => props.meta.indices ?? props.meta.labels.map((_, index) => index))
const values = computed(() => indices.value.map(index => validateNumericInput(tokens.value[index] ?? '').value ?? 0))
const drafts = ref(values.value.map(String))
const edited = ref(props.meta.labels.map(() => false))
let lastEmitted: string | undefined

const totalMax = computed(() => props.meta.totalMax ?? 100)
const remainderLabel = computed(() => props.meta.remainderLabel ?? 'Human')
const unit = computed(() => props.meta.unit ?? '%')
const anyEdited = computed(() => edited.value.some(Boolean))
const validation = computed(() => drafts.value.map(draft => validateNumericInput(draft, {
  min: props.meta.min,
  max: props.meta.max,
})))
const invalidIndex = computed(() => validation.value.findIndex(result => !result.valid))

// Sum the validated decimal representations exactly: a total such as 33.3 +
// 66.7 must equal 100, while an actual fractional excess must still be rejected.
function decimalParts(value: number) {
  const [mantissa = '0', exponent = '0'] = String(value).split(/e/i)
  const [integer = '0', fraction = ''] = mantissa.split('.')
  const scale = fraction.length - Number(exponent)
  const units = BigInt(`${integer}${fraction}`)
  return scale < 0
    ? { units: units * 10n ** BigInt(-scale), scale: 0 }
    : { units, scale }
}

const budget = computed(() => {
  const maximum = decimalParts(totalMax.value)
  const parts = validation.value.map(result => result.valid ? decimalParts(result.value!) : null)
  const scale = Math.max(maximum.scale, ...parts.map(part => part?.scale ?? 0))
  const units = parts.map(part => part ? part.units * 10n ** BigInt(scale - part.scale) : null)
  return {
    scale,
    units,
    maximum: maximum.units * 10n ** BigInt(scale - maximum.scale),
    total: units.reduce<bigint>((sum, value) => sum + (value ?? 0n), 0n),
  }
})

function decimalNumber(units: bigint, scale: number) {
  return Number(`${units}e-${scale}`)
}

const overBudget = computed(() => invalidIndex.value < 0 && budget.value.total > budget.value.maximum)
const human = computed(() => invalidIndex.value >= 0 || overBudget.value ? null
  : decimalNumber(budget.value.maximum - budget.value.total, budget.value.scale))
const errors = computed(() => validation.value.map(result => anyEdited.value && !result.valid
  ? result.error ?? 'Enter a valid number.' : null))
const budgetError = computed(() => anyEdited.value && overBudget.value
  ? `The listed percentages must total ${totalMax.value}${unit.value} or less.` : null)
const error = computed(() => {
  if (!anyEdited.value) return null
  if (invalidIndex.value >= 0) return `${props.meta.labels[invalidIndex.value]}: ${errors.value[invalidIndex.value]}`
  return budgetError.value
})
const humanHint = computed(() => human.value === null
  ? `${anyEdited.value ? '' : 'Imported percentages are preserved. '}${remainderLabel.value} is unavailable until all listed outcomes are valid and total ${totalMax.value}${unit.value} or less. Use the number fields to correct them.`
  : null)

function availableUnits(index: number) {
  const others = budget.value.units.reduce<bigint>((sum, value, otherIndex) =>
    otherIndex === index ? sum : sum + (value ?? 0n), 0n)
  const remaining = budget.value.maximum - others
  return remaining > 0n ? remaining : 0n
}

function sliderMaximum(index: number) {
  return decimalNumber(availableUnits(index), budget.value.scale)
}

function sliderDisabled(index: number) {
  return props.disabled || !validation.value[index]!.valid || availableUnits(index) === 0n
    || budget.value.units[index]! > availableUnits(index)
}

function sliderValue(index: number) {
  return validateNumericInput(drafts.value[index]!).value ?? values.value[index]!
}

function fieldHint(index: number) {
  return !anyEdited.value && !validation.value[index]!.valid
    ? `Imported value preserved. Enter ${props.meta.min}–${props.meta.max}${unit.value} to enable this slider.`
    : null
}

function descriptionId(index: number) {
  return [
    `${props.id}-${index}-unit`,
    errors.value[index] ? `${props.id}-${index}-error` : fieldHint(index) ? `${props.id}-${index}-hint` : null,
    budgetError.value ? `${props.id}-budget-error` : humanHint.value ? `${props.id}-human-hint` : null,
  ].filter(Boolean).join(' ')
}

function commit() {
  if (invalidIndex.value >= 0 || overBudget.value) return
  const next = [...tokens.value]
  for (const [index, wasEdited] of edited.value.entries()) {
    if (wasEdited) next[indices.value[index]!] = String(validation.value[index]!.value)
  }
  const value = next.join(',')
  if (value === props.modelValue) return
  // Several repairs may be pending. Commit them together and leave every
  // inactive, future, and untouched token exactly as it appeared in the file.
  lastEmitted = value
  emit('update:modelValue', value)
}

function updateInput(index: number, value: string | number) {
  if (props.disabled) return
  drafts.value[index] = String(value)
  edited.value[index] = true
  commit()
}

function updateSlider(index: number, values: number[] | undefined) {
  if (sliderDisabled(index) || values?.length !== 1) return
  updateInput(index, values[0]!)
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
  <div :data-occult-pregnancy-control="id" class="w-full min-w-0 max-w-sm space-y-4">
    <div v-for="(fieldLabel, index) in meta.labels" :key="fieldLabel" class="space-y-2">
      <label :for="`${id}-${index}`" class="block text-xs font-medium">{{ fieldLabel }}</label>
      <div class="flex min-w-0 items-center gap-4">
        <div
          v-if="sliderMaximum(index) === 0"
          role="slider"
          aria-valuemin="0"
          aria-valuemax="0"
          aria-valuenow="0"
          aria-disabled="true"
          :aria-label="`${label}: ${fieldLabel}`"
          :aria-describedby="descriptionId(index)"
          class="ml-2 h-1.5 min-w-16 flex-1 rounded-full bg-input opacity-50"
        />
        <Slider
          v-else
          :id="`${id}-${index}-slider`"
          :model-value="[sliderValue(index)]"
          :min="0"
          :max="sliderMaximum(index)"
          :step="meta.step"
          :disabled="sliderDisabled(index)"
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
            :aria-invalid="!!errors[index] || !!budgetError"
            :aria-describedby="descriptionId(index)"
            :disabled="disabled"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            class="w-20 tabular-nums"
            @update:model-value="updateInput(index, $event)"
          />
          <span :id="`${id}-${index}-unit`" class="text-xs text-muted-foreground">{{ unit }}</span>
        </div>
      </div>
      <p v-if="errors[index]" :id="`${id}-${index}-error`" class="text-xs text-destructive" role="alert">{{ errors[index] }}</p>
      <p v-else-if="fieldHint(index)" :id="`${id}-${index}-hint`" class="text-xs leading-relaxed text-muted-foreground">{{ fieldHint(index) }}</p>
    </div>

    <p v-if="budgetError" :id="`${id}-budget-error`" class="text-xs text-destructive" role="alert">{{ budgetError }}</p>

    <div data-occult-human-remainder class="space-y-2 rounded-lg bg-muted/20 px-3 py-3">
      <label :for="`${id}-human`" class="block text-xs font-medium">{{ remainderLabel }} (calculated)</label>
      <div class="flex min-w-0 items-center gap-4">
        <Slider
          v-if="human !== null"
          :id="`${id}-human-slider`"
          :model-value="[human]"
          :min="0"
          :max="totalMax"
          :step="meta.step"
          disabled
          :thumb-labels="[`${label}: ${remainderLabel}`]"
          class="ml-2 min-w-16 flex-1"
        />
        <div v-else class="ml-2 h-1.5 min-w-16 flex-1 rounded-full bg-input" aria-hidden="true" />
        <div class="flex shrink-0 items-center gap-2">
          <Input
            :id="`${id}-human`"
            :model-value="human === null ? 'Unavailable' : String(human)"
            :aria-label="`${label}: ${remainderLabel}`"
            :aria-describedby="humanHint ? `${id}-human-hint` : undefined"
            readonly
            type="text"
            class="tabular-nums"
            :class="human === null ? 'w-28' : 'w-20'"
          />
          <span class="text-xs text-muted-foreground">{{ unit }}</span>
        </div>
      </div>
      <p v-if="humanHint" :id="`${id}-human-hint`" class="text-xs leading-relaxed text-muted-foreground">{{ humanHint }}</p>
    </div>
  </div>
</template>
