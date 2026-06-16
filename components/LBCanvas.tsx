'use client'

import { useEffect, useRef } from 'react'
import { Server, AlgoState, SERVER_COLORS, SERVER_LABELS } from './algorithms'

interface Packet {
  ox: number; oy: number
  tx: number; ty: number
  t: number; startTs: number | null; dur: number
  srv: number; alive: boolean
}

interface Props {
  servers: Server[]
  lastPick: number
  algoId: string
  algoState: AlgoState
  packets: React.MutableRefObject<Packet[]>
  animSpeed: number
}

function ease(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t }


function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill: string, stroke: string, lw = 0.5
) {
  ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = lw
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath(); ctx.fill(); ctx.stroke()
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, col: string) {
  ctx.fillStyle = col; ctx.beginPath()
  ctx.moveTo(x + 7, y); ctx.lineTo(x, y - 4); ctx.lineTo(x, y + 4)
  ctx.closePath(); ctx.fill()
}

export type { Packet }
export { ease }

export default function LBCanvas({ servers, lastPick, algoId, algoState, packets, animSpeed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    function draw(ts: number) {
      const cw = canvas!.offsetWidth
      const ch = 260
      canvas!.width = cw
      canvas!.height = ch
      ctx.clearRect(0, 0, cw, ch)

      const lbX = cw * 0.29, lbW = 88, lbH = 96, lbY = ch / 2 - lbH / 2
      const sX = cw * 0.72, sW = 80, sH = 40
      const cliX = 16, cliW = 62, cliH = 42, cliY = ch / 2 - cliH / 2

      // ── CLIENT ──
      drawRoundRect(ctx, cliX, cliY, cliW, cliH, 8,
        'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.1)')
      ctx.fillStyle = '#bbb'; ctx.font = '600 11px system-ui'; ctx.textAlign = 'center'
      ctx.fillText('Client', cliX + cliW / 2, cliY + 15)
      ctx.fillStyle = '#555'; ctx.font = '10px monospace'
      ctx.fillText('HTTP', cliX + cliW / 2, cliY + 30)

      // client → lb arrow
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(cliX + cliW, ch / 2); ctx.lineTo(lbX - 1, ch / 2); ctx.stroke()
      ctx.setLineDash([])
      drawArrow(ctx, lbX - 1, ch / 2, 'rgba(255,255,255,0.12)')

      // ── LOAD BALANCER ──
      const lbActive = lastPick >= 0
      drawRoundRect(ctx, lbX, lbY, lbW, lbH, 12,
        'rgba(108,99,255,0.08)',
        lbActive ? 'rgba(108,99,255,0.65)' : 'rgba(108,99,255,0.22)',
        lbActive ? 1.5 : 0.7)
      ctx.fillStyle = '#a89fff'; ctx.font = '700 12px system-ui'; ctx.textAlign = 'center'
      ctx.fillText('Load', lbX + lbW / 2, lbY + 24)
      ctx.fillText('Balancer', lbX + lbW / 2, lbY + 40)
      ctx.fillStyle = 'rgba(108,99,255,0.75)'; ctx.font = '500 9px monospace'
      ctx.fillText(algoId.toUpperCase(), lbX + lbW / 2, lbY + 58)

      if (algoId === 'ip' && algoState.lastIP) {
        ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = '9px monospace'
        ctx.fillText(algoState.lastIP, lbX + lbW / 2, lbY + 74)
      }

      // ── SERVERS ──
      servers.forEach((s, i) => {
        const sy = 28 + i * 56
        const isA = lastPick === i
        const col = SERVER_COLORS[i]

        drawRoundRect(ctx, sX, sy, sW, sH, 8,
          'rgba(255,255,255,0.03)',
          isA ? col : 'rgba(255,255,255,0.09)',
          isA ? 1.5 : 0.5)

        ctx.fillStyle = isA ? col : 'rgba(255,255,255,0.6)'
        ctx.font = (isA ? '700' : '500') + ' 12px system-ui'; ctx.textAlign = 'center'
        ctx.fillText(SERVER_LABELS[i], sX + sW / 2, sy + 15)

        let metric = ''
        if (algoId === 'lc' || algoId === 'wlc') metric = `${s.conn} conn`
        else if (algoId === 'lrt') metric = `${Math.round(s.rt)}ms`
        else if (algoId === 'lbw') metric = `${s.bw}kb`
        else if (algoId === 'wrr') metric = `w:${s.weight}`
        else metric = `${s.hits} hits`

        ctx.fillStyle = isA ? col : '#555'; ctx.font = '9px monospace'
        ctx.fillText(metric, sX + sW / 2, sy + 30)

        // connector
        ctx.strokeStyle = isA ? col : 'rgba(255,255,255,0.06)'
        ctx.lineWidth = isA ? 1.2 : 0.5
        ctx.setLineDash(isA ? [] : [3, 5])
        ctx.beginPath()
        ctx.moveTo(lbX + lbW + 1, ch / 2)
        ctx.lineTo(sX - 2, sy + sH / 2)
        ctx.stroke(); ctx.setLineDash([])
        if (isA) drawArrow(ctx, sX - 2, sy + sH / 2, col)
      })

      // ── PACKETS ──
      const now = performance.now()
        packets.current = packets.current.filter(p => p.alive !== false)
      packets.current.forEach(p => {
        if (!p.startTs) p.startTs = now
        p.t = Math.min(1, (now - p.startTs) / p.dur)

        // visual target: snap to arrow tip so circles travel close to and end at the arrow
        let targetX = p.tx, targetY = p.ty
        // if going to a server, snap to server connector tip (same point as arrow)
        if (p.srv !== null && p.srv >= 0 && p.srv < servers.length) {
          const sy = 28 + p.srv * 56
          targetX = sX - 2
          targetY = sy + sH / 2
        } else {
          // if heading to the load balancer from client, snap to LB arrow tip
          const lbArrowX = lbX - 1
          const lbArrowY = ch / 2
          // simple heuristic: if original target is left of lb, assume it's the LB target
          if (p.tx <= lbArrowX + 10) {
            targetX = lbArrowX
            targetY = lbArrowY
          }
        }

        const px = p.ox + (targetX - p.ox) * ease(p.t)
        const py = p.oy + (targetY - p.oy) * ease(p.t)
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2)
        ctx.fillStyle = SERVER_COLORS[p.srv]; ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.stroke()
        if (p.t >= 1) p.alive = false
      }) 

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [servers, lastPick, algoId, algoState, packets])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '260px',
        borderRadius: '12px',
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        display: 'block',
      }}
    />
  )
}
