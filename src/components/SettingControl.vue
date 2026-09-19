<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch, type PropType } from 'vue'
import type { SettingMeta } from '@/lib/catalog'
import { toggleCsvValue, validateNumericInput, type JsonValue } from '@/lib/config'
import { occultAgingEntries } from '@/lib/occult-settings'
import { menuOrderEntries } from '@/lib/menu-order'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import CsvNumberFields from './CsvNumberFields.vue'
import ArrayNumberFields from './ArrayNumberFields.vue'
import RangeValueEditor from './RangeValueEditor.vue'
import StructuredValueEditor from './StructuredValueEditor.vue'
import MenuOrderControl from './MenuOrderControl.vue'
import TraitListControl from './TraitListControl.vue'
import MarriageTraitPairsControl from './MarriageTraitPairsControl.vue'
import PetRelationshipControl from './PetRelationshipControl.vue'
import SituationOutfitsControl from './SituationOutfitsControl.vue'
import OccultPregnancyControl from './OccultPregnancyControl.vue'

const props = defineProps({
  meta: { type: Object as PropType<SettingMeta>, required: true },
  species: String,
  disabled: Boolean,
  // String must precede Boolean so Vue preserves empty config strings.
  modelValue: { type: [String, Boolean, Number, Array, Object, null] as PropType<JsonValue>, required: true },
})
const emit = defineEmits<{
  'update:modelValue': [value: JsonValue]
  error: [message: string | null]
}>()

const id = computed(() => `setting-${encodeURIComponent(props.meta.key)}`)
const error = ref<string | null>(null)
const numberDraft = ref(String(props.modelValue))
const isStructured = computed(() => props.modelValue === null || typeof props.modelValue === 'object')
const isPetRelationships = computed(() => props.meta.key === 'Cleaner_CleanPetRelationships' && typeof props.modelValue === 'string')
const isMenuOrder = computed(() => props.meta.key === 'Menu_Order' && menuOrderEntries(props.modelValue) !== null)
const agingEntries = computed(() => occultAgingEntries(props.meta, props.modelValue))
const agingErrors = reactive<Record<string, string>>({})
const numberArray = computed(() => Array.isArray(props.modelValue)
  && props.modelValue.length === props.meta.arrayNumbers?.labels.length
  && props.modelValue.every(value => typeof value === 'number' && Number.isFinite(value))
  ? props.modelValue as number[] : null)
const isRange = computed(() => {
  if (!props.meta.range || typeof props.modelValue !== 'string') return false
  const values = props.modelValue.split(',')
  return values.length === 2 && values.every(value => validateNumericInput(value).valid)
})
const isCsvNumbers = computed(() => {
  if (!props.meta.csvNumbers || typeof props.modelValue !== 'string') return false
  const values = props.modelValue.split(',')
  return values.length === (props.meta.csvNumbers.tokenCount ?? props.meta.csvNumbers.labels.length)
    && values.every(value => validateNumericInput(value).valid)
})
const hasNumberSlider = computed(() => typeof props.modelValue === 'number'
  && props.meta.min !== undefined && props.meta.max !== undefined)
const numberSliderError = computed(() => validateNumericInput(numberDraft.value, props.meta).error)
const numberHint = computed(() => hasNumberSlider.value && numberSliderError.value && !error.value
  ? `Imported value preserved. ${numberSliderError.value.replace(/\.$/, '')} to enable the slider.` : null)
const numberDescriptionId = computed(() => [
  props.meta.unit ? `${id.value}-unit` : null,
  props.meta.valueLabels?.[String(props.modelValue)] ? `${id.value}-value-label` : null,
  error.value ? `${id.value}-error` : numberHint.value ? `${id.value}-hint` : null,
].filter(Boolean).join(' ') || undefined)
const selectedCodes = computed(() => typeof props.modelValue === 'string'
  ? props.modelValue.split(',').map(value => value.trim()).filter(Boolean)
  : [])
