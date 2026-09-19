import { computed, inject, type ComputedRef, type InjectionKey } from 'vue'
import type { DefaultComparison } from '@/lib/default-comparison'

export const defaultComparisonKey: InjectionKey<ComputedRef<Map<string, DefaultComparison>>> = Symbol('default-comparisons')

const emptyComparisons = computed(() => new Map<string, DefaultComparison>())

export function useDefaultComparisons(): ComputedRef<Map<string, DefaultComparison>> {
  return inject(defaultComparisonKey, emptyComparisons)
}
