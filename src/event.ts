import {EventPath, EventPathList, Size} from "./geometry";
import {ExtendedUIEventProperty} from "./interfacecs";

class CloneEventInit {
    static clone<T extends EventInit>(event: Event): T {
        return Object.assign({}, event) as unknown as T;
    }
}

export class ExtendedMouseEvent extends MouseEvent {
    paths: EventPathList;

    constructor(type: string, event: Event, paths: EventPath[] = []) {
        super(type, CloneEventInit.clone(event));
        this.paths = new EventPathList(paths);
    }
}

export class ExtendedTouchEvent extends TouchEvent {
    paths: EventPathList;

    constructor(type: string, event: Event, paths: EventPath[] = []) {
        super(type, CloneEventInit.clone(event));
        this.paths = new EventPathList(paths);
    }
}

export class ExtendedUIEvent<T extends Extract<string, keyof UIEvent>, U extends ExtendedUIEventProperty> extends UIEvent {
    property: { [K in T]: U };

    constructor(type: string, event: Event, property: { [K in T]: U }) {
        super(type, CloneEventInit.clone(event));
        this.property = property;
    }
}