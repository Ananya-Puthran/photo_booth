// DOM Elements
const video = document.getElementById('videoElement');
const captureBtn = document.getElementById('captureBtn');
const countdownOverlay = document.getElementById('countdownOverlay');
const poseSuggestion = document.getElementById('poseSuggestion');
const introModal = document.getElementById('introModal');
const startBtn = document.getElementById('startBtn');
const retakeBtn = document.getElementById('retakeBtn');
const downloadBtn = document.getElementById('downloadBtn');

const photoSlots = [
    document.getElementById('slot-0'),
    document.getElementById('slot-1'),
    document.getElementById('slot-2'),
    document.getElementById('slot-3')
];
const photoStripContainer = document.getElementById('photoStripContainer');
const photoStrip = document.getElementById('photoStrip');
const stripMessage = document.getElementById('stripMessage');

// State
let currentFilter = 'none';
let currentFrameColor = '#ffb6c1';
let isCapturing = false;
let capturedPhotos = []; // Store base64 data URIs
const POSES = [
    "Peace sign! ✌️", "Cute wink! 😉", "Heart pose! 🫶",
    "Cheek poke! 👈", "Blow a kiss! 💋", "Shy pose! 🙈",
    "Big smile! 😁", "Pouty lips! 😗", "Finger heart! 🫰",
    "Thumbs up! 👍", "Cat paws! 🐾",
    "Bunny ears! 🐰", "Surprised gasp! 😯", "Half heart! 💖",
    "Sleepy head! 😴", "Fierce glare! 😼", "V-sign on eye! ✌️👁️",
    "Puffed cheeks! 🐡", "Salute! 🫡"
];
let currentSessionPoses = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    startBtn.addEventListener('click', () => {
        introModal.classList.add('hidden');
        initCamera();
    });

    setupThemeControls();
    setupFilterControls();
    setupFrameControls();
    setupDraggableStickers();
    setupActionButtons();
});

// Webcam access
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 960 },
                facingMode: "user"
            }
        });
        video.srcObject = stream;
    } catch (err) {
        console.error("Error accessing camera: ", err);
        alert("Oops! We need camera access for the photobooth to work. 📸");
    }
}

// Themes
function setupThemeControls() {
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.body.className = `theme-${btn.dataset.theme}`;
        });
    });
}

// Camera Filters
function setupFilterControls() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');

            // Apply to video
            currentFilter = btn.dataset.filter;
            video.className = `filter-${currentFilter}`;

            // Apply to any already captured photos
            photoSlots.forEach(slot => {
                const img = slot.querySelector('img');
                if (img) img.className = `filter-${currentFilter}`;
            });
        });
    });
}

// Frame Colors
function setupFrameControls() {
    const frameBtns = document.querySelectorAll('.frame-btn');
    frameBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            frameBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentFrameColor = btn.dataset.color;
            if (currentFrameColor.startsWith('linear-gradient')) {
                photoStrip.style.background = currentFrameColor;
            } else {
                photoStrip.style.background = currentFrameColor;
            }
        });
    });
}

// Capture Flow
captureBtn.addEventListener('click', async () => {
    if (isCapturing) return;
    isCapturing = true;
    captureBtn.disabled = true;
    retakeBtn.disabled = true;
    downloadBtn.disabled = true;

    // Clear previous
    capturedPhotos = [];
    photoSlots.forEach(slot => slot.innerHTML = '');

    // Shuffle and pick 4 unique poses for this session
    currentSessionPoses = [...POSES].sort(() => 0.5 - Math.random()).slice(0, 4);

    // Capture 4 photos
    for (let i = 0; i < 4; i++) {
        await showPoseSuggestion(i === 0, i);
        await runCountdown();
        const photoDataUrl = captureFrame();
        capturedPhotos.push(photoDataUrl);
        displayPhotoInSlot(photoDataUrl, i);
    }

    isCapturing = false;
    captureBtn.disabled = false;
    retakeBtn.disabled = false;
    downloadBtn.disabled = false;
});

