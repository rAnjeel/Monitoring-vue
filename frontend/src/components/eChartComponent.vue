<template>
  <div class="echart-section">
    <div class="echart-block">
      <template v-if="hasData">
        <v-chart 
          ref="chartRef"
          :option="option" 
          :autoresize="false"
          :style="{ height: props.height }"
          @resize="handleResize"
        />
      </template>
      <template v-else>
        <div class="no-data">
          <div class="no-data-icon"><i class="glyphicon glyphicon-signal"></i></div>
          <div class="no-data-text">No data available</div>
        </div>
      </template>    
    </div>
  </div>
  
</template>

<script setup>
import { computed, defineProps, onMounted, onUnmounted, ref, nextTick } from 'vue'
import { use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, BarChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

// Global error handler for ResizeObserver
let resizeObserverErrorHandler = null

onMounted(() => {
  // Suppress ResizeObserver errors globally
  resizeObserverErrorHandler = (event) => {
    if (event.message && event.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      event.preventDefault()
      event.stopPropagation()
      return false
    }
  }
  
  window.addEventListener('error', resizeObserverErrorHandler)
  
  // Also suppress unhandled promise rejections
  const unhandledRejectionHandler = (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      event.preventDefault()
      return false
    }
  }
  
  window.addEventListener('unhandledrejection', unhandledRejectionHandler)
  
  // Manual resize observer setup
  nextTick(() => {
    if (chartRef.value && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        // Debounce resize calls
        clearTimeout(resizeObserver.timeoutId)
        resizeObserver.timeoutId = setTimeout(() => {
          if (chartRef.value && chartRef.value.resize) {
            chartRef.value.resize()
          }
        }, 100)
      })
      
      resizeObserver.observe(chartRef.value.$el)
    }
  })
})

onUnmounted(() => {
  if (resizeObserverErrorHandler) {
    window.removeEventListener('error', resizeObserverErrorHandler)
  }
  
  if (resizeObserver) {
    resizeObserver.disconnect()
    if (resizeObserver.timeoutId) {
      clearTimeout(resizeObserver.timeoutId)
    }
  }
})

const chartRef = ref(null)
let resizeObserver = null

const handleResize = () => {
  // Manual resize handling to avoid ResizeObserver issues
  nextTick(() => {
    if (chartRef.value && chartRef.value.resize) {
      chartRef.value.resize()
    }
  })
}

const props = defineProps({
  x: { type: Array, default: () => [] },
  // y peut maintenant être : soit un tableau de valeurs, soit un tableau d'objets de séries
  y: {
    type: [Array, Object],
    default: () => [],
  },
  yMin: { type: Array, default: () => [] },
  yMax: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  yLabel: { type: String, default: '' },
  xLabel: { type: String, default: '' },
  height: { type: String, default: '260px' },
  smooth: { type: Boolean, default: true },
  chartStyle: {
    type: String,
    default: 'line',
    validator: v => ['line', 'line-dot', 'bar'].includes(v),
  },
  xLabelRotate: { type: Number, default: 0 },
  barWidth: { type: Number, default: 0.6 },
  xLabelInterval: { type: [String, Number], default: 'auto' },
  yInterval: { type: [String, Number], default: 'auto' },
})

const hasData = computed(() => {
  if (!props.x?.length) return false
  if (Array.isArray(props.y)) {
    if (!props.y.length) return false
    // si y est une liste simple de valeurs numériques
    if (typeof props.y[0] !== 'object') {
      return props.y.some(v => v != null && !isNaN(v))
    }
    return props.y.some(s => Array.isArray(s.data) && s.data.some(v => v != null && !isNaN(v)))
  }
  return false
})

