import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit, startAfter, addDoc, updateDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export const Store = {
    products: [],
    lastDoc: null,
    hasMore: true,
    
    load: async (reset = false) => {
        if(reset) { Store.products = []; Store.lastDoc = null; Store.hasMore = true; }
        if(!Store.hasMore) return [];

        let q = query(collection(db, 'productos'), orderBy('nombre'), limit(6));
        if(Store.lastDoc) {
            q = query(collection(db, 'productos'), orderBy('nombre'), startAfter(Store.lastDoc), limit(6));
        }

        const snap = await getDocs(q);
        if(snap.empty) {
            Store.hasMore = false;
            return [];
        }

        Store.lastDoc = snap.docs[snap.docs.length - 1];
        if(snap.docs.length < 6) Store.hasMore = false;

        const newProds = snap.docs.map(d => ({id: d.id, ...d.data()}));
        Store.products = [...Store.products, ...newProds];
        return newProds;
    },
    add: async (data) => await addDoc(collection(db, 'productos'), data),
    update: async (id, data) => await updateDoc(doc(db, 'productos', id), data),
    delete: async (id) => await deleteDoc(doc(db, 'productos', id))
};