import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { Auth } from "./auth.js";
import { Store } from "./store.js";
import { UI } from "./ui.js";
import { Cart } from "./cart.js";

let currentUser = null;
let editId = null;

async function cargarCatalogo(reset = false) {
    try {
        UI.showLoading(true);
        const productos = await Store.load(reset);
        // Renderizamos productos pasando el usuario actual para que sepa si mostrar botones de edición
        UI.renderProducts(productos, !reset, currentUser);
        UI.updateLoadMoreBtn(Store.hasMore);
    } catch (e) {
        console.error("Error cargando catálogo", e);
    } finally {
        UI.showLoading(false);
    }
}

// ==========================================
// 2. FUNCIONES GLOBALES (Window)
// ==========================================

// --- Autenticación ---
window.iniciarSesion = async () => {
    const u = document.getElementById("loginUser").value;
    const p = document.getElementById("loginPass").value;
    try {
        await Auth.login(u, p);
        M.Modal.getInstance(document.getElementById("modalLogin")).close();
        M.toast({ html: "Bienvenido Admin", classes: "green" });
    } catch (e) {
        console.error(e);
        M.toast({ html: "Error de credenciales", classes: "red" });
    }
};

window.cerrarSesion = async () => {
    await Auth.logout();
    location.reload();
};

window.togglePassword = () => {
    const input = document.getElementById("loginPass");
    const icon = document.getElementById("togglePasswordBtn");
    if (input.type === "password") {
        input.type = "text";
        icon.innerText = "visibility";
    } else {
        input.type = "password";
        icon.innerText = "visibility_off";
    }
};

// --- Carrito ---
window.agregarCarrito = (id) => {
    const p = Store.products.find((x) => x.id === id);
    if (p) {
        Cart.add(p);
        M.toast({ html: "Añadido al carrito", classes: "green rounded" });
    }
};

window.abrirCarrito = () => {
    Cart.renderModal();
    M.Modal.getInstance(document.getElementById("modalCarrito")).open();
};

window.updateCart = (id, n) => {
    Cart.update(id, n);
    Cart.renderModal();
};

window.finalizarCompra = () => {
    const items = Cart.items;
    if (!items.length) return M.toast({ html: "Carrito vacío" });
    let msg = "Hola, quiero pedir:\n";
    items.forEach((i) => (msg += `- ${i.nombre} (${i.qty})\n`));
    window.open(`https://wa.me/5215518675722?text=${encodeURIComponent(msg)}`, "_blank");
};

// --- Gestión de Productos (CRUD) ---
window.cargarMas = () => cargarCatalogo(false);

window.abrirModalAgregar = () => {
    document.getElementById("formProducto").reset();
    window.productoEditandoId = null; // Resetear ID global
    document.getElementById("modalTitulo").innerText = "Nuevo Producto";
    M.Modal.getInstance(document.getElementById("modalProducto")).open();
};

window.editarProducto = (id) => {
    const p = Store.products.find((x) => x.id === id);
    if (!p) return;
    window.productoEditandoId = id; // Guardar ID globalmente

    document.getElementById("nombre").value = p.nombre;
    document.getElementById("precio").value = p.precio;
    document.getElementById("stock").value = p.stock || 0;
    document.getElementById("descripcion").value = p.descripcion;
    document.getElementById("categoria").value = p.categoria;

    let listaUrls = "";
    if (p.imagenes && Array.isArray(p.imagenes)) listaUrls = p.imagenes.join("\n");
    else if (p.imagen) listaUrls = p.imagen;

    document.getElementById("imgUrls").value = listaUrls;

    M.updateTextFields();
    M.textareaAutoResize(document.getElementById("imgUrls"));
    M.FormSelect.init(document.querySelectorAll("select"));

    document.getElementById("modalTitulo").innerText = "Editar Producto";
    M.Modal.getInstance(document.getElementById("modalProducto")).open();
};

window.guardarProducto = async () => {
    const imgText = document.getElementById("imgUrls").value.trim();
    const imagenesLista = imgText
        ? imgText
              .split("\n")
              .map((url) => url.trim())
              .filter((u) => u.length > 0)
        : [];

    const data = {
        nombre: document.getElementById("nombre").value,
        precio: Number(document.getElementById("precio").value),
        categoria: document.getElementById("categoria").value,
        stock: Number(document.getElementById("stock").value),
        descripcion: document.getElementById("descripcion").value,
        imagenes: imagenesLista,
        imagen: imagenesLista[0] || "",
    };

    try {
        UI.showLoading(true);
        if (window.productoEditandoId) await Store.update(window.productoEditandoId, data);
        else await Store.add(data);

        M.Modal.getInstance(document.getElementById("modalProducto")).close();
        await cargarCatalogo(true);
        M.toast({ html: "Guardado", classes: "green" });
    } catch (e) {
        console.error(e);
        M.toast({ html: "Error al guardar", classes: "red" });
    } finally {
        UI.showLoading(false);
    }
};

window.eliminarProducto = async (id) => {
    if (confirm("¿Eliminar producto?")) {
        await Store.delete(id);
        await cargarCatalogo(true);
    }
};

