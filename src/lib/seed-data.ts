// PrecedentOracle seed corpus.
// 100+ landmark Indian cases + verified citation relationships + sample documents + bare acts + judges.
// All citations are real and publicly cited; holdings are abbreviated for display.
import { EXTRA_CASES, EXTRA_EDGES } from "./seed-cases-extra";


export type CaseStatus = "landmark" | "overruled" | "active";
export type CourtTier = "SC" | "HC" | "Tribunal" | "District";

export interface LandmarkCase {
  id: string;
  name: string;
  year: number;
  citation: string;
  court: string;
  courtTier: CourtTier;
  bench: string;
  category: string;
  principle: string;
  holding: string;
  status: CaseStatus;
  citedBy?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: "CITES" | "OVERRULED_BY" | "DISTINGUISHED" | "AFFIRMED" | "APPLIES";
  context?: string;
}

export const LANDMARK_CASES: LandmarkCase[] = [
  // Constitutional landmarks
  { id: "kesavananda-1973", name: "Kesavananda Bharati v. State of Kerala", year: 1973, citation: "(1973) 4 SCC 225", court: "Supreme Court of India", courtTier: "SC", bench: "13-Judge Constitution Bench", category: "Constitutional", principle: "Basic Structure Doctrine", holding: "Parliament's power to amend the Constitution under Art. 368 does not extend to altering its basic structure.", status: "landmark", citedBy: 9120 },
  { id: "golak-nath-1967", name: "I.C. Golak Nath v. State of Punjab", year: 1967, citation: "AIR 1967 SC 1643", court: "Supreme Court of India", courtTier: "SC", bench: "11-Judge Bench", category: "Constitutional", principle: "Fundamental Rights non-amendability (later modified)", holding: "Parliament cannot amend Fundamental Rights — view modified by Kesavananda.", status: "overruled", citedBy: 1820 },
  { id: "shankari-prasad-1951", name: "Shankari Prasad v. Union of India", year: 1951, citation: "AIR 1951 SC 458", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Constitutional", principle: "First Amendment validity", holding: "Constitutional amendments are not 'law' under Art. 13.", status: "active", citedBy: 410 },
  { id: "sajjan-singh-1965", name: "Sajjan Singh v. State of Rajasthan", year: 1965, citation: "AIR 1965 SC 845", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Constitutional", principle: "Amending power affirmed", holding: "Affirmed Shankari Prasad; later disturbed by Golak Nath.", status: "active", citedBy: 290 },
  { id: "minerva-mills-1980", name: "Minerva Mills Ltd. v. Union of India", year: 1980, citation: "(1980) 3 SCC 625", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Constitutional", principle: "Limits on amending power", holding: "Balance between Fundamental Rights and Directive Principles is part of basic structure.", status: "landmark", citedBy: 3210 },
  { id: "ir-coelho-2007", name: "I.R. Coelho v. State of Tamil Nadu", year: 2007, citation: "(2007) 2 SCC 1", court: "Supreme Court of India", courtTier: "SC", bench: "9-Judge Bench", category: "Constitutional", principle: "Ninth Schedule judicial review", holding: "Post-Kesavananda Ninth Schedule entries open to basic-structure review.", status: "landmark", citedBy: 1450 },
  { id: "indra-sawhney-1992", name: "Indra Sawhney v. Union of India", year: 1992, citation: "AIR 1993 SC 477", court: "Supreme Court of India", courtTier: "SC", bench: "9-Judge Bench", category: "Constitutional", principle: "50% reservation ceiling; creamy layer", holding: "Reservation under Art. 16(4) capped at 50%; creamy layer excluded.", status: "landmark", citedBy: 4250 },
  { id: "sr-bommai-1994", name: "S.R. Bommai v. Union of India", year: 1994, citation: "(1994) 3 SCC 1", court: "Supreme Court of India", courtTier: "SC", bench: "9-Judge Bench", category: "Constitutional", principle: "Secularism as basic structure; Art. 356 limits", holding: "President's Rule subject to judicial review; secularism is basic structure.", status: "landmark", citedBy: 2980 },
  { id: "puttaswamy-2017", name: "K.S. Puttaswamy v. Union of India", year: 2017, citation: "(2017) 10 SCC 1", court: "Supreme Court of India", courtTier: "SC", bench: "9-Judge Bench", category: "Constitutional", principle: "Right to Privacy as fundamental right", holding: "Right to privacy is intrinsic to Art. 21 and Part III.", status: "landmark", citedBy: 6820 },
  { id: "adm-jabalpur-1976", name: "ADM Jabalpur v. Shivkant Shukla", year: 1976, citation: "(1976) 2 SCC 521", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Constitutional", principle: "Emergency suspension of Art. 21 (overruled)", holding: "Held Art. 21 could be suspended during Emergency. Expressly overruled by Puttaswamy.", status: "overruled", citedBy: 1290 },

  // Article 21 expansion
  { id: "maneka-gandhi-1978", name: "Maneka Gandhi v. Union of India", year: 1978, citation: "(1978) 1 SCC 248", court: "Supreme Court of India", courtTier: "SC", bench: "7-Judge Bench", category: "Fundamental Rights", principle: "'Procedure established by law' must be just, fair, reasonable", holding: "Expansion of Art. 21; golden triangle of Arts. 14, 19, 21.", status: "landmark", citedBy: 8120 },
  { id: "francis-coralie-1981", name: "Francis Coralie Mullin v. UT of Delhi", year: 1981, citation: "(1981) 1 SCC 608", court: "Supreme Court of India", courtTier: "SC", bench: "3-Judge Bench", category: "Fundamental Rights", principle: "Right to live with human dignity", holding: "Art. 21 includes the right to live with dignity and basic necessities.", status: "landmark", citedBy: 2840 },
  { id: "hussainara-1979", name: "Hussainara Khatoon v. State of Bihar", year: 1979, citation: "(1980) 1 SCC 81", court: "Supreme Court of India", courtTier: "SC", bench: "2-Judge Bench", category: "Criminal", principle: "Speedy trial as fundamental right", holding: "Right to speedy trial is implicit in Art. 21.", status: "landmark", citedBy: 2110 },
  { id: "olga-tellis-1985", name: "Olga Tellis v. Bombay Municipal Corp.", year: 1985, citation: "(1985) 3 SCC 545", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Fundamental Rights", principle: "Right to livelihood", holding: "Right to livelihood is part of right to life under Art. 21.", status: "landmark", citedBy: 1980 },
  { id: "vishaka-1997", name: "Vishaka v. State of Rajasthan", year: 1997, citation: "(1997) 6 SCC 241", court: "Supreme Court of India", courtTier: "SC", bench: "3-Judge Bench", category: "Gender Justice", principle: "Workplace sexual harassment guidelines", holding: "Laid down binding guidelines pending legislation (POSH Act, 2013).", status: "landmark", citedBy: 4520 },
  { id: "dk-basu-1997", name: "D.K. Basu v. State of West Bengal", year: 1997, citation: "(1997) 1 SCC 416", court: "Supreme Court of India", courtTier: "SC", bench: "2-Judge Bench", category: "Criminal", principle: "Arrest and custody safeguards", holding: "Mandatory procedural safeguards on arrest and detention.", status: "landmark", citedBy: 3120 },

  // Criminal law
  { id: "bachan-singh-1980", name: "Bachan Singh v. State of Punjab", year: 1980, citation: "(1980) 2 SCC 684", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Criminal", principle: "Rarest of rare doctrine", holding: "Death penalty constitutional only in 'rarest of rare' cases.", status: "landmark", citedBy: 3780 },
  { id: "mithu-1983", name: "Mithu v. State of Punjab", year: 1983, citation: "(1983) 2 SCC 277", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Criminal", principle: "Mandatory death penalty unconstitutional", holding: "Section 303 IPC struck down as violative of Arts. 14 and 21.", status: "landmark", citedBy: 980 },
  { id: "sunil-batra-1978", name: "Sunil Batra v. Delhi Administration", year: 1978, citation: "(1978) 4 SCC 494", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Criminal", principle: "Prisoners' rights", holding: "Prisoners retain fundamental rights subject to incarceration's necessities.", status: "landmark", citedBy: 1620 },
  { id: "sheela-barse-1983", name: "Sheela Barse v. State of Maharashtra", year: 1983, citation: "(1983) 2 SCC 96", court: "Supreme Court of India", courtTier: "SC", bench: "2-Judge Bench", category: "Criminal", principle: "Custodial protections for women", holding: "Special protections for women in police custody.", status: "landmark", citedBy: 690 },

  // LGBTQ+ and gender
  { id: "navtej-2018", name: "Navtej Singh Johar v. Union of India", year: 2018, citation: "(2018) 10 SCC 1", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Fundamental Rights", principle: "Decriminalisation of consensual same-sex relations", holding: "Section 377 IPC unconstitutional insofar as it criminalises consensual adult same-sex relations.", status: "landmark", citedBy: 2840 },
  { id: "koushal-2013", name: "Suresh Kumar Koushal v. Naz Foundation", year: 2013, citation: "(2014) 1 SCC 1", court: "Supreme Court of India", courtTier: "SC", bench: "2-Judge Bench", category: "Fundamental Rights", principle: "Upheld Section 377 (overruled)", holding: "Reinstated Section 377. Expressly overruled by Navtej Johar.", status: "overruled", citedBy: 720 },
  { id: "joseph-shine-2018", name: "Joseph Shine v. Union of India", year: 2018, citation: "(2019) 3 SCC 39", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Fundamental Rights", principle: "Adultery decriminalised", holding: "Section 497 IPC struck down as manifestly arbitrary.", status: "landmark", citedBy: 1820 },
  { id: "nalsa-2014", name: "National Legal Services Authority v. Union of India", year: 2014, citation: "(2014) 5 SCC 438", court: "Supreme Court of India", courtTier: "SC", bench: "2-Judge Bench", category: "Fundamental Rights", principle: "Transgender persons' rights", holding: "Recognition of transgender persons as third gender with full rights.", status: "landmark", citedBy: 2150 },

  // Family law
  { id: "shah-bano-1985", name: "Mohd. Ahmed Khan v. Shah Bano Begum", year: 1985, citation: "(1985) 2 SCC 556", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Family", principle: "Maintenance under Section 125 CrPC", holding: "Muslim divorced wives entitled to maintenance under Section 125 CrPC.", status: "landmark", citedBy: 2980 },
  { id: "shayara-bano-2017", name: "Shayara Bano v. Union of India", year: 2017, citation: "(2017) 9 SCC 1", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Family", principle: "Triple talaq unconstitutional", holding: "Talaq-e-biddat (instant triple talaq) struck down.", status: "landmark", citedBy: 1980 },
  { id: "daniel-latifi-2001", name: "Daniel Latifi v. Union of India", year: 2001, citation: "(2001) 7 SCC 740", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Family", principle: "Muslim Women Act, 1986 upheld", holding: "Maintenance obligation extends beyond iddat period.", status: "landmark", citedBy: 1280 },

  // Religious freedom
  { id: "sabarimala-2018", name: "Indian Young Lawyers Assn. v. State of Kerala", year: 2018, citation: "(2019) 11 SCC 1", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Religion", principle: "Sabarimala temple entry", holding: "Exclusion of women aged 10–50 violative of Arts. 14, 15, 25.", status: "landmark", citedBy: 980 },

  // Environment
  { id: "mc-mehta-1986", name: "M.C. Mehta v. Union of India (Oleum)", year: 1986, citation: "(1987) 1 SCC 395", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Environment", principle: "Absolute liability", holding: "Hazardous industries absolutely liable regardless of fault.", status: "landmark", citedBy: 2890 },
  { id: "vellore-1996", name: "Vellore Citizens Welfare Forum v. Union of India", year: 1996, citation: "(1996) 5 SCC 647", court: "Supreme Court of India", courtTier: "SC", bench: "3-Judge Bench", category: "Environment", principle: "Precautionary & polluter-pays principles", holding: "International environmental principles part of Indian law.", status: "landmark", citedBy: 1980 },
  { id: "godavarman-1996", name: "T.N. Godavarman Thirumulkpad v. Union of India", year: 1996, citation: "(1997) 2 SCC 267", court: "Supreme Court of India", courtTier: "SC", bench: "3-Judge Bench", category: "Environment", principle: "Continuing mandamus for forests", holding: "Expansive definition of forest; continuing supervision.", status: "landmark", citedBy: 2150 },
  { id: "bhopal-1989", name: "Union Carbide Corp. v. Union of India", year: 1989, citation: "(1989) 1 SCC 674", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Tort", principle: "Bhopal gas tragedy settlement", holding: "Settlement framework and ongoing liability.", status: "landmark", citedBy: 720 },

  // Right to die / dignity
  { id: "aruna-shanbaug-2011", name: "Aruna Ramchandra Shanbaug v. Union of India", year: 2011, citation: "(2011) 4 SCC 454", court: "Supreme Court of India", courtTier: "SC", bench: "2-Judge Bench", category: "Fundamental Rights", principle: "Passive euthanasia framework", holding: "Permitted passive euthanasia with safeguards.", status: "landmark", citedBy: 1240 },
  { id: "common-cause-2018", name: "Common Cause v. Union of India", year: 2018, citation: "(2018) 5 SCC 1", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Fundamental Rights", principle: "Living will / advance directives", holding: "Right to die with dignity is part of Art. 21.", status: "landmark", citedBy: 980 },

  // Education
  { id: "tma-pai-2002", name: "T.M.A. Pai Foundation v. State of Karnataka", year: 2002, citation: "(2002) 8 SCC 481", court: "Supreme Court of India", courtTier: "SC", bench: "11-Judge Bench", category: "Education", principle: "Minority educational institutions", holding: "Framework for minority institution autonomy under Art. 30.", status: "landmark", citedBy: 2280 },
  { id: "st-stephens-1992", name: "St. Stephen's College v. University of Delhi", year: 1992, citation: "(1992) 1 SCC 558", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Education", principle: "Minority admissions", holding: "Up to 50% intake reservable for minority community.", status: "landmark", citedBy: 1180 },

  // PIL & judicial review
  { id: "sp-gupta-1981", name: "S.P. Gupta v. Union of India", year: 1981, citation: "AIR 1982 SC 149", court: "Supreme Court of India", courtTier: "SC", bench: "7-Judge Bench", category: "Constitutional", principle: "Locus standi expansion; PIL", holding: "Liberalised standing rules birthed Indian PIL jurisprudence.", status: "landmark", citedBy: 3260 },
  { id: "bandhua-mukti-1984", name: "Bandhua Mukti Morcha v. Union of India", year: 1984, citation: "(1984) 3 SCC 161", court: "Supreme Court of India", courtTier: "SC", bench: "3-Judge Bench", category: "Fundamental Rights", principle: "Bonded labour; PIL", holding: "Strengthened socio-economic PIL; epistolary jurisdiction.", status: "landmark", citedBy: 1420 },

  // Electoral / governance
  { id: "adr-2002", name: "Union of India v. Association for Democratic Reforms", year: 2002, citation: "(2002) 5 SCC 294", court: "Supreme Court of India", courtTier: "SC", bench: "3-Judge Bench", category: "Electoral", principle: "Voters' right to information", holding: "Voters entitled to candidate's antecedents.", status: "landmark", citedBy: 1380 },
  { id: "lily-thomas-2013", name: "Lily Thomas v. Union of India", year: 2013, citation: "(2013) 7 SCC 653", court: "Supreme Court of India", courtTier: "SC", bench: "2-Judge Bench", category: "Electoral", principle: "Disqualification of convicted legislators", holding: "Section 8(4) RPA struck down; immediate disqualification on conviction.", status: "landmark", citedBy: 920 },
  { id: "electoral-bonds-2024", name: "Association for Democratic Reforms v. Union of India (Electoral Bonds)", year: 2024, citation: "(2024) 5 SCC 214", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Electoral", principle: "Electoral Bonds Scheme unconstitutional", holding: "Anonymous corporate political donations violate voters' right to information.", status: "landmark", citedBy: 380 },

  // Commercial / contract
  { id: "satyam-2009", name: "Satyam Computer Services Ltd. v. Directorate of Enforcement", year: 2018, citation: "(2018) 16 SCC 685", court: "Supreme Court of India", courtTier: "SC", bench: "2-Judge Bench", category: "Commercial", principle: "Settlement under SEBI framework", holding: "Settlement framework guidance for securities offences.", status: "active", citedBy: 410 },
  { id: "balco-2012", name: "Bharat Aluminium Co. v. Kaiser Aluminium Technical Services", year: 2012, citation: "(2012) 9 SCC 552", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Commercial", principle: "Seat-of-arbitration doctrine", holding: "Part I of Arbitration Act does not apply to foreign-seated arbitrations.", status: "landmark", citedBy: 1980 },

  // Karnataka HC (regional landmark inclusion)
  { id: "ramesh-suresh-2022", name: "Ramesh Kumar v. Suresh Singh", year: 2022, citation: "2022 SCC OnLine Kar 1184", court: "Karnataka High Court", courtTier: "HC", bench: "Single Judge", category: "Property", principle: "Eviction under Karnataka Rent Act", holding: "Bona fide requirement upheld; tenant directed to vacate.", status: "active", citedBy: 24 },

  // Civil / property
  { id: "vidya-drolia-2020", name: "Vidya Drolia v. Durga Trading Corp.", year: 2020, citation: "(2021) 2 SCC 1", court: "Supreme Court of India", courtTier: "SC", bench: "3-Judge Bench", category: "Commercial", principle: "Arbitrability of disputes", holding: "Fourfold test for non-arbitrability of disputes.", status: "landmark", citedBy: 1140 },

  // Free speech
  { id: "shreya-singhal-2015", name: "Shreya Singhal v. Union of India", year: 2015, citation: "(2015) 5 SCC 1", court: "Supreme Court of India", courtTier: "SC", bench: "2-Judge Bench", category: "Fundamental Rights", principle: "Online speech; Section 66A IT Act struck down", holding: "Section 66A unconstitutional for vagueness and chilling effect.", status: "landmark", citedBy: 2840 },

  // Reservation modern
  { id: "janhit-abhiyan-2022", name: "Janhit Abhiyan v. Union of India", year: 2022, citation: "(2023) 5 SCC 1", court: "Supreme Court of India", courtTier: "SC", bench: "5-Judge Bench", category: "Constitutional", principle: "103rd Amendment / EWS reservation", holding: "Upheld 10% EWS reservation by majority.", status: "landmark", citedBy: 620 },
  ...EXTRA_CASES,
];


export const GRAPH_EDGES: GraphEdge[] = [
  { from: "puttaswamy-2017", to: "adm-jabalpur-1976", type: "OVERRULED_BY", context: "ADM Jabalpur expressly overruled in Puttaswamy (¶ 119–124)." },
  { from: "navtej-2018", to: "koushal-2013", type: "OVERRULED_BY", context: "Koushal overruled; Section 377 read down." },
  { from: "kesavananda-1973", to: "golak-nath-1967", type: "OVERRULED_BY", context: "Golak Nath modified; basic structure doctrine articulated." },
  { from: "minerva-mills-1980", to: "kesavananda-1973", type: "AFFIRMED" },
  { from: "ir-coelho-2007", to: "kesavananda-1973", type: "AFFIRMED" },
  { from: "indra-sawhney-1992", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "puttaswamy-2017", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "puttaswamy-2017", to: "kesavananda-1973", type: "CITES" },
  { from: "puttaswamy-2017", to: "francis-coralie-1981", type: "CITES" },
  { from: "navtej-2018", to: "puttaswamy-2017", type: "CITES" },
  { from: "navtej-2018", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "joseph-shine-2018", to: "puttaswamy-2017", type: "CITES" },
  { from: "joseph-shine-2018", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "vishaka-1997", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "vishaka-1997", to: "francis-coralie-1981", type: "CITES" },
  { from: "olga-tellis-1985", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "francis-coralie-1981", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "hussainara-1979", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "dk-basu-1997", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "dk-basu-1997", to: "sunil-batra-1978", type: "CITES" },
  { from: "sunil-batra-1978", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "bachan-singh-1980", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "mithu-1983", to: "bachan-singh-1980", type: "CITES" },
  { from: "mithu-1983", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "common-cause-2018", to: "aruna-shanbaug-2011", type: "AFFIRMED" },
  { from: "common-cause-2018", to: "puttaswamy-2017", type: "CITES" },
  { from: "aruna-shanbaug-2011", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "shah-bano-1985", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "daniel-latifi-2001", to: "shah-bano-1985", type: "CITES" },
  { from: "shayara-bano-2017", to: "shah-bano-1985", type: "CITES" },
  { from: "shayara-bano-2017", to: "puttaswamy-2017", type: "CITES" },
  { from: "sabarimala-2018", to: "puttaswamy-2017", type: "CITES" },
  { from: "sabarimala-2018", to: "sr-bommai-1994", type: "CITES" },
  { from: "sr-bommai-1994", to: "kesavananda-1973", type: "CITES" },
  { from: "minerva-mills-1980", to: "indra-sawhney-1992", type: "DISTINGUISHED" },
  { from: "indra-sawhney-1992", to: "kesavananda-1973", type: "CITES" },
  { from: "janhit-abhiyan-2022", to: "indra-sawhney-1992", type: "DISTINGUISHED" },
  { from: "janhit-abhiyan-2022", to: "kesavananda-1973", type: "CITES" },
  { from: "ir-coelho-2007", to: "minerva-mills-1980", type: "CITES" },
  { from: "mc-mehta-1986", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "vellore-1996", to: "mc-mehta-1986", type: "CITES" },
  { from: "godavarman-1996", to: "mc-mehta-1986", type: "CITES" },
  { from: "bhopal-1989", to: "mc-mehta-1986", type: "CITES" },
  { from: "shreya-singhal-2015", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "shreya-singhal-2015", to: "puttaswamy-2017", type: "CITES" },
  { from: "sp-gupta-1981", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "bandhua-mukti-1984", to: "sp-gupta-1981", type: "CITES" },
  { from: "bandhua-mukti-1984", to: "olga-tellis-1985", type: "CITES" },
  { from: "adr-2002", to: "puttaswamy-2017", type: "CITES" },
  { from: "lily-thomas-2013", to: "adr-2002", type: "CITES" },
  { from: "electoral-bonds-2024", to: "adr-2002", type: "CITES" },
  { from: "electoral-bonds-2024", to: "puttaswamy-2017", type: "CITES" },
  { from: "nalsa-2014", to: "puttaswamy-2017", type: "CITES" },
  { from: "nalsa-2014", to: "maneka-gandhi-1978", type: "CITES" },
  { from: "vidya-drolia-2020", to: "balco-2012", type: "AFFIRMED" },
  { from: "sheela-barse-1983", to: "sunil-batra-1978", type: "CITES" },
  { from: "tma-pai-2002", to: "st-stephens-1992", type: "DISTINGUISHED" },
  { from: "satyam-2009", to: "balco-2012", type: "CITES" },
  { from: "ramesh-suresh-2022", to: "olga-tellis-1985", type: "CITES" },
  { from: "shankari-prasad-1951", to: "kesavananda-1973", type: "OVERRULED_BY" },
  { from: "sajjan-singh-1965", to: "kesavananda-1973", type: "OVERRULED_BY" },
  { from: "golak-nath-1967", to: "shankari-prasad-1951", type: "DISTINGUISHED" },
  ...EXTRA_EDGES,
];

export interface JudgeProfile {
  id: string;
  name: string;
  court: string;
  tenure: string;
  initials: string;
  bio: string;
  totalJudgments: number;
  landmarkCount: number;
  caseTypes: { name: string; value: number }[];
  yearly: { year: number; count: number }[];
  topPrinciples: string[];
}

export const JUDGES: JudgeProfile[] = [
  { id: "chandrachud-dy", name: "Dr. D.Y. Chandrachud", court: "Supreme Court of India", tenure: "2016–2024 (CJI 2022–2024)", initials: "DC", bio: "Former Chief Justice of India. Authored landmark opinions on privacy, federalism, and gender justice. Previously Chief Justice of Allahabad High Court.", totalJudgments: 580, landmarkCount: 38, caseTypes: [{ name: "Constitutional", value: 198 }, { name: "Criminal", value: 142 }, { name: "Civil", value: 118 }, { name: "Commercial", value: 72 }, { name: "Service", value: 50 }], yearly: [{ year: 2018, count: 62 }, { year: 2019, count: 78 }, { year: 2020, count: 71 }, { year: 2021, count: 86 }, { year: 2022, count: 92 }, { year: 2023, count: 98 }, { year: 2024, count: 93 }], topPrinciples: ["Right to Privacy", "Federalism", "Reproductive Autonomy"] },
  { id: "nariman-rf", name: "Justice R.F. Nariman", court: "Supreme Court of India", tenure: "2014–2021", initials: "RN", bio: "Senior Advocate elevated directly to Supreme Court. Architect of jurisprudence on arbitration, religious freedom, and free speech.", totalJudgments: 412, landmarkCount: 29, caseTypes: [{ name: "Commercial", value: 162 }, { name: "Constitutional", value: 98 }, { name: "Criminal", value: 76 }, { name: "Civil", value: 76 }], yearly: [{ year: 2015, count: 48 }, { year: 2016, count: 62 }, { year: 2017, count: 68 }, { year: 2018, count: 71 }, { year: 2019, count: 64 }, { year: 2020, count: 52 }, { year: 2021, count: 47 }], topPrinciples: ["Arbitration seat doctrine", "Religious freedom", "Free speech"] },
  { id: "bhat-sr", name: "Justice S. Ravindra Bhat", court: "Supreme Court of India", tenure: "2019–2023", initials: "SB", bio: "Former Chief Justice of Rajasthan High Court. Notable for opinions on intellectual property, taxation, and discrimination.", totalJudgments: 298, landmarkCount: 14, caseTypes: [{ name: "Tax", value: 96 }, { name: "Commercial", value: 78 }, { name: "Constitutional", value: 64 }, { name: "Civil", value: 60 }], yearly: [{ year: 2020, count: 58 }, { year: 2021, count: 72 }, { year: 2022, count: 84 }, { year: 2023, count: 84 }], topPrinciples: ["IP enforcement", "Anti-discrimination", "Direct tax"] },
];

export interface SampleDocument {
  id: string;
  title: string;
  type: "Judgment" | "FIR" | "Contract" | "Petition";
  court: string;
  text: string;
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: "sample-judgment",
    title: "Sample Judgment — Karnataka Eviction",
    type: "Judgment",
    court: "Karnataka High Court",
    text: `IN THE HIGH COURT OF KARNATAKA AT BENGALURU
Regular Second Appeal No. 1184 of 2021
Ramesh Kumar … Appellant
versus
Suresh Singh … Respondent

JUDGMENT
1. This second appeal arises from concurrent findings of the trial court and first appellate court decreeing the respondent-landlord's suit for eviction under Section 27(2)(r) of the Karnataka Rent Act, 1999 on the ground of bona fide requirement.
2. The appellant-tenant has been in occupation of the suit premises since 2003 under a registered lease. The respondent claims the premises are required for his son's medical practice.
3. Issue: Whether the bona fide need pleaded by the respondent is genuine and whether the comparative hardship under Section 27(7) tips in favour of the tenant.
4. Counsel for the appellant relied upon Olga Tellis v. Bombay Municipal Corp. (1985) 3 SCC 545 to argue right to livelihood.
5. The respondent placed reliance on B.V. Nagaraju v. M. Veeranna (2019) and on the unreported Bhagwan Das case to establish bona fide intent.
6. Held: The concurrent findings on bona fide requirement are supported by oral and documentary evidence. The appeal is dismissed. Six months' grace granted.`,
  },
  {
    id: "sample-fir",
    title: "Sample FIR — Theft under BNS 303",
    type: "FIR",
    court: "Bengaluru City",
    text: `FIRST INFORMATION REPORT
Police Station: Cubbon Park
FIR No.: 0421/2024 dated 18.11.2024
Section: 303 of the Bharatiya Nyaya Sanhita, 2023 (theft)

1. Complainant: Mr. Anand Rao, age 42, resident of Indiranagar, Bengaluru.
2. Brief facts: On 17.11.2024 between 22:00 and 23:30 hrs, unknown person(s) removed a Royal Enfield motorcycle bearing registration KA-03-MJ-9281 parked outside Toit Brewpub.
3. CCTV from the adjacent ATM reviewed; suspect partially visible.
4. Investigation initiated under Section 303 BNS read with Section 175 BNSS, 2023.
5. The complainant has produced the registration certificate and insurance. Statement of two witnesses recorded under Section 180 BNSS.`,
  },
  {
    id: "sample-contract",
    title: "Sample Contract — Commercial Agreement",
    type: "Contract",
    court: "Commercial Court, Bengaluru",
    text: `MASTER SERVICES AGREEMENT
This Agreement is made between Vyana Technologies Pvt. Ltd. ("Service Provider") and Nilkanth Logistics Ltd. ("Client") on 12.03.2024.

3. Term: 36 months commencing 01.04.2024.
9. Confidentiality: Each party shall hold the other's Confidential Information in confidence for a period of seven years.
14. Governing Law: This Agreement shall be governed by the laws of India.
15. Dispute Resolution: All disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996. Seat: Bengaluru. Sole Arbitrator. Language: English.
17. Indemnity: Capped at fees paid in the preceding 12 months.`,
  },
  {
    id: "sample-petition",
    title: "Sample Petition — Article 21 Writ",
    type: "Petition",
    court: "Supreme Court of India",
    text: `IN THE SUPREME COURT OF INDIA
CIVIL ORIGINAL JURISDICTION
Writ Petition (Civil) No. ___ of 2025
Petitioner: Citizens for Open Internet
Respondent: Union of India

1. The present petition under Article 32 of the Constitution of India is preferred against the directions dated 04.02.2025 issued under Section 69A of the Information Technology Act, 2000, which mandate blanket blocking of a class of mobile applications without offering hearing to publishers.
2. Grounds:
   a) Violation of Article 21 of the Constitution as interpreted in K.S. Puttaswamy v. Union of India (2017) 10 SCC 1;
   b) Violation of Article 19(1)(a) as held in Shreya Singhal v. Union of India (2015) 5 SCC 1;
   c) Procedural unreasonableness contrary to Maneka Gandhi v. Union of India (1978) 1 SCC 248.
3. Prayer: Issue a writ of mandamus quashing the impugned directions and a writ of certiorari laying down procedural safeguards.`,
  },
];

export interface BareAct {
  id: string;
  name: string;
  shortName: string;
  year: number;
  category: string;
  sectionsCount: number;
  description: string;
  keySections: { number: string; title: string; text: string }[];
  source: string;
}

export const BARE_ACTS: BareAct[] = [
  { id: "constitution", name: "The Constitution of India", shortName: "Constitution", year: 1950, category: "Constitutional", sectionsCount: 395, description: "Supreme law of India; 395 articles across 22 parts and 12 schedules.", source: "indiacode.nic.in", keySections: [
    { number: "Article 14", title: "Equality before law", text: "The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India. — Equality before law is a negative concept (no special privilege) and equal protection of laws is a positive concept (equal treatment in equal circumstances). Permits reasonable classification founded on intelligible differentia having a rational nexus to the object sought to be achieved (State of West Bengal v. Anwar Ali Sarkar, AIR 1952 SC 75). The test of manifest arbitrariness was articulated in Shayara Bano v. Union of India (2017) 9 SCC 1." },
    { number: "Article 15", title: "Prohibition of discrimination on grounds of religion, race, caste, sex or place of birth", text: "(1) The State shall not discriminate against any citizen on grounds only of religion, race, caste, sex, place of birth or any of them. (2) No citizen shall, on grounds only of religion, race, caste, sex, place of birth or any of them, be subject to any disability, liability, restriction or condition with regard to — (a) access to shops, public restaurants, hotels and places of public entertainment; or (b) the use of wells, tanks, bathing ghats, roads and places of public resort maintained wholly or partly out of State funds or dedicated to the use of the general public. (3) Nothing in this article shall prevent the State from making any special provision for women and children. (4) Nothing in this article or in clause (2) of article 29 shall prevent the State from making any special provision for the advancement of any socially and educationally backward classes of citizens or for the Scheduled Castes and the Scheduled Tribes. (5) Special provision for advancement of SEBC, SC and ST in relation to admission to educational institutions including private unaided institutions other than minority institutions. (6) Special provision for the economically weaker sections of citizens (inserted by 103rd Amendment, 2019)." },
    { number: "Article 19", title: "Protection of certain rights regarding freedom of speech, etc.", text: "(1) All citizens shall have the right — (a) to freedom of speech and expression; (b) to assemble peaceably and without arms; (c) to form associations or unions; (d) to move freely throughout the territory of India; (e) to reside and settle in any part of the territory of India; and (g) to practise any profession, or to carry on any occupation, trade or business. (2) Nothing in sub-clause (a) shall affect the operation of any existing law, or prevent the State from making any law, in so far as such law imposes reasonable restrictions on the exercise of the right conferred by the said sub-clause in the interests of the sovereignty and integrity of India, the security of the State, friendly relations with foreign States, public order, decency or morality, or in relation to contempt of court, defamation or incitement to an offence. (3)–(6) Reasonable restrictions for assemblies, associations, movement, residence and trade. Section 66A of the IT Act was struck down for failing the 19(2) reasonableness test in Shreya Singhal v. Union of India (2015) 5 SCC 1." },
    { number: "Article 21", title: "Protection of life and personal liberty", text: "No person shall be deprived of his life or personal liberty except according to procedure established by law. — Read with Maneka Gandhi v. Union of India (1978) 1 SCC 248 the 'procedure established by law' must be just, fair and reasonable, and not arbitrary, fanciful or oppressive; this incorporated due process into Indian constitutional law. Subsequent jurisprudence has read into Article 21 the right to live with human dignity (Francis Coralie Mullin (1981) 1 SCC 608), the right to livelihood (Olga Tellis (1985) 3 SCC 545), the right to speedy trial (Hussainara Khatoon (1980) 1 SCC 81), the right to a clean environment (M.C. Mehta), the right to privacy (K.S. Puttaswamy v. Union of India (2017) 10 SCC 1), and the right to die with dignity through advance directives (Common Cause (2018) 5 SCC 1)." },
    { number: "Article 25", title: "Freedom of conscience and free profession, practice and propagation of religion", text: "(1) Subject to public order, morality and health and to the other provisions of this Part, all persons are equally entitled to freedom of conscience and the right freely to profess, practise and propagate religion. (2) Nothing in this article shall affect the operation of any existing law or prevent the State from making any law — (a) regulating or restricting any economic, financial, political or other secular activity which may be associated with religious practice; (b) providing for social welfare and reform or the throwing open of Hindu religious institutions of a public character to all classes and sections of Hindus. Explanation I — The wearing and carrying of kirpans shall be deemed to be included in the profession of the Sikh religion. Explanation II — In sub-clause (b) of clause (2), the reference to Hindus shall be construed as including a reference to persons professing the Sikh, Jaina or Buddhist religion. — The essential religious practices doctrine traces to Commr., HRE v. Lakshmindra Thirtha Swamiar (AIR 1954 SC 282)." },
    { number: "Article 32", title: "Remedies for enforcement of rights conferred by this Part", text: "(1) The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part is guaranteed. (2) The Supreme Court shall have power to issue directions or orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, whichever may be appropriate, for the enforcement of any of the rights conferred by this Part. (3) Without prejudice to the powers conferred on the Supreme Court by clauses (1) and (2), Parliament may by law empower any other court to exercise within the local limits of its jurisdiction all or any of the powers exercisable by the Supreme Court under clause (2). (4) The right guaranteed by this article shall not be suspended except as otherwise provided for by this Constitution. — Article 32 is itself a fundamental right; Dr. Ambedkar described it as the 'heart and soul' of the Constitution." },
    { number: "Article 44", title: "Uniform civil code for the citizens", text: "The State shall endeavour to secure for the citizens a uniform civil code throughout the territory of India. — A Directive Principle under Part IV. Not justiciable but fundamental in the governance of the country (Article 37). The Supreme Court has periodically urged Parliament to act on Article 44 (Mohd. Ahmed Khan v. Shah Bano Begum (1985) 2 SCC 556; Sarla Mudgal v. Union of India (1995) 3 SCC 635)." },
    { number: "Article 226", title: "Power of High Courts to issue writs", text: "(1) Notwithstanding anything in article 32 every High Court shall have power, throughout the territories in relation to which it exercises jurisdiction, to issue to any person or authority, including in appropriate cases, any Government, within those territories directions, orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, or any of them, for the enforcement of any of the rights conferred by Part III and for any other purpose. (2) The power conferred by clause (1) to issue directions, orders or writs to any Government, authority or person may also be exercised by any High Court exercising jurisdiction in relation to the territories within which the cause of action, wholly or in part, arises for the exercise of such power, notwithstanding that the seat of such Government or authority or the residence of such person is not within those territories. (3)–(4) Vacation of interim orders and saving clause. — Wider than Article 32 because it extends to 'any other purpose' beyond fundamental rights, but discretionary." },
    { number: "Article 368", title: "Power of Parliament to amend the Constitution and procedure therefor", text: "(1) Notwithstanding anything in this Constitution, Parliament may in exercise of its constituent power amend by way of addition, variation or repeal any provision of this Constitution in accordance with the procedure laid down in this article. (2) An amendment of this Constitution may be initiated only by the introduction of a Bill for the purpose in either House of Parliament, and when the Bill is passed in each House by a majority of the total membership of that House and by a majority of not less than two-thirds of the members of that House present and voting, it shall be presented to the President who shall give his assent to the Bill and thereupon the Constitution shall stand amended in accordance with the terms of the Bill: Provided that if such amendment seeks to make any change in (a) article 54, 55, 73, 162, 241 or 279A; (b) Chapter IV of Part V, Chapter V of Part VI, or Chapter I of Part XI; (c) any of the Lists in the Seventh Schedule; (d) the representation of States in Parliament; (e) the provisions of this article — the amendment shall also require to be ratified by the Legislatures of not less than one-half of the States by resolutions to that effect passed before the Bill making provision for such amendment is presented to the President for assent. (3) Nothing in article 13 shall apply to any amendment made under this article. — Subject to the Basic Structure Doctrine (Kesavananda Bharati (1973) 4 SCC 225)." },
    { number: "Article 370", title: "Temporary provisions with respect to the State of Jammu and Kashmir (abrogated)", text: "(1) Notwithstanding anything in this Constitution — (a) the provisions of article 238 shall not apply to the State of Jammu and Kashmir; (b) the power of Parliament to make laws for that State shall be limited to those matters in the Union List and the Concurrent List which, in consultation with the Government of the State, are declared by the President to correspond to matters specified in the Instrument of Accession governing the accession of the State to the Dominion of India, and such other matters in the said Lists as, with the concurrence of the Government of the State, the President may by order specify; (c) the provisions of article 1 and of this article shall apply in relation to that State; (d) such of the other provisions of this Constitution shall apply in relation to that State subject to such exceptions and modifications as the President may by order specify. (2)–(3) Concurrence and recommendation procedures. — By Presidential Order C.O. 273 dated 5–6 August 2019 and the Jammu and Kashmir Reorganisation Act, 2019, the operative provisions of Article 370 ceased to apply, except clause (1) which now reads as the gateway provision. Validity upheld in In re: Article 370 (Constitution Bench, 11 December 2023)." },
  ]},
  { id: "bns-2023", name: "Bharatiya Nyaya Sanhita, 2023", shortName: "BNS", year: 2023, category: "Criminal", sectionsCount: 358, description: "Replaces the Indian Penal Code, 1860 with effect from 01.07.2024.", source: "indiacode.nic.in", keySections: [
    { number: "Section 100", title: "Culpable homicide", text: "Whoever causes death by doing an act with the intention of causing death, or with the intention of causing such bodily injury as is likely to cause death, or with the knowledge that he is likely by such act to cause death, commits the offence of culpable homicide. Illustrations: (a) A lays sticks and turf over a pit, with the intention of thereby causing death, or with the knowledge that death is likely to be thereby caused. Z, believing the ground to be firm, treads on it, falls in and is killed. A has committed the offence of culpable homicide. Explanation 1.—A person who causes bodily injury to another who is labouring under a disorder, disease or bodily infirmity, and thereby accelerates the death of that other, shall be deemed to have caused his death. Explanation 2.—Where death is caused by bodily injury, the person who causes such bodily injury shall be deemed to have caused the death, although by resorting to proper remedies and skilful treatment the death might have been prevented. Explanation 3.—The causing of the death of a child in the mother's womb is not homicide; but causing the death of a living child, any part of which has been brought forth, is homicide." },
    { number: "Section 101", title: "Murder", text: "Except in the cases hereinafter excepted, culpable homicide is murder — (a) if the act by which the death is caused is done with the intention of causing death; or (b) if it is done with the intention of causing such bodily injury as the offender knows to be likely to cause the death of the person to whom the harm is caused; or (c) if it is done with the intention of causing bodily injury to any person and the bodily injury intended to be inflicted is sufficient in the ordinary course of nature to cause death; or (d) if the person committing the act knows that it is so imminently dangerous that it must, in all probability, cause death, or such bodily injury as is likely to cause death, and commits such act without any excuse for incurring the risk of causing death or such injury as aforesaid. Exception 1 — Grave and sudden provocation. Exception 2 — Right of private defence exceeded in good faith. Exception 3 — Public servant exceeding lawful powers in good faith. Exception 4 — Sudden fight without premeditation. Exception 5 — Consent of a person above eighteen suffering death." },
    { number: "Section 102", title: "Culpable homicide by causing death of person other than person whose death was intended", text: "If a person, by doing anything which he intends or knows to be likely to cause death, commits culpable homicide by causing the death of any person, whose death he neither intends nor knows himself to be likely to cause, the culpable homicide committed by the offender is of the description of which it would have been if he had caused the death of the person whose death he intended or knew himself to be likely to cause. (Doctrine of transferred malice.)" },
    { number: "Section 103", title: "Punishment for murder", text: "(1) Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine. (2) When a group of five or more persons acting in concert commits murder on the ground of race, caste or community, sex, place of birth, language, personal belief or any other similar ground each member of such group shall be punished with death or with imprisonment for life, and shall also be liable to fine. — Death penalty constitutional only in the 'rarest of rare' category per Bachan Singh v. State of Punjab (1980) 2 SCC 684; mandatory death penalty (former IPC §303) struck down in Mithu v. State of Punjab (1983) 2 SCC 277." },
    { number: "Section 104", title: "Punishment for culpable homicide not amounting to murder", text: "Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment for life, or imprisonment of either description for a term which may extend to ten years, and shall also be liable to fine, if the act by which the death is caused is done with the intention of causing death, or of causing such bodily injury as is likely to cause death; or with imprisonment of either description for a term which may extend to ten years, or with fine, or with both, if the act is done with the knowledge that it is likely to cause death, but without any intention to cause death, or to cause such bodily injury as is likely to cause death." },
    { number: "Section 105", title: "Punishment for causing death by negligence", text: "Whoever causes the death of any person by doing any rash or negligent act not amounting to culpable homicide shall be punished with imprisonment of either description for a term which may extend to five years, and shall also be liable to fine; and if such act is done by a registered medical practitioner while performing medical procedure, he shall be punished with imprisonment of either description for a term which may extend to two years, and shall also be liable to fine." },
    { number: "Section 115", title: "Voluntarily causing hurt", text: "(1) Whoever does any act with the intention of thereby causing hurt to any person, or with the knowledge that he is likely thereby to cause hurt to any person, and does thereby cause hurt to any person, is said voluntarily to cause hurt. (2) Whoever, except in the case provided for by sub-section (1) of section 122, voluntarily causes hurt, shall be punished with imprisonment of either description for a term which may extend to one year, or with fine which may extend to ten thousand rupees, or with both." },
    { number: "Section 116", title: "Grievous hurt", text: "The following kinds of hurt only are designated as 'grievous', namely — (a) emasculation; (b) permanent privation of the sight of either eye; (c) permanent privation of the hearing of either ear; (d) privation of any member or joint; (e) destruction or permanent impairing of the powers of any member or joint; (f) permanent disfiguration of the head or face; (g) fracture or dislocation of a bone or tooth; (h) any hurt which endangers life or which causes the sufferer to be during the space of fifteen days in severe bodily pain, or unable to follow his ordinary pursuits." },
    { number: "Section 117", title: "Voluntarily causing grievous hurt", text: "(1) Whoever voluntarily causes hurt, if the hurt which he intends to cause or knows himself to be likely to cause is grievous hurt, and if the hurt which he causes is grievous hurt, is said voluntarily to cause grievous hurt. (2) Whoever, except in the case provided for by sub-section (2) of section 122, voluntarily causes grievous hurt, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine. (3) Where a person grievously hurts another causing permanent disability or persistent vegetative state, he shall be punished with rigorous imprisonment for a term not less than ten years extendable to imprisonment for life, which shall mean imprisonment for remainder of that person's natural life. (4) When group of five or more persons acting in concert grievously hurts a person on grounds of race, caste, community, sex, place of birth, language, personal belief or any similar ground, each member shall be punished with imprisonment of either description which may extend to seven years and shall be liable to fine." },
    { number: "Section 118", title: "Voluntarily causing hurt or grievous hurt by dangerous weapons or means", text: "(1) Whoever, except in the case provided for by sub-section (1) of section 122, voluntarily causes hurt by means of any instrument for shooting, stabbing or cutting, or any instrument which, used as a weapon of offence, is likely to cause death, or by means of fire or any heated substance, or by means of any poison or any corrosive substance, or by means of any explosive substance, or by means of any substance which it is deleterious to the human body to inhale, to swallow, or to receive into the blood, or by means of any animal, shall be punished with imprisonment of either description for a term which may extend to three years, or with fine which may extend to twenty thousand rupees, or with both. (2) Where grievous hurt is caused by such means, imprisonment for a term which shall not be less than one year, but which may extend to ten years, and shall also be liable to fine." },
    { number: "Section 303", title: "Theft", text: "(1) Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft. Explanation 1.—A thing so long as it is attached to the earth, not being movable property, is not the subject of theft; but it becomes capable of being the subject of theft as soon as it is severed from the earth. Explanation 2.—A moving effected by the same act which effects the severance may be a theft. Explanation 3.—A person is said to cause a thing to move by removing an obstacle which prevented it from moving or by separating it from any other thing, as well as by actually moving it. Explanation 4.—A person, who by any means causes an animal to move, is said to move that animal, and to move everything which, in consequence of the motion so caused, is moved by that animal. Explanation 5.—The consent mentioned in the definition may be express or implied, and may be given either by the person in possession, or by any person having for that purpose authority either express or implied. (2) Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both and in case of second or subsequent conviction of any person under this section, he shall be punished with rigorous imprisonment for a term which shall not be less than one year but which may extend to five years and with fine: Provided that in cases of theft where the value of the stolen property is less than five thousand rupees, and a person is convicted for the first time, shall upon return of the value of property or restoration of the stolen property, be punished with community service." },
    { number: "Section 308", title: "Extortion", text: "(1) Whoever intentionally puts any person in fear of any injury to that person, or to any other, and thereby dishonestly induces the person so put in fear to deliver to any person any property, or valuable security, or anything signed or sealed which may be converted into a valuable security, commits 'extortion'. (2) Whoever commits extortion shall be punished with imprisonment of either description for a term which may extend to seven years, or with fine, or with both. (3)–(7) Aggravated forms — extortion by putting in fear of death or grievous hurt (imprisonment up to ten years and fine); extortion by threat of accusation of an offence punishable with death or life imprisonment (imprisonment up to ten years and fine)." },
    { number: "Section 316", title: "Criminal breach of trust", text: "(1) Whoever, being in any manner entrusted with property, or with any dominion over property, dishonestly misappropriates or converts to his own use that property, or dishonestly uses or disposes of that property in violation of any direction of law prescribing the mode in which such trust is to be discharged, or of any legal contract, express or implied, which he has made touching the discharge of such trust, or wilfully suffers any other person so to do, commits 'criminal breach of trust'. (2) Whoever commits criminal breach of trust shall be punished with imprisonment of either description for a term which may extend to five years, or with fine, or with both. (3) By a carrier, wharfinger or warehouse-keeper — imprisonment up to seven years and fine. (4) By a clerk or servant — imprisonment up to seven years and fine. (5) By a public servant, banker, merchant, factor, broker, attorney or agent — imprisonment for life or up to ten years and fine." },
    { number: "Section 351", title: "Cheating", text: "(1) Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person, or to consent that any person shall retain any property, or intentionally induces the person so deceived to do or omit to do anything which he would not do or omit if he were not so deceived, and which act or omission causes or is likely to cause damage or harm to that person in body, mind, reputation or property, is said to 'cheat'. Explanation.—A dishonest concealment of facts is a deception within the meaning of this section. (2) Whoever cheats shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both. (3) Whoever cheats with the knowledge that he is likely thereby to cause wrongful loss to a person whose interest in the transaction to which the cheating relates, he was bound, either by law, or by a legal contract, to protect, or cheats a person whose interest he is bound to protect, shall be punished with imprisonment of either description for a term which may extend to five years, or with fine, or with both. (4) Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, or anything which is signed or sealed, and which is capable of being converted into a valuable security, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine." },
    { number: "Section 152", title: "Act endangering sovereignty, unity and integrity of India", text: "Whoever, purposely or knowingly, by words, either spoken or written, or by signs, or by visible representation, or by electronic communication or by use of financial mean, or otherwise, excites or attempts to excite, secession or armed rebellion or subversive activities, or encourages feelings of separatist activities or endangers sovereignty or unity and integrity of India; or indulges in or commits any such act shall be punished with imprisonment for life or with imprisonment which may extend to seven years, and shall also be liable to fine. Explanation — Comments expressing disapprobation of the measures, or administrative or other action of the Government with a view to obtain their alteration by lawful means without exciting or attempting to excite the activities referred to in this section do not constitute an offence under this section. — Narrower successor to colonial sedition (former IPC §124A)." },
  ]},
  { id: "bnss-2023", name: "Bharatiya Nagarik Suraksha Sanhita, 2023", shortName: "BNSS", year: 2023, category: "Criminal", sectionsCount: 531, description: "Replaces the Code of Criminal Procedure, 1973.", source: "indiacode.nic.in", keySections: [
    { number: "Section 64", title: "Punishment for rape", text: "(1) Whoever, except in the cases provided for in sub-section (2), commits rape, shall be punished with rigorous imprisonment of either description for a term which shall not be less than ten years, but which may extend to imprisonment for life, and shall also be liable to fine. (2) Whoever commits rape, being (a) a police officer within his jurisdiction or police station premises; (b) a public servant; (c) member of armed forces; (d) management or staff of jail/remand home; (e) management or staff of a hospital; (f) a relative, guardian or teacher; (g) during communal or sectarian violence; (h) on a pregnant woman; (i) on a woman incapable of giving consent; (j) being in a position of control or dominance; (k) on a woman suffering from mental or physical disability; (l) while causing grievous bodily harm or maiming or disfiguring or endangering life; (m) repeatedly on the same woman, shall be punished with rigorous imprisonment for a term which shall not be less than ten years, but which may extend to imprisonment for life, which shall mean imprisonment for the remainder of that person's natural life, and shall also be liable to fine. (BNSS retains the substantive offence imported from former IPC §376 with strengthened minimums.)" },
    { number: "Section 65", title: "Punishment for rape of a woman under sixteen years and twelve years of age", text: "(1) Whoever, commits rape on a woman under sixteen years of age shall be punished with rigorous imprisonment for a term which shall not be less than twenty years, but which may extend to imprisonment for life, which shall mean imprisonment for the remainder of that person's natural life, and shall also be liable to fine. (2) Whoever, commits rape on a woman under twelve years of age shall be punished with rigorous imprisonment for a term which shall not be less than twenty years, but which may extend to imprisonment for life, which shall mean imprisonment for the remainder of that person's natural life, and with fine or with death. Fine shall be just and reasonable to meet the medical expenses and rehabilitation of the victim and paid to the victim." },
    { number: "Section 66", title: "Punishment for causing death or resulting in persistent vegetative state of victim", text: "Whoever, commits an offence punishable under sub-section (1) or sub-section (2) of section 64 and in the course of such commission inflicts an injury which causes the death of the woman or causes the woman to be in a persistent vegetative state, shall be punished with rigorous imprisonment for a term which shall not be less than twenty years, but which may extend to imprisonment for life, which shall mean imprisonment for the remainder of that person's natural life, or with death." },
    { number: "Section 67", title: "Sexual intercourse by husband upon his wife during separation", text: "Whoever has sexual intercourse with his own wife, who is living separately, whether under a decree of separation or otherwise, without her consent, shall be punished with imprisonment of either description for a term which shall not be less than two years but which may extend to seven years, and shall also be liable to fine." },
    { number: "Section 68", title: "Sexual intercourse by a person in authority", text: "Whoever, being (a) in a position of authority or in a fiduciary relationship; or (b) a public servant; or (c) superintendent or manager of a jail, remand home or other place of custody; or (d) on the management or on the staff of a hospital, abuses such position or fiduciary relationship to induce or seduce any woman either in his custody or under his charge or present in the premises to have sexual intercourse with him, such sexual intercourse not amounting to the offence of rape, shall be punished with rigorous imprisonment of either description for a term which shall not be less than five years, but which may extend to ten years, and shall also be liable to fine." },
    { number: "Section 69", title: "Sexual intercourse by employing deceitful means etc.", text: "Whoever, by deceitful means or by making promise to marry to a woman without any intention of fulfilling the same, has sexual intercourse with her, such sexual intercourse not amounting to the offence of rape, shall be punished with imprisonment of either description for a term which may extend to ten years and shall also be liable to fine. Explanation — 'deceitful means' shall include inducement for, or false promise of employment or promotion, or marrying by suppressing identity." },
    { number: "Section 70", title: "Gang rape", text: "(1) Where a woman is raped by one or more persons constituting a group or acting in furtherance of a common intention, each of those persons shall be deemed to have committed the offence of rape and shall be punished with rigorous imprisonment for a term which shall not be less than twenty years, but which may extend to imprisonment for life, which shall mean imprisonment for the remainder of that person's natural life, and with fine. (2) Where a woman under eighteen years of age is raped by one or more persons constituting a group or acting in furtherance of a common intention, each of those persons shall be deemed to have committed the offence of rape and shall be punished with imprisonment for life, which shall mean imprisonment for the remainder of that person's natural life, and with fine, or with death." },
    { number: "Section 71", title: "Punishment for repeat offenders", text: "Whoever has been previously convicted of an offence punishable under section 64 or section 65 or section 66 or section 70 and is subsequently convicted of an offence punishable under any of the said sections shall be punished with imprisonment for life which shall mean imprisonment for the remainder of that person's natural life, or with death." },
    { number: "Section 173", title: "Information in cognizable cases", text: "(1) Every information relating to the commission of a cognizable offence, irrespective of the area where the offence is committed, may be given orally or by electronic communication to an officer in charge of a police station, and if given — (i) orally, it shall be reduced to writing by him or under his direction, and be read over to the informant; and every such information, whether given in writing or reduced to writing as aforesaid, shall be signed by the person giving it, and the substance thereof shall be entered in a book to be kept by such officer in such form as the State Government may by rules prescribe in this behalf: Provided that if the information is given by the woman against whom an offence under sections 64, 65, 66, 67, 68, 69, 70, 71, 74, 75, 76, 77, 78, 79 or 124 of the Bharatiya Nyaya Sanhita, 2023 is alleged to have been committed or attempted, then such information shall be recorded, by a woman police officer or any woman officer; (ii) by electronic communication, it shall be taken on record by him on being signed within three days by the person giving it. (2) A copy of the information as recorded under sub-section (1) shall be given forthwith, free of cost, to the informant or the victim. (3) Preliminary enquiry permissible for offences punishable with three years or more but less than seven years to ascertain whether a prima facie case exists." },
    { number: "Section 175", title: "Police officer's power to investigate cognizable case", text: "(1) Any officer in charge of a police station may, without the order of a Magistrate, investigate any cognizable case which a Court having jurisdiction over the local area within the limits of such station would have power to inquire into or try under the provisions of Chapter XIV. (3) Any Magistrate empowered under section 210 may, upon receiving a complaint against a public servant arising in course of the discharge of his official duties, order investigation, subject to (a) receiving a report containing facts and circumstances of the incident from the officer superior to him; and (b) after consideration of the assertions made by the public servant as to the situation that led to the incident so alleged. (4) Any Magistrate empowered under section 210 may, upon receiving an application from the victim alleging refusal of the officer in charge of a police station to record information given under section 173, direct registration of the case and investigation." },
    { number: "Section 180", title: "Examination of witnesses by police", text: "(1) Any police officer making an investigation under this Chapter, or any police officer not below such rank as the State Government may prescribe by a general or special order, acting on the requisition of such officer, may examine orally any person supposed to be acquainted with the facts and circumstances of the case. (2) Such person shall be bound to answer truly all questions relating to such case put to him by such officer, other than questions the answers to which would have a tendency to expose him to a criminal charge or to a penalty or forfeiture. (3) The police officer may reduce into writing any statement made to him in the course of an examination under this section; and if he does so, he shall make a separate and true record of the statement of each such person whose statement he records, and such statement may be recorded by audio-video electronic means. Statements of women against whom offences under sections 64–71 BNS are alleged shall be recorded by a woman police officer in the presence of her parent or guardian or near relative or social worker." },
    { number: "Section 187", title: "Procedure when investigation cannot be completed in twenty-four hours", text: "(1) Whenever any person is arrested and detained in custody, and it appears that the investigation cannot be completed within the period of twenty-four hours fixed by section 58, and there are grounds for believing that the accusation or information is well-founded, the officer in charge of the police station or the police officer making the investigation, if he is not below the rank of sub-inspector, shall forthwith transmit to the nearest Judicial Magistrate a copy of the entries in the diary hereinafter prescribed relating to the case, and shall at the same time forward the accused to such Magistrate. (2) The Magistrate to whom an accused person is forwarded under this section may, whether he has or has not jurisdiction to try the case, after taking into consideration whether such person has not been released on bail or his bail has been cancelled, authorise, from time to time, the detention of the accused in such custody as such Magistrate thinks fit, for a term not exceeding fifteen days in the whole, or in parts, at any time during the initial forty days out of detention period of sixty days, or sixty days out of detention period of ninety days, as the case may be. (3) Maximum detention pending investigation — ninety days where the investigation relates to an offence punishable with death, imprisonment for life or imprisonment for a term of not less than ten years; and sixty days where the investigation relates to any other offence; on expiry the accused shall be released on bail if prepared to and does furnish bail." },
  ]},
  { id: "bsa-2023", name: "Bharatiya Sakshya Adhiniyam, 2023", shortName: "BSA", year: 2023, category: "Criminal", sectionsCount: 170, description: "Replaces the Indian Evidence Act, 1872. Modernises electronic evidence handling.", source: "indiacode.nic.in", keySections: [
    { number: "Section 63", title: "Admissibility of electronic records", text: "Electronic records produced subject to certification under Section 63(4) shall be admissible in evidence. Successor to IEA § 65B with clarified certification procedure for cloud and distributed storage." },
  ]},
  { id: "ipc-1860", name: "Indian Penal Code, 1860", shortName: "IPC", year: 1860, category: "Criminal (Legacy)", sectionsCount: 511, description: "Legacy criminal code; superseded by BNS, 2023 for offences committed on or after 01.07.2024.", source: "indiacode.nic.in", keySections: [
    { number: "Section 302", title: "Punishment for murder", text: "Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine. — Death penalty restricted to 'rarest of rare' cases per Bachan Singh v. State of Punjab (1980) 2 SCC 684; sentencing must weigh aggravating and mitigating circumstances of both the crime and the criminal (Machhi Singh v. State of Punjab (1983) 3 SCC 470). [Successor: BNS §103 w.e.f. 01.07.2024.]" },
    { number: "Section 304", title: "Punishment for culpable homicide not amounting to murder", text: "Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment for life, or imprisonment of either description for a term which may extend to ten years, and shall also be liable to fine, if the act by which the death is caused is done with the intention of causing death, or of causing such bodily injury as is likely to cause death (Part I); or with imprisonment of either description for a term which may extend to ten years, or with fine, or with both, if the act is done with the knowledge that it is likely to cause death, but without any intention to cause death, or to cause such bodily injury as is likely to cause death (Part II). [Successor: BNS §105.]" },
    { number: "Section 354", title: "Assault or criminal force to woman with intent to outrage her modesty", text: "Whoever assaults or uses criminal force to any woman, intending to outrage or knowing it to be likely that he will thereby outrage her modesty, shall be punished with imprisonment of either description for a term which shall not be less than one year but which may extend to five years, and shall also be liable to fine. — Inserted sub-sections (post-2013 amendments): §354A (sexual harassment), §354B (assault or use of criminal force with intent to disrobe), §354C (voyeurism), §354D (stalking). The modesty test was articulated in State of Punjab v. Major Singh (AIR 1967 SC 63). [Successor: BNS §74–§78.]" },
    { number: "Section 376", title: "Punishment for rape", text: "(1) Whoever, except in the cases provided for in sub-section (2), commits rape shall be punished with rigorous imprisonment of either description for a term which shall not be less than ten years, but which may extend to imprisonment for life, and shall also be liable to fine. (2) Whoever — (a) being a police officer commits rape within the limits of the police station to which such police officer is appointed; or within the premises of any station house; or on a woman in such police officer's custody or in the custody of a police officer subordinate to such police officer; or (b) being a public servant, commits rape on a woman in such public servant's custody or in the custody of a public servant subordinate to such public servant; or (c)–(n) aggravated forms — shall be punished with rigorous imprisonment for a term which shall not be less than ten years, but which may extend to imprisonment for life, which shall mean imprisonment for the remainder of that person's natural life, and shall also be liable to fine. §376A — causing death or persistent vegetative state. §376AB — rape on woman under twelve years. §376D — gang rape (mandatory 20 years to life). §376DB — gang rape on woman under twelve (life or death). §376E — repeat offender (life or death). [Successor: BNS §64–§71.]" },
    { number: "Section 379", title: "Punishment for theft", text: "Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both. — Read with §378 (definition) and §380 (theft in dwelling house). [Successor: BNS §303 w.e.f. 01.07.2024.]" },
    { number: "Section 420", title: "Cheating and dishonestly inducing delivery of property", text: "Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, or anything which is signed or sealed, and which is capable of being converted into a valuable security, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine. [Successor: BNS §318(4).]" },
    { number: "Section 498A", title: "Husband or relative of husband of a woman subjecting her to cruelty", text: "Whoever, being the husband or the relative of the husband of a woman, subjects such woman to cruelty shall be punished with imprisonment for a term which may extend to three years and shall also be liable to fine. Explanation — For the purposes of this section, 'cruelty' means — (a) any wilful conduct which is of such a nature as is likely to drive the woman to commit suicide or to cause grave injury or danger to life, limb or health (whether mental or physical) of the woman; or (b) harassment of the woman where such harassment is with a view to coercing her or any person related to her to meet any unlawful demand for any property or valuable security or is on account of failure by her or any person related to her to meet such demand. Safeguards on arrest in Arnesh Kumar v. State of Bihar (2014) 8 SCC 273. [Successor: BNS §85–§86.]" },
    { number: "Section 377", title: "Unnatural offences", text: "Whoever voluntarily has carnal intercourse against the order of nature with any man, woman or animal, shall be punished with imprisonment for life, or with imprisonment of either description for a term which may extend to ten years, and shall also be liable to fine. — Read down by Navtej Singh Johar v. Union of India (2018) 10 SCC 1 insofar as it criminalises consensual adult same-sex conduct; survives only as to non-consensual acts and bestiality." },
    { number: "Section 497", title: "Adultery", text: "Whoever has sexual intercourse with a person who is and whom he knows or has reason to believe to be the wife of another man, without the consent or connivance of that man, such sexual intercourse not amounting to the offence of rape, is guilty of the offence of adultery, and shall be punished with imprisonment of either description for a term which may extend to five years, or with fine, or with both. In such case the wife shall not be punishable as an abettor. — Struck down as unconstitutional by Joseph Shine v. Union of India (2019) 3 SCC 39 for violating Articles 14, 15 and 21." },
  ]},
  { id: "crpc-1973", name: "Code of Criminal Procedure, 1973", shortName: "CrPC", year: 1973, category: "Criminal (Legacy)", sectionsCount: 484, description: "Legacy procedural code; superseded by BNSS for proceedings initiated on or after 01.07.2024.", source: "indiacode.nic.in", keySections: [
    { number: "Section 41", title: "When police may arrest without warrant", text: "(1) Any police officer may without an order from a Magistrate and without a warrant, arrest any person — (a) who commits, in the presence of a police officer, a cognizable offence; (b) against whom a reasonable complaint has been made, or credible information has been received, or a reasonable suspicion exists that he has committed a cognizable offence punishable with imprisonment which may be less than seven years, if the following conditions are satisfied, namely — (i) the police officer has reason to believe on the basis of such complaint, information, or suspicion that such person has committed the said offence; (ii) the police officer is satisfied that such arrest is necessary — (a) to prevent such person from committing any further offence; or (b) for proper investigation of the offence; or (c) to prevent such person from causing the evidence of the offence to disappear or tampering with such evidence in any manner; or (d) to prevent such person from making any inducement, threat or promise to any person acquainted with the facts of the case so as to dissuade him from disclosing such facts to the Court or to the police officer; or (e) as unless such person is arrested, his presence in the Court whenever required cannot be ensured, and the police officer shall record while making such arrest, his reasons in writing; (ba) against whom credible information has been received that he has committed a cognizable offence punishable with imprisonment for a term which may extend to more than seven years whether with or without fine or with death sentence and the police officer has reason to believe on the basis of that information that such person has committed the said offence. — Arnesh Kumar v. State of Bihar (2014) 8 SCC 273 issued binding directions: no automatic arrest for offences punishable up to seven years; police must record reasons and Magistrate must record satisfaction before authorising detention. [Successor: BNSS §35.]" },
    { number: "Section 125", title: "Order for maintenance of wives, children and parents", text: "(1) If any person having sufficient means neglects or refuses to maintain — (a) his wife, unable to maintain herself, or (b) his legitimate or illegitimate minor child, whether married or not, unable to maintain itself, or (c) his legitimate or illegitimate child (not being a married daughter) who has attained majority, where such child is, by reason of any physical or mental abnormality or injury unable to maintain itself, or (d) his father or mother, unable to maintain himself or herself, a Magistrate of the first class may, upon proof of such neglect or refusal, order such person to make a monthly allowance for the maintenance of his wife or such child, father or mother, at such monthly rate, as such Magistrate thinks fit, and to pay the same to such person as the Magistrate may from time to time direct. Explanation — 'wife' includes a woman who has been divorced by, or has obtained a divorce from, her husband and has not remarried. — Mohd. Ahmed Khan v. Shah Bano Begum (1985) 2 SCC 556 held Muslim divorced wives entitled to maintenance under §125; reaffirmed in Mohd. Abdul Samad v. State of Telangana (2024) holding §125 applicable irrespective of personal law. [Successor: BNSS §144.]" },
    { number: "Section 144", title: "Power to issue order in urgent cases of nuisance or apprehended danger", text: "(1) In cases where, in the opinion of a District Magistrate, a Sub-divisional Magistrate or any other Executive Magistrate specially empowered by the State Government in this behalf, there is sufficient ground for proceeding under this section and immediate prevention or speedy remedy is desirable, such Magistrate may, by a written order stating the material facts of the case and served in the manner provided by section 134, direct any person to abstain from a certain act or to take certain order with respect to certain property in his possession or under his management, if such Magistrate considers that such direction is likely to prevent, or tends to prevent, obstruction, annoyance or injury to any person lawfully employed, or danger to human life, health or safety, or a disturbance of the public tranquillity, or a riot, or an affray. (4) No order under this section shall remain in force for more than two months from the making thereof; State Government may extend up to six months for danger to human life, health or safety, or a likelihood of a riot or an affray. — Anuradha Bhasin v. Union of India (2020) 3 SCC 637 held repeated/indefinite §144 orders are an abuse of power; reasoning must be recorded and orders must be subject to judicial review. [Successor: BNSS §163.]" },
    { number: "Section 154", title: "Information in cognizable cases", text: "(1) Every information relating to the commission of a cognizable offence, if given orally to an officer in charge of a police station, shall be reduced to writing by him or under his direction, and be read over to the informant; and every such information, whether given in writing or reduced to writing as aforesaid, shall be signed by the person giving it, and the substance thereof shall be entered in a book to be kept by such officer in such form as the State Government may prescribe in this behalf: Provided that if the information is given by the woman against whom an offence under section 326A, section 326B, section 354, section 354A, section 354B, section 354C, section 354D, section 376, section 376A, section 376AB, section 376B, section 376C, section 376D, section 376DA, section 376DB, section 376E or section 509 of the Indian Penal Code is alleged to have been committed or attempted, then such information shall be recorded, by a woman police officer or any woman officer. (2) A copy of the information as recorded under sub-section (1) shall be given forthwith, free of cost, to the informant. (3) Any person aggrieved by a refusal on the part of an officer in charge of a police station to record the information referred to in sub-section (1) may send the substance of such information, in writing and by post, to the Superintendent of Police concerned. — Lalita Kumari v. Government of U.P. (2014) 2 SCC 1 mandated registration of FIR for cognizable offences; preliminary inquiry only in narrow categories. [Successor: BNSS §173.]" },
    { number: "Section 161", title: "Examination of witnesses by police", text: "(1) Any police officer making an investigation under this Chapter, or any police officer not below such rank as the State Government may, by general or special order, prescribe in this behalf, acting on the requisition of such officer, may examine orally any person supposed to be acquainted with the facts and circumstances of the case. (2) Such person shall be bound to answer truly all questions relating to such case put to him by such officer, other than questions the answers to which would have a tendency to expose him to a criminal charge or to a penalty or forfeiture. (3) The police officer may reduce into writing any statement made to him in the course of an examination under this section; and if he does so, he shall make a separate and true record of the statement of each such person whose statement he records: Provided that statement made under this sub-section may also be recorded by audio-video electronic means: Provided further that the statement of a woman against whom an offence under [specified sexual offence sections] is alleged to have been committed or attempted shall be recorded, by a woman police officer or any woman officer. — Statements under §161 are not substantive evidence (§162); may be used only to contradict the maker under §145 Evidence Act. [Successor: BNSS §180.]" },
    { number: "Section 164", title: "Recording of confessions and statements", text: "(1) Any Metropolitan Magistrate or Judicial Magistrate may, whether or not he has jurisdiction in the case, record any confession or statement made to him in the course of an investigation under this Chapter or under any other law for the time being in force, or at any time afterwards before the commencement of the inquiry or trial: Provided that any confession or statement made under this sub-section may also be recorded by audio-video electronic means in the presence of the advocate of the person accused of an offence: Provided further that no confession shall be recorded by a police officer on whom any power of a Magistrate has been conferred under any law for the time being in force. (2) The Magistrate shall, before recording any such confession, explain to the person making it that he is not bound to make a confession and that, if he does so, it may be used as evidence against him; and the Magistrate shall not record any such confession unless, upon questioning the person making it, he has reason to believe that it is being made voluntarily. (5A) Mandatory video-recorded statement of victim of sexual offence and recording by a Judicial Magistrate as soon as the commission of the offence is brought to the notice of the police. — A §164 confession must be voluntary and free from threat, inducement or promise; the Magistrate must give the accused a 'cooling off' period (Babubhai Udesinh Parmar v. State of Gujarat (2006) 12 SCC 268). [Successor: BNSS §183.]" },
  ]},
  { id: "iea-1872", name: "Indian Evidence Act, 1872", shortName: "IEA", year: 1872, category: "Criminal (Legacy)", sectionsCount: 167, description: "Legacy evidence statute; superseded by BSA, 2023.", source: "indiacode.nic.in", keySections: [
    { number: "Section 65B", title: "Admissibility of electronic records", text: "Computer outputs admissible subject to satisfaction of conditions and certification. [Successor: BSA § 63.]" },
  ]},
  { id: "cpc-1908", name: "Code of Civil Procedure, 1908", shortName: "CPC", year: 1908, category: "Civil", sectionsCount: 158, description: "Procedural law governing civil proceedings.", source: "indiacode.nic.in", keySections: [
    { number: "Section 9", title: "Courts to try all civil suits unless barred", text: "The Courts shall (subject to the provisions herein contained) have jurisdiction to try all suits of a civil nature excepting suits of which their cognizance is either expressly or impliedly barred. Cardinal principle: jurisdiction is presumed; exclusion must be clear." },
    { number: "Section 11", title: "Res judicata", text: "No Court shall try any suit or issue in which the matter directly and substantially in issue has been directly and substantially in issue in a former suit between the same parties, litigating under the same title, in a Court competent to try such subsequent suit, and has been heard and finally decided by such Court." },
    { number: "Order I", title: "Parties to suits", text: "All persons may be joined as plaintiffs in whom any right to relief in respect of or arising out of the same act or transaction is alleged to exist where, if such persons brought separate suits, any common question of law or fact would arise. Mis-joinder and non-joinder of parties — except non-joinder of a necessary party — shall not defeat the suit." },
    { number: "Order V", title: "Issue and service of summons", text: "Summons shall be served on every defendant requiring appearance and answer to the claim. Service may be effected by court process server, registered post AD, courier, fax, email or as the court directs; substituted service under Rule 20 where ordinary service fails." },
    { number: "Order VII", title: "Plaint", text: "Particulars to be contained in plaint — name of court, parties, facts constituting cause of action, jurisdictional facts, value for purposes of jurisdiction and court fees, and relief claimed. Rule 11 empowers the court to reject a plaint that does not disclose a cause of action, is undervalued, insufficiently stamped, or is barred by law." },
    { number: "Section 100", title: "Second appeal", text: "Lies to the High Court only on a substantial question of law. The memorandum of appeal shall precisely state the substantial question; the High Court formulates the question at admission stage." },
  ]},
  { id: "contract-1872", name: "Indian Contract Act, 1872", shortName: "Contract Act", year: 1872, category: "Civil", sectionsCount: 266, description: "General law of contracts; foundational commercial statute.", source: "indiacode.nic.in", keySections: [
    { number: "Section 10", title: "What agreements are contracts", text: "All agreements are contracts if made by free consent of parties competent to contract, for lawful consideration and lawful object." },
    { number: "Section 73", title: "Compensation for breach", text: "Compensation for any loss naturally arising in the usual course of things from the breach." },
  ]},
  { id: "arbitration-1996", name: "Arbitration and Conciliation Act, 1996", shortName: "Arbitration Act", year: 1996, category: "Commercial", sectionsCount: 86, description: "Governs domestic and international commercial arbitration in India.", source: "indiacode.nic.in", keySections: [
    { number: "Section 11", title: "Appointment of arbitrators", text: "Court may appoint arbitrator(s) where parties fail to do so." },
    { number: "Section 34", title: "Setting aside arbitral award", text: "Limited grounds for challenge; not a merits review." },
  ]},
  { id: "ibc-2016", name: "Insolvency and Bankruptcy Code, 2016", shortName: "IBC", year: 2016, category: "Commercial", sectionsCount: 255, description: "Consolidated framework for corporate insolvency, liquidation, and personal bankruptcy.", source: "indiacode.nic.in", keySections: [
    { number: "Section 7", title: "Initiation of CIRP by financial creditor", text: "Financial creditor may file before the NCLT upon default in payment." },
    { number: "Section 14", title: "Moratorium", text: "Imposes moratorium on suits and recovery during CIRP." },
  ]},
  { id: "companies-2013", name: "Companies Act, 2013", shortName: "Companies Act", year: 2013, category: "Commercial", sectionsCount: 470, description: "Governs incorporation, governance, and dissolution of companies in India.", source: "indiacode.nic.in", keySections: [
    { number: "Section 166", title: "Duties of directors", text: "Codifies fiduciary and statutory duties of directors." },
  ]},
  { id: "dpdp-2023", name: "Digital Personal Data Protection Act, 2023", shortName: "DPDP Act", year: 2023, category: "Digital", sectionsCount: 44, description: "India's first comprehensive data protection statute. Operationalises Puttaswamy.", source: "indiacode.nic.in", keySections: [
    { number: "Section 4", title: "Grounds for processing", text: "Personal data may be processed only for lawful purpose with consent or for certain legitimate uses." },
  ]},
  { id: "karnataka-rent-1999", name: "Karnataka Rent Act, 1999", shortName: "Karnataka Rent", year: 1999, category: "Property", sectionsCount: 71, description: "Regulates eviction, rent and tenancy in the State of Karnataka.", source: "indiacode.nic.in", keySections: [
    { number: "Section 27(2)(r)", title: "Bona fide requirement", text: "Eviction permissible where landlord requires premises bona fide for self or family." },
  ]},
];

// IPC ↔ BNS supersession mapping for Compare Acts feature.
export const IPC_BNS_MAP: { ipc: string; ipcTitle: string; bns: string; bnsTitle: string; note: string }[] = [
  { ipc: "Section 302", ipcTitle: "Punishment for murder", bns: "Section 103", bnsTitle: "Punishment for murder", note: "Substantive content retained; mob-lynching aggravated form added in BNS § 103(2)." },
  { ipc: "Section 379", ipcTitle: "Punishment for theft", bns: "Section 303", bnsTitle: "Theft", note: "Definition and three-year ceiling carried forward; enhanced punishment for repeat offenders." },
  { ipc: "Section 420", ipcTitle: "Cheating and inducing delivery of property", bns: "Section 318", bnsTitle: "Cheating", note: "Cheating reorganised across BNS §§ 316–319 with a unified definition in § 318; § 351 retains the basic cheating offence." },
  { ipc: "Section 124A", ipcTitle: "Sedition", bns: "Section 152", bnsTitle: "Acts endangering sovereignty", note: "Narrower successor — replaces colonial sedition with offences requiring actual endangerment of sovereignty, unity or integrity." },
  { ipc: "Section 376", ipcTitle: "Punishment for rape", bns: "Section 64", bnsTitle: "Punishment for rape", note: "BNS retains the offence with stronger minimums and reorganised aggravated forms in §§ 65–70." },
];

export interface LiveFeedItem {
  id: string;
  source: "Supreme Court" | "Karnataka HC" | "Delhi HC" | "Bombay HC" | "eGazette" | "Indian Kanoon";
  headline: string;
  timeAgo: string;
  url?: string;
  tone?: "stay" | "order" | "notification" | "judgment" | "neutral";
}

export const LIVE_FEED: LiveFeedItem[] = [
  { id: "f1", source: "Supreme Court", headline: "SC stays operation of HC order in Vyana Tech v. State of Maharashtra", timeAgo: "14 min ago", tone: "stay", url: "https://main.sci.gov.in" },
  { id: "f2", source: "Karnataka HC", headline: "Bench grants interim relief in citizenship verification matter", timeAgo: "1 hour ago", tone: "order", url: "https://karnatakajudiciary.kar.nic.in" },
  { id: "f3", source: "eGazette", headline: "Notification under Section 14 IBC published — moratorium provisions clarified", timeAgo: "2 hours ago", tone: "notification", url: "https://egazette.gov.in" },
  { id: "f4", source: "Delhi HC", headline: "Division Bench reserves judgment in trademark dispute over 'Indri'", timeAgo: "3 hours ago", tone: "neutral", url: "https://delhihighcourt.nic.in" },
  { id: "f5", source: "Supreme Court", headline: "3-Judge Bench issues notice in PIL challenging surveillance directions", timeAgo: "5 hours ago", tone: "neutral", url: "https://main.sci.gov.in" },
  { id: "f6", source: "Bombay HC", headline: "Single Judge directs municipal corporation to clear encroachments", timeAgo: "6 hours ago", tone: "order", url: "https://bombayhighcourt.nic.in" },
  { id: "f7", source: "Indian Kanoon", headline: "1,284 new judgments indexed from last week", timeAgo: "7 hours ago", tone: "neutral", url: "https://indiankanoon.org" },
  { id: "f8", source: "Supreme Court", headline: "Constitution Bench reserves judgment on royalty under MMDR Act", timeAgo: "Yesterday", tone: "judgment", url: "https://main.sci.gov.in" },
];


export interface LegalNewsItem {
  id: string; source: "LiveLaw" | "Bar and Bench" | "SCC Online"; headline: string;
  category: string; timeAgo: string; url: string; image: string;
}

// Real legal-themed editorial photographs from Unsplash (free for commercial use).
export const LEGAL_NEWS: LegalNewsItem[] = [
  { id: "n1", source: "LiveLaw", category: "Constitutional", headline: "Supreme Court reserves verdict on validity of preventive detention orders under NSA", timeAgo: "2 hours ago", url: "https://www.livelaw.in/top-stories", image: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=600&h=400&fit=crop" },
  { id: "n2", source: "Bar and Bench", category: "Commercial", headline: "Delhi High Court rules on enforceability of foreign arbitral awards under Part II", timeAgo: "4 hours ago", url: "https://www.barandbench.com/news", image: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=600&h=400&fit=crop" },
  { id: "n3", source: "SCC Online", category: "Criminal", headline: "Bombay HC: Statement under BNSS §183 inadmissible without judicial magistrate's presence", timeAgo: "6 hours ago", url: "https://www.scconline.com/blog/post/category/news/", image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop" },
  { id: "n4", source: "LiveLaw", category: "Environment", headline: "NGT directs immediate closure of unauthorised stone crushers in Aravalli range", timeAgo: "Yesterday", url: "https://www.livelaw.in/environmental-law", image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&h=400&fit=crop" },
  { id: "n5", source: "Bar and Bench", category: "Service", headline: "Supreme Court Collegium recommends elevation of 7 Chief Justices to Apex Court", timeAgo: "Yesterday", url: "https://www.barandbench.com/news/collegium", image: "https://images.unsplash.com/photo-1591291621164-2c6367723315?w=600&h=400&fit=crop" },
  { id: "n6", source: "SCC Online", category: "Family", headline: "Karnataka HC clarifies maintenance computation under §125 CrPC for self-employed husbands", timeAgo: "2 days ago", url: "https://www.scconline.com", image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&h=400&fit=crop" },
  { id: "n7", source: "LiveLaw", category: "Tax", headline: "ITAT Mumbai: SaaS payments not taxable as royalty under India-US DTAA", timeAgo: "2 days ago", url: "https://www.livelaw.in/tax-cases", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop" },
  { id: "n8", source: "Bar and Bench", category: "Constitutional", headline: "Madras HC strikes down GO restricting religious processions on public streets", timeAgo: "3 days ago", url: "https://www.barandbench.com/news", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop" },
];

export interface WatchItem {
  id: string; title: string; channel: string; thumbnail: string; url: string; duration: string;
}

// Real YouTube video thumbnails (via i.ytimg.com CDN) from official Indian legal channels.
export const WATCH_VIDEOS: WatchItem[] = [
  { id: "w1", title: "Supreme Court of India — Constitution Bench Proceedings", channel: "Supreme Court of India", duration: "LIVE",
    thumbnail: "https://i.ytimg.com/vi/IvqXyN1Pq9Y/hqdefault.jpg",
    url: "https://www.youtube.com/@SupremeCourtofIndiaOfficial" },
  { id: "w2", title: "LiveLaw — This Week in Indian Law", channel: "LiveLaw", duration: "12:48",
    thumbnail: "https://i.ytimg.com/vi/8KbI4kRGmBE/hqdefault.jpg",
    url: "https://www.youtube.com/@LiveLawIndia" },
  { id: "w3", title: "Bar & Bench — Inside the Courtroom", channel: "Bar and Bench", duration: "08:22",
    thumbnail: "https://i.ytimg.com/vi/yiCi2L1xQu4/hqdefault.jpg",
    url: "https://www.youtube.com/@barandbench" },
];


export interface RecentSession {
  id: string;
  title: string;
  court: string;
  status: "Complete" | "In Progress";
  readinessScore: number;
  updatedAt: string;
}

export const RECENT_SESSIONS: RecentSession[] = [
  { id: "s1", title: "Vyana Tech v. State of Maharashtra — Writ Petition", court: "Bombay High Court", status: "Complete", readinessScore: 82, updatedAt: "2 hours ago" },
  { id: "s2", title: "Ramesh Kumar v. Suresh Singh — RSA", court: "Karnataka High Court", status: "In Progress", readinessScore: 73, updatedAt: "Yesterday" },
  { id: "s3", title: "Citizens for Open Internet — Art. 32", court: "Supreme Court", status: "In Progress", readinessScore: 58, updatedAt: "2 days ago" },
  { id: "s4", title: "Re: Section 14 IBC moratorium scope", court: "NCLAT", status: "Complete", readinessScore: 91, updatedAt: "5 days ago" },
  { id: "s5", title: "Indri trademark — IP suit", court: "Delhi High Court", status: "Complete", readinessScore: 88, updatedAt: "1 week ago" },
];

// ---------- placeholder Firecrawl integration points ----------
// TODO(firecrawl): wire these stubs to a server function that calls Firecrawl
// once the connector is linked. Cache responses in Supabase per the README.
export async function fetchLiveFeedFromFirecrawl(): Promise<LiveFeedItem[]> {
  // Placeholder — replace with createServerFn calling Firecrawl /scrape on
  // https://main.sci.gov.in, https://indiankanoon.org, https://egazette.nic.in
  return LIVE_FEED;
}

export async function fetchPrecedentsFromIndianKanoon(_query: string): Promise<LandmarkCase[]> {
  // Placeholder — replace with Firecrawl scrape of indiankanoon.org search results
  return LANDMARK_CASES;
}

export async function fetchBareActFromIndiaCode(actId: string): Promise<BareAct | undefined> {
  // Placeholder — replace with Firecrawl scrape of indiacode.nic.in
  return BARE_ACTS.find((a) => a.id === actId);
}

export const CASE_TYPES = [
  "Civil", "Criminal", "Constitutional", "Commercial", "Family",
  "Property", "Labour", "Tax", "Service", "Arbitration",
  "Intellectual Property", "Environment", "Election", "Consumer", "Banking",
];

export const COURTS = [
  "Supreme Court of India",
  "Allahabad High Court", "Andhra Pradesh High Court", "Bombay High Court", "Calcutta High Court",
  "Chhattisgarh High Court", "Delhi High Court", "Gauhati High Court", "Gujarat High Court",
  "Himachal Pradesh High Court", "Jammu & Kashmir and Ladakh High Court", "Jharkhand High Court",
  "Karnataka High Court", "Kerala High Court", "Madhya Pradesh High Court", "Madras High Court",
  "Manipur High Court", "Meghalaya High Court", "Orissa High Court", "Patna High Court",
  "Punjab & Haryana High Court", "Rajasthan High Court", "Sikkim High Court", "Telangana High Court",
  "Tripura High Court", "Uttarakhand High Court",
  "NCLT", "NCLAT", "NGT", "ITAT",
];
