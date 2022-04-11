import { globalCache } from "./cacheutils";
import { isDefined } from "./typeutils";

/* tslint:disable */
const mathMin = Math.min;
const mathMax = Math.max;
const mathAbs = Math.abs;

const rgbaArrayCache = globalCache('parsed_rgba_color_array_cache');

export function rgbaFadePair(start, end, spread) {
    var Rs = getSpread(start[0], end[0], spread);
    var Gs = getSpread(start[1], end[1], spread);
    var Bs = getSpread(start[2], end[2], spread);
    var Alphas = getSpread(start[3], end[3], spread);
    return [Rs, Gs, Bs, Alphas]
};
export function getSpread(start, end, fidelity) {
    var minVal = Math.min(start, end);
    var maxVal = Math.max(start, end);
    var difference = maxVal - minVal;
    var iterator = difference / (fidelity-1);
    var out = [minVal];
    var step = minVal;
    for (var e = 1; e < fidelity; e++) {
        step += iterator;
        out.push(step);
    }
    if (start > end) {
        out.reverse()
    }
    return out;
};

export function rgbaFadeSet(parts){
	var out = [[],[],[],[]];//rgba
	for(var i = 0; i<parts.length; i){
		var start = parts[i];
		if(i == parts.length-1){
			break;
		}
		var span = parts[i+1];
		var end = parts[i+2];
		var result = rgbaFadePair(start,end,span);
		for(var j=0 ; j<4; j++){
			out[j] = out[j].concat(result[j]);
		}
		i = i+2;
	}
	return out;
}
export function convertMeasuresToColors(valuearr, colorSet, minMax, f){
	var arr = [].concat(valuearr);
	if(minMax!=undefined){
		arr.push(minMax[0]);
		arr.push(minMax[1]);
	}
	var maxVal = Math.max.apply(Math, arr);
    var minVal = Math.min.apply(Math, arr);
    let i;
	if(minVal<0){
		for(i in arr){
			arr[i] = arr[i] + Math.abs(minVal);
		}
		maxVal = maxVal + Math.abs(minVal);
	}
	if(minVal>0){
		for(i in arr){
			arr[i] = arr[i] - (minVal);
		}
		maxVal = maxVal - (minVal);
	}
	var out = [];
	for(i = 0; i < arr.length; i++){
		var position = Math.round((arr[i]/maxVal)*(colorSet[0].length-1));
		var rgb = "";
		var r = Math.round(colorSet[0][position]);
		var g = Math.round(colorSet[1][position]);
		var b = Math.round(colorSet[2][position]);
		var a = Math.round(colorSet[3][position]);
		if(f == undefined){
			out.push(rgbToCSSRGB(r,g,b,a));
		}else{
			out.push(f(r,g,b,a));
		}
	}

	if(minMax != undefined){
		out = out.slice(0, out.length-2);
	}
	return out;
}

export function convertRGBAArrays(colorSet, f){
	var len = colorSet[0].length;
	if(f == undefined){
		f = rgbToCSSRGB;
	}
	var out = [];
	for(var i=0; i < len; i++){
		var rgba = "";
		var r = Math.round(colorSet[0][i]);
		var g = Math.round(colorSet[1][i]);
		var b = Math.round(colorSet[2][i]);
		var a = Math.round(colorSet[3][i]);
		out.push(f(r,g,b,a));
	}
	return out;
}
export function convertRGBAArray(color, f){
	if(f == undefined){
		f = rgbToCSSRGB;
	}
	var rgba = "";
	var r = Math.round(color[0]);
	var g = Math.round(color[1]);
	var b = Math.round(color[2]);
	var a = Math.round(color[3]);
	return f(r,g,b,a);
}

export const defaultOpacity = 1;
export const pepGreen = [142, 196, 73, 255 * defaultOpacity];
export const pepYellow =  [254, 232, 75, 255 * defaultOpacity];
export const pepBlue = [21, 137, 208, 255 * defaultOpacity];
export const pepRed = [255, 0, 0, 255 * defaultOpacity];

