import {GlobalThis} from "./utils";

export default (() => {
    if (typeof GlobalThis.TouchEvent === 'undefined') {
        class TouchEvent extends UIEvent {
            constructor(type: string, init?: TouchEventInit) {
                super(type, init);
            }
        }

        GlobalThis.TouchEvent = TouchEvent;
    }

    return undefined;
})();