import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'

export function useGSAP() {
  gsap.registerPlugin(Observer, Draggable, InertiaPlugin)

  return {
    gsap,
    Observer,
    Draggable,
  }
}
