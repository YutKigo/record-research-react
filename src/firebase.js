// Import the functions you need from the SDKs you need
// firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCmqG8hpfsIuIkhqoaAFb7corl76NUmuCw",
  authDomain: "vscode-sample-extension.firebaseapp.com",
  projectId: "vscode-sample-extension",
  storageBucket: "vscode-sample-extension.firebasestorage.app",
  messagingSenderId: "871163097885",
  appId: "1:871163097885:web:fb1c041aa485c7e08fe7f4",
  measurementId: "G-TWJ3JTKE2X"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };