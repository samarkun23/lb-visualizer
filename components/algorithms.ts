export interface Server {
  conn: number
  weight: number
  rt: number   // response time ms
  bw: number   // bandwidth kb
  hits: number
}

export interface AlgoState {
  ptr?: number
  list?: number[]
  ips?: string[]
  ipIdx?: number
  lastIP?: string
}

export interface Algorithm {
  id: string
  name: string
  shortDesc: string
  desc: string
  use: string
  badge: string
  color: string
  init: (s: AlgoState) => void
  pick: (s: AlgoState, srvs: Server[]) => number
}

export const ALGORITHMS: Algorithm[] = [
  {
    id: 'rr',
    name: 'Round Robin',
    shortDesc: 'Cycles servers in order',
    desc: '<strong>Round Robin</strong> distributes requests sequentially — one to each server in turn before cycling back. Simple, predictable, zero overhead.',
    use: 'Stateless APIs, equal-capacity servers',
    badge: 'Simple',
    color: '#3B8BD4',
    init(s) { s.ptr = 0 },
    pick(s, srvs) {
      const i = (s.ptr ?? 0) % srvs.length
      s.ptr = (s.ptr ?? 0) + 1
      return i
    },
  },
  {
    id: 'lc',
    name: 'Least Connections',
    shortDesc: 'Routes to least busy server',
    desc: '<strong>Least Connections</strong> routes each new request to the server with the fewest active connections — naturally handles variable request durations.',
    use: 'Long-lived connections, WebSockets, DB proxies',
    badge: 'Smart',
    color: '#1D9E75',
    init(s) {},
    pick(s, srvs) {
      return srvs.reduce((m, v, i) => v.conn < srvs[m].conn ? i : m, 0)
    },
  },
  {
    id: 'wrr',
    name: 'Weighted Round Robin',
    shortDesc: 'Higher capacity = more requests',
    desc: '<strong>Weighted Round Robin</strong> assigns different weights to servers. A server with weight 3 gets 3× more requests than weight 1. Great for mixed hardware.',
    use: 'Mixed-capacity server fleets',
    badge: 'Capacity',
    color: '#9B8FF7',
    init(s) { s.list = []; s.ptr = 0 },
    pick(s, srvs) {
      if (!s.list || s.list.length === 0) {
        s.list = []
        srvs.forEach((sv, i) => { for (let w = 0; w < sv.weight; w++) s.list!.push(i) })
      }
      const i = s.list[(s.ptr ?? 0) % s.list.length]
      s.ptr = (s.ptr ?? 0) + 1
      return i
    },
  },
  {
    id: 'wlc',
    name: 'Weighted Least Conn',
    shortDesc: 'Capacity + connections score',
    desc: '<strong>Weighted Least Connections</strong> computes score = connections ÷ weight. The server with the lowest score wins — balances both capacity and current load.',
    use: 'Mixed capacity + variable request durations',
    badge: 'Advanced',
    color: '#E8A020',
    init(s) {},
    pick(s, srvs) {
      return srvs.reduce((m, v, i) =>
        (v.conn / v.weight) < (srvs[m].conn / srvs[m].weight) ? i : m, 0)
    },
  },
  {
    id: 'ip',
    name: 'IP Hash',
    shortDesc: 'Same client → same server',
    desc: '<strong>IP Hash</strong> hashes the client IP address and maps it consistently to the same server — sticky sessions without shared state.',
    use: 'Session persistence, stateful apps, shopping carts',
    badge: 'Sticky',
    color: '#D45050',
    init(s) {
      s.ips = ['10.0.1.1', '10.0.1.2', '10.0.2.5', '172.16.0.3', '192.168.1.10', '10.0.3.7']
      s.ipIdx = 0
      s.lastIP = ''
    },
    pick(s, srvs) {
      const ip = s.ips![(s.ipIdx ?? 0) % s.ips!.length]
      s.lastIP = ip
      s.ipIdx = (s.ipIdx ?? 0) + 1
      const h = ip.split('.').reduce((a, x) => a * 31 + parseInt(x), 0)
      return Math.abs(h) % srvs.length
    },
  },
  {
    id: 'lrt',
    name: 'Least Response Time',
    shortDesc: 'Routes to fastest server',
    desc: '<strong>Least Response Time</strong> continuously monitors each server\'s average response time and always routes to the fastest one.',
    use: 'Latency-sensitive APIs, real-time apps, trading systems',
    badge: 'Latency',
    color: '#14F195',
    init(s) {},
    pick(s, srvs) {
      return srvs.reduce((m, v, i) => v.rt < srvs[m].rt ? i : m, 0)
    },
  },
  {
    id: 'rand',
    name: 'Random',
    shortDesc: 'Random server selection',
    desc: '<strong>Random</strong> picks a server at random for each request. With enough requests, distribution approaches equal — zero coordination overhead.',
    use: 'Massive scale, stateless microservices, CDN edge',
    badge: 'Zero overhead',
    color: '#F7C948',
    init(s) {},
    pick(s, srvs) { return Math.floor(Math.random() * srvs.length) },
  },
  {
    id: 'lbw',
    name: 'Least Bandwidth',
    shortDesc: 'Routes to least bandwidth server',
    desc: '<strong>Least Bandwidth</strong> routes to the server currently consuming the least network bandwidth. Essential for variable-size payloads.',
    use: 'Media streaming, file transfer, large payload APIs',
    badge: 'Network',
    color: '#C084FC',
    init(s) {},
    pick(s, srvs) {
      return srvs.reduce((m, v, i) => v.bw < srvs[m].bw ? i : m, 0)
    },
  },
]

export const SERVER_COLORS = ['#3B8BD4', '#1D9E75', '#E8A020', '#D45050']
export const SERVER_LABELS = ['S1', 'S2', 'S3', 'S4']
export const SERVER_NAMES  = ['Server 1', 'Server 2', 'Server 3', 'Server 4']

export function makeServers(): Server[] {
  return [
    { conn: 0, weight: 3, rt: 42, bw: 0, hits: 0 },
    { conn: 0, weight: 2, rt: 68, bw: 0, hits: 0 },
    { conn: 0, weight: 1, rt: 29, bw: 0, hits: 0 },
    { conn: 0, weight: 2, rt: 55, bw: 0, hits: 0 },
  ]
}
