import { isBrowser } from './osutils';
import { isDefined, isArray } from './typeutils';

function searchString2parts(searchString: string): string[] {
    searchString = searchString || '';
    if (searchString.charAt(0) === '?' || searchString.charAt(0) === '&') {
        searchString = searchString.substr(1);
    }
    return searchString.split('&').map((param: string) => {
        if (!param) return '';
        const eqIdx = param.indexOf('=');
        const key = param.slice(0, eqIdx);
        const value = param.slice(eqIdx + 1);
        return decodeURIComponent(key) + '=' + decodeURIComponent(value);
    }).filter(p => !!p);
}
function searchString2Params(searchString: string): any {
    searchString = searchString || '';
    if (searchString.charAt(0) === '?' || searchString.charAt(0) === '&') {
        searchString = searchString.substr(1);
    }
    const result = {};
    searchString.split('&').forEach((param: string) => {
        if (!param) return;
        const eqIdx = param.indexOf('=');
        const key = decodeURIComponent(param.slice(0, eqIdx));
        const value = decodeURIComponent(param.slice(eqIdx + 1));
        if (!result[key]) {
            result[key] = value;
        } else {
            if (!isArray(result[key])) {
                result[key] = [result[key]];
            }
            result[key].push(value);
        }
    });
    return result;
}
/**
 * Gets url query params
 * @author AK
 * @returns url query params 
 */
function getUrlQueryParams(): string {
    if (!isBrowser || !window.location) return '';
    let searchString = window.location.search || '';
    if (searchString.charAt(searchString.length - 1) === '/') {
        searchString = searchString.substr(0, searchString.length - 1);
    }
    const searchs = searchString2parts(searchString);
    const hash = window.location.hash || '';
    const hashSearch = hash.indexOf('?') !== -1 ? hash.substr(hash.indexOf('?')) : '';
    const hashSearchs = searchString2parts(hashSearch)
    const params: string[] = searchs.concat(hashSearchs);
    return params.join('&');
}
export function getLocationQueryParams(): any {
    if (!isBrowser || !window.location) return {};
    let searchString = window.location.search || '';
    if (searchString.charAt(searchString.length - 1) === '/') {
        searchString = searchString.substr(0, searchString.length - 1);
    }
    const searchs = searchString2Params(searchString);
    const hash = window.location.hash || '';
    const hashSearch = hash.indexOf('?') !== -1 ? hash.substr(hash.indexOf('?')) : '';
    const hashSearchs = searchString2Params(hashSearch);
    const result = {};
    [searchs, hashSearchs].forEach(obj => {
        Object.keys(obj).forEach(key => {
            if (!result[key]) {
                result[key] = obj[key];
            } else {
                if (!isArray(result[key])) {
                    result[key] = [result[key]];
                }
                if (isArray(obj[key])) {
                    result[key] = result[key].concat(obj[key]);
                } else {
                    result[key].push(obj[key]);
                }
            }
        });
    });
    return result;
}
/**
 * Composes window query string to url
 * @author AK
 * @param url 
 * @returns window query string to url 
 */
export function composeWindowQueryStringToUrl(url: string): string {
    url = url || ';';
    // 转发额外url参数
    const paramsString = getUrlQueryParams();
    if (paramsString) {
        const ind = url.indexOf('?');
        const sep: string = ind === -1 ? '?' : (ind < url.length - 1 ? '&' : '');
        url = url + sep + paramsString;
    }
    return url;
}
/**
 * Composes query string to url
 * @author AK
 * @param [url] 
 * @param [params] 
 * @returns query string to url 
 */
export function composeQueryStringToUrl(url?: string, params?: any): string {
    url = isDefined(url) ? url + '' : '';
    url = url || '';
    let paramsStr = params ? Object.keys(params).map(key => `${key}=${params[key]}`).join('&') : '';
    if (paramsStr && url.indexOf('?') === -1) {
        return `${url}?${paramsStr}`;
    } else if (paramsStr) {
        return `${url}&${paramsStr}`;
    } else {
        return url;
    }
}

/**
 * Joins url path
 * @author AK
 * @param parts 
 * @returns url path 
 */
export function joinUrlPath(...parts: string[]): string {
    const first = parts.shift();
    return parts.reduce((p, c) => {
        c = isDefined(c) ? c + '' : '';
        c = c || '';
        if (p && p.charAt(p.length - 1) === '/') {
            p = p.substr(0, p.length - 1);
        }
        if (c && c.charAt(0) !== '/') {
            c = '/' + c;
        }
        return p + c;
    }, first + '');
}
// https|http|ftp|rtsp|mms|file
const urlRegexp = new RegExp('^(https|http|ftp|rtsp|mms|file):\/\/');
export function isUrl(value): boolean {
    return urlRegexp.test(value);
}

function basename(url: string): string {
    let idx = url.lastIndexOf('/')
    idx = idx > -1 ? idx : url.lastIndexOf('\\')
    if (idx < 0) {
        return url;
    }
    return url.substring(idx + 1);
}

function extname(url: string): string {
    const index = url.lastIndexOf('.');
    if (index !== -1) {
        return url.substr(index + 1).trim()
    } else {
        return '';
    }
}

export interface IURL {
    source: string;
    protocol: string;
    host: string;
    port: string;
    pathname: string;
    query: string;
    hash: string;
    basename: string;
    extname: string;
}

export function parseUrl(url: string): IURL {
    const source = url;
    url = (url || '').trim();
    let protocol: string, host: string, search: string, pathname: string, hash: string, match;
    if (isBrowser) {
        const a = document.createElement('a'); 
        a.href = url;
        protocol = a.protocol || '';
        host = a.host || '';
        host.charAt(host.length - 1) === '/' && (host = host.substr(0, host.length - 1));
        pathname = a.pathname || '';
        pathname.charAt(pathname.length - 1) === '/' && (pathname = pathname.substr(0, pathname.length - 1));
        search = a.search || '';
        search.charAt(search.length - 1) === '/' && (search = search.substr(0, search.length - 1));
        search && (search = search.substr(1));
        hash = a.hash;
    } else {
        match = url.match(/^(.+)\:\/\//);
        protocol = match ? match[0] : '';
        protocol && (url = url.replace(protocol, ''));
        protocol = protocol.replace('\/\/', '');
        match = (url + '/').match(/(.+?)[\?\#\s\/]/);
        host = match ? match[0] : '';
        host.charAt(host.length - 1) === '/' && (host = host.substr(0, host.length - 1));
        host && (url = url.replace(host, ''));
        match = (url + '?').match(/(.+?)[\?\#\s]/);
        pathname = match ? match[1] : '';
        pathname.charAt(pathname.length - 1) === '/' && (pathname = pathname.substr(0, pathname.length - 1));
        pathname && (url = url.replace(pathname, ''));
        match = (url + '/').match(/\?(.+?)[\/\s]/);
        search = match ? match[0] : '';
        search.charAt(search.length - 1) === '/' && (search = search.substr(0, search.length - 1));
        search && (url = url.replace(search, ''));
        search && (search = search.substr(1));
        match = url.match(/\#\/(.*)/);
        hash = match ? match[0] : '';
    }
    const hosts = host.split(':');
    return {
        source: source,
        protocol: protocol,
        host: hosts.length === 2 ? hosts[0] : host,
        port: hosts.length === 2 ? hosts[1] : '',
        pathname: pathname,
        query: search,
        hash: hash,
        basename: basename(pathname),
        extname: extname(pathname),
    }
}