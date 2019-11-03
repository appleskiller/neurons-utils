const funcProto = Function.prototype;
const objectProto = Object.prototype;
const funcToString = funcProto.toString;
const hasOwnProperty = objectProto.hasOwnProperty;
const objectCtorString = funcToString.call(Object);
const objectToString = objectProto.toString;

export function isDefined(obj: any): boolean {
    return obj !== undefined && obj !== null;
}
export function isArray(obj: any): boolean {
    return obj && objectToString.call(obj) === '[object Array]';
}
export function isDate(obj: any): boolean {
    return obj && objectToString.call(obj) === '[object Date]';
}
export function isArrayBuffer(value: any): value is ArrayBuffer {
    return typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer;
}
export function isBlob(value: any): value is Blob {
    return typeof Blob !== 'undefined' && value instanceof Blob;
}
export function isFormData(value: any): value is FormData {
    return typeof FormData !== 'undefined' && value instanceof FormData;
}
function isHostObject(value) {
    var result = false;
    if (value != null && typeof value.toString != 'function') {
        try {
        result = !!(value + '');
        } catch (e) {}
    }
    return result;
}
function overArg(func, transform) {
    return function(arg) {
        return func(transform(arg));
    };
}
var getPrototype = overArg(Object.getPrototypeOf, Object);
export function isPlainObject(value) {
    if (!value || typeof value !== 'object' || objectToString.call(value) != '[object Object]' || isHostObject(value)) {
      return false;
    }
    var proto = getPrototype(value);
    if (proto === null) {
      return true;
    }
    var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
    return (typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
  }
export function isEmpty(obj: any): boolean {
    if (isDefined(obj)) {
        if (isArray(obj)) {
            return !obj.length;
        } else if (typeof obj === 'object') {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    return false;
                }
            }
        }
    }
    return true;
}