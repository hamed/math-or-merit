-- Draws the script's plain paragraphs for the PDF. It reads each line before
-- TeX does, so the source keeps the grammar's syntax (GRAMMAR.md) untouched:
--
--   "Name (manner): text"  opens a bubble; each later line is a line break
--   a line of only \label \marginpar \todo \adapt   attaches to the bubble
--   an action line inside a bubble                  is a cue, drawn as a tag
--   any other plain paragraph                        is a stage direction,
--                                                    or, in a unit, its words
--
-- Lines that start with a command (actions, structure, lists, figures) pass
-- through to the macros in main.tex. Files nest: a card is read in the middle
-- of the timeline, and the timeline carries on where it was. Every paragraph
-- ends with \flushcards, so a card dropped inside a bubble is drawn after it.
-- This file only draws; the TypeScript parser is the judge of what is valid.

local render = {}

local speakers = {}   -- display name -> id, filled by \speaker in decl.tex
local attach = { label = true, marginpar = true, todo = true, adapt = true }
local inline = {
  emph = true, textbf = true, large = true, Large = true, val = true,
  plural = true, gls = true, footnote = true, cite = true, ref = true,
}

local st = nil        -- the file being read now
local stack = {}      -- the files it was included from
local panel, count = '', 0

function render.speaker(id, name) speakers[name] = id end

-- open braces minus closed ones, escapes aside
local function depth(s)
  local d = 0
  for c in s:gsub('\\.', ''):gmatch('[{}]') do d = d + (c == '{' and 1 or -1) end
  return d
end

local function close()
  local out = ''
  if st.state == 'bubble' then out = '\\endbubble'
  elseif st.state == 'direction' then out = '\\enddirection'
  elseif st.state == 'words' then out = '\\endwords' end
  st.state, st.text_before = 'none', false
  return out .. '\\par\\flushcards'
end

local function structure(s)
  local label = s:match('\\label{([^}]*)}')
  if label and (s:match('^%s*\\subsection') or s:match('^%s*\\section')) then
    panel, count = label, 0
    if s:match('^%s*\\subsection') then return s .. '\\panelmark{' .. label .. '}' end
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

-- a command line that runs on to later lines: pass them through untouched
local function hold(s)
  st.open_braces = math.max(0, depth(s))
  return s
end

local function line(s)
  if st.open_braces > 0 then
    st.open_braces = math.max(0, st.open_braces + depth(s))
    return s
  end
  if s:match('^%s*$') then return close() end
  if s:match('^%s*%%') then return s end
  local cmd = s:match('^%s*\\(%a+)')

  if st.state == 'none' then
    if s:match('^%s*\\%[') then st.state = 'other'; return s end
    if cmd and not inline[cmd] then st.state = 'other'; return hold(structure(s)) end
    if st.unit then
      st.state, st.text_before = 'words', true
      return '\\words ' .. s
    end
    local id, manner, rest = head(s)
    if id then
      st.state, count = 'bubble', count + 1
      st.text_before = rest ~= ''
      return string.format('\\bubble{%s}{%s}{%s.%d}%s', id, manner, panel, count, rest)
    end
    st.state = 'direction'
    return '\\direction ' .. s
  end

  if st.state == 'bubble' or st.state == 'words' then
    if cmd and attach[cmd] then return hold(s) end
    if cmd == 'begin' or cmd == 'end' then st.text_before = false; return s end
    if cmd == 'item' then st.text_before = true; return s end
    -- an action cued by the bubble: its macro breaks the line itself
    if cmd and not inline[cmd] then return hold(s) end
    local out = st.text_before and ('\\\\ ' .. s) or s
    st.text_before = true
    return out
  end

  return s
end

-- kind: 'timeline' or 'unit'
function render.on(kind)
  if st then table.insert(stack, st)
  else luatexbase.add_to_callback('process_input_buffer', line, 'script') end
  st = { state = 'none', text_before = false, open_braces = 0, unit = kind == 'unit' }
end

function render.off()
  local out = close()
  st = table.remove(stack)
  if not st then luatexbase.remove_from_callback('process_input_buffer', 'script') end
  tex.sprint(out)
end

-- every .tex file in a folder, in name order, each through \unitinclude,
-- under a heading that only appears when there is something to put under it
function render.includeall(dir, sub, heading)
  local path = dir .. sub
  if lfs.attributes(path, 'mode') ~= 'directory' then return end
  local files = {}
  for f in lfs.dir(path) do
    if f:match('%.tex$') then files[#files + 1] = (f:gsub('%.tex$', '')) end
  end
  if #files == 0 then return end
  table.sort(files)
  tex.sprint('\\unitsheading{' .. heading .. '}')
  for _, f in ipairs(files) do tex.sprint('\\unitinclude{' .. sub .. '/' .. f .. '}') end
end

return render
