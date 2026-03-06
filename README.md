# 📸 Aesthetic Kawaii Photobooth Web App
🌐 **Live Demo:** https://ananya-puthran.github.io/photo_booth/  <br><br>
A cute and aesthetic **web-based photobooth** that captures photos automatically, applies **filters**, features **dynamic layouts**, allows **stickers and frame customization**, and generates a **downloadable photo strip** — just like Korean photobooths.

Designed with a **girlish pastel UI** (pink themed) and built using **HTML, CSS, and JavaScript with the browser camera & audio APIs**.

---

## ✨ Features

* 📷 **Webcam Photo Capture**
  * Uses laptop/mobile webcam via the **getUserMedia API**

* 📐 **Dynamic Frame Layouts**
  * Choose between **3 Photos** (Vertical)
  * Choose **4 Photos** (Vertical strip - default)
  * Choose **6 Photos** (2x3 Grid layout)

* ⏳ **Automatic Photo Capture & Audio**
  * Takes photos automatically with a gap between each shot
  * Displays **3…2…1 countdown** before each capture
  * Plays **procedurally generated Beep & Shutter sound effects** via the Web Audio API

* ✌️ **Pose Suggestions & Captions**
  * Suggests cute poses (e.g. "Peace sign!", "Flower cup face!", "Double peace!")
  * Option to **overlay your pose instructions** directly onto your final photo strip

* 🎨 **Beautiful Color Filters**
  * Normal, Digicam, Vintage, Grayscale, Sepia, Soft Pink, Kawaii, Warm Film, Cool Tone, Faded, High Contrast, Soft Blur

* 💖 **Cute Stickers**
  * Drag and drop stickers onto your photo strip
  * Resize and rotate
  * Remove stickers

* 🖼 **Customizable Frames**
  * Change photo strip frame colors
  * Pastel themes like Pink, Lavender, Mint, Cream, and a beautiful Gradient

* ✏ **Custom Caption**
  * Add a **short text message** at the bottom of the photo strip

* ⬇ **Download Final Photo Strip**
  * Generates a high-quality photobooth snapshot
  * Download as **PNG image**

* 🎀 **Aesthetic UI**
  * Soft pastel themes (Pink, Lavender, Mint, Peach)
  * Rounded buttons
  * Cute UI animations
  * Mobile responsive

---

## 🖼 How It Works

1. Open the website.
2. Allow **camera access** and turn your **volume to MAX**.
3. Choose your **Frame Layout** (3, 4, or 6 photos) from the popup.
4. Choose a **filter** and toggle **pose instructions** if desired.
5. Click **📸 Start Capture**.
6. The system will:
   * Show a **3-2-1 countdown** with sound effects
   * Take photos automatically while suggesting poses
7. Add **stickers, frame color, and caption**.
8. Click **📥 Download (PNG)** to save your photobooth strip.

---

## 🛠 Tech Stack

* **HTML5**
* **CSS3**
* **Vanilla JavaScript**
* **WebRTC getUserMedia API** (camera access)
* **Web Audio API** (sound effects)
* **Canvas API** (image processing and final strip generation)
