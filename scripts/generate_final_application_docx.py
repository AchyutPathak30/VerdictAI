"""
Generate VerdictAI_Final_Application_Documentation.docx from FINAL_APPLICATION_DOCUMENTATION.md
Styled professionally for academic submission to Prof. JayPrakash Lalchandani.
"""

import os
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, hex_color: str):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_docx():
    md_path = r"d:\WSSOA Project\FINAL_APPLICATION_DOCUMENTATION.md"
    docx_path1 = r"d:\WSSOA Project\VerdictAI_Final_Application_Documentation.docx"
    docx_path2 = r"d:\downloads\VerdictAI_Final_Application_Documentation.docx"

    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()

    doc = Document()

    # Page setup - Normal 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Palette
    NAVY = RGBColor(26, 54, 93)       # #1A365D - Primary headings
    SLATE = RGBColor(74, 85, 104)     # #4A5568 - Subtitles / secondary
    DARK = RGBColor(45, 55, 72)       # #2D3748 - Body text
    BLUE = RGBColor(49, 130, 206)     # #3182CE - Links / accents
    LIGHT_BG = "F7FAFC"
    HEADER_BG = "2B6CB0"

    # Default font styling
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = DARK

    lines = content.split('\n')
    i = 0
    in_code_block = False
    code_lines = []

    while i < len(lines):
        line = lines[i]

        # Code block handling
        if line.strip().startswith('```'):
            if in_code_block:
                # End of code block
                table = doc.add_table(rows=1, cols=1)
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = table.cell(0, 0)
                set_cell_background(cell, "F1F5F9")
                set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                run = p.add_run('\n'.join(code_lines))
                run.font.name = 'Consolas'
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(30, 41, 59)
                in_code_block = False
                code_lines = []
            else:
                in_code_block = True
                code_lines = []
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        stripped = line.strip()

        # Empty line
        if not stripped:
            i += 1
            continue

        # Title: # Title
        if line.startswith('# '):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(line[2:].strip())
            run.font.name = 'Arial'
            run.font.size = Pt(22)
            run.font.bold = True
            run.font.color.rgb = NAVY
            i += 1
            continue

        # Heading 2: ## Title
        if line.startswith('## '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(line[3:].strip())
            run.font.name = 'Arial'
            run.font.size = Pt(15)
            run.font.bold = True
            run.font.color.rgb = NAVY
            i += 1
            continue

        # Heading 3: ### Title
        if line.startswith('### '):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(line[4:].strip())
            run.font.name = 'Arial'
            run.font.size = Pt(12.5)
            run.font.bold = True
            run.font.color.rgb = SLATE
            i += 1
            continue

        # Markdown horizontal rule ---
        if stripped == '---':
            i += 1
            continue

        # Markdown tables
        if line.strip().startswith('|') and '|' in line[1:]:
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                table_lines.append(lines[i].strip())
                i += 1

            if len(table_lines) >= 2:
                # Parse headers
                headers = [h.strip() for h in table_lines[0].split('|')[1:-1]]
                num_cols = len(headers)

                # Skip separator line (table_lines[1])
                data_rows = []
                for row_line in table_lines[2:]:
                    cols = [c.strip() for c in row_line.split('|')[1:-1]]
                    if len(cols) == num_cols:
                        data_rows.append(cols)

                table = doc.add_table(rows=len(data_rows) + 1, cols=num_cols)
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                set_table_borders(table, color="CBD5E1")

                # Format header row
                hdr_cells = table.rows[0].cells
                for col_idx, h in enumerate(headers):
                    cell = hdr_cells[col_idx]
                    set_cell_background(cell, HEADER_BG)
                    set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    run = p.add_run(h)
                    run.font.bold = True
                    run.font.size = Pt(9.5)
                    run.font.color.rgb = RGBColor(255, 255, 255)

                # Format data rows
                for row_idx, row_data in enumerate(data_rows):
                    row_cells = table.rows[row_idx + 1].cells
                    bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
                    for col_idx, val in enumerate(row_data):
                        cell = row_cells[col_idx]
                        set_cell_background(cell, bg)
                        set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
                        p = cell.paragraphs[0]
                        p.paragraph_format.space_before = Pt(1)
                        p.paragraph_format.space_after = Pt(1)

                        # Clean links / markdown bold
                        val_clean = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', val)
                        val_clean = re.sub(r'\*\*([^*]+)\*\*', r'\1', val_clean)
                        val_clean = re.sub(r'`([^`]+)`', r'\1', val_clean)

                        run = p.add_run(val_clean)
                        run.font.size = Pt(9.5)
                        if col_idx == 0:
                            run.font.bold = True
                            run.font.color.rgb = NAVY

                p_after = doc.add_paragraph()
                p_after.paragraph_format.space_before = Pt(2)
                p_after.paragraph_format.space_after = Pt(4)
                continue

        # Bullet lists: * or -
        if line.strip().startswith('* ') or line.strip().startswith('- '):
            text = line.strip()[2:]
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.left_indent = Inches(0.25)

            # Parse bold parts
            parts = re.split(r'(\*\*[^*]+\*\*)', text)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    run = p.add_run(part[2:-2])
                    run.font.bold = True
                    run.font.color.rgb = NAVY
                else:
                    clean = re.sub(r'`([^`]+)`', r'\1', part)
                    clean = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', clean)
                    p.add_run(clean)
            i += 1
            continue

        # Normal paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15

        # Format bold tags
        parts = re.split(r'(\*\*[^*]+\*\*)', line)
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                run = p.add_run(part[2:-2])
                run.font.bold = True
                run.font.color.rgb = NAVY
            else:
                clean = re.sub(r'`([^`]+)`', r'\1', part)
                clean = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', clean)
                p.add_run(clean)

        i += 1

    doc.save(docx_path1)
    doc.save(docx_path2)
    print(f"Generated DOCX successfully at:")
    print(f" - {docx_path1}")
    print(f" - {docx_path2}")

if __name__ == '__main__':
    build_docx()

