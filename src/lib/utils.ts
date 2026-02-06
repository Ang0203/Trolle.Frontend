import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MODERN_GRADIENTS = [
  "bg-gradient-to-br from-[#00c6ff] to-[#0072ff]", // Electric Blue
  "bg-gradient-to-br from-[#f093fb] to-[#f5576c]", // Pinkish sunset
  "bg-gradient-to-br from-[#5ee7df] to-[#b490ca]", // Soft purple-teal
  "bg-gradient-to-br from-[#c3cfe2] to-[#c3cfe2]", // Soft gray (actually let's make it better)
  "bg-gradient-to-br from-[#6a11cb] to-[#2575fc]", // Deep blue-purple
  "bg-gradient-to-br from-[#ff9a9e] to-[#fecfef]", // Soft pink
  "bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb]", // Lavender
  "bg-gradient-to-br from-[#84fab0] to-[#8fd3f4]", // Mint-sky
  "bg-gradient-to-br from-[#fa709a] to-[#fee140]", // Warm sunset
  "bg-gradient-to-br from-[#4facfe] to-[#00f2fe]", // Bright blue
];

export function getRandomModernGradient() {
  return MODERN_GRADIENTS[Math.floor(Math.random() * MODERN_GRADIENTS.length)];
}

export function getRandomDarkColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 40 + Math.floor(Math.random() * 30); // 40-70% saturation
  const l = 30 + Math.floor(Math.random() * 20); // 30-50% lightness (dark but not black)
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function getLighterColor(color: string, amount: number = 0.8) {
  // If it's already HSL, we can manipulate it easily
  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const [, h, s, l] = match;
      const newL = Math.min(95, parseInt(l) + (100 - parseInt(l)) * amount);
      return `hsl(${h}, ${s}%, ${newL}%)`;
    }
  }

  // Fallback for HEX
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);

  return `rgb(${lr}, ${lg}, ${lb})`;
}

export function getBoardGradient(id: string) {
  // Deterministic gradients based on ID char code sum
  // Simple hash
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % MODERN_GRADIENTS.length;
  return MODERN_GRADIENTS[index];
}

// Predefined Unsplash images (static for now for robustness)
export const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=600&auto=format&fit=crop", // desert
  "https://images.unsplash.com/photo-1682685797507-d44d838b0ac7?q=80&w=600&auto=format&fit=crop", // canyon
  "https://images.unsplash.com/photo-1705507028308-54b9df638361?q=80&w=600&auto=format&fit=crop", // mountains
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=600&auto=format&fit=crop", // nature
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=600&auto=format&fit=crop", // hills
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop", // waterfall
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=600&auto=format&fit=crop", // forest
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600&auto=format&fit=crop", // lake
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=600&auto=format&fit=crop", // autumn
];

export function getRandomUnsplashImage() {
  return UNSPLASH_IMAGES[Math.floor(Math.random() * UNSPLASH_IMAGES.length)];
}

/**
 * Custom SignalR logger to suppress noisy "stopped during negotiation" errors
 * which frequently occur during React Strict Mode or fast navigation.
 */
export const signalRLogger = {
  log(logLevel: number, message: string) {
    if (message.includes("The connection was stopped during negotiation")) {
      return;
    }
    // SignalR LogLevel enum: Trace=0, Debug=1, Information=2, Warning=3, Error=4, Critical=5, None=6
    if (logLevel >= 4) { // Error or Critical
      console.error(`[SignalR] ${message}`);
    } else if (logLevel === 3) { // Warning
      console.warn(`[SignalR] ${message}`);
    } else if (logLevel === 2) { // Information
      console.info(`[SignalR] ${message}`);
    } else {
      // Trace/Debug - only if needed, usually quiet
      // console.log(`[SignalR] ${message}`);
    }
  },
};
