<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { useDefaultComparisons } from '@/composables/defaultComparisonContext'
import { defaultBaselineInfo } from '@/data/default-settings-info'

const props = defineProps<{ settingKey: string }>()
const comparisons = useDefaultComparisons()
const comparison = computed(() => comparisons.value.get(props.settingKey))
const explanation = computed(() => {
  const result = comparison.value
  if (result?.status !== 'different') return result?.reason ?? 'A documented default is not known for this setting.'
  const fromSnapshot = result.source === 'snapshot'
  const source = fromSnapshot ? `MCCC ${defaultBaselineInfo.mcccVersion} default` : 'Documented default'
  if (result.label) return `${source}: ${result.label}`
  return fromSnapshot
    ? `This value differs from the MCCC ${defaultBaselineInfo.mcccVersion} default.`
    : 'This value differs from the documented default.'
})
const accessibleLabel = computed(() => `${comparison.value?.status === 'different' ? 'Non-default' : 'Default unknown'}. ${explanation.value}`)
</script>

<template>
  <Badge
    v-if="comparison && comparison.status !== 'default'"
    variant="secondary"
    class="border-0 bg-muted px-2 py-0.5 text-[10px] font-medium"
    :class="comparison.status === 'different' ? 'text-control' : 'text-muted-foreground'"
    :data-default-status="comparison.status"
    :data-default-key="settingKey"
    :title="explanation"
    role="note"
    :aria-label="accessibleLabel"
  >{{ comparison.status === 'different' ? 'Non-default' : 'Default unknown' }}</Badge>
</template>
