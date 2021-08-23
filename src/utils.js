function findPosition(obj) {
    var currentLeft = 0, currentTop = 0;
    if (obj.offsetParent) {
        do {
            currentLeft += obj.offsetLeft;
            currentTop += obj.offsetTop;
        } while (obj = obj.offsetParent);
    }
    return { x: currentLeft, y: currentTop };
}

function rgbToHsv(rgb){
    const {r,g,b}=rgb;
    const r_=r/255,g_=g/255,b_=b/255;
    const cMax=Math.max(r_,g_,b_);
    const cMin=Math.min(r_,g_,b_);
    const delta=cMax-cMin;
    var h=0;
    if (delta>0)
    {
        if (r_===cMax)
        {h=60*(((g_-b_)/delta)%6)}
        else if (g_===cMax)
        {h=60*((b_-r_)/delta+2)}
        else
        {h=60*((r_-g_)/delta+4)}
    }
    h=h<0?h+360:h;
    const s= cMax===0?0:delta/cMax;
    return{h:h,s:s,v:cMax}
}

function hsvToAudio(hsv, isLinear=false, minHz=50, maxHz=5000){
    const {h,s,v}=hsv;
    if (isLinear)
    {
        return {hz:minHz+(maxHz-minHz)*h/360,velocity:v,distortion:s}
    }
    const step=Math.pow(maxHz-minHz+1,1/360);
    return {hz:minHz+Math.pow(step,h),velocity:v,distortion:s}
}

export {findPosition, rgbToHsv, hsvToAudio};