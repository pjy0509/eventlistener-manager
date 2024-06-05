const extendedMouseEventMap = {
    'mouselongpressstart': 'mouselongpress',
    'mouselongpressmove': 'mouselongpress',
    'mouselongpressend': 'mouselongpress',
    'mouselongpressleave': 'mouselongpress',
    'mousepanstart': 'mousepan',
    'mousepanmove': 'mousepan',
    'mousepanleft': 'mousepan',
    'mousepanright': 'mousepan',
    'mousepanup': 'mousepan',
    'mousepandown': 'mousepan',
    'mousepanend': 'mousepan',
    'mousepanleave': 'mousepan',
};
const extendedTouchEventMap = {
    'touchlongpressstart': 'touchlongpress',
    'touchlongpressmove': 'touchlongpress',
    'touchlongpressend': 'touchlongpress',
    'touchlongpresscancel': 'touchlongpress',
    'touchpanstart': 'touchpan',
    'touchpanmove': 'touchpan',
    'touchpanleft': 'touchpan',
    'touchpanright': 'touchpan',
    'touchpanup': 'touchpan',
    'touchpandown': 'touchpan',
    'touchpanend': 'touchpan',
    'touchpancancel': 'touchpan',
    'touchpinchstart': 'touchpinch',
    'touchpinchmove': 'touchpinch',
    'touchpinchend': 'touchpinch',
    'touchpinchcancel': 'touchpinch',
};
export const extendedEventMap = {
    ...extendedMouseEventMap,
    ...extendedTouchEventMap
};
