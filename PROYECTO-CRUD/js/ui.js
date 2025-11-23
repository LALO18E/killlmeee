// Maneja todo lo visual
export const UI = {
    init: () => {
        M.Modal.init(document.querySelectorAll('.modal'));
        M.FormSelect.init(document.querySelectorAll('select'));
    },
    showLoading: (show) => {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    },
   // En js/ui.js

toggleAdmin: (user) => {
    const display = user ? 'block' : 'none';
    
    // 1. Mostrar/Ocultar Panel de Admin
    document.getElementById('adminPanelContainer').style.display = display;
    document.getElementById('btnLoginLi').style.display = user ? 'none' : 'block';
    document.getElementById('btnLogoutLi').style.display = display;

    // 2. Mostrar/Ocultar botones de editar/borrar en las tarjetas
    document.querySelectorAll('.admin-actions').forEach(e => e.style.display = user ? 'flex' : 'none');

    // 3. NUEVO: Ocultar el Carrito si es Admin
    // Buscamos el botón flotante por su clase
    const cartFab = document.querySelector('.cart-fab');
    if (cartFab) {
        // Si es usuario (admin) -> 'none' (oculto)
        // Si NO es usuario (cliente) -> 'block' (visible)
        cartFab.style.display = user ? 'none' : 'block'; 
    }
    
    // Opcional: Ocultar también los botones de "Agregar al carrito" de las tarjetas para que el admin no se confunda
    document.querySelectorAll('.btn-floating.halfway-fab').forEach(btn => {
         btn.style.display = user ? 'none' : 'block';
    });
},
    renderProducts: (products, append, user) => {
        const container = document.getElementById('listaProductos');
        const html = products.map(p => `
            <div class="col s12 m6 l4" id="prod-${p.id}">
                <div class="card hoverable">
                    <div class="card-image">
                        <img src="${p.imagen || 'https://via.placeholder.com/300'}" onclick="window.verDetalle('${p.id}')">
                        <a class="btn-floating halfway-fab orange darken-2" onclick="window.agregarCarrito('${p.id}')"><i class="material-icons">add_shopping_cart</i></a>
                        <div class="admin-actions" style="display:${user ? 'flex' : 'none'}; position:absolute; top:10px; right:10px; gap:5px;">
                            <a class="btn-floating blue btn-small" onclick="window.editarProducto('${p.id}')"><i class="material-icons">edit</i></a>
                            <a class="btn-floating red btn-small" onclick="window.eliminarProducto('${p.id}')"><i class="material-icons">delete</i></a>
                        </div>
                    </div>
                    <div class="card-content">
                        <span class="card-title truncate">${p.nombre}</span>
                        <p class="truncate">${p.descripcion}</p>
                        <p class="green-text bold">$${p.precio}</p>
                    </div>
                </div>
            </div>
        `).join('');
        
        if(append) container.innerHTML += html;
        else container.innerHTML = html;
    },
    updateLoadMoreBtn: (hasMore) => {
        const btn = document.getElementById('btnCargarMasContainer');
        btn.innerHTML = hasMore 
            ? '<button class="btn blue-grey" onclick="window.cargarMas()">Cargar Más</button>'
            : '<p class="grey-text">No hay más productos</p>';
    }
};