export function rgbToHex(r, g, b, a) {
    return toHex(r) + toHex(g) + toHex(b) + toHex(a);
};
export function rgbToXHex(r, g, b) {
    return "0x" + toHex(r) + toHex(g) + toHex(b);
};
export function rgbToHexPound(r, g, b) {
    return "#" + toHex(r) + toHex(g) + toHex(b);
};
// 0 ~ 255
export function rgbToCSSRGB(r, g, b, a) {
    return "rgba(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + "," + (Math.round(a) / 255) + ")";
};
export function rgbToHexForKML(r, g, b, a) {
    return toHex(a) + toHex(g) + toHex(b) + toHex(r);
};
// h: 0 ~ 255, s: 0 ~ 255, v: 0 ~ 255
export function hsvToRgb(h, s, v) {
    h = normalizeColorValue(h, 360) * 6 / 360;
    s = Math.min(100, Math.max(0, s)) / 100;
    v = Math.min(100, Math.max(0, v)) / 100;

    let i = Math.floor(h),
        f = h - i,
        p = v * (1 - s),
        q = v * (1 - f * s),
        t = v * (1 - (1 - f) * s),
        mod = i % 6,
        r = [v, q, p, p, t, v][mod],
        g = [t, v, v, q, p, p][mod],
        b = [p, p, t, v, v, q][mod];
    return [r * 255, g * 255, b * 255];
}
// r: 0 ~ 255, g: 0 ~ 255, b: 0 ~ 255
export function rgbToHsv(r, g, b) {
    r = Math.min(255, Math.max(0, r)) / 255;
    g = Math.min(255, Math.max(0, g)) / 255;
    b = Math.min(255, Math.max(0, b)) / 255;

    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max === 0 ? 0 : d / max;

    if(max == min) {
        h = 0; // achromatic
    }
    else {
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, v * 100];
}
// h: 0 ~ 360, s: 0 ~ 100, v: 0 ~ 100
export function hsvToHsl(h, s, v) {
    const rgb = hsvToRgb(h, s, v);
    return rgbToHsl(rgb[0], rgb[1], rgb[2]);
}
// h: 0 ~ 360, s: 0 ~ 100, l: 0 ~ 100
export function hslToHsv(h, s, l) {
    const rgb = hslToRgb(h, s, l);
    return rgbToHsv(rgb[0], rgb[1], rgb[2]);
}
export function toHex(n) {
	n = parseInt(n, 10);
	if (isNaN(n)) {
		return "00"
	}
	n = Math.max(0, Math.min(n, 255));
	var base = "0123456789ABCDEF";
	return base.charAt((n - n % 16) / 16) + base.charAt(n % 16)
};

export function to255(n) {
	return parseInt(n, 16)
};
export function xHexto255(h) {
	h = h.split("0x")[1].toString();
	var r = to255(h.substring(0, 2));
	var g = to255(h.substring(2, 4));
	var b = to255(h.substring(4, 6));
	var a = to255(h.substring(6, 8));
	return rgbToCSSRGB(r, g, b, a);
};
export function xHextoRGBAArray(h) {
	h = h.split("0x")[1].toString();
	var r = to255(h.substring(0, 2));
	var g = to255(h.substring(2, 4));
	var b = to255(h.substring(4, 6));
	var a = to255(h.substring(6, 8));
	return [r, g, b, a];
};
export function cssHextoRGBAArray(h) {
	h = h.split("#")[1].toString();
	var r = to255(h.substring(0, 2));
	var g = to255(h.substring(2, 4));
	var b = to255(h.substring(4, 6));
    var a = to255(h.substring(6, 8));
    if (isNaN(a)) {
        a = 255;
    }
	return [r, g, b, a];
};
export function convertCSSrgbToHex(str){
	str = str.toString().toLowerCase();
	var rgb = str.split("(")[1].split(")")[0].split(" ").join("").split(",");
	var r = toHex(Number(rgb[0]));
	var g = toHex(Number(rgb[1]));
	var b = toHex(Number(rgb[2]));
	return "#"+r+g+b;
}
export function rgbaCSStoXHex(str){
  var r = str.split(  "rgba("  )[1].split(",")[0];
  var g = str.split(",")[1];
  var b = str.split(",")[2].split("]")[0];
  return Number(rgbToXHex(r, g, b));
}

