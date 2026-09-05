
import sys

main_path = r'c:\Users\User\Desktop\이희서\웹\PUZZLE 웹 개발\main.html'
work_path = r'c:\Users\User\Desktop\이희서\웹\PUZZLE 웹 개발\work.html'

def get_lines(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.readlines()

def write_lines(path, lines):
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

main_lines = get_lines(main_path)
work_lines = get_lines(work_path)

# --- Extract Main HTML parts ---
# 1. CSS (up to </style>)
main_style_end = next(i for i, l in enumerate(main_lines) if l.strip() == '</style>')
main_css = main_lines[:main_style_end+1]

# 2. works-intro section end
works_intro_end = None
for i, l in enumerate(main_lines):
    if 'class="section works-intro"' in l:
        depth = 0
        for j in range(i, len(main_lines)):
            stripped = main_lines[j].strip()
            if stripped.startswith('<section'):
                depth += 1
            if stripped == '</section>':
                depth -= 1
                if depth == 0:
                    works_intro_end = j
                    break
        break

# 3. end of main's content (</main>)
main_close = next(i for i, l in enumerate(main_lines) if l.strip() == '</main>')

# 4. Content to SWAP to work (from works_intro_end+1 to main_close (exclusive))
# This is Category through puzzle-section
main_content = main_lines[works_intro_end+1:main_close]

# 5. Extract JS from main
main_script_start = next(i for i, l in enumerate(main_lines) if l.strip() == '<script>')
main_script_end = next(i for i, l in enumerate(main_lines) if l.strip() == '</script>')
main_js = main_lines[main_script_start:main_script_end+1]


# --- Extract Work HTML parts ---
# 1. CSS (up to </style>)
work_style_end = next(i for i, l in enumerate(work_lines) if l.strip() == '</style>')
work_css = work_lines[:work_style_end+1]

# 2. Header end
work_header_end = next(i for i, l in enumerate(work_lines) if l.strip() == '</header>')

# 3. end of work's content (</main>)
work_main_close = next(i for i, l in enumerate(work_lines) if l.strip() == '</main>')

# 4. Content to SWAP to main (from work_header_end+1 to work_main_close+1 (inclusive of </main> because main.html already has one, wait))
# In work.html, the content is <main class="works-section"> ... </main>.
# We should swap work's entire <main class="works-section"> block.
work_content = work_lines[work_header_end+1:work_main_close+1]

# 5. Extract JS from work
work_script_start = next(i for i, l in enumerate(work_lines) if l.strip() == '<script>')
work_script_end = next(i for i, l in enumerate(work_lines) if l.strip() == '</script>')
work_js = work_lines[work_script_start:work_script_end+1]


# --- Construct New Files ---
# --- New main.html ---
# main_lines up to works_intro_end
# + work_content (the 28 card puzzle, <main> included)
# Wait, main.html already has a <main> that starts early and ends after puzzle!
# In main.html, lines:
# <main>
#   <section hero>
#   <section works-intro>
#   (main_content)
# </main>
# If we replace main_content with work_content (<main class="...">...</main>), we get nested <main>s!
# So we must strip <main...> and </main> from work_content before inserting into main.html!
work_content_stripped = [l for l in work_content if not l.strip().startswith('<main') and not l.strip() == '</main>']

new_main_lines = main_lines[:works_intro_end+1] + work_content_stripped + main_lines[main_close:main_script_start] + work_js + main_lines[main_script_end+1:]


# --- New work.html ---
# work_lines up to </style> -> replace with main_css
# + work_lines from </style> to </header>
# + main_content wrapped in <main>
# + work_lines from </main> to <script>
# + main_js
# + work_lines from </script> to end

new_work_lines = main_css + work_lines[work_style_end+1:work_header_end+1] + ['\n    <main>\n'] + main_content + ['    </main>\n'] + work_lines[work_main_close+1:work_script_start] + main_js + work_lines[work_script_end+1:]

write_lines(main_path, new_main_lines)
write_lines(work_path, new_work_lines)

print("Swap completed meticulously.")
