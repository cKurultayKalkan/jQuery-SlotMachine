/*
 * jQuery Slot Machine v4.0.1
 * https://github.com/josex2r/jQuery-SlotMachineundefined
 *
 * Copyright 2014 Jose Luis Represa
 * Released under the MIT license
 */
(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
'use strict';

window.SlotMachine = require('./slot-machine');

},{"./slot-machine":3}],2:[function(require,module,exports){
"use strict";

var _raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

module.exports = function raf(cb) {
  var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

  setTimeout(function () {
    return _raf(cb);
  }, timeout);
};

},{}],3:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Timer = require('./timer');
var raf = require('./raf');

var defaults = {
  active: 0, // Active element [Number]
  delay: 200, // Animation time [Number]
  auto: false, // Repeat delay [false||Number]
  spins: 5, // Number of spins when auto [Number]
  randomize: null, // Randomize function, must return a number with the selected position
  onComplete: null, // Callback function(result)
  inViewport: true, // Stops animations if the element isn´t visible on the screen
  direction: 'up', // Animation direction ['up'||'down']
  transition: 'ease-in-out',
  transform: true
};
var FX_NO_TRANSITION = 'slotMachineNoTransition';
var FX_FAST = 'slotMachineBlurFast';
var FX_NORMAL = 'slotMachineBlurMedium';
var FX_SLOW = 'slotMachineBlurSlow';
var FX_TURTLE = 'slotMachineBlurTurtle';
var FX_GRADIENT = 'slotMachineGradient';
var FX_STOP = FX_GRADIENT;

