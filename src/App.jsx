import React, { useEffect, useMemo, useState, useRef } from 'react'

const STORAGE_KEY = 'sl_logistics_entries_v1'
const SETTINGS_KEY = 'sl_logistics_settings_v1'

function mm(v) { return `${v}mm` }

function uid() { return Math.random().toString(36).slice(2, 9) }

export default function App() {
  const [lrNo, setLrNo] = useState('')
  const [destination, setDestination] = useState('')
  const [pieces, setPieces] = useState(1)
  const [piecesPerBox, setPiecesPerBox] = useState(10)
  const [entries, setEntries] = useState([])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [alignX, setAlignX] = useState(0)
  const [alignY, setAlignY] = useState(0)
  const [lrX, setLrX] = useState(35)
  const [lrY, setLrY] = useState(30)
  const [destX, setDestX] = useState(30)
  const [destY, setDestY] = useState(48)
  const [piecesX, setPiecesX] = useState(25)
  const [piecesY, setPiecesY] = useState(72)
  const [boxX, setBoxX] = useState(70)
  const [boxY, setBoxY] = useState(72)
  const [fontSize, setFontSize] = useState(28)

  const printAreaRef = useRef(null)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) setEntries(JSON.parse(raw))
    const sraw = localStorage.getItem(SETTINGS_KEY)
    if (sraw) {
      const s = JSON.parse(sraw)
      setPiecesPerBox(s.piecesPerBox ?? 10)
      setAlignX(s.alignX ?? 0)
      setAlignY(s.alignY ?? 0)
      setLrX(s.lrX ?? 35)
      setLrY(s.lrY ?? 30)
      setDestX(s.destX ?? 30)
      setDestY(s.destY ?? 48)
      setPiecesX(s.piecesX ?? 25)
      setPiecesY(s.piecesY ?? 72)
      setBoxX(s.boxX ?? 70)
      setBoxY(s.boxY ?? 72)
      setFontSize(s.fontSize ?? 28)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      piecesPerBox,
      alignX,
      alignY,
      lrX,
      lrY,
      destX,
      destY,
      piecesX,
      piecesY,
      boxX,
      boxY,
      fontSize
    }))
  }, [piecesPerBox, alignX, alignY, lrX, lrY, destX, destY, piecesX, piecesY, boxX, boxY, fontSize])

  function generateBoxes(piecesCount) {
    const total = Number(piecesCount) || 0
    if (total <= 0) {
      return [{ pieces: total, boxIndex: 1, totalBoxes: 1 }]
    }
    const boxes = []
    for (let i = 1; i <= total; i++) {
      boxes.push({ pieces: total, boxIndex: i, totalBoxes: total })
    }
    return boxes
  }

  function addEntry(e) {
    e && e.preventDefault()
    if (!lrNo) return alert('LR No required')
    const entry = {
      id: uid(),
      lrNo,
      destination,
      pieces: Number(pieces) || 0,
      boxes: generateBoxes(Number(pieces) || 0, Number(piecesPerBox) || 0),
      createdAt: Date.now()
    }
    setEntries(prev => [entry, ...prev])
    setLrNo('')
    setDestination('')
    setPieces(1)
  }

  function allGeneratedStickers(filteredOnly = true) {
    const list = []
    entries.forEach(entry => {
      if (filter && !entry.lrNo.toLowerCase().includes(filter.toLowerCase())) return
      entry.boxes.forEach(b => {
        list.push({
          id: `${entry.id}-${b.boxIndex}`,
          lrNo: entry.lrNo,
          destination: entry.destination,
          pieces: b.pieces,
          boxNo: `${b.boxIndex}/${b.totalBoxes}`
        })
      })
    })
    return list
  }

  const stickerItems = useMemo(() => allGeneratedStickers(true), [entries, filter])

  function toggleSelect(id) {
    setSelected(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function clearAll() {
    if (!confirm('Clear all saved entries?')) return
    setEntries([])
    setSelected(new Set())
    localStorage.removeItem(STORAGE_KEY)
  }

  function renderPrint(stickers) {
    if (!printAreaRef.current) return
    const container = printAreaRef.current
    container.innerHTML = ''

    const STICKER_W = 100 // mm
    const STICKER_H = 110 // mm
    const PAGE_W = 210
    const PAGE_H = 297
    const LEFT_MARGIN_LEFT = 5
    const LEFT_MARGIN_RIGHT = 105
    const TOP_MARGIN_TOP = 10
    const TOP_MARGIN_BOTTOM = 130

    let page = null
    stickers.forEach((s, i) => {
      const pageIndex = Math.floor(i / 4)
      const positionInPage = i % 4
      const column = positionInPage % 2
      const row = Math.floor(positionInPage / 2)
      if (!container.children[pageIndex]) {
        const pg = document.createElement('div')
        pg.className = 'print-page'
        pg.style.width = mm(PAGE_W)
        pg.style.height = mm(PAGE_H)
        container.appendChild(pg)
      }
      page = container.children[pageIndex]

      const stk = document.createElement('div')
      stk.className = 'print-sticker'
      stk.style.width = mm(STICKER_W)
      stk.style.height = mm(STICKER_H)
      stk.style.left = mm(column === 0 ? LEFT_MARGIN_LEFT : LEFT_MARGIN_RIGHT)
      stk.style.top = mm(row === 0 ? TOP_MARGIN_TOP : TOP_MARGIN_BOTTOM)
      stk.style.position = 'absolute'

      // fields
      const fields = [
        { text: s.lrNo, x: lrX + alignX, y: lrY + alignY },
        { text: s.destination, x: destX + alignX, y: destY + alignY },
        { text: String(s.pieces), x: piecesX + alignX, y: piecesY + alignY },
        { text: s.boxNo, x: boxX + alignX, y: boxY + alignY },
      ]

      fields.forEach(f => {
        const el = document.createElement('div')
        el.className = 'print-field'
        el.style.left = mm(f.x)
        el.style.top = mm(f.y)
        el.style.position = 'absolute'
        el.style.fontWeight = '700'
        el.style.fontSize = `${fontSize}px`
        el.textContent = f.text
        stk.appendChild(el)
      })

      page.appendChild(stk)
    })
  }

  function doPrint(stickers) {
    renderPrint(stickers)
    setTimeout(() => window.print(), 200)
  }

  function printAll() { doPrint(allGeneratedStickers(false)) }

  function printSelected() {
    const sel = stickerItems.filter(s => selected.has(s.id))
    if (sel.length === 0) return alert('No stickers selected')
    doPrint(sel)
  }

  function printSingleSticker(sticker) {
    doPrint([sticker])
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>SL LOGISTICS — Sticker Printing</h1>
        <p>Print text onto pre-printed stickers on A4 (100×110mm)</p>
      </header>

      <div className="app-grid">
        <section className="panel">
          <h2>Load Entry</h2>
          <form className="entry-form" onSubmit={addEntry}>
            <label>
              LR No
              <input value={lrNo} onChange={e => setLrNo(e.target.value)} />
            </label>
            <label>
              Destination
              <input value={destination} onChange={e => setDestination(e.target.value)} />
            </label>
            <label>
              No. of Pieces
              <input type="number" min={1} value={pieces} onChange={e => setPieces(e.target.value)} />
            </label>
            <div className="form-actions">
              <button className="primary" type="submit">Add Entry</button>
              <button type="button" className="secondary" onClick={() => { setLrNo(''); setDestination(''); setPieces(1) }}>Clear</button>
              <button type="button" className="secondary" onClick={clearAll}>Clear All</button>
            </div>
          </form>

          <h3 style={{marginTop:20}}>Settings</h3>
          <div className="settings-card">
            <label>
              Pieces per box (auto-generate)
              <input type="number" min={1} value={piecesPerBox} onChange={e => setPiecesPerBox(Number(e.target.value)||1)} />
            </label>
            <label>
              Alignment X (mm)
              <input type="number" value={alignX} onChange={e => setAlignX(Number(e.target.value)||0)} />
            </label>
            <label>
              Alignment Y (mm)
              <input type="number" value={alignY} onChange={e => setAlignY(Number(e.target.value)||0)} />
            </label>
            <label>
              LR X (mm)
              <input type="number" value={lrX} onChange={e => setLrX(Number(e.target.value)||35)} />
            </label>
            <label>
              LR Y (mm)
              <input type="number" value={lrY} onChange={e => setLrY(Number(e.target.value)||30)} />
            </label>
            <label>
              Destination X (mm)
              <input type="number" value={destX} onChange={e => setDestX(Number(e.target.value)||30)} />
            </label>
            <label>
              Destination Y (mm)
              <input type="number" value={destY} onChange={e => setDestY(Number(e.target.value)||58)} />
            </label>
            <label>
              Pieces X (mm)
              <input type="number" value={piecesX} onChange={e => setPiecesX(Number(e.target.value)||25)} />
            </label>
            <label>
              Pieces Y (mm)
              <input type="number" value={piecesY} onChange={e => setPiecesY(Number(e.target.value)||78)} />
            </label>
            <label>
              Box X (mm)
              <input type="number" value={boxX} onChange={e => setBoxX(Number(e.target.value)||70)} />
            </label>
            <label>
              Box Y (mm)
              <input type="number" value={boxY} onChange={e => setBoxY(Number(e.target.value)||78)} />
            </label>
            <label>
              Font Size (px)
              <input type="number" min={1} value={fontSize} onChange={e => setFontSize(Number(e.target.value)||28)} />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Preview & Print</h2>
          <div className="search-card">
            <label>
              Search by LR No
              <input value={filter} onChange={e => setFilter(e.target.value)} />
            </label>
          </div>

          <div style={{marginTop:12}} className="button-row">
            <button className="primary" onClick={printAll}>Print All</button>
            <button className="primary" onClick={printSelected}>Print Selected</button>
          </div>

          <div style={{marginTop:16}} className="entry-list">
            {stickerItems.length === 0 && <div className="empty-state">No stickers — add entries to generate stickers.</div>}
            {stickerItems.map(s => (
              <div key={s.id} className="entry-card">
                <div className="entry-row">
                  <div>
                    <div><strong>LR:</strong> {s.lrNo}</div>
                    <div><strong>Dest:</strong> {s.destination}</div>
                    <div className="entry-meta"><strong>Pieces:</strong> {s.pieces} — <strong>Box:</strong> {s.boxNo}</div>
                  </div>
                  <div className="entry-actions">
                    <label className="select-row"><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} /> Select</label>
                    <button className="secondary" onClick={() => printSingleSticker(s)}>Reprint</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="print-area" ref={printAreaRef} aria-hidden />
    </div>
  )
}