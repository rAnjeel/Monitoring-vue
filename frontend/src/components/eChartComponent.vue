<template>
  <div class="echart-section">
    <div class="echart-block">
      <v-chart :option="option" autoresize :style="{ height: props.height }" />
    </div>
  </div>
  
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

const props = defineProps({
  x: { type: Array, default: () => [] },
  // y peut maintenant être : soit un tableau de valeurs, soit un tableau d’objets de séries
  y: {
    type: [Array, Object],
    default: () => [],
  },
  title: { type: String, default: '' },
  yLabel: { type: String, default: '' },
  xLabel: { type: String, default: '' },
  height: { type: String, default: '260px' },
  smooth: { type: Boolean, default: true },
})

const option = computed(() => {
  const palette = [
    '#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'
  ]
  const isMultiSeries = Array.isArray(props.y) && props.y.length && typeof props.y[0] === 'object' && props.y[0].data
  const series = isMultiSeries
    ? props.y.map(s => ({
        name: s.name,
        type: 'line',
        data: s.data,
        smooth: props.smooth,
        showSymbol: false,
        lineStyle: { width: 2.2 },
        areaStyle: { opacity: 0.06 },
        emphasis: { lineStyle: { width: 3 } },
      }))
    : [
        {
          type: 'line',
          data: props.y,
          smooth: props.smooth,
          showSymbol: false,
          lineStyle: { width: 2.2 },
          areaStyle: { opacity: 0.06 },
          emphasis: { lineStyle: { width: 3 } },
        },
      ]

  return {
    backgroundColor: 'transparent',
    color: palette,
    title: props.title ? { text: props.title, left: 'center', top: 6, textStyle: { fontSize: 13, fontWeight: 600, color: '#0f172a' } } : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderColor: 'rgba(148,163,184,0.25)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0' },
      axisPointer: { type: 'line', lineStyle: { color: '#94a3b8', width: 1, type: 'dashed' } },
      padding: 10,
    },
    legend: isMultiSeries ? { top: 25, icon: 'roundRect', itemWidth: 12, itemHeight: 8, textStyle: { color: '#475569' } } : undefined,
    grid: { left: 48, right: 18, top: props.title ? 44 : 18, bottom: 36, containLabel: true },
    xAxis: {
      type: 'category',
      data: props.x,
      name: props.xLabel || undefined,
      nameLocation: 'end',
      axisTick: { alignWithLabel: true },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      name: props.yLabel || undefined,
      axisLine: { show: false },
      axisLabel: { color: '#64748b' },
      splitLine: { show: true, lineStyle: { type: 'dashed', color: '#e2e8f0' } },
    },
    series,
  }
})
</script>

<style scoped>
.echart-section {
  width: 100%;
}

.echart-block {
  width: 100%;
  padding: 8px 0;
  margin: 12px 0 16px;
}
</style>


