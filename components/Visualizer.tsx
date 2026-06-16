'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  ALGORITHMS, Algorithm, AlgoState, Server,
  makeServers, SERVER_COLORS, SERVER_LABELS,
} from './algorithms'
import type { Packet } from './LBCanvas'

const LBCanvas = dynamic(() => import('./LBCanvas'), { ssr: false })

export default function Visualizer() {
  const [algo, setAlgo]       = useState<Algorithm>(ALGORITHMS[0])
  const [servers, setServers] = useState<Server[]>(makeServers())
  const [lastPick, setLastPick] = useState(-1)
  const [totalReqs, setTotalReqs] = useState(0)
  const [autoOn, setAutoOn]   = useState(false)
  const [animSpeed, setAnimSpeed] = useState(500)

  const algoStateRef = useRef<AlgoState>({})
  const packetsRef   = useRef<Packet[]>([])
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const serversRef   = useRef<Server[]>(makeServers())
  const algoRef      = useRef<Algorithm>(ALGORITHMS[0])

  useEffect(() => { algoRef.current = algo }, [algo])
  useEffect(() => { serversRef.current = servers }, [servers])

  const doReset = useCallback((newAlgo?: Algorithm) => {
    const a = newAlgo ?? algoRef.current
    const fresh = makeServers()
    serversRef.current = fresh
    packetsRef.current = []
    algoStateRef.current = {}
    a.init(algoStateRef.current)
    setServers([...fresh])
    setLastPick(-1)
    setTotalReqs(0)
    if (autoTimerRef.current) { clearInterval(autoTimerRef.current); autoTimerRef.current = null }
    setAutoOn(false)
  }, [])

  const sendReq = useCallback(() => {
    const a = algoRef.current
    const srvsCopy = serversRef.current.map(s => ({ ...s }))
    const pick = a.pick(algoStateRef.current, srvsCopy)

    srvsCopy[pick].conn++
    srvsCopy[pick].hits++
    srvsCopy[pick].bw  += Math.floor(Math.random() * 40) + 15
    srvsCopy[pick].rt   = Math.max(10, srvsCopy[pick].rt + (Math.random() * 12 - 6))
    serversRef.current  = srvsCopy
    setServers([...srvsCopy])
    setLastPick(pick)
    setTotalReqs(r => r + 1)

    packetsRef.current.push({
      ox: 640 * 0.29 + 88, oy: 130,
      tx: 640 * 0.72 - 34,  ty: 28 + pick * 56 + 20,
      t: 0, startTs: null, dur: animSpeed, srv: pick, alive: true,
    })

    setTimeout(() => {
      serversRef.current[pick].conn = Math.max(0, serversRef.current[pick].conn - 1)
      setServers([...serversRef.current])
    }, animSpeed * 5)
  }, [animSpeed])

  const toggleAuto = useCallback(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current)
      autoTimerRef.current = null
      setAutoOn(false)
    } else {
      autoTimerRef.current = setInterval(sendReq, animSpeed + 80)
      setAutoOn(true)
    }
  }, [animSpeed, sendReq])

  useEffect(() => {
    if (autoTimerRef.current) {
      clearInterval(autoTimerRef.current)
      autoTimerRef.current = setInterval(sendReq, animSpeed + 80)
    }
  }, [animSpeed, sendReq])

  useEffect(() => () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current) }, [])

  const handleAlgoChange = (a: Algorithm) => {
    algoRef.current = a
    setAlgo(a)
    doReset(a)
  }

  const maxHits = Math.max(1, ...servers.map(s => s.hits))

  function getMetric(s: Server) {
    if (algo.id === 'lc' || algo.id === 'wlc') return `conn: ${s.conn}   hits: ${s.hits}`
    if (algo.id === 'lrt') return `${Math.round(s.rt)}ms   hits: ${s.hits}`
    if (algo.id === 'lbw') return `${s.bw}kb   hits: ${s.hits}`
    if (algo.id === 'wrr') return `weight: ${s.weight}   hits: ${s.hits}`
    return `hits: ${s.hits}`
  }

  const card: React.CSSProperties = {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 20, padding: 20,
  }

  const btnBase: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, padding: '9px 18px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--bg3)',
    color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit',
  }

  return (
    <div style={{ padding: '32px 16px 56px', maxWidth: 860, margin: '0 auto' }}>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(20,241,149,0.08)', border: '1px solid rgba(20,241,149,0.2)',
          borderRadius: 999, padding: '6px 16px', marginBottom: 16,
          fontSize: 11, color: 'var(--green)', letterSpacing: '0.06em',
          textTransform: 'uppercase', fontFamily: 'monospace',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--green)', display: 'inline-block',
            animation: 'pulse 1.5s infinite',
          }} />
          System Design · Interactive Visualizer
        </div>

        <h1 style={{
          fontSize: 'clamp(22px,4vw,36px)', fontWeight: 800,
          letterSpacing: '-0.03em', color: '#fff', marginBottom: 8,
        }}>
          Load Balancing{' '}
          <span style={{ color: 'var(--green)' }}>Algorithms</span>
        </h1>

        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
          Select an algorithm · Send requests · Watch traffic distribution in real time
        </p>
      </div>

      <div style={card}>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          {ALGORITHMS.map(a => (
            <button
              key={a.id}
              onClick={() => handleAlgoChange(a)}
              style={{
                fontSize: 12, fontWeight: 500, padding: '6px 13px',
                borderRadius: 8,
                border: `1px solid ${a.id === algo.id ? a.color + '60' : 'var(--border)'}`,
                background: a.id === algo.id ? a.color + '18' : 'var(--bg3)',
                color: a.id === algo.id ? a.color : 'var(--muted)',
                cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
              }}
            >
              {a.name}
            </button>
          ))}
        </div>

        <LBCanvas
          servers={servers}
          lastPick={lastPick}
          algoId={algo.id}
          algoState={algoStateRef.current}
          packets={packetsRef}
          animSpeed={animSpeed}
        />

        <div
          className="server-bars"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, margin: '14px 0' }}
        >
          {servers.map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg3)',
              border: `1px solid ${lastPick === i ? SERVER_COLORS[i] + '50' : 'var(--border)'}`,
              borderRadius: 10, padding: '10px 12px', transition: 'border-color .2s',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: SERVER_COLORS[i], marginBottom: 6 }}>
                {SERVER_LABELS[i]}
                {lastPick === i && (
                  <span style={{
                    marginLeft: 6, fontSize: 9,
                    background: SERVER_COLORS[i] + '25', color: SERVER_COLORS[i],
                    padding: '1px 5px', borderRadius: 4,
                  }}>ACTIVE</span>
                )}
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  width: `${((s.hits / maxHits) * 100).toFixed(0)}%`,
                  background: SERVER_COLORS[i],
                }} className="srv-bar-fill" />
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>
                {getMetric(s)}
              </div>
            </div>
          ))}
        </div>

        <div
          className="stats-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}
        >
          {[
            { label: 'Algorithm',   val: algo.name,                                         col: undefined },
            { label: 'Total reqs',  val: String(totalReqs),                                 col: undefined },
            { label: 'Last server', val: lastPick >= 0 ? SERVER_LABELS[lastPick] : '—',     col: undefined },
            { label: 'Auto run',    val: autoOn ? '● ON' : 'OFF', col: autoOn ? 'var(--green)' : undefined },
          ].map(st => (
            <div key={st.label} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 12px',
            }}>
              <div style={{
                fontSize: 10, color: 'var(--muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5,
              }}>{st.label}</div>
              <div style={{
                fontSize: st.label === 'Algorithm' ? 12 : 20,
                fontWeight: 700, letterSpacing: '-0.02em',
                color: st.col ?? '#fff',
              }}>{st.val}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderLeft: `3px solid ${algo.color}`, borderRadius: '0 10px 10px 0',
          padding: '12px 16px', fontSize: 13, color: 'var(--muted)',
          lineHeight: 1.65, marginBottom: 16,
        }}>
          <span dangerouslySetInnerHTML={{ __html: algo.desc }} />
          <div style={{ marginTop: 8, fontSize: 11, color: algo.color }}>
            ✦ Best for: {algo.use}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={sendReq}
            style={{
              ...btnBase,
              border: '1px solid rgba(20,241,149,0.35)',
              background: 'rgba(20,241,149,0.1)',
              color: 'var(--green)', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ⚡ Send Request
          </button>

          <button
            onClick={toggleAuto}
            style={{
              ...btnBase,
              border: `1px solid ${autoOn ? 'rgba(212,80,80,0.4)' : 'var(--border)'}`,
              background: autoOn ? 'rgba(212,80,80,0.1)' : 'var(--bg3)',
              color: autoOn ? '#e07070' : 'var(--text)',
            }}
          >
            {autoOn ? '⏹ Stop' : '▶ Auto Run'}
          </button>

          <button onClick={() => doReset()} style={{ ...btnBase, color: 'var(--muted)' }}>
            ↺ Reset
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginLeft: 'auto', fontSize: 12, color: 'var(--muted)',
          }}>
            <span>Speed</span>
            <input
              type="range" min={150} max={1200} step={50} value={animSpeed}
              onChange={e => setAnimSpeed(Number(e.target.value))}
              style={{ width: 90, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span style={{ minWidth: 40, fontFamily: 'monospace' }}>{animSpeed}ms</span>
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: 'var(--muted)' }}>
        Built for system design learning · All 8 load balancing algorithms
      </p>
    </div>
  )
}
