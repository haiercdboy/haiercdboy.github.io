/**
 * @fileOverview
 * @author amoschen
 * @version
 * Created: 13-6-9 上午10:11
 */
define('util/imageLoader', function(require){
    var count = 0,
        imgs = {};

    /**
     * Provide a util for load image and invoke callback
     * At this moment, we only support one image for a time, but multiple support is coming soon
     * @class imageLoader
     * @module util
     * @namespace util
     * @constructor
     * @param {String} uri Image's url
     * @param {Function} callback Callback when image is ready
     * @return {Image} Img element
     * @example
     *      imageLoader('http://xxx.com/img.jpg', function(){
     *          alert('ok');
     *      });
     */
    return function(uri, callback){
        var index = count++,
            img = imgs[index] = new Image();

        img.onload = img.onerror = ready;
        img.src = uri;

        return img;

        function ready(){
            imgs[index] = img.onreadystatechange = img.onload = null;

            callback && callback(img);
        }
    }
});