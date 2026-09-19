<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch, type PropType } from 'vue'
import { serializeConfig, validateNumericInput, type JsonValue } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { DefaultNumberFieldMeta, SliderBounds } from '@/lib/catalog'
import DefaultNumberField from './DefaultNumberField.vue'
import RangeValueEditor from './RangeValueEditor.vue'

defineOptions({ name: 'StructuredValueEditor' })

const props = defineProps({
  // Keep blank strings as strings at every recursive field boundary.
  modelValue: { type: [String, Boolean, Number, Array, Object, null] as PropType<JsonValue>, required: true },
  label: { type: String, required: true },
  id: { type: String, required: true },
  rangeFields: Object as PropType<Record<string, SliderBounds>>,
  rangeBounds: Object as PropType<SliderBounds>,
  numericFields: Object as PropType<Record<string, DefaultNumberFieldMeta>>,
  numericMeta: Object as PropType<DefaultNumberFieldMeta>,
  rawOnly: Boolean,
  compact: Boolean,
})
const emit = defineEmits<{
  'update:modelValue': [value: JsonValue]
  error: [message: string | null]
}>()

const expanded = ref(false)
const rawMode = ref(false)
const numberDraft = ref(String(props.modelValue))
const jsonDraft = ref(JSON.stringify(props.modelValue, null, 2))
const localError = ref<string | null>(null)
const childErrors = reactive(new Map<string, string>())
let lastEmittedJson: string | undefined

const isContainer = computed(() => props.modelValue !== null && typeof props.modelValue === 'object')
const isRange = computed(() => !!props.rangeBounds && Array.isArray(props.modelValue)
  && props.modelValue.length === 2
  && props.modelValue.every(value => typeof value === 'number' && Number.isFinite(value)))
const isDefaultNumber = computed(() => !!props.numericMeta && typeof props.modelValue === 'number')
const entries = computed<[string, JsonValue][]>(() => {
  if (!isContainer.value) return []
  const values = props.modelValue as Record<string, JsonValue>
  const originalEntries = Object.entries(values)
  const orderedFields = props.numericFields ?? props.rangeFields
  if (!orderedFields || Array.isArray(props.modelValue)) return originalEntries
  const knownKeys = Object.keys(orderedFields)
  return [
    ...knownKeys.filter(key => Object.hasOwn(values, key)).map(key => [key, values[key]!] as [string, JsonValue]),
    ...originalEntries.filter(([key]) => !knownKeys.includes(key)),
  ]
})
const error = computed(() => localError.value ?? childErrors.values().next().value ?? null)
const summary = computed(() => `${entries.value.length} ${Array.isArray(props.modelValue) ? 'items' : 'fields'}`)

function fieldLabel(key: string) {
  if (Array.isArray(props.modelValue)) return `Item ${Number(key) + 1}`
  if (props.numericFields?.[key]?.label) return props.numericFields[key].label
  return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
}

function updateChild(key: string, value: JsonValue) {
  const current = props.modelValue
  if (Array.isArray(current)) {
    const next = [...current]
    next[Number(key)] = value
    emit('update:modelValue', next)
  } else if (current && typeof current === 'object') {
    emit('update:modelValue', { ...current, [key]: value })
  }
}

function setChildError(key: string, message: string | null) {
  if (message) childErrors.set(key, `${fieldLabel(key)}: ${message}`)
  else childErrors.delete(key)
}

function updateNumber(value: string | number) {
  numberDraft.value = String(value)
  const result = validateNumericInput(numberDraft.value)
  localError.value = result.valid ? null : result.error ?? 'Enter a valid number.'
  if (result.valid && result.value !== undefined) emit('update:modelValue', result.value)
}

function valueType(value: JsonValue): string {
  if (value === null) return 'null'
  return Array.isArray(value) ? 'array' : typeof value
}