var SlotMachine = function () {
  function SlotMachine(element, options) {
    _classCallCheck(this, SlotMachine);

    this.element = element;
    // Slot Machine elements
    this.tiles = [].slice.call(this.element.children);
    // Machine is running?
    this.running = false;
    // Machine is stopping?
    this.stopping = false;
    // Disable overflow
    this.element.style.overflow = 'hidden';
    // Wrap elements inside container
    this._wrapTiles();
    // Set min top offset
    this._minTop = -this._fakeFirstTile.offsetHeight;
    // Set max top offset
    this._maxTop = -this.tiles.reduce(function (acc, tile) {
      return acc + tile.offsetHeight;
    }, 0);
    // Call setters if neccesary
    this.changeSettings(Object.assign({}, defaults, options));
    // Initialize spin direction [up, down]
    this._setBounds();
    // Show active element
    this._resetPosition();
    // Start auto animation
    if (this.auto !== false) {
      this.run();
    }
  }

  _createClass(SlotMachine, [{
    key: 'changeSettings',
    value: function changeSettings(settings) {
      var _this = this;

      Object.keys(settings).forEach(function (key) {
        // Trigger setters
        _this[key] = settings[key];
      });
    }
  }, {
    key: '_wrapTiles',
    value: function _wrapTiles() {
      var _this2 = this;

      this.container = document.createElement('div');
      this.container.classList.add('slotMachineContainer');
      this.container.style.transition = '1s ease-in-out';
      this.element.appendChild(this.container);

      this._fakeFirstTile = this.tiles[this.tiles.length - 1].cloneNode(true);
      this.container.appendChild(this._fakeFirstTile);

      this.tiles.forEach(function (tile) {
        _this2.container.appendChild(tile);
      });

      this._fakeLastTile = this.tiles[0].cloneNode(true);
      this.container.appendChild(this._fakeLastTile);
    }
  }, {
    key: '_setBounds',
    value: function _setBounds() {
      var initial = this.getTileOffset(this.active);
      var first = this.getTileOffset(this.tiles.length);
      var last = this.getTileOffset(this.tiles.length);

      this._bounds = {
        up: {
          key: 'up',
          initial: initial,
          first: 0,
          last: last,
          to: this._maxTop,
          firstToLast: last,
          lastToFirst: 0
        },
        down: {
          key: 'down',
          initial: initial,
          first: first,
          last: 0,
          to: this._minTop,
          firstToLast: last,
          lastToFirst: 0
        }
      };
    }
  }, {
    key: '_changeTransition',
    value: function _changeTransition() {
      var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.delay;
      var transition = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.transition;

      this.container.style.transition = delay / 1000 + 's ' + transition;
    }
  }, {
    key: '_changeTransform',
    value: function _changeTransform(margin) {
      if (this.transform) {
        this.container.style.transform = 'matrix(1, 0, 0, 1, 0, ' + margin + ')';
      } else {
        this.container.style.top = margin + 280 + 'px';
      }
    }
  }, {
    key: '_isGoingBackward',
    value: function _isGoingBackward() {
      return this.nextActive > this.active && this.active === 0 && this.nextActive === this.tiles.length - 1;
    }
  }, {
    key: '_isGoingForward',
    value: function _isGoingForward() {
      return this.nextActive <= this.active && this.active === this.tiles.length - 1 && this.nextActive === 0;
    }
  }, {
    key: 'getTileOffset',
    value: function getTileOffset(index) {
      var offset = 0;

      for (var i = 0; i < index; i++) {
        offset += this.tiles[i].offsetHeight;
      }

      return this._minTop - offset;
    }
  }, {
    key: '_resetPosition',
    value: function _resetPosition(margin) {
      this.container.classList.toggle(FX_NO_TRANSITION);
      this._changeTransform(!isNaN(margin) ? margin : this.bounds.initial);
      // Force reflow, flushing the CSS changes
      this.container.offsetHeight;
      this.container.classList.toggle(FX_NO_TRANSITION);
    }
  }, {
    key: 'prev',
    value: function prev() {
      this.nextActive = this.prevIndex;
      this.running = true;
      this.stop();

      return this.nextActive;
    }
  }, {
    key: 'next',
    value: function next() {
      this.nextActive = this.nextIndex;
      this.running = true;
      this.stop();

      return this.nextActive;
    }
  }, {
    key: '_getDelayFromSpins',
    value: function _getDelayFromSpins(spins) {
      var delay = this.delay;
      this.transition = 'linear';

      switch (spins) {
        case 1:
          delay /= 0.5;
          this.transition = 'ease-out';
          this._animationFX = FX_TURTLE;
          break;
        case 2:
          delay /= 0.75;
          this._animationFX = FX_SLOW;
          break;
        case 3:
          delay /= 1;
          this._animationFX = FX_NORMAL;
          break;
        case 4:
          delay /= 1.25;
          this._animationFX = FX_NORMAL;
          break;
        default:
          delay /= 1.5;
          this._animationFX = FX_FAST;
      }

      return delay;
    }
  }, {
    key: 'shuffle',
    value: function shuffle(spins, onComplete) {
      var _this3 = this;

      // Make spins optional
      if (typeof spins === 'function') {
        onComplete = spins;
      }
      this.running = true;
      // Perform animation
      if (!this.visible && this.inViewport === true) {
        this.stop(onComplete);
      } else {
        var delay = this._getDelayFromSpins(spins);
        // this.delay = delay;
        this._changeTransition(delay);
        this._changeTransform(this.bounds.to);
        raf(function () {
          if (!_this3.stopping && _this3.running) {
            var left = spins - 1;

            _this3._resetPosition(_this3.bounds.first);

            if (left > 1) {
              // Repeat animation
              _this3.shuffle(left, onComplete);
            } else {
              _this3.stop(onComplete);
            }
          }
        }, delay);
      }

      return this.nextActive;
    }
  }, {
    key: 'stop',
    value: function stop(onStop) {
      var _this4 = this;

      if (!this.running || this.stopping) {
        return this.nextActive;
      }

      this.running = true;
      this.stopping = true;

      if (!Number.isInteger(this.nextActive)) {
        // Get random or custom element
        this.nextActive = this.custom;
      }

      // Check direction to prevent jumping
      if (this._isGoingBackward()) {
        this._resetPosition(this.bounds.firstToLast);
      } else if (this._isGoingForward()) {
        this._resetPosition(this.bounds.lastToFirst);
      }

      // Update last choosen element index
      this.active = this.nextActive;

      // Perform animation
      var delay = this._getDelayFromSpins(1);
      // this.delay = delay;
      this._changeTransition(delay);
      this._animationFX = FX_STOP;
      this._changeTransform(this.getTileOffset(this.active));
      raf(function () {
        _this4.stopping = false;
        _this4.running = false;
        _this4.nextActive = null;

        if (typeof _this4.onComplete === 'function') {
          _this4.onComplete(_this4.active);
        }

        if (typeof onStop === 'function') {
          onStop.apply(_this4, [_this4.active]);
        }
      }, delay);

      return this.active;
    }
  }, {
    key: 'run',
    value: function run() {
      var _this5 = this;

      if (this.running) {
        return;
      }

      this._timer = new Timer(function () {
        if (!_this5.visible && _this5.inViewport === true) {
          raf(function () {
            _this5._timer.reset();
          }, 500);
        } else {
          _this5.shuffle(_this5.spins, function () {
            _this5._timer.reset();
          });
        }
      }, this.auto);
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      var _this6 = this;

      this._fakeFirstTile.remove();
      this._fakeLastTile.remove();
      this.$tiles.unwrap();

      // Unwrap tiles
      this.tiles.forEach(function (tile) {
        _this6.element.appendChild(tile);
      });

      this.container.remove();
    }
  }, {
    key: 'active',
    get: function get() {
      return this._active;
    },
    set: function set(index) {
      index = Number(index);
      if (index < 0 || index >= this.tiles.length || isNaN(index)) {
        index = 0;
      }
      this._active = index;
    }
  }, {
    key: 'direction',
    get: function get() {
      return this._direction;
    },
    set: function set(direction) {
      if (!this.running) {
        this._direction = direction === 'down' ? 'down' : 'up';
      }
    }
  }, {
    key: 'bounds',
    get: function get() {
      return this._bounds[this._direction];
    }
  }, {
    key: 'transition',
    get: function get() {
      return this._transition;
    },
    set: function set(transition) {
      this._transition = transition || 'ease-in-out';
    }
  }, {
    key: 'visibleTile',
    get: function get() {
      var firstTileHeight = this.tiles[0].offsetHeight;
      var rawContainerMargin = this.container.style.transform || '';
      var matrixRegExp = /^matrix\(-?\d+,\s?-?\d+,\s?-?\d+,\s?-?\d+,\s?-?\d+,\s?(-?\d+)\)$/;
      var containerMargin = parseInt(rawContainerMargin.replace(matrixRegExp, '$1'), 10);

      return Math.abs(Math.round(containerMargin / firstTileHeight)) - 1;
    }
  }, {
    key: 'random',
    get: function get() {
      return Math.floor(Math.random() * this.tiles.length);
    }
  }, {
    key: 'custom',
    get: function get() {
      var choosen = void 0;

      if (this.randomize) {
        var index = this.randomize(this.active);
        if (index < 0 || index >= this.tiles.length) {
          index = 0;
        }
        choosen = index;
      } else {
        choosen = this.random;
      }

      return choosen;
    }
  }, {
    key: '_prevIndex',
    get: function get() {
      var prevIndex = this.active - 1;

      return prevIndex < 0 ? this.tiles.length - 1 : prevIndex;
    }
  }, {
    key: '_nextIndex',
    get: function get() {
      var nextIndex = this.active + 1;

      return nextIndex < this.tiles.length ? nextIndex : 0;
    }
  }, {
    key: 'prevIndex',
    get: function get() {
      return this.direction === 'up' ? this._nextIndex : this._prevIndex;
    }
  }, {
    key: 'nextIndex',
    get: function get() {
      return this.direction === 'up' ? this._prevIndex : this._nextIndex;
    }
  }, {
    key: 'visible',
    get: function get() {
      var rect = this.element.getBoundingClientRect();
      var windowHeight = window.innerHeight || document.documentElement.clientHeight;
      var windowWidth = window.innerWidth || document.documentElement.clientWidth;
      var vertInView = rect.top <= windowHeight && rect.top + rect.height >= 0;
      var horInView = rect.left <= windowWidth && rect.left + rect.width >= 0;

      return vertInView && horInView;
    }
  }, {
    key: '_animationFX',
    set: function set(FX_SPEED) {
      var _this7 = this;

      var delay = this.delay / 4;

      raf(function () {
        [].concat(_toConsumableArray(_this7.tiles), [_this7._fakeLastTile, _this7._fakeFirstTile]).forEach(function (tile) {
          tile.classList.remove(FX_FAST, FX_NORMAL, FX_SLOW, FX_TURTLE);
          if (FX_SPEED !== FX_STOP) {
            tile.classList.add(FX_SPEED);
          }
        });

        if (FX_SPEED === FX_STOP) {
          _this7.container.classList.remove(FX_GRADIENT);
        } else {
          _this7.container.classList.add(FX_GRADIENT);
        }
      }, delay);
    }
  }]);

  return SlotMachine;
}();