function runCountdown() {
    return new Promise(resolve => {
        countdownOverlay.classList.remove('hidden');
        let count = 3;
        countdownOverlay.textContent = count;

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownOverlay.textContent = count;
                // re-trigger animation hack
                countdownOverlay.style.animation = 'none';
                countdownOverlay.offsetHeight; /* trigger reflow */
                countdownOverlay.style.animation = null;
            } else {
                clearInterval(interval);
                countdownOverlay.classList.add('hidden');
                poseSuggestion.classList.add('hidden');

                // Flash effect
                const captureFlash = document.createElement('div');
                captureFlash.style.position = 'absolute';
                captureFlash.style.inset = '0';
                captureFlash.style.backgroundColor = 'white';
                captureFlash.style.zIndex = '20';
                captureFlash.style.transition = 'opacity 0.2s';
                document.querySelector('.camera-frame').appendChild(captureFlash);

                setTimeout(() => {
                    captureFlash.style.opacity = '0';
                    setTimeout(() => captureFlash.remove(), 200);
                    resolve();
                }, 100);
            }
        }, 1000);
    });
}

function showPoseSuggestion(isFirst, poseIndex) {
    return new Promise(resolve => {
        const selectedPose = currentSessionPoses[poseIndex];
        poseSuggestion.textContent = isFirst ? `First pose: ${selectedPose}` : `Next pose: ${selectedPose}`;
        poseSuggestion.classList.remove('hidden');

        // Give 2 seconds to read the pose before starting countdown
        setTimeout(() => {
            resolve();
        }, 2000);
    });
}

function captureFrame() {
    const canvas = document.createElement('canvas');

    // We want the final image to be exactly 4:3 to match our CSS slots
    // So we calculate the optimal 4:3 crop from whatever the video's actual dimensions are
    const videoRatio = video.videoWidth / video.videoHeight;
    const targetRatio = 4 / 3;

    let sourceWidth = video.videoWidth;
    let sourceHeight = video.videoHeight;
    let sourceX = 0;
    let sourceY = 0;

    if (videoRatio > targetRatio) {
        // Video is wider than 4:3 (e.g. 16:9 on some phones/webcams)
        sourceWidth = sourceHeight * targetRatio;
        sourceX = (video.videoWidth - sourceWidth) / 2;
    } else if (videoRatio < targetRatio) {
        // Video is taller than 4:3 (e.g. portrait mode on phones)
        sourceHeight = sourceWidth / targetRatio;
        sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    // Set canvas to the actual cropped dimensions we want to save
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext('2d');

    // Mirror the canvas to match preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Draw only the cropped portion of the video onto the exact canvas size
    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png', 1.0);
}

function displayPhotoInSlot(dataUrl, index) {
    const img = document.createElement('img');
    img.src = dataUrl;
    img.className = `filter-${currentFilter}`;
    // Undo the CSS mirror since we already mirrored in canvas
    img.style.transform = 'scaleX(1)';
    photoSlots[index].appendChild(img);
}

// Drag & Drop Stickers (Mobile Compatible via Pointer Events)
function setupDraggableStickers() {
    const stickers = document.querySelectorAll('.draggable-sticker');

    stickers.forEach(sticker => {
        sticker.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            // Create a ghost image to drag
            const ghost = document.createElement('img');
            ghost.src = sticker.src;
            ghost.style.position = 'fixed';
            ghost.style.width = '60px';
            ghost.style.height = '60px';
            ghost.style.zIndex = '1000';
            ghost.style.pointerEvents = 'none'; // so we can find element below it
            ghost.style.transform = 'translate(-50%, -50%)';
            ghost.style.left = `${e.clientX}px`;
            ghost.style.top = `${e.clientY}px`;
            document.body.appendChild(ghost);

            sticker.style.opacity = '0.5';

            const moveHandler = (moveEvent) => {
                ghost.style.left = `${moveEvent.clientX}px`;
                ghost.style.top = `${moveEvent.clientY}px`;
            };

            const upHandler = (upEvent) => {
                document.removeEventListener('pointermove', moveHandler);
                document.removeEventListener('pointerup', upHandler);
                document.removeEventListener('pointercancel', upHandler);

                sticker.style.opacity = '1';
                ghost.remove();

                // Find element under the pointer
                const dropTarget = document.elementFromPoint(upEvent.clientX, upEvent.clientY);

                // If it's inside the photo strip container, add it!
                if (dropTarget && (dropTarget === photoStrip || photoStrip.contains(dropTarget))) {
                    addStickerToStrip(sticker.src, upEvent.clientX, upEvent.clientY);
                }
            };

            document.addEventListener('pointermove', moveHandler);
            document.addEventListener('pointerup', upHandler);
            document.addEventListener('pointercancel', upHandler);
        });
    });
}

