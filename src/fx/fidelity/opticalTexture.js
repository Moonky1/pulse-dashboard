// One first-party scalar map; no sRGB conversion, mipmaps or video textures.
export function createOpticalTexture(gl, { enabled, url, onReady, onError, makeImage = () => new Image() }) {
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]))
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  let image, disposed = false
  if (enabled) {
    image = makeImage()
    image.onload = () => {
      if (disposed) return
      try {
        if (image.naturalWidth !== 256 || image.naturalHeight !== 128) throw new Error('Unexpected optical map dimensions')
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        onReady()
      } catch (error) { onError(error) }
    }
    image.onerror = () => { if (!disposed) onError(new Error('Optical map unavailable')) }
    image.src = url
  }
  return {
    bind() { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture) },
    dispose() { disposed = true; if (image) { image.onload = null; image.onerror = null }; gl.deleteTexture(texture) },
  }
}
