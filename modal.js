const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const closeBtn = document.getElementById('closeModal');
const prevBtn = document.getElementById('prevImage');
const nextBtn = document.getElementById('nextImage');
let currentRestaurant;
let currentImageIndex;

function openImageModal(event) {
    const restaurantId = event.target.getAttribute('data-restaurant');
    currentRestaurant = restaurants.find(r => r.uuid === restaurantId || r.id === restaurantId);
    currentImageIndex = 0;
    updateModalImage();
    modal.classList.remove('hidden');
}

function updateModalImage() {
    const images = currentDataSource === 'neotaste' ? currentRestaurant.images : currentRestaurant.photos;
    modalImg.src = images[currentImageIndex] || '/api/placeholder/400/200';
    prevBtn.style.display = currentImageIndex > 0 ? 'block' : 'none';
    nextBtn.style.display = currentImageIndex < images.length - 1 ? 'block' : 'none';
}

closeBtn.addEventListener('click', function() {
    modal.classList.add('hidden');
});

prevBtn.addEventListener('click', function() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        updateModalImage();
    }
});

nextBtn.addEventListener('click', function() {
    const images = currentDataSource === 'neotaste' ? currentRestaurant.images : currentRestaurant.photos;
    if (currentImageIndex < images.length - 1) {
        currentImageIndex++;
        updateModalImage();
    }
});

// Close the modal when clicking outside the image
window.addEventListener('click', function(event) {
    if (event.target == modal) {
        modal.classList.add('hidden');
    }
});