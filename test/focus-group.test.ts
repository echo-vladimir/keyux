import { JSDOM } from 'jsdom'
import { equal } from 'node:assert'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'

import { focusGroupKeyUX, hotkeyKeyUX, startKeyUX } from '../index.js'
import { press } from './utils.js'

test('adds menu navigation', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<nav role="menu">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  let items = window.document.querySelectorAll('a')
  items[0].focus()

  equal(window.document.activeElement, items[0])
  equal(
    window.document.body.innerHTML,
    '<nav role="menu">' +
      '<a href="#" role="menuitem">Home</a>' +
      '<a href="#" role="menuitem" tabindex="-1">About</a>' +
      '<a href="#" role="menuitem" tabindex="-1">Contact</a>' +
      '</nav>'
  )

  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[1])
  equal(
    window.document.body.innerHTML,
    '<nav role="menu">' +
      '<a href="#" role="menuitem" tabindex="-1">Home</a>' +
      '<a href="#" role="menuitem" tabindex="0">About</a>' +
      '<a href="#" role="menuitem" tabindex="-1">Contact</a>' +
      '</nav>'
  )

  press(window, 'ArrowUp')
  equal(window.document.activeElement, items[0])

  press(window, 'End')
  equal(window.document.activeElement, items[2])

  press(window, 'Home')
  equal(window.document.activeElement, items[0])

  press(window, 'ArrowUp')
  equal(window.document.activeElement, items[2])

  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[0])
})

test('stops tacking on loosing focus', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<nav role="menu">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>' +
    '<button>Button</button>'
  let button = window.document.querySelector('button')!
  let items = window.document.querySelectorAll('a')

  items[0].focus()
  items[0].blur()

  items[0].focus()
  button.focus()
  press(window, 'ArrowDown')
  equal(window.document.activeElement, button)

  items[0].focus()
  button.dispatchEvent(
    new window.KeyboardEvent('keydown', {
      bubbles: true,
      key: 'ArrowDown'
    })
  )
  equal(window.document.activeElement, items[0])
})

test('supports horizontal menus', () => {
  let window = new JSDOM().window
  let items
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<nav role="menu" aria-orientation="horizontal">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  items = window.document.querySelectorAll('a')
  items[0].focus()
  press(window, 'ArrowRight')
  equal(window.document.activeElement, items[1])
  press(window, 'ArrowLeft')
  equal(window.document.activeElement, items[0])

  window.document.body.innerHTML =
    '<nav role="menubar">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  items = window.document.querySelectorAll('a')
  items[0].focus()
  press(window, 'ArrowRight')
  equal(window.document.activeElement, items[1])
  press(window, 'ArrowLeft')
  equal(window.document.activeElement, items[0])

  window.document.body.innerHTML =
    '<nav role="menubar" aria-orientation="vertical">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  items = window.document.querySelectorAll('a')
  items[0].focus()
  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[1])
  press(window, 'ArrowUp')
  equal(window.document.activeElement, items[0])

  window.document.body.innerHTML =
    '<nav role="menu" aria-orientation="broken-bad-orientation">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  items = window.document.querySelectorAll('a')
  items[0].focus()
  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[1])
  press(window, 'ArrowUp')
  equal(window.document.activeElement, items[0])
})

test('moves focus by typing item name', async () => {
  let window = new JSDOM().window
  startKeyUX(window, [
    hotkeyKeyUX(),
    focusGroupKeyUX({
      searchDelayMs: 100
    })
  ])

  window.document.body.innerHTML =
    '<button aria-keyshortcuts="h">Button</button>' +
    '<nav role="menu">' +
    '<a href="#" role="menuitem">HOME</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem"> agh  </a>' +
    '<a href="#" role="menuitem">Backspace</a>' +
    '</nav>'

  let clicked = 0
  window.document.querySelector('button')!.addEventListener('click', () => {
    clicked++
  })

  let items = window.document.querySelectorAll('a')
  items[0].focus()

  press(window, 'a')
  equal(window.document.activeElement, items[1])

  press(window, 'G')
  equal(window.document.activeElement, items[2])

  await setTimeout(150)
  press(window, 'h')
  equal(window.document.activeElement, items[0])
  equal(clicked, 0)

  press(window, 'a')
  equal(window.document.activeElement, items[0])

  await setTimeout(150)
  press(window, 'a')
  equal(window.document.activeElement, items[1])

  await setTimeout(150)
  press(window, 'Backspace')
  equal(window.document.activeElement, items[1])

  press(window, 'b')
  equal(window.document.activeElement, items[3])
})

test('supports RTL locales', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.dir = 'rtl'
  window.document.body.innerHTML =
    '<nav role="menu" aria-orientation="horizontal">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  let items = window.document.querySelectorAll('a')
  items[0].focus()

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, items[1])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, items[0])
})

test('stops event tracking', () => {
  let window = new JSDOM().window
  let stop = startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<nav role="menu">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  let items = window.document.querySelectorAll('a')
  items[0].focus()

  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[1])

  stop()
  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[1])
})

