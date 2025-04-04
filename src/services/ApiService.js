import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getModelInfo() {
    try {
      const response = await this.api.get('/model-info');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async analyzeECG(ecgData) {
    try {
      const response = await this.api.post('/predict', ecgData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async createSpectrogram(signal) {
    try {
      const response = await this.api.post('/create-spectrogram', { signal });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new ApiService();