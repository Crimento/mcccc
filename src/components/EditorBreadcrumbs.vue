<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import {
  Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

type BreadcrumbEntry = { label: string; href: string; category: string; path: string[]; title?: string }
const props = defineProps<{ items: BreadcrumbEntry[] }>()
const emit = defineEmits<{ navigate: [category: string, path: string[]] }>()
const container = ref<HTMLElement>()
const { width } = useElementSize(container)
const open = ref(false)
const current = computed(() => props.items.at(-1))
const ancestors = computed(() => props.items.slice(0, -1))

const trail = computed(() => {
  const links = ancestors.value
  if (links.length < 2) return { before: links, hidden: [], after: [] }

  // Reserve useful room for the leaf; flex truncation handles especially long
  // labels. Measure the container rather than relying on the viewport width.
  const available = width.value || 400
  const leafWidth = Math.min(240, Math.max(80, (current.value?.label.length ?? 0) * 7))
  const fullWidth = links.reduce((total, item) => total + item.label.length * 7 + 32, leafWidth)
  if (fullWidth <= available - 16) return { before: links, hidden: [], after: [] }

  const keepParent = available >= 640 && links.length > 2
  return {
    before: links.slice(0, 1),
    hidden: links.slice(1, keepParent ? -1 : undefined),
    after: keepParent ? links.slice(-1) : [],
  }
})

function followLink(event: MouseEvent, item: BreadcrumbEntry) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  open.value = false
  emit('navigate', item.category, [...item.path])
}

function preserveModifiedKeyboardLink(event: KeyboardEvent) {
  // Reka turns menu Enter presses into a synthetic click. Let the browser
  // handle modified Enter on anchors so opening another tab remains native.
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
    event.stopImmediatePropagation()
  }
}

watch(() => props.items.map(item => item.href).join('\n'), () => { open.value = false })
watch(width, value => { if (value <= 0) open.value = false })
</script>

<template>
  <div ref="container" data-editor-breadcrumbs class="min-w-0 w-full">
    <Breadcrumb v-if="current" class="w-full">
      <BreadcrumbList class="min-w-0 flex-nowrap gap-2 overflow-hidden py-1 text-xs sm:gap-2">
        <template v-for="(item, index) in trail.before" :key="`${index}:${item.href}`">
          <BreadcrumbItem :class="index === 0 ? 'shrink-0' : 'shrink'">
            <BreadcrumbLink :href="item.href" :title="item.label" class="block truncate" @click="followLink($event, item)">
              {{ item.label }}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </template>

        <template v-if="trail.hidden.length">
          <BreadcrumbItem class="shrink-0">
            <DropdownMenuRoot v-model:open="open" :modal="false">
              <DropdownMenuTrigger
                type="button"
                aria-label="Show parent menus"
                class="flex size-7 items-center justify-center rounded-md hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BreadcrumbEllipsis aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent
                  align="start"
                  :side-offset="6"
                  :collision-padding="12"
                  class="z-50 max-h-[var(--reka-dropdown-menu-content-available-height)] w-max min-w-48 max-w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground outline-none"
                >
                  <DropdownMenuItem
                    v-for="(item, index) in trail.hidden"
                    :key="`${index}:${item.href}`"
                    as-child
                    :text-value="item.label"
                    class="block cursor-pointer rounded-md px-3 py-2 text-xs leading-relaxed outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                  >
                    <a
                      :href="item.href"
                      class="break-words"
                      @click="followLink($event, item)"
                      @keydown.capture="preserveModifiedKeyboardLink"
                    >{{ item.label }}</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenuRoot>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </template>

        <template v-for="item in trail.after" :key="item.href">
          <BreadcrumbItem class="max-w-40 shrink">
            <BreadcrumbLink :href="item.href" :title="item.label" class="block truncate" @click="followLink($event, item)">
              {{ item.label }}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </template>

        <BreadcrumbItem class="min-w-0 flex-1">
          <BreadcrumbPage :title="current.title ?? current.label" class="block min-w-0 truncate font-medium">{{ current.label }}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </div>
</template>
