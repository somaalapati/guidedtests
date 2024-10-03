const launcher = document.getElementById('launcher')
const wrapper = document.getElementById('wrapper')
const modalRoot = document.getElementById('modal-root')

/**
 * Shadow DOM modal content
 */
const shadow = modalRoot.attachShadow({
  mode: 'open'
})
// create a shadow button
const shadowButton1 = document.createElement('button')
shadowButton1.innerHTML = 'Shadow stop 1'
// create another shadow button
const shadowButton2 = document.createElement('button')
shadowButton2.innerHTML = 'Shadow stop 2'
// add the buttons to the shadow DOM
shadow.appendChild(shadowButton1)
shadow.appendChild(shadowButton2)

const handleTab = ({ target, shiftKey, path }) => {
  const keyTarget = path[0] || target
  let focusTarget
  if (keyTarget === modalRoot) {
    focusTarget = shiftKey ? shadowButton2 : shadowButton1
  } else if (keyTarget === shadowButton1) {
    focusTarget = shadowButton2
  } else if (keyTarget === shadowButton2) {
    focusTarget = shadowButton1
  }

  if (!focusTarget) {
    return
  }

  focusTarget.focus()
}

launcher.addEventListener('click', () => {
  modalRoot.classList.add('active')
  wrapper.setAttribute('aria-hidden', 'true')
  modalRoot.focus()
})

modalRoot.addEventListener('keydown', e => {
  switch (e.key) {
    case 'Escape':
      modalRoot.classList.remove('active')
      wrapper.removeAttribute('aria-hidden')
      launcher.focus()
      break

    case 'Tab':
      e.preventDefault()
      handleTab(e)
      break
  }
})