export function rgbaCSStoRGBAArray(str){
  //rgba(255,127,153,0.5)
  var r = Number(str.split(  "rgba("  )[1].split(",")[0]);
  var g = Number(str.split(",")[1]);
  var b = Number(str.split(",")[2]);//.split("]")[0];
  var a = Number(str.split(",")[3].split(")")[0]);
  return [r,g,b,a*255];
}

export function toRGBAArray(str) {
    if (!str) return [0,0,0,0];
    if (rgbaArrayCache[str]) return rgbaArrayCache[str];
    if (str.charAt(0) === '#') {
        if (str.length === 4) {
            const arr = str.split('');
            arr[1] = arr[1] + '' + arr[1];
            arr[2] = arr[2] + '' + arr[2];
            arr[3] = arr[3] + '' + arr[3];
            str = arr.join('');
        }
        rgbaArrayCache[str] = cssHextoRGBAArray(str);
    } else if (str.indexOf('0x') === 0) {
        rgbaArrayCache[str] = xHextoRGBAArray(str);
    } else if (str.indexOf('rgb(') === 0) {
        rgbaArrayCache[str] = rgbaCSStoRGBAArray(str.replace('rgb(', 'rgba(').replace(')', ',1)'));
    } else if (str.indexOf('rgba(') === 0) {
        rgbaArrayCache[str] = rgbaCSStoRGBAArray(str);
    } else {
        rgbaArrayCache[str] = [0,0,0,0];
    }
    return rgbaArrayCache[str];
}

export function toRGBAColor(str): string {
    if (!str) return 'rgba(0,0,0,0)';
    let arr;
    if (str.charAt(0) === '#') {
        if (str.length === 4) {
            const arr = str.split('');
            arr[1] = arr[1] + '' + arr[1];
            arr[2] = arr[2] + '' + arr[2];
            arr[3] = arr[3] + '' + arr[3];
            str = arr.join('');
        }
        arr = cssHextoRGBAArray(str);
        return rgbToCSSRGB(arr[0], arr[1], arr[2], arr[3]);
    } else if (str.indexOf('0x') === 0) {
        arr = xHextoRGBAArray(str);
        return rgbToCSSRGB(arr[0], arr[1], arr[2], arr[3]);
    } else if (str.indexOf('rgb(') === 0) {
        return str.replace('rgb(', 'rgba(').replace(')', ',1)');
    } else if (str.indexOf('rgba(') === 0) {
        return str;
    } else {
        return 'rgba(0,0,0,0)';
    }
}

export function toHexColor(str): string {
    if (!str) return '#000000';
    let arr;
    if (str.charAt(0) === '#') {
        return str;
    } else if (str.indexOf('0x') === 0) {
        arr = xHextoRGBAArray(str);
        return rgbToHexPound(arr[0], arr[1], arr[2]);
    } else if (str.indexOf('rgb(') === 0) {
        arr = rgbaCSStoRGBAArray(str.replace('rgb(', 'rgba(').replace(')', ',1)'));
        return rgbToHexPound(arr[0], arr[1], arr[2]);
    } else if (str.indexOf('rgba(') === 0) {
        arr = rgbaCSStoRGBAArray(str);
        return rgbToHexPound(arr[0], arr[1], arr[2]);
    } else {
        return '#000000';
    }
}

