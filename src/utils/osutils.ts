
export const isBrowser: boolean = typeof window !== 'undefined' && typeof window.document !== 'undefined';
export const isDomLevel2: boolean = isBrowser && !!window.addEventListener;