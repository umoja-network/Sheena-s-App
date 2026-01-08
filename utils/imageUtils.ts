
import { GeoLocationData } from '../types';

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Calculates tile coordinates for Esri World Imagery (Satellite)
 */
const getTileUrl = (lat: number, lon: number, zoom: number) => {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      n
  );
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
};

export const drawTaggedImage = async (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  data: GeoLocationData
): Promise<string> => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not found');

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  // Draw background image
  ctx.drawImage(image, 0, 0);

  const scale = canvas.width / 1000;
  const padding = 20 * scale;
  const cornerRadius = 15 * scale;
  const smallGap = 2 * scale;
  const overlayOpacity = 'rgba(0, 0, 0, 0.45)';

  // Dimensions
  const brandingHeight = 48 * scale;
  const brandingWidth = 375 * scale;
  const infoHeight = 215 * scale;
  const mapSize = infoHeight;
  const infoWidth = canvas.width - (padding * 2) - mapSize - smallGap;

  // Layout math
  const infoY = canvas.height - infoHeight - padding;
  const brandingY = infoY - brandingHeight - smallGap;
  const mapY = infoY;

  const infoX = padding;
  const brandingX = padding;
  const mapX = canvas.width - padding - mapSize;

  // 1. BRANDING CONTAINER
  ctx.fillStyle = overlayOpacity;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(brandingX, brandingY, brandingWidth, brandingHeight, 10 * scale);
  } else {
    ctx.fillRect(brandingX, brandingY, brandingWidth, brandingHeight);
  }
  ctx.fill();

  // Branding Icon - Load from user provided URL
  try {
    const iconSize = 30 * scale;
    // Attempting to load the icon from the provided domain. 
    // Usually these are at icon.png or logo.png. Using a placeholder path based on common structure.
    const brandingIcon = await loadImage('https://thabisot33.github.io/maps/icon.png');
    ctx.drawImage(brandingIcon, brandingX + 10 * scale, brandingY + (brandingHeight - iconSize) / 2, iconSize, iconSize);
  } catch (e) {
    // Fallback to stylized blue camera icon if external image fails
    const iconSize = 28 * scale;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(brandingX + 12 * scale, brandingY + (brandingHeight - iconSize) / 2, iconSize, iconSize, 7 * scale);
    } else {
      ctx.fillRect(brandingX + 12 * scale, brandingY + (brandingHeight - iconSize) / 2, iconSize, iconSize);
    }
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(brandingX + 12 * scale + iconSize / 2, brandingY + brandingHeight / 2, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Branding Text
  ctx.font = `bold ${20 * scale}px Inter, sans-serif`;
  ctx.fillStyle = 'white';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('Tagofy - Geotag Map Camera', brandingX + 48 * scale, brandingY + brandingHeight / 2);

  // 2. INFORMATION CONTAINER
  ctx.fillStyle = overlayOpacity;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(infoX, infoY, infoWidth, infoHeight, cornerRadius);
  } else {
    ctx.fillRect(infoX, infoY, infoWidth, infoHeight);
  }
  ctx.fill();

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const textX = infoX + 22 * scale;

  // Header - Exact White Text
  ctx.font = `bold ${40 * scale}px Inter, sans-serif`;
  ctx.fillStyle = '#ffffff'; 
  ctx.fillText(`Lenasia, Gauteng, South Afri...`, textX, infoY + 22 * scale);

  // Metadata Lines
  ctx.font = `${24 * scale}px Inter, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.address, textX, infoY + 75 * scale);
  ctx.fillText(`Lat: ${data.latitude.toFixed(6)}, Long: ${data.longitude.toFixed(6)}`, textX, infoY + 115 * scale);
  ctx.fillText(`${data.timestamp} ${data.timezone}`, textX, infoY + 155 * scale);

  // 3. MAPS CONTAINER (Satellite)
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(mapX, mapY, mapSize, mapSize, cornerRadius);
  } else {
    ctx.rect(mapX, mapY, mapSize, mapSize);
  }
  ctx.clip();

  // Load satellite tile
  try {
    const tileUrl = getTileUrl(data.latitude, data.longitude, 18); // Zoom 18 for clear satellite
    const tileImg = await loadImage(tileUrl);
    ctx.drawImage(tileImg, mapX, mapY, mapSize, mapSize);
    
    // Slight darkening for better overlay contrast
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
  } catch (e) {
    ctx.fillStyle = '#1c2e0b'; 
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
  }

  // Map Pin
  const pinX = mapX + mapSize / 2;
  const pinY = mapY + mapSize / 2;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(pinX, pinY, 9 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2.5 * scale;
  ctx.stroke();

  // Pin stalk
  ctx.beginPath();
  ctx.moveTo(pinX - 3 * scale, pinY + 6 * scale);
  ctx.lineTo(pinX, pinY + 18 * scale);
  ctx.lineTo(pinX + 3 * scale, pinY + 6 * scale);
  ctx.fillStyle = '#ef4444';
  ctx.fill();

  // Apple Maps Style Attribution
  ctx.font = `bold ${14 * scale}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText('Maps', mapX + 34 * scale, mapY + mapSize - 32 * scale);
  
  ctx.beginPath();
  ctx.arc(mapX + 24 * scale, mapY + mapSize - 27 * scale, 4 * scale, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.95);
};
