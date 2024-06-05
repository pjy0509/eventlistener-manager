"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendedTouchEvent = exports.ExtendedMouseEvent = void 0;
const geometry_1 = require("./geometry");
class CloneEventInit {
    static clone(event) {
        return Object.assign({}, event);
    }
}
class ExtendedMouseEvent extends MouseEvent {
    constructor(type, event, paths = []) {
        super(type, CloneEventInit.clone(event));
        this.paths = new geometry_1.EventPathList(paths);
    }
}
exports.ExtendedMouseEvent = ExtendedMouseEvent;
class ExtendedTouchEvent extends TouchEvent {
    constructor(type, event, paths = []) {
        super(type, CloneEventInit.clone(event));
        this.paths = new geometry_1.EventPathList(paths);
    }
}
exports.ExtendedTouchEvent = ExtendedTouchEvent;
