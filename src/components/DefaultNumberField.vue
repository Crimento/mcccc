<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { DefaultNumberFieldMeta } from '@/lib/catalog'
import { validateNumericInput } from '@/lib/config'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

const props = defineProps<{
  modelValue: number
  meta: DefaultNumberFieldMeta
  id: string
  label: string
  compact?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: number]
  error: [message: string | null]
}>()

const useDefault = computed(() => props.modelValue === props.meta.defaultSentinel)
const hasSlider = computed(() => props.meta.sliderStep !== undefined)
const displayedValue = computed(() => !hasSlider.value && useDefault.value ? props.meta.defaultValue : props.modelValue)
const draft = ref(String(displayedValue.value))
const error = ref<string | null>(null)
const lastCustom = ref<number | undefined>(!useDefault.value && validateNumericInput(String(props.modelValue), props.meta).valid
  ? props.modelValue : undefined)
const importedOutlier = computed(() => !useDefault.value && !error.value
  && !validateNumericInput(String(props.modelValue), props.meta).valid)
const sliderMin = computed(() => Math.min(props.meta.min, props.meta.defaultSentinel))
// Keep an imported outlier in the input and export, with its slider disabled.
const sliderValue = computed(() => Math.min(props.meta.max, Math.max(sliderMin.value, props.modelValue)))
const helpIds = computed(() => [
  `${props.id}-help`,
  error.value ? `${props.id}-error` : importedOutlier.value ? `${props.id}-imported` : null,
].filter(Boolean).join(' '))

function updateNumber(value: string | number) {
  draft.value = String(value)
  const parsed = validateNumericInput(draft.value)
  if (parsed.valid && parsed.value === props.meta.defaultSentinel) {
    if (hasSlider.value) {
      error.value = null
      emit('update:modelValue', props.meta.defaultSentinel)
    } else updateDefault(true)
    return
  }
  const result = validateNumericInput(draft.value, props.meta)
  error.value = result.valid ? null : result.error ?? 'Enter a valid number.'
  if (result.valid && result.value !== undefined) {
    if (result.value !== props.meta.defaultSentinel) lastCustom.value = result.value
    emit('update:modelValue', result.value)
  }
}

function updateSlider(values: number[] | undefined) {
  if (values?.[0] !== undefined) updateNumber(values[0])
}

function updateDefault(value: boolean | 'indeterminate') {
  if (value === 'indeterminate') return
  error.value = null
  const next = value ? props.meta.defaultSentinel : lastCustom.value ?? props.meta.defaultValue
  draft.value = String(value ? props.meta.defaultValue : next)
  emit('update:modelValue', next)
}

watch(() => props.modelValue, value => {
  draft.value = String(displayedValue.value)
  error.value = null
  if (!useDefault.value && validateNumericInput(String(value), props.meta).valid) lastCustom.value = value
})
watch(error, message => emit('error', message), { immediate: true })
onBeforeUnmount(() => emit('error', null))
</script>

<template>
  <div class="min-w-0 space-y-2.5">
    <div v-if="hasSlider" class="flex w-full max-w-sm items-center" :class="compact ? 'gap-3' : 'gap-5'">
      <Slider
        :id="`${id}-slider`"
        :model-value="[sliderValue]"
        :min="sliderMin"
        :max="meta.max"
        :step="meta.sliderStep"
        :disabled="importedOutlier || !!error"
        :thumb-labels="[label]"
        :thumb-described-by="helpIds"
        class="min-w-20 flex-1"
        @update:model-value="updateSlider"
      />
      <Input
        :id="id"
        :model-value="draft"
        :aria-label="label"
        :aria-invalid="!!error"
        :aria-describedby="helpIds"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        class="shrink-0 tabular-nums"
        :class="compact ? 'w-20' : 'w-24'"
        @update:model-value="updateNumber"
      />
    </div>
    <div v-else class="flex flex-wrap items-center gap-x-4 gap-y-3">
      <Input
        :id="id"
        :model-value="draft"
        :disabled="useDefault"
        :aria-label="label"
        :aria-invalid="!!error"
        :aria-describedby="helpIds"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        class="w-28 shrink-0 tabular-nums"
        @update:model-value="updateNumber"
      />
      <label :for="`${id}-default`" class="flex cursor-pointer items-center gap-2 text-xs">
        <Checkbox
          :id="`${id}-default`"
          :model-value="useDefault"
          :aria-label="`${label}: Use EA default`"
          :aria-describedby="`${id}-help`"
          @update:model-value="updateDefault"
        />
        Use EA default
      </label>
    </div>
    <div :id="`${id}-help`" class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span>EA default: {{ meta.defaultValue }} {{ meta.unit }}</span>
      <span v-if="!compact">{{ hasSlider && meta.min <= meta.defaultSentinel ? 'Range' : 'Custom' }}: {{ meta.min }}–{{ meta.max }} {{ meta.unit }}</span>
      <span v-if="hasSlider && !compact">{{ meta.defaultSentinel }} uses the EA default.</span>
    </div>
    <p v-if="error" :id="`${id}-error`" class="text-xs text-destructive" role="alert">{{ error }}</p>
    <p v-else-if="importedOutlier" :id="`${id}-imported`" class="text-xs leading-relaxed text-muted-foreground">Imported value preserved. Enter {{ meta.min }}–{{ meta.max }} {{ meta.unit }}, or use the EA default.</p>
  </div>
</template>
