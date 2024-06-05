import { EventPathList } from "./geometry";
class CloneEventInit {
    static clone(event) {
        return Object.assign({}, event);
    }
}
export class ExtendedMouseEvent extends MouseEvent {
    paths;
    constructor(type, event, paths = []) {
        super(type, CloneEventInit.clone(event));
        this.paths = new EventPathList(paths);
    }
}
export class ExtendedTouchEvent extends TouchEvent {
    paths;
    constructor(type, event, paths = []) {
        super(type, CloneEventInit.clone(event));
        this.paths = new EventPathList(paths);
    }
}