test('ignores broken DOM', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>'
  let items = window.document.querySelectorAll('a')
  items[0].focus()

  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[0])

  window.document.body.innerHTML =
    '<nav role="menu">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  let another = window.document.querySelectorAll('a')
  another[0].focus()

  window.document.querySelector('nav')!.role = ''
  press(window, 'ArrowDown')
  equal(window.document.activeElement, another[0])
})

test('adds menubar widget', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<nav role="menubar">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  let items = window.document.querySelectorAll('a')
  items[0].focus()

  equal(window.document.activeElement, items[0])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, items[1])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, items[0])

  press(window, 'End')
  equal(window.document.activeElement, items[2])

  press(window, 'Home')
  equal(window.document.activeElement, items[0])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, items[2])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, items[0])
})

test('adds listbox widget', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<ul role="listbox">' +
    '<li tabindex="0" role="option">Pizza</li>' +
    '<li tabindex="0" role="option">Sushi</li>' +
    '<li tabindex="0" role="option">Ramen</li>' +
    '</ul>'
  let items = window.document.querySelectorAll('li')
  items[0].focus()

  equal(window.document.activeElement, items[0])

  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[1])

  press(window, 'ArrowUp')
  equal(window.document.activeElement, items[0])

  press(window, 'End')
  equal(window.document.activeElement, items[2])

  press(window, 'Home')
  equal(window.document.activeElement, items[0])

  press(window, 'ArrowUp')
  equal(window.document.activeElement, items[2])

  press(window, 'ArrowDown')
  equal(window.document.activeElement, items[0])
})

test('adds tablist widget', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])
  window.document.body.innerHTML =
    '<div role="tablist">' +
    '<button role="tab">Home</button>' +
    '<button role="tab">About</button>' +
    '<button role="tab">Contact</button>' +
    '</div>'
  let items = window.document.querySelectorAll('button')
  items[0].focus()

  equal(window.document.activeElement, items[0])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, items[1])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, items[0])

  press(window, 'End')
  equal(window.document.activeElement, items[2])

  press(window, 'Home')
  equal(window.document.activeElement, items[0])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, items[2])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, items[0])
})

test('node with role "tablist" should not support moving focus by search', async () => {
  let window = new JSDOM().window
  startKeyUX(window, [
    hotkeyKeyUX(),
    focusGroupKeyUX({
      searchDelayMs: 100
    })
  ])

  window.document.body.innerHTML =
    '<div role="tablist">' +
    '<button role="tab">Home</button>' +
    '<button role="tab">About</button>' +
    '<button role="tab">Contact</button>' +
    '</div>'

  let items = window.document.querySelectorAll('button')
  items[0].focus()

  press(window, 'A')
  await setTimeout(150)
  equal(window.document.activeElement, items[0])
})

test('is ready to click after focus', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])

  window.document.body.innerHTML =
    '<nav role="menu">' +
    '<a href="#" role="menuitem">Home</a>' +
    '<a href="#" role="menuitem">About</a>' +
    '<a href="#" role="menuitem">Contact</a>' +
    '</nav>'
  let items = window.document.querySelectorAll('a')

  items[0].focus()
  items[1].click()

  equal(
    window.document.body.innerHTML,
    '<nav role="menu">' +
      '<a href="#" role="menuitem" tabindex="-1">Home</a>' +
      '<a href="#" role="menuitem" tabindex="0">About</a>' +
      '<a href="#" role="menuitem" tabindex="-1">Contact</a>' +
      '</nav>'
  )
})

test('adds toolbar widget', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])
  window.document.body.innerHTML =
    '<div role="toolbar">' +
    '<div>' +
    '<button type="button">Copy</button>' +
    '<button type="button">Paste</button>' +
    '<button type="button">Cut</button>' +
    '</div>' +
    '<div>' +
    '<input type="checkbox"/>' +
    '</div>' +
    '</div>'
  let buttons = window.document.querySelectorAll('button')
  let checkboxes = window.document.querySelectorAll('[type="checkbox"]')
  buttons[0].focus()

  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[1])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[0])

  press(window, 'End')
  equal(window.document.activeElement, checkboxes[0])

  press(window, 'Home')
  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, checkboxes[0])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[0])
})

test('adds focusgroup widget', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])
  window.document.body.innerHTML =
    '<div focusgroup>' +
    '<button role="button">Mac</button>' +
    '<button role="button">Windows</button>' +
    '<button role="button">Linux</button>' +
    '</div>'
  let buttons = window.document.querySelectorAll('button')
  buttons[0].focus()

  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[1])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[0])

  press(window, 'End')
  equal(window.document.activeElement, buttons[2])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[2])

  press(window, 'Home')
  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[0])
})

test('adds focusgroup inline widget', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])
  window.document.body.innerHTML =
    '<div focusgroup="inline">' +
    '<button role="button">Mac</button>' +
    '<button role="button">Windows</button>' +
    '<button role="button">Linux</button>' +
    '</div>'
  let buttons = window.document.querySelectorAll('button')
  buttons[0].focus()

  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[1])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[0])

  press(window, 'End')
  equal(window.document.activeElement, buttons[2])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[2])

  press(window, 'Home')
  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[0])
})

