
export {
    isBrowser,
    isDomLevel2,
} from './utils/osutils';
export {
    isDefined,
    isArray,
    isDate,
    isArrayBuffer,
    isBlob,
    isFormData,
    isPlainObject,
    isEmpty,
} from './utils/typeutils';
export {
    globalContext,
    globalCache,
    globalLimitedDictionary,
} from './utils/cacheutils';
export {
    callLater,
    cancelCallLater,
    requestFrame,
    isPromiseLike,
    isJQPromise,
    isPromise,
    isObservabeLike,
    asPromise,
    AnimationFrameTicker,
} from './utils/asyncutils';

import { AnimationFrameTicker, IAnimationFrameTicker } from './utils/asyncutils';
export function createAnimationFrameTicker(onBeforeFrame?: () => void, onAfterFrame?: () => void): IAnimationFrameTicker {
    return new AnimationFrameTicker(onBeforeFrame, onAfterFrame);
}

export {
    decoratorType,
    decorator,
} from './utils/decoratorutils';
export {
    createDate,
    isValidDate,
    getDateTime,
    getDateTimeFromString,
    getQuarterNumber,
    getDateBoundary,
} from './utils/dateutils';
export {
    findAValidValue,
    switchItemTo,
    switchIndexTo,
    moveItemTo,
    moveIndexTo,
} from './utils/arrayutils';
export {
    uniqueId,
    merge,
    diffMerge,
    deepEqual,
    uuid,
    INVALID_PROPERTY_ACCESS,
    SubObjectAccessor,
    ObjectAccessor,
    collectObjectMapping,
    collectObjectMappingValues,
    copyTo,
    extendsTo,
    toActualObject,
    ChainingChanges,
    MultiLevelOption,
} from './utils/objectutils';
export {
    ClassAlias,
    getClassByAlias,
    newInstance,
} from './utils/reflectorutils';

import * as colorutils from './utils/colorutils';
import * as urlutils from './utils/urlutils';
import * as geoutils from './utils/geoutils';
import * as geometryutils from './utils/geometryutils';
import * as mathutils from './utils/mathutils';
import * as layoututils from './utils/layoututils';

export class Map<K, V> {
    private _keys: K[] = [];
    private _values: V[] = [];
    get(key: K): V {
        if (!key) return undefined;
        const index = this._keys.indexOf(key);
        if (index !== -1) {
            return this._values[index];
        } else {
            return undefined;
        }
    }
    set(key: K, value: V): V {
        if (!key) return undefined;
        const index = this._keys.indexOf(key);
        if (index !== -1) {
            this._values[index] = value;
        } else {
            this._keys.push(key);
            this._values.push(value);
        }
        return value;
    }
    has(key: K): boolean {
        if (!key) return false;
        return (this._keys.indexOf(key) !== -1);
    }
    del(key: K): void {
        if (!key) return;
        this.take(key);
    }
    take(key: K): V {
        if (!key) return undefined;
        const index = this._keys.indexOf(key);
        if (index !== -1) {
            this._keys.splice(index, 1);
            return this._values.splice(index, 1)[0];
        }
        return undefined;
    }
    clear(): void {
        this._keys = [];
        this._values = [];
    }
    forEach(fn: (key: K, value: V) => void) {
        if (fn) {
            for (var i: number = 0; i < this._keys.length; i++) {
                fn(this._keys[i], this._values[i]);
            }
        }
    }
    find(fn: (key: K, value: V) => boolean): [K, V] {
        if (fn) {
            for (var i: number = 0; i < this._keys.length; i++) {
                if (fn(this._keys[i], this._values[i])) {
                    return [this._keys[i], this._values[i]];
                }
            }
        }
        return null;
    }
}

export const color = { ...colorutils };
export const url = { ...urlutils };
export const geo = { ...geoutils };
export const geometry = { ...geometryutils };
export const math = { ...mathutils };
export const layout = { ...layoututils };