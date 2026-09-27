# The script's PDF build. Lint runs before every LuaLaTeX pass: if the script
# breaks the grammar, the PDF is not rebuilt and the last good one stays.
$pdf_mode = 4;
$out_dir = 'out';
$lualatex = 'node ../scripts/script.ts lint --brief && lualatex -interaction=nonstopmode -halt-on-error -file-line-error -synctex=1 %O %S';
@default_files = ('main.tex', 'main-fa.tex');
$silent = 1;
$bibtex_use = 0;
$sleep_time = 1;