test('adds focusgroup block widget', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])
  window.document.body.innerHTML =
    '<div focusgroup="block">' +
    '<button role="button">Dog</button>' +
    '<button role="button">Cat</button>' +
    '<button role="button">Turtle</button>' +
    '</div>'
  let buttons = window.document.querySelectorAll('button')
  buttons[0].focus()

  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowDown')
  equal(window.document.activeElement, buttons[1])

  press(window, 'ArrowUp')
  equal(window.document.activeElement, buttons[0])

  press(window, 'End')
  equal(window.document.activeElement, buttons[2])

  press(window, 'Home')
  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[0])
})

test('disabling focusgroup memory', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])
  window.document.body.innerHTML =
    '<div focusgroup="no-memory">' +
    '<button type="button">Item 1</button>' +
    '<button type="button">Item 2</button>' +
    '<button type="button">Item 3</button>' +
    '</div>'
  let buttons = window.document.querySelectorAll('button')
  buttons[0].focus()

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[1])

  buttons[1].blur()
  buttons[0].focus()

  equal(window.document.activeElement, buttons[0])
})

test('adds toolbar widget with focusgroup block option', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])
  window.document.body.innerHTML =
    '<div role="toolbar" focusgroup="block">' +
    '<div>' +
    '<button type="button">Copy</button>' +
    '<button type="button">Paste</button>' +
    '<button type="button">Cut</button>' +
    '</div>' +
    '<div>' +
    '<input type="checkbox"/>' +
    '</div>' +
    '</div>'
  let buttons = window.document.querySelectorAll('button')
  let checkboxes = window.document.querySelectorAll('[type="checkbox"]')
  buttons[0].focus()

  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowDown')
  equal(window.document.activeElement, buttons[1])

  press(window, 'ArrowUp')
  equal(window.document.activeElement, buttons[0])

  press(window, 'End')
  equal(window.document.activeElement, checkboxes[0])

  press(window, 'Home')
  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[0])
})

test('enabling wrap behaviors in focusgroup', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])
  window.document.body.innerHTML =
    '<div focusgroup="inline wrap">' +
    '<button role="button">Dog</button>' +
    '<button role="button">Cat</button>' +
    '<button role="button">Turtle</button>' +
    '</div>'
  let buttons = window.document.querySelectorAll('button')
  buttons[0].focus()

  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[1])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[0])

  press(window, 'End')
  equal(window.document.activeElement, buttons[2])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[0])

  press(window, 'Home')
  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[2])
})

test('disabling focusgroup=none elements', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])
  window.document.body.innerHTML =
    '<div focusgroup="block">' +
    '<button role="button" focusgroup="none">Button 1</button>' +
    '<button role="button">Button 2</button>' +
    '<button role="button" focusgroup="none">Button 3</button>' +
    '<button role="button">Button 4</button>' +
    '</div>'
  let buttons = window.document.querySelectorAll('button')
  buttons[1].focus()

  equal(window.document.activeElement, buttons[1])

  press(window, 'ArrowDown')
  equal(window.document.activeElement, buttons[3])

  press(window, 'ArrowUp')
  equal(window.document.activeElement, buttons[1])

  press(window, 'End')
  equal(window.document.activeElement, buttons[3])

  press(window, 'Home')
  equal(window.document.activeElement, buttons[1])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[1])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[1])
})

test('focusgroup=none with wrap behavior', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])
  window.document.body.innerHTML =
    '<div focusgroup="inline wrap">' +
    '<button role="button" focusgroup="none">Button 1</button>' +
    '<button role="button">Button 2</button>' +
    '<button role="button" focusgroup="none">Button 3</button>' +
    '<button role="button">Button 4</button>' +
    '</div>'
  let buttons = window.document.querySelectorAll('button')
  buttons[1].focus()

  equal(window.document.activeElement, buttons[1])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[3])

  press(window, 'End')
  equal(window.document.activeElement, buttons[3])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[1])

  press(window, 'Home')
  equal(window.document.activeElement, buttons[1])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[3])

  press(window, 'ArrowDown')
  equal(window.document.activeElement, buttons[3])

  press(window, 'ArrowUp')
  equal(window.document.activeElement, buttons[3])
})

test('skips all lements with focusgroup=none', () => {
  let window = new JSDOM().window
  startKeyUX(window, [focusGroupKeyUX()])
  window.document.body.innerHTML =
    '<div focusgroup="wrap">' +
    '<button role="button" focusgroup="none">Button 1</button>' +
    '<button role="button" focusgroup="none">Button 2</button>' +
    '<button role="button" focusgroup="none">Button 3</button>' +
    '</div>'
  let buttons = window.document.querySelectorAll('button')
  buttons[0].focus()

  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowRight')
  equal(window.document.activeElement, buttons[0])

  press(window, 'ArrowLeft')
  equal(window.document.activeElement, buttons[0])

  press(window, 'Home')
  equal(window.document.activeElement, buttons[0])

  press(window, 'End')
  equal(window.document.activeElement, buttons[0])
})