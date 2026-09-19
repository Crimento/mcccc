<script setup lang="ts">
import { computed, ref } from 'vue'
import { skillOptions, toggleKnownSkill } from '@/lib/skill-settings'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  modelValue: string
  label: string
  id: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const expanded = ref(false)
const query = ref('')
const knownIds = new Set(skillOptions.map(option => option.value))
const selectedIds = computed(() => new Set(props.modelValue.split(',').map(token => token.trim()).filter(Boolean)))
const selectedCount = computed(() => skillOptions.filter(option => selectedIds.value.has(option.value)).length)
const unknownTokens = computed(() => props.modelValue.split(',')
  .filter(token => token.trim() !== '' && !knownIds.has(token.trim())))
const filteredOptions = computed(() => {
  const search = query.value.trim().toLocaleLowerCase()
  return search ? skillOptions.filter(option => `${option.label} ${option.value}`.toLocaleLowerCase().includes(search)) : skillOptions
})

function toggle(value: string, checked: boolean | 'indeterminate') {
  if (checked === 'indeterminate') return
  emit('update:modelValue', toggleKnownSkill(props.modelValue, value, checked))
}
</script>

<template>
  <div :id="id" class="skill-list-control min-w-0 space-y-3">
    <Button
      :id="`${id}-toggle`"
      type="button"
      variant="outline"
      size="sm"
      :aria-label="`${expanded ? 'Close' : 'Edit'} skills for ${label}`"
      :aria-expanded="expanded"
      :aria-controls="`${id}-options`"
      @click="expanded = !expanded"
    >
      <svg class="size-3.5 transition-transform" :class="expanded ? 'rotate-90' : ''" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 4 4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      {{ expanded ? 'Close skills' : 'Edit skills' }}
      <span class="text-xs font-normal text-muted-foreground">{{ selectedCount }} selected</span>
    </Button>

    <div v-show="expanded" :id="`${id}-options`" class="min-w-0 space-y-3">
      <Input
        :id="`${id}-search`"
        v-model="query"
        type="search"
        placeholder="Search skills…"
        :aria-label="`Search skills for ${label}`"
        autocomplete="off"
        class="w-full min-w-0"
      />
      <div class="max-h-72 overflow-y-auto overscroll-contain rounded-lg bg-muted/20 p-2" role="group" :aria-label="label">
        <div class="skill-options-grid">
          <label
            v-for="option in filteredOptions"
            :key="option.value"
            :for="`${id}-skill-${option.value}`"
            class="flex min-w-0 cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 text-xs leading-relaxed transition-colors hover:bg-muted/50"
            :class="selectedIds.has(option.value) ? 'bg-muted/40 text-foreground' : 'text-muted-foreground'"
          >
            <Checkbox
              :id="`${id}-skill-${option.value}`"
              :model-value="selectedIds.has(option.value)"
              :aria-label="`${label}: ${option.label}`"
              @update:model-value="toggle(option.value, $event)"
            />
            <span class="min-w-0 break-words">{{ option.label }}</span>
          </label>
        </div>
        <p v-if="!filteredOptions.length" class="px-2 py-4 text-xs text-muted-foreground">No matching skills.</p>
      </div>
    </div>

    <div v-if="unknownTokens.length" class="space-y-2">
      <p class="text-xs leading-relaxed text-muted-foreground">Unrecognized skill IDs are kept unchanged.</p>
      <div class="flex min-w-0 flex-wrap gap-1.5" aria-label="Preserved skill IDs">
        <code v-for="(token, index) in unknownTokens" :key="index" class="max-w-full whitespace-pre-wrap break-all rounded-md bg-muted/40 px-2 py-1 text-[10px] leading-relaxed text-muted-foreground">{{ token }}</code>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-list-control { container-type: inline-size; }
.skill-options-grid { display: grid; gap: 0.25rem; }
@container (min-width: 30rem) {
  .skill-options-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