// pos: 0~1
export function pickOneColor(color1, color2, pos) {
    const rgba1 = toRGBAArray(color1);
    const rgba2 = toRGBAArray(color2);
    return rgbToCSSRGB(
        rgba1[0] + mathMax(0, mathMin(rgba2[0] - rgba1[0], 255)) * pos,
        rgba1[1] + mathMax(0, mathMin(rgba2[1] - rgba1[1], 255)) * pos,
        rgba1[2] + mathMax(0, mathMin(rgba2[2] - rgba1[2], 255)) * pos,
        rgba1[3] + mathMax(0, mathMin(rgba2[3] - rgba1[3], 255)) * pos,
    )
}

// amount: 0~100
export function lightenColor (color, amount?) {
    amount = (amount === 0) ? 0 : (amount || 5);
    const rgba = toRGBAArray(color);
    const hsl = rgbToHsl(rgba[0], rgba[1], rgba[2]);
    
    hsl[2] = hsl[2] + amount;
    hsl[2] = mathMin(100, mathMax(0, hsl[2]));
    const rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
    return rgbToCSSRGB(rgb[0], rgb[1], rgb[2], rgba[3]);
}
export function darkenColor(color, amount?) {
    amount = (amount === 0) ? 0 : (amount || 5);
    const rgba = toRGBAArray(color);
    const hsl = rgbToHsl(rgba[0], rgba[1], rgba[2]);
    
    hsl[2] = hsl[2] - amount;
    hsl[2] = mathMin(100, mathMax(0, hsl[2]));
    const rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
    return rgbToCSSRGB(rgb[0], rgb[1], rgb[2], rgba[3]);
}
export function highlightColor(color, amount?) {
    amount = (amount === 0) ? 0 : (amount || 5);
    const rgba = toRGBAArray(color);
    const hsl = rgbToHsl(rgba[0], rgba[1], rgba[2]);
    if (hsl[2] > 65) {
        hsl[2] = Math.min(hsl[2] - amount, 65);
    } else {
        hsl[2] = hsl[2] + amount;
    }
    hsl[2] = mathMin(100, mathMax(0, hsl[2]));
    const rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
    return rgbToCSSRGB(rgb[0], rgb[1], rgb[2], rgba[3]);
}
/**
 * Mixs color alpha 叠加指定颜色的alpha(0~1)值
 * @author AK
 * @param color 
 * @param alpha 
 * @returns  
 */
export function mixColorAlpha(color, alpha) {
    const baseColor = toRGBAArray(color);
    const a = baseColor[3];
    return rgbToCSSRGB(baseColor[0], baseColor[1], baseColor[2], a * alpha);
}

/**
 * change color alpha to 改变指定颜色的alpha
 * @author AK
 * @param color 
 * @param alpha 
 * @returns  
 */
export function changeColorAlpha(color, alpha) {
    const baseColor = toRGBAArray(color);
    alpha = alpha * 255;
    return rgbToCSSRGB(baseColor[0], baseColor[1], baseColor[2], alpha);
}

// 0, 255 => [0~360, 0~100, 0~100]
export function rgbToHsl(r, g, b) {
    r = bound(r, 255);
    g = bound(g, 255);
    b = bound(b, 255);
    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min) {
        h = s = 0; // achromatic
    }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return [ h * 360, s * 100, l * 100 ];
}