function checkTypes(previous: JsonValue, next: JsonValue, path: string): string | null {
  if (valueType(previous) !== valueType(next)) return `${path} must remain a ${valueType(previous)} value.`
  if (previous && next && typeof previous === 'object' && typeof next === 'object') {
    for (const [key, value] of Object.entries(previous)) {
      if (Object.hasOwn(next, key)) {
        const problem = checkTypes(value, (next as Record<string, JsonValue>)[key]!, `${path}.${key}`)
        if (problem) return problem
      }
    }
  }
  return null
}

function checkNumericFields(next: JsonValue): string | null {
  if (!props.numericFields || !next || typeof next !== 'object' || Array.isArray(next)) return null
  const previous = props.modelValue && typeof props.modelValue === 'object' && !Array.isArray(props.modelValue)
    ? props.modelValue : {}
  for (const [key, meta] of Object.entries(props.numericFields)) {
    const value = next[key]
    // Imported outliers and mismatched types round-trip unchanged. Only new or
    // edited numeric values must satisfy the known bounds or default sentinel.
    if (typeof value !== 'number' || value === previous[key] || value === meta.defaultSentinel) continue
    const result = validateNumericInput(String(value), meta)
    if (!result.valid) return `${fieldLabel(key)}: ${result.error ?? 'Enter a valid number.'}`
  }
  return null
}

function updateJson(value: string | number) {
  jsonDraft.value = String(value)
  let next: JsonValue
  try {
    next = JSON.parse(jsonDraft.value) as JsonValue
  } catch {
    localError.value = 'Enter valid JSON. Check quotation marks, commas, and brackets.'
    return
  }
  const typeError = checkTypes(props.modelValue, next, props.label)
  if (typeError) {
    localError.value = typeError
    return
  }
  try {
    // Apply the same recursive validation that download uses, including finite
    // numbers and unsafe object keys, before committing an advanced edit.
    serializeConfig({ value: next })
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Enter a valid config value.'
    return
  }
  const numericError = checkNumericFields(next)
  if (numericError) {
    localError.value = numericError
    return
  }
  localError.value = null
  lastEmittedJson = JSON.stringify(next)
  emit('update:modelValue', next)
}

function toggleRawMode() {
  if (error.value) return
  rawMode.value = !rawMode.value
  jsonDraft.value = JSON.stringify(props.modelValue, null, 2)
}

watch(() => props.modelValue, value => {
  numberDraft.value = String(value)
  const serialized = JSON.stringify(value)
  if (serialized !== lastEmittedJson) {
    jsonDraft.value = JSON.stringify(value, null, 2)
    localError.value = null
  }
  lastEmittedJson = undefined
  for (const key of childErrors.keys()) {
    if (!entries.value.some(([entryKey]) => entryKey === key)) childErrors.delete(key)
  }
}, { deep: true })

watch(error, message => emit('error', message), { immediate: true })
onBeforeUnmount(() => emit('error', null))
</script>

