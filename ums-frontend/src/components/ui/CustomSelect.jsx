import React, { useState, useRef, useEffect } from 'react'

export default function CustomSelect({ value, onChange, options = [], placeholder = 'Select' }){
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const ref = useRef()
  const listId = `cs-${Math.random().toString(36).slice(2,8)}`

  useEffect(()=>{
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  },[])

  const selected = options.find(o => String(o.value) === String(value))

  function onKeyDown(e){
    if (e.key === 'ArrowDown'){
      e.preventDefault()
      if (!open) { setOpen(true); setHighlight(0); }
      else setHighlight(i => Math.min(i+1, options.length-1))
    } else if (e.key === 'ArrowUp'){
      e.preventDefault()
      if (!open) { setOpen(true); setHighlight(options.length-1); }
      else setHighlight(i => Math.max(i-1, 0))
    } else if (e.key === 'Enter'){
      e.preventDefault()
      if (open && highlight >= 0) { const opt = options[highlight]; onChange(opt.value); setOpen(false); }
      else setOpen(s => !s)
    } else if (e.key === 'Escape'){
      setOpen(false)
    }
  }

  useEffect(()=>{
    if (open && highlight >= 0){
      const el = ref.current?.querySelectorAll('.custom-select-item')[highlight]
      el?.scrollIntoView({ block:'nearest' })
    }
  },[highlight, open])

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        className="form-select"
        onClick={() => { setOpen(s => !s); setHighlight(options.findIndex(o=>String(o.value)===String(value))) }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        role="combobox"
        onKeyDown={onKeyDown}
      >
        <span className="cs-value">{selected ? selected.label : placeholder}</span>
        <span className="cs-arrow">▾</span>
      </button>
      {open && (
        <div id={listId} className="custom-select-list" role="listbox" tabIndex={-1} onKeyDown={onKeyDown}>
          {options.map((opt, idx) => (
            <div
              key={opt.value}
              role="option"
              aria-selected={String(opt.value)===String(value)}
              className={`custom-select-item ${String(opt.value)===String(value)?'selected':''} ${highlight===idx?'highlight':''}`}
              onMouseEnter={() => setHighlight(idx)}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
