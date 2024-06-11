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

export class ExtendedUIEvent<T extends ExtendedUIEventProperty> extends UIEvent {
    appearance: T;

    constructor(type: string, event: Event, appearance: T) {
        super(type, CloneEventInit.clone(event));
        this.appearance = appearance;
    }
}