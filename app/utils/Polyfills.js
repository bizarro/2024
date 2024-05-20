/**
 * Allow `forEach` to work with single HTMLElement.
 */
if (window.HTMLElement && !HTMLElement.prototype.forEach) {
  HTMLElement.prototype.forEach = function (callback, thisArg) {
    thisArg = thisArg || window

    callback.call(thisArg, this, this, this)
  }
}

/**
 * Allow `forEach` to work with NodeList.
 */
if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = function (callback, thisArg) {
    thisArg = thisArg || window

    for (var i = 0; i < this.length; i++) {
      callback.call(thisArg, this[i], i, this)
    }
  }
}

/**
 * Allow `map` to work with NodeList.
 */
if (window.NodeList && !NodeList.prototype.map) {
  NodeList.prototype.map = Array.prototype.map
}

/**
 * Allow `find` to work with NodeList.
 */
if (window.NodeList && !NodeList.prototype.find) {
  NodeList.prototype.find = Array.prototype.find
}

/**
 * Allow `filter` to work with NodeList.
 */
if (window.NodeList && !NodeList.prototype.filter) {
  NodeList.prototype.filter = Array.prototype.filter
}
