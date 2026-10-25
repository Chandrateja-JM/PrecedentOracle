"""Generate a realistic Indian SC judgment PDF for NLP pipeline testing."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

doc = SimpleDocTemplate(os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_judgment.pdf"), pagesize=A4,
                        rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)

styles = getSampleStyleSheet()
title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=12, spaceAfter=6)
heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], alignment=TA_CENTER, fontSize=11, spaceAfter=4)
body_style = ParagraphStyle('Body', parent=styles['Normal'], alignment=TA_JUSTIFY, fontSize=10, spaceAfter=8, leading=14)

story = []
story.append(Paragraph("<b>IN THE SUPREME COURT OF INDIA</b>", title_style))
story.append(Paragraph("CIVIL APPELLATE JURISDICTION", heading_style))
story.append(Paragraph("Writ Petition (Civil) No. 231 of 1977", heading_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>Maneka Gandhi</b> ... Petitioner", body_style))
story.append(Paragraph("versus", body_style))
story.append(Paragraph("<b>Union of India</b> ... Respondent", body_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>JUDGMENT</b>", heading_style))
story.append(Paragraph("Hon'ble Justice P.N. Bhagwati", heading_style))
story.append(Spacer(1, 12))

paragraphs = [
    "1. The petitioner is an Indian citizen whose passport has been impounded by the Government of India under Section 10(3)(c) of the Passport Act, 1967. The principal question for consideration in this writ petition filed under Article 32 of the Constitution of India is the constitutional validity of the impoundment order dated 4th July, 1977.",
    "2. The petitioner contends that the impoundment order violates her fundamental rights guaranteed under Articles 14, 19 and 21 of the Constitution. She relies on the decisions of this Court in A.K. Gopalan v. State of Madras (1950) SCR 88 and Satwant Singh Sawhney v. D. Ramarathnam AIR 1967 SC 1836. The petitioner argues that the right to travel abroad is part of the right to personal liberty under Article 21.",
    "3. The respondent submits that the impoundment was necessary in the interest of the general public. The procedure followed was in compliance with Section 10(3)(c) of the Passport Act, 1967.",
    "4. It is now well-settled that the procedure established by law under Article 21 must be just, fair and reasonable, not arbitrary, fanciful or oppressive. The principles laid down in Kharak Singh v. State of Uttar Pradesh AIR 1963 SC 1295 are also applicable to the present case. The Court in Kesavananda Bharati v. State of Kerala (1973) 4 SCC 225 established the basic structure doctrine which protects fundamental rights from arbitrary State action.",
    "5. Articles 14, 19 and 21 are not mutually exclusive — they are inter-related. A law prescribing a procedure for depriving a person of personal liberty must satisfy the requirements of Article 14 (non-arbitrariness) and Article 19 (reasonable restrictions), in addition to Article 21.",
    "6. In view of the above analysis, we hold that the right to travel abroad is included in the expression 'personal liberty' under Article 21. The procedure under Section 10(3)(c) of the Passport Act, 1967, must therefore be just, fair and reasonable.",
    "7. We accordingly quash the order dated 4th July, 1977, impounding the petitioner's passport and direct the respondent to return the passport to the petitioner forthwith. The writ petition is allowed. No order as to costs.",
    "Section 302 IPC and Section 41 CrPC, though mentioned by the parties in their arguments, are not applicable to the facts of the present case."
]

for p in paragraphs:
    story.append(Paragraph(p, body_style))

doc.build(story)
print(f"PDF created: test_judgment.pdf")

import os
print(f"Size: {os.path.getsize('test_judgment.pdf')} bytes")
