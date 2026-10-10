import {svgToDataUrl} from './SvgBuilder';

/**
 * Render an SVG string to a `size` x `size` PNG via an offscreen canvas. Browser only.
 *
 * Callers should pass an SVG built with `{size}` equal to the target size, so the image has matching
 * intrinsic dimensions (required by some browsers to draw SVGs to canvas).
 */
export async function rasterizePngAsync(svg: string, size: number): Promise<Blob> {
    const img = new window.Image(size, size);
    img.src = svgToDataUrl(svg);
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, size, size);

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error(`Failed to rasterize favicon at ${size}px.`));
            }
        }, 'image/png');
    });
}
