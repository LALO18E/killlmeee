import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { Auth } from "./auth.js";
import { Store } from "./store.js";
import { UI } from "./ui.js";
import { Cart } from "./cart.js";

let currentUser = null;
let imagenesTemporales = [];

// --- Carga Inicial ---
async function cargarCatalogo(reset = false) {
    try {
        UI.showLoading(true);
        var productos = await Store.load(reset);
        aplicarFiltros();
        UI.renderProducts(productos, !reset, currentUser);
    } catch (e) {
        console.error("Error cargando catálogo", e);
    } finally {
        UI.showLoading(false);
    }
}

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

// Gestión de Imágenes (Uno por uno) ---
window.agregarImagenTemporal = () => {
    const input = document.getElementById("tempImgUrl");
    const url = input.value.trim();

    if (!url) return M.toast({ html: "Escribe una URL", classes: "red" });
    if (url.includes("\n") || url.includes(" "))
        return M.toast({ html: "La URL no debe tener espacios", classes: "red" });

    imagenesTemporales.push(url);
    renderizarListaImagenes();
    input.value = "";
};

window.eliminarImagenTemp = (index) => {
    imagenesTemporales.splice(index, 1);
    renderizarListaImagenes();
};

function renderizarListaImagenes() {
    const lista = document.getElementById("listaUrlsImagenes");
    lista.innerHTML = "";
    imagenesTemporales.forEach((url, index) => {
        const li = document.createElement("li");
        li.className = "collection-item img-item valign-wrapper";
        li.style.justifyContent = "space-between";
        li.innerHTML = `
            <span class="truncate">${url}</span>
            <button type="button" class="btn-flat red-text" onclick="eliminarImagenTemp(${index})">
                <i class="material-icons">delete</i>
            </button>
        `;
        lista.appendChild(li);
    });
}

// --- Gestión de Productos (CRUD) ---
window.abrirModalAgregar = () => {
    document.getElementById("formProducto").reset();
    window.productoEditandoId = null;

    // Resetear imágenes
    imagenesTemporales = [];
    renderizarListaImagenes();

    document.getElementById("modalTitulo").innerText = "Nuevo Producto";
    M.Modal.getInstance(document.getElementById("modalProducto")).open();
};

window.editarProducto = (id) => {
    const p = Store.products.find((x) => x.id === id);
    if (!p) return;
    window.productoEditandoId = id;

    document.getElementById("nombre").value = p.nombre;
    document.getElementById("precio").value = p.precio;
    document.getElementById("stock").value = p.stock || 0;
    document.getElementById("descripcion").value = p.descripcion;
    document.getElementById("categoria").value = p.categoria;

    imagenesTemporales = p.imagenes && p.imagenes.length ? [...p.imagenes] : p.imagen ? [p.imagen] : [];
    renderizarListaImagenes();

    M.updateTextFields();

    M.FormSelect.init(document.getElementById("categoria"));

    document.getElementById("modalTitulo").innerText = "Editar Producto";
    M.Modal.getInstance(document.getElementById("modalProducto")).open();
};

