import {ExtendedUIEventProperty} from "./interfacecs";

export class Direction {
    static 'U' = 0
    static 'UR' = 1
    static 'R' = 2
    static 'DR' = 3
    static 'D' = 4
    static 'DL' = 5
    static 'L' = 6
    static 'UL' = 7
    static 'Unknown' = -1

    static get4Direction(degree: number) {
        if (degree >= 0 && degree <= 45) return Direction.R;
        if (degree > 45 && degree <= 135) return Direction.D;
        if (degree > 135 && degree <= 180) return Direction.L;
        if (degree >= -180 && degree <= -135) return Direction.L;
        if (degree > -135 && degree <= -45) return Direction.U;
        if (degree > -45 && degree <= -0) return Direction.R;

        return Direction.Unknown;
    }

    static get8Direction(degree: number) {
        if (degree >= 0 && degree <= 22.5) return Direction.R;
        if (degree > 22.5 && degree <= 67.5) return Direction.DR;
        if (degree > 67.5 && degree <= 112.5) return Direction.D;
        if (degree > 112.5 && degree <= 157.5) return Direction.DL;
        if (degree > 157.5 && degree <= 180) return Direction.L;
        if (degree >= -180 && degree <= -157.5) return Direction.L;
        if (degree > -157.5 && degree <= -112.5) return Direction.UL;
        if (degree > -112.5 && degree <= -67.5) return Direction.U;
        if (degree > -67.5 && degree <= -22.5) return Direction.UR;
        if (degree > -22.5 && degree <= -0) return Direction.R;

        return Direction.Unknown;
    }
}

export class EventPosition {
    readonly x: number;
    readonly y: number;
    readonly t: number;

    constructor(...args: any) {
        this.t = new Date().getTime();

        const arg0 = args[0];
        const arg1 = args[1];

        if (arg0 instanceof MouseEvent) {
            this.x = arg0.clientX;
            this.y = arg0.clientY;
        } else if (arg0 instanceof TouchEvent && typeof arg1 === 'number' && arg0.touches.length > arg1) {
            this.x = arg0.touches[arg1].clientX;
            this.y = arg0.touches[arg1].clientY;
        } else if (typeof arg0 === 'number' && typeof arg1 === 'number') {
            this.x = arg0;
            this.y = arg1;
        } else {
            this.x = NaN;
            this.y = NaN;
        }
    }

    static fromMouseEvent(event: Event): EventPosition {
        return new EventPosition(event);
    }

    static fromTouchEvent(event: Event, n: number = 0): EventPosition {
        return new EventPosition(event, n);
    }

    static fromCoordinate(x: number, y: number): EventPosition {
        return new EventPosition(x, y);
    }

    static center(p1: EventPosition, p2: EventPosition): EventPosition {
        return new EventPosition((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    }

    distance(to: EventPosition): number {
        const dx = this.x - to.x;
        const dy = this.y - to.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    timeDiff(to: EventPosition): number {
        return Math.abs(this.t - to.t);
    }
}

export class EventPath {
    readonly start: EventPosition;
    readonly end: EventPosition;
    readonly center: EventPosition;
    readonly dx: number;
    readonly dy: number;
    readonly distance: number;
    readonly speed: number;
    readonly time: number;
    readonly radian: number;
    readonly degree: number;
    readonly direction: Direction;

    constructor(p1: EventPosition, p2: EventPosition) {
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
        this.direction = Direction.get8Direction(this.degree);
    }

    equals(other: EventPath) {
        return this.start.x === other.start.x && this.end.x === other.end.x && this.start.y === other.start.y && this.end.y === other.end.y;
    }
}

export class EventPathList extends Array<EventPath> {
    readonly first: EventPath | undefined;
    readonly last: EventPath | undefined;

    constructor(paths: EventPath[]) {
        super();
        if (paths.length > 0) {
            this.push(...paths);
            this.first = paths[0];
            this.last = paths[this.length - 1];
        }
    }

    item(n: number): EventPath | undefined {
        if (this.length > n) {
            return this[n];
        }
        return;
    }

    private dPath(index: number, property: keyof EventPath) {
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

    private dNumber(index: number, property: keyof EventPath) {
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

    dStart(index: number) {
        return this.dPath(index, 'start');
    }

    dEnd(index: number) {
        return this.dPath(index, 'end');
    }

    dCenter(index: number) {
        return this.dPath(index, 'center');
    }

    dDistance(index: number) {
        return this.dNumber(index, 'distance');
    }

    dRadian(index: number) {
        return this.dNumber(index, 'radian');
    }

    dDegree(index: number) {
        return this.dNumber(index, 'degree');
    }
}

export class Appearance implements ExtendedUIEventProperty {
    static Dark = 0;
    static Light = 1;
}

export class Orientation implements ExtendedUIEventProperty {
    static Portrait = 0;
    static Landscape = 1;
}

export class Size implements ExtendedUIEventProperty {
    width: number;
    height: number;

    constructor(target: any) {
        this.width = target.outerWidth || target.offsetWidth || target.width || NaN;
        this.height = target.outerHeight || target.offsetHeight || target.height || NaN;
    }
}