const options = computed(() => {
  const known = (props.meta.options ?? []).map(option => ({ ...option, unknown: false }))
  const grouped = known.some(option => option.group)
  const present = props.meta.kind === 'multiselect' ? selectedCodes.value : [String(props.modelValue)]
  for (const value of present) {
    if (!known.some(option => option.value === value)) {
      known.push({
        value, label: value === '' ? 'Empty value (from file)' : `${value} (from file)`, unknown: true,
        ...(grouped ? { group: 'Other choices from your file' } : {}),
      })
    }
  }
  return known
})
const optionGroups = computed(() => {
  const indexed = options.value.map((option, index) => ({ ...option, index }))
  return [...new Set(indexed.map(option => option.group))]
    .map(label => ({ label, options: indexed.filter(option => option.group === label) }))
})

// The Select's values are opaque indexes. This also supports a genuine empty-string
// setting without reserving a special token that could collide with an imported code.
const selectedOption = computed(() => `option-${options.value.findIndex(option => option.value === String(props.modelValue))}`)

function setError(message: string | null) {
  error.value = message
  emit('error', message)
}

function updateAging(code: string, value: JsonValue) {
  if (props.disabled) return
  if (!props.modelValue || typeof props.modelValue !== 'object' || Array.isArray(props.modelValue)) return
  emit('update:modelValue', { ...props.modelValue, [code]: value })
}

function setAgingError(code: string, message: string | null) {
  if (message) agingErrors[code] = message
  else delete agingErrors[code]
  const first = agingEntries.value.find(entry => agingErrors[entry.code])
  setError(first ? `${first.label}: ${agingErrors[first.code]}` : null)
}

function updateNumber(value: string | number) {
  if (props.disabled) return
  numberDraft.value = String(value)
  const result = validateNumericInput(numberDraft.value, props.meta)
  if (!result.valid || result.value === undefined) {
    setError(result.error ?? 'Enter a valid number.')
    return
  }
  setError(null)
  emit('update:modelValue', result.value)
}

function updateNumberSlider(values: number[] | undefined) {
  if (values?.length === 1 && !numberSliderError.value) updateNumber(values[0]!)
}

function updateOption(token: unknown) {
  if (props.disabled) return
  const option = options.value.find((_, index) => `option-${index}` === token)
  if (!option) return
  if (typeof props.modelValue === 'number') {
    const result = validateNumericInput(option.value, props.meta)
    if (!result.valid || result.value === undefined) {
      setError(result.error ?? 'This option is not a valid number.')
      return
    }
    emit('update:modelValue', result.value)
  } else if (typeof props.modelValue === 'boolean') {
    if (option.value !== 'true' && option.value !== 'false') {
      setError('This setting requires a true or false value.')
      return
    }
    emit('update:modelValue', option.value === 'true')
  } else {
    emit('update:modelValue', option.value)
  }
  setError(null)
}

function updateCode(code: string, selected: boolean | 'indeterminate') {
  if (props.disabled) return
  if (typeof props.modelValue !== 'string') return
  setError(null)
  emit('update:modelValue', toggleCsvValue(props.modelValue, code, selected === true))
}

watch(() => props.modelValue, value => {
  numberDraft.value = String(value)
  if (!isStructured.value && !isCsvNumbers.value) setError(null)
})

onBeforeUnmount(() => emit('error', null))
</script>

