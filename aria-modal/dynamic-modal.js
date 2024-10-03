const wrapper = document.getElementById('wrapper')

/**
 * Dynamic modal (a11y features toggled by checkboxes)
 */
const modalTriggers = document.querySelectorAll(
  '[data-trigger="modal"]'
)
const trapsFocusPhantom = document.getElementById(
  'traps-focus-phantom-tabstops'
)
const checkAll = document.getElementById('check-all')
const uncheckAll = document.getElementById('uncheck-all')
const checkboxes = [
  ...document.querySelectorAll('.config [type="checkbox"]')
].reduce((data, el) => {
  data[el.id] = document.getElementById(el.id)
  return data
}, {})
const trapFocusCheckboxes = [
  ...document.querySelectorAll(
    '.focus-config [type="checkbox"]'
  )
].reduce((data, el) => {
  data[el.id] = document.getElementById(el.id)
  return data
}, {})

const form = document.getElementById('form')

let activeModal = null
let prevFocus

const isFocusable = element => {
  if (element.tabIndex < 0) {
    return false
  }

  if (element.disabled) {
    return false
  }

  switch (element.nodeName) {
    case 'A':
      return !!element.href && element.rel != 'ignore'
    case 'INPUT':
      return element.type != 'hidden'
    case 'BUTTON':
    case 'SELECT':
    case 'TEXTAREA':
      return true
    default:
      return false
  }
}

class DynamicModal {
  constructor(template) {
    this.template = template
    // custom element that contains a modal with slots is not a template
    this.isModalInShadowDOM = !this.template.content
  }

  handleClickEvent = event => {
    if (
      event.target.matches('[data-trigger="modal-close"]')
    ) {
      this.close()
    }
  }

  getFocusableSlottedElement = () => {
    const slottedElements = Array.from(
      this.modal.querySelectorAll('slot')
    )
      .map(slot => slot.assignedElements())
      .flat()

    return slottedElements.filter(slottedElement =>
      isFocusable(slottedElement)
    )
  }

  handleKeydownEvent = event => {
    const isEscape = event.key === 'Escape'

    if (isEscape && checkboxes['escape-closes'].checked) {
      this.close()
    }

    const isTab = event.key === 'Tab'
    if (
      !trapFocusCheckboxes['traps-focus-keydown']
        ?.checked ||
      !isTab
    ) {
      return
    }

    this.trapFocusKeydown(event)
  }

  handleFocusEvent = event => {
    if (
      !trapFocusCheckboxes['traps-focus-forward']?.checked
    ) {
      return
    }

    this.trapFocusForward(event)
  }

  trapFocusKeydown(event) {
    // account for target in shadow DOM
    const target = event.composedPath()[0] || event.target
    const { modal } = this
    // poor man's focusable elements
    const focusableElements = [
      // TODO: replace this with a logic accounts for the order of focusable elements
      ...this.getFocusableSlottedElement(),
      ...modal.querySelectorAll('button,a,[tabindex]'),
      ...Array.from(
        modal.querySelectorAll('custom-button')
      ).map(el => el.shadowRoot.querySelector('button'))
    ]

    const firstFocusable = focusableElements[0]
    const lastFocusable =
      focusableElements[focusableElements.length - 1]

    if (
      event.shiftKey &&
      (target === firstFocusable || target === modal)
    ) {
      event.preventDefault()
      lastFocusable.focus()
    } else if (
      !event.shiftKey &&
      target === lastFocusable
    ) {
      event.preventDefault()
      firstFocusable.focus()
    }
  }

  trapFocusForward(event) {
    // account for target in shadow DOM
    const target = event.composedPath()[0] || event.target
    const { modal } = this
    // poor man's focusable elements
    const focusableElements = [
      // TODO: replace this with a logic accounts for the order of focusable elements
      ...this.getFocusableSlottedElement(),
      ...modal.querySelectorAll('button,a,[tabindex]'),
      ...Array.from(
        modal.querySelectorAll('custom-button')
      ).map(el => el.shadowRoot.querySelector('button'))
    ]

    const firstFocusable = focusableElements[0]
    const lastFocusable =
      focusableElements[focusableElements.length - 1]

    if (
      !trapFocusCheckboxes['traps-focus-forward'].checked ||
      !modal.classList.contains('active')
    ) {
      return
    }

    // If the focus event contains the element, there's nothing we need to do
    if (modal.contains(target.assignedSlot || target)) {
      return
    }

    event.preventDefault()
    event.stopImmediatePropagation()

    const activeElement =
      modal.getRootNode()?.activeElement ||
      document.activeElement

    if (modal.nextElementSibling === activeElement) {
      firstFocusable.focus()
    } else if (
      modal.previousElementSibling === activeElement
    ) {
      lastFocusable.focus()
    }
  }

  addEventListeners() {
    const { modal } = this
    modal.addEventListener('click', this.handleClickEvent)
    modal.addEventListener(
      'keydown',
      this.handleKeydownEvent
    )

    if (this.isModalInShadowDOM) {
      modal
        .getRootNode()
        .addEventListener(
          'focus',
          this.handleFocusEvent,
          true
        )
    } else {
      document.body.addEventListener(
        'focus',
        this.handleFocusEvent,
        true
      )
    }
  }

  removeEventListeners() {
    const { modal } = this
    modal.removeEventListener(
      'click',
      this.handleClickEvent
    )
    modal.removeEventListener(
      'keydown',
      this.handleKeydownEvent
    )

    if (this.isModalInShadowDOM) {
      modal
        .getRootNode()
        .removeEventListener(
          'focus',
          this.handleFocusEvent,
          true
        )
    } else {
      document.body.removeEventListener(
        'focus',
        this.handleFocusEvent,
        true
      )
    }
  }

