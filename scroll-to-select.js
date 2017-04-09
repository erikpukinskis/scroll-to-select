var library = require("module-library")(require)

module.exports = library.export(
  "scroll-to-select",
  ["add-html", "web-element"],
  function(addHtml, element) {

    var MINIMUM_PAUSE = 750
    var SELECTOR_TOP = 150
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

        document.body.style["margin-bottom"] = (window.innerHeight - SELECTOR_TOP - SELECTOR_HEIGHT)+"px"

        var selectorEl = element(
          ".selector", [
            ,
            stylesheet,
          ]
        )

        addHtml(selectorEl.html())

        addHtml(element(
          ".selector-toggle",
          options.text||"",
          {onclick: "toggleSelector()"}
        ).html())
        selectorIsAdded = true
      }
    }

    scrollToSelect.defineOn = function(bridge) {
      if (bridge.remember("scroll-to-select")) { return }

      bridge.claimIdentifier("toggleSelector")

      bridge.defineFunction(
        [{open: false}],
        function toggleSelector(state) {
          var selector = document.querySelector(".selector")
          var isPaused = selector.classList.contains("is-paused")

          if (isPaused) {
            selector.classList.remove("is-paused")
            library.get("scroll-to-select").update()
          } else {
            selector.classList.add("is-paused")
            library.get("scroll-to-select").update()
          }
        }
      )

      bridge.see("scroll-to-select", true)
      }      

    var stylesheet = element.stylesheet([

      element.style(".selected", {
        "background": "#cff"
      }),

      element.style(".selector-toggle", {
        "display": "none",
        "text-shadow": "3px -3px 0px #eff, -2px 2px 0px #ceffff",
        "color": "#fcffff",
        "position": "fixed",
        "top": (SELECTOR_TOP+20)+"px", 
        "right": "8%",
        "font-size": "32px",
        "line-height": "32px",
        "z-index": "1",
        "cursor": "pointer",
        "background": "#dff",
      }),

      element.style(".selector.is-paused", {
        "width": "215px",
        "right": "-5%",
        "left": "auto",
      }),

      element.style(".selector", {
        "display": "none",
        "position": "fixed",
        "left": "50%",
        "top": (SELECTOR_TOP+10)+"px", 
        "margin-left": "-45%",
        "z-index": "-1",

        "font-family": "sans-serif",
        "text-align": "right",
        "padding-right": "50px",
        "padding-top": "1px;",
        "box-sizing": "border-box",
        "width": "90%",
        "height": "52px",
        "background": "#dff",
        "border": "10px solid #f5ffff",
        "text-align": "right",
// SELECTOR_TOP - border width
      }),
    ])

    var timeout

    function updateSelection() {

      var isPaused = document.querySelector(".selector").classList.contains("is-paused")

      var oldSelection = currentSelection

      if (controlsAreVisible) {
        currentSelection.classList.remove("selected")
        onUnselect && onUnselect(currentSelection)
        controlsAreVisible = false
      }

      newSelection = undefined

      if (isPaused) {
        return
      }


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

      var shouldBeHidden = isPaused || !newSelection
      var shouldBeVisible = !shouldBeHidden

      if (shouldBeHidden &&
        selectorIsVisible) {
        document.querySelector(".selector").style.display = "none"
        document.querySelector(".selector-toggle").style.display = "none"
        selectorIsVisible = false
      }

      if (shouldBeVisible && !selectorIsVisible) {
        document.querySelector(".selector").style.display = "block"
        document.querySelector(".selector-toggle").style.display = "block"
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

    scrollToSelect.update = updateSelection

    return scrollToSelect
  }
)