<template>
  <div class="min-w-0 space-y-2">
    <Textarea
      v-if="rawOnly"
      :id="`${id}-json`"
      :model-value="jsonDraft"
      class="min-h-64 max-w-full font-mono text-xs"
      :aria-label="`${label} JSON`"
      :aria-invalid="!!localError"
      :aria-describedby="localError ? `${id}-error` : undefined"
      spellcheck="false"
      @update:model-value="updateJson"
    />
    <RangeValueEditor
      v-else-if="isRange && rangeBounds"
      :id="id"
      :label="label"
      :model-value="modelValue"
      :bounds="rangeBounds"
      :compact="compact"
      @update:model-value="emit('update:modelValue', $event)"
      @error="localError = $event"
    />
    <DefaultNumberField
      v-else-if="isDefaultNumber && numericMeta && typeof modelValue === 'number'"
      :id="id"
      :label="label"
      :model-value="modelValue"
      :meta="numericMeta"
      :compact="compact"
      @update:model-value="emit('update:modelValue', $event)"
      @error="localError = $event"
    />
    <template v-else-if="isContainer">
      <Button
        type="button"
        variant="outline"
        size="sm"
        :aria-expanded="expanded"
        :aria-controls="`${id}-details`"
        :aria-label="`${expanded ? 'Close' : 'Edit'} details for ${label}`"
        @click="expanded = !expanded"
      >
        <svg class="size-3.5 transition-transform" :class="expanded ? 'rotate-90' : ''" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 4 4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        {{ expanded ? 'Close details' : 'Edit details' }}
        <span class="text-xs font-normal text-muted-foreground">{{ summary }}</span>
      </Button>

      <div v-show="expanded" :id="`${id}-details`" class="min-w-0 space-y-5 rounded-lg bg-muted/20 p-4">
        <div class="flex items-center justify-between gap-3">
          <span :id="`${id}-mode-help`" class="text-xs text-muted-foreground">{{ error ? 'Correct the invalid value before switching editors.' : rawMode ? 'Preserve the existing value types.' : 'Changes are saved as you edit.' }}</span>
          <Button type="button" variant="ghost" size="sm" class="h-7 shrink-0 px-2 text-xs" :disabled="!!error" :aria-label="`${rawMode ? 'Use fields' : 'Edit JSON'} for ${label}`" :aria-describedby="error ? `${id}-mode-help` : undefined" @click="toggleRawMode">
            {{ rawMode ? 'Use fields' : 'Edit JSON' }}
          </Button>
        </div>

        <Textarea
          v-if="rawMode"
          :id="`${id}-json`"
          :model-value="jsonDraft"
          class="min-h-40 max-w-full font-mono text-xs"
          :aria-label="`${label} JSON`"
          :aria-invalid="!!localError"
          :aria-describedby="localError ? `${id}-error` : undefined"
          spellcheck="false"
          @update:model-value="updateJson"
        />
        <div v-show="!rawMode" class="space-y-4">
          <p v-if="!entries.length" class="text-xs text-muted-foreground">This {{ Array.isArray(modelValue) ? 'list' : 'group' }} is empty. Use Edit JSON to add values.</p>
          <div v-for="([key, value], index) in entries" :key="key" class="space-y-2">
            <label :for="`${id}-field-${index}`" class="block text-xs font-medium">{{ fieldLabel(key) }}</label>
            <StructuredValueEditor
              :id="`${id}-field-${index}`"
              :label="`${label}: ${fieldLabel(key)}`"
              :model-value="value"
              :range-bounds="rangeFields?.[key]"
              :numeric-meta="numericFields?.[key]"
              @update:model-value="updateChild(key, $event)"
              @error="setChildError(key, $event)"
            />
          </div>
        </div>
      </div>
    </template>

    <Switch
      v-else-if="typeof modelValue === 'boolean'"
      :id="id"
      :model-value="modelValue"
      :aria-label="label"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <Input
      v-else-if="typeof modelValue === 'number'"
      :id="id"
      :model-value="numberDraft"
      type="text"
      inputmode="decimal"
      class="w-32 tabular-nums"
      :aria-label="label"
      :aria-invalid="!!localError"
      :aria-describedby="localError ? `${id}-error` : undefined"
      autocomplete="off"
      @update:model-value="updateNumber"
    />
    <Input
      v-else-if="typeof modelValue === 'string'"
      :id="id"
      :model-value="modelValue"
      class="w-full min-w-28"
      :aria-label="label"
      autocomplete="off"
      @update:model-value="emit('update:modelValue', String($event))"
    />
    <span v-else class="font-mono text-xs text-muted-foreground">null</span>

    <p v-if="(rawOnly || (!isRange && !isDefaultNumber)) && (localError || (!expanded && error))" :id="`${id}-error`" class="max-w-lg text-xs text-destructive" role="alert">{{ localError ?? error }}</p>
  </div>
</template>
