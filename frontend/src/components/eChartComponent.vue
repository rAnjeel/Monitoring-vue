<template>
  <v-chart :option="option" autoresize :style="{ height: props.height }" />
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
  const isMultiSeries = Array.isArray(props.y) && props.y.length && typeof props.y[0] === 'object' && props.y[0].data
  const series = isMultiSeries
    ? props.y.map(s => ({
        name: s.name,
        type: 'line',
        data: s.data,
        smooth: props.smooth,
        showSymbol: false,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.08 },
      }))
    : [
        {
          type: 'line',
          data: props.y,
          smooth: props.smooth,
          showSymbol: false,
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.08 },
        },
      ]

  return {
    title: props.title ? { text: props.title, left: 'center', top: 6, textStyle: { fontSize: 13 } } : undefined,
    tooltip: { trigger: 'axis' },
    legend: isMultiSeries ? { top: 25 } : undefined,
    grid: { left: 40, right: 16, top: props.title ? 40 : 16, bottom: 30 },
    xAxis: {
      type: 'category',
      data: props.x,
      name: props.xLabel || undefined,
      nameLocation: 'end',
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: 'value',
      name: props.yLabel || undefined,
      splitLine: { show: true, lineStyle: { type: 'dashed' } },
    },
    series,
  }
})
</script>

<style scoped>
.echart-wrapper {
  width: 100%;
  min-height: 160px;
}
.echart-canvas {
  width: 100%;
  height: 100%;
}
</style>


