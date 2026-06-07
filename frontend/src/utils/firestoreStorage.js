/**
 * Client-side image compression → base64 data URL.
 * Stored directly in the Firestore incident document — no external storage needed.
 *
 * Target: ≤ 800 px on longest side, JPEG 78% quality → typically 30–90 KB
 * as a base64 string (~50–120 KB), well within Firestore's 1 MB document limit.
 */

const MAX_SIDE = 800;
const JPEG_QUALITY = 0.78;
const FALLBACK_QUALITY = 0.55;
const SIZE_LIMIT = 900_000; // chars ≈ bytes for ASCII base64

export async function uploadPollutionImage(file) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width: w, height: h } = img;
      if (w > MAX_SIDE || h > MAX_SIDE) {
        if (w >= h) { h = Math.round((h * MAX_SIDE) / w); w = MAX_SIDE; }
        else         { w = Math.round((w * MAX_SIDE) / h); h = MAX_SIDE; }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      // If still large, re-compress at lower quality to stay within Firestore limit
      resolve(dataUrl.length > SIZE_LIMIT
        ? canvas.toDataURL('image/jpeg', FALLBACK_QUALITY)
        : dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image for compression'));
    };

    img.src = objectUrl;
  });
}
