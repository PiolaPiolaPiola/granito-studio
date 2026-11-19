import { useCallback, useEffect, useRef, useState } from 'react'

/*
 * Dictado con la Web Speech API del navegador (Chrome y Edge). Es gratis y no usa la IA del
 * servidor; el navegador sí envía el audio a su propio servicio de reconocimiento.
 * Firefox y Safari no la soportan del todo: ahí se puede escribir o subir un audio.
 */

interface ResultadoReconocimiento {
  readonly isFinal: boolean
  readonly 0: { readonly transcript: string }
}

interface EventoReconocimiento {
  readonly resultIndex: number
  readonly results: ArrayLike<ResultadoReconocimiento>
}

interface Reconocedor {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((evento: EventoReconocimiento) => void) | null
  onerror: ((evento: { error: string }) => void) | null
  onend: (() => void) | null
}

type ConstructorReconocedor = new () => Reconocedor

function constructorReconocedor(): ConstructorReconocedor | undefined {
  const ventana = window as unknown as { SpeechRecognition?: ConstructorReconocedor; webkitSpeechRecognition?: ConstructorReconocedor }
  return ventana.SpeechRecognition ?? ventana.webkitSpeechRecognition
}

export function useDictado(onTexto: (texto: string) => void) {
  const [escuchando, setEscuchando] = useState(false)
  const [parcial, setParcial] = useState('')
  const [error, setError] = useState<string | null>(null)
  const reconocedor = useRef<Reconocedor | null>(null)
  const soportado = constructorReconocedor() !== undefined

  const detener = useCallback(() => reconocedor.current?.stop(), [])

  const empezar = useCallback(() => {
    const Constructor = constructorReconocedor()
    if (Constructor === undefined) return
    const r = new Constructor()
    r.lang = 'es-CO'
    r.continuous = false
    r.interimResults = true
    r.onresult = (evento) => {
      let texto = ''
      let final = false
      for (let i = evento.resultIndex; i < evento.results.length; i += 1) {
        texto += evento.results[i][0].transcript
        final ||= evento.results[i].isFinal
      }
      setParcial(texto)
      if (final) onTexto(texto.trim())
    }
    r.onerror = (e) => setError(e.error === 'not-allowed' ? 'El navegador no tiene permiso para usar el micrófono' : `No se pudo escuchar (${e.error})`)
    r.onend = () => setEscuchando(false)
    reconocedor.current = r
    setError(null)
    setParcial('')
    setEscuchando(true)
    r.start()
  }, [onTexto])

  useEffect(() => () => reconocedor.current?.stop(), [])

  return { soportado, escuchando, parcial, error, empezar, detener }
}
