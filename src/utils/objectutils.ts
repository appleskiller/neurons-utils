import { globalCache } from './cacheutils';
import { isDate, isArray, isEmpty, isDefined, isPlainObject } from './typeutils';
import { isBrowser } from './osutils';

const counter = globalCache('uniqueCounter', {
    count: 0
});
export function uniqueId(prefix: string) {
    counter.count += 1;
    return prefix + '_' + counter.count;
}

/**
 * 合并对象。
 * 深合并两个或更多的对象，并返回一个新的对象。
 * 如果第一个参数为true，则第二个对象的内容将拷贝到第一个对象上。
 * 注意：与jQuery.extend(true)不同的是
 * 1. 不深度合并数组对象
 * 2. 不复制原型链上的属性。
 */
export function merge(...args): any {
    let i,
        len,
        ret = {};
    const doCopy = function (copy, original) {
        if (typeof original !== 'object') {
            return original;
        }
        let value, key;
        if (typeof copy !== 'object') {
            copy = {};
        }

        for (key in original) {
            if (original.hasOwnProperty(key)) {
                value = original[key];
                if (value && typeof value === 'object' && !isDate(value)) {
                    if (!isArray(value)) {
                        // 如果copy[key]值不是object，则直接赋值
                        if (!copy[key] || typeof copy[key] !== 'object' || isDate(copy[key])) {
                            copy[key] = {};
                        }
                        copy[key] = doCopy(copy[key] || {}, value);
                    } else {
                        if (!copy[key] || !isArray(copy[key])) {
                            copy[key] = [];
                        }
                        copy[key] = copy[key] || [];
                        for (let index = 0; index < value.length; index++) {
                            if (value[index] && typeof value[index] === 'object' && !isArray(value[index]) && !isDate(value[index])) {
                                copy[key][index] = doCopy(copy[key][index] || {}, value[index]);
                            } else {
                                copy[key][index] = value[index];
                            }
                        }
                        copy[key].length = value.length;
                    }
                } else {
                    copy[key] = value;
                }
            }
        }
        return copy;
    };
    // 如果第一个参数为true
    if (args[0] === true) {
        ret = args[1];
        args = Array.prototype.slice.call(args, 2);
    }
    len = args.length;
    for (i = 0; i < len; i++) {
        ret = doCopy(ret, args[i]);
    }
    return ret;
}

/**
 * Diffs merge 比较值变更，从source向target复制值。
 * 对于发生变更的叶子属性，将向根逐层执行浅复制
 * @author AK
 * @param target 目标对象
 * @param source 源对象
 * @returns 返回变化信息
 */
export function diffMerge(target, source): any {
    if (typeof source !== 'object' || typeof target !== 'object') {
        return null;
    }
    const sourceIsArray = isArray(source);
    const targetIsArray = isArray(target);
    if ((targetIsArray && !sourceIsArray) || (!targetIsArray && sourceIsArray)) {
        return null;
    }
    const collect = function (token, oldValue, newValue) {
        if (!target && !source) return;
        // token.changes[token.current.join('.')] = {
        //     oldValue: oldValue,
        //     newValue: newValue
        // }
        const last = token.current[token.current.length - 1];
        let obj = token.object;
        for (let i = 0; i < token.current.length - 1; i++) {
            const key = token.current[i];
            if (key in obj) {
                obj = obj[key];
            } else {
                obj = obj[key] = {};
            }
        }
        obj[last] = true;
    }
    const collecting = function (copy, original, token) {
        const oriIsDate = isDate(original);
        const oriIsArray = isArray(original);
        const oriIsObject = isPlainObject(original);
        if (oriIsDate && isDate(copy)) {
            if (copy.getTime() !== original.getTime()) {
                collect(token, copy, original);
            }
        } else if (oriIsArray && isArray(copy)) {
            collectArray(copy, original, token);
        } else if (original && oriIsObject && copy && typeof copy === 'object') {
            collectObject(copy, original, token);
        } else if (copy !== original) {
            collect(token, copy, original);
        }
    }
    const collectArray = function (copy, original, token) {
        for (let i = 0; i < original.length; i++) {
            token.current.push(i);
            collecting(copy[i], original[i], token);
            token.current.pop();
        }
        if (copy.length !== original.length) {
            token.current.push('length');
            collect(token, copy.length, original.length);
            token.current.pop();
        }
    }
    const collectObject = function (copy, original, token) {
        for (let key in original) {
            token.current.push(key);
            collecting(copy[key], original[key], token);
            token.current.pop();
        }
    };
    const token = { changes: {}, current: [], object: {} };
    if (isArray(source)) {
        collectArray(target, source, token);
    } else {
        collectObject(target, source, token);
    }
    // 更新值
    const mergeByMap = function (mapping, currentTarget, currentSource, depth) {
        for (const key in mapping) {
            if (depth === 0) {
                // 只采集1级属性变更
                token.changes[key] = {
                    oldValue: currentTarget[key],
                    newValue: currentSource[key]
                }
            }
            if (mapping[key] === true) {
                currentTarget[key] = currentSource[key];
            } else {
                if (isArray(currentTarget[key])) {
                    currentTarget[key] = [...currentTarget[key]];
                } else {
                    currentTarget[key] = { ...currentTarget[key] };
                }
                mergeByMap(mapping[key], currentTarget[key], currentSource[key], depth + 1);
            }
        }
    }
    mergeByMap(token.object, target, source, 0);
    return token.changes;
}

/**
 * Deeps equal
 * @author AK
 * @param obj1 
 * @param obj2 
 * @returns  
 */
export function deepEqual(obj1, obj2) {
    const type1 = typeof obj1;
    const type2 = typeof obj2;
    if (type1 !== type2) return false;
    if (type1 === 'object') {
        // array
        const isArr1 = isArray(obj1);
        const isArr2 = isArray(obj2)
        if (isArr1 && isArr1) {
            if (obj1.length !== obj2.length) return false;
            for (let i = 0; i < obj1.length; i++) { if (!deepEqual(obj1[i], obj2[i])) return false; }
            return true;
        } else if (isArr1 || isArr2) {
            return false;
        }
        // date
        const isDate1 = obj1 instanceof Date;
        const isDate2 = obj2 instanceof Date;
        if (isDate1 && isDate2) {
            return obj1.getTime() === obj2.getTime();
        } else if (isDate1 || isDate1) {
            return false;
        }
        // null
        if (obj1 === null || obj2 === null) {
            return obj1 === obj2;
        }
        // object
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;
        for (let j = 0; j < keys1.length; j++) {
            if (!(keys1[j] in obj2)) return false;
            if (!deepEqual(obj1[keys1[j]], obj2[keys1[j]])) return false;
        }
        return true;
    } else {
        return obj1 === obj2;
    }
}

declare const msCrypto;

const getRandomValues = (typeof (crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
    (typeof (msCrypto) != 'undefined' && typeof window['msCrypto'].getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

function rng() {
    if (getRandomValues) {
        const rnds8 = new Uint8Array(16);
        getRandomValues(rnds8);
        return rnds8;
    } else {
        const rnds = new Array(16);
        for (let i = 0, r; i < 16; i++) {
            if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
            rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
        }
        return rnds;
    }
}
const byteToHex = [];
for (let byteIndex = 0; byteIndex < 256; ++byteIndex) {
    byteToHex[byteIndex] = (byteIndex + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf) {
    let i = 0;
    const bth = byteToHex;
    return ([bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]]]).join('');
}

// uuid v4
export function uuid() {
    const rnds = rng();
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;
    return bytesToUuid(rnds);
}