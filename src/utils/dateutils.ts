import { isDate, isDefined } from './typeutils';

export function createDate(v): Date {
    if (isDate(v)) return v;
    if (typeof v === 'number') {
        const d = new Date();
        d.setTime(v);
        return d;
    }
    return isDefined(v) ? new Date(v) : new Date(undefined);
}

export function isValidDate(d: Date): boolean {
    return d && isDate(d) && !isNaN(d.getTime());
}

export function getDateTime(v: any): number {
    if (!isDefined(v)) return NaN;
    let type = typeof v;
    if (type === 'string') {
        if (v.length === 13 && v === parseInt(v) + '') {
            return parseInt(v);
        } else {
            return (new Date(v)).getTime();
        }
    };
    if (type === 'number') {
        if ((v + '').length === 13) return v;
        return (new Date(v + '')).getTime();
    };
    try { return v.getTime() } catch (error) { return NaN };
}
const dateReplaced = {
    '零': 0, '〇': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '年': '/', '月': '/', '日': '/', '时': ':', '分': ':', '秒': ':',
}
const dateReplacedRegExp = /[零|〇|一|二|三|四|五|六|七|八|九|年|月|日|时|分|秒]/g;
export function getDateTimeFromString(v: string): number {
    let time = getDateTime(v);
    if (!isNaN(time)) return time;
    if (dateReplacedRegExp.test(v)) {
        v = v.replace(dateReplacedRegExp, (word) => {
            return (word in dateReplaced) ? dateReplaced[word] : word;
        });
        time = getDateTime(v);
    }
    return time;
}
export function getQuarterNumber(d: Date) {
    const m = d.getMonth();
    if (2 < m && m < 6) {
        return 1;
    } else if (5 < m && m < 9) {
        return 2;
    } else if (m > 8) {
        return 3;
    }
    return 0;
}

export function getDateBoundary(date: any): string {
    const time = getDateTime(date);
    if (!isDefined(time)) return '';
    const now = new Date().getTime();
    const timeDiff: number = Math.abs(now - time),
        min: number = 1000 * 60,
        hour: number = min * 60,
        day: number = hour * 24,
        week: number = day * 7,
        month: number = day * 30,
        year: number = month * 12,

        _min = timeDiff / min,
        _hour = timeDiff / hour,
        _day = timeDiff / day,
        _week = timeDiff / week,
        _month = timeDiff / month,
        _year = timeDiff / year;
    let result: string = '';
    const last = now >= time ? '前' : '后';
    if (_year >= 1)
        result = `${Math.round(_year)} 年${last}`;
    else if (_month >= 1)
        result = `${Math.round(_month)} 个月${last}`;
    else if (_week >= 1)
        result = `${Math.round(_week)} 周${last}`;
    else if (_day >= 1)
        result = `${Math.round(_day)} 天${last}`;
    else if (_hour >= 1)
        result = `${Math.round(_hour)} 小时${last}`;
    else if (_min >= 1)
        result = `${Math.round(_min)} 分钟${last}`;
    else
        result = '1 分钟内';
    return result;
}