  open() {
    let modal
    if (this.isModalInShadowDOM) {
      // cloneNode removes the link between slots and slotted elements
      modal = this.modal = document.getElementById(
        'custom-element'
      ).shadowRoot.firstElementChild
    } else {
      modal = this.modal = this.template.content.firstElementChild.cloneNode(
        true
      )
    }

    if (!this.isModalInShadowDOM) {
      // appendChild removes the link between slots and slotted elements
      document.body.appendChild(modal)
    }

    this.addEventListeners()

    if (checkboxes['has-dialog-role']?.checked) {
      modal.setAttribute('role', 'dialog')
    } else {
      modal.removeAttribute('role')
    }

    if (checkboxes['sets-aria-modal']?.checked) {
      modal.setAttribute('aria-modal', 'true')
    } else {
      modal.removeAttribute('aria-modal')
    }

    if (
      checkboxes['manages-aria-hidden']?.checked &&
      // since modal with slots is within the wrapper, we don't set aria-hidden true so that the modal is `visible`
      !this.isModalInShadowDOM
    ) {
      wrapper.setAttribute('aria-hidden', true)
    }

    if (
      trapFocusCheckboxes['traps-focus-forward']?.checked
    ) {
      // Bracket the dialog node with two hidden, focusable nodes
      // This ensures that focus is always trapped within the document
      const before = document.createElement('div')
      before.tabIndex = 0
      before.ariaHidden = true
      modal.parentNode.insertBefore(before, modal)
      const after = document.createElement('div')
      after.tabIndex = 0
      after.ariaHidden = true
      modal.parentNode.insertBefore(
        after,
        modal.nextElementSibling
      )
    }

    modal.classList.add('active')
    activeModal = this

    if (checkboxes['focus-to-modal']?.checked) {
      modal.focus()
    }
  }

  close() {
    const { modal } = this

    if (!checkboxes['no-submits-form']?.checked) {
      modal.querySelector('form').requestSubmit()
    }

    if (
      trapFocusCheckboxes['traps-focus-forward']?.checked
    ) {
      modal.parentNode.removeChild(
        modal.previousElementSibling
      )
      modal.parentNode.removeChild(modal.nextElementSibling)
    }

    if (!checkboxes['no-submits-form']?.checked) {
      modal.querySelector('form').requestSubmit()
    }

    modal.classList.remove('active')
    wrapper.removeAttribute('aria-hidden')

    if (!this.isModalInShadowDOM) {
      document.body.removeChild(this.modal)
    }
    activeModal = null

    if (
      checkboxes['returns-focus-to-trigger']?.checked &&
      prevFocus
    ) {
      prevFocus.focus()
    }
  }
}

// Handle modal open triggers
document.body.addEventListener('click', event => {
  prevFocus = document.activeElement
  if (
    event.target.matches('[data-trigger="modal-open"]') ||
    event.target.matches('#non-focusable-trigger')
  ) {
    let templateElement =
      event.target.previousElementSibling
    if (event.target.matches('#non-focusable-trigger')) {
      templateElement =
        event.target.parentNode.previousElementSibling
    }

    const modal = new DynamicModal(templateElement)
    modal.open()
  }
})

checkAll?.addEventListener('click', () => {
  Object.values(checkboxes).forEach(c => (c.checked = true))
})

uncheckAll?.addEventListener('click', () => {
  Object.values(checkboxes).forEach(
    c => (c.checked = false)
  )
})

document
  .querySelector('.focus-config')
  ?.addEventListener('click', event => {
    if (event.target.matches('input[type="checkbox"]')) {
      if (event.target.checked) {
        Object.values(trapFocusCheckboxes).forEach(
          el => el !== event.target && (el.disabled = true)
        )
      } else {
        Object.values(trapFocusCheckboxes).forEach(
          el => (el.disabled = false)
        )
      }
    }
  })

/**
 * keyboard shortcuts modal
 */
const kbdModal = document.getElementById('kbd-modal')
const kbdClose = document.getElementById('kbd-modal-x')
const kbdOk = document.getElementById('kbd-ok')
const closeKbdModal = () => {
  kbdModal.classList.remove('active')
  wrapper.removeAttribute('aria-hidden')
  if (prevFocus) {
    prevFocus.focus()
  }
}

document.addEventListener('keydown', e => {
  /**
   * Launch modal
   */

  if (e.key === '?') {
    kbdModal.classList.add('active')
    prevFocus = document.activeElement
    wrapper.setAttribute('aria-hidden', true)
    kbdModal.focus()
  }

  /**
   * Hot keys
   */
  if (!e.ctrlKey) {
    return
  }

  switch (e.key) {
    case 'a':
      alert('hello')
      break
    case 'b':
      alert('world')
      break
    default:
      break
  }
})

kbdModal?.addEventListener('keydown', e => {
  switch (e.key) {
    case 'Escape':
      closeKbdModal()
      break
    case 'Tab':
      if (
        e.shiftKey &&
        (e.target === kbdModal || e.target === kbdClose)
      ) {
        e.preventDefault()
        kbdOk.focus()
      } else if (!e.shiftKey && e.target === kbdOk) {
        e.preventDefault()
        kbdClose.focus()
      }
      break
    default:
      break
  }
})

kbdClose?.addEventListener('click', closeKbdModal)
kbdOk?.addEventListener('click', closeKbdModal)
document.addEventListener('submit', e => {
  e.preventDefault()
})
