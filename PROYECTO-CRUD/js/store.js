import { db } from "./firebase-config.js";
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    startAfter,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const Store = {
    products: [],

    add: async (data) => await addDoc(collection(db, "productos"), data),
    load: async (reset = false) => {
        if (reset) Store.products = [];

        let q = query(collection(db, "productos"));

        const snap = await getDocs(q);
        if (snap.empty) return [];

        const newProds = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        Store.products = [...Store.products, ...newProds];
        return newProds;
    },
    update: async (id, data) => await updateDoc(doc(db, "productos", id), data),
    delete: async (id) => await deleteDoc(doc(db, "productos", id)),
};
