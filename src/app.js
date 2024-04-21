// index.js
import express from 'express';
import userRoutes from './v1/routes/users.routes.js';
import routesCategorias from './v1/routes/categorias.routes.js';
import routesLocation from './v1/routes/localizacion.routes.js';
import routesTokens from './v1/routes/tokens.routes.js';
import routesRoles from './v1/routes/roles.routes.js';
import routesProductos from './v1/routes/productos.routes.js';
import routesInventario from './v1/routes/inventario.routes.js';
import routesProveedor from './v1/routes/proveedor.routes.js';
import routesEncabezados from './v1/routes/encabezados.routes.js';
import routesDetalles from './v1/routes/detalles.routes.js';
import routesFacturas from './v1/routes/facturas.routes.js';
import routesProvProd from './v1/routes/proveedores_productos.routes.js';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());


// Rutas
app.use(userRoutes);
app.use(routesCategorias);
app.use(routesLocation);
app.use(routesTokens);
app.use(routesRoles);
app.use(routesProductos);
app.use(routesInventario);
app.use(routesProveedor);
app.use(routesEncabezados);
app.use(routesDetalles)
app.use(routesFacturas)
app.use(routesProvProd);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
   
});
