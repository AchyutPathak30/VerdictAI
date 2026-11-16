"""
Convert DEPLOYMENT_AND_HOSTING.md into a professionally styled Word (.docx) document.
Author: Nirav Kachhiya (Project Lead)
"""

import os
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

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
    md_path = "DEPLOYMENT_AND_HOSTING.md"
    docx_path = "DEPLOYMENT_AND_HOSTING.docx"

    with open(md_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    doc = Document()

    # Set page margins (1 inch all around)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)

    # Styles
    navy = RGBColor(15, 23, 42)      # #0F172A
    blue = RGBColor(37, 99, 235)     # #2563EB
    dark_gray = RGBColor(51, 65, 85) # #334155
    text_color = RGBColor(30, 41, 59)

    i = 0
    in_code_block = False
    code_lines = []

    while i < len(lines):
        line = lines[i].rstrip("\r\n")

        # Code block toggle
        if line.startswith("```"):
            if in_code_block:
                # End of code block
                table = doc.add_table(rows=1, cols=1)
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = table.cell(0, 0)
                set_cell_background(cell, "F8FAFC")
                set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
                
                # Border
                tcPr = cell._tc.get_or_add_tcPr()
                borders = parse_xml(
                    f'<w:tcBorders {nsdecls("w")}>'
                    f'<w:top w:val="single" w:sz="6" w:color="CBD5E1"/>'
                    f'<w:left w:val="single" w:sz="18" w:color="2563EB"/>'
                    f'<w:bottom w:val="single" w:sz="6" w:color="CBD5E1"/>'
                    f'<w:right w:val="single" w:sz="6" w:color="CBD5E1"/>'
                    f'</w:tcBorders>'
                )
                tcPr.append(borders)

                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.15
                code_text = "\n".join(code_lines)
                run = p.add_run(code_text)
                run.font.name = "Consolas"
                run.font.size = Pt(8.5)
                run.font.color.rgb = RGBColor(30, 41, 59)

                # Add a blank spacing paragraph after
                doc.add_paragraph().paragraph_format.space_after = Pt(6)
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
                code_lines = []
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        # Table detection
        if line.startswith("|") and i + 1 < len(lines) and lines[i+1].startswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].startswith("|"):
                table_lines.append(lines[i].strip())
                i += 1

            if len(table_lines) >= 3 and "---" in table_lines[1]:
                headers = [c.strip() for c in table_lines[0].split("|")[1:-1]]
                row_data = []
                for r in table_lines[2:]:
                    cells = [c.strip() for c in r.split("|")[1:-1]]
                    row_data.append(cells)

                table = doc.add_table(rows=len(row_data) + 1, cols=len(headers))
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                set_table_borders(table, color="E2E8F0")

                # Format header row
                hdr_cells = table.rows[0].cells
                for col_idx, h_text in enumerate(headers):
                    cell = hdr_cells[col_idx]
                    set_cell_background(cell, "0F172A")
                    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_before = Pt(0)
                    p.paragraph_format.space_after = Pt(0)
                    clean_h = re.sub(r'[*_`]', '', h_text)
                    run = p.add_run(clean_h)
                    run.font.name = "Calibri"
                    run.font.size = Pt(9.5)
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(255, 255, 255)

                # Format data rows
                for r_idx, r_cells_data in enumerate(row_data):
                    row = table.rows[r_idx + 1]
                    bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
                    for col_idx, cell_value in enumerate(r_cells_data):
                        if col_idx < len(row.cells):
                            cell = row.cells[col_idx]
                            set_cell_background(cell, bg_color)
                            set_cell_margins(cell, top=100, bottom=100, left=180, right=180)
                            p = cell.paragraphs[0]
                            p.paragraph_format.space_before = Pt(0)
                            p.paragraph_format.space_after = Pt(0)

                            # Parse markdown formatting like bold, link, code
                            # Simple parser for cell text
                            clean_val = cell_value
                            # If markdown link [`https...`](url)
                            link_match = re.search(r'\[`?([^`\]]+)`?\]\(([^)]+)\)', clean_val)
                            if link_match:
                                text_part = clean_val[:link_match.start()]
                                link_text = link_match.group(1)
                                after_part = clean_val[link_match.end():]
                                if text_part:
                                    r1 = p.add_run(text_part)
                                    r1.font.name = "Calibri"
                                    r1.font.size = Pt(9)
                                r_link = p.add_run(link_text)
                                r_link.font.name = "Consolas" if "http" in link_text else "Calibri"
                                r_link.font.size = Pt(8.5) if "http" in link_text else Pt(9)
                                r_link.font.color.rgb = RGBColor(37, 99, 235)
                                r_link.font.underline = True
                                if after_part:
                                    r2 = p.add_run(after_part)
                                    r2.font.name = "Calibri"
                                    r2.font.size = Pt(9)
                            else:
                                # Bold chunks
                                parts = re.split(r'(\*\*[^*]+\*\*)', clean_val)
                                for pt in parts:
                                    if pt.startswith("**") and pt.endswith("**"):
                                        r = p.add_run(pt[2:-2])
                                        r.font.bold = True
                                    else:
                                        r = p.add_run(pt)
                                    r.font.name = "Calibri"
                                    r.font.size = Pt(9)
                                    r.font.color.rgb = text_color

                doc.add_paragraph().paragraph_format.space_after = Pt(6)
            continue

        # Header 1 (Title)
        if line.startswith("# "):
            title_text = line[2:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(title_text)
            run.font.name = "Calibri"
            run.font.size = Pt(22)
            run.font.bold = True
            run.font.color.rgb = navy
            i += 1
            continue

        # Header 2
        if line.startswith("## "):
            h2_text = line[3:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(h2_text)
            run.font.name = "Calibri"
            run.font.size = Pt(14)
            run.font.bold = True
            run.font.color.rgb = blue
            i += 1
            continue

        # Header 3
        if line.startswith("### "):
            h3_text = line[4:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(h3_text)
            run.font.name = "Calibri"
            run.font.size = Pt(11.5)
            run.font.bold = True
            run.font.color.rgb = dark_gray
            i += 1
            continue

        # Horizontal Rule
        if line.strip() == "---":
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(8)
            p_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="6" w:space="1" w:color="E2E8F0"/></w:pBdr>')
            p._p.get_or_add_pPr().append(p_border)
            i += 1
            continue

        # Blockquote (> text)
        if line.startswith("> "):
            bq_text = line[2:].strip()
            table = doc.add_table(rows=1, cols=1)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            cell = table.cell(0, 0)
            set_cell_background(cell, "F1F5F9")
            set_cell_margins(cell, top=80, bottom=80, left=140, right=140)
            tcPr = cell._tc.get_or_add_tcPr()
            borders = parse_xml(
                f'<w:tcBorders {nsdecls("w")}>'
                f'<w:left w:val="single" w:sz="24" w:color="2563EB"/>'
                f'<w:top w:val="none"/>'
                f'<w:bottom w:val="none"/>'
                f'<w:right w:val="none"/>'
                f'</w:tcBorders>'
            )
            tcPr.append(borders)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            clean_bq = re.sub(r'[*_`]', '', bq_text)
            run = p.add_run(clean_bq)
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            run.font.italic = True
            run.font.color.rgb = dark_gray
            doc.add_paragraph().paragraph_format.space_after = Pt(4)
            i += 1
            continue

        # List item (bullet or numbered)
        is_bullet = bool(re.match(r'^\s*[\*\-]\s+', line))
        is_num = bool(re.match(r'^\s*\d+\.\s+', line))

        if is_bullet or is_num:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            
            # Determine indentation
            indent_level = len(re.match(r'^(\s*)', line).group(1)) // 2
            p.paragraph_format.left_indent = Inches(0.25 * (indent_level + 1))

            bullet_char = "•  " if is_bullet else ""
            if is_num:
                m = re.match(r'^\s*(\d+\.)\s+(.*)', line)
                num_prefix = m.group(1) + "  "
                content = m.group(2)
                r_pre = p.add_run(num_prefix)
                r_pre.font.name = "Calibri"
                r_pre.font.size = Pt(10)
                r_pre.font.bold = True
                r_pre.font.color.rgb = navy
            else:
                m = re.match(r'^\s*[\*\-]\s+(.*)', line)
                content = m.group(1)
                r_pre = p.add_run("•  ")
                r_pre.font.name = "Calibri"
                r_pre.font.size = Pt(10)
                r_pre.font.color.rgb = blue

            # Parse content with bold / code
            parts = re.split(r'(\*\*[^*]+\*\*|`[^`]+`)', content)
            for pt in parts:
                if pt.startswith("**") and pt.endswith("**"):
                    r = p.add_run(pt[2:-2])
                    r.font.bold = True
                elif pt.startswith("`") and pt.endswith("`"):
                    r = p.add_run(pt[1:-1])
                    r.font.name = "Consolas"
                    r.font.size = Pt(9)
                    r.font.color.rgb = RGBColor(30, 41, 59)
                else:
                    r = p.add_run(pt)
                r.font.name = "Calibri"
                r.font.size = Pt(10)
                r.font.color.rgb = text_color
            i += 1
            continue

        # Regular paragraph
        if line.strip():
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.15

            parts = re.split(r'(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))', line)
            for pt in parts:
                if pt.startswith("**") and pt.endswith("**"):
                    r = p.add_run(pt[2:-2])
                    r.font.bold = True
                elif pt.startswith("`") and pt.endswith("`"):
                    r = p.add_run(pt[1:-1])
                    r.font.name = "Consolas"
                    r.font.size = Pt(9)
                elif pt.startswith("[") and "](" in pt:
                    m = re.match(r'\[([^\]]+)\]\(([^)]+)\)', pt)
                    if m:
                        r = p.add_run(m.group(1))
                        r.font.color.rgb = blue
                        r.font.underline = True
                    else:
                        r = p.add_run(pt)
                else:
                    r = p.add_run(pt)
                r.font.name = "Calibri"
                r.font.size = Pt(10)
                r.font.color.rgb = text_color

        i += 1

    doc.save(docx_path)
    print(f"Successfully generated {docx_path} ({os.path.getsize(docx_path)} bytes)")

if __name__ == "__main__":
    build_docx()

