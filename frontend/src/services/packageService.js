import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:4000';

export function getImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_ORIGIN}${imagePath}`;
}

export const packageService = {
  // Get all packages (alias)
  async getAll(params = {}) {
    return this.getAllPackages(params);
  },

  // Get all packages with filters
  async getAllPackages(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/packages`, { params: { limit: 50, ...params } });
      return response.data.data?.items || response.data.data;
    } catch (error) {
      console.error('Error fetching packages:', error);
      throw error;
    }
  },

  // Get full package details (alias used by PackageDetail page)
  async getById(id) {
    return this.getPackageDetails(id);
  },

  // Get package basic info
  async getPackageById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/packages/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching package:', error);
      throw error;
    }
  },

  // Get full package details (with itineraries, pricing, departures, etc.)
  async getPackageDetails(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/packages/${id}/details`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching package details:', error);
      throw error;
    }
  },

  // Get real destination counts from DB
  async getDestinationCounts() {
    try {
      const response = await axios.get(`${API_BASE_URL}/packages/destination-counts`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching destination counts:', error);
      return [];
    }
  },

  // Search packages by destination
  async searchPackages(destination, minPrice, maxPrice, duration) {
    try {
      const params = {};
      if (destination) params.destination = destination;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (duration) params.duration = duration;

      const response = await axios.get(`${API_BASE_URL}/packages`, { params });
      return response.data.data?.items || response.data.data;
    } catch (error) {
      console.error('Error searching packages:', error);
      throw error;
    }
  },

  // Get featured packages (ranked 1-7)
  async getFeaturedPackages() {
    try {
      const response = await axios.get(`${API_BASE_URL}/packages/featured`);
      return response.data.data?.items || response.data.data;
    } catch (error) {
      console.error('Error fetching featured packages:', error);
      return [];
    }
  },
};
