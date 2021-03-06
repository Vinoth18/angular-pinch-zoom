/*! angular-pinch-zoom - v0.2.0 */
angular.module('ngPinchZoom', [])
/**
 * @ngdoc directive
 * @name ngPinchZoom
 * @restrict A
 * @scope false
 **/
.directive('ngPinchZoom', function() {

  var _directive =  {
    restrict : 'A',
    scope    : false,
    link     : _link
  };

  function _link(scope, element, attrs) {
    var elWidth, elHeight;

    // mode : 'pinch' or 'swipe'
    var mode = '';

    // distance between two touche points (mode : 'pinch')
    var distance = 0;
    var initialDistance = 0;

    // image scaling
    var scale = 1;
    var relativeScale = 1;
    var initialScale = 1;
    var maxScale = parseInt(attrs.maxScale, 10);
    if (isNaN(maxScale) || maxScale <= 1) {
      maxScale = 3;
    }

    // position of the upper left corner of the element
    var positionX = 0;
    var positionY = 0;

    var initialPositionX = 0;
    var initialPositionY = 0;

    // central origin (mode : 'pinch')
    var originX = 0;
    var originY = 0;

    // start coordinate and amount of movement (mode : 'swipe')
    var startX = 0;
    var startY = 0;
    var moveX = 0;
    var moveY = 0;

    var image = new Image();
    image.onload = function() {
      elWidth = element[0].clientWidth;
      elHeight = element[0].clientHeight;

      element.css({
        '-webkit-transform-origin' : '0 0',
        'transform-origin'         : '0 0'
      });

      element.on('touchstart', touchstartHandler);
      element.on('touchmove', touchmoveHandler);
      element.on('touchend', touchendHandler);

      var DblClickInterval = 300;
      var firstClickTime;
      var waitingSecondClick = false;

      element.on('click', function(e) {
        if (!waitingSecondClick) {
          firstClickTime = (new Date()).getTime();
          waitingSecondClick = true;

          setTimeout(function() {
            waitingSecondClick = false;
          }, DblClickInterval);
        } else {
          waitingSecondClick = false;

          var time = (new Date()).getTime();
          if (time - firstClickTime < DblClickInterval) {
            resetElement(e);
          }
        }
      });
    };

    if (attrs.ngSrc) {
      image.src = attrs.ngSrc;
    } else {
      image.src = attrs.src;
    }

    /**
     * @param {object} evt
     */
    function resetElement(evt) {
      scale = 1;
      positionX = 0;
      positionY = 0;
      transformElement();
    }

    /**
     * @param {object} evt
     */
    function touchstartHandler(evt) {
      if(evt.originalEvent.touches.length > 2) {
        return;
      }
      startX = evt.originalEvent.touches[0].clientX;
      startY = evt.originalEvent.touches[0].clientY;
      initialPositionX = positionX;
      initialPositionY = positionY;
      moveX = 0;
      moveY = 0;
    }

    /**
     * @param {object} evt
     */
    function touchmoveHandler(evt) {

      if (mode === '') {
        if (evt.originalEvent.touches.length === 1 && scale > 1) {

          mode = 'swipe';

        } else if (evt.originalEvent.touches.length === 2) {

          mode = 'pinch';

          initialScale = scale;
          initialDistance = getDistance(evt);
          originX = evt.originalEvent.touches[0].clientX -
                    parseInt((evt.originalEvent.touches[0].clientX - evt.originalEvent.touches[1].clientX) / 2, 10) -
                    element[0].offsetLeft - initialPositionX;
          originY = evt.originalEvent.touches[0].clientY -
                    parseInt((evt.originalEvent.touches[0].clientY - evt.originalEvent.touches[1].clientY) / 2, 10) -
                    element[0].offsetTop - initialPositionY;

        }
      }

      if (mode === 'swipe') {
        evt.preventDefault();

        moveX = evt.originalEvent.touches[0].clientX - startX;
        moveY = evt.originalEvent.touches[0].clientY - startY;

        positionX = initialPositionX + moveX;
        positionY = initialPositionY + moveY;

        transformElement();

      } else if (mode === 'pinch') {
        evt.preventDefault();

        distance = getDistance(evt);
        relativeScale = distance / initialDistance;
        scale = relativeScale * initialScale;

        positionX = originX * (1 - relativeScale) + initialPositionX + moveX;
        positionY = originY * (1 - relativeScale) + initialPositionY + moveY;

        transformElement();

      }
    }

    /**
     * @param {object} evt
     */
    function touchendHandler(evt) {

      if (mode === '' || evt.originalEvent.touches.length > 0) {
        return;
      }

      scale = scale ? scale : 0;

      if (scale < 1) {

        scale = 1;
        positionX = 0;
        positionY = 0;

      } else if (scale > maxScale) {

        scale = maxScale;
        relativeScale = scale / initialScale;
        positionX = originX * (1 - relativeScale) + initialPositionX + moveX;
        positionY = originY * (1 - relativeScale) + initialPositionY + moveY;

      } else {

        if (positionX > 0) {
          positionX = 0;
        } else if (positionX < elWidth * (1 - scale)) {
          positionX = elWidth * (1 - scale);
        }
        if (positionY > 0) {
          positionY = 0;
        } else if (positionY < elHeight * (1 - scale)) {
          positionY = elHeight * (1 - scale);
        }

      }

      transformElement(0.1);
      mode = '';
    }

    /**
     * @param {object} evt
     * @return {number}
     */
    function getDistance(evt) {
      var d = Math.sqrt(Math.pow(evt.originalEvent.touches[0].clientX - evt.originalEvent.touches[1].clientX, 2) +
                        Math.pow(evt.originalEvent.touches[0].clientY - evt.originalEvent.touches[1].clientY, 2));
      return parseInt(d, 10);
    }

    /**
     * @param {number} [duration]
     */
    function transformElement(duration) {
      var transition  = duration ? 'all cubic-bezier(0,0,.5,1) ' + duration + 's' : '';
      var matrixArray = [scale, 0, 0, scale, positionX, positionY];
      var matrix      = 'matrix(' + matrixArray.join(',') + ')';

      element.css({
        '-webkit-transition' : transition,
        transition           : transition,
        '-webkit-transform'  : matrix + ' translate3d(0,0,0)',
        transform            : matrix
      });
    }
  }

  return _directive;
});
