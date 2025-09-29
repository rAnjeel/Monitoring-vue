<template>
  <div class="mobile-navbar">
    <div class="container-fluid">
      <div class="cards-container">
        <button class="nav-arrow left" @click="scrollLeft" :disabled="currentIndex === 0">
          <i class="glyphicon glyphicon-chevron-left"></i>
        </button>

        <div class="cards-wrapper" :style="{ transform: `translateX(-${currentIndex * cardWidth}px)` }" ref="cardsWrapper">
          <div
            v-for="(item, index) in itemsResolved"
            :key="getItemKey(item, index)"
            class="device-card"
            :class="{ active: selectedIndex === index }"
            @click="selectDevice(index)"
            ref="cardRefs"
          >
            <slot name="card" :item="item" :index="index" :selected="selectedIndex === index">
              <div class="device-label">{{ getItemLabel(item) }}</div>
              <div class="device-number">{{ getItemLength(item) }}/{{ getItemValue(item) }}</div>
            </slot>
          </div>
        </div>

        <button class="nav-arrow right" @click="scrollRight" :disabled="currentIndex >= maxIndex">
          <i class="glyphicon glyphicon-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, defineExpose, defineProps, defineEmits } from 'vue';
  import '../assets/CardContainer.css';

  const props = defineProps({
    // Backward-compat name kept for existing consumers
    deviceList: {
      type: Array,
      default: () => []
    },
    // Preferred generic prop
    items: {
      type: Array,
      default: () => []
    },
    // Field mapping for generic items
    keyField: { type: String, default: 'name' },
    labelField: { type: String, default: 'name' },
    valueField: { type: String, default: 'value' },
    lengthField: { type: String, default: 'length' },
    initialVisibleCards: {
      type: Number,
      default: 5,
      validator: (value) => value > 0
    },
    cardStyle: {
      type: Object,
      default: () => ({})
    }
  });

  const emit = defineEmits(['device-selected', 'navigation-changed', 'device-update']);

  const itemsResolved = ref((props.items && props.items.length ? props.items : props.deviceList));
  const selectedIndex = ref(0);
  const currentIndex = ref(0);
  const cardWidth = ref(0);
  const visibleCards = ref(props.initialVisibleCards);
  const cardRefs = ref([]);
  const cardsWrapper = ref(null);
  let resizeObserver = null;

  const maxIndex = computed(() => Math.max(0, itemsResolved.value.length - visibleCards.value));
  const currentDevice = computed(() => itemsResolved.value[selectedIndex.value]);

  // Mise à jour responsive
  function updateSizes() {
    if (cardRefs.value.length > 0 && cardRefs.value[0]) {
      const cardElement = cardRefs.value[0];
      const style = window.getComputedStyle(cardElement);
      const margin = parseFloat(style.marginRight) || 0;
      cardWidth.value = cardElement.offsetWidth + margin;
    }

    const width = window.innerWidth;
    if (width <= 480) {
      visibleCards.value = 2;
    } else if (width <= 768) {
      visibleCards.value = 3;
    } else {
      visibleCards.value = props.initialVisibleCards;
    }

    if (currentIndex.value > maxIndex.value) {
      currentIndex.value = maxIndex.value;
    }
  }

  // Navigation
  function scrollLeft() {
    if (currentIndex.value > 0) {
      currentIndex.value--;
    }
  }

  function scrollRight() {
    if (currentIndex.value < maxIndex.value) {
      currentIndex.value++;
    }
  }

  function selectDevice(index) {
    // Toggle selection: if already selected, deselect; otherwise select
    if (selectedIndex.value === index) {
      selectedIndex.value = -1; // Deselect
      emit('device-selected', null, -1);
    } else {
      selectedIndex.value = index;
      emit('device-selected', itemsResolved.value[index], index);
    }
  }

  // Méthode pour mettre à jour les données d'un device
  function updateDeviceData(deviceName, newData) {
    const index = itemsResolved.value.findIndex(d => getItemLabel(d) === deviceName);
    if (index !== -1) {
      itemsResolved.value[index] = { ...itemsResolved.value[index], ...newData };
      emit('device-update', itemsResolved.value[index], index);
    }
  }

  function handleResize() {
    updateSizes();
  }

  // Watchers
  watch(currentIndex, (newIndex) => {
    emit('navigation-changed', newIndex, maxIndex.value);
  });

  watch(() => props.items, (newItems) => {
    if (newItems && newItems.length) {
      itemsResolved.value = newItems;
    }
    if (selectedIndex.value >= itemsResolved.value.length) {
      selectedIndex.value = 0;
    }
    nextTick().then(() => {
      requestAnimationFrame(() => updateSizes());
    });
  }, { deep: true });

  watch(() => props.deviceList, (newDevices) => {
    if (!props.items || props.items.length === 0) {
      itemsResolved.value = newDevices;
    }
    if (selectedIndex.value >= itemsResolved.value.length) {
      selectedIndex.value = 0;
    }
    nextTick().then(() => {
      requestAnimationFrame(() => updateSizes());
    });
  }, { deep: true });

  // Helpers for field access
  function getItemKey(item, index) {
    return item?.[props.keyField] ?? `${index}`;
  }

  function getItemLabel(item) {
    return item?.[props.labelField] ?? '';
  }

  function getItemValue(item) {
    return item?.[props.valueField] ?? '';
  }

  function getItemLength(item) {
    return item?.[props.lengthField] ?? '';
  }

  // Cycle de vie
  onMounted(async () => {
    window.addEventListener('resize', handleResize);
    await nextTick();
    requestAnimationFrame(() => {
      updateSizes();
    });
    if (typeof ResizeObserver !== 'undefined' && cardsWrapper.value) {
      resizeObserver = new ResizeObserver(() => {
        updateSizes();
      });
      resizeObserver.observe(cardsWrapper.value);
    }
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    if (resizeObserver) {
      try {
        resizeObserver.disconnect();
      } catch (e) {
        console.warn('[CardNavbar] ResizeObserver disconnect failed', e);
      }
      resizeObserver = null;
    }
  });

  // Exposition des méthodes
  defineExpose({
    scrollLeft,
    scrollRight,
    selectDevice,
    updateSizes,
    updateDeviceData,
    getCurrentDevice: () => currentDevice.value,
    getSelectedIndex: () => selectedIndex.value,
    getItems: () => itemsResolved.value,
    setItems: (newItems) => {
      itemsResolved.value = newItems;
      updateSizes();
    }
  });
</script>

