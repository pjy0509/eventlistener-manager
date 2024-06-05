export declare class PathDirection {
    static 'U': number;
    static 'UR': number;
    static 'R': number;
    static 'DR': number;
    static 'D': number;
    static 'DL': number;
    static 'L': number;
    static 'UL': number;
    static 'Unknown': number;
    static get4Direction(degree: number): number;
    static get8Direction(degree: number): number;
}
export declare class EventPosition {
    readonly x: number;
    readonly y: number;
    readonly t: number;
    constructor(...args: any);
    static fromMouseEvent(event: Event): EventPosition;
    static fromTouchEvent(event: Event, n?: number): EventPosition;
    static fromCoordinate(x: number, y: number): EventPosition;
    static center(p1: EventPosition, p2: EventPosition): EventPosition;
    distance(to: EventPosition): number;
    timeDiff(to: EventPosition): number;
}
export declare class EventPath {
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
    readonly direction: PathDirection;
    constructor(p1: EventPosition, p2: EventPosition);
    equals(other: EventPath): boolean;
}
export declare class EventPathList extends Array<EventPath> {
    readonly first: EventPath | undefined;
    readonly last: EventPath | undefined;
    constructor(paths: EventPath[]);
    item(n: number): EventPath | undefined;
    private dPath;
    private dNumber;
    dStart(index: number): EventPath | undefined;
    dEnd(index: number): EventPath | undefined;
    dCenter(index: number): EventPath | undefined;
    dDistance(index: number): number | undefined;
    dRadian(index: number): number | undefined;
    dDegree(index: number): number | undefined;
}
