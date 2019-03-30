(function() {

/*******************************************************************************
** Definitions
*******************************************************************************/
  const timeline =      document.querySelector(".timeline ol"),
        elH =           document.querySelectorAll(".timeline li > div"),
        arrows =        document.querySelectorAll(".timeline .arrows .arrow"),
        arrowPrev =     document.querySelector(".timeline .arrows .arrow__prev"),
        arrowNext =     document.querySelector(".timeline .arrows .arrow__next"),
        firstItem =     document.querySelector(".timeline li:first-child"),
        lastItem =      document.querySelector(".timeline li:last-child"),
        xScrolling =    350,
        disabledClass = "disabled";

  /* Start */
  window.addEventListener("load", init);

  function init() {
    setEqualHeights(elH);
    animateTl(xScrolling, arrows, timeline);
    setSwipeFn(timeline, arrowPrev, arrowNext);
    setKeyboardFn(arrowPrev, arrowNext);
  }

/*******************************************************************************
** Action: Sets equal height to a html collection.
** Return: null
*******************************************************************************/
  function setEqualHeights(el) {
    let counter = 0;
    for (let i = 0; i < el.length; i++) {
      const singleHeight = el[i].offsetHeight;

      if (counter < singleHeight) {
        counter = singleHeight;
      }
    }

    for (let i = 0; i < el.length; i++) {
      el[i].style.height = `${counter}px`;
    }
  }

/*******************************************************************************
** Action: Checks if an Element is in the Viewport or not
**         http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
** Return: true (In viewport) | false (Out of viewport)
*******************************************************************************/
  function isElementInViewport(el) {
    const rect = -1;
    try {rect = el.getBoundingClientRect();}
    catch (e) {/* Do Nothing */}
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <=   (window.innerWidth || document.documentElement.clientWidth)
    );
  }

/*******************************************************************************
** Action: Toggles Button states.
** Return: null
*******************************************************************************/
  function setBtnState(el, flag = true) {
    if (flag) {
      el.classList.add(disabledClass);
    } else {
      if (el.classList.contains(disabledClass)) {
        el.classList.remove(disabledClass);
      }
      el.disabled = false;
    }
  }

/*******************************************************************************
** Action: Animates Timeline according to [scrolling]
** Return: null
*******************************************************************************/
  function animateTl(scrolling, el, tl) {
    let counter = 0;
    for (let i = 0; i < el.length; i++) {
      el[i].addEventListener("click", function() {
        if (!arrowPrev.disabled) {
          arrowPrev.disabled = true;
        }
        if (!arrowNext.disabled) {
          arrowNext.disabled = true;
        }
        const sign = (this.classList.contains("arrow__prev")) ? "" : "-";
        if (counter === 0) {
          tl.style.transform = `translateX(-${scrolling}px)`;
        } else {
          const tlStyle = getComputedStyle(tl);

          /* add more browser prefixes if needed here */
          const tlTransform = tlStyle.getPropertyValue("-webkit-transform") || tlStyle.getPropertyValue("transform");
          const values = parseInt(tlTransform.split(",")[4]) + parseInt(`${sign}${scrolling}`);
          tl.style.transform = `translateX(${values}px)`;
        }

        setTimeout(() => {
          isElementInViewport(firstItem) ? setBtnState(arrowPrev) : setBtnState(arrowPrev, false);
          isElementInViewport(lastItem) ? setBtnState(arrowNext) : setBtnState(arrowNext, false);
        }, 100);

        counter++;
      });
    }
  }

/*******************************************************************************
** Action: Swipe control for touchScreens, using Hammer.
** Return: null
*******************************************************************************/
  function setSwipeFn(tl, prev, next) {
    const hammer = new Hammer(tl);
    hammer.on("swipeleft", () => next.click());
    hammer.on("swiperight", () => prev.click());
  }

/*******************************************************************************
** Action: Keyboard control
** Return: null
*******************************************************************************/
  function setKeyboardFn(prev, next) {
    document.addEventListener("keydown", (e) => {
      if ((e.which === 37) || (e.which === 39)) {
        const timelineOfTop = timeline.offsetTop;
        const y = window.pageYOffset;
        if (timelineOfTop !== y) {
          window.scrollTo(0, timelineOfTop);
        }
        if (e.which === 37) {
          prev.click();
        } else if (e.which === 39) {
          next.click();
        }
      }
    });
  }

})();
