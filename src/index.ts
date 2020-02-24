import { isDefined } from './utils/typeutils';

export * from './utils/osutils';
export * from './utils/typeutils';
export * from './utils/cacheutils';
export * from './utils/asyncutils';
export * from './utils/decoratorutils';
export * from './utils/dateutils';
export * from './utils/arrayutils';
export * from './utils/objectutils';

import * as colorutils from './utils/colorutils';
import * as urlutils from './utils/urlutils';
import * as geoutils from './utils/geoutils';
import * as geometryutils from './utils/geometryutils';
import * as mathutils from './utils/mathutils';

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