window.verDetalle = (id) => {
    const p = Store.products.find((item) => item.id === id);
    if (!p) return;

    // Llenar datos básicos
    const safeText = (id, text) => {
        if (document.getElementById(id)) document.getElementById(id).innerText = text;
    };
    safeText("detalleNombre", p.nombre);
    safeText("detallePrecio", `$${Number(p.precio).toFixed(2)}`);
    safeText("detalleCategoria", p.categoria);
    safeText("detalleStock", `Stock: ${p.stock || 0}`);
    safeText("detalleDescripcion", p.descripcion || "Sin descripción");

    // Carrusel
    const carruselContainer = document.getElementById("carruselProducto");
    if (carruselContainer) {
        let htmlImagenes = "";
        let imagenesParaMostrar =
            p.imagenes && p.imagenes.length > 0
                ? p.imagenes
                : [p.imagen || "https://via.placeholder.com/400x300?text=Sin+Imagen"];

        imagenesParaMostrar.forEach((url) => {
            htmlImagenes += `<a class="carousel-item" href="#!"><img src="${url}" style="object-fit: contain; width:100%; height:100%;"></a>`;
        });
        carruselContainer.innerHTML = htmlImagenes;
    }

    // Botón Agregar
    const btnAgregar = document.getElementById("btnAgregarDesdeDetalle");
    if (btnAgregar) {
        const nuevoBtn = btnAgregar.cloneNode(true);
        btnAgregar.parentNode.replaceChild(nuevoBtn, btnAgregar);
        nuevoBtn.onclick = () => {
            window.agregarCarrito(p.id);
            M.Modal.getInstance(document.getElementById("modalDetalle")).close();
        };
    }

    M.Modal.getInstance(document.getElementById("modalDetalle")).open();

    setTimeout(() => {
        const elems = document.querySelectorAll(".carousel");
        if (elems.length) M.Carousel.init(elems, { fullWidth: true, indicators: true });
    }, 200);
};
// ==========================================
// 3. BÚSQUEDA (Funciona para Admin y Cliente)
// ==========================================
window.filtrarProductos = () => {
    const texto = document.getElementById("busqueda").value.toLowerCase();
    const tarjetas = document.querySelectorAll("#listaProductos .col"); // Selecciona las columnas de productos

    tarjetas.forEach((tarjeta) => {
        // Busca el título dentro de la tarjeta
        const titulo = tarjeta.querySelector(".card-title").innerText.toLowerCase();

        // Muestra u oculta según coincidencia
        if (titulo.includes(texto)) {
            tarjeta.style.display = "block";
        } else {
            tarjeta.style.display = "none";
        }
    });
};
// ==========================================
// FUNCIÓN PARA VER/OCULTAR CONTRASEÑA
// ==========================================
window.togglePassword = () => {
    const input = document.getElementById("loginPass");
    const icon = document.getElementById("togglePasswordBtn");

    if (input.type === "password") {
        input.type = "text";
        icon.innerText = "visibility"; // Cambia icono a ojo abierto
    } else {
        input.type = "password";
        icon.innerText = "visibility_off"; // Cambia icono a ojo tachado
    }
};

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializar botones
    document.querySelector("#btn_iniciarSesion").addEventListener("click", window.iniciarSesion);
    document.querySelector("#btn_cerrarSesion").addEventListener("click", window.cerrarSesion);
    document.querySelector("#btn_abrirCarrito").addEventListener("click", window.abrirCarrito);
    document.querySelector("#btn_finalizarCompra").addEventListener("click", window.finalizarCompra);
    document.querySelector("#btn_abrirModalAgregar").addEventListener("click", window.abrirModalAgregar);
    document.querySelector("#btn_guardarProducto").addEventListener("click", window.guardarProducto);
    document.querySelector("#btn_togglePassword").addEventListener("click", window.togglePassword);

    document.querySelector("#busqueda").addEventListener("keyup", window.filtrarProductos);

    // Intentamos inicializar UI y Carrito de forma segura
    try {
        UI.init();
    } catch (e) {
        console.warn("UI init warning", e);
    }
    try {
        Cart.renderBadge();
    } catch (e) {
        console.warn("Cart init warning", e);
    }

    // Escuchamos el estado de autenticación (Login/Logout)
    onAuthStateChanged(auth, (user) => {
        currentUser = user;

        // A) Intentamos usar la función antigua UI, pero si falla, no detenemos el programa
        try {
            UI.toggleAdmin(user);
        } catch (e) {
            console.log("UI Toggle omitido");
        }

        // B) LÓGICA MAESTRA DE PANELES (Esto arregla la duplicidad sí o sí)
        const adminPanel = document.getElementById("adminPanelContainer");
        const clientPanel = document.getElementById("clientPanelContainer");
        const loginBtn = document.getElementById("btnLoginLi");
        const logoutBtn = document.getElementById("btnLogoutLi");
        const cartFab = document.querySelector(".cart-fab"); // Botón flotante del carrito

        if (user) {
            // ---> ES ADMINISTRADOR
            if (adminPanel) adminPanel.style.display = "block"; // Muestra Admin
            if (clientPanel) clientPanel.style.display = "none"; // Oculta Cliente
            if (loginBtn) loginBtn.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "block";
            if (cartFab) cartFab.style.display = "none"; // El admin no compra, oculta carrito
        } else {
            // ---> ES CLIENTE
            if (adminPanel) adminPanel.style.display = "none"; // Oculta Admin
            if (clientPanel) clientPanel.style.display = "block"; // Muestra Cliente
            if (loginBtn) loginBtn.style.display = "block";
            if (logoutBtn) logoutBtn.style.display = "none";
            if (cartFab) cartFab.style.display = "block"; // El cliente sí compra
        }

        // C) Forzar actualización de iconos de borrar/editar en las tarjetas
        setTimeout(() => {
            const adminActions = document.querySelectorAll(".admin-actions");
            adminActions.forEach((el) => (el.style.display = user ? "flex" : "none"));
        }, 500); // Pequeño retraso para asegurar que las tarjetas existan
    });

    await cargarCatalogo(true);
});
