"""Generate 3 demo Indian Supreme Court judgment PDFs for PrecedentOracle's Upload tab library."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

OUT_DIR = os.path.expanduser("~/PrecedentOracle/public/samples")
os.makedirs(OUT_DIR, exist_ok=True)

styles = getSampleStyleSheet()
title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=12, spaceAfter=6)
heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], alignment=TA_CENTER, fontSize=11, spaceAfter=4)
body_style = ParagraphStyle('Body', parent=styles['Normal'], alignment=TA_JUSTIFY, fontSize=10, spaceAfter=8, leading=14)


def write_pdf(filename: str, title_lines: list[str], judge: str, paragraphs: list[str]):
    out_path = os.path.join(OUT_DIR, filename)
    doc = SimpleDocTemplate(out_path, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    story = []
    for t in title_lines:
        story.append(Paragraph(t, title_style if t == title_lines[0] else heading_style))
    story.append(Spacer(1, 12))
    story.append(Paragraph("<b>JUDGMENT</b>", heading_style))
    story.append(Paragraph(judge, heading_style))
    story.append(Spacer(1, 14))
    for p in paragraphs:
        story.append(Paragraph(p, body_style))
    doc.build(story)
    print(f"  wrote {filename} ({os.path.getsize(out_path)} bytes)")


# ============ 1. Maneka Gandhi ============
write_pdf(
    "maneka_gandhi.pdf",
    [
        "<b>IN THE SUPREME COURT OF INDIA</b>",
        "CIVIL APPELLATE JURISDICTION",
        "Writ Petition (Civil) No. 231 of 1977",
        "<b>Maneka Gandhi</b> ... Petitioner",
        "versus",
        "<b>Union of India</b> ... Respondent",
    ],
    "Hon'ble Justice P.N. Bhagwati",
    [
        "1. The petitioner is an Indian citizen whose passport has been impounded by the Government of India under Section 10(3)(c) of the Passport Act, 1967. The principal question for consideration in this writ petition under Article 32 of the Constitution of India is the constitutional validity of the impoundment order dated 4th July, 1977.",
        "2. The petitioner contends that the impoundment order violates her fundamental rights guaranteed under Articles 14, 19 and 21 of the Constitution. She relies on A.K. Gopalan v. State of Madras (1950) SCR 88 and Satwant Singh Sawhney v. D. Ramarathnam AIR 1967 SC 1836.",
        "3. It is now well-settled that the procedure established by law under Article 21 must be just, fair and reasonable. The principles in Kharak Singh v. State of Uttar Pradesh AIR 1963 SC 1295 also apply. The decision in Kesavananda Bharati v. State of Kerala (1973) 4 SCC 225 establishes the basic structure doctrine.",
        "4. Articles 14, 19 and 21 are not mutually exclusive — they are inter-related. A law prescribing a procedure for depriving a person of personal liberty must satisfy the requirements of Article 14 (non-arbitrariness) and Article 19 (reasonable restrictions).",
        "5. We hold that the right to travel abroad is included in 'personal liberty' under Article 21. The procedure under Section 10(3)(c) of the Passport Act, 1967 must therefore be just, fair and reasonable.",
        "6. We accordingly quash the order dated 4th July, 1977 impounding the petitioner's passport. The writ petition is allowed. Section 302 IPC and Section 41 CrPC are not relevant here.",
    ],
)

# ============ 2. Kesavananda Bharati ============
write_pdf(
    "kesavananda.pdf",
    [
        "<b>IN THE SUPREME COURT OF INDIA</b>",
        "CIVIL ORIGINAL JURISDICTION",
        "Writ Petition (Civil) No. 135 of 1970",
        "<b>His Holiness Kesavananda Bharati Sripadagalvaru</b> ... Petitioner",
        "versus",
        "<b>State of Kerala and Others</b> ... Respondents",
    ],
    "13-Judge Constitution Bench · S.M. Sikri, C.J. presiding",
    [
        "1. The petitioner, head of the Edneer Mutt in Kerala, challenges the Kerala Land Reforms Act, 1963 (as amended in 1969 and 1971) on the ground that it violates Articles 14, 19(1)(f), 25, 26 and 31 of the Constitution.",
        "2. The constitutional question of the widest amplitude is whether the power of Parliament to amend the Constitution under Article 368 is plenary, or whether it is limited by certain implied limitations.",
        "3. The Court considered I.C. Golak Nath v. State of Punjab AIR 1967 SC 1643 which held that fundamental rights are unamendable, and the subsequent 24th Constitutional Amendment which sought to overrule Golak Nath.",
        "4. After extensive review of Sankari Prasad v. Union of India AIR 1951 SC 458 and Sajjan Singh v. State of Rajasthan AIR 1965 SC 845, this Court (by majority of 7:6) holds: Parliament may amend any provision of the Constitution under Article 368, BUT cannot alter or destroy the basic structure of the Constitution.",
        "5. The basic structure includes (illustratively, not exhaustively): supremacy of the Constitution, republican and democratic form of government, secular character, separation of powers, federal character, sovereignty and territorial integrity, unity of the Nation, and judicial review.",
        "6. The 25th and 29th Constitutional Amendments are upheld in part. Section 25 of the Kerala Land Reforms Act survives constitutional scrutiny. Sub-article (4) of Article 31C is held unconstitutional as it ousts judicial review — which is part of the basic structure.",
        "7. The basic structure doctrine is the most enduring contribution of Indian constitutional jurisprudence and shall guide all future constitutional amendments.",
    ],
)

# ============ 3. Vishaka ============
write_pdf(
    "vishaka.pdf",
    [
        "<b>IN THE SUPREME COURT OF INDIA</b>",
        "CIVIL ORIGINAL JURISDICTION",
        "Writ Petition (Criminal) Nos. 666-70 of 1992",
        "<b>Vishaka and Others</b> ... Petitioners",
        "versus",
        "<b>State of Rajasthan and Others</b> ... Respondents",
    ],
    "Hon'ble Chief Justice J.S. Verma · Hon'ble Justice Sujata V. Manohar · Hon'ble Justice B.N. Kirpal",
    [
        "1. This writ petition under Article 32 of the Constitution of India has been filed as a class action by certain social activists and NGOs with the aim of focusing attention towards the societal aberration of sexual harassment of women at the workplace.",
        "2. The immediate cause for filing this petition is the alleged brutal gang rape of a social worker in a village of Rajasthan. The incident reveals the hazards to which a working woman may be exposed and the depravity to which sexual harassment can degenerate.",
        "3. The fundamental rights under Articles 14, 15, 19(1)(g) and 21 of the Constitution, read with the principles laid down in the Convention on the Elimination of All Forms of Discrimination against Women (CEDAW) adopted by the United Nations on 18 December 1979, mandate that the right to gender equality is a fundamental human right.",
        "4. In the absence of legislative measures, the Court relies on its powers under Article 32 read with Article 141 to lay down binding guidelines. The decision in Nilabati Behera v. State of Orissa (1993) 2 SCC 746 supports this approach.",
        "5. The Court is also guided by Bandhua Mukti Morcha v. Union of India (1984) 3 SCC 161, which establishes that international conventions and norms can be relied upon to construe domestic law where there is no inconsistency.",
        "6. We accordingly lay down the following guidelines (the 'Vishaka Guidelines') to be observed by all employers, public or private, until appropriate legislation is enacted: (a) duty to prevent sexual harassment; (b) definition of sexual harassment; (c) preventive steps; (d) criminal proceedings; (e) disciplinary action; (f) complaints committee; (g) workers' initiative; (h) awareness.",
        "7. These guidelines shall be binding and shall be treated as the law declared by this Court under Article 141 of the Constitution.",
        "8. Sexual harassment includes such unwelcome sexually determined behaviour as physical contact and advances, demand or request for sexual favours, sexually-coloured remarks, showing pornography, or any other unwelcome physical, verbal or non-verbal conduct of sexual nature.",
    ],
)

print(f"\nAll 3 PDFs generated in {OUT_DIR}")
