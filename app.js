import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    set, 
    onValue, 
    remove,
    push,
    child,
    get 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCgNihy8YoQatfZ8AQXNCrL7lGk_tulNpw",
    authDomain: "skystudio-780d5.firebaseapp.com",
    projectId: "skystudio-780d5",
    storageBucket: "skystudio-780d5.appspot.com",
    messagingSenderId: "886769050518",
    appId: "1:886769050518:web:8cc60a8ceaf0f87d7933b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const productList = document.getElementById('product-list');
const addProductBtn = document.getElementById('add-product-btn');
const backupProductsBtn = document.getElementById('backup-products-btn');
const productModal = document.getElementById('product-modal');
const saveProductBtn = document.getElementById('save-product-btn');
const cancelProductBtn = document.getElementById('cancel-product-btn');
const modalTitle = document.getElementById('modal-title');
const productNameInput = document.getElementById('product-name');
const productPriceInput = document.getElementById('product-price');
const productQuantityInput = document.getElementById('product-quantity');
const productDescriptionInput = document.getElementById('product-description');

// State variables
let currentUser = null;
let editingProductId = null;

// Initialize the app
function init() {
    setupEventListeners();
    checkAuthState();
}

// Set up event listeners
function setupEventListeners() {
    // Auth events
    loginBtn.addEventListener('click', handleLogin);
    signupBtn.addEventListener('click', handleSignup);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Product management
    addProductBtn.addEventListener('click', () => openProductModal(null));
    backupProductsBtn.addEventListener('click', backupProducts);
    saveProductBtn.addEventListener('click', saveProduct);
    cancelProductBtn.addEventListener('click', closeProductModal);
}

// Check authentication state
function checkAuthState() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            loadProducts();
        } else {
            currentUser = null;
            authContainer.style.display = 'block';
            appContainer.style.display = 'none';
        }
    });
}

// Handle login
async function handleLogin() {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Logged in successfully!');
    } catch (error) {
        alert(`Login failed: ${error.message}`);
    }
}

// Handle signup
async function handleSignup() {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Account created successfully!');
    } catch (error) {
        alert(`Signup failed: ${error.message}`);
    }
}

// Handle logout
async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        alert(`Logout failed: ${error.message}`);
    }
}

// Switch between tabs
function switchTab(tabId) {
    tabButtons.forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-tab') === tabId);
    });
    
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
}

// Load products from Firebase
function loadProducts() {
    if (!currentUser) return;
    
    const productsRef = ref(db, `users/${currentUser.uid}/products`);
    
    onValue(productsRef, (snapshot) => {
        productList.innerHTML = '';
        const products = snapshot.val() || {};
        
        Object.entries(products).forEach(([id, product]) => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <h3>${product.name}</h3>
                <p><strong>Price:</strong> $${product.price}</p>
                <p><strong>Quantity:</strong> ${product.quantity}</p>
                <p><strong>Description:</strong> ${product.description}</p>
                <div class="product-actions">
                    <button class="edit-btn" data-id="${id}">Edit</button>
                    <button class="delete-btn" data-id="${id}">Delete</button>
                </div>
            `;
            
            productList.appendChild(productCard);
        });
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id');
                openProductModal(productId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-id');
                deleteProduct(productId);
            });
        });
    });
}

// Open product modal for adding/editing
function openProductModal(productId) {
    if (productId) {
        // Editing existing product
        editingProductId = productId;
        modalTitle.textContent = 'Edit Product';
        
        const productRef = ref(db, `users/${currentUser.uid}/products/${productId}`);
        get(productRef).then((snapshot) => {
            const product = snapshot.val();
            productNameInput.value = product.name;
            productPriceInput.value = product.price;
            productQuantityInput.value = product.quantity;
            productDescriptionInput.value = product.description;
        });
    } else {
        // Adding new product
        editingProductId = null;
        modalTitle.textContent = 'Add New Product';
        productNameInput.value = '';
        productPriceInput.value = '';
        productQuantityInput.value = '';
        productDescriptionInput.value = '';
    }
    
    productModal.style.display = 'flex';
}

// Close product modal
function closeProductModal() {
    productModal.style.display = 'none';
}

// Save product to Firebase
function saveProduct() {
    const name = productNameInput.value;
    const price = productPriceInput.value;
    const quantity = productQuantityInput.value;
    const description = productDescriptionInput.value;
    
    if (!name || !price || !quantity) {
        alert('Please fill in all required fields');
        return;
    }
    
    const productData = {
        name,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        description,
        createdAt: new Date().toISOString()
    };
    
    if (editingProductId) {
        // Update existing product
        set(ref(db, `users/${currentUser.uid}/products/${editingProductId}`), productData)
            .then(() => {
                alert('Product updated successfully!');
                closeProductModal();
            })
            .catch(error => {
                alert(`Error updating product: ${error.message}`);
            });
    } else {
        // Add new product
        push(ref(db, `users/${currentUser.uid}/products`), productData)
            .then(() => {
                alert('Product added successfully!');
                closeProductModal();
            })
            .catch(error => {
                alert(`Error adding product: ${error.message}`);
            });
    }
}

// Delete product from Firebase
function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        remove(ref(db, `users/${currentUser.uid}/products/${productId}`))
            .then(() => {
                alert('Product deleted successfully!');
            })
            .catch(error => {
                alert(`Error deleting product: ${error.message}`);
            });
    }
}

// Backup products as JSON
function backupProducts() {
    const productsRef = ref(db, `users/${currentUser.uid}/products`);
    
    get(productsRef).then((snapshot) => {
        const products = snapshot.val() || {};
        const dataStr = JSON.stringify(products, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportName = `products_backup_${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportName);
        linkElement.click();
    }).catch(error => {
        alert(`Error backing up products: ${error.message}`);
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
