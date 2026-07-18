/**
 * Taxonomía de 2 niveles:
 *  - Nivel 1: categoría fija (Gadgets, Belleza, …) asignada por reglas de keywords.
 *  - Nivel 2: entidad canónica (ej. "Mini impresora portátil") que agrupa variantes.
 */

export const CATEGORIES = [
  'Gadgets',
  'Belleza',
  'Fitness',
  'Mascotas',
  'Cocina',
  'Hogar',
  'Tecnología',
  'Moda',
  'Automotor',
  'Salud y bienestar',
  'General',
] as const;

export type Category = (typeof CATEGORIES)[number];

// Keywords bilingües (ya normalizadas: minúsculas, sin acentos, singular).
const CATEGORY_KEYWORDS: Record<Exclude<Category, 'General'>, string[]> = {
  Gadgets: [
    'gadget', 'impresora', 'printer', 'led', 'proyector', 'projector',
    'drone', 'dron', 'lampara', 'lamp', 'reloj', 'watch', 'tracker',
    'organizador', 'organizer', 'mini', 'portatil', 'portable', 'wireless',
    'inalambrico', 'magnetico', 'magnetic', 'usb', 'cargador', 'charger',
  ],
  Belleza: [
    'belleza', 'beauty', 'skincare', 'serum', 'maquillaje', 'makeup',
    'crema', 'cream', 'facial', 'pelo', 'hair', 'una', 'nail', 'labial',
    'lipstick', 'mascarilla', 'mask', 'rizador', 'curler',
  ],
  Fitness: [
    'fitness', 'gym', 'ejercicio', 'exercise', 'yoga', 'pesa', 'dumbbell',
    'banda', 'resistance', 'proteina', 'protein', 'entrenamiento', 'workout',
    'correr', 'running', 'bicicleta', 'bike', 'postura', 'posture',
  ],
  Mascotas: [
    'mascota', 'pet', 'perro', 'dog', 'gato', 'cat', 'fuente', 'fountain',
    'collar', 'leash', 'juguete', 'toy', 'arena', 'litter', 'comedero', 'feeder',
  ],
  Cocina: [
    'cocina', 'kitchen', 'freidora', 'fryer', 'licuadora', 'blender',
    'cafetera', 'coffee', 'sarten', 'pan', 'olla', 'pot', 'cuchillo', 'knife',
    'recipiente', 'container', 'botella', 'bottle', 'termo', 'thermal',
  ],
  Hogar: [
    'hogar', 'home', 'casa', 'house', 'mueble', 'furniture', 'decoracion',
    'decor', 'limpieza', 'cleaning', 'aspiradora', 'vacuum', 'almohada',
    'pillow', 'manta', 'blanket', 'cortina', 'curtain', 'difusor', 'diffuser',
  ],
  Tecnología: [
    'tecnologia', 'tech', 'auricular', 'earbud', 'headphone', 'teclado',
    'keyboard', 'mouse', 'monitor', 'camara', 'camera', 'smartphone',
    'tablet', 'laptop', 'ssd', 'router', 'altavoz', 'speaker', 'microfono',
    'microphone', 'smartwatch',
  ],
  Moda: [
    'moda', 'fashion', 'ropa', 'clothing', 'zapatilla', 'sneaker', 'zapato',
    'shoe', 'bolso', 'bag', 'mochila', 'backpack', 'gafa', 'sunglasses',
    'joyeria', 'jewelry', 'anillo', 'ring', 'camiseta', 'shirt',
  ],
  Automotor: [
    'auto', 'car', 'coche', 'vehiculo', 'vehicle', 'moto', 'motorcycle',
    'neumatico', 'tire', 'volante', 'steering', 'dashcam', 'soporte', 'mount',
  ],
  'Salud y bienestar': [
    'salud', 'health', 'bienestar', 'wellness', 'masajeador', 'massager',
    'sueno', 'sleep', 'meditacion', 'meditation', 'vitamina', 'vitamin',
    'suplemento', 'supplement', 'terapia', 'therapy', 'dolor', 'pain',
    'cuello', 'neck', 'espalda', 'back',
  ],
};

/**
 * Asigna categoría por cantidad de keywords que matchean los tokens
 * normalizados del nombre. Empates: gana la primera en orden de definición.
 */
export function categorize(normalizedTokens: string[]): Category {
  let best: Category = 'General';
  let bestHits = 0;
  const tokenSet = new Set(normalizedTokens);

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let hits = 0;
    for (const kw of keywords) if (tokenSet.has(kw)) hits++;
    if (hits > bestHits) {
      bestHits = hits;
      best = category as Category;
    }
  }
  return best;
}
