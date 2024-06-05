"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventPathList = exports.EventPath = exports.EventPosition = exports.PathDirection = void 0;
class PathDirection {
    static get4Direction(degree) {
        if (degree >= 0 && degree <= 45)
            return PathDirection.R;
        if (degree > 45 && degree <= 135)
            return PathDirection.D;
        if (degree > 135 && degree <= 180)
            return PathDirection.L;
        if (degree >= -180 && degree <= -135)
            return PathDirection.L;
        if (degree > -135 && degree <= -45)
            return PathDirection.U;
        if (degree > -45 && degree <= -0)
            return PathDirection.R;
        return PathDirection.Unknown;
    }
    static get8Direction(degree) {
        if (degree >= 0 && degree <= 22.5)
            return PathDirection.R;
        if (degree > 22.5 && degree <= 67.5)
            return PathDirection.DR;
        if (degree > 67.5 && degree <= 112.5)
            return PathDirection.D;
        if (degree > 112.5 && degree <= 157.5)
            return PathDirection.DL;
        if (degree > 157.5 && degree <= 180)
            return PathDirection.L;
        if (degree >= -180 && degree <= -157.5)
            return PathDirection.L;
        if (degree > -157.5 && degree <= -112.5)
            return PathDirection.UL;
        if (degree > -112.5 && degree <= -67.5)
            return PathDirection.U;
        if (degree > -67.5 && degree <= -22.5)
            return PathDirection.UR;
        if (degree > -22.5 && degree <= -0)
            return PathDirection.R;
        return PathDirection.Unknown;
    }
}
exports.PathDirection = PathDirection;
PathDirection['U'] = 0;
PathDirection['UR'] = 1;
PathDirection['R'] = 2;
PathDirection['DR'] = 3;
PathDirection['D'] = 4;
PathDirection['DL'] = 5;
PathDirection['L'] = 6;
PathDirection['UL'] = 7;
PathDirection['Unknown'] = -1;
class EventPosition {
    constructor(...args) {
        this.t = window.performance.now();
        const arg0 = args[0];
        const arg1 = args[1];
        if (arg0 instanceof MouseEvent) {
            this.x = arg0.clientX;
            this.y = arg0.clientY;
        }
        else if (arg0 instanceof TouchEvent && typeof arg1 === 'number' && arg0.touches.length > arg1) {
            this.x = arg0.touches[arg1].clientX;
            this.y = arg0.touches[arg1].clientY;
        }
        else if (typeof arg0 === 'number' && typeof arg1 === 'number') {
            this.x = arg0;
            this.y = arg1;
        }
        else {
            this.x = NaN;
            this.y = NaN;
        }
    }
    static fromMouseEvent(event) {
        return new EventPosition(event);
    }
    static fromTouchEvent(event, n = 0) {
        return new EventPosition(event, n);
    }
    static fromCoordinate(x, y) {
        return new EventPosition(x, y);
    }
    static center(p1, p2) {
        return new EventPosition((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    }
    distance(to) {
        const dx = this.x - to.x;
        const dy = this.y - to.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    timeDiff(to) {
        return Math.abs(this.t - to.t);
    }
}
exports.EventPosition = EventPosition;
class EventPath {
    constructor(p1, p2) {
        this.start = p1;
        this.end = p2;
        this.center = EventPosition.center(p1, p2);
        this.dx = p2.x - p1.x;
        this.dy = p2.y - p1.y;
        this.distance = p2.distance(p1);
        this.time = p2.t - p1.t;
        this.speed = this.distance / this.time;
        this.radian = Math.atan2(this.dy, this.dx);
        this.degree = this.radian * (180 / Math.PI);
        this.direction = PathDirection.get8Direction(this.degree);
    }
    equals(other) {
        return this.start.x === other.start.x && this.end.x === other.end.x && this.start.y === other.start.y && this.end.y === other.end.y;
    }
}
exports.EventPath = EventPath;
class EventPathList extends Array {
    constructor(paths) {
        super();
        if (paths.length > 0) {
            this.push(...paths);
            this.first = paths[0];
            this.last = paths[this.length - 1];
        }
    }
    item(n) {
        if (this.length > n) {
            return this[n];
        }
        return;
    }
    dPath(index, property) {
        if (index < 1) {
            return;
        }
        const item1 = this.item(index);
        const item2 = this.item(index - 1);
        if (item1 && item2) {
            const value1 = item1[property];
            const value2 = item2[property];
            if (value1 instanceof EventPosition && value2 instanceof EventPosition) {
                return new EventPath(value1, value2);
            }
        }
        return;
    }
    dNumber(index, property) {
        if (index < 1) {
            return;
        }
        const item1 = this.item(index);
        const item2 = this.item(index - 1);
        if (item1 && item2) {
            const value1 = item1[property];
            const value2 = item2[property];
            if (typeof value1 === 'number' && typeof value2 === 'number') {
                return value2 - value1;
            }
        }
        return;
    }
    dStart(index) {
        return this.dPath(index, 'start');
    }
    dEnd(index) {
        return this.dPath(index, 'end');
    }
    dCenter(index) {
        return this.dPath(index, 'center');
    }
    dDistance(index) {
        return this.dNumber(index, 'distance');
    }
    dRadian(index) {
        return this.dNumber(index, 'radian');
    }
    dDegree(index) {
        return this.dNumber(index, 'degree');
    }
}
exports.EventPathList = EventPathList;