function addStickerToStrip(src, clientX, clientY) {
    const stickerDiv = document.createElement('div');
    stickerDiv.className = 'placed-sticker';

    // Calculate relative position to photoStrip
    const rect = photoStrip.getBoundingClientRect();
    const x = clientX - rect.left - 25; // center the 50x50 element
    const y = clientY - rect.top - 25;

    stickerDiv.style.left = `${x}px`;
    stickerDiv.style.top = `${y}px`;

    const img = document.createElement('img');
    img.src = src;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.pointerEvents = 'none'; // so we drag the div

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-sticker-btn';
    deleteBtn.innerHTML = '×';

    // Use pointerdown for instant delete on mobile without waiting for click
    deleteBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        stickerDiv.remove();
    });

    // Touch support for resizing/rotating (simple double tap to rotate, long press to remove could be added)
    // For now we will just use a simple scale loop button or wheel
    stickerDiv.dataset.rot = 0;
    stickerDiv.dataset.scale = 1;

    stickerDiv.appendChild(img);
    stickerDiv.appendChild(deleteBtn);
    photoStrip.appendChild(stickerDiv);

    makeStickerInteractive(stickerDiv);
}

// Mobile-friendly drag logic for placed stickers
function makeStickerInteractive(stickerDiv) {
    let isDragging = false;
    let startX, startY;

    stickerDiv.addEventListener('pointerdown', (e) => {
        if (e.target.classList.contains('delete-sticker-btn')) return;
        isDragging = true;
        startX = e.clientX - stickerDiv.offsetLeft;
        startY = e.clientY - stickerDiv.offsetTop;
        stickerDiv.classList.add('selected');
        e.preventDefault();

        // Capture pointer so we don't lose drag if moving fast outside div
        stickerDiv.setPointerCapture(e.pointerId);
    });

    stickerDiv.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        let nx = e.clientX - startX;
        let ny = e.clientY - startY;

        // Keep within bounds roughly
        nx = Math.max(-25, Math.min(nx, photoStrip.offsetWidth - 25));
        ny = Math.max(-25, Math.min(ny, photoStrip.offsetHeight - 25));

        stickerDiv.style.left = `${nx}px`;
        stickerDiv.style.top = `${ny}px`;
    });

    const upHandler = (e) => {
        isDragging = false;
        stickerDiv.classList.remove('selected');
        if (stickerDiv.hasPointerCapture(e.pointerId)) {
            stickerDiv.releasePointerCapture(e.pointerId);
        }
    };

    stickerDiv.addEventListener('pointerup', upHandler);
    stickerDiv.addEventListener('pointercancel', upHandler);

    // Simple scroll wheel to resize or rotate. On mobile, we might need a pinch gesture or dedicated buttons.
    // We will leave wheel for desktop. 
    stickerDiv.addEventListener('wheel', (e) => {
        e.preventDefault();
        let rot = parseFloat(stickerDiv.dataset.rot) || 0;
        let scale = parseFloat(stickerDiv.dataset.scale) || 1;

        if (e.shiftKey) {
            rot += e.deltaY > 0 ? 10 : -10;
        } else {
            scale += e.deltaY > 0 ? -0.1 : 0.1;
            scale = Math.max(0.5, Math.min(scale, 2.5));
        }

        stickerDiv.dataset.rot = rot;
        stickerDiv.dataset.scale = scale;
        stickerDiv.style.transform = `rotate(${rot}deg) scale(${scale})`;
    });
}

// Action Buttons
function setupActionButtons() {
    retakeBtn.addEventListener('click', () => {
        capturedPhotos = [];
        photoSlots.forEach(slot => slot.innerHTML = '');
        // Remove all placed stickers
        document.querySelectorAll('.placed-sticker').forEach(s => s.remove());
        stripMessage.value = '';

        retakeBtn.disabled = true;
        downloadBtn.disabled = true;
    });

    downloadBtn.addEventListener('click', generateFinalImage);
}

