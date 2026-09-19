<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { offspringCount } from '@/lib/offspring-settings'
import PercentageDistributionControl from './PercentageDistributionControl.vue'
import StructuredValueEditor from './StructuredValueEditor.vue'

const props = defineProps<{
  modelValue: SettingsRecord
  humanMaximum?: JsonValue
  petMaximum?: JsonValue
  id: string
  label: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: SettingsRecord]
  error: [message: string | null]
}>()

const humanCount = computed(() => offspringCount(props.humanMaximum))
const petCount = computed(() => offspringCount(props.petMaximum))
// Every saved count is editable independently of the current human/pet limits.
const entries = computed(() => [1, 2, 3, 4, 5, 6].flatMap(count => {
  const key = String(count)
  if (!Object.hasOwn(props.modelValue, key)) return []
  const value = props.modelValue[key]!
  const percentages = Array.isArray(value) && value.length === count
    && value.every(item => typeof item === 'number' && Number.isFinite(item))
    ? value as number[] : undefined
  return [{ key, count, value, percentages }]
}))
const errors = reactive<Record<string, string>>({})
const error = computed(() => Object.entries(errors).map(([key, message]) => `${key} offspring: ${message}`).join(' ') || null)

function update(key: string, value: JsonValue) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
function setError(key: string, message: string | null) {
  if (message) errors[key] = message
  else delete errors[key]
}
watch(error, value => emit('error', value), { immediate: true })
onBeforeUnmount(() => emit('error', null))
</script>

<template>
  <div :data-offspring-weights="id" class="min-w-0 space-y-4">
    <p class="text-xs text-muted-foreground">
      These distributions are shared by humans and pets. Each offspring count can be edited separately;
      changing either Maximum Offspring setting leaves these percentages intact.
    </p>
    <p v-if="!entries.length" class="text-xs text-muted-foreground">This file contains no recognized offspring-count distributions. Its saved data is preserved.</p>
    <div class="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-3">
    <div
      v-for="entry in entries"
      :key="entry.key"
      :data-offspring-count="entry.key"
      class="min-w-0 space-y-4 rounded-lg bg-muted/20 p-3"
    >
      <div class="space-y-2">
        <h5 class="text-xs font-medium">Maximum {{ entry.count }} {{ entry.count === 1 ? 'baby' : 'babies' }}</h5>
        <div v-if="entry.count === humanCount || entry.count === petCount" class="flex flex-wrap gap-2 text-[10px] text-primary">
          <span v-if="entry.count === humanCount" class="rounded-md bg-primary/10 px-2 py-1">Human maximum</span>
          <span v-if="entry.count === petCount" class="rounded-md bg-primary/10 px-2 py-1">Pet maximum</span>
        </div>
      </div>
      <PercentageDistributionControl
        v-if="entry.percentages"
        :id="`${id}-${entry.key}`"
        :label="label"
        :model-value="entry.percentages"
        :labels="Array.from({ length: entry.count }, (_, index) => index === 0 ? '1 baby' : `${index + 1} babies`)"
        @update:model-value="update(entry.key, $event)"
        @error="setError(entry.key, $event)"
      />
      <template v-else>
        <p class="mb-3 text-xs text-muted-foreground">This saved distribution has an unfamiliar format. Its original structure is preserved.</p>
        <StructuredValueEditor
          :id="`${id}-${entry.key}`"
          :label="`${label}: ${entry.count} offspring`"
          :model-value="entry.value"
          @update:model-value="update(entry.key, $event)"
          @error="setError(entry.key, $event)"
        />
      </template>
    </div>
    </div>
  </div>
</template>