window.guardarProducto = async () => {
    const nombre = document.getElementById("nombre").value.trim();
    const precio = Number(document.getElementById("precio").value);
    const stock = Number(document.getElementById("stock").value);

    if (!nombre) return M.toast({ html: "El nombre es obligatorio", classes: "red" });
    if (precio < 0) return M.toast({ html: "El precio no puede ser negativo", classes: "red" });
    if (stock < 0) return M.toast({ html: "El stock no puede ser negativo", classes: "red" });
    if (Math.round(stock) != stock) return M.toast({ html: "El stock debe ser un numero entero", classes: "red" });
    if (imagenesTemporales.length === 0) return M.toast({ html: "Agrega al menos una imagen", classes: "red" });

    const data = {
        nombre: nombre,
        precio: precio,
        categoria: document.getElementById("categoria").value,
        stock: stock,
        descripcion: document.getElementById("descripcion").value,
        imagenes: imagenesTemporales,
        imagen: imagenesTemporales[0] || "",
    };

    try {
        UI.showLoading(true);
        if (window.productoEditandoId) await Store.update(window.productoEditandoId, data);
        else await Store.add(data);

        M.Modal.getInstance(document.getElementById("modalProducto")).close();
        await cargarCatalogo(true);
        M.toast({ html: "Guardado correctamente", classes: "green" });
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

    document.getElementById("detalleNombre").innerText = p.nombre;
    document.getElementById("detallePrecio").innerText = `$${Number(p.precio).toFixed(2)}`;
    document.getElementById("detalleCategoria").innerText = p.categoria;
    document.getElementById("detalleStock").innerText = `Stock: ${p.stock || 0}`;
    document.getElementById("detalleDescripcion").innerText = p.descripcion || "Sin descripción";

    const carruselContainer = document.getElementById("carruselProducto");
    if (carruselContainer) {
        let htmlImagenes = "";
        let imagenesParaMostrar =
            p.imagenes && p.imagenes.length > 0 ? p.imagenes : [p.imagen || "https://via.placeholder.com/400"];

        imagenesParaMostrar.forEach((url) => {
            htmlImagenes += `<a class="carousel-item" href="#!"><img src="${url}"></a>`;
        });
        carruselContainer.innerHTML = htmlImagenes;

        // Destruir instancia previa si existe e inicializar nueva
        const instance = M.Carousel.getInstance(carruselContainer);
        if (instance) instance.destroy();

        setTimeout(() => {
            M.Carousel.init(carruselContainer, { fullWidth: true, indicators: true });
        }, 100);
    }

    const btnAgregar = document.getElementById("btnAgregarDesdeDetalle");
    const nuevoBtn = btnAgregar.cloneNode(true);
    btnAgregar.parentNode.replaceChild(nuevoBtn, btnAgregar);
    nuevoBtn.onclick = () => {
        window.agregarCarrito(p.id);
        M.Modal.getInstance(document.getElementById("modalDetalle")).close();
    };

    M.Modal.getInstance(document.getElementById("modalDetalle")).open();
};

window.aplicarFiltros = () => {
    const texto = document.getElementById("busqueda").value.toLowerCase();
    const catFilter = document.getElementById("filtroCategoria").value; // Select nuevo
    const orden = document.getElementById("ordenamiento").value; // Select nuevo

    let resultado = [...Store.products];

    // 1. Filtro Texto
    if (texto) {
        resultado = resultado.filter((p) => p.nombre.toLowerCase().includes(texto));
    }

    // 2. Filtro Categoría
    if (catFilter && catFilter !== "todos") {
        resultado = resultado.filter((p) => p.categoria === catFilter);
    }

    // 3. Ordenamiento
    resultado.sort((a, b) => {
        if (orden === "nombre_asc") return a.nombre.localeCompare(b.nombre);
        if (orden === "nombre_desc") return b.nombre.localeCompare(a.nombre);
        if (orden === "precio_asc") return a.precio - b.precio;
        if (orden === "precio_desc") return b.precio - a.precio;
        return 0;
    });

    // 4. Renderizar
    UI.renderProducts(resultado, false, currentUser);
};

window.togglePassword = () => {
    const input = document.getElementById("loginPass");
    const icon = document.getElementById("btn_togglePassword");
    if (input.type === "password") {
        input.type = "text";
        icon.innerText = "visibility";
    } else {
        input.type = "password";
        icon.innerText = "visibility_off";
    }
};

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
    // Inicializar existentes
    document.querySelector("#btn_iniciarSesion").addEventListener("click", window.iniciarSesion);
    document.querySelector("#btn_cerrarSesion").addEventListener("click", window.cerrarSesion);
    document.querySelector("#btn_abrirCarrito").addEventListener("click", window.abrirCarrito);
    document.querySelector("#btn_finalizarCompra").addEventListener("click", window.finalizarCompra);
    document.querySelector("#btn_abrirModalAgregar").addEventListener("click", window.abrirModalAgregar);
    document.querySelector("#btn_guardarProducto").addEventListener("click", window.guardarProducto);
    document.querySelector("#btn_togglePassword").addEventListener("click", window.togglePassword);
    document.querySelector("#btnAgregarUrl").addEventListener("click", window.agregarImagenTemporal);
    document.querySelector("#busqueda").addEventListener("keyup", window.aplicarFiltros);
    document.querySelector("#filtroCategoria").addEventListener("change", window.aplicarFiltros);
    document.querySelector("#ordenamiento").addEventListener("change", window.aplicarFiltros);

    // Inicializar UI y Carrito
    UI.init();
    Cart.renderBadge();

    onAuthStateChanged(auth, (user) => {
        currentUser = user;

        // Control de visibilidad paneles
        const adminPanel = document.getElementById("adminPanelContainer");
        const loginBtnLi = document.getElementById("btnLoginLi");
        const logoutBtnLi = document.getElementById("btnLogoutLi");
        const cartFab = document.querySelector(".fixed-action-btn");

        if (user) {
            if (adminPanel) adminPanel.style.display = "block";
            if (loginBtnLi) loginBtnLi.style.display = "none";
            if (logoutBtnLi) logoutBtnLi.style.display = "block";
            if (cartFab) cartFab.style.display = "none";
        } else {
            if (adminPanel) adminPanel.style.display = "none";
            if (loginBtnLi) loginBtnLi.style.display = "block";
            if (logoutBtnLi) logoutBtnLi.style.display = "none";
            if (cartFab) cartFab.style.display = "block";
        }

        // Recargar catálogo para mostrar botones de edición si es admin
        cargarCatalogo(false);
    });
});
