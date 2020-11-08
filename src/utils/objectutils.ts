import { isBrowser } from './osutils';
import { isDate, isArray, isEmpty, isDefined, isPlainObject } from './typeutils';
import { globalCache } from './cacheutils';

const counter = globalCache('uniqueCounter', {
    count: 0
});
export function uniqueId(prefix: string) {
    counter.count += 1;
    return prefix + '_' + counter.count;
}

function isElementNode(value) {
    return Node !== undefined && value instanceof Node;
}

/**
 * 合并对象。
 * 深合并两个或更多的对象，并返回一个新的对象。
 * 如果第一个参数为true，则第二个对象的内容将拷贝到第一个对象上。
 * 注意：
 * 1. 不深度合并数组对象
 * 2. 不复制原型链上的属性。
 * 3. 不复制HTML元素
 * 4. 深合并时，对于目标对象尚不存在属性值的情况，将创建新的对象进行merge
 */
export function merge(...args): any {
    let i,
        len,
        ret = {};
    const doCopy = function (copy, original) {
        if (!original || typeof original !== 'object' || isDate(original) || isElementNode(original)) {
            return original;
        }
        let value, key;
        if (typeof copy !== 'object') {
            copy = {};
        }

        for (key in original) {
            if (original.hasOwnProperty(key)) {
                value = original[key];
                if (value && typeof value === 'object' && !isDate(value) && !isElementNode(value)) {
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

// ----------------------------------------------------
// copy target from source by mapping
// ====================================================

export const INVALID_PROPERTY_ACCESS = '__INVALID_PROPERTY_ACCESS__';

export interface IObjectAccessor {
    get(propertyChain: string, defaultValue?: any): any;
    union(props: string[]): any[];
    set(propertyChain: string, value: any): void;
    sub(propertyChain: string): SubObjectAccessor;
    copyFrom(sourceAccessor: ObjectAccessor, mappings?: IConverterOption);
}


export class SubObjectAccessor implements IObjectAccessor {
    constructor(public hostProperty: string, public host: ObjectAccessor) { }
    get(propertyChain: string, defaultValue?: any): any {
        if (arguments.length > 1) {
            return this.host.get(`${this.hostProperty}.${propertyChain}`, defaultValue);
        } else {
            return this.host.get(`${this.hostProperty}.${propertyChain}`);
        }
    }
    union(props: string[]): any[] {
        return this.host.union(props.map((p) => `${this.hostProperty}.${p}`));
    }
    set(propertyChain: string, value: any): void {
        return this.host.set(`${this.hostProperty}.${propertyChain}`, value);
    }
    sub(propertyChain: string): SubObjectAccessor {
        return new SubObjectAccessor(`${this.hostProperty}.${propertyChain}`, this.host);
    }
    copyFrom(sourceAccessor: IObjectAccessor, mappings?: IConverterOption) {
        if (!sourceAccessor) {
            return;
        }
        if (!mappings) {
            this.host.copyFrom(sourceAccessor);
        } else {
            const fullMappings = normalizeMappings(mappings);
            obtainSourceValue(sourceAccessor, fullMappings);
            applyTargetValue(sourceAccessor, this, fullMappings);
        }
    }
}

export class ObjectAccessor implements IObjectAccessor {
    constructor(public object) { }
    private _history = {};
    static INVALID_PROPERTY_ACCESS = INVALID_PROPERTY_ACCESS;
    static get(object, pointer) {
        const accessor = new ObjectAccessor(object);
        return accessor.get(pointer);
    }
    static set(object, pointer, value) {
        const accessor = new ObjectAccessor(object);
        accessor.set(pointer, value);
    }
    get(propertyChain: string, defaultValue?: any): any {
        if (!propertyChain) {
            return this.object;
        }
        if (this._history[propertyChain]) {
            return this._history[propertyChain];
        }
        const splited = this._splitChainProp(propertyChain);
        const prop = splited[1];
        if (!prop) {
            return INVALID_PROPERTY_ACCESS;
        }
        let previous;
        if (arguments.length > 1) {
            previous = this._getOrCreate(splited[0]);
            if (previous && previous !== INVALID_PROPERTY_ACCESS) {
                if (!(prop in previous)) {
                    previous[prop] = defaultValue;
                }
                this._history[propertyChain] = previous[prop];
                return previous[prop];
            }
        } else {
            previous = this.get(splited[0]);
            if (previous && (typeof previous === 'object') && (prop in previous)) {
                this._history[propertyChain] = previous[prop];
                return previous[prop];
            }
        }
        return INVALID_PROPERTY_ACCESS;
    }
    union(props: string[]): any[] {
        if (!props) {
            return null;
        }
        return props.map((prop) => this.get(prop));
    }
    set(propertyChain: string, value: any): void {
        if (propertyChain) {
            const splited = this._splitChainProp(propertyChain);
            const obj = this._getOrCreate(splited[0]);
            if (obj && obj !== INVALID_PROPERTY_ACCESS) {
                try {
                    obj[splited[1]] = value;
                    this._history[propertyChain] = value;
                } catch (err) { }
            }
        }
    }
    sub(propertyChain: string): SubObjectAccessor {
        return new SubObjectAccessor(propertyChain, this);
    }
    /**
     * 按指定mappings深复制属性值。如果不设置mapping则深复制对象
     * @param sourceAccessor 源存取器
     * @param mappings 属性映射表
     */
    copyFrom(sourceAccessor: IObjectAccessor, mappings?: IConverterOption) {
        if (!sourceAccessor) {
            return;
        }
        const sourceObject = sourceAccessor instanceof ObjectAccessor ? (sourceAccessor as ObjectAccessor).object : (sourceAccessor as SubObjectAccessor).host.object;
        if (!sourceObject) {
            return;
        }
        if (!mappings) {
            this.object = merge(true, this.object || {}, sourceObject);
        }
        const fullMappings = normalizeMappings(mappings);
        // 计算sourceValue
        obtainSourceValue(sourceAccessor, fullMappings);
        // 复制
        applyTargetValue(sourceAccessor, this, fullMappings);
    }
    private _getOrCreate(propertyChain: string): any {
        if (!propertyChain) {
            return this.object;
        }
        if (this._history[propertyChain]) {
            return this._history[propertyChain];
        }
        const splited = this._splitChainProp(propertyChain);
        if (!splited[1]) {
            return INVALID_PROPERTY_ACCESS;
        }
        const previous = this._getOrCreate(splited[0]);
        const prop = splited[1];
        if (previous && (typeof previous === 'object')) {
            if (!previous[prop] || (typeof previous[prop] !== 'object')) {
                previous[prop] = {};
            }
            this._history[propertyChain] = previous[prop];
            return previous[prop];
        } else {
            return INVALID_PROPERTY_ACCESS;
            // throw new Error(`Can't access by chaining property name: ${propertyChain}`);
        }
    }
    private _splitChainProp(propertyChain: string): string[] {
        const ind = propertyChain.lastIndexOf('.');
        return [propertyChain.substring(0, ind), propertyChain.substr(ind + 1)];
    }
}

export type IValueConverter = (value: any, sourceAccessor: IObjectAccessor, targetAccessor: IObjectAccessor) => any;
/**
 * 基本的转换器映射
 */
export interface ICommonMapping {
    /**
     * 目标对象属性名
     */
    targetProperty?: string;
    /**
     * 转换函数
     */
    converter?: IValueConverter;
    /**
     * 是否跳过向目标属性赋值
     */
    skipSetter?: boolean;
}
/**
 * 子属性映射描述，只允许出现在源值为对象类型情况下
 */
export interface ISubMapping {
    /**
     * 目标对象属性名
     */
    targetProperty: string;
    /**
     * 子属性映射描述
     */
    subMappings: '*' | IConverterOption;
    /**
     * 转换函数
     */
    converter?: IValueConverter;
    /**
     * 是否跳过向目标属性赋值
     */
    skipSetter?: boolean;
}
/**
 * 子元素映射描述，只允许出现在源值为数组类型的情况下
 */
export interface IItemMapping {
    /**
     * 目标对象属性名
     */
    targetProperty: string;
    /**
     * 子元素映射描述
     */
    itemMappings: '*' | IConverterOption;
    /**
     * 转换函数
     */
    converter?: IValueConverter;
    /**
     * 是否跳过向目标属性赋值
     */
    skipSetter?: boolean;
}
/**
 * 转换器设置。设置如何转换源属性值到目标属性
 */
export interface IConverterOption {
    [sourceProperty: string]: string | IValueConverter | ICommonMapping | ISubMapping | IItemMapping;
}

export interface IConverterMapping {
    sourceProperty: string;
    targetProperty: string;
    converter?: IValueConverter;
    sourceValue?: any;
    skipSetter?: boolean;
    // 子属性映射描述，只允许出现在值为对象类型情况下
    subMappings?: '*' | IConverterOption;
    // 子元素映射描述，只允许出现在值为数组类型的情况下
    itemMappings?: '*' | IConverterOption;
}

// export interface IConverterMappingProcessor {
//     mappings(): IConverterMapping[];
//     sortedSourceMappings(): IConverterMapping[];
//     sortedTargetMappings(): IConverterMapping[];
// }

// export class ConverterMappingProcessor implements IConverterMappingProcessor {
//     constructor(private option: IConverterOption) {}
//     private _mappings: IConverterMapping[];
//     private _sortedSourceMappings: IConverterMapping[];
//     private _sortedTargetMappings: IConverterMapping[];
//     mappings(): IConverterMapping[] {
//         if (!this._mappings) {
//             this._mappings = [];
//             if (this.option) {
//                 this._mappings = normalizeMappings(this.option);
//             }
//         }
//         return this._mappings;
//     }
//     sortedSourceMappings(): IConverterMapping[] {
//         if (!this._sortedSourceMappings) {
//             this._sortedSourceMappings = this.mappings().concat();
//             this._sortedSourceMappings.sort((a, b): number => {
//                 return a.sourceProperty.length - b.sourceProperty.length;
//             });
//         }
//         return this._sortedSourceMappings;
//     }
//     sortedTargetMappings(): IConverterMapping[] {
//         if (!this._sortedTargetMappings) {
//             this._sortedTargetMappings = this.mappings().concat();
//             this._sortedTargetMappings.sort((a, b): number => {
//                 return a.targetProperty.length - b.targetProperty.length;
//             });
//         }
//         return this._sortedTargetMappings;
//     }
// }

function normalizeMappings(mappings?: IConverterOption): IConverterMapping[] {
    const result: IConverterMapping[] = [];
    let value, map: IConverterMapping;
    for (const sourceProperty in mappings) {
        value = mappings[sourceProperty];
        if (!value || (typeof value === 'string')) {
            // 对拷属性
            map = {
                sourceProperty: sourceProperty,
                targetProperty: value || sourceProperty
            };
        } else if (typeof value === 'function') {
            // 通过转换函数对拷属性
            map = {
                sourceProperty: sourceProperty,
                targetProperty: sourceProperty,
                converter: value
            };
        } else if (value.targetProperty || value.converter) {
            // 如果不设置targetProperty则认为是自行处理转换
            map = {
                sourceProperty: value.sourceProperty || sourceProperty,
                targetProperty: value.targetProperty || sourceProperty,
                converter: value.converter,
                skipSetter: value.skipSetter,
                subMappings: value.subMappings,
                itemMappings: value.itemMappings
            };
        } else {
            map = null;
        }
        map && result.push(map);
    }
    return result;
}

export function collectObjectMapping(object, skipArray = false): IConverterOption {
    if (!object) {
        return {};
    }
    const mapping: IConverterOption = {};
    let pointer, index = 0, i, key, obj = object;
    const arr = [{ pointer: '', object: obj }];
    while (index < arr.length) {
        pointer = arr[index].pointer;
        obj = arr[index].object;
        if (isDate(obj)) {
            pointer && (mapping[pointer] = pointer);
        } else if (isArray(obj)) {
            if (skipArray) {
                pointer && (mapping[pointer] = pointer);
            } else {
                for (i = 0; i < obj.length; i++) {
                    arr.push({
                        pointer: pointer ? `${pointer}.${i}` : `${i}`,
                        object: obj[i]
                    });
                }
            }
        } else if (isPlainObject(obj)) {
            for (key in obj) {
                arr.push({
                    pointer: pointer ? `${pointer}.${key}` : `${key}`,
                    object: obj[key]
                });
            }
        } else {
            pointer && (mapping[pointer] = pointer);
        }
        index += 1;
    }
    return mapping;
}
export function collectObjectMappingValues(object, skipArray = false): {[key: string]: any} {
    if (!object) {
        return {};
    }
    const mapping = {};
    let pointer, index = 0, i, key, obj = object;
    const arr = [{ pointer: '', object: obj }];
    while (index < arr.length) {
        pointer = arr[index].pointer;
        obj = arr[index].object;
        if (isDate(obj)) {
            pointer && (mapping[pointer] = obj);
        } else if (isArray(obj)) {
            if (skipArray) {
                pointer && (mapping[pointer] = obj);
            } else {
                for (i = 0; i < obj.length; i++) {
                    arr.push({
                        pointer: pointer ? `${pointer}.${i}` : `${i}`,
                        object: obj[i]
                    });
                }
            }
        } else if (isPlainObject(obj)) {
            for (key in obj) {
                arr.push({
                    pointer: pointer ? `${pointer}.${key}` : `${key}`,
                    object: obj[key]
                });
            }
        } else {
            pointer && (mapping[pointer] = obj);
        }
        index += 1;
    }
    return mapping;
}

export function spreadObjectWithPointers(object, skipArray = false): {[pointer: string]: string} {
    if (!object) {
        return {};
    }
    const result = {};
    let jsonPointer, index = 0, i, key, obj = object;
    const arr = [{ jsonPointer: '', object: obj }];
    while (index < arr.length) {
        jsonPointer = arr[index].jsonPointer;
        obj = arr[index].object;
        if (isArray(obj)) {
            if (skipArray) {
                jsonPointer && (result[jsonPointer] = jsonPointer);
            } else {
                for (i = 0; i < obj.length; i++) {
                    arr.push({
                        jsonPointer: jsonPointer ? `${jsonPointer}.${i}` : `${i}`,
                        object: obj[i]
                    });
                }
            }
        } else if (isDate(obj)) {
            jsonPointer && (result[jsonPointer] = jsonPointer);
        } else if (isPlainObject(obj)) {
            for (key in obj) {
                arr.push({
                    jsonPointer: jsonPointer ? `${jsonPointer}.${key}` : `${key}`,
                    object: obj[key]
                });
            }
        } else {
            jsonPointer && (result[jsonPointer] = jsonPointer);
        }
        index += 1;
    }
    return result;
}

function obtainSourceValue(sourceAccessor: IObjectAccessor, mappings: IConverterMapping[]) {
    mappings = mappings || [];
    // sort by source prop length
    mappings.sort((a, b): number => {
        return a.sourceProperty.length - b.sourceProperty.length;
    });
    mappings.forEach((map: IConverterMapping) => {
        map.sourceValue = sourceAccessor.get(map.sourceProperty);
    });
}

function applyTargetValue(sourceAccessor: IObjectAccessor, targetAccessor: IObjectAccessor, mappings: IConverterMapping[]) {
    mappings = mappings || [];
    // sort by target prop length
    mappings.sort((a, b): number => {
        return a.targetProperty.length - b.targetProperty.length;
    });
    mappings.forEach((map: IConverterMapping) => {
        if (map.sourceValue !== INVALID_PROPERTY_ACCESS) {
            const subMappings = map.subMappings;
            const itemMappings = map.itemMappings;
            let targetValue;
            if (map.sourceValue && isArray(map.sourceValue)) {
                targetValue = map.converter ? map.converter(map.sourceValue, sourceAccessor, targetAccessor) : targetAccessor.get(map.targetProperty, []);
                targetValue = targetValue || [];
                if (targetValue !== INVALID_PROPERTY_ACCESS) {
                    (!map.skipSetter) && targetAccessor.set(map.targetProperty, targetValue);
                    for (let i = 0; i < map.sourceValue.length; i++) {
                        if (!map.sourceValue[i] || typeof map.sourceValue[i] !== 'object') {
                            targetAccessor.set(`${map.targetProperty}.${i}`, map.sourceValue[i]);
                            continue;
                        }
                        // ensure target item
                        targetAccessor.get(`${map.targetProperty}.${i}`, {});
                        if (itemMappings === '*') {
                            merge(true, targetAccessor.get(`${map.targetProperty}.${i}`, {}), map.sourceValue[i]);
                        } else if (itemMappings) {
                            targetAccessor.sub(`${map.targetProperty}.${i}`)
                                .copyFrom(sourceAccessor.sub(`${map.sourceProperty}.${i}`), itemMappings);
                        }
                    }
                    // TODO cut off?
                    targetValue.length = map.sourceValue.length;
                }
            } else if (map.sourceValue && typeof map.sourceValue === 'object') {
                targetValue = map.converter ? map.converter(map.sourceValue, sourceAccessor, targetAccessor) : targetAccessor.get(map.targetProperty, {});
                targetValue = targetValue || {};
                if (targetValue !== INVALID_PROPERTY_ACCESS) {
                    (!map.skipSetter) && targetAccessor.set(map.targetProperty, targetValue);
                    if (subMappings === '*') {
                        merge(true, targetAccessor.get(map.targetProperty, {}), map.sourceValue);
                    } else if (subMappings) {
                        targetAccessor.sub(map.targetProperty)
                            .copyFrom(sourceAccessor.sub(map.sourceProperty), subMappings);
                    }
                }
            } else {
                targetValue = map.converter ? map.converter(map.sourceValue, sourceAccessor, targetAccessor) : map.sourceValue;
                (!map.skipSetter) && targetAccessor.set(map.targetProperty, targetValue);
            }
        }
    });
}

/**
 * 通过转换映射对象从源对象中复制属性值到目标对象，如果不传递转换映射对象则相当于merge方法，及拷贝所有属性及子属性。
 * @param target 目标对象
 * @param source 源对象
 * @param mappings 转换映射对象
 */
export function copyTo(target: Object, source: Object, mappings?: IConverterOption): any {
    if (!source) {
        return target;
    }
    if (!mappings) {
        return merge(true, target || {}, source);
    }
    target = target || {};
    const fullMappings: IConverterMapping[] = normalizeMappings(mappings);
    const sourceAccessor = new ObjectAccessor(source);
    const targetAccessor = new ObjectAccessor(target);
    obtainSourceValue(sourceAccessor, fullMappings);
    applyTargetValue(sourceAccessor, targetAccessor, fullMappings);
    return target;
}

/**
 * 继承属性值。与copyTo方法不同之处在于，对于自身对象不存在的属性将跳过从source继承值
 * @param target 目标对象
 * @param source 源对象
 */
export function extendsTo(target: Object, source: Object): any {
    if (!source || !target) {
        return target;
    }
    const mapping = collectObjectMapping(target);
    const sourceAccessor = new ObjectAccessor(source);
    const targetAccessor = new ObjectAccessor(target);
    targetAccessor.copyFrom(sourceAccessor, mapping);
    return targetAccessor.object;
}

function diffMergeBy(target: any, source: any, pointerMapping: {[pointer: string]: any}, hostKey = '', result?: IChainingChanges) {
    result = result || new ChainingChanges();
    if (!source || isEmpty(source)) return result;
    let prop;
    for (const key in source) {
        prop = hostKey ? `${hostKey}.${key}` : key;
        if (prop in pointerMapping) {
            const value = source[key];
            if (target[key] !== value) {
                const old = target[key];
                target[key] = value;
                result.set(prop, value, old);
            }
        } else {
            if (isPlainObject(source[key])) {
                target[key] = target[key] || {};
                diffMergeBy(target[key], source[key], pointerMapping, prop, result);
            }
        }
    }
    return result;
}

/**
 * Diffs merge 比较值变更，从source向target复制值。
 * 对于发生变更的叶子属性，将向根逐层执行浅复制
 * @author AK
 * @param target 目标对象
 * @param source 源对象
 * @returns 返回变化信息
 */
export function diffMerge(target, source, skipArray = false): any {
    return diffMergeBy(target, source, collectObjectMapping(source, skipArray));
}

export interface IChainingChanges {
    isEmpty(): boolean;
    get(property: string): any;
    getOld(property: string): any;
    set(property: string, value: any, oldValue?: any): void;
    has(property: string): boolean;
    andHas(...properties: string[]): boolean;
    orHas(...properties: string[]): boolean;
    forEach(fn: (chainProperty: string, value, oldValue) => void);
    forEachSub(property: string, fn: (chainProperty: string, value, oldValue) => void);
    toActual(property?: string): any;
}

export function toActualObject(pointerValueHash: any, subPointer?: string): any {
    if (!pointerValueHash) return null;
    subPointer && (subPointer = subPointer + '.');
    const accessor = new ObjectAccessor({});
    Object.keys(pointerValueHash).forEach(key => {
        if (subPointer) {
            if (key.indexOf(subPointer) === 0) {
                accessor.set(key.replace(subPointer, ''), pointerValueHash[key]);
            }
        } else {
            accessor.set(key, pointerValueHash[key]);
        }
    });
    return accessor.object;
}

export class ChainingChanges implements IChainingChanges {
    static diffMerge(target: any, source: any, skipArray = false): IChainingChanges {
        return diffMerge(target, source, skipArray);
    }
    static diffMergeBy(target: any, source: any, pointerMapping: {[pointer: string]: any}): IChainingChanges {
        return diffMergeBy(target, source, pointerMapping);
    }
    private changeHash = {};
    private oldHash = {};
    isEmpty(): boolean {
        return isEmpty(this.changeHash);
    }
    get(property: string): any {
        return this.changeHash[property];
    }
    set(property: string, value: any, oldValue?: any): void {
        this.changeHash[property] = value;
        if (arguments.length === 3) {
            this.oldHash[property] = oldValue;
        }
    }
    getOld(property: string): any {
        return this.oldHash[property];
    }
    has(property?: string): boolean {
        if (!property) return !isEmpty(this.changeHash);
        if (property in this.changeHash) return true;
        property = property + '.';
        for (const key in this.changeHash) {
            if (key.indexOf(property) === 0) return true;
        }
        return false;
    }
    andHas(): boolean {
        if (!arguments.length) return false;
        for (let i = 0; i < arguments.length; i++) {
            if (!this.has(arguments[i])) return false;
        }
        return true;
    }
    orHas(): boolean {
        if (!arguments.length) return false;
        for (let i = 0; i < arguments.length; i++) {
            if (this.has(arguments[i])) return true;
        }
        return false;
    }
    forEach(fn: (chainProperty: string, value, oldValue) => void) {
        if (!fn) return;
        Object.keys(this.changeHash).forEach(prop => fn(prop, this.changeHash[prop], this.oldHash[prop]));
    }
    forEachSub(property: string, fn: (chainProperty: string, value, oldValue) => void) {
        if (!property || !fn) return;
        if (property in this.changeHash) {
            fn('', this.changeHash[property], this.oldHash[property]);
        } else {
            property = property + '.';
            Object.keys(this.changeHash).forEach(prop => {
                if (prop.indexOf(property) === 0) {
                    fn(prop.replace(property, ''), this.changeHash[prop], this.oldHash[prop])
                }
            });
        }
    }
    toActual(property?: string): any {
        return toActualObject(this.changeHash, property);
    }
}


export type IConverter = (accessor: IObjectAccessor) => any;

export interface ILevelOption {
    data: any;
    mapping?: {[property: string]: (string | IConverter)}
}

export interface IMultiLevelOption {
    isMultiLevelOption: boolean;
    has(propertyName): Boolean;
    get(propertyName): any;
    length(): number;
    update(index: number, data: any): void;
    nextLevel(dataOrOption: any | ILevelOption, isomorphic?: boolean): IMultiLevelOption;
}

interface ILevelOptionAccessor {
    accessor: IObjectAccessor,
    raw: any,
    mapping: {[property: string]: (string | IConverter)},
}

export class MultiLevelOption implements IMultiLevelOption {
    constructor(private _levelOptions: (any | ILevelOption | MultiLevelOption)[], isomorphic = false) {
        if (isomorphic) {
            this._dics = (this._levelOptions || []).map(opt => {
                if (!opt) return null;
                if (opt.isMultiLevelOption) {
                    this._length += opt.length();
                    return opt;
                } else {
                    this._length += 1;
                    return {
                        accessor: new ObjectAccessor(opt),
                        raw: opt,
                        mapping: null,
                    }
                }
            }).filter(d => !!d);
        } else {
            this._dics = (this._levelOptions || []).map(opt => {
                if (!opt) return null;
                if (opt.isMultiLevelOption) {
                    this._length += opt.length();
                    this._length += 1;
                    return opt;
                } else {
                    this._length += 1;
                    return {
                        accessor: new ObjectAccessor(opt.data),
                        raw: opt.data,
                        mapping: opt.mapping,
                    }
                }
            }).filter(d => !!d);
        }
    }

    static getValue(property, ...objects: any[]): any {
        if (!property || !objects || !objects.length) return undefined;
        let value;
        for (let i = 0; i < objects.length; i++) {
            const object = objects[i];
            value = ObjectAccessor.get(object, property);
            if (value !== undefined && value !== ObjectAccessor.INVALID_PROPERTY_ACCESS) {
                return value;
            }
        }
        return value;
    }

    public isMultiLevelOption = true;

    private _dics: (ILevelOptionAccessor | MultiLevelOption)[] = [];
    private _values: any = {};
    private _length = 0;
    length() {
        return this._length;
    }
    has(propertyName) {
        if (!this._dics[0]) return false;
        if ((this._dics[0] as MultiLevelOption).isMultiLevelOption) {
            return (this._dics[0] as MultiLevelOption).has(propertyName);
        } else {
            return propertyName in (this._dics[0] as ILevelOptionAccessor).mapping;
        }
    }
    get(propertyName) {
        if (propertyName in this._values) return this._values[propertyName];
        let value;
        for (let i = 0; i < this._dics.length; i++) {
            const item = this._dics[i];
            // 如果为MultiLevelOption
            if ((item as MultiLevelOption).isMultiLevelOption) {
                value = (item as MultiLevelOption).get(propertyName);
            } else {
                // 如果不设置mapping 则为对等的对象
                const accessor = item as ILevelOptionAccessor;
                if (!accessor.mapping) {
                    value = accessor.accessor.get(propertyName);
                } else {
                    const converter = accessor.mapping[propertyName];
                    if (!converter) continue;
                    if (typeof converter === 'string') {
                        value = accessor.accessor.get(converter);
                    } else {
                        value = converter(accessor.accessor);
                    }
                }
            }
            if (isDefined(value) && value !== ObjectAccessor.INVALID_PROPERTY_ACCESS) {
                break;
            }
        }
        value = isDefined(value) && value !== ObjectAccessor.INVALID_PROPERTY_ACCESS ? value : null;
        this._values[propertyName] = value;
        return value;
    }
    update(index: number, data: any) {
        if (index >= this._length) return;
        for (let i = 0; i < this._dics.length; i++) {
            const item: any = this._dics[i];
            if (item.isMultiLevelOption) {
                if (item.length() > index) {
                    item.update(index, data);
                    break;
                } else {
                    index -= 1;
                }
            } else {
                if (index <= 0) {
                    item.raw = data;
                    item.accessor = new ObjectAccessor(data);
                } else {
                    index -= 1;
                }
            }
        }
        // 清理缓存的值
        this._values = {};
    }
    nextLevel(dataOrOption: any | ILevelOption, isomorphic = false) {
        if (!dataOrOption) return this;
        return new MultiLevelOption([dataOrOption, this], isomorphic);
    }
    assign(obj, mapping) {
        if (!obj || !mapping) return obj;
        const accessor = new ObjectAccessor(obj);
        Object.keys(mapping).forEach(key => {
            accessor.set(key, this.get(mapping[key]));
        });
        return obj;
    }
    compose(mapping) {
        if (!mapping) return null;
        const accessor = new ObjectAccessor({});
        Object.keys(mapping).forEach(key => {
            accessor.set(key, this.get(mapping[key]));
        });
        return accessor.object;
    }
}