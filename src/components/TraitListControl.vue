<script setup lang="ts">
import { computed, ref } from 'vue'
import { personalityTraitOptions, petTraitOptions, toggleKnownTrait, toggleKnownPetTrait } from '@/lib/trait-settings'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  modelValue: string
  label: string
  id: string
  disabled?: boolean
  traitType?: 'personality' | 'pet'
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const expanded = ref(false)
const query = ref('')
const options = computed(() => props.traitType === 'pet' ? petTraitOptions : personalityTraitOptions)
const knownIds = computed(() => new Set(options.value.map(option => option.value)))
const selectedIds = computed(() => new Set(props.modelValue.split(',').map(token => token.trim()).filter(Boolean)))
const selectedCount = computed(() => options.value.filter(option => selectedIds.value.has(option.value)).length)
const unknownTokens = computed(() => props.modelValue.split(',')
  .filter(token => token.trim() !== '' && !knownIds.value.has(token.trim())))
const filteredOptions = computed(() => {
  const search = query.value.trim()
  if (!search) return options.value
  const nameSearch = search.toLocaleLowerCase()
  return options.value.filter(option => option.value === search || option.label.toLocaleLowerCase().includes(nameSearch))
})

function toggle(value: string, checked: boolean | 'indeterminate') {
  if (props.disabled || checked === 'indeterminate') return
  const toggleTrait = props.traitType === 'pet' ? toggleKnownPetTrait : toggleKnownTrait
  emit('update:modelValue', toggleTrait(props.modelValue, value, checked))
}
</script>

<template>
  <div :id="id" data-trait-list-control class="trait-list-control min-w-0 space-y-3">
    <Button
      :id="`${id}-toggle`"
      type="button"
      variant="outline"
      size="sm"
      :disabled="disabled"
      :aria-label="`${expanded ? 'Close' : 'Edit'} traits for ${label}`"
      :aria-expanded="expanded"
      :aria-controls="`${id}-options`"
      @click="expanded = !expanded"
    >
      <svg class="size-3.5 transition-transform" :class="expanded ? 'rotate-90' : ''" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 4 4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      {{ expanded ? 'Close traits' : 'Edit traits' }}
      <span class="text-xs font-normal text-muted-foreground">{{ selectedCount }} selected</span>
    </Button>

    <div v-show="expanded" :id="`${id}-options`" class="min-w-0 space-y-3">
      <Input
        :id="`${id}-search`"
        v-model="query"
        type="search"
        placeholder="Search traits…"
        :aria-label="`Search traits for ${label}`"
        :disabled="disabled"
        autocomplete="off"
        class="w-full min-w-0"
      />
      <div class="max-h-72 overflow-y-auto overscroll-contain rounded-lg bg-muted/20 p-2" role="group" :aria-label="label">
        <div class="trait-options-grid">
          <label
            v-for="option in filteredOptions"
            :key="option.value"
            :for="`${id}-trait-${option.value}`"
            class="flex min-w-0 items-center gap-3 rounded-md px-2 py-2.5 text-xs leading-relaxed transition-colors"
            :class="[
              selectedIds.has(option.value) ? 'bg-muted/40 text-foreground' : 'text-muted-foreground',
              disabled ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50',
            ]"
          >
            <Checkbox
              :id="`${id}-trait-${option.value}`"
              :model-value="selectedIds.has(option.value)"
              :aria-label="`${label}: ${option.label}`"
              :disabled="disabled"
              @update:model-value="toggle(option.value, $event)"
            />
            <span class="min-w-0 break-words">{{ option.label }}</span>
          </label>
        </div>
        <p v-if="!filteredOptions.length" class="px-2 py-4 text-xs text-muted-foreground">No matching traits.</p>
      </div>
    </div>

    <div v-if="unknownTokens.length" class="space-y-2">
      <p class="text-xs leading-relaxed text-muted-foreground">Unrecognized trait IDs are kept unchanged.</p>
      <div class="flex min-w-0 flex-wrap gap-1.5" aria-label="Preserved trait IDs">
        <code v-for="(token, index) in unknownTokens" :key="index" class="max-w-full whitespace-pre-wrap break-all rounded-md bg-muted/40 px-2 py-1 text-[10px] leading-relaxed text-muted-foreground">{{ token }}</code>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trait-list-control { container-type: inline-size; }
.trait-options-grid { display: grid; gap: 0.25rem; }
@container (min-width: 30rem) {
  .trait-options-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
