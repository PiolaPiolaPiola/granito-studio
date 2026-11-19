import type { Object3D } from 'three'

/** Nombre de archivo seguro: sin tildes ni símbolos raros. */
export function nombreArchivo(nombre: string): string {
  const limpio = nombre
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return limpio || 'diseno'
}

function descargar(url: string, archivo: string) {
  const enlace = document.createElement('a')
  enlace.download = archivo
  enlace.href = url
  enlace.click()
}

/** Imagen PNG de lo que se ve en el lienzo (necesita `preserveDrawingBuffer`). */
export function descargarImagen(lienzo: HTMLCanvasElement, nombre: string) {
  descargar(lienzo.toDataURL('image/png'), `${nombreArchivo(nombre)}.png`)
}

/**
 * Modelo 3D en formato glTF binario (.glb): se abre en Windows (Visor 3D), Blender,
 * SketchUp o se comparte por WhatsApp. El exportador se carga solo cuando se usa.
 */
export async function descargarModelo3D(escena: Object3D, nombre: string) {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
  const resultado = await new GLTFExporter().parseAsync(escena, { binary: true, onlyVisible: true })
  const blob = new Blob([resultado as ArrayBuffer], { type: 'model/gltf-binary' })
  const url = URL.createObjectURL(blob)
  descargar(url, `${nombreArchivo(nombre)}.glb`)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
