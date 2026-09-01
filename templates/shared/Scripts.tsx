const isDev = process.env.NODE_ENV !== 'production'
const vitePort = process.env.VITE_PORT ?? '5173'
const viteOrigin = process.env.VITE_ORIGIN ?? `http://localhost:${vitePort}`

export default function Scripts() {
  return (
    <>
      {isDev ? (
        <>
          <script type="module" src={`${viteOrigin}/@vite/client`}></script>
          <script type="module" src={`${viteOrigin}/app/index.ts`}></script>
        </>
      ) : (
        <script type="module" src="/bundle.js"></script>
      )}
    </>
  )
}
