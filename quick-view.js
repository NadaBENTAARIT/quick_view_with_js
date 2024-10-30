// Dynamically load Swiper CSS
const swiperCss = document.createElement('link');
swiperCss.rel = 'stylesheet';
swiperCss.href = 'https://unpkg.com/swiper/swiper-bundle.min.css';
document.head.appendChild(swiperCss);
const swiperScript = document.createElement('script');
swiperScript.src = 'https://unpkg.com/swiper/swiper-bundle.min.js';
swiperScript.onload = function() {
  initializeQuickView(); 
};
document.head.appendChild(swiperScript);


const zoomLevels = {};

/**
 * Main initialization function to set up "Quick View" buttons
 * and handle interactions with products on the page.
 */
function initializeQuickView() {
  window.addEventListener("load", () => {
    
    const products = document.querySelectorAll(".product-card");
  
    products.forEach((product) => {
      setupQuickViewButton(product);
    });
  });
}

/**
 * Sets up a "Quick View" button for a given product.
 * @param {Element} product - The product element to which the button is added.
 */
function setupQuickViewButton(product) {

  const quickViewButton = document.createElement("button");
  quickViewButton.className = "quick-view-button";
  quickViewButton.textContent = "Quick View";
  quickViewButton.style.display = "none";
  product.appendChild(quickViewButton);

  product.addEventListener("mouseenter", () => {
    quickViewButton.style.display = "block";
  });

 
  product.addEventListener("mouseleave", () => {
    quickViewButton.style.display = "none";
  });

  quickViewButton.addEventListener("click", async () => {
    const productUrl = product.querySelector("a.link-wrapper").href;

    const images = await fetchProductImages(productUrl);
    createQuickViewPopup(images);
  });
}

/**
 * Fetches images of a given product from its URL.
 * @param {string} productUrl - The URL of the product detail page.
 * @returns {Promise<string[]>} - A promise resolved with a list of image URLs.
 */
async function fetchProductImages(productUrl) {
  try {
    
    const response = await fetch(productUrl);
    if (!response.ok) {
      console.error('Error fetching product page:', response.status, response.statusText);
      return [];
    }

    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    
    const imageElements = doc.querySelectorAll("li.item[data-gallery]");
   
   
    const images = Array.from(imageElements)
      .map((item) => item.getAttribute('data-gallery'))
      .filter((src) => src !== undefined && src !== ''); // Filter out invalid URLs

    return images;
  } catch (error) {
    console.error("Error fetching images: ", error);
    return [];
  }
}

/**
 * Creates and displays a "Quick View" popup with an image carousel.
 * @param {string[]} images - List of image URLs to display.
 */
function createQuickViewPopup(images) {

  const popup = document.createElement("div");
  popup.id = "quick-view-popup";
  popup.innerHTML = `
    <div class="popup-content">
      <button class="close-button">&times;</button>
      <div class="zoom-controls">
        <button id="zoom-in">+</button>
        <button id="zoom-out">-</button>
        <span id="zoom-percentage">100%</span>
      </div>
      <div class="swiper-container main-swiper">
        <div class="swiper-wrapper">
          ${images.map((src, index) => `<div class="swiper-slide"><img src="${src}" alt="Product Image" class="zoomable-image" data-index="${index}" style="transform: scale(1);"></div>`).join('')}
        </div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
      </div>
      <div class="swiper-container thumb-swiper">
        <div class="swiper-wrapper">
          ${images.map((src, index) => `<div class="swiper-slide"><img src="${src}" alt="Product Thumbnail" class="thumbnail-image"></div>`).join('')}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  initializeSwipers(images);

  setupPopupControls();
}

/**
 * Initializes Swiper carousels for main images and thumbnails.
 * @param {string[]} images - List of image URLs to display.
 */
function initializeSwipers(images) {
  const thumbSwiper = new Swiper('.thumb-swiper', {
    spaceBetween: 10,
    slidesPerView: 'auto',
    freeMode: true,
    watchSlidesProgress: true,
    slideToClickedSlide: true,
  });

  const mainSwiper = new Swiper('.main-swiper', {
    spaceBetween: 10,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    thumbs: {
      swiper: thumbSwiper,
    },
    on: {
      slideChange: () => {
        const activeIndex = mainSwiper.activeIndex;
        resetZoom(activeIndex); 
      },
    },
  });

  
  window.mainSwiper = mainSwiper; 
}

/**
 * Updates the zoom percentage display for the active image.
 * @param {number} activeIndex - Index of the currently active image.
 */
function updateZoomDisplay(activeIndex) {
  const currentZoom = zoomLevels[activeIndex] || 1;
  document.getElementById('zoom-percentage').textContent = `${Math.round(currentZoom * 100)}%`;
}

/**
 * Sets up zoom controls and popup close functionality.
 */
function setupPopupControls() {
  document.querySelectorAll('.zoomable-image').forEach((img, index) => {
    zoomLevels[index] = 1; 
  });

  const zoomPercentageDisplay = document.getElementById('zoom-percentage');

  document.getElementById('zoom-in').addEventListener('click', () => {
    const activeIndex = window.mainSwiper.activeIndex; 
    zoomLevels[activeIndex] += 0.1; 
    applyZoom(activeIndex, zoomLevels[activeIndex]);
  });

  document.getElementById('zoom-out').addEventListener('click', () => {
    const activeIndex = window.mainSwiper.activeIndex; 
    if (zoomLevels[activeIndex] > 0.1) {
      zoomLevels[activeIndex] -= 0.1;
      applyZoom(activeIndex, zoomLevels[activeIndex]);
    }
  });

  const closeButton = document.querySelector(".close-button");
  closeButton.addEventListener("click", () => {
  
    document.getElementById("quick-view-popup").remove();
  });

  document.getElementById("quick-view-popup").addEventListener("click", (event) => {
    if (event.target === document.getElementById("quick-view-popup")) {
     
      document.getElementById("quick-view-popup").remove();
    }
  });
}

/**
 * Applies the specified zoom level to the active image.
 * @param {number} index - Index of the active image.
 * @param {number} scale - Zoom level to apply.
 */
function applyZoom(index, scale) {
  const img = document.querySelector(`.zoomable-image[data-index="${index}"]`);
  img.style.transform = `scale(${scale})`;
  updateZoomDisplay(index); 
}

/**
 * Resets the zoom level to default for a newly selected image.
 * @param {number} index - Index of the image being reset.
 */
function resetZoom(index) {
  zoomLevels[index] = 1; 
  applyZoom(index, 1); 
  updateZoomDisplay(index); 
}
