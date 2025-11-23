import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { Auth } from './auth.js';
import { Store } from './store.js';
import { UI } from './ui.js';
import { Cart } from './cart.js';

let currentUser = null;
let editId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    UI.init();
    Cart.renderBadge(); // Cargar estado del carrito
    
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        UI.toggleAdmin(user);
    });

    await cargarCatalogo(true);
});

async function cargarCatalogo(reset = false) {
    UI.showLoading(true);
    const productos = await Store.load(reset);
    UI.renderProducts(productos, !reset, currentUser);
    UI.updateLoadMoreBtn(Store.hasMore);
    UI.showLoading(false);
}

// ==========================================
// EXPORTAR FUNCIONES A WINDOW (Para el HTML)
// ==========================================

window.iniciarSesion = async () => {
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;
    try {
        await Auth.login(u, p);
        M.Modal.getInstance(document.getElementById('modalLogin')).close();
        M.toast({html: 'Bienvenido', classes: 'green'});
    } catch(e) { M.toast({html: 'Error login', classes: 'red'}); }
};

window.cerrarSesion = async () => {
    await Auth.logout();
    location.reload(); 
};

window.cargarMas = () => cargarCatalogo(false);

window.agregarCarrito = (id) => {
    const p = Store.products.find(x => x.id === id);
    if(p) { Cart.add(p); M.toast({html: 'Añadido al carrito', classes: 'green rounded'}); }
};

window.abrirCarrito = () => {
    Cart.renderModal();
    M.Modal.getInstance(document.getElementById('modalCarrito')).open();
};

window.updateCart = (id, n) => {
    Cart.update(id, n);
    Cart.renderModal();
};

window.finalizarCompra = () => {
    const items = Cart.items;
    if(!items.length) return;
    let msg = "Hola, quiero pedir:\n";
    items.forEach(i => msg += `- ${i.nombre} (${i.qty})\n`);
    window.open(`https://wa.me/5215518675722?text=${encodeURIComponent(msg)}`, '_blank');
};

// --- Funciones CRUD Admin ---

window.abrirModalAgregar = () => {
    document.getElementById('formProducto').reset();
    editId = null;
    document.getElementById('modalTitulo').innerText = "Nuevo";
    M.Modal.getInstance(document.getElementById('modalProducto')).open();
};

window.editarProducto = (id) => {
    const p = Store.products.find(x => x.id === id);
    if(!p) return;
    window.productoEditandoId = id;
    
    document.getElementById('nombre').value = p.nombre;
    document.getElementById('precio').value = p.precio;
    document.getElementById('stock').value = p.stock || 0;
    document.getElementById('descripcion').value = p.descripcion;
    document.getElementById('categoria').value = p.categoria;
    
    // RECUPERAR IMÁGENES: Array a Texto (unido por saltos de línea)
    let listaUrls = "";
    if (p.imagenes && Array.isArray(p.imagenes)) {
        listaUrls = p.imagenes.join('\n');
    } else if (p.imagen) {
        listaUrls = p.imagen;
    }
    document.getElementById('imgUrls').value = listaUrls;

    M.updateTextFields();
    M.textareaAutoResize(document.getElementById('imgUrls')); // Ajustar tamaño
    M.FormSelect.init(document.querySelectorAll('select'));
    
    document.getElementById('modalTitulo').innerText = "Editar Producto";
    M.Modal.getInstance(document.getElementById('modalProducto')).open();
};

window.guardarProducto = async () => {
    // Capturar las URLs línea por línea
    const imgText = document.getElementById('imgUrls').value.trim();
    const imagenesLista = imgText ? imgText.split('\n').map(url => url.trim()).filter(u => u.length > 0) : [];

    const data = {
        nombre: document.getElementById('nombre').value,
        precio: Number(document.getElementById('precio').value),
        categoria: document.getElementById('categoria').value,
        stock: Number(document.getElementById('stock').value),
        descripcion: document.getElementById('descripcion').value,
        imagenes: imagenesLista,            // Guardamos el array completo
        imagen: imagenesLista[0] || ''      // Guardamos la primera como principal
    };
    
    try {
        UI.showLoading(true);
        if(window.productoEditandoId) await Store.update(window.productoEditandoId, data);
        else await Store.add(data);
        
        M.Modal.getInstance(document.getElementById('modalProducto')).close();
        await cargarCatalogo(true); 
        M.toast({html: '✅ Guardado correctamente', classes: 'green'});
    } catch(e) { 
        console.error(e); 
        M.toast({html: '❌ Error al guardar', classes: 'red'}); 
    } finally { 
        UI.showLoading(false); 
    }
};

