<script setup lang="ts">
import { computed, ref } from 'vue'
import { situationOutfitEntries, situationOutfitUnknownEntries, updateSituationOutfit } from '@/lib/dresser-settings'
import { dresserStandardOutfitOptions } from '@/data/dresser-choices'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const props = defineProps<{
  id: string
  label: string
  modelValue: string
  disabled?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

type SituationEntry = ReturnType<typeof situationOutfitEntries>[number]

const expanded = ref(true)
const options = dresserStandardOutfitOptions()
const entries = computed(() => situationOutfitEntries(props.modelValue))
const unknownEntries = computed(() => situationOutfitUnknownEntries(props.modelValue))

function selectedOption(entry: SituationEntry) {
  if (!entry.values.length) return 'keep'
  if (entry.ambiguous) return 'from-file'
  const index = options.findIndex(option => option.value === entry.values[0])
  return index < 0 ? 'from-file' : `outfit-${index}`
}

function importedLabel(entry: SituationEntry) {
  return entry.ambiguous ? 'Multiple values (from file)' : `${entry.values[0]} (from file)`
}

function updateOutfit(code: string, token: unknown) {
  if (props.disabled) return
  if (token === 'keep') {
    emit('update:modelValue', updateSituationOutfit(props.modelValue, code, null))
    return
  }
  const option = options.find((_, index) => `outfit-${index}` === token)
  if (!option) return
  emit('update:modelValue', updateSituationOutfit(props.modelValue, code, option.value))
}
</script>

<template>
  <div :id="id" data-situation-outfits-control class="situation-outfits-control w-full min-w-0 space-y-4">
    <Button
      :id="`${id}-toggle`"
      type="button"
      variant="outline"
      size="sm"
      :disabled="disabled"
      :aria-label="`${expanded ? 'Hide' : 'Edit'} situations for ${label}`"
      :aria-expanded="expanded"
      :aria-controls="`${id}-situations`"
      @click="expanded = !expanded"
    >
      <svg class="size-3.5 transition-transform" :class="expanded ? 'rotate-90' : ''" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 4 4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      {{ expanded ? 'Hide situations' : 'Edit situations' }}
    </Button>

    <div v-show="expanded" :id="`${id}-situations`" class="situation-outfits-grid">
      <div
        v-for="entry in entries"
        :key="entry.code"
        :data-situation="entry.code"
        class="min-w-0 space-y-2 rounded-lg bg-muted/20 p-3"
      >
        <label :for="`${id}-situation-${entry.code}`" class="block text-xs font-medium leading-relaxed">{{ entry.label }}</label>
        <Select :model-value="selectedOption(entry)" :disabled="disabled" @update:model-value="updateOutfit(entry.code, $event)">
          <SelectTrigger :id="`${id}-situation-${entry.code}`" class="w-full min-w-0" :aria-label="`${label}: ${entry.label}`" :disabled="disabled">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="keep">Keep situation outfit</SelectItem>
            <SelectItem v-for="(option, index) in options" :key="option.value" :value="`outfit-${index}`">{{ option.label }}</SelectItem>
            <SelectItem v-if="selectedOption(entry) === 'from-file'" value="from-file">{{ importedLabel(entry) }}</SelectItem>
          </SelectContent>
        </Select>
        <p v-if="entry.ambiguous" class="break-words text-xs leading-relaxed text-muted-foreground">Saved values: {{ entry.values.join(', ') }}. Choose an outfit to replace these values.</p>
      </div>
    </div>

    <div v-if="unknownEntries.length" data-situation-unknown-entries class="space-y-2">
      <p class="text-xs leading-relaxed text-muted-foreground">Unrecognized entries are kept unchanged.</p>
      <div class="flex min-w-0 flex-wrap gap-1.5" aria-label="Preserved situation entries">
        <code v-for="(entry, index) in unknownEntries" :key="index" class="max-w-full whitespace-pre-wrap break-all rounded-md bg-muted/40 px-2 py-1 text-[10px] leading-relaxed text-muted-foreground">{{ entry }}</code>
      </div>
    </div>
  </div>
</template>

<style scoped>
.situation-outfits-control { container-type: inline-size; }
.situation-outfits-grid { display: grid; gap: 1rem; }
@container (min-width: 32rem) {
  .situation-outfits-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container (min-width: 48rem) {
  .situation-outfits-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
