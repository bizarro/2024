import { Fragment } from 'preact'

/**
 * The WebGL text renderer (src/app/scenes/Text.ts) reads `textContent` and
 * splits lines on real newline characters, so every <br /> must be followed
 * by a literal '\n' text node — same shape the Twig templates produced.
 */
export function lines(text: string[]) {
  return text.map((line, index) => (
    <Fragment key={index}>
      {line}
      {index < text.length - 1 && (
        <Fragment>
          <br />
          {'\n'}
        </Fragment>
      )}
    </Fragment>
  ))
}
