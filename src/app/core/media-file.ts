const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const AUDIO_EXTENSIONS: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
};
const TYPE_ALIASES: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'audio/x-m4a': 'audio/mp4',
  'audio/m4a': 'audio/mp4',
  'audio/mp4a-latm': 'audio/mp4',
};
const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  webm: 'audio/webm',
};

/** Normalizes browser file types that Storage would otherwise reject. */
export function publicationContentType(kind: 'image' | 'audio', file: File): string | null {
  const allowed = kind === 'image' ? IMAGE_EXTENSIONS : AUDIO_EXTENSIONS;
  const declared = TYPE_ALIASES[file.type] ?? file.type;
  if (allowed[declared]) return declared;
  if (file.type) return null;
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const fromName = EXTENSION_TYPES[extension];
  return fromName && allowed[fromName] ? fromName : null;
}

export function publicationExtension(contentType: string): string | null {
  return IMAGE_EXTENSIONS[contentType] ?? AUDIO_EXTENSIONS[contentType] ?? null;
}
