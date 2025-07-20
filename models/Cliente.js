const axios = require('axios');

const BASE_URL = 'https://apdis-p5v5.vercel.app/api/clientes';

const Cliente = {
  // Obtener todos los clientes
  async getAll() {
    try {
      const response = await axios.get(BASE_URL);
      console.log('📦 Clientes recibidos:', response.data);
      return response.data; // Suponiendo que la API devuelve un array de clientes
    } catch (error) {
      console.error('Error al obtener todos los clientes:', error.message);
      throw error;
    }
  },

  // Obtener un solo cliente por ID
  async getById(id) {
    try {
      const response = await axios.get(`${BASE_URL}/${id}`);
      console.log('📦 Cliente individual:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el cliente con ID ${id}:`, error.message);
      throw error;
    }
  }
};

module.exports = Cliente;