const option = computed(() => {
  const palette = [
    '#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'
  ]
  const isMultiSeries = Array.isArray(props.y) && props.y.length && typeof props.y[0] === 'object' && props.y[0].data
  const hasMinMaxZones = props.yMin?.length > 0 && props.yMax?.length > 0
  const isBar = props.chartStyle === 'bar'
  const isLineWithDots = props.chartStyle === 'line-dot'
  
  
  let series = []
  
  if (isMultiSeries) {
    series = props.y.map(s => ({
      name: s.name,
      type: isBar ? 'bar' : 'line',
      data: s.data,
      smooth: !isBar && props.smooth,
      showSymbol: isBar ? false : (isLineWithDots ? true : false),
      symbolSize: isLineWithDots ? 4 : 0,
      lineStyle: isBar ? undefined : { width: 2.2 },
      areaStyle: isBar ? undefined : { opacity: 0.06 },
      emphasis: { lineStyle: isBar ? undefined : { width: 3 } },
      clip: false,
      barWidth: isBar ? `${props.barWidth * 100}%` : undefined,
    }))
  } else {
    // Add min/max zone if available
    if (hasMinMaxZones) {
      series = [
        {
          name: 'Min',
          type: 'line',
          data: props.yMin,
          smooth: props.smooth,
          showSymbol: false,
          lineStyle: { width: 1, color: '#94a3b8', type: 'dashed' },
          areaStyle: null,
          clip: false,
        },
        {
          name: 'Max',
          type: 'line',
          data: props.yMax,
          smooth: props.smooth,
          showSymbol: false,
          lineStyle: { width: 1, color: '#94a3b8', type: 'dashed' },
          areaStyle: null,
          clip: false,
        },
        {
          name: 'Average',
          type: isBar ? 'bar' : 'line',
          data: props.y,
          smooth: !isBar && props.smooth,
          showSymbol: isBar ? false : (isLineWithDots ? true : false),
          symbolSize: isLineWithDots ? 4 : 0,
          lineStyle: isBar ? undefined : { width: 2.2, color: '#2563eb' },
          areaStyle: isBar ? undefined : { opacity: 0.1 },
          emphasis: { lineStyle: isBar ? undefined : { width: 3 } },
          clip: false,
          barWidth: isBar ? `${props.barWidth * 100}%` : undefined,
        }
      ]
    } else {
      series = [
        {
          type: isBar ? 'bar' : 'line',
          data: props.y,
          smooth: !isBar && props.smooth,
          showSymbol: isBar ? false : (isLineWithDots ? true : false),
          symbolSize: isLineWithDots ? 4 : 0,
          lineStyle: isBar ? undefined : { width: 2.2 },
          areaStyle: isBar ? undefined : { opacity: 0.06 },
          emphasis: { lineStyle: isBar ? undefined : { width: 3 } },
          clip: false,
          barWidth: isBar ? `${props.barWidth * 100}%` : undefined,
        },
      ]
    }
  }

  return {
    backgroundColor: 'transparent',
    color: palette,
    animation: false, // Disable animations to reduce resize issues
    title: props.title ? { text: props.title, left: 'center', top: 6, textStyle: { fontSize: 13, fontWeight: 600, color: '#0f172a' } } : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderColor: 'rgba(148,163,184,0.25)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0' },
      axisPointer: { type: 'line', snap: true, lineStyle: { color: '#94a3b8', width: 1, type: 'dashed' } },
      padding: 10,
    },
    legend: (isMultiSeries || hasMinMaxZones) ? { top: 25, icon: 'roundRect', itemWidth: 12, itemHeight: 8, textStyle: { color: '#475569' } } : undefined,
    grid: { left: 56, right: 24, top: props.title ? 48 : 20, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: props.x,
      name: props.xLabel || undefined,
      nameLocation: 'end',
      boundaryGap: isBar ? true : false,
      axisTick: { alignWithLabel: true },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', hideOverlap: true, rotate: props.xLabelRotate, showMinLabel: true, showMaxLabel: true, interval: props.xLabelInterval },
    },
    yAxis: {
      type: 'value',
      name: props.yLabel || undefined,
      axisLine: { show: false },
      interval: props.yInterval,
      axisLabel: { color: '#64748b', hideOverlap: true, showMinLabel: true, showMaxLabel: true },
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

.v-chart {
  width: 100%;
  height: 100%;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  height: 100px;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 8px;
}

.no-data-icon {
  font-size: 26px;
  margin-bottom: 6px;
}

.no-data-text {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}
</style>


