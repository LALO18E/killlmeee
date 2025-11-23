export const Cart = {
    items: JSON.parse(localStorage.getItem('cart')) || [],
    
    add: (product) => {
        const exist = Cart.items.find(i => i.id === product.id);
        if(exist) exist.qty++;
        else Cart.items.push({...product, qty: 1});
        Cart.save();
    },
    update: (id, n) => {
        const item = Cart.items.find(i => i.id === id);
        if(item) {
            item.qty += n;
            if(item.qty <= 0) Cart.items = Cart.items.filter(i => i.id !== id);
            Cart.save();
        }
    },
    save: () => {
        localStorage.setItem('cart', JSON.stringify(Cart.items));
        Cart.renderBadge();
    },
    renderBadge: () => {
        const total = Cart.items.reduce((acc, i) => acc + i.qty, 0);
        document.getElementById('cartCount').innerText = total;
        document.getElementById('cartCount').style.display = total > 0 ? 'block' : 'none';
    },
    renderModal: () => {
        const list = document.getElementById('listaCarrito');
        let total = 0;
        list.innerHTML = Cart.items.map(i => {
            total += i.precio * i.qty;
            return `
            <li class="cart-item">
                <div style="display:flex; align-items:center;">
                    <img src="${i.imagen || 'https://via.placeholder.com/50'}">
                    <div><b>${i.nombre}</b><br>$${i.precio}</div>
                </div>
                <div class="cart-controls">
                    <i class="material-icons tiny red-text" style="cursor:pointer" onclick="window.updateCart('${i.id}', -1)">remove</i>
                    <span>${i.qty}</span>
                    <i class="material-icons tiny green-text" style="cursor:pointer" onclick="window.updateCart('${i.id}', 1)">add</i>
                </div>
            </li>`;
        }).join('');
        document.getElementById('cartTotal').innerText = '$' + total.toFixed(2);
    }
};