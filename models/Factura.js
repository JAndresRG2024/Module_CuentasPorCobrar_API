const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const getFacturasNoPagadasPorCliente = async (id_cliente) => {
  // Cambia la URL para obtener todas las facturas
  const response = await fetch(`https://apdis-p5v5.vercel.app/api/facturas`);
  if (!response.ok) throw new Error('Error al obtener facturas externas');
  const facturas = await response.json();
  const facturasArray = Array.isArray(facturas) ? facturas : [facturas];
  const idClienteNum = Number(id_cliente);
  // Filtra por id_cliente y estado_factura
  return facturasArray.filter(f => f.id_cliente === idClienteNum && f.estado_factura !== 'Pagado');
};

module.exports = {
  getFacturasNoPagadasPorCliente,
};