<template>
  <div class="mobile-navbar">
    <div class="container-fluid">
      <div class="cards-container">
        <button class="nav-arrow left" @click="scrollLeft" :disabled="currentIndex === 0">
          <i class="glyphicon glyphicon-chevron-left"></i>
        </button>

        <div class="cards-wrapper" :style="{ transform: `translateX(-${currentIndex * cardWidth}px)` }" ref="cardsWrapper">
          <div
            v-for="(device, index) in devices"
            :key="device.name"
            class="device-card"
            :class="{ active: selectedIndex === index }"
            @click="selectDevice(index)"
            ref="cardRefs"
          >
            <div class="device-label">{{ device.name }}</div>
            <div class="device-number">{{ device.value }}/{{ device.length }}</div>
            <div class="device-status" :class="'status-' + device.status.toLowerCase()">
              {{ device.status }}
            </div>
            
            <!-- Ajout de données dynamiques -->
            <div v-if="device.usage" class="device-usage">
              Usage: {{ device.usage }}%
            </div>
            <div v-if="device.location" class="device-location">
              📍 {{ device.location }}
            </div>
            <div v-if="device.lastUpdate" class="device-update">
              🔄 {{ formatDate(device.lastUpdate) }}
            </div>
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
import { ref, computed, onMounted, onBeforeUnmount, watch, defineExpose, defineProps, defineEmits } from 'vue';
import '../../assets/CardContainer.css';

const props = defineProps({
  deviceList: {
    type: Array,
    default: () => [
      { 
        name: "ROUTER", 
        value: 3, 
        length: 10, 
        status: "Active",
        usage: 75,
        location: "Salle serveur",
        lastUpdate: new Date()
      },
      { 
        name: "SWITCH", 
        value: 3, 
        length: 40, 
        status: "Online",
        usage: 60,
        location: "Bureau IT",
        lastUpdate: new Date(Date.now() - 3600000)
      },
    ]
  },
  initialVisibleCards: {
    type: Number,
    default: 5,
    validator: (value) => value > 0
  },
  // Nouvelles props pour plus de flexibilité
  showAdditionalInfo: {
    type: Boolean,
    default: true
  },
  cardStyle: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['device-selected', 'navigation-changed', 'device-update']);

const devices = ref(props.deviceList);
const selectedIndex = ref(0);
const currentIndex = ref(0);
const cardWidth = ref(0);
const visibleCards = ref(props.initialVisibleCards);
const cardRefs = ref([]);
const cardsWrapper = ref(null);

const maxIndex = computed(() => Math.max(0, devices.value.length - visibleCards.value));
const currentDevice = computed(() => devices.value[selectedIndex.value]);

// Formatage des dates
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleTimeString();
}

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
  selectedIndex.value = index;
  emit('device-selected', devices.value[index], index);
}

// Méthode pour mettre à jour les données d'un device
function updateDeviceData(deviceName, newData) {
  const index = devices.value.findIndex(d => d.name === deviceName);
  if (index !== -1) {
    devices.value[index] = { ...devices.value[index], ...newData };
    emit('device-update', devices.value[index], index);
  }
}

function handleResize() {
  updateSizes();
}

// Watchers
watch(currentIndex, (newIndex) => {
  emit('navigation-changed', newIndex, maxIndex.value);
});

watch(() => props.deviceList, (newDevices) => {
  devices.value = newDevices;
  if (selectedIndex.value >= newDevices.length) {
    selectedIndex.value = 0;
  }
}, { deep: true });

// Cycle de vie
onMounted(() => {
  updateSizes();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
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
  getDevices: () => devices.value,
  setDevices: (newDevices) => {
    devices.value = newDevices;
    updateSizes();
  }
});
</script>

