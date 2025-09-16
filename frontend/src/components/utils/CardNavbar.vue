<template>
  <div class="mobile-navbar">
    <div class="container-fluid">

      <!-- Secondary div containing all cards -->
      <div class="cards-container">
        <!-- Left arrow button -->
        <button class="nav-arrow left" @click="scrollLeft" :disabled="currentIndex === 0">
          <i class="glyphicon glyphicon-chevron-left"></i>
        </button>

        <!-- Cards wrapper -->
        <div class="cards-wrapper" :style="{ transform: `translateX(-${currentIndex * cardWidth}px)` }" ref="cardsWrapper">
          <div
            v-for="(device, index) in devices"
            :key="index"
            class="device-card"
            :class="{ active: selectedIndex === index }"
            @click="selectDevice(index)"
            ref="card"
          >
            <div class="device-label">{{ device.name}} </div>
            <div class="device-number">{{ index + 1 }}/{{ devices.length }}</div>
          </div>
        </div>

        <!-- Right arrow button -->
        <button class="nav-arrow right" @click="scrollRight" :disabled="currentIndex >= maxIndex">
          <i class="glyphicon glyphicon-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Demo content below navbar
    <div class="container" style="margin-top: 30px;">
      <div class="row">
        <div class="col-md-12">
          <div class="panel panel-default">
            <div class="panel-body">
              <h4>Selected Device Information</h4>
              <p>Click on any device card above to view its details. Use the arrow buttons to navigate through all devices.</p>
              <div class="alert alert-info">
                <strong>Current Selection:</strong>
                <span>{{ currentDeviceText }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>

<style>
    body {
        background-color: #f5f5f5;
        font-family: 'Arial', sans-serif;
    }

    /* Main navbar container */
    .mobile-navbar {
        background-color: #2c3e50;
        padding: 45px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        position: relative;
    }

    /* Secondary div containing cards */
    .cards-container {
        position: relative;
        overflow: hidden;
        padding: 0 50px; /* Space for arrow buttons */
    }

    .cards-wrapper {
        display: flex;
        transition: transform 0.3s ease;
        gap: 15px;
    }

    /* Individual card styling */
    .device-card {
        flex: 0 0 calc(15% - 12px); /* 5 cards visible (20% each) minus gap */
        min-width: 120px;
        background: linear-gradient(135deg, #3498db, #2980b9);
        border-radius: 4px;
        padding: 15px 10px;
        text-align: center;
        color: white;
        box-shadow: 0 3px 6px rgba(0,0,0,0.2);
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .device-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 5px 12px rgba(0,0,0,0.3);
    }

    .device-card.active {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
    }

    .device-number {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 5px;
    }

    .device-label {
        font-size: 14px;
        opacity: 0.9;
    }

    /* Arrow buttons */
    .nav-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background-color: rgba(255,255,255,0.9);
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        z-index: 10;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }

    .nav-arrow:hover {
        background-color: white;
        transform: translateY(-50%) scale(1.1);
    }

    .nav-arrow:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .nav-arrow.left {
        left: 10px;
    }

    .nav-arrow.right {
        right: 10px;
    }

    .nav-arrow i {
        color: #2c3e50;
        font-size: 16px;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .device-card {
            flex: 0 0 calc(33.333% - 10px); /* 3 cards on mobile */
            min-width: 100px;
        }
        
        .cards-container {
            padding: 0 45px;
        }
        
        .nav-arrow {
            width: 35px;
            height: 35px;
        }
    }

    @media (max-width: 480px) {
        .device-card {
            flex: 0 0 calc(50% - 7.5px); /* 2 cards on small mobile */
            min-width: 80px;
            padding: 12px 8px;
        }
        
        .device-number {
            font-size: 16px;
        }
        
        .device-label {
            font-size: 11px;
        }
    }

    /* Header styling */
    .navbar-header {
        text-align: center;
        color: white;
        margin-bottom: 20px;
    }

    .navbar-title {
        font-size: 20px;
        font-weight: bold;
        margin: 0;
    }
</style>

<script>
export default {
  name: "DeviceNavigator",
  data() {
    return {
      devices: [
        { name: "ROUTER", status: "Active" },
        { name: "SWITCH", status: "Online" },
        { name: "IPDSLAM", status: "Online" },
        { name: "TCU", status: "Offline" },
        { name: "R6K", status: "Online" },
        { name: "2G", status: "Online" },
        { name: "3G", status: "Maintenance" },
        { name: "4G", status: "Online" },
        { name: "5G", status: "Online" },
        { name: "AIRPON",status: "Offline" },
      ],
      selectedIndex: 0,
      currentIndex: 0,
      cardWidth: 0,
      visibleCards: 5,
    };
  },
  computed: {
    maxIndex() {
      return Math.max(0, this.devices.length - this.visibleCards);
    },
    currentDeviceText() {
      return `Device ${this.selectedIndex + 1}/${this.devices.length}`;
    },
  },
  mounted() {
    this.updateSizes();
    window.addEventListener("resize", this.updateSizes);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.updateSizes);
  },
  methods: {
    updateSizes() {
      // calcule largeur d'une carte
      if (this.$refs.card && this.$refs.card[0]) {
        this.cardWidth = this.$refs.card[0].offsetWidth + 15; // largeur + gap
      }

      // combien de cartes visibles
      if (window.innerWidth <= 480) {
        this.visibleCards = 2;
      } else if (window.innerWidth <= 768) {
        this.visibleCards = 3;
      } else {
        this.visibleCards = 5;
      }

      // ajuste si index trop grand
      if (this.currentIndex > this.maxIndex) {
        this.currentIndex = this.maxIndex;
      }
    },
    scrollLeft() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      }
    },
    scrollRight() {
      if (this.currentIndex < this.maxIndex) {
        this.currentIndex++;
      }
    },
    selectDevice(index) {
      this.selectedIndex = index;
    },
  },
};
</script>

