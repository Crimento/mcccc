<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Ellipsis } from '@lucide/vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <span data-slot="breadcrumb-ellipsis" :class="cn('flex size-7 items-center justify-center', props.class)">
    <Ellipsis class="size-4" aria-hidden="true" />
    <span class="sr-only">More</span>
  </span>
</template>