// Canvas Generation
async function generateFinalImage() {
    if (capturedPhotos.length !== 4) return;

    const canvas = document.getElementById('exportCanvas');
    const ctx = canvas.getContext('2d');

    // Scale up for better quality
    const scale = 3;
    const stripRect = photoStrip.getBoundingClientRect();

    canvas.width = stripRect.width * scale;
    canvas.height = stripRect.height * scale;

    // Fill Background
    if (currentFrameColor.startsWith('linear-gradient')) {
        const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grd.addColorStop(0, '#ffb6c1');
        grd.addColorStop(0.5, '#e6e6fa');
        grd.addColorStop(1, '#98ff98');
        ctx.fillStyle = grd;
    } else {
        ctx.fillStyle = currentFrameColor;
    }

    // Need rounded corners? Simplest is to just draw rect, or draw rounded rect path
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 12 * scale);
    ctx.fillStyle = ctx.fillStyle;
    ctx.fill();
    ctx.clip(); // clip contents to rounded corners

    // Draw Slots & Photos
    const computedStyle = window.getComputedStyle(photoStrip);
    const paddingTop = parseFloat(computedStyle.paddingTop) || 10;
    const gap = parseFloat(computedStyle.gap) || 8;

    let currentY = paddingTop * scale;
    const paddingX = parseFloat(computedStyle.paddingLeft) || 10;
    const paddingXScaled = paddingX * scale;
    const slotWidth = canvas.width - (paddingXScaled * 2);
    // Since slot ratio is 4/3
    const slotHeight = slotWidth * (3 / 4);

    // Filter simulation maps
    const filterMaps = {
        'none': '',
        'digicam': 'contrast(110%) saturate(120%) sepia(20%) hue-rotate(-10deg)',
        'vintage': 'sepia(60%) contrast(120%) brightness(90%)',
        'grayscale': 'grayscale(100%) contrast(120%)',
        'sepia': 'sepia(100%)',
        'softpink': 'sepia(30%) saturate(150%) hue-rotate(300deg) brightness(110%)',
        'kawaii': 'brightness(110%) saturate(140%) contrast(105%)',
        'warmfilm': 'sepia(40%) contrast(110%) brightness(110%) saturate(130%) hue-rotate(-15deg)',
        'cooltone': 'contrast(110%) brightness(105%) saturate(110%) hue-rotate(15deg) sepia(10%)',
        'faded': 'contrast(85%) brightness(115%) saturate(80%) sepia(20%)',
        'highcontrast': 'contrast(130%) saturate(120%) brightness(95%)',
        'blur': 'blur(3px) contrast(110%) brightness(105%)'
    };

    for (let i = 0; i < 4; i++) {
        // Draw white slot background
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.roundRect(paddingXScaled, currentY, slotWidth, slotHeight, 8 * scale);
        ctx.fill();

        // Draw image
        const img = new Image();
        img.src = capturedPhotos[i];
        await new Promise(r => img.onload = r);

        ctx.save();
        ctx.filter = filterMaps[currentFilter] || '';
        // Note: we already un-mirrored it in captureFrame, so here it draws correctly

        // Clip to rounded slot
        ctx.beginPath();
        ctx.roundRect(paddingXScaled, currentY, slotWidth, slotHeight, 8 * scale);
        ctx.clip();

        ctx.drawImage(img, paddingXScaled, currentY, slotWidth, slotHeight);
        ctx.restore();

        currentY += slotHeight + (gap * scale);
    }

    // Draw Text
    if (stripMessage.value) {
        ctx.font = `500 ${14 * scale}px 'Outfit'`;
        ctx.fillStyle = "#333333";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textY = currentY + ((canvas.height - currentY) / 2);
        ctx.fillText(stripMessage.value, canvas.width / 2, textY);
    }

    // Draw Stickers
    const stickers = document.querySelectorAll('.placed-sticker');
    for (const sticker of stickers) {
        const sImg = sticker.querySelector('img');
        const img = new Image();
        img.src = sImg.src;
        await new Promise(r => img.onload = r);

        const left = parseFloat(sticker.style.left);
        const top = parseFloat(sticker.style.top);

        // Adjust center for transforms
        const cx = (left + 25) * scale;
        const cy = (top + 25) * scale;

        const rot = parseFloat(sticker.dataset.rot || 0);
        const s_scale = parseFloat(sticker.dataset.scale || 1);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot * Math.PI / 180);
        ctx.scale(s_scale, s_scale);

        // draw centered
        ctx.drawImage(img, -25 * scale, -25 * scale, 50 * scale, 50 * scale);
        ctx.restore();
    }

    // Trigger download
    const link = document.createElement('a');
    link.download = `kawaii-photobooth-${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
