// Get references to DOM elements
const addProductInput = document.getElementById('new-product');
const priceInput = document.getElementById('price');
const addBtn = document.getElementById('add-btn');

const searchNameInput = document.getElementById('item-name'); // Input for name/description search
const searchIdInput = document.getElementById('item-id'); // Input for ID search
const searchBtn = document.getElementById('search-btn');
const refreshBtn = document.getElementById('refresh-btn');

const productList = document.getElementById('product-list');
const productCountElement = document.getElementById('product-count'); // Get reference to the count element
const loadingIndicatorElement = document.getElementById('loading-indicator'); // Get reference to the loading indicator


// Get references to product details elements
const productDetailsOverlay = document.getElementById('product-details-overlay');
const productDetailsModal = productDetailsOverlay.querySelector('.product-details-modal');
// Corrected: Get reference to the close button inside the modal
const closeDetailsBtn = productDetailsModal.querySelector('.close-btn');

// References to elements within the details modal
const detailDescriptionElement = document.getElementById('detail-description');
const detailItemNumberElement = document.getElementById('detail-item-number');
const detailGreatDealCostElement = document.getElementById('detail-great-deal-cost');
const detailSalvageCostPercentElement = document.getElementById('detail-salvage-cost-percent');
const detailCommentsElement = document.getElementById('detail-comments');
const detailCostcoPriceElement = document.getElementById('detail-costco-price');

// Added references for the new detail elements based on the image
const detailCategory10Element = document.getElementById('detail-category-10');
const detailCategory15Element = document.getElementById('detail-category-15');
const detailCategory20Element = document.getElementById('detail-category-20');
const detailCategory25Element = document.getElementById('detail-category-25');
const detailCategory30Element = document.getElementById('detail-category-30');
const detailCategory40Element = document.getElementById('detail-category-40');
const detailCategory50Element = document.getElementById('detail-category-50');

// Variable to store all fetched products (needed for details display)
let allProductsData = [];
// Variable to store currently displayed products (after search/filter)
let currentDisplayedProducts = [];

// --- Pagination Variables ---
const itemsPerPage = 10; // Number of items to display per page
let currentPage = 1; // Current page number
let totalPages = 1; // Total number of pages

// --- Get references to Pagination Elements ---
const paginationControls = document.getElementById('pagination-controls'); // Get reference to the pagination container
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageInfoSpan = document.getElementById('page-info');


