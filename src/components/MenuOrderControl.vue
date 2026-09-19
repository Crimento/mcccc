<script setup lang="ts">
import { computed, nextTick, ref, type ComponentPublicInstance } from 'vue'
import type { JsonValue } from '@/lib/config'
import { menuOrderEntries, moveMenuEntry, type MenuOrderEntry, type MenuMove } from '@/lib/menu-order'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  id: string
  label: string
  modelValue: JsonValue
  disabled?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: JsonValue]
}>()

const expanded = ref(false)
const announcement = ref('')
const entries = computed(() => menuOrderEntries(props.modelValue) ?? [])
const rows = new Map<string, HTMLElement>()
const moves: { value: MenuMove; label: string; path: string }[] = [
  { value: 'up', label: 'up', path: 'M8 13V3m-4 4 4-4 4 4' },
  { value: 'down', label: 'down', path: 'M8 3v10m-4-4 4 4 4-4' },
  { value: 'top', label: 'to top', path: 'M3 2h10M8 14V5m-4 4 4-4 4 4' },
  { value: 'bottom', label: 'to bottom', path: 'M3 14h10M8 2v9m-4-4 4 4 4-4' },
]

function setRow(key: string, element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLElement) rows.set(key, element)
  else rows.delete(key)
}

function isBoundary(move: MenuMove, index: number) {
  return move === 'up' || move === 'top' ? index === 0 : index === entries.value.length - 1
}

async function move(entry: MenuOrderEntry, direction: MenuMove) {
  const index = entries.value.findIndex(item => item.key === entry.key)
  if (props.disabled || index < 0 || isBoundary(direction, index)) return

  const count = entries.value.length
  const destination = direction === 'top' ? 0 : direction === 'bottom' ? count - 1 : index + (direction === 'up' ? -1 : 1)
  emit('update:modelValue', moveMenuEntry(props.modelValue, entry.key, direction))
  announcement.value = `${entry.label} moved to position ${destination + 1} of ${count}.`

  await nextTick()
  const row = rows.get(entry.key)
  const previousAction = row?.querySelector<HTMLButtonElement>(`button[data-menu-move="${direction}"]`)
  // A move to an edge disables the action just used. Keep keyboard focus in
  // that row by selecting an available action instead of losing focus.
  const nextAction = previousAction && !previousAction.disabled
    ? previousAction
    : row?.querySelector<HTMLButtonElement>('button[data-menu-move]:not(:disabled)')
  nextAction?.focus()
}
</script>

<template>
  <div :id="id" data-menu-order-control class="menu-order-control min-w-0 space-y-3">
    <Button
      type="button"
      variant="outline"
      size="sm"
      :disabled="disabled"
      :aria-expanded="expanded"
      :aria-controls="`${id}-order`"
      :aria-label="`${expanded ? 'Close' : 'Edit'} order for ${label}`"
      @click="expanded = !expanded"
    >
      <svg class="size-3.5 transition-transform" :class="expanded ? 'rotate-90' : ''" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 4 4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      {{ expanded ? 'Close order' : 'Edit order' }}
      <span class="text-xs font-normal text-muted-foreground">{{ entries.length }} items</span>
    </Button>

    <div v-show="expanded" :id="`${id}-order`" class="min-w-0 space-y-2">
      <p class="text-xs leading-relaxed text-muted-foreground">Use the arrows to move an item one place or to either end.</p>
      <ol class="max-h-[28rem] min-w-0 space-y-1 overflow-y-auto overscroll-contain pr-1" :aria-label="`${label} order`">
        <li
          v-for="(entry, index) in entries"
          :key="entry.key"
          :ref="element => setRow(entry.key, element)"
          :data-menu-entry="entry.key"
          class="menu-order-row rounded-lg bg-muted/25 px-2 py-2"
        >
          <span class="menu-order-position text-center text-xs tabular-nums text-muted-foreground" aria-hidden="true">{{ index + 1 }}</span>
          <span class="menu-order-label min-w-0 break-words text-xs leading-relaxed">{{ entry.label }}</span>
          <div class="menu-order-actions flex items-center gap-1">
            <Button
              v-for="action in moves"
              :key="action.value"
              type="button"
              variant="ghost"
              size="icon-sm"
              class="size-8 shrink-0"
              :data-menu-move="action.value"
              :disabled="disabled || isBoundary(action.value, index)"
              :aria-label="`Move ${entry.label} ${action.label}`"
              :title="`Move ${entry.label} ${action.label}`"
              @click="move(entry, action.value)"
            >
              <svg class="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path :d="action.path" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </Button>
          </div>
        </li>
      </ol>
    </div>

    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
  </div>
</template>

<style scoped>
.menu-order-control { container-type: inline-size; }
.menu-order-row {
  display: grid;
  grid-template-columns: 1.5rem minmax(0, 1fr);
  align-items: center;
  gap: 0.25rem 0.5rem;
}
.menu-order-position { grid-column: 1; grid-row: 1 / 3; }
.menu-order-label { grid-column: 2; grid-row: 1; }
.menu-order-actions { grid-column: 2; grid-row: 2; }
@container (min-width: 20rem) {
  .menu-order-row { grid-template-columns: 1.5rem minmax(0, 1fr) auto; }
  .menu-order-position, .menu-order-label, .menu-order-actions { grid-row: 1; }
  .menu-order-actions { grid-column: 3; }
}
</style>
