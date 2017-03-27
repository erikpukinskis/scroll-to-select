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

        document.body.style["margin-bottom"] = (window.innerHeight - 150)+"px"

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

    var timeout

    function updateSelection() {

      var oldSelection = currentSelection

      if (controlsAreVisible) {
        currentSelection.classList.remove("selected")
        onUnselect && onUnselect(currentSelection)
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

      if (!oldSelection) { return }

      if (timeout) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(selectNow.bind(null, currentSelection, onSelect), MINIMUM_PAUSE)

    }

    function selectNow(newSelection, callback) {
      if (newSelection) {
        newSelection.classList.add("selected")
        controlsAreVisible = true
      }

      callback && callback(newSelection)
    }
    
    function elementOverlapsSelector(el) {
      var rect = el.getBoundingClientRect()

      var startsAboveLine = rect.top < SELECTOR_BOTTOM

      var endsAboveLine = rect.bottom < SELECTOR_TOP

      return startsAboveLine && !endsAboveLine
    }

    return scrollToSelect
  }
)