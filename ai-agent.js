// AI Agent functionality
const aiMessages = document.getElementById('ai-messages');
const aiPrompt = document.getElementById('ai-prompt');
const aiSubmit = document.getElementById('ai-submit');
const aiVoice = document.getElementById('ai-voice');

// Initialize AI Agent
export function initAIAgent() {
    setupAIEventListeners();
}

// Set up event listeners for AI interface
function setupAIEventListeners() {
    aiSubmit.addEventListener('click', handleAISubmit);
    aiPrompt.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAISubmit();
    });
    
    aiVoice.addEventListener('click', handleAIVoice);
}

// Handle AI prompt submission
async function handleAISubmit() {
    const prompt = aiPrompt.value.trim();
    if (!prompt) return;
    
    // Add user message to chat
    addMessage(prompt, 'user');
    aiPrompt.value = '';
    
    try {
        // Process the command
        const response = await processAICommand(prompt);
        addMessage(response, 'ai');
    } catch (error) {
        addMessage(`Error: ${error.message}`, 'ai');
    }
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    aiMessages.appendChild(messageDiv);
    aiMessages.scrollTop = aiMessages.scrollHeight;
}

// Process AI command
async function processAICommand(command) {
    // First try to understand the command
    const intent = await detectCommandIntent(command);
    
    // Process based on intent
    switch (intent) {
        case 'add_product':
            return handleAddProductCommand(command);
        case 'delete_product':
            return handleDeleteProductCommand(command);
        case 'list_products':
            return handleListProductsCommand();
        case 'explain_product':
            return handleExplainProductCommand(command);
        case 'backup_products':
            return handleBackupCommand();
        default:
            return await generateAIResponse(command);
    }
}

// Detect command intent using Hugging Face
async function detectCommandIntent(command) {
    // This is a simplified version - in a real app, you'd use Hugging Face API
    // Here we're just doing basic string matching for the demo
    
    if (command.toLowerCase().includes('add') && command.toLowerCase().includes('product')) {
        return 'add_product';
    } else if (command.toLowerCase().includes('delete') || command.toLowerCase().includes('remove')) {
        return 'delete_product';
    } else if (command.toLowerCase().includes('list') || command.toLowerCase().includes('show')) {
        return 'list_products';
    } else if (command.toLowerCase().includes('explain') || command.toLowerCase().includes('describe')) {
        return 'explain_product';
    } else if (command.toLowerCase().includes('backup')) {
        return 'backup_products';
    } else {
        return 'general_query';
    }
}

// Handle add product command
async function handleAddProductCommand(command) {
    // In a real app, you'd parse the command to get product details
    // For demo, we'll just add a placeholder product
    
    const newProductRef = push(ref(db, `users/${currentUser.uid}/products`));
    await set(newProductRef, {
        name: 'New Product',
        price: 0,
        quantity: 1,
        description: 'Added via SkyAI command',
        createdAt: new Date().toISOString()
    });
    
    return 'Added a new product. You can edit its details in the Product Manager.';
}

// Handle delete product command
async function handleDeleteProductCommand(command) {
    // Extract product ID from command
    const productIdMatch = command.match(/\d+/);
    if (!productIdMatch) return 'Please specify which product to delete.';
    
    const productId = productIdMatch[0];
    await remove(ref(db, `users/${currentUser.uid}/products/${productId}`));
    
    return `Product ${productId} has been deleted.`;
}

// Handle list products command
async function handleListProductsCommand() {
    const snapshot = await get(ref(db, `users/${currentUser.uid}/products`));
    const products = snapshot.val() || {};
    const count = Object.keys(products).length;
    
    return `You have ${count} products in your inventory. Check the Product Manager tab for details.`;
}

// Handle explain product command
async function handleExplainProductCommand(command) {
    // Extract product ID from command
    const productIdMatch = command.match(/\d+/);
    if (!productIdMatch) return 'Please specify which product to explain.';
    
    const productId = productIdMatch[0];
    const snapshot = await get(ref(db, `users/${currentUser.uid}/products/${productId}`));
    
    if (!snapshot.exists()) {
        return `Product ${productId} not found.`;
    }
    
    const product = snapshot.val();
    return `Product ${productId}: ${product.name}, Price: $${product.price}, Quantity: ${product.quantity}. Description: ${product.description}`;
}

// Handle backup command
async function handleBackupCommand() {
    backupProducts();
    return 'Your product data has been backed up as a JSON file.';
}

// Generate AI response using Hugging Face API
async function generateAIResponse(prompt) {
    try {
        // In a production app, you would call your backend which then calls Hugging Face
        // This is a mock implementation for the demo
        
        // Mock responses based on prompt
        if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('hi')) {
            return 'Hello! How can I help you with your products today?';
        } else if (prompt.toLowerCase().includes('help')) {
            return 'I can help you add, delete, or explain products. Try commands like "Add a new product", "Delete product 3", or "Explain product 5".';
        } else {
            return "I'm not sure how to respond to that. Try asking me to help with your products.";
        }
        
        // Real implementation would look like this:
        /*
        const response = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-large', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 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',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: prompt })
        });
        
        const data = await response.json();
        return data[0]?.generated_text || "I couldn't generate a response.";
        */
    } catch (error) {
        console.error('AI Error:', error);
        return "Sorry, I encountered an error processing your request.";
    }
}

// Handle voice input
function handleAIVoice() {
    if (!('webkitSpeechRecognition' in window)) {
        addMessage('Voice commands are not supported in your browser.', 'ai');
        return;
    }
    
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
        aiVoice.textContent = '🔴 Listening...';
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        aiPrompt.value = transcript;
        aiVoice.textContent = '🎤';
        handleAISubmit();
    };
    
    recognition.onerror = (event) => {
        aiVoice.textContent = '🎤';
        addMessage(`Voice recognition error: ${event.error}`, 'ai');
    };
    
    recognition.onend = () => {
        aiVoice.textContent = '🎤';
    };
    
    recognition.start();
}
