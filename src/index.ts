import { isDefined } from './utils/typeutils';

export * from './utils/asyncutils';
export * from './utils/cacheutils';
export * from './utils/colorutils';
export * from './utils/decoratorutils';
export * from './utils/mathutils';
export * from './utils/osutils';
export * from './utils/typeutils';
export * from './utils/dateutils';
export * from './utils/urlutils';
export * from './utils/arrayutils';
export * from './utils/objectutils';
export * from './utils/geoutils';
export * from './utils/geometryutils';

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
}