<template>
  <div
    class="min-w-0 space-y-2"
    :data-setting-control="meta.key"
    :aria-disabled="disabled || undefined"
    :inert="disabled && (isStructured || !!numberArray || isCsvNumbers || isRange || !!agingEntries.length)"
  >
    <div v-if="meta.readOnlyReason" class="min-w-0 space-y-3" :aria-label="`${meta.label} (read-only)`">
      <p class="text-xs leading-relaxed text-muted-foreground">{{ meta.readOnlyReason }}</p>
      <pre data-readonly-value class="max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">{{ JSON.stringify(modelValue, null, 2) }}</pre>
    </div>

    <SituationOutfitsControl
      v-else-if="meta.key === 'Dresser_ReplaceSituationOutfits' && typeof modelValue === 'string'"
      :id="id"
      :label="meta.label"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <PetRelationshipControl
      v-else-if="isPetRelationships && typeof modelValue === 'string'"
      :id="id"
      :label="meta.label"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
      @error="setError"
    />

    <MenuOrderControl
      v-else-if="isMenuOrder"
      :id="id"
      :label="meta.label"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <div v-else-if="agingEntries.length" class="occult-aging-control min-w-0">
      <div class="occult-aging-grid" :class="species ? 'single-species' : ''">
      <div v-for="entry in agingEntries" v-show="!species || species === entry.label" :key="entry.code" class="min-w-0 space-y-3 rounded-lg bg-muted/20 p-3" :data-occult-species="entry.code">
        <p class="text-xs font-semibold">{{ entry.label }}</p>
        <SettingControl
          :meta="entry.meta"
          :model-value="entry.value"
          :disabled="disabled"
          @update:model-value="updateAging(entry.code, $event)"
          @error="setAgingError(entry.code, $event)"
        />
      </div>
      </div>
    </div>

    <ArrayNumberFields
      v-else-if="numberArray && meta.arrayNumbers"
      :id="id"
      :label="meta.label"
      :model-value="numberArray"
      :meta="meta.arrayNumbers"
      @update:model-value="emit('update:modelValue', $event)"
      @error="setError"
    />

    <MarriageTraitPairsControl
      v-else-if="(meta.key === 'Marriage_RequiredTraitsList' || meta.key === 'Marriage_ConflictTraitsList') && Array.isArray(modelValue)"
      :id="id"
      :label="meta.label"
      :kind="meta.key === 'Marriage_RequiredTraitsList' ? 'required' : 'conflict'"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <StructuredValueEditor
      v-else-if="isStructured"
      :id="id"
      :label="meta.label"
      :model-value="modelValue"
      :range-fields="meta.rangeFields"
      :numeric-fields="meta.numericFields"
      @update:model-value="emit('update:modelValue', $event)"
      @error="setError"
    />

    <OccultPregnancyControl
      v-else-if="isCsvNumbers && meta.csvNumbers?.totalMax !== undefined && typeof modelValue === 'string'"
      :id="id"
      :label="meta.label"
      :model-value="modelValue"
      :meta="meta.csvNumbers"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
      @error="setError"
    />

    <CsvNumberFields
      v-else-if="isCsvNumbers && meta.csvNumbers && typeof modelValue === 'string'"
      :id="id"
      :label="meta.label"
      :model-value="modelValue"
      :meta="meta.csvNumbers"
      @update:model-value="emit('update:modelValue', $event)"
      @error="setError"
    />

    <RangeValueEditor
      v-else-if="isRange && meta.range"
      :id="id"
      :label="meta.label"
      :model-value="modelValue"
      :bounds="meta.range"
      @update:model-value="emit('update:modelValue', $event)"
      @error="setError"
    />

    <div v-else-if="typeof modelValue === 'boolean' && meta.kind !== 'select'" class="flex items-center gap-3">
      <Switch
        :id="id"
        :model-value="modelValue"
        :aria-label="meta.label"
        :disabled="disabled"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <span class="min-w-6 text-xs text-muted-foreground" aria-hidden="true">{{ modelValue ? 'On' : 'Off' }}</span>
    </div>

    <TraitListControl
      v-else-if="(meta.key === 'CAS_Trait_Blacklist' || meta.key === 'CAS_Pet_Trait_Blacklist') && typeof modelValue === 'string'"
      :id="id"
      :label="meta.label"
      :model-value="modelValue"
      :disabled="disabled"
      :trait-type="meta.key === 'CAS_Pet_Trait_Blacklist' ? 'pet' : 'personality'"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <div
      v-else-if="meta.kind === 'multiselect' && typeof modelValue === 'string'"
      class="max-w-xl space-y-4"
      role="group"
      :aria-label="meta.label"
    >
      <div v-for="group in optionGroups" :key="group.label ?? ''" :role="group.label ? 'group' : undefined" :aria-label="group.label" class="space-y-2">
        <p v-if="group.label" class="text-xs font-medium">{{ group.label }}</p>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="option in group.options"
            :key="option.value"
            :for="`${id}-${option.index}`"
            class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/70"
            :class="selectedCodes.includes(option.value) ? 'bg-muted/60 text-foreground' : 'bg-muted/30 text-muted-foreground'"
          >
            <Checkbox
              :id="`${id}-${option.index}`"
              :model-value="selectedCodes.includes(option.value)"
              :aria-label="`${meta.label}: ${option.label}`"
              :disabled="disabled"
              @update:model-value="updateCode(option.value, $event)"
            />
            {{ option.label }}
          </label>
        </div>
      </div>
      <span v-if="!options.length" class="text-sm text-muted-foreground">No options available.</span>
      <p v-if="!selectedCodes.length && meta.emptySelectionLabel" class="text-xs leading-relaxed text-muted-foreground">{{ meta.emptySelectionLabel }}</p>
    </div>

    <Select v-else-if="meta.kind === 'select'" :model-value="selectedOption" :disabled="disabled" @update:model-value="updateOption">
      <SelectTrigger :id="id" class="w-full min-w-44 max-w-sm" :aria-label="meta.label" :aria-invalid="!!error" :aria-describedby="error ? `${id}-error` : undefined" :disabled="disabled">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="(option, index) in options" :key="option.value" :value="`option-${index}`">
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <div v-else-if="typeof modelValue === 'number'" class="w-full max-w-sm space-y-2">
      <div :class="hasNumberSlider ? 'flex min-w-48 items-center gap-5' : ''">
        <Slider
          v-if="hasNumberSlider"
          :id="`${id}-slider`"
          :model-value="[modelValue]"
          :min="meta.min"
          :max="meta.max"
          :step="meta.step ?? 1"
          :disabled="disabled || !!numberSliderError"
          :thumb-labels="[meta.label]"
          :thumb-described-by="numberDescriptionId"
          class="min-w-20 flex-1"
          @update:model-value="updateNumberSlider"
        />
        <div class="flex shrink-0 items-center gap-2">
          <Input
            :id="id"
            :model-value="numberDraft"
            type="text"
            inputmode="decimal"
            :class="hasNumberSlider ? (meta.unit ? 'w-20 tabular-nums' : 'w-24 tabular-nums') : 'w-32 tabular-nums'"
            :aria-label="meta.label"
            :aria-invalid="!!error"
            :aria-describedby="numberDescriptionId"
            :disabled="disabled"
            autocomplete="off"
            @update:model-value="updateNumber"
          />
          <span v-if="meta.unit" :id="`${id}-unit`" class="text-xs whitespace-nowrap text-muted-foreground">{{ meta.unit }}</span>
        </div>
      </div>
      <p v-if="meta.valueLabels?.[String(modelValue)]" :id="`${id}-value-label`" class="text-xs text-muted-foreground">{{ meta.valueLabels[String(modelValue)] }} ({{ modelValue }})</p>
      <p v-if="numberHint" :id="`${id}-hint`" class="text-xs leading-relaxed text-muted-foreground">{{ numberHint }}</p>
    </div>

    <div v-else class="w-full min-w-0 max-w-sm space-y-2">
      <Input
        :id="id"
        :model-value="String(modelValue)"
        class="w-full min-w-40"
        :aria-label="meta.label"
        :aria-describedby="meta.csvNumbers ? `${id}-format-hint` : undefined"
        :disabled="disabled"
        autocomplete="off"
        @update:model-value="emit('update:modelValue', String($event))"
      />
      <p v-if="meta.csvNumbers" :id="`${id}-format-hint`" class="text-xs leading-relaxed text-muted-foreground">Expected {{ meta.csvNumbers.labels.length }} comma-separated numbers. The imported text is preserved.</p>
    </div>

    <p v-if="error && !isStructured && !isRange && !isCsvNumbers && !isPetRelationships" :id="`${id}-error`" class="max-w-sm text-xs text-destructive" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.occult-aging-control { container-type: inline-size; }
.occult-aging-grid { display: grid; gap: 1.5rem; }
@container (min-width: 32rem) {
  .occult-aging-grid:not(.single-species) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container (min-width: 52rem) {
  .occult-aging-grid:not(.single-species) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