// [0~360, 0~100, 0~100] => [0, 255]
export function hslToRgb(h, s, l) {
    var r, g, b;
    h = bound(h, 360);
    s = bound(s, 100);
    l = bound(l, 100);

    function hue2rgb(p, q, t) {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    if(s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}

// [0, n] => [0, 1]
function bound(n, max) {
    n = mathMin(max, mathMax(0, parseFloat(n)));
    if ((Math.abs(n - max) < 0.000001)) { return 1; }
    return (n % max) / parseFloat(max);
}

export function equals(color1: string, color2: string) {
    if (!color1 || !color2) return false;
    const rgba1 = toRGBAArray(color1);
    const rgba2 = toRGBAArray(color2);
    return rgba1[0] === rgba2[0]
        && rgba1[1] === rgba2[1]
        && rgba1[2] === rgba2[2]
        && rgba1[3] === rgba2[3];
}

export function gradientHex(from: string, to: string, step: number): string[] {
    const fromArr = toRGBAArray(from);
    const toArr = toRGBAArray(to);
    const result = [];
    for (let i = 0; i < step; i++) {
        result.push(rgbToHexPound(
            fromArr[0] + (toArr[0] - fromArr[0]) / step,
            fromArr[1] + (toArr[1] - fromArr[1]) / step,
            fromArr[2] + (toArr[2] - fromArr[2]) / step,
        ));
    }
    return result;
}

export function gradientRgba(from: string, to: string, step: number): string[] {
    const fromArr = toRGBAArray(from);
    const toArr = toRGBAArray(to);
    const result = [];
    for (let i = 0; i < step; i++) {
        result.push(rgbToCSSRGB(
            fromArr[0] + (toArr[0] - fromArr[0]) / step,
            fromArr[1] + (toArr[1] - fromArr[1]) / step,
            fromArr[2] + (toArr[2] - fromArr[2]) / step,
            fromArr[3] + (toArr[3] - fromArr[3]) / step,
        ));
    }
    return result;
}

export function gradientRgbaBy(from: string, to: string, percent: number): string {
    const fromArr = toRGBAArray(from);
    const toArr = toRGBAArray(to);
    return rgbToCSSRGB(
        fromArr[0] + (toArr[0] - fromArr[0]) * percent,
        fromArr[1] + (toArr[1] - fromArr[1]) * percent,
        fromArr[2] + (toArr[2] - fromArr[2]) * percent,
        fromArr[3] + (toArr[3] - fromArr[3]) * percent,
    );
}
// percent 0 ~ 1
export function linearGradientRgbaBy(from: string, to: string, percent: number): string {
    const fromArr = toRGBAArray(from);
    const fromHsl = rgbToHsl(fromArr[0], fromArr[1], fromArr[2]);
    const toArr = toRGBAArray(to);
    const toHsl = rgbToHsl(toArr[0], toArr[1], toArr[2]);
    // [0~360, 0~100, 0~100] => [0, 255]
    const rgb = hslToRgb(
        fromHsl[0] + (toHsl[0] - fromHsl[0]) * percent,
        fromHsl[1] + (toHsl[1] - fromHsl[1]) * percent,
        fromHsl[2] + (toHsl[2] - fromHsl[2]) * percent,
    );
    const alpha = fromArr[3] + (toArr[3] - fromArr[3]) * percent;
    return rgbToCSSRGB(rgb[0], rgb[1], rgb[2], alpha * 255);
}

export function gradientRgbaFromArray(colors: string[], percent: number): string {
    if (!colors || !colors.length) return null;
    if (colors.length <= 1) return colors[0];
    if (!percent) return colors[0];
    if (percent >= 1) return colors[colors.length -1];
    const ratio = 1 / (colors.length - 1);
    let rr = percent / ratio;
    if (rr < 0) {
        return gradientRgbaBy(colors[0], colors[1], rr);
    } else {
        const index = Math.floor(rr);
        rr = rr - index;
        if (!rr) return colors[index];
        return gradientRgbaBy(colors[index], colors[index + 1], rr);
    }
}

function normalizeColorValue(value: number, max: number = 1, min: number = 0): number {
    const range = max - min;
    value = value % range;
    return value < 0 ? min + range + value : min + value;
}

// 线性色环（red, yellow, lime, aqua, blue, magenta）数列
const templateHues = [0, 0, 15, 8, 30, 17, 45, 26, 60, 34, 75, 41, 90, 48, 105, 54, 120, 60, 135, 81, 150, 103, 165, 123, 180, 138, 195, 155, 210, 171, 225, 187, 240, 204, 255, 219, 270, 234, 285, 251, 300, 267, 315, 282, 330, 298, 345, 329, 360, 360];
export function wheelHueToHue(hue) {
    for (let i = 0; i < templateHues.length - 2; i += 2) {
        const h1 = templateHues[i];
        const h2 = templateHues[i + 1];
        const h3 = templateHues[i + 2];
        const h4 = templateHues[i + 3];
        if (hue <= h3 && hue >= h1) {
            return h2 + (h4 - h2) * (hue - h1) / (h3 - h1)
        }
    }
}

export const colorWheel360Hues: number[] = [];
for (let i = 0; i <= 360; i += 1) {
    // colorWheel360Hues.push(i);
    colorWheel360Hues.push(wheelHueToHue(i));
}
export function wheelHueToHueFast(hue: number) {
    if (!hue) return 0;
    hue = Math.round(normalizeColorValue(hue, 360));
    return Math.round(colorWheel360Hues[hue]);
}

export function hueToWheelHueFast(hue: number) {
    if (!hue) return 0;
    if (hue === 360) return 360;
    const indexRange = [0, 360];
    let medianIndex, median;
    while (indexRange[0] !== indexRange[1] && indexRange[1] - indexRange[0] > 1) {
        medianIndex = indexRange[0] + Math.floor((indexRange[1] - indexRange[0]) / 2);
        median = colorWheel360Hues[medianIndex];
        if (hue === median) return medianIndex;
        if (hue > median) {
            // 向后计算
            indexRange[0] = medianIndex;
        } else {
            // 向前计算
            indexRange[1] = medianIndex;
        }
    }
    if (Math.round(hue) === Math.round(colorWheel360Hues[indexRange[0]])) return indexRange[0];
    return indexRange[1];
}

/**
 * 从标准色环的指定位置取出一个颜色
 * @param hue 色相值 0 ~ 360
 * @param saturation 饱和度 0 ~ 100 默认100
 * @param lightness 明度 0 ~ 100。默认为90
 * @param alpha 颜色透明度 0 ~ 1。默认为1
 */
export function linearGradientFromColorWheel(hue: number, saturation: number = 100, lightness: number = 50, alpha: number = 1) {
    hue = wheelHueToHueFast(normalizeColorValue(hue, 360));
    saturation = Math.min(100, Math.max(0, saturation));
    lightness = Math.min(100, Math.max(0, lightness));
    alpha = Math.min(100, Math.max(0, alpha));
    const rgb = hslToRgb(hue, saturation, lightness);
    
    return rgbToCSSRGB(rgb[0], rgb[1], rgb[2], alpha * 255);
}

/**
 * 从标准色环中均匀的取出多个颜色
 * @param count 要取出颜色的数量
 * @param hue 起始色相值
 * @param saturation 饱和度 0 ~ 100 默认100
 * @param lightness 明度 0 ~ 100。默认为90
 * @param alpha 颜色透明度 0 ~ 1。默认为1
 */
 export function linearGradientPalleteFromColorWheel(count: number, hue: number = 0, saturation: number = 100, lightness: number = 50, alpha: number = 1): string[] {
    if (count <= 0) return [];
    const colors = [];
    const distance = 360 / count;
    for (let i = 0; i < count; i++) {
        colors.push(linearGradientFromColorWheel(hue + distance * i, saturation, lightness, alpha));
    }
    return colors;
}

/**
 * 从标准色环中特定的范围内，均匀的取出多个颜色
 * @param count 要取出颜色的数量
 * @param fromHue 起点色相值
 * @param toHue 重点色相值
 * @param saturation 饱和度 0 ~ 100 默认100
 * @param lightness 明度 0 ~ 100。默认为90
 * @param alpha 颜色透明度 0 ~ 1。默认为1
 */
 export function linearGradientRangeFromColorWheel(count: number, fromHue: number, toHue: number, saturation: number = 100, lightness: number = 50, alpha: number = 1): string[] {
    if (count <= 0) return [];
    fromHue = normalizeColorValue(fromHue, 360);
    toHue = normalizeColorValue(toHue, 360);
    if (toHue < fromHue) {
        toHue += 360;
    }
    const colors = [];
    const distance = (toHue - fromHue) / count;
    for (let i = 0; i < count; i++) {
        colors.push(linearGradientFromColorWheel(fromHue + distance * i, saturation, lightness, alpha));
    }
    return colors;
}