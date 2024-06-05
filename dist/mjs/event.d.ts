import { EventPath, EventPathList } from "./geometry";
export declare class ExtendedMouseEvent extends MouseEvent {
    paths: EventPathList;
    constructor(type: string, event: Event, paths?: EventPath[]);
}
export declare class ExtendedTouchEvent extends TouchEvent {
    paths: EventPathList;
    constructor(type: string, event: Event, paths?: EventPath[]);
}
