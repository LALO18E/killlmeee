// Maneja todo lo visual
export const UI = {
    init: () => {
        M.Modal.init(document.querySelectorAll(".modal"));
        M.FormSelect.init(document.querySelectorAll("select"));
    },
    showLoading: (show) => {
        document.getElementById("loadingOverlay").style.display = show ? "flex" : "none";
    },
    // En js/ui.js

    toggleAdmin: (user) => {
        const display = user ? "block" : "none";

        // 1. Mostrar/Ocultar Panel de Admin
        document.getElementById("adminPanelContainer").style.display = display;
        document.getElementById("btnLoginLi").style.display = user ? "none" : "block";
        document.getElementById("btnLogoutLi").style.display = display;

        // 2. Mostrar/Ocultar botones de editar/borrar en las tarjetas
        document.querySelectorAll(".admin-actions").forEach((e) => (e.style.display = user ? "flex" : "none"));

        // 3. NUEVO: Ocultar el Carrito si es Admin
        // Buscamos el botón flotante por su clase
        const cartFab = document.querySelector(".cart-fab");
        if (cartFab) {
            // Si es usuario (admin) -> 'none' (oculto)
            // Si NO es usuario (cliente) -> 'block' (visible)
            cartFab.style.display = user ? "none" : "block";
        }

        // Opcional: Ocultar también los botones de "Agregar al carrito" de las tarjetas para que el admin no se confunda
        document.querySelectorAll(".btn-floating.halfway-fab").forEach((btn) => {
            btn.style.display = user ? "none" : "block";
        });
    },
    renderProducts: (products, append, user) => {
        const container = document.getElementById("listaProductos");
        const html = products
            .map((p) => {
                // 1. Preparamos las imágenes (array de URLs o placeholder)
                const imagenes =
                    p.imagenes && p.imagenes.length > 0 ? p.imagenes : [p.imagen || "https://via.placeholder.com/300"];

                // 2. Generamos los slides del carousel
                // Nota: Agregamos el onclick verDetalle a la imagen también
                const slidesHtml = imagenes
                    .map(
                        (url) => `
            <a class="carousel-item" href="#!" onclick="window.verDetalle('${p.id}')" style="cursor: pointer;">
                <img src="${url}" style="object-fit: cover; height: 100%; width: 100%;">
            </a>
        `
                    )
                    .join("");

                // 3. Determinamos visibilidad de acciones admin
                const displayAdmin = user ? "flex" : "none";
                // Ocultamos botón de compra si es admin (opcional, pero recomendado para evitar errores visuales)
                const displayBuy = user ? "none" : "inline-block";

                return `
        <div class="col s12 m6 l4 producto" id="prod-${p.id}">
            <div class="card hoverable" style="border-radius: 20px; overflow: hidden;">
                
                <div class="card-image" style="height: 250px;"> 
                    <div class="carousel carousel-slider center" style="height: 100%;">
                        ${slidesHtml}
                    </div>

                    <a class="btn-floating halfway-fab orange darken-2" 
                       style="display: ${displayBuy}"
                       onclick="window.agregarCarrito('${p.id}')">
                        <i class="material-icons">add_shopping_cart</i>
                    </a>

                    <div class="admin-actions" style="display:${displayAdmin}; position:absolute; top:10px; right:10px; gap:5px; z-index: 999;">
                        <a class="btn-floating blue btn-small" onclick="window.editarProducto('${p.id}')">
                            <i class="material-icons">edit</i>
                        </a>
                        <a class="btn-floating red btn-small" onclick="window.eliminarProducto('${p.id}')">
                            <i class="material-icons">delete</i>
                        </a>
                    </div>
                </div>

                <div class="card-content">
                    <span class="card-title truncate grey-text text-darken-4" 
                          onclick="window.verDetalle('${p.id}')" 
                          style="cursor: pointer; font-weight: bold; font-size: 1.2rem;">
                        ${p.nombre}
                    </span>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div class="chip small blue lighten-5 blue-text">${p.categoria || "General"}</div>
                        <span class="green-text text-darken-2" style="font-weight: bold; font-size: 1.3rem;">$${Number(
                            p.precio
                        ).toFixed(2)}</span>
                    </div>

                    <p class="truncate grey-text">${p.descripcion || "Sin descripción"}</p>
                </div>
            </div>
        </div>
        `;
            })
            .join("");

        if (append) container.innerHTML += html;
        else container.innerHTML = html;

        // IMPORTANTE: Inicializar los carousels de Materialize después de insertarlos en el DOM
        // Usamos un pequeño timeout para asegurar que el DOM se ha pintado
        setTimeout(() => {
            const carruseles = container.querySelectorAll(".carousel");
            if (carruseles.length > 0) {
                M.Carousel.init(carruseles, {
                    fullWidth: true,
                    indicators: true, // Muestra los puntitos abajo si hay varias fotos
                    duration: 200,
                });
            }
        }, 50);
    },
    // updateLoadMoreBtn: (hasMore) => {
    //     const btn = document.getElementById('btnCargarMasContainer');
    //     btn.innerHTML = hasMore
    //         ? '<button class="btn blue-grey" onclick="window.cargarMas()">Cargar Más</button>'
    //         : '<p class="grey-text">No hay más productos</p>';
    // }
};