module.exports = SlotMachine;

},{"./raf":2,"./timer":4}],4:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function () {
  function Timer(cb, delay) {
    _classCallCheck(this, Timer);

    this.cb = cb;
    this.initialDelay = delay;
    this.delay = delay;
    this.startTime = null;
    this.timer = null;
    this.running = false;

    this.resume();

    return this;
  }

  _createClass(Timer, [{
    key: "_start",
    value: function _start() {
      var _this = this;

      this.timer = setTimeout(function () {
        _this.running = false;
        _this.cb(_this);
      }, this.delay);
    }
  }, {
    key: "cancel",
    value: function cancel() {
      this.running = false;
      clearTimeout(this.timer);
    }
  }, {
    key: "pause",
    value: function pause() {
      if (this.running) {
        this.delay -= new Date().getTime() - this.startTime;
        this.cancel();
      }
    }
  }, {
    key: "resume",
    value: function resume() {
      if (!this.running) {
        this.running = true;
        this.startTime = new Date().getTime();

        this._start();
      }
    }
  }, {
    key: "reset",
    value: function reset() {
      this.cancel();
      this.delay = this.initialDelay;
      this._start();
    }
  }, {
    key: "add",
    value: function add(extraDelay) {
      this.pause();
      this.delay += extraDelay;
      this.resume();
    }
  }]);

  return Timer;
}();

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvaW5kZXguanMiLCJsaWIvcmFmLmpzIiwibGliL3Nsb3QtbWFjaGluZS5qcyIsImxpYi90aW1lci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxXQUFQLEdBQXFCLFFBQVEsZ0JBQVIsQ0FBckI7Ozs7O0FDQUEsSUFBTSxPQUFPLE9BQU8scUJBQVAsSUFBZ0MsT0FBTyx3QkFBdkMsSUFBbUUsT0FBTywyQkFBMUUsSUFBeUcsT0FBTyx1QkFBN0g7O0FBRUEsT0FBTyxPQUFQLEdBQWlCLFNBQVMsR0FBVCxDQUFjLEVBQWQsRUFBK0I7QUFBQSxNQUFiLE9BQWEsdUVBQUgsQ0FBRzs7QUFDOUMsYUFBVztBQUFBLFdBQU0sS0FBSyxFQUFMLENBQU47QUFBQSxHQUFYLEVBQTJCLE9BQTNCO0FBQ0QsQ0FGRDs7Ozs7Ozs7Ozs7QUNGQSxJQUFNLFFBQVEsUUFBUSxTQUFSLENBQWQ7QUFDQSxJQUFNLE1BQU0sUUFBUSxPQUFSLENBQVo7O0FBRUEsSUFBTSxXQUFXO0FBQ2YsVUFBUSxDQURPLEVBQ0o7QUFDWCxTQUFPLEdBRlEsRUFFSDtBQUNaLFFBQU0sS0FIUyxFQUdGO0FBQ2IsU0FBTyxDQUpRLEVBSUw7QUFDVixhQUFXLElBTEksRUFLRTtBQUNqQixjQUFZLElBTkcsRUFNRztBQUNsQixjQUFZLElBUEcsRUFPRztBQUNsQixhQUFXLElBUkksRUFRRTtBQUNqQixjQUFZLGFBVEc7QUFVZixhQUFXO0FBVkksQ0FBakI7QUFZQSxJQUFNLG1CQUFtQix5QkFBekI7QUFDQSxJQUFNLFVBQVUscUJBQWhCO0FBQ0EsSUFBTSxZQUFZLHVCQUFsQjtBQUNBLElBQU0sVUFBVSxxQkFBaEI7QUFDQSxJQUFNLFlBQVksdUJBQWxCO0FBQ0EsSUFBTSxjQUFjLHFCQUFwQjtBQUNBLElBQU0sVUFBVSxXQUFoQjs7SUFFTSxXO0FBQ0osdUJBQWEsT0FBYixFQUFzQixPQUF0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IihmdW5jdGlvbigpe2Z1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfXJldHVybiBlfSkoKSIsIndpbmRvdy5TbG90TWFjaGluZSA9IHJlcXVpcmUoJy4vc2xvdC1tYWNoaW5lJyk7XG4iLCJjb25zdCBfcmFmID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJhZiAoY2IsIHRpbWVvdXQgPSAwKSB7XG4gIHNldFRpbWVvdXQoKCkgPT4gX3JhZihjYiksIHRpbWVvdXQpO1xufTtcbiIsImNvbnN0IFRpbWVyID0gcmVxdWlyZSgnLi90aW1lcicpO1xuY29uc3QgcmFmID0gcmVxdWlyZSgnLi9yYWYnKTtcblxuY29uc3QgZGVmYXVsdHMgPSB7XG4gIGFjdGl2ZTogMCwgLy8gQWN0aXZlIGVsZW1lbnQgW051bWJlcl1cbiAgZGVsYXk6IDIwMCwgLy8gQW5pbWF0aW9uIHRpbWUgW051bWJlcl1cbiAgYXV0bzogZmFsc2UsIC8vIFJlcGVhdCBkZWxheSBbZmFsc2V8fE51bWJlcl1cbiAgc3BpbnM6IDUsIC8vIE51bWJlciBvZiBzcGlucyB3aGVuIGF1dG8gW051bWJlcl1cbiAgcmFuZG9taXplOiBudWxsLCAvLyBSYW5kb21pemUgZnVuY3Rpb24sIG11c3QgcmV0dXJuIGEgbnVtYmVyIHdpdGggdGhlIHNlbGVjdGVkIHBvc2l0aW9uXG4gIG9uQ29tcGxldGU6IG51bGwsIC8vIENhbGxiYWNrIGZ1bmN0aW9uKHJlc3VsdClcbiAgaW5WaWV3cG9ydDogdHJ1ZSwgLy8gU3RvcHMgYW5pbWF0aW9ucyBpZiB0aGUgZWxlbWVudCBpc27CtHQgdmlzaWJsZSBvbiB0aGUgc2NyZWVuXG4gIGRpcmVjdGlvbjogJ3VwJywgLy8gQW5pbWF0aW9uIGRpcmVjdGlvbiBbJ3VwJ3x8J2Rvd24nXVxuICB0cmFuc2l0aW9uOiAnZWFzZS1pbi1vdXQnLFxuICB0cmFuc2Zvcm06IHRydWVcbn07XG5jb25zdCBGWF9OT19UUkFOU0lUSU9OID0gJ3Nsb3RNYWNoaW5lTm9UcmFuc2l0aW9uJztcbmNvbnN0IEZYX0ZBU1QgPSAnc2xvdE1hY2hpbmVCbHVyRmFzdCc7XG5jb25zdCBGWF9OT1JNQUwgPSAnc2xvdE1hY2hpbmVCbHVyTWVkaXVtJztcbmNvbnN0IEZYX1NMT1cgPSAnc2xvdE1hY2hpbmVCbHVyU2xvdyc7XG5jb25zdCBGWF9UVVJUTEUgPSAnc2xvdE1hY2hpbmVCbHVyVHVydGxlJztcbmNvbnN0IEZYX0dSQURJRU5UID0gJ3Nsb3RNYWNoaW5lR3JhZGllbnQnO1xuY29uc3QgRlhfU1RPUCA9IEZYX0dSQURJRU5UO1xuXG5jbGFzcyBTbG90TWFjaGluZSB7XG4gIGNvbnN0cnVjdG9yIChlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAvLyBTbG90IE1hY2hpbmUgZWxlbWVudHNcbiAgICB0aGlzLnRpbGVzID0gW10uc2xpY2UuY2FsbCh0aGlzLmVsZW1lbnQuY2hpbGRyZW4pO1xuICAgIC8vIE1hY2hpbmUgaXMgcnVubmluZz9cbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAvLyBNYWNoaW5lIGlzIHN0b3BwaW5nP1xuICAgIHRoaXMuc3RvcHBpbmcgPSBmYWxzZTtcbiAgICAvLyBEaXNhYmxlIG92ZXJmbG93XG4gICAgdGhpcy5lbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gICAgLy8gV3JhcCBlbGVtZW50cyBpbnNpZGUgY29udGFpbmVyXG4gICAgdGhpcy5fd3JhcFRpbGVzKCk7XG4gICAgLy8gU2V0IG1pbiB0b3Agb2Zmc2V0XG4gICAgdGhpcy5fbWluVG9wID0gLXRoaXMuX2Zha2VGaXJzdFRpbGUub2Zmc2V0SGVpZ2h0O1xuICAgIC8vIFNldCBtYXggdG9wIG9mZnNldFxuICAgIHRoaXMuX21heFRvcCA9IC10aGlzLnRpbGVzLnJlZHVjZSgoYWNjLCB0aWxlKSA9PiAoYWNjICsgdGlsZS5vZmZzZXRIZWlnaHQpLCAwKTtcbiAgICAvLyBDYWxsIHNldHRlcnMgaWYgbmVjY2VzYXJ5XG4gICAgdGhpcy5jaGFuZ2VTZXR0aW5ncyhPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0cywgb3B0aW9ucykpO1xuICAgIC8vIEluaXRpYWxpemUgc3BpbiBkaXJlY3Rpb24gW3VwLCBkb3duXVxuICAgIHRoaXMuX3NldEJvdW5kcygpO1xuICAgIC8vIFNob3cgYWN0aXZlIGVsZW1lbnRcbiAgICB0aGlzLl9yZXNldFBvc2l0aW9uKCk7XG4gICAgLy8gU3RhcnQgYXV0byBhbmltYXRpb25cbiAgICBpZiAodGhpcy5hdXRvICE9PSBmYWxzZSkge1xuICAgICAgdGhpcy5ydW4oKTtcbiAgICB9XG4gIH1cblxuICBjaGFuZ2VTZXR0aW5ncyAoc2V0dGluZ3MpIHtcbiAgICBPYmplY3Qua2V5cyhzZXR0aW5ncykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAvLyBUcmlnZ2VyIHNldHRlcnNcbiAgICAgIHRoaXNba2V5XSA9IHNldHRpbmdzW2tleV07XG4gICAgfSk7XG4gIH1cblxuICBfd3JhcFRpbGVzICgpIHtcbiAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ3Nsb3RNYWNoaW5lQ29udGFpbmVyJyk7XG4gICAgdGhpcy5jb250YWluZXIuc3R5bGUudHJhbnNpdGlvbiA9ICcxcyBlYXNlLWluLW91dCc7XG4gICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuY29udGFpbmVyKTtcblxuICAgIHRoaXMuX2Zha2VGaXJzdFRpbGUgPSB0aGlzLnRpbGVzW3RoaXMudGlsZXMubGVuZ3RoIC0gMV0uY2xvbmVOb2RlKHRydWUpO1xuICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuX2Zha2VGaXJzdFRpbGUpO1xuXG4gICAgdGhpcy50aWxlcy5mb3JFYWNoKCh0aWxlKSA9PiB7XG4gICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aWxlKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2Zha2VMYXN0VGlsZSA9IHRoaXMudGlsZXNbMF0uY2xvbmVOb2RlKHRydWUpO1xuICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuX2Zha2VMYXN0VGlsZSk7XG4gIH1cblxuICBfc2V0Qm91bmRzICgpIHtcbiAgICBjb25zdCBpbml0aWFsID0gdGhpcy5nZXRUaWxlT2Zmc2V0KHRoaXMuYWN0aXZlKTtcbiAgICBjb25zdCBmaXJzdCA9IHRoaXMuZ2V0VGlsZU9mZnNldCh0aGlzLnRpbGVzLmxlbmd0aCk7XG4gICAgY29uc3QgbGFzdCA9IHRoaXMuZ2V0VGlsZU9mZnNldCh0aGlzLnRpbGVzLmxlbmd0aCk7XG5cbiAgICB0aGlzLl9ib3VuZHMgPSB7XG4gICAgICB1cDoge1xuICAgICAgICBrZXk6ICd1cCcsXG4gICAgICAgIGluaXRpYWwsXG4gICAgICAgIGZpcnN0OiAwLFxuICAgICAgICBsYXN0LFxuICAgICAgICB0bzogdGhpcy5fbWF4VG9wLFxuICAgICAgICBmaXJzdFRvTGFzdDogbGFzdCxcbiAgICAgICAgbGFzdFRvRmlyc3Q6IDBcbiAgICAgIH0sXG4gICAgICBkb3duOiB7XG4gICAgICAgIGtleTogJ2Rvd24nLFxuICAgICAgICBpbml0aWFsLFxuICAgICAgICBmaXJzdCxcbiAgICAgICAgbGFzdDogMCxcbiAgICAgICAgdG86IHRoaXMuX21pblRvcCxcbiAgICAgICAgZmlyc3RUb0xhc3Q6IGxhc3QsXG4gICAgICAgIGxhc3RUb0ZpcnN0OiAwXG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGdldCBhY3RpdmUgKCkge1xuICAgIHJldHVybiB0aGlzLl9hY3RpdmU7XG4gIH1cblxuICBnZXQgZGlyZWN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGlyZWN0aW9uO1xuICB9XG5cbiAgZ2V0IGJvdW5kcyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JvdW5kc1t0aGlzLl9kaXJlY3Rpb25dO1xuICB9XG5cbiAgZ2V0IHRyYW5zaXRpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl90cmFuc2l0aW9uO1xuICB9XG5cbiAgZ2V0IHZpc2libGVUaWxlICgpIHtcbiAgICBjb25zdCBmaXJzdFRpbGVIZWlnaHQgPSB0aGlzLnRpbGVzWzBdLm9mZnNldEhlaWdodDtcbiAgICBjb25zdCByYXdDb250YWluZXJNYXJnaW4gPSB0aGlzLmNvbnRhaW5lci5zdHlsZS50cmFuc2Zvcm0gfHwgJyc7XG4gICAgY29uc3QgbWF0cml4UmVnRXhwID0gL15tYXRyaXhcXCgtP1xcZCssXFxzPy0/XFxkKyxcXHM/LT9cXGQrLFxccz8tP1xcZCssXFxzPy0/XFxkKyxcXHM/KC0/XFxkKylcXCkkLztcbiAgICBjb25zdCBjb250YWluZXJNYXJnaW4gPSBwYXJzZUludChyYXdDb250YWluZXJNYXJnaW4ucmVwbGFjZShtYXRyaXhSZWdFeHAsICckMScpLCAxMCk7XG5cbiAgICByZXR1cm4gTWF0aC5hYnMoTWF0aC5yb3VuZChjb250YWluZXJNYXJnaW4gLyBmaXJzdFRpbGVIZWlnaHQpKSAtIDE7XG4gIH1cblxuICBnZXQgcmFuZG9tICgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdGhpcy50aWxlcy5sZW5ndGgpO1xuICB9XG5cbiAgZ2V0IGN1c3RvbSAoKSB7XG4gICAgbGV0IGNob29zZW47XG5cbiAgICBpZiAodGhpcy5yYW5kb21pemUpIHtcbiAgICAgIGxldCBpbmRleCA9IHRoaXMucmFuZG9taXplKHRoaXMuYWN0aXZlKTtcbiAgICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy50aWxlcy5sZW5ndGgpIHtcbiAgICAgICAgaW5kZXggPSAwO1xuICAgICAgfVxuICAgICAgY2hvb3NlbiA9IGluZGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICBjaG9vc2VuID0gdGhpcy5yYW5kb207XG4gICAgfVxuXG4gICAgcmV0dXJuIGNob29zZW47XG4gIH1cblxuICBnZXQgX3ByZXZJbmRleCAoKSB7XG4gICAgY29uc3QgcHJldkluZGV4ID0gdGhpcy5hY3RpdmUgLSAxO1xuXG4gICAgcmV0dXJuIHByZXZJbmRleCA8IDAgPyAodGhpcy50aWxlcy5sZW5ndGggLSAxKSA6IHByZXZJbmRleDtcbiAgfVxuXG4gIGdldCBfbmV4dEluZGV4ICgpIHtcbiAgICBjb25zdCBuZXh0SW5kZXggPSB0aGlzLmFjdGl2ZSArIDE7XG5cbiAgICByZXR1cm4gbmV4dEluZGV4IDwgdGhpcy50aWxlcy5sZW5ndGggPyBuZXh0SW5kZXggOiAwO1xuICB9XG5cbiAgZ2V0IHByZXZJbmRleCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlyZWN0aW9uID09PSAndXAnID8gdGhpcy5fbmV4dEluZGV4IDogdGhpcy5fcHJldkluZGV4O1xuICB9XG5cbiAgZ2V0IG5leHRJbmRleCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlyZWN0aW9uID09PSAndXAnID8gdGhpcy5fcHJldkluZGV4IDogdGhpcy5fbmV4dEluZGV4O1xuICB9XG5cbiAgZ2V0IHZpc2libGUgKCkge1xuICAgIGNvbnN0IHJlY3QgPSB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3Qgd2luZG93SGVpZ2h0ID0gKHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0KTtcbiAgICBjb25zdCB3aW5kb3dXaWR0aCA9ICh3aW5kb3cuaW5uZXJXaWR0aCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpO1xuICAgIGNvbnN0IHZlcnRJblZpZXcgPSAocmVjdC50b3AgPD0gd2luZG93SGVpZ2h0KSAmJiAoKHJlY3QudG9wICsgcmVjdC5oZWlnaHQpID49IDApO1xuICAgIGNvbnN0IGhvckluVmlldyA9IChyZWN0LmxlZnQgPD0gd2luZG93V2lkdGgpICYmICgocmVjdC5sZWZ0ICsgcmVjdC53aWR0aCkgPj0gMCk7XG5cbiAgICByZXR1cm4gdmVydEluVmlldyAmJiBob3JJblZpZXc7XG4gIH1cblxuICBzZXQgYWN0aXZlIChpbmRleCkge1xuICAgIGluZGV4ID0gTnVtYmVyKGluZGV4KTtcbiAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMudGlsZXMubGVuZ3RoIHx8IGlzTmFOKGluZGV4KSkge1xuICAgICAgaW5kZXggPSAwO1xuICAgIH1cbiAgICB0aGlzLl9hY3RpdmUgPSBpbmRleDtcbiAgfVxuXG4gIHNldCBkaXJlY3Rpb24gKGRpcmVjdGlvbikge1xuICAgIGlmICghdGhpcy5ydW5uaW5nKSB7XG4gICAgICB0aGlzLl9kaXJlY3Rpb24gPSBkaXJlY3Rpb24gPT09ICdkb3duJyA/ICdkb3duJyA6ICd1cCc7XG4gICAgfVxuICB9XG5cbiAgc2V0IF9hbmltYXRpb25GWCAoRlhfU1BFRUQpIHtcbiAgICBjb25zdCBkZWxheSA9IHRoaXMuZGVsYXkgLyA0O1xuXG4gICAgcmFmKCgpID0+IHtcbiAgICAgIFsuLi50aGlzLnRpbGVzLCB0aGlzLl9mYWtlTGFzdFRpbGUsIHRoaXMuX2Zha2VGaXJzdFRpbGVdLmZvckVhY2goKHRpbGUpID0+IHtcbiAgICAgICAgdGlsZS5jbGFzc0xpc3QucmVtb3ZlKEZYX0ZBU1QsIEZYX05PUk1BTCwgRlhfU0xPVywgRlhfVFVSVExFKTtcbiAgICAgICAgaWYgKEZYX1NQRUVEICE9PSBGWF9TVE9QKSB7XG4gICAgICAgICAgdGlsZS5jbGFzc0xpc3QuYWRkKEZYX1NQRUVEKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChGWF9TUEVFRCA9PT0gRlhfU1RPUCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKEZYX0dSQURJRU5UKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoRlhfR1JBRElFTlQpO1xuICAgICAgfVxuICAgIH0sIGRlbGF5KTtcbiAgfVxuXG4gIHNldCB0cmFuc2l0aW9uICh0cmFuc2l0aW9uKSB7XG4gICAgdGhpcy5fdHJhbnNpdGlvbiA9IHRyYW5zaXRpb24gfHwgJ2Vhc2UtaW4tb3V0JztcbiAgfVxuXG4gIF9jaGFuZ2VUcmFuc2l0aW9uIChkZWxheSA9IHRoaXMuZGVsYXksIHRyYW5zaXRpb24gPSB0aGlzLnRyYW5zaXRpb24pIHtcbiAgICB0aGlzLmNvbnRhaW5lci5zdHlsZS50cmFuc2l0aW9uID0gYCR7ZGVsYXkgLyAxMDAwfXMgJHt0cmFuc2l0aW9ufWA7XG4gIH1cblxuICBfY2hhbmdlVHJhbnNmb3JtIChtYXJnaW4pIHtcbiAgICBpZiAodGhpcy50cmFuc2Zvcm0pIHtcbiAgICAgIHRoaXMuY29udGFpbmVyLnN0eWxlLnRyYW5zZm9ybSA9ICdtYXRyaXgoMSwgMCwgMCwgMSwgMCwgJyArIG1hcmdpbiArICcpJztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb250YWluZXIuc3R5bGUudG9wID0gbWFyZ2luICsgMjgwICsgJ3B4JztcbiAgICB9XG4gIH1cblxuICBfaXNHb2luZ0JhY2t3YXJkICgpIHtcbiAgICByZXR1cm4gdGhpcy5uZXh0QWN0aXZlID4gdGhpcy5hY3RpdmUgJiYgdGhpcy5hY3RpdmUgPT09IDAgJiYgdGhpcy5uZXh0QWN0aXZlID09PSB0aGlzLnRpbGVzLmxlbmd0aCAtIDE7XG4gIH1cblxuICBfaXNHb2luZ0ZvcndhcmQgKCkge1xuICAgIHJldHVybiB0aGlzLm5leHRBY3RpdmUgPD0gdGhpcy5hY3RpdmUgJiYgdGhpcy5hY3RpdmUgPT09IHRoaXMudGlsZXMubGVuZ3RoIC0gMSAmJiB0aGlzLm5leHRBY3RpdmUgPT09IDA7XG4gIH1cblxuICBnZXRUaWxlT2Zmc2V0IChpbmRleCkge1xuICAgIGxldCBvZmZzZXQgPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmRleDsgaSsrKSB7XG4gICAgICBvZmZzZXQgKz0gdGhpcy50aWxlc1tpXS5vZmZzZXRIZWlnaHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX21pblRvcCAtIG9mZnNldDtcbiAgfVxuXG4gIF9yZXNldFBvc2l0aW9uIChtYXJnaW4pIHtcbiAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QudG9nZ2xlKEZYX05PX1RSQU5TSVRJT04pO1xuICAgIHRoaXMuX2NoYW5nZVRyYW5zZm9ybSghaXNOYU4obWFyZ2luKSA/IG1hcmdpbiA6IHRoaXMuYm91bmRzLmluaXRpYWwpO1xuICAgIC8vIEZvcmNlIHJlZmxvdywgZmx1c2hpbmcgdGhlIENTUyBjaGFuZ2VzXG4gICAgdGhpcy5jb250YWluZXIub2Zmc2V0SGVpZ2h0O1xuICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC50b2dnbGUoRlhfTk9fVFJBTlNJVElPTik7XG4gIH1cblxuICBwcmV2ICgpIHtcbiAgICB0aGlzLm5leHRBY3RpdmUgPSB0aGlzLnByZXZJbmRleDtcbiAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgcmV0dXJuIHRoaXMubmV4dEFjdGl2ZTtcbiAgfVxuXG4gIG5leHQgKCkge1xuICAgIHRoaXMubmV4dEFjdGl2ZSA9IHRoaXMubmV4dEluZGV4O1xuICAgIHRoaXMucnVubmluZyA9IHRydWU7XG4gICAgdGhpcy5zdG9wKCk7XG5cbiAgICByZXR1cm4gdGhpcy5uZXh0QWN0aXZlO1xuICB9XG5cbiAgX2dldERlbGF5RnJvbVNwaW5zIChzcGlucykge1xuICAgIGxldCBkZWxheSA9IHRoaXMuZGVsYXk7XG4gICAgdGhpcy50cmFuc2l0aW9uID0gJ2xpbmVhcic7XG5cbiAgICBzd2l0Y2ggKHNwaW5zKSB7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIGRlbGF5IC89IDAuNTtcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uID0gJ2Vhc2Utb3V0JztcbiAgICAgICAgdGhpcy5fYW5pbWF0aW9uRlggPSBGWF9UVVJUTEU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBkZWxheSAvPSAwLjc1O1xuICAgICAgICB0aGlzLl9hbmltYXRpb25GWCA9IEZYX1NMT1c7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBkZWxheSAvPSAxO1xuICAgICAgICB0aGlzLl9hbmltYXRpb25GWCA9IEZYX05PUk1BTDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQ6XG4gICAgICAgIGRlbGF5IC89IDEuMjU7XG4gICAgICAgIHRoaXMuX2FuaW1hdGlvbkZYID0gRlhfTk9STUFMO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGRlbGF5IC89IDEuNTtcbiAgICAgICAgdGhpcy5fYW5pbWF0aW9uRlggPSBGWF9GQVNUO1xuICAgIH1cblxuICAgIHJldHVybiBkZWxheTtcbiAgfVxuXG4gIHNodWZmbGUgKHNwaW5zLCBvbkNvbXBsZXRlKSB7XG4gICAgLy8gTWFrZSBzcGlucyBvcHRpb25hbFxuICAgIGlmICh0eXBlb2Ygc3BpbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9uQ29tcGxldGUgPSBzcGlucztcbiAgICB9XG4gICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICAvLyBQZXJmb3JtIGFuaW1hdGlvblxuICAgIGlmICghdGhpcy52aXNpYmxlICYmIHRoaXMuaW5WaWV3cG9ydCA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5zdG9wKG9uQ29tcGxldGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBkZWxheSA9IHRoaXMuX2dldERlbGF5RnJvbVNwaW5zKHNwaW5zKTtcbiAgICAgIC8vIHRoaXMuZGVsYXkgPSBkZWxheTtcbiAgICAgIHRoaXMuX2NoYW5nZVRyYW5zaXRpb24oZGVsYXkpO1xuICAgICAgdGhpcy5fY2hhbmdlVHJhbnNmb3JtKHRoaXMuYm91bmRzLnRvKTtcbiAgICAgIHJhZigoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5zdG9wcGluZyAmJiB0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgICBjb25zdCBsZWZ0ID0gc3BpbnMgLSAxO1xuXG4gICAgICAgICAgdGhpcy5fcmVzZXRQb3NpdGlvbih0aGlzLmJvdW5kcy5maXJzdCk7XG5cbiAgICAgICAgICBpZiAobGVmdCA+IDEpIHtcbiAgICAgICAgICAgIC8vIFJlcGVhdCBhbmltYXRpb25cbiAgICAgICAgICAgIHRoaXMuc2h1ZmZsZShsZWZ0LCBvbkNvbXBsZXRlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdG9wKG9uQ29tcGxldGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwgZGVsYXkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm5leHRBY3RpdmU7XG4gIH1cblxuICBzdG9wIChvblN0b3ApIHtcbiAgICBpZiAoIXRoaXMucnVubmluZyB8fCB0aGlzLnN0b3BwaW5nKSB7XG4gICAgICByZXR1cm4gdGhpcy5uZXh0QWN0aXZlO1xuICAgIH1cblxuICAgIHRoaXMucnVubmluZyA9IHRydWU7XG4gICAgdGhpcy5zdG9wcGluZyA9IHRydWU7XG5cbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIodGhpcy5uZXh0QWN0aXZlKSkge1xuICAgICAgLy8gR2V0IHJhbmRvbSBvciBjdXN0b20gZWxlbWVudFxuICAgICAgdGhpcy5uZXh0QWN0aXZlID0gdGhpcy5jdXN0b207XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZGlyZWN0aW9uIHRvIHByZXZlbnQganVtcGluZ1xuICAgIGlmICh0aGlzLl9pc0dvaW5nQmFja3dhcmQoKSkge1xuICAgICAgdGhpcy5fcmVzZXRQb3NpdGlvbih0aGlzLmJvdW5kcy5maXJzdFRvTGFzdCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9pc0dvaW5nRm9yd2FyZCgpKSB7XG4gICAgICB0aGlzLl9yZXNldFBvc2l0aW9uKHRoaXMuYm91bmRzLmxhc3RUb0ZpcnN0KTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgbGFzdCBjaG9vc2VuIGVsZW1lbnQgaW5kZXhcbiAgICB0aGlzLmFjdGl2ZSA9IHRoaXMubmV4dEFjdGl2ZTtcblxuICAgIC8vIFBlcmZvcm0gYW5pbWF0aW9uXG4gICAgY29uc3QgZGVsYXkgPSB0aGlzLl9nZXREZWxheUZyb21TcGlucygxKTtcbiAgICAvLyB0aGlzLmRlbGF5ID0gZGVsYXk7XG4gICAgdGhpcy5fY2hhbmdlVHJhbnNpdGlvbihkZWxheSk7XG4gICAgdGhpcy5fYW5pbWF0aW9uRlggPSBGWF9TVE9QO1xuICAgIHRoaXMuX2NoYW5nZVRyYW5zZm9ybSh0aGlzLmdldFRpbGVPZmZzZXQodGhpcy5hY3RpdmUpKTtcbiAgICByYWYoKCkgPT4ge1xuICAgICAgdGhpcy5zdG9wcGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICB0aGlzLm5leHRBY3RpdmUgPSBudWxsO1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMub25Db21wbGV0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLm9uQ29tcGxldGUodGhpcy5hY3RpdmUpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIG9uU3RvcCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvblN0b3AuYXBwbHkodGhpcywgW3RoaXMuYWN0aXZlXSk7XG4gICAgICB9XG4gICAgfSwgZGVsYXkpO1xuXG4gICAgcmV0dXJuIHRoaXMuYWN0aXZlO1xuICB9XG5cbiAgcnVuICgpIHtcbiAgICBpZiAodGhpcy5ydW5uaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fdGltZXIgPSBuZXcgVGltZXIoKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnZpc2libGUgJiYgdGhpcy5pblZpZXdwb3J0ID09PSB0cnVlKSB7XG4gICAgICAgIHJhZigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5fdGltZXIucmVzZXQoKVxuICAgICAgICB9LCA1MDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zaHVmZmxlKHRoaXMuc3BpbnMsICgpID0+IHtcbiAgICAgICAgICB0aGlzLl90aW1lci5yZXNldCgpXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sIHRoaXMuYXV0byk7XG4gIH1cblxuICBkZXN0cm95ICgpIHtcbiAgICB0aGlzLl9mYWtlRmlyc3RUaWxlLnJlbW92ZSgpO1xuICAgIHRoaXMuX2Zha2VMYXN0VGlsZS5yZW1vdmUoKTtcbiAgICB0aGlzLiR0aWxlcy51bndyYXAoKTtcblxuICAgIC8vIFVud3JhcCB0aWxlc1xuICAgIHRoaXMudGlsZXMuZm9yRWFjaCgodGlsZSkgPT4ge1xuICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKHRpbGUpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jb250YWluZXIucmVtb3ZlKCk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTbG90TWFjaGluZTtcbiIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVGltZXIge1xuICBjb25zdHJ1Y3RvciAoY2IsIGRlbGF5KSB7XG4gICAgdGhpcy5jYiA9IGNiO1xuICAgIHRoaXMuaW5pdGlhbERlbGF5ID0gZGVsYXk7XG4gICAgdGhpcy5kZWxheSA9IGRlbGF5O1xuICAgIHRoaXMuc3RhcnRUaW1lID0gbnVsbDtcbiAgICB0aGlzLnRpbWVyID0gbnVsbDtcbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcblxuICAgIHRoaXMucmVzdW1lKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIF9zdGFydCAoKSB7XG4gICAgdGhpcy50aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICB0aGlzLmNiKHRoaXMpO1xuICAgIH0sIHRoaXMuZGVsYXkpO1xuICB9XG5cbiAgY2FuY2VsICgpIHtcbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lcik7XG4gIH1cblxuICBwYXVzZSAoKSB7XG4gICAgaWYgKHRoaXMucnVubmluZykge1xuICAgICAgdGhpcy5kZWxheSAtPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHRoaXMuc3RhcnRUaW1lO1xuICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICB9XG4gIH1cblxuICByZXN1bWUgKCkge1xuICAgIGlmICghdGhpcy5ydW5uaW5nKSB7XG4gICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgICAgdGhpcy5zdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgICAgdGhpcy5fc3RhcnQoKTtcbiAgICB9XG4gIH1cblxuICByZXNldCAoKSB7XG4gICAgdGhpcy5jYW5jZWwoKTtcbiAgICB0aGlzLmRlbGF5ID0gdGhpcy5pbml0aWFsRGVsYXk7XG4gICAgdGhpcy5fc3RhcnQoKTtcbiAgfVxuXG4gIGFkZCAoZXh0cmFEZWxheSkge1xuICAgIHRoaXMucGF1c2UoKTtcbiAgICB0aGlzLmRlbGF5ICs9IGV4dHJhRGVsYXk7XG4gICAgdGhpcy5yZXN1bWUoKTtcbiAgfVxufTtcbiJdfQ==
