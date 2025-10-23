import axios from 'axios';
import { formatDate } from '@/services/utils/utils.js';

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
          device_id: params.device_id,
          group_by: params.group_by,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching average latency by day and site:', error);
      throw error;
    }
  }

  // Build chart-ready latency data (x: days, y: average latency, yMin: min latency, yMax: max latency)
  async getLatencyChartData(params = {}) {
    // Récupère directement les lignes agrégées par jour depuis SQL
    const apiData = await this.getAverageLatencyByDayAndSite(params);
    const rows = Array.isArray(apiData?.rows) ? apiData.rows : (Array.isArray(apiData) ? apiData : []);

    // Cas sans données
    if (!rows.length) {
      return { x: [], y: [], yMin: [], yMax: [], summary: null, rows: [] };
    }

    // Format des dates (axe X)
    const formatDay = (d) => {
      try {
        return formatDate(d, 'FR', 'dd/MM/yyyy');
      } catch (e) {
        return String(d);
      }
    };

    // Prépare les séries pour ECharts
    const x = rows.map(r => formatDay(r.jour));
    const y = rows.map(r => Number(r.avg_latency_ms || 0));
    const yMin = rows.map(r => Number(r.min_latency_ms || 0));
    const yMax = rows.map(r => Number(r.max_latency_ms || 0));

    // Résumé global
    const flat = y.filter(n => Number.isFinite(n));
    const summary = flat.length
      ? {
          average: Math.round((flat.reduce((s, v) => s + v, 0) / flat.length) * 100) / 100,
          maximum: Math.max(...flat),
          minimum: Math.min(...flat),
        }
      : null;

    // Retour final (prêt pour le graphique)
    return { x, y, yMin, yMax, summary, rows };
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

  // Get Availability (SLA) for a device
  async getAvailability(device_id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/reporting/availability/${device_id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Availability:', error);
      throw error;
    }
  }

  // Get MTBF (Mean Time Between Failures) for a device
  async getMTBF(device_id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/reporting/mtbf/${device_id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching MTBF:', error);
      throw error;
    }
  }
}

export default new ReportingService();
