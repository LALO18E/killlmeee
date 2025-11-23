import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

export const Auth = {
    login: async (user, pass) => {
        const email = user.includes('@') ? user : `${user}@tienda.com`;
        await signInWithEmailAndPassword(auth, email, pass);
    },
    logout: async () => {
        await signOut(auth);
    }
};