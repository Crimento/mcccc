<script setup lang="ts">
import { computed } from 'vue'
import { Check, ChevronDown } from '@lucide/vue'
import {
  ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput,
  ComboboxItem, ComboboxItemIndicator, ComboboxPortal, ComboboxRoot,
  ComboboxTrigger, ComboboxViewport,
} from 'reka-ui'
import { personalityTraitOptions } from '@/lib/trait-settings'

const props = defineProps<{
  modelValue: string
  id: string
  label: string
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const options = computed(() => {
  if (!props.modelValue || personalityTraitOptions.some(option => option.value === props.modelValue)) return personalityTraitOptions
  return [...personalityTraitOptions, { value: props.modelValue, label: `${props.modelValue} (from file)` }]
})
function displayValue(value: unknown) {
  return options.value.find(option => option.value === value)?.label ?? ''
}
function update(value: unknown) {
  if (props.disabled || typeof value !== 'string') return
  // Searching never creates an ID or learns one from another saved pair.
  if (personalityTraitOptions.some(option => option.value === value)) emit('update:modelValue', value)
}
</script>

<template>
  <ComboboxRoot
    :model-value="modelValue"
    :disabled="disabled"
    open-on-click
    :reset-model-value-on-clear="false"
    class="min-w-0"
    @update:model-value="update"
  >
    <ComboboxAnchor class="flex h-9 min-w-0 items-center rounded-md bg-muted/35 focus-within:ring-2 focus-within:ring-ring/50">
      <ComboboxInput
        :id="id"
        :display-value="displayValue"
        :aria-label="label"
        :disabled="disabled"
        placeholder="Choose a trait…"
        class="h-full w-full min-w-0 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
      />
      <ComboboxTrigger
        :aria-label="`Show traits for ${label}`"
        :disabled="disabled"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        <ChevronDown class="size-4" aria-hidden="true" />
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent
        position="popper"
        align="start"
        :side-offset="4"
        class="z-50 w-(--reka-combobox-trigger-width) max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-lg"
      >
        <ComboboxViewport class="max-h-64 overflow-y-auto overscroll-contain p-1">
          <ComboboxEmpty class="px-3 py-4 text-xs text-muted-foreground">No matching traits.</ComboboxEmpty>
          <ComboboxItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :text-value="`${option.label} ${option.value}`"
            class="relative cursor-default rounded-md py-2 pr-8 pl-3 text-sm break-words outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
          >
            {{ option.label }}
            <ComboboxItemIndicator class="absolute inset-y-0 right-2 flex items-center text-control">
              <Check class="size-4" aria-hidden="true" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
