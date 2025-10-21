import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';

class ReportingService {
  // Get events between dates with filters
  async getEventsBetween(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/reporting/events-between`, {
        params: {
          start_date: params.start_date,
          end_date: params.end_date,
          status: params.status,
          device_id: params.device_id,
          type_device: params.type_device
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching events between dates:', error);
      throw error;
    }
  }

  // Get top 10 unstable devices
  async getTop10UnstableDevices(type_device = null) {
    try {
      const response = await axios.get(`${API_BASE_URL}/reporting/unstable-top10`, {
        params: { type_device }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top 10 unstable devices:', error);
      throw error;
    }
  }

  // Get average latency by day and site
  async getAverageLatencyByDayAndSite(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/reporting/latency-by-day-site`, {
        params: {
          start_date: params.start_date,
          end_date: params.end_date,
          type_device: params.type_device,
          device_id: params.device_id
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching average latency by day and site:', error);
      throw error;
    }
  }

  // Get device stability status
  async getDeviceStabilityStatus(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/reporting/device-stability-status`, {
        params: {
          start_date: params.start_date,
          end_date: params.end_date,
          type_device: params.type_device
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching device stability status:', error);
      throw error;
    }
  }

  // Get device types
  async getDeviceTypes() {
    try {
      const response = await axios.get(`${API_BASE_URL}/type-devices/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching device types:', error);
      throw error;
    }
  }
}

export default new ReportingService();
