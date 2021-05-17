import { isBrowser } from './osutils';
import { isDefined } from './typeutils';
import { globalCache } from './cacheutils';

export interface ObservableLike<T> {
    subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): any;
    pipe(...operations: any[]): ObservableLike<any>;
}

const tickerStatus = globalCache('internalTickerStatus', () => {
    const status = {
        callbacks: {},
        pending: false,
        idCounter: 1,
        invokeCallbacks: function() {
            status.pending = false;
            const copy = status.callbacks;
            status.callbacks = {};
            for (const key in copy) {
                if (copy.hasOwnProperty(key)) {
                    copy[key]();
                }
            }
        }
    };
    return status;
});

export function callLater(fn: Function): number {
    if (!fn) {
        return undefined;
    }
    tickerStatus.idCounter += 1;
    tickerStatus.callbacks[tickerStatus.idCounter] = fn;
    if (!tickerStatus.pending) {
        tickerStatus.pending = true;
        setTimeout(tickerStatus.invokeCallbacks, 0);
    }
    return tickerStatus.idCounter;
}
export function cancelCallLater(id: number) {
    if (isDefined(id)) {
        delete tickerStatus.callbacks[id];
    }
}

const nextFrame = (function () {
    let lastTime = 0;
    const vendors = ['ms', 'moz', 'webkit', 'o'];
    const win: any = isBrowser ? window : {};
    let requestAnimationFrame = win.requestAnimationFrame;

    for (let i = 0; i < vendors.length && !win.requestAnimationFrame; ++i) {
        requestAnimationFrame = win[vendors[i] + 'RequestAnimationFrame'];
    }
    if (!requestAnimationFrame) {
        return function (callback) {
            return setTimeout(callback, 16);
        };
    } else {
        return requestAnimationFrame;
    }
})();

const requestFrameStatus = globalCache('internalRequestFrameStatus', () => {
    const status = {
        callbacks: {},
        pending: false,
        idCounter: 1,
        invokeCallbacks: function() {
            status.pending = false;
            const copy = status.callbacks;
            status.callbacks = {};
            for (const key in copy) {
                if (copy.hasOwnProperty(key)) {
                    copy[key]((new Date()).getTime() - copy[key].__startTime);
                }
            }
        }
    };
    return status;
});
export type CancelFrameFunction = () => void;
export type TlapsedTime = number;
export function requestFrame(fn: (elapsedTime: TlapsedTime) => void): CancelFrameFunction {
    if (!fn) {
        return null;
    }
    requestFrameStatus.idCounter += 1;
    const id = requestFrameStatus.idCounter;
    requestFrameStatus.callbacks[id] = fn;
    requestFrameStatus.callbacks[id].__startTime = (new Date()).getTime();
    if (!requestFrameStatus.pending) {
        requestFrameStatus.pending = true;
        nextFrame(requestFrameStatus.invokeCallbacks);
    }
    return () => {
        delete tickerStatus.callbacks[id];
    }
}

export type UnregisterFrameTickHandle = () => void;
function emptyUnregisterFrameTickHandle() {};

export interface IAnimationFrameTicker {
    destroy(): void;
    onTick(callback): UnregisterFrameTickHandle;
    remove(callback): void;
    once(callback): UnregisterFrameTickHandle;
    suspend(): void;
    resume(): void;
    tok(): void;
}

export class AnimationFrameTicker implements IAnimationFrameTicker {
    constructor(private _onBeforeFrame?: () => void, private _onAfterFrame?: () => void) {}
    private _destroyed = false;
    private _destroyFrame;
    private _handles = [];
    private _tiking = false;
    private _tokOnce = false;
    destroy() {
        this.suspend();
        this._handles = [];
        this._destroyed = true;
    }
    once(callback): UnregisterFrameTickHandle {
        if (!callback) return emptyUnregisterFrameTickHandle;
        callback['__tick_once__'] = true;
        return this.onTick(callback);
    }
    onTick(callback): UnregisterFrameTickHandle {
        if (!callback || this._destroyed) return emptyUnregisterFrameTickHandle;
        if (this._handles.indexOf(callback) === -1) {
            this._handles.push(callback);
            this.resume();
        }
        return () => {
            this.remove(callback);
        };
    }
    remove(callback): void {
        if (!callback || this._destroyed) return;
        const index = this._handles.indexOf(callback);
        if (index !== -1) {
            this._handles.splice(index, 1);
            if (!this._handles.length) {
                this.suspend();
            }
        }
    }
    suspend() {
        if (this._destroyed) return;
        this._destroyFrame && this._destroyFrame();
        this._destroyFrame = null;
    }
    resume() {
        if (this._destroyed) return;
        if (!this._destroyFrame && !!this._handles.length) {
            this._destroyFrame = requestFrame(this._tickFunc);
        }
    }
    tok() {
        if (this._destroyed) return;
        if (!this._destroyFrame) {
            this._destroyFrame = requestFrame(this._tickFunc);
        } else if (this._tiking) {
            this._tokOnce = true;
        }
    }
    private _onTick() {
        if (this._destroyed) return;
        const handles = this._handles.concat();
        for (let i = 0; i < handles.length; i++) {
            handles[i]();
            if (handles[i]['__tick_once__']) {
                delete handles[i]['__tick_once__'];
                // 回调执行后，this._handles可能会被添加或删除，因此需要重新计算index
                const index = this._handles.indexOf(handles[i]);
                if (index !== -1) {
                    this._handles.splice(index, 1);
                }
            }
        }
    }
    private _tickFunc = () => {
        this._tiking = true;
        this._onBeforeFrame && this._onBeforeFrame();
        this._onTick();
        this._onAfterFrame && this._onAfterFrame();
        this._tiking = false;
        if (!this._handles.length && !this._tokOnce) {
            this.suspend();
        } else {
            this._tokOnce = false;
            this._destroyFrame && (this._destroyFrame = requestFrame(this._tickFunc));
        }
    }
}

export function isPromiseLike(p): boolean {
    return p && ('then' in p) && (typeof p.then === 'function');
}
export function isJQPromise(p): boolean {
    return isPromiseLike(p) && ('fail' in p) && (typeof p.fail === 'function');
}
export function isPromise(p): boolean {
    return isPromiseLike(p) && ('catch' in p) && (typeof p.catch === 'function');
}

export function isObservabeLike(o): boolean {
    return o && ('subscribe' in o) && (typeof o.subscribe === 'function');
}

export function asPromise(p): Promise<any> {
    if (isObservabeLike(p)) {
        return new Promise((resolve, reject) => {
            const subscription = p.subscribe(result => {
                resolve(result);
                // 延迟取消订阅，避免同步调用造成的subscription尚未定义的问题
                callLater(() => subscription.unsubscribe());
            }, error => {
                reject(error);
                // 延迟取消订阅，避免同步调用造成的subscription尚未定义的问题
                callLater(() => subscription.unsubscribe());
            });
        });
    } else if (isPromiseLike(p)) {
        if (isPromise(p)) return p;
        if (isJQPromise(p)) {
            return new Promise((resolve, reject) => {
                p.then(resolve).fail(reject);
            });
        }
    }
    return null;
}