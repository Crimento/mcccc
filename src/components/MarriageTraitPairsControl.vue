<script setup lang="ts">
import { computed, ref } from 'vue'
import type { JsonValue } from '@/lib/config'
import { personalityTraitOptions } from '@/lib/trait-settings'
import { addMarriageTraitPair, isMarriageTraitPair, removeMarriageTraitPair, updateMarriageTraitPair } from '@/lib/marriage-traits'
import { Button } from '@/components/ui/button'
import TraitSelect from './TraitSelect.vue'

const props = defineProps<{
  modelValue: JsonValue[]
  id: string
  label: string
  kind: 'required' | 'conflict'
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: JsonValue[]] }>()
const first = ref('')
const second = ref('')
const knownIds = new Set(personalityTraitOptions.map(option => option.value))
const canAdd = computed(() => !props.disabled && knownIds.has(first.value) && knownIds.has(second.value))
const rows = computed(() => props.modelValue.map((value, index) => ({
  index, value, pair: isMarriageTraitPair(value) ? value : undefined,
})))
function traitName(value: string) {
  return personalityTraitOptions.find(option => option.value === value)?.label ?? `${value} (from file)`
}
function update(index: number, position: 0 | 1, value: string) {
  if (props.disabled) return
  emit('update:modelValue', updateMarriageTraitPair(props.modelValue, index, position, value))
}
function remove(index: number) {
  if (props.disabled) return
  emit('update:modelValue', removeMarriageTraitPair(props.modelValue, index))
}
function add() {
  if (!canAdd.value) return
  emit('update:modelValue', addMarriageTraitPair(props.modelValue, first.value, second.value))
  first.value = ''
  second.value = ''
}
</script>

<template>
  <div :id="id" data-marriage-trait-pairs class="min-w-0 space-y-4">
    <p class="text-xs leading-relaxed text-muted-foreground">
      {{ kind === 'required'
        ? 'If either Sim has one trait, their partner must have the other trait in that pair.'
        : 'A Sim with one trait cannot randomly marry a Sim with the other trait in that pair.' }}
      Each pair applies in both directions, for MCCC random marriages.
    </p>
    <p v-if="!rows.length" class="text-xs text-muted-foreground">No trait pairs configured.</p>
    <div
      v-for="row in rows"
      :key="row.index"
      :data-trait-pair-index="row.index"
      class="min-w-0 space-y-3 rounded-lg bg-muted/20 p-3"
    >
      <template v-if="row.pair">
        <div class="flex items-center justify-between gap-3">
          <p class="text-xs font-medium">Pair {{ row.index + 1 }}</p>
          <Button
            type="button" variant="ghost" size="xs"
            :disabled="disabled"
            :aria-label="`Remove pair ${row.index + 1} from ${label}`"
            @click="remove(row.index)"
          >Remove pair</Button>
        </div>
        <div class="grid min-w-0 gap-3 sm:grid-cols-2">
          <div v-for="position in ([0, 1] as const)" :key="position" class="min-w-0 space-y-2">
            <label :for="`${id}-${row.index}-${position}`" class="block text-xs text-muted-foreground">{{ position === 0 ? 'First trait' : 'Second trait' }}</label>
            <TraitSelect
              :id="`${id}-${row.index}-${position}`"
              :label="`${label}: Pair ${row.index + 1}, ${position === 0 ? 'first' : 'second'} trait`"
              :model-value="row.pair[position]"
              :disabled="disabled"
              @update:model-value="update(row.index, position, $event)"
            />
          </div>
        </div>
        <p class="text-xs leading-relaxed break-words text-muted-foreground">
          {{ traitName(row.pair[0]) }} {{ kind === 'required' ? 'requires' : 'conflicts with' }} {{ traitName(row.pair[1]) }}.
        </p>
      </template>
      <div v-else data-preserved-trait-pair class="min-w-0 space-y-2">
        <p class="text-xs text-muted-foreground">Saved entry {{ row.index + 1 }} has an unfamiliar format and is kept unchanged.</p>
        <pre class="max-h-32 overflow-auto text-xs whitespace-pre-wrap break-all text-muted-foreground">{{ JSON.stringify(row.value, null, 2) }}</pre>
      </div>
    </div>
    <div class="min-w-0 space-y-3 rounded-lg bg-muted/20 p-3">
      <p class="text-xs font-medium">New pair</p>
      <div class="grid min-w-0 gap-3 sm:grid-cols-2">
        <div class="min-w-0 space-y-2">
          <label :for="`${id}-new-first`" class="block text-xs text-muted-foreground">First trait</label>
          <TraitSelect :id="`${id}-new-first`" v-model="first" :label="`${label}: New pair, first trait`" :disabled="disabled" />
        </div>
        <div class="min-w-0 space-y-2">
          <label :for="`${id}-new-second`" class="block text-xs text-muted-foreground">Second trait</label>
          <TraitSelect :id="`${id}-new-second`" v-model="second" :label="`${label}: New pair, second trait`" :disabled="disabled" />
        </div>
      </div>
      <Button type="button" variant="secondary" size="sm" :disabled="!canAdd" :aria-label="`Add pair to ${label}`" @click="add">Add pair</Button>
    </div>
  </div>
</template>
