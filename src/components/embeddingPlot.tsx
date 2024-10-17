"use client"

import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

import { performPCA ,getEmbeddings} from './doEmbeddingPCA'
//import { getEmbeddings } from './geminiEmbedding'

const mockGeminiEmbedding = async (text: string) => {
  return Array.from({ length: 512 }, () => Math.random() - 0.5)
}


const projectTo3D = (vector: number[]) => {
  const [x, y, z, w] = vector
  const scale = 1 / (w + 2)
  return [x * scale, y * scale, z * scale]
}


const create4DRotationMatrix = (time: number) => {
  const c1 = Math.cos(time * 0.025)
  const s1 = Math.sin(time * 0.025)
  const c2 = Math.cos(time * 0.05)
  const s2 = Math.sin(time * 0.05)

  return [
    [c1, -s1, 0, 0],
    [s1, c1, 0, 0],
    [0, 0, c2, -s2],
    [0, 0, s2, c2]
  ]
}

const rotate4D = (vector: number[], matrix: number[][]) => {
  return matrix.map(row => 
    row.reduce((sum, val, i) => sum + val * vector[i], 0)
  )
}

const rotate2D = (vector: number[], angle: number) => {
  const [x, y] = vector
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [x * cos - y * sin, x * sin + y * cos, 0]
}

interface StarProps {
  position: [number, number, number]
  text: string
}

function Star({ position, text }: StarProps) {
  const mesh = useRef<THREE.Mesh>(null!)
  const [hovered, setHover] = useState(false)

  useFrame((state, delta) => {
    mesh.current.rotation.x += delta * 0.05
    mesh.current.rotation.y += delta * 0.025
  })

  return (
    <group>
      <mesh
        ref={mesh}
        position={position}
        scale={hovered ? 1.5 : 1}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[0.005, 16, 16]} />
        <meshStandardMaterial color={hovered ? '#00FFFF' : 'white'} emissive={hovered ? '#00FFFF' : 'white'} emissiveIntensity={0.5} />
      </mesh>
      <Text
        position={[position[0], position[1] + 0.1, position[2]]}
        fontSize={0.005}
        color="white"
        anchorX="center"
        anchorY="bottom"
      >
        {text}
      </Text>
    </group>
  )
}

function RotatingStars({ embeddings4D, texts, is2DMode }: { embeddings4D: number[][], texts: string[], is2DMode: boolean }) {
  const [embeddings, setEmbeddings] = useState<[number, number, number][]>([])

  useFrame((state) => {
    if (is2DMode) {
      const angle = state.clock.getElapsedTime() * 0.1
      const rotatedEmbeddings = embeddings4D.map(embedding => 
        rotate2D(embedding.slice(0, 2) as [number, number], angle)
      )
      setEmbeddings(rotatedEmbeddings as [number, number, number][])
    } else {
      const rotationMatrix = create4DRotationMatrix(state.clock.getElapsedTime())
      const rotatedEmbeddings = embeddings4D.map(embedding => 
        rotate4D(embedding, rotationMatrix)
      )
      const projectedEmbeddings = rotatedEmbeddings.map(embedding => 
        projectTo3D(embedding) as [number, number, number]
      )
      setEmbeddings(projectedEmbeddings)
    }
  })

  return (
    <>
      {embeddings.map((position, index) => (
        <Star key={index} position={position} text={texts[index]} />
      ))}
    </>
  )
}

