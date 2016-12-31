var library = require("module-library")(require)

module.exports = library.export(
  "scroll-to-select",
  ["add-html", "web-element"],
  function(addHtml, element) {

    var MINIMUM_PAUSE = 750
    var SELECTOR_TOP = 120
    var SELECTOR_HEIGHT = 32
    var SELECTOR_BOTTOM = SELECTOR_TOP+SELECTOR_HEIGHT

    var groups = []

    var selectorIsAdded = false
    var currentSelection
    var selectorIsVisible
    var controlsAreVisible
    var newSelection
    var onSelect
    var onUnselect

    function scrollToSelect(options) {
      groups.push(options)
      if (typeof options.onSelect != "function") {
        throw new Error("Nothing to do on select")
      }

      if (!selectorIsAdded) {
        window.onscroll = updateSelection

        var selectorEl = element(
          ".selector", [
            options.text||"",
            element.stylesheet(selectorStyle, selectedStyle)
          ]
        )

        addHtml(selectorEl.html())

        selectorIsAdded = true
      }
    }

    var selectedStyle = element.style(".selected", {
        "background": "rgb(204, 255, 255)"
      })

    var selectorStyle = element.style(
      ".selector",
      {
        "display": "none",
        "color": "#fcffff",
        "text-align": "right",
        "font-size": "32px",
        "line-height": "32px",
        "padding-right": "50px",
        "padding-top": "1px;",
        "box-sizing": "border-box",
        "position": "fixed",
        "z-index": "-1",
        "width": "90%",
        "height": "52px",
        "background": "#dff",
        "border": "10px solid #f5ffff",
        "text-shadow": "3px -3px 0px #eff, -2px 2px 0px #ceffff",
        "left": "50%",
        "margin-left": "-45%",
        "top": "110px", // SELECTOR_TOP - border width
      }
    )

    function updateSelection() {

      if (controlsAreVisible) {
        currentSelection.classList.remove("selected")
        onUnselect && onUnselect()
        controlsAreVisible = false
      }

      newSelection = undefined

      groups.forEach(function(group) {
        group.ids.forEach(getSelection)

        function getSelection(id) {
          var el = document.getElementById(id)

          if (!el) {
            return
          }

          if (elementOverlapsSelector(el)) {
            newSelection = el
            onSelect = group.onSelect
            onUnselect = group.onUnselect
            return
          }
        }

        if (newSelection) {
          return
        }

      })

      var shouldBeHidden = !newSelection
      var shouldBeVisible = !shouldBeHidden

      if (shouldBeHidden &&
        selectorIsVisible) {
        document.querySelector(".selector").style.display = "none"
        selectorIsVisible = false
      }

      if (shouldBeVisible && !selectorIsVisible) {
        document.querySelector(".selector").style.display = "block"
        selectorIsVisible = true
      }

      if (newSelection == currentSelection) {
        return
      } else if (newSelection) {
        newSelection.classList.add("selected")
      }

      if (currentSelection) {
        currentSelection.classList.remove("selected")
      }

      currentSelection = newSelection

      if (!currentSelection) { return }

      afterASecond(function() {
        if (!currentSelection) { return }
        newSelection.classList.add("selected")
        onSelect && onSelect(currentSelection)
        controlsAreVisible = true
      })
    }
    
    function elementOverlapsSelector(el) {
      var rect = el.getBoundingClientRect()

      var startsAboveLine = rect.top < SELECTOR_BOTTOM

      var endsAboveLine = rect.bottom < SELECTOR_TOP

      return startsAboveLine && !endsAboveLine
    }

    function afterASecond(func) {
      if (!func.waitingToTry) {
        func.waitingToTry = setTimeout(tryToCall.bind(null, func), MINIMUM_PAUSE)
      }

      func.lastTry = new Date()
    }

    function tryToCall(func) {
      var sinceLastTry = new Date() - func.lastTry

      if (sinceLastTry < MINIMUM_PAUSE) {
        func.waitingToTry = setTimeout(tryToCall.bind(null, func), MINIMUM_PAUSE - sinceLastTry + 100)
      } else {
        func.waitingToTry = null
        func()
      }
    }

    return scrollToSelect
  }
)