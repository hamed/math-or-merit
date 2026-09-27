-- Draws the script's plain paragraphs for the PDF. It reads each line before
-- TeX does, so the source keeps the grammar's syntax (GRAMMAR.md) untouched:
--
--   "Name (manner): text"  opens a bubble; each later line is a line break
--   a line of only \label \marginpar \todo \adapt   attaches to the bubble
--   any other plain paragraph                        is a stage direction
--
-- Lines that start with a command (actions, structure, lists) pass through to
-- the macros in main.tex. This file only draws; the TypeScript parser is the
-- judge of what is valid.

local render = {}

local speakers = {}   -- display name -> id, filled by \speaker in decl.tex
local attach = { label = true, marginpar = true, todo = true, adapt = true }
local inline = {
  emph = true, textbf = true, large = true, Large = true, val = true,
  plural = true, gls = true, footnote = true, cite = true, ref = true,
}

local state = 'none'  -- 'none' | 'bubble' | 'direction' | 'other'
local text_before = false
local panel, count = '', 0

function render.speaker(id, name) speakers[name] = id end

local function close()
  local out = ''
  if state == 'bubble' then out = '\\endbubble'
  elseif state == 'direction' then out = '\\enddirection' end
  state, text_before = 'none', false
  return out
end

local function structure(s)
  local label = s:match('\\label{([^}]*)}')
  if label and (s:match('^%s*\\subsection') or s:match('^%s*\\section')) then
    panel, count = label, 0
    return s .. '\\panelmark{' .. label .. '}'
  end
  return s
end

local function head(s)
  local name, manner, rest = s:match('^%s*([^:%(]-)%s*%(([^)]*)%)%s*:%s*(.*)$')
  if not name then
    name, rest = s:match('^%s*([^:%(]-)%s*:%s*(.*)$')
    manner = ''
  end
  if name and speakers[name] then return speakers[name], manner, rest end
end

local function line(s)
  if s:match('^%s*$') then return close() end
  if s:match('^%s*%%') then return s end
  local cmd = s:match('^%s*\\(%a+)')

  if state == 'none' then
    if cmd and not inline[cmd] then state = 'other'; return structure(s) end
    local id, manner, rest = head(s)
    if id then
      state, count = 'bubble', count + 1
      text_before = rest ~= ''
      return string.format('\\bubble{%s}{%s}{%s.%d}%s', id, manner, panel, count, rest)
    end
    state = 'direction'
    return '\\direction ' .. s
  end

  if state == 'bubble' then
    if cmd and attach[cmd] then return s end
    if cmd == 'begin' or cmd == 'end' then text_before = false; return s end
    if cmd == 'item' then text_before = true; return s end
    -- an action cued by the bubble: its macro breaks the line itself
    if cmd and not inline[cmd] then return s end
    local out = text_before and ('\\\\ ' .. s) or s
    text_before = true
    return out
  end

  return s
end

function render.on()
  luatexbase.add_to_callback('process_input_buffer', line, 'script')
end

function render.off()
  luatexbase.remove_from_callback('process_input_buffer', 'script')
  tex.sprint(close())
end

return render