// Firebase Configuration (Replace with your actual config)
const firebaseConfig = {
    apiKey: "AIzaSyCfpunCv-JBrCYKdiHv5FgT8HzLFMfVbUA", // Ensure this is your actual API Key
    authDomain: "todo-list-app-1e820.firebaseapp.com", // Replace with your auth domain
    databaseURL: "https://todo-list-app-1e820-default-rtdb.firebaseio.com", // Replace with your actual database URL
    projectId: "todo-list-app-1e820", // Replace with your project ID
    storageBucket: "todo-list-app-1e820.firebasestorage.app", // Replace with your storage bucket
    messagingSenderId: "426317039766", // Replace with your sender ID
    appId: "1:426317039766:web:cfc26d99d50a5cf03d5ab7" // Replace with your app ID
};

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  // Get a reference to the database service and the 'products' node
  const database = firebase.database();
  const productsRef = database.ref('products');


  // --- Helper Functions for Firebase Interaction ---

  // Function to get all products (fetches all for client-side filtering)
  // This function is called by searchProducts to get ALL data.
  function getProducts() {
    return new Promise((resolve, reject) => {
      // Fetch ALL products for client-side filtering
      productsRef.once('value', (snapshot) => {
        const products = snapshot.val() || {};

        // Corrected mapping to include all original properties
        const productList = Object.entries(products).map(([id, productData]) => {
           return {
             id: id, // Firebase push ID
             ...productData // Spread all properties from the database object
           };
        });

         // --- Default sorting by 'DESCRIPTION' in ascending order (as strings) ---
        // This default sort is applied when the page loads or is refreshed without a specific search.
        productList.sort((a, b) => {
          // Ensure 'DESCRIPTION' is treated as a string, handle missing/undefined
          const descriptionA = String(a.DESCRIPTION || '').trimStart(); // Treat missing/undefined as empty string
          const descriptionB = String(b.DESCRIPTION || '').trimStart();

          // Use localeCompare for proper string comparison (ascending)
          return descriptionA.localeCompare(descriptionB);
      });



        // Update allProductsData here as this is the source of truth for all data
        allProductsData = productList;
        resolve(productList);
      }, (error) => {
        console.error('Firebase Fetch Error:', error);
        reject(error);
      });
    });
  }

  // Function to create a new product (keeping for completeness)
  async function createProduct(product) {
    const newProductRef = productsRef.push();
    const newProductWithId = { id: newProductRef.key, ...product };
    await newProductRef.set(product); // Use set to write the data
    return newProductWithId; // Return the product including the new ID
  }


  // Function to update a product (keeping for completeness)
  async function updateProduct(id, updates) {
    return productsRef.child(id).update(updates);
  }


  // Function to delete a product (keeping for completeness)
  async function deleteProduct(id) {
    // Assuming the structure is products/{id}
    return productsRef.child(id).remove();
  }


  // --- DOM Manipulation Functions ---

 // Function to render a product to the UI
  function renderProduct(product) {
    const productItem = document.createElement('li');
    productItem.classList.add('product');
    productItem.dataset.productId = product.id; // Store the product ID

    // Add click listener to the list item
    productItem.addEventListener('click', () => showProductDetails(product.id));
    // Or for double-click:
    // productItem.addEventListener('dblclick', () => showProductDetails(product.id));


    // Display Item Number (assuming 'ITEM' is the key in your JSON)
    if (product.ITEM !== undefined) {
        const productItemNumberElement = document.createElement('span');
        productItemNumberElement.classList.add('product-item-number');
        productItemNumberElement.textContent = `Item #: ${product.ITEM}`;
        productItem.appendChild(productItemNumberElement);
    }

    // Display Description (assuming 'DESCRIPTION' is the key in your JSON)
    if (product.DESCRIPTION) { // Check if DESCRIPTION exists
            const productDESCRIPTIONElement = document.createElement('span');
            productDESCRIPTIONElement.classList.add('product-description');
            productDESCRIPTIONElement.textContent = product.DESCRIPTION;
            productItem.appendChild(productDESCRIPTIONElement);
        }

        // Display Sell Price (assuming 'SELL PRICE' is the key)
        if (product["SELL PRICE"] !== undefined) { // Check if SELL PRICE exists
            const productSellPriceElement = document.createElement('span');
            productSellPriceElement.classList.add('product-price');
            // Ensure it's a number before toFixed
            const sellPrice = typeof product["SELL PRICE"] === 'number' ? product["SELL PRICE"] : parseFloat(product["SELL PRICE"]);
            if (!isNaN(sellPrice)) {
                 productSellPriceElement.textContent = `Price: $${sellPrice.toFixed(2)}`; // Format price
                 productItem.appendChild(productSellPriceElement);
            }
        }

        // Display Great Deals Price Cost (assuming 'GREAT DEALS PRICE COST' is the key)
        if (product["GREAT DEALS PRICE COST"] !== undefined) { // Check if GREAT DEALS PRICE COST exists
            const productGreatDealsPriceElement = document.createElement('span');
            productGreatDealsPriceElement.classList.add('product-great-deals-price');
             // Ensure it's a number before toFixed
            const greatDealsPrice = typeof product["GREAT DEALS PRICE COST"] === 'number' ? product["GREAT DEALS PRICE COST"] : parseFloat(product["GREAT DEALS PRICE COST"]);
            if (!isNaN(greatDealsPrice)) {
                productGreatDealsPriceElement.textContent = `Great Deal: $${greatDealsPrice.toFixed(2)}`; // Format price
                productItem.appendChild(productGreatDealsPriceElement);
            }
        }

        // Append the complete product item to the list
        productList.appendChild(productItem);
  }

  // Function to clear the product list in the UI
  function clearProductList() {
    productList.innerHTML = '';
  }

  // Function to update the displayed product count
  function updateProductCountDisplay(count, total) {
      if (productCountElement) {
          // Calculate the range of displayed items
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = Math.min(startIndex + count, total); // Ensure endIndex doesn't exceed total

          if (total === 0) {
               productCountElement.textContent = `Displayed Products: 0 of 0`;
          } else {
               productCountElement.textContent = `Displayed Products: ${startIndex + 1}-${endIndex} of ${total}`;
          }
      }
  }

  // Function to show the loading indicator
  function showLoadingIndicator() {
      if (loadingIndicatorElement) {
          loadingIndicatorElement.classList.remove('hidden');
      }
      // Hide pagination controls when loading starts
      if (paginationControls) {
          paginationControls.classList.add('hidden');
      }
      clearProductList(); // Clear the list immediately when loading starts
      updateProductCountDisplay(0, 0); // Reset count display
  }

  // Function to hide the loading indicator
  function hideLoadingIndicator() {
      if (loadingIndicatorElement) {
          loadingIndicatorElement.classList.add('hidden');
      }
      // Pagination visibility is handled after rendering the current page in renderCurrentPage
  }

  // Function to show product details in the modal
  function showProductDetails(productId) {
      // Find the product in the allProductsData array
      const product = allProductsData.find(p => p.id === productId);

      if (product) {
          // Populate the modal with product details
          // Populate the existing detail elements
          detailDescriptionElement.textContent = product.DESCRIPTION || 'N/A';
          detailItemNumberElement.textContent = product.ITEM !== undefined ? product.ITEM : 'N/A';
         
          // Format and display numeric values, handle missing data
          detailGreatDealCostElement.textContent = product["GREAT DEALS PRICE COST"] !== undefined ? `$${parseFloat(product["GREAT DEALS PRICE COST"]).toFixed(2)}` : 'N/A';
          detailSalvageCostPercentElement.textContent = product["SALVAGE %"] !== undefined ? `${parseFloat(product["SALVAGE %"])}%` : 'N/A';
          detailCommentsElement.textContent = product["comments "] || 'N/A'; // Assuming 'comments' is the key
          detailCostcoPriceElement.textContent = product["SELL PRICE"] !== undefined ? `$${parseFloat(product["SELL PRICE"]).toFixed(2)}` : 'N/A'; // Assuming Sell Price is Costco Price
          
          // Populate the new detail elements based on the image data
          // You will need to replace the placeholder property names (e.g., product.category10, product.value10)
          // with the actual property names from your Firebase data.
          detailCategory10Element.textContent = product["GREAT PRICE WITH 10% FROM COSTCO"] !== undefined ? `$${parseFloat(product["GREAT PRICE WITH 10% FROM COSTCO"]).toFixed(2)}` : 'N/A'; 
          detailCategory15Element.textContent = product["GREAT PRICE WITH 15% FROM COSTCO2"] !== undefined ? `$${parseFloat(product["GREAT PRICE WITH 15% FROM COSTCO2"]).toFixed(2)}` : 'N/A'; 
          detailCategory20Element.textContent = product["GREAT PRICE WITH 20% FROM COSTCO"] !== undefined ? `$${parseFloat(product["GREAT PRICE WITH 20% FROM COSTCO"]).toFixed(2)}` : 'N/A'; 
          detailCategory25Element.textContent = product["GREAT PRICE WITH 25% FROM COSTCO"] !== undefined ? `$${parseFloat(product["GREAT PRICE WITH 25% FROM COSTCO"]).toFixed(2)}` : 'N/A'; 
          detailCategory30Element.textContent = product["GREAT PRICE WITH 30% FROM COSTCO3"] !== undefined ? `$${parseFloat(product["GREAT PRICE WITH 30% FROM COSTCO3"]).toFixed(2)}` : 'N/A'; 
          detailCategory40Element.textContent = product["GREAT PRICE WITH 40% FROM COSTCO2"] !== undefined ? `$${parseFloat(product["GREAT PRICE WITH 40% FROM COSTCO2"]).toFixed(2)}` : 'N/A'; 
          detailCategory50Element.textContent = product["GREAT PRICE WITH 50% FROM COSTCO22"] !== undefined ? `$${parseFloat(product["GREAT PRICE WITH 50% FROM COSTCO22"]).toFixed(2)}` : 'N/A'; 
          

          // Show the overlay and modal
          // Ensure productDetailsOverlay exists before removing hidden class
          if (productDetailsOverlay) {
              // productDetailsOverlay.classList.remove('hidden');
              productDetailsOverlay.style.display = '';
          } else {
              console.error('Product details overlay element not found.');
          }
      } else {
          console.error("Product not found for ID:", productId);
          // Optionally display an error message to the user
      }
  }

  // Function to hide product details modal
  function hideProductDetails() {
      // Ensure productDetailsOverlay exists before adding hidden class
      if (productDetailsOverlay) {
          //  productDetailsOverlay.classList.add('hidden');
          productDetailsOverlay.style.display = 'none';
      }
  }

  // --- Pagination Functions ---

  // Function to render the current page of products
  function renderCurrentPage() {
      clearProductList();
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const productsToRender = currentDisplayedProducts.slice(startIndex, endIndex);

      if (productsToRender.length === 0 && currentDisplayedProducts.length > 0) {
          // If we landed on an empty page (e.g., last item of last page deleted), go back a page
          if (currentPage > 1) {
              currentPage--;
              renderCurrentPage(); // Re-render the previous page
              return; // Exit this call to avoid double rendering
          } else {
              // If no products at all in the filtered list
              productList.innerHTML = '<p>No products found.</p>';
          }
      } else if (productsToRender.length === 0 && currentDisplayedProducts.length === 0) {
           // If no products at all after initial load or search
           productList.innerHTML = '<p>No products found.</p>';
      }
      else {
          productsToRender.forEach(renderProduct);
      }

      updateProductCountDisplay(productsToRender.length, currentDisplayedProducts.length);
      renderPaginationControls();

      // Show pagination controls only if there are products to display
      if (paginationControls) {
          if (currentDisplayedProducts.length > 0) {
              paginationControls.classList.remove('hidden');
          } else {
              paginationControls.classList.add('hidden');
          }
      }
  }

  // Function to update pagination button states and page info
  function renderPaginationControls() {
      totalPages = Math.ceil(currentDisplayedProducts.length / itemsPerPage);
      pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages}`;

      prevPageBtn.disabled = currentPage === 1;
      nextPageBtn.disabled = currentPage === totalPages || totalPages === 0; // Disable next if on last page or no products
  }

  // Function to change the current page
  function changePage(direction) {
      if (direction === 'next' && currentPage < totalPages) {
          currentPage++;
      } else if (direction === 'prev' && currentPage > 1) {
          currentPage--;
      }
      renderCurrentPage();
  }


  // --- Application Logic ---

  // Function to load products from Firebase and display them (initial load or refresh)
  async function loadProducts() {
    showLoadingIndicator(); // Show indicator and hide pagination

    try {
      // Fetch ALL products and update allProductsData
      const allProducts = await getProducts(); // getProducts fetches ALL and updates allProductsData

      // Set currentDisplayedProducts to all fetched products initially
      currentDisplayedProducts = allProducts;

      // Reset to the first page when loading new data
      currentPage = 1;

      // Render the first page of products and handle pagination visibility
      renderCurrentPage();

    } catch (error) {
      console.error('Error loading products:', error);
      productList.innerHTML = '<p>Error loading products.</p>';
      updateProductCountDisplay(0, 0);
      renderPaginationControls(); // Render controls (will be disabled/hidden) even on error
    } finally {
        hideLoadingIndicator(); // Hide loading indicator
    }
  }

 

  // Function to search for products (client-side filtering and sorting)
  async function searchProducts() {
    const searchTerm = searchNameInput.value.trim().toLowerCase();
    const searchIdTerm = searchIdInput.value.trim();

    showLoadingIndicator(); // Show indicator and hide pagination
    hideProductDetails(); // Ensure modal is hidden when searching starts

    // If search terms are empty, just load the initial products (which will handle pagination)
    if (searchTerm === '' && searchIdTerm === '') {
        // Re-render the currentDisplayedProducts (which should be all products, already sorted by Description)
        currentDisplayedProducts = allProductsData; // Ensure we are working with the full dataset
        currentPage = 1; // Reset to first page for new search/clear
        renderCurrentPage(); // Render and handle pagination visibility
        hideLoadingIndicator(); // Hide indicator after rendering
        return;
    }

    try {
      // Filter the globally stored allProductsData array
      let matchingProducts = allProductsData.filter(product => {
         // Ensure product is an object and has properties before accessing them for safety
        const description = String(product && product.DESCRIPTION || '').toLowerCase();
        const item = String(product && product.ITEM || '');

        if (searchTerm !== '' && searchIdTerm !== '') {
             return description.includes(searchTerm) && item.includes(searchIdTerm);
        } else if (searchTerm !== '') {
             return description.includes(searchTerm);
        } else if (searchIdTerm !== '') {
             // Filter by Item ID (case-insensitive check if needed, but exact match is often better for IDs)
             return item.includes(searchIdTerm); // Use includes for partial matches
        }
         return false;
      });

      // --- Custom sorting for search results ---
      // Prioritize exact Item ID matches, then sort by Description
      // HIGHLIGHT START
      if (searchIdTerm !== '') { // Apply this sorting only if an Item ID search term is present
          matchingProducts.sort((a, b) => {
              const itemA = String(a.ITEM || '');
              const itemB = String(b.ITEM || '');
              const descriptionA = String(a.DESCRIPTION || '').toLowerCase();
              const descriptionB = String(b.DESCRIPTION || '').toLowerCase();

              // Check for exact match of the searchIdTerm
              const aIsExactMatch = itemA === searchIdTerm;
              const bIsExactMatch = itemB === searchIdTerm;

              if (aIsExactMatch && !bIsExactMatch) {
                  return -1; // 'a' comes first (exact match)
              } else if (!aIsExactMatch && bIsExactMatch) {
                  return 1; // 'b' comes first (exact match)
              } else {
                  // If neither or both are exact matches, sort by Description
                  return descriptionA.localeCompare(descriptionB);
              }
          });
      } else {
          // If no Item ID search term, maintain the default Description sort
          // (which is already applied to allProductsData)
          // No additional sort needed here as filtering preserves the original order.
      }
      // HIGHLIGHT END


      // Update currentDisplayedProducts with the search results
      currentDisplayedProducts = matchingProducts;

      // Reset to the first page for the search results
      currentPage = 1;

      // Render the first page of search results and handle pagination visibility
      renderCurrentPage();

    } catch (error) {
      console.error('Error during search:', error);
      productList.innerHTML = '<p>Error searching for products.</p>';
      updateProductCountDisplay(0, 0);
      renderPaginationControls(); // Render controls (will be disabled/hidden) even on error
    } finally {
        hideLoadingIndicator(); // Hide loading indicator
    }
  }

  // Function to clear inputs and refresh the list
  function clearElements() {
      searchNameInput.value = "";
      searchIdInput.value = "";
      hideProductDetails(); // Ensure modal is hidden when clearing
      // Load all products again and reset pagination
      loadProducts();
  }


  // --- Event Listeners and Initialization ---

  // Event listener for the "Search" button
  searchBtn.addEventListener('click', searchProducts);

  // Event listener for the "Refresh" button
  refreshBtn.addEventListener('click', clearElements);

  // Add event listeners for 'Enter' key press on search inputs
  searchNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      searchProducts();
    }
  });

  searchIdInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      searchProducts();
    }
  });

  // Event listener for the close button on the details modal
  closeDetailsBtn.addEventListener('click', hideProductDetails);

  // Optional: Close modal if clicking outside the modal content
  productDetailsOverlay.addEventListener('click', (event) => {
      // Check if the click target is the overlay itself, not the modal content inside it
      if (event.target === productDetailsOverlay) {
          hideProductDetails();
      }
  });

  // --- Pagination Event Listeners ---
  prevPageBtn.addEventListener('click', () => changePage('prev'));
  nextPageBtn.addEventListener('click', () => changePage('next'));


  // CRUCIAL FIX - Ensure the modal is hidden immediately on script load
  hideProductDetails();

  // Load products when the page loads initially
  loadProducts();