export default function TextEmbeddingVisualization() {
  const [embeddings4D, setEmbeddings4D] = useState<number[][]>([])
  const [is2DMode, setIs2DMode] = useState(false)
  const texts =[
    "学園祭、最高に盛り上がってて、あっという間に終わっちゃった！",
    "今年はテーマが斬新で、今までにない学園祭だった！",
    "準備段階からみんなで協力して作り上げた達成感でいっぱい！",
    "友達の出し物、想像をはるかに超えてて感動した！",
    "後夜祭のライブ、熱気に包まれて鳥肌が立った！",
    "屋台の賑わいと、友達との会話が忘れられない思い出になった！",
    "今年の学園祭は、青春って感じがして最高だった！",
    "来年も絶対に来たい！",
    "準備期間も楽しかったけど、本番はもっと楽しかった！",
    "来年はもっと積極的に参加したい！",
    "友達との絆を深められた貴重な時間だった！",
    "初めての学園祭だったけど、想像以上に楽しめた！",
    "思い出いっぱいの学園祭、本当にありがとう！",
    "来年もこんな楽しい学園祭になるといいな！",
    "友達とたくさん笑って、最高の思い出ができた！",
    "企画段階からワクワクドキドキだった！",
    "実行委員のみんな、本当にお疲れ様でした！",
    "来年は自分も実行委員として参加したい！",
    "準備期間も本番も、すべてが貴重な経験になった！",
    "学園祭を通して、新しい友達もできた！",
    "来年はもっと積極的にイベントに参加したい！",
    "先輩たちの熱意が伝わってきて、自分も頑張ろうと思った！",
    "学園祭の雰囲気に、自分も元気をもらえた！",
    "みんなで協力して作り上げる喜びを感じられた！",
    "友達との思い出が、宝物になった！",
    "来年も、こんな素敵な学園祭を期待しています！",
    "実行委員の皆さんの努力に感謝します！",
    "学園祭の企画力に脱帽しました！",
    "来年は自分も企画に参加してみたい！",
    "学園祭を通して、学生生活の充実を感じられた！",
    "準備期間の苦労が報われた瞬間だった！",
    "学園祭の成功、本当に嬉しいです！",
    "来年も、こんな素敵な学園祭を開催してください！",
    "友達と一緒に作り上げた思い出、一生忘れません！",
    "学園祭を通して、新しい発見がありました！",
    "実行委員の皆さん、本当に素晴らしい学園祭をありがとうございました！",
    "来年も、もっと楽しい学園祭になることを期待しています！",
    "学園祭の思い出は、一生の宝物です！",
    "準備期間の苦労も、今では良い思い出です！",
    "学園祭を通して、学生生活を満喫できた！",
    "来年も、こんな楽しい学園祭に参加したい！",
    "学園祭の雰囲気に、心が躍りました！",
    "友達との絆が、より一層深まりました！",
    "学園祭を通して、たくさんのことを学びました！",
    "来年は、もっと積極的にイベントに参加したい！",
    "学園祭は、学生生活の大切なイベントです！",
    "来年も、素敵な学園祭になることを願っています！",
    "学園祭の思い出は、一生忘れられません！",
    "友達との思い出が、胸いっぱいです！",
    "学園祭を通して、貴重な経験ができました！",
    "来年も、こんな楽しい学園祭に参加したいです！",
    "学園祭の企画力に、感心しました！",
    "実行委員の皆さん、本当にお疲れ様でした！",
    "来年は、自分も実行委員として参加したいです！",
    "学園祭を通して、学生生活を満喫できました！",
    "来年も、素敵な学園祭を開催してください！",
    "学園祭の思い出は、一生の宝物です！",
    "友達との絆が、より一層深まりました！",
    "学園祭を通して、たくさんのことを学びました！",
    "来年も、もっと楽しい学園祭になることを期待しています！",
    "学園祭の企画力に、感銘を受けました！",
    "実行委員の皆さん、素晴らしい学園祭をありがとうございました！",
    "来年は、自分も企画に参加してみたい！",
    "学園祭を通して、学生生活の充実を感じられました！",
    "来年も、こんな楽しい学園祭に参加したいです！",
    "学園祭の雰囲気に、心が躍りました！",
    "友達との思い出が、胸いっぱいです！",
    "学園祭を通して、貴重な経験ができました！",
    "来年も、素敵な学園祭になることを願っています！",
    "学園祭の思い出は、一生忘れられません！",
    "友達との絆が、より一層深まりました！",
    "学園祭を通して、たくさんのことを学びました！",
    "来年は、もっと積極的にイベントに参加したい！",
    "学園祭は、学生生活の大切なイベントです！",
    "来年も、こんな楽しい学園祭を開催してください！",
    "学園祭の思い出は、一生の宝物です！",
    "友達との思い出が、胸いっぱいです！",
    "学園祭を通して、貴重な経験ができました！",
    "来年も、素敵な学園祭になることを願っています！",
    "学園祭の思い出は、一生忘れられません！",
    "友達との絆が、より一層深まりました！",
    "学園祭を通して、たくさんのことを学びました！",
    "来年は、もっと積極的にイベントに参加したい！",
    "学園祭は、学生生活の大切なイベントです！",
    ]
    useEffect(() => {
      const fetchEmbeddings = async () => {
        try {
          const { embeddings: rawEmbeddings } = await getEmbeddings(texts);
          const embeddings4D = await performPCA(rawEmbeddings);
          setEmbeddings4D(embeddings4D);
        } catch (error) {
          console.error("Failed to get embeddings:", error);
          // エラーに応じた処理を行う (例: エラー状態を表示、デフォルト値を設定など)
        }
      };
    
      fetchEmbeddings();
    }, [texts]); // texts が変更されたときに再実行
    if (!embeddings4D) {
      return <div>Loading...</div>; // またはローディングインジケータなど
    }
  return (
    <div style={{ width: '100%', height: '100vh', background: 'black' }}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <color attach="background" args={['black']} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        {!is2DMode && <OrbitControls />}
        <RotatingStars embeddings4D={embeddings4D} texts={texts} is2DMode={is2DMode} />
      </Canvas>
      <button
        onClick={() => setIs2DMode(!is2DMode)}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Switch to {is2DMode ? '3D' : '2D'} Mode
      </button>
    </div>
  )
}