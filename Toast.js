const DEFAULT_OPTIONS = {
  autoClose: 5000,
  position: "top-right",
  onClose: () => {},
  canClose: true,
  showProgress: true,
}

export default class Toast {
  #toastElem
  #autoCloseInterval
  #progressInterval
  #removeBinded
  #timeVisible = 0
  #autoClose
  #isPaused = false
  #unpause
  #pause
  #visibilityChange
  #shouldUnPause

  constructor(options) {
    this.#toastElem = document.createElement("div")
    this.#toastElem.classList.add("toast")
    requestAnimationFrame(() => {
      this.#toastElem.classList.add("show")
    })
    this.#removeBinded = this.remove.bind(this)
    this.#unpause = () => (this.#isPaused = false)
    this.#pause = () => (this.#isPaused = true)
    this.#visibilityChange = () => {
      this.#shouldUnPause = document.visibilityState === "visible"
    }
    this.update({ ...DEFAULT_OPTIONS, ...options })
  }

  set autoClose(value) {
    this.#autoClose = value
    this.#timeVisible = 0
    if (value === false) return

    let lastTime
    const func = time => {
      if (this.#shouldUnPause) {
        lastTime = null
        this.#shouldUnPause = false
      }
      if (lastTime == null) {
        lastTime = time
        this.#autoCloseInterval = requestAnimationFrame(func)
        return
      }
      if (!this.#isPaused) {
        this.#timeVisible += time - lastTime
        if (this.#timeVisible >= this.#autoClose) {
          this.remove()
          return
        }
      }

      lastTime = time
      this.#autoCloseInterval = requestAnimationFrame(func)
    }

    this.#autoCloseInterval = requestAnimationFrame(func)
  }

  set position(value) {
    const currentContainer = this.#toastElem.parentElement
    const selector = `.toast-container[data-position="${value}"]`
    const container = document.querySelector(selector) || createContainer(value)
    container.append(this.#toastElem)
    if (currentContainer == null || currentContainer.hasChildNodes()) return
    currentContainer.remove()
  }

  set text(value) {
    this.#toastElem.textContent = value
  }

  set canClose(value) {
    this.#toastElem.classList.toggle("can-close", value)
    if (value) {
      this.#toastElem.addEventListener("click", this.#removeBinded)
    } else {
      this.#toastElem.removeEventListener("click", this.#removeBinded)
    }
  }

  set showProgress(value) {
    this.#toastElem.classList.toggle("progress", value)
    this.#toastElem.style.setProperty("--progress", 1)

    if (value) {
      const func = () => {
        if (!this.#isPaused) {
          this.#toastElem.style.setProperty(
            "--progress",
            1 - this.#timeVisible / this.#autoClose
          )
        }
        this.#progressInterval = requestAnimationFrame(func)
      }

      this.#progressInterval = requestAnimationFrame(func)
    }
  }

  set pauseOnHover(value) {
    if (value) {
      this.#toastElem.addEventListener("mouseover", this.#pause)
      this.#toastElem.addEventListener("mouseleave", this.#unpause)
    } else {
      this.#toastElem.removeEventListener("mouseover", this.#pause)
      this.#toastElem.removeEventListener("mouseleave", this.#unpause)
    }
  }

  set pauseOnFocusLoss(value) {
    if (value) {
      document.addEventListener("visibilitychange", this.#visibilityChange)
    } else {
      document.removeEventListener("visibilitychange", this.#visibilityChange)
    }
  }

  update(options) {
    Object.entries(options).forEach(([key, value]) => {
      this[key] = value
    })
  }

  remove() {
    cancelAnimationFrame(this.#autoCloseInterval)
    cancelAnimationFrame(this.#progressInterval)
    const container = this.#toastElem.parentElement
    this.#toastElem.classList.remove("show")
    this.#toastElem.addEventListener("transitionend", () => {
      this.#toastElem.remove()
      if (container.hasChildNodes()) return
      container.remove()
    })
    this.onClose()
  }
}

function createContainer(position) {
  const container = document.createElement("div")
  container.classList.add("toast-container")
  container.dataset.position = position
  document.body.append(container)
  return container
}
