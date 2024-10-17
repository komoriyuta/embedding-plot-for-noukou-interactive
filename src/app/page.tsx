"use client"

import dynamic from 'next/dynamic'

const TextEmbeddingVisualization = dynamic(() => import('@/components/embeddingPlot'), { ssr: false })

export default function Home() {
  return <TextEmbeddingVisualization />
}