export default (() => {
    if (typeof window !== 'undefined' && typeof window.TouchEvent === 'undefined') {
        class TouchEvent extends UIEvent {
            constructor(type: string, init?: TouchEventInit) {
                super(type, init);
            }
        }

        (window as any).TouchEvent = TouchEvent;
    }

    return undefined;
})();