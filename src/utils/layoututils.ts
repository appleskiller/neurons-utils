
export type Size = {width: number, height: number};
export type Box = {x: number, y: number, width: number ,height: number};
export type Position = 'top' | 'left' | 'right' | 'bottom' 
    | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' 
    | 'center' | 'inside'
    | 'insideTop' | 'insideBottom' | 'insideLeft' | 'insideRight' 
    | 'insideTopLeft' | 'insideTopRight' | 'insideBottomLeft' | 'insideBottomRight';

export function positionToBox(size: Size, box: Box, position: Position, distance?: number): {x: number, y: number} {
    distance = distance || 0;
    position = position || 'center';
    const width = size.width, height = size.height;
    const halfWidth = Math.ceil(width / 2), halfHeight = Math.ceil(height / 2);
    const connectedCenterX = Math.ceil(box.x + box.width / 2), connectedCenterY = Math.ceil(box.y + box.height / 2);
    let ox, oy;
    switch (position) {
        case 'top':
            ox = connectedCenterX - halfWidth;
            oy = box.y - height - distance;
            break;
        case 'left':
            ox = box.x - width - distance;
            oy = connectedCenterY - halfHeight;
            break;
        case 'right':
            ox = box.x + box.width + distance;
            oy = connectedCenterY - halfHeight;
            break;
        case 'topLeft':
            ox = box.x - width - distance;
            oy = box.y - height - distance;
            break;
        case 'topRight':
            ox = box.x + box.width + distance;
            oy = box.y - height - distance;
            break;
        case 'bottomLeft':
            ox = box.x - width - distance;
            oy = box.y + box.height + distance;
            break;
        case 'bottomRight':
            ox = box.x + box.width + distance;
            oy = box.y + box.height + distance;
            break;
        case 'center':
        case 'inside':
            ox = connectedCenterX - halfWidth;
            oy = connectedCenterY - halfHeight;
            break;
        case 'insideTop':
            ox = connectedCenterX - halfWidth;
            oy = box.y + distance;
            break;
        case 'insideBottom':
            ox = connectedCenterX - halfWidth;
            oy = box.y + box.height - height - distance;
            break;
        case 'insideLeft':
            ox = box.x + distance;
            oy = connectedCenterY - halfHeight;
            break;
        case 'insideRight':
            ox = box.x + box.width - width - distance;
            oy = connectedCenterY - halfHeight;
            break;
        case 'insideTopLeft':
            ox = box.x + distance;
            oy = box.y + distance;
            break;
        case 'insideTopRight':
            ox = box.x + box.width - width - distance;
            oy = box.y + distance;
            break;
        case 'insideBottomLeft':
            ox = box.x + distance;
            oy = box.y + box.height - height - distance;
            break;
        case 'insideBottomRight':
            ox = box.x + box.width - width - distance;
            oy = box.y + box.height - height - distance;
            break;
        // bottom
        default:
            ox = connectedCenterX - halfWidth;
            oy = box.y + box.height + distance;
            break;
    }
    return {
        x: ox,
        y: oy,
    }
}

