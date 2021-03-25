import { globalCache } from "./cacheutils";
import { decorator, decoratorType } from "./decoratorutils";

const classDic = globalCache('ne_class_dictionary');

export function ClassAlias(className: string) {
    return decorator((type, target) => {
        if (type === decoratorType.CLASS) {
            classDic[className] = target;
        } else {
            throw new TypeError(`Decorator "ClassAlias" must be only acted upon Class`);
        }
    });
}

export function getClassByAlias(className: string) {
    return classDic[className];
}

export function newInstance<T>(className: string, ...args): T {
    const clazz = getClassByAlias(className);
    if (clazz) {
        switch (args.length) {
            case 0: return new clazz();
            case 1: return new clazz(args[0]);
            case 2: return new clazz(args[0], args[1]);
            case 3: return new clazz(args[0], args[1], args[2]);
            case 4: return new clazz(args[0], args[1], args[2], args[3]);
            case 5: return new clazz(args[0], args[1], args[2], args[3], args[4]);
            case 6: return new clazz(args[0], args[1], args[2], args[3], args[4], args[5]);
            case 7: return new clazz(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
            case 8: return new clazz(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
        }
        throw new Error("Constructor parameter no more than 8.");
    } else {
        throw new Error(`No Class was found by '${className}'`);
    }
}