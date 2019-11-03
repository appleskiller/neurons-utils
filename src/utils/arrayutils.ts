import { isDefined } from './typeutils';

export function findAValidValue(array: any[], fromIndex: number = 0, key?: string | number): any {
    if (!array || !array.length) return null;
    for (let i = fromIndex; i < array.length; i++) {
        if (isDefined(key) && isDefined(array[i]) && isDefined(array[i][key])) {
            return array[i][key];
        } else if (isDefined(array[i])) {
            return array[i];
        }
    }
}

export function switchItemTo(array: any[], item: any, index: number) {
    if (array && index >= 0) {
        const from = array.indexOf(item);
        if (from !== -1) {
            array[from] = array[index];
            array[index] = item;
        }
    }
}

export function switchIndexTo(array: any[], from: number, index: number) {
    if (array && index >= 0) {
        if (from !== -1) {
            const temp = array[from];
            array[from] = array[index];
            array[index] = temp;
        }
    }
}

export function moveItemTo(array: any[], item: any, index: number) {
    if (array && index >= 0) {
        let from = array.indexOf(item);
        if (from !== -1) {
            const sep = (from < index) ? 1 : -1;
            while (from + sep < array.length && from !== index && !(sep > 0 && from === index - 1)) {
                array[from] = array[from + sep];
                array[from + sep] = item;
                from += sep;
            }
        }
    }
}
export function moveIndexTo(array: any[], from: number, index: number) {
    if (array && index >= 0 && from >= 0 && from < array.length) {
        const item = array[from];
        const sep = (from < index) ? 1 : -1;
        while (from + sep < array.length && from !== index && !(sep > 0 && from === index - 1)) {
            array[from] = array[from + sep];
            array[from + sep] = item;
            from += sep;
        }
    }
}