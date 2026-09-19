<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <nav aria-label="Breadcrumb" data-slot="breadcrumb" :class="cn('min-w-0', props.class)">
    <slot />
  </nav>
</template>
