import dynamic from 'next/dynamic'
import Head from 'next/head'

const Platform = dynamic(() => import('../components/Platform'), { ssr: false })

export default function Home() {
  return (
    <>
      <Head>
        <title>SB Sector Coverage Intelligence Platform</title>
        <meta name="description" content="Standard Bank CIB — Energy & Infrastructure Sector Coverage" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Platform />
    </>
  )
}