window.eliminarProducto = async (id) => {
    if(confirm('¿Eliminar?')) {
        await Store.delete(id);
        await cargarCatalogo(true);
    }
};

window.verDetalle = (id) => {
    const p = Store.products.find(item => item.id === id);
    if (!p) return;

    document.getElementById('detalleNombre').innerText = p.nombre;
    document.getElementById('detallePrecio').innerText = `$${Number(p.precio).toFixed(2)}`;
    document.getElementById('detalleCategoria').innerText = p.categoria;
    document.getElementById('detalleStock').innerText = `Stock: ${p.stock || 0}`;
    document.getElementById('detalleDescripcion').innerText = p.descripcion || "Sin descripción";

    // CONSTRUIR EL HTML DEL CARRUSEL
    const carruselContainer = document.getElementById('carruselProducto');
    let htmlImagenes = '';
    
    let imagenesParaMostrar = [];
    if (p.imagenes && p.imagenes.length > 0) imagenesParaMostrar = p.imagenes;
    else if (p.imagen) imagenesParaMostrar = [p.imagen];
    else imagenesParaMostrar = ['https://via.placeholder.com/400x300?text=Sin+Imagen'];

    imagenesParaMostrar.forEach(url => {
        htmlImagenes += `<a class="carousel-item" href="#!"><img src="${url}" style="object-fit: contain; width:100%; height:100%;"></a>`;
    });

    carruselContainer.innerHTML = htmlImagenes;

    // BOTÓN DE AGREGAR
    const btnAgregar = document.getElementById('btnAgregarDesdeDetalle');
    const nuevoBtn = btnAgregar.cloneNode(true); // Limpiar eventos viejos
    btnAgregar.parentNode.replaceChild(nuevoBtn, btnAgregar);
    
    nuevoBtn.onclick = () => {
        window.agregarCarrito(p.id);
        M.Modal.getInstance(document.getElementById('modalDetalle')).close();
    };

    // ABRIR MODAL E INICIAR CARRUSEL
    const modalInstancia = M.Modal.getInstance(document.getElementById('modalDetalle'));
    modalInstancia.open();
    
    // Pequeño retraso para asegurar que el modal es visible antes de iniciar el carrusel
    setTimeout(() => {
        const elems = document.querySelectorAll('.carousel');
        M.Carousel.init(elems, {
            fullWidth: true,
            indicators: true
        });
    }, 200);
};
// ==========================================
// FILTRO DE BÚSQUEDA (Para el Panel Admin)
// ==========================================
window.filtrarProductos = () => {
    const texto = document.getElementById('busqueda').value.toLowerCase();
    const tarjetas = document.querySelectorAll('#listaProductos .col'); // Selecciona las columnas de productos

    tarjetas.forEach(tarjeta => {
        // Busca el título dentro de la tarjeta
        const titulo = tarjeta.querySelector('.card-title').innerText.toLowerCase();
        
        // Muestra u oculta según coincidencia
        if (titulo.includes(texto)) {
            tarjeta.style.display = 'block';
        } else {
            tarjeta.style.display = 'none';
        }
    });
};
// ==========================================
// FUNCIÓN PARA VER/OCULTAR CONTRASEÑA
// ==========================================
window.togglePassword = () => {
    const input = document.getElementById('loginPass');
    const icon = document.getElementById('togglePasswordBtn');
    
    if (input.type === "password") {
        input.type = "text";
        icon.innerText = "visibility"; // Cambia icono a ojo abierto
    } else {
        input.type = "password";
        icon.innerText = "visibility_off"; // Cambia icono a ojo tachado
    }
};