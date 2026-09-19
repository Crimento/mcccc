<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { parsePetRelationship, petCustomLevelBounds, petRelationshipOptions } from '@/lib/cleaner-settings'
import { validateNumericInput } from '@/lib/config'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

const props = defineProps<{
  id: string
  label: string
  modelValue: string
  disabled?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  error: [message: string | null]
}>()

const parsed = computed(() => parsePetRelationship(props.modelValue))
const custom = computed(() => parsed.value?.mode === 'C' ? parsed.value : null)
const draft = ref('25')
const lastCustom = ref('25')
const error = ref<string | null>(null)
const validation = computed(() => validateNumericInput(draft.value, petCustomLevelBounds))
const selectedOption = computed(() => parsed.value ? `mode-${parsed.value.mode}` : 'from-file')
const customLabel = computed(() => `${props.label}: Custom level`)
const hint = computed(() => custom.value && !validation.value.valid && !error.value
  ? `Imported custom level preserved. ${validation.value.error} Correct the value to enable the slider.`
  : null)
const descriptionId = computed(() => error.value ? `${props.id}-custom-error`
  : hint.value ? `${props.id}-custom-hint` : undefined)
const sliderDisabled = computed(() => props.disabled || !custom.value || !validation.value.valid)

function setError(message: string | null) {
  error.value = message
  emit('error', message)
}

function updateMode(token: unknown) {
  if (props.disabled) return
  const option = petRelationshipOptions.find(option => `mode-${option.value}` === token)
  if (!option) return
  setError(null)
  draft.value = lastCustom.value
  emit('update:modelValue', option.value === 'C' ? `C,${lastCustom.value}` : option.value)
}

function updateLevel(value: string | number) {
  if (props.disabled || !custom.value) return
  draft.value = String(value)
  const result = validateNumericInput(draft.value, petCustomLevelBounds)
  if (!result.valid || result.value === undefined) {
    setError(result.error ?? 'Enter a valid number.')
    return
  }
  setError(null)
  lastCustom.value = String(result.value)
  emit('update:modelValue', `C,${result.value}`)
}

function updateSlider(values: number[] | undefined) {
  if (sliderDisabled.value || values?.length !== 1) return
  updateLevel(values[0]!)
}

watch(() => props.modelValue, () => {
  if (custom.value) {
    draft.value = custom.value.rawLevel
    if (validateNumericInput(custom.value.rawLevel, petCustomLevelBounds).valid) {
      lastCustom.value = custom.value.rawLevel
    }
  } else {
    draft.value = lastCustom.value
  }
  setError(null)
}, { immediate: true })
onBeforeUnmount(() => emit('error', null))
</script>

<template>
  <div data-pet-relationship-control class="w-full min-w-0 max-w-sm space-y-3">
    <Select :model-value="selectedOption" :disabled="disabled" @update:model-value="updateMode">
      <SelectTrigger :id="id" class="w-full min-w-0" :aria-label="label" :disabled="disabled">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in petRelationshipOptions" :key="option.value" :value="`mode-${option.value}`">{{ option.label }}</SelectItem>
        <SelectItem v-if="!parsed" value="from-file">{{ modelValue === '' ? 'Empty value (from file)' : `${modelValue} (from file)` }}</SelectItem>
      </SelectContent>
    </Select>

    <div v-show="custom !== null" class="space-y-2">
      <label :for="`${id}-custom-level`" class="block text-xs text-muted-foreground">Custom relationship level</label>
      <div class="flex min-w-0 items-center gap-5">
        <Slider
          :id="`${id}-custom-slider`"
          :model-value="[custom?.level ?? Number(lastCustom)]"
          :min="petCustomLevelBounds.min"
          :max="petCustomLevelBounds.max"
          :step="petCustomLevelBounds.step"
          :disabled="sliderDisabled"
          :thumb-labels="[customLabel]"
          :thumb-described-by="descriptionId"
          class="min-w-20 flex-1"
          @update:model-value="updateSlider"
        />
        <Input
          :id="`${id}-custom-level`"
          :model-value="draft"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          class="w-24 shrink-0 tabular-nums"
          :aria-label="customLabel"
          :aria-invalid="!!error"
          :aria-describedby="descriptionId"
          :disabled="disabled"
          @update:model-value="updateLevel"
        />
      </div>
      <p v-if="error" :id="`${id}-custom-error`" class="text-xs text-destructive" role="alert">{{ error }}</p>
      <p v-else-if="hint" :id="`${id}-custom-hint`" class="text-xs leading-relaxed text-muted-foreground">{{ hint }}</p>
    </div>
  </div>
</template>
