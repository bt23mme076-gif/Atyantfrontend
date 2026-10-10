// Static career guides rendered to /guides/<slug> at build time by
// scripts/render-guides.js. Each guide targets one cluster of questions
// students actually ask (researched on r/developersIndia, r/Btechtards,
// r/GATEtard, r/indiafreshers and similar) and is grounded in real AnswerCards
// from Atyant seniors. Stories are anonymised: branch, college and outcome
// only, never names.

export const GUIDES_UPDATED = "2026-10-08";

export const GUIDES = [
  {
    slug: "non-cs-branch-to-data-analytics-and-consulting",
    title: "Non-CS Branch to Data Analyst or Consulting Job: Real Paths",
    description:
      "Civil, Mechanical or Metallurgy student aiming for data analytics or consulting? How seniors got into ZS Associates, IQVIA, Aspect Ratio and Swiggy without a CS degree.",
    h1: "From a non-CS branch to data analytics or consulting",
    intro:
      "Yes, you can get a data analyst or consulting job from Civil, Mechanical, Metallurgy or Electrical. Atyant seniors did it at ZS Associates, IQVIA, Aspect Ratio and Swiggy. They had three things in common. They learned Python and SQL first instead of every tool at once. They built two or three data projects they could explain end to end. And they applied off-campus through alumni and referrals instead of waiting for campus drives that mostly listed core roles.",
    sections: [
      {
        h2: "Can a Mechanical or Civil student become a data analyst?",
        paras: [
          "Yes. Analyst roles at analytics and consulting firms test problem solving, SQL, Python or Excel, and how clearly you explain an analysis. Your branch matters much less than proof that you can do the work. Five of the seniors below came from Civil, Mechanical or Chemistry and now work in analytics or consulting.",
          "One Mechanical senior said the hardest part was the noise: everyone kept saying data jobs were only for CS graduates. What changed things was a structured learning path and a portfolio, not a different degree. Forum threads also suggest the market is tighter than it was a few years ago, so treat projects and referrals as essential, not optional.",
        ],
      },
      {
        h2: "What to learn, and in what order",
        paras: [
          "The seniors who moved fastest learned in a fixed order and did not start the next tool until they had used the last one on a real dataset.",
        ],
        list: [
          "Excel: pivot tables, lookups and basic charts. One Metallurgy senior said they wished they had started here in second year.",
          "SQL basics: joins, group by, window functions. One senior took two weeks for the basics.",
          "Python for data analysis with pandas. The same senior did a four-week course before touching SQL.",
          "One visualisation tool, such as Power BI or Tableau, to present results.",
          "Then two end-to-end projects before learning anything else.",
        ],
      },
      {
        h2: "Projects that make a non-CS profile credible",
        paras: [
          "Use your branch as an advantage. A Mechanical senior who joined ZS recommends two end-to-end mini-projects, such as a sales-data analysis or a predictive-maintenance model, plus quantified results from your branch projects on the resume. A Civil senior recommends posting small Kaggle analyses on GitHub to show steady progress.",
          "Package every project the same way: the problem, your approach, the tools you used and the result. One senior recommends a one-page portfolio PDF in that format next to your GitHub links, so a recruiter can understand the work in a minute.",
        ],
      },
      {
        h2: "How to get the interview: off-campus, alumni and referrals",
        paras: [
          "Campus drives for non-CS branches often list only core roles, and one senior's biggest mistake was applying only on campus. The seniors who got analytics offers reached out to alumni from their college working at ZS, IQVIA or similar firms, asked for short informational chats, and only then asked for referrals.",
          "Cold emails work too. A Metallurgy senior emailed professors directly and landed an internship at IIM Bangalore within four months of starting to explore non-core fields, with no prior machine learning or business analysis background.",
        ],
      },
      {
        h2: "Consulting and management internships from an engineering branch",
        paras: [
          "An Electrical senior from VNIT Nagpur got a management internship at IIM Mumbai in second year with no management background. They learned marketing basics from free NPTEL lectures, built small tech projects tied to real problems, and practised interviews with seniors and professors.",
          "A Civil graduate worked on a large infrastructure project, joined Deloitte in infrastructure consulting, and later got an IIM Ahmedabad call. A Chemistry student from IIT Bombay moved into analytics consulting at Aspect Ratio through analytics internships and by framing their science background as problem-solving experience.",
        ],
      },
      {
        h2: "How long the switch takes",
        list: [
          "About 8 months from a first coding course to joining ZS Associates (Mechanical, final year).",
          "8 months of self-study while working in structural engineering, then an AI/ML analyst role at ZS (Civil).",
          "About 2 years after college to Associate Consultant at IQVIA (Civil).",
          "4 months from starting to explore non-core fields to an IIM Bangalore internship (Metallurgy).",
        ],
      },
      {
        h2: "Mistakes these seniors say to avoid",
        list: [
          "Learning every data tool at once instead of Python and SQL first.",
          "Taking theory-heavy courses without applying them to a project.",
          "Using a generic resume without quantified outcomes.",
          "Waiting until final year to network with people in data and consulting.",
          "Starting Python and SQL late. One Civil senior wished they had started in first year.",
        ],
      },
    ],
    stories: [
      {
        from: "Mechanical, VNIT Nagpur",
        to: "Data Analytics, ZS Associates",
        when: "About 8 months, final year",
        did: "Went Python, then SQL, then one real project, and asked VNIT alumni on LinkedIn for referrals to off-campus roles.",
        regret: "Spent weeks trying every data-science tool at once and applied only to on-campus drives at first.",
      },
      {
        from: "Civil, VNIT Nagpur",
        to: "Data Analyst, ZS Associates",
        when: "Final year",
        did: "Built SQL, Python and Power BI projects and took internships in data and consulting.",
        regret: "Focused on theory instead of real-world data projects and networked late.",
      },
      {
        from: "Civil, VNIT Nagpur",
        to: "Associate Consultant, IQVIA",
        when: "2 years after college",
        did: "Learned Python and SQL from scratch and posted small Kaggle analyses on GitHub.",
        regret: "Did not start Python and SQL in first year.",
      },
      {
        from: "Civil, VNIT Nagpur (working in structural design)",
        to: "AI/ML analyst, ZS Associates",
        when: "8 months while working",
        did: "Self-taught Python and SQL, took ML courses built around business problems, then applied through referrals.",
        regret: "Took too many theory courses before building a portfolio.",
      },
      {
        from: "Chemistry, IIT Bombay",
        to: "Analytics and consulting, Aspect Ratio",
        when: "Final year",
        did: "Did analytics internships and projects and presented transferable problem-solving skills in interviews.",
        regret: "Assumed a chemistry background was a barrier and started SQL and Python late.",
      },
      {
        from: "Metallurgy, VNIT Nagpur",
        to: "Consulting and tech internships, now at Swiggy",
        when: "Final year",
        did: "Learned Excel and pandas, built small growth and product-thinking projects, and applied off-campus.",
        regret: "Did not use LinkedIn well early on.",
      },
      {
        from: "Electrical, VNIT Nagpur",
        to: "Management intern, IIM Mumbai",
        when: "Second year",
        did: "Learned management basics from NPTEL, built branch-related tech projects and did mock interviews with seniors.",
        regret: "Started case and communication practice late.",
      },
    ],
    faqs: [
      {
        q: "Do analytics and consulting firms hire Civil or Mechanical graduates?",
        a: "Yes. Atyant seniors from Civil and Mechanical were hired as analysts and consultants at ZS Associates and IQVIA. They showed Python, SQL and a few explainable projects, and most came in through off-campus applications and referrals.",
      },
      {
        q: "Do I need a master's in data science to switch from a non-CS branch?",
        a: "Not necessarily. Some forum advice recommends a full-time analytics degree in a tight market, but the seniors here switched with self-study, projects, internships and referrals, either in final year or within two years of graduating.",
      },
      {
        q: "Should I learn Python or SQL first for a data analyst role?",
        a: "Learn both early. One senior did a four-week Python-for-data-analysis course, then two weeks of SQL basics, then built two end-to-end projects before adding any other tool.",
      },
      {
        q: "When should a non-CS student start preparing for analytics roles?",
        a: "By second year if you can. Almost every senior here said they wished they had started Excel, Python and SQL one or two years earlier than they did.",
      },
    ],
    related: ["core-branch-jobs-and-psu-placements", "how-to-get-off-campus-internship", "gate-vs-placement-vs-mba"],
  },

  {
    slug: "core-branch-jobs-and-psu-placements",
    title: "Core Jobs After B.Tech: How Seniors Got PSU and Core Offers",
    description:
      "Civil, Mechanical, Electrical or Metallurgy and want a core job? How seniors got HPCL, JSW Steel, Maruti Suzuki, MNGL and AM/NS offers, and what they would change.",
    h1: "Getting a core job from Civil, Mechanical, Electrical or Metallurgy",
    intro:
      "Core placements need different preparation from software roles. You need strong fundamentals in three or four branch subjects, at least one hands-on core project or internship, research on each company's process, and communication good enough for group tasks and interviews. Atyant seniors got HPCL, JSW Steel, JSL, Maruti Suzuki, MNGL and AM/NS this way. Several say their biggest mistake was spending months on generic coding prep for roles that did not fit their branch.",
    sections: [
      {
        h2: "Core or IT: how to decide",
        paras: [
          "This is one of the most common questions from ECE, Electrical and Mechanical students. The seniors' advice is to decide first and then commit. An Electrical senior who joined JSL said the time spent on generic coding prep was wasted: decide whether you want coding or core work, then move ahead with one thing until you get it.",
          "A Metallurgy senior who joined JSW Steel said the same: they lost time trying to fit into CS roles instead of mastering core subjects. Choosing core does not mean ignoring tech. An Electrical senior added a reinforcement-learning project in Python, which made their core resume stand out at Maruti Suzuki.",
        ],
      },
      {
        h2: "Which subjects and tools core companies test",
        list: [
          "Electrical: Power Systems, Control Systems and Electrical Machines. Tools: MATLAB and PLC.",
          "Metallurgy: Material Science and Thermodynamics, plus questions specific to the company's process.",
          "Civil: core concepts such as construction materials and project management.",
          "ECE: Digital Electronics, VLSI and Analog Circuits.",
          "Materials or semiconductors: tools such as TCAD and Synopsys Sentaurus.",
        ],
      },
      {
        h2: "PSU and government-company placements",
        paras: [
          "A Civil senior from VNIT Nagpur got a Project Engineer role at HPCL through campus placements. HPCL's process included a group task and an interview. They prepared for both rounds, learned the basics of how the oil and gas sector works, worked on technical communication, and asked seniors who had been through it what they were asked.",
          "A Mechanical senior prepared for a management exam in seventh semester and skipped interviews. When the exam did not work out, they joined campus placements in January of eighth semester and got an Assistant Manager role at MNGL, a GAIL and BPCL joint venture. Their advice: keep campus placements open as a backup and keep your CGPA steady, in their experience between 7.5 and 8.5.",
          "Many PSUs also recruit through GATE scores. Check each PSU's notification for the papers and cutoffs it uses.",
        ],
      },
      {
        h2: "Internships that help core placements",
        paras: [
          "An Electrical senior did a summer internship at PowerGrid, and it was central to their Graduate Engineer Trainee offer at JSW Motors. An ECE senior used an IBM internship to build technical credibility, which led to DRDO offers. Others did research internships at IITs and abroad, and a Materials senior joined the Samsung semiconductor fellowship in third year.",
          "Several seniors said the right time to start applying is the summer after second year, not final year.",
        ],
      },
      {
        h2: "Interviews and group tasks",
        paras: [
          "Core interviews test whether you can explain fundamentals clearly. The HPCL senior's regret was not taking mock interviews seriously in earlier semesters and not researching companies until just before placements. A Civil senior from IIEST Shibpur said leadership roles in clubs built the communication and team skills that core employers valued in interviews.",
        ],
      },
      {
        h2: "If your core fundamentals feel weak",
        paras: [
          "A Metallurgy senior from NIT Raipur started with limited core knowledge and still joined AM/NS India. They picked a company with a strong training culture, took initiative on small projects, and asked seniors for feedback. Their regret was not building a foundation and a professional network before starting.",
        ],
      },
    ],
    stories: [
      {
        from: "Civil, VNIT Nagpur",
        to: "Project Engineer, HPCL",
        when: "Final year, campus placement",
        did: "Researched HPCL's group task and interview, revised core civil concepts and asked seniors about their rounds.",
        regret: "Would start in fifth or sixth semester with more mock interviews.",
      },
      {
        from: "Metallurgy, VNIT Nagpur",
        to: "Core role, JSW Steel",
        when: "Final year, no prior internships",
        did: "Focused on Material Science and Thermodynamics, practised core interview questions and asked alumni what JSW looks for.",
        regret: "Spent time learning programming for CS roles that did not fit.",
      },
      {
        from: "Electrical, VNIT Nagpur",
        to: "Core role, JSL",
        when: "Final year",
        did: "Focused on Power Systems, Control Systems and Machines. Recommends MATLAB and PLC projects.",
        regret: "Did generic coding prep before deciding on core.",
      },
      {
        from: "Electrical, VNIT Nagpur",
        to: "GATE qualified and Maruti Suzuki",
        when: "Through college, GATE prep from third year",
        did: "Set one or two goals per semester, did a core project and added a reinforcement-learning project.",
        regret: "Jumped between DSA, AI and GATE at the same time.",
      },
      {
        from: "Mechanical, VNIT Nagpur",
        to: "Assistant Manager, MNGL (GAIL and BPCL JV)",
        when: "Eighth semester",
        did: "Kept CGPA steady and joined campus placements after a management exam did not work out.",
        regret: "Did not talk to seniors or people at target companies early.",
      },
      {
        from: "Electrical, VNIT Nagpur",
        to: "Graduate Engineer Trainee, JSW Motors",
        when: "Final year",
        did: "Built a resume around a PowerGrid internship and a leadership role in the college fest.",
        regret: "Networked late and did not tailor applications.",
      },
      {
        from: "Metallurgy, NIT Raipur",
        to: "AM/NS India",
        when: "Right after college",
        did: "Chose a company with a strong training culture and learned on the job.",
        regret: "Did not build a strong core foundation first.",
      },
    ],
    faqs: [
      {
        q: "Can I get a core job without any internship?",
        a: "Yes. A Metallurgy senior from VNIT Nagpur joined JSW Steel with no prior internships by mastering core subjects, practising core interview questions and asking alumni what the company looks for.",
      },
      {
        q: "When should I start preparing for core placements?",
        a: "Seniors recommend the summer after second year for internships and projects, and fifth or sixth semester at the latest for company research and mock interviews.",
      },
      {
        q: "Does CGPA matter for core companies and PSUs?",
        a: "Yes. Many core companies and PSUs set CGPA cutoffs. One senior who joined MNGL recommends keeping it between 7.5 and 8.5, even while preparing for other exams.",
      },
      {
        q: "Should a core-branch student also learn coding?",
        a: "One focused tech skill can help, such as a Python project tied to your branch. Several seniors say spreading across DSA, AI and core at once cost them time.",
      },
    ],
    related: ["gate-vs-placement-vs-mba", "non-cs-branch-to-data-analytics-and-consulting", "dsa-vs-development-what-to-focus-on"],
  },

  {
    slug: "how-to-get-off-campus-internship",
    title: "How to Get an Off-Campus Internship: What Seniors Actually Did",
    description:
      "Applied to 100+ internships with no reply? How seniors from colleges like yours got off-campus internships through portfolios, cold emails, referrals and follow-ups.",
    h1: "How to get an off-campus internship when campus placements don't help",
    intro:
      "Mass-applying rarely works. Students on r/developersIndia and r/indiafreshers describe hundreds of applications with no callbacks. Atyant seniors who got off-campus internships did three things instead. They built a small portfolio of real projects on GitHub. They targeted startups and smaller firms where they would be noticed. And they reached people directly through cold emails, LinkedIn and referrals, then followed up.",
    sections: [
      {
        h2: "Why 100+ applications get no replies",
        paras: [
          "Easy Apply puts you in a pile with thousands of other resumes, and recruiters often filter by college name first. Without a project link or a referral, nothing in that pile shows what you can actually do. Every senior below got in by giving someone a concrete reason to look: a project, a portfolio or a personal message.",
        ],
      },
      {
        h2: "Build proof first: projects and GitHub",
        paras: [
          "An IT senior from NIT Srinagar built three or four web-development projects with the tools the role asked for, and said the GitHub and portfolio links were what made them stand out. A VNIT senior said even incomplete projects on GitHub help, because they show how you learn and solve problems.",
          "Depth beats breadth. An ECE senior went deep into one niche, DevOps and then agentic AI, rather than following every trend, and opportunities started coming from mentors and companies by fourth year.",
        ],
      },
      {
        h2: "Where to apply: startups and smaller firms",
        paras: [
          "The NIT Srinagar senior targeted startups and small firms, where interns get more hands-on work and more visibility. They applied in May, interviewed in June and started in July. Many startups judge skills over college name because they need people who can contribute quickly.",
        ],
      },
      {
        h2: "Cold emails and follow-ups that get answered",
        list: [
          "Write to a person, not a careers inbox: a founder, an engineer on the team or a professor in your field.",
          "Say who you are in one line, link one relevant project, and make one specific ask.",
          "Follow up politely if you have not heard back in a week. The NIT Srinagar senior said not following up was one of their early mistakes.",
          "A Metallurgy senior got an IIM Bangalore internship by cold-emailing professors. A third-year VNIT senior landed an off-campus internship while building two startups, and lists cold-emailing startups among their top recommendations.",
        ],
      },
      {
        h2: "Skills beyond coding that tipped it",
        paras: [
          "A CSE senior from REC Kannauj started organising college events alongside daily coding. They said it changed their communication and confidence, and that combination is what helped them stand out in off-campus interviews.",
        ],
      },
      {
        h2: "When to start",
        paras: [
          "Second year. The most common regret across these stories is waiting until final year to apply, build a portfolio or network. A VNIT CSE senior who did not get a big company on campus still got a FAANG internship off-campus, but said they would have started on GitHub and internships in second year.",
        ],
      },
    ],
    stories: [
      {
        from: "CSE, REC Kannauj",
        to: "Off-campus internship",
        when: "Over about a year",
        did: "Coded daily, built small projects and organised college events to build communication skills.",
        regret: "Did not network or look beyond coding early enough.",
      },
      {
        from: "IT, NIT Srinagar",
        to: "Web development intern at a startup",
        when: "Applied in May, started in July",
        did: "Built three or four relevant projects, tailored the resume and targeted startups.",
        regret: "Did not prepare the portfolio earlier or follow up after applying.",
      },
      {
        from: "CSE, VNIT Nagpur",
        to: "FAANG off-campus internship",
        when: "Final year, after missing campus offers",
        did: "Built a public GitHub portfolio, did coding contests regularly and grew a LinkedIn network.",
        regret: "Waited until final year to focus on internships.",
      },
      {
        from: "Engineering, VNIT Nagpur",
        to: "Off-campus startup internship in third year",
        when: "Third year",
        did: "Built an AI project around a real problem, kept GitHub updated and cold-emailed startups.",
        regret: "Juggled too many things at once and burned out.",
      },
      {
        from: "ECE, VNIT Nagpur",
        to: "DevOps and AI opportunities",
        when: "From second to fourth year",
        did: "Picked one niche, built hands-on projects and joined online communities in that niche.",
        regret: "Tried to learn too many things before choosing a focus.",
      },
      {
        from: "Metallurgy, VNIT Nagpur",
        to: "Intern, IIM Bangalore",
        when: "4 months",
        did: "Cold-emailed professors with specific asks and built projects in two or three chosen areas.",
        regret: "Did not plan time well at the start.",
      },
    ],
    faqs: [
      {
        q: "How do I get an off-campus internship with no referrals?",
        a: "Build two to four projects relevant to the role, put them on GitHub, apply to startups and smaller firms, and message founders or engineers directly with one project link and a clear ask. A CSE senior from REC Kannauj did this alongside college events and got an off-campus internship.",
      },
      {
        q: "How many projects do I need for an internship?",
        a: "Seniors here had two to four solid projects they could explain end to end. Projects matched to the role mattered more than the number.",
      },
      {
        q: "Should I follow up after applying for an internship?",
        a: "Yes, once and politely after about a week. One NIT senior listed not following up as an early mistake.",
      },
      {
        q: "Which year should I start applying for internships?",
        a: "Second year. Most seniors said waiting until final year was their biggest regret.",
      },
    ],
    related: ["dsa-vs-development-what-to-focus-on", "faang-sde-from-non-iit-college", "non-cs-branch-to-data-analytics-and-consulting"],
  },

  {
    slug: "faang-sde-from-non-iit-college",
    title: "Cracking Amazon or Google SDE from a Non-IIT College",
    description:
      "How seniors from VNIT Nagpur, including one from Chemical Engineering, landed Amazon and Google roles: DSA routine, system design timing, mock interviews and off-campus applications.",
    h1: "Getting an SDE role at Amazon or Google from a non-IIT college",
    intro:
      "Seniors from VNIT Nagpur, including one from Chemical Engineering, reached Amazon and Google with a consistent daily DSA routine, mock interviews with seniors and real projects. Their most repeated regret was starting system design too late.",
    sections: [
      {
        h2: "A DSA routine that actually worked",
        list: [
          "Pick one resource, such as LeetCode or GFG, and solve daily. Do not try to cover every topic.",
          "Build the foundation in arrays, linked lists, trees and graphs before moving on.",
          "One senior solved about 300 LeetCode problems grouped by pattern, going from easy to medium to hard.",
          "Keep a list of solved problems and review it weekly to find weak areas.",
          "Practise under time pressure. Knowing the theory is not the same as solving in an interview.",
        ],
      },
      {
        h2: "When to start system design",
        paras: [
          "Earlier than you think. Three of the five seniors below said they started system design too late. A senior who interned at Google said they would study system design alongside DSA from the start. Another recommends Grokking the System Design Interview and practising designs of real systems such as Twitter or Uber.",
        ],
      },
      {
        h2: "Mock interviews and explaining your thinking",
        paras: [
          "Several seniors underestimated communication. They fixed it with whiteboard practice and mock interviews with seniors and peers, explaining their thought process out loud. A Chemical senior spent the last three of six months of preparation mostly on mock interviews and revision.",
        ],
      },
      {
        h2: "Projects that support the application",
        paras: [
          "The Google intern built full-stack projects with React, Node.js and MongoDB. Another senior contributed to open-source projects on GitHub, which gave them visibility and real-world code experience to talk about in interviews.",
        ],
      },
      {
        h2: "If campus placements do not work out",
        paras: [
          "A VNIT CSE senior did not get any big company on campus. They rebuilt their profile with a public GitHub portfolio, regular coding contests and a stronger LinkedIn presence, and landed a FAANG internship off-campus.",
        ],
      },
      {
        h2: "Can a non-CS student get an SDE role?",
        paras: [
          "Yes. A Chemical Engineering senior from VNIT Nagpur joined Amazon in Bengaluru after about six months of preparation. They started with Python and data-structure basics, solved two or three problems a day on LeetCode and HackerRank, then spent the last three months on mock interviews and revisiting hard problems.",
        ],
      },
    ],
    stories: [
      {
        from: "CSE, VNIT Nagpur",
        to: "SDE, Amazon",
        when: "Final year",
        did: "Kept a daily DSA routine for months and practised whiteboard coding with seniors.",
        regret: "Tried to cover every topic instead of mastering the commonly asked ones.",
      },
      {
        from: "CSE, VNIT Nagpur",
        to: "SDE, Amazon",
        when: "14 months of preparation",
        did: "Solved about 300 LeetCode problems by pattern, studied system design and contributed to open source.",
        regret: "Started system design late and tried to learn everything at once.",
      },
      {
        from: "CSE, VNIT Nagpur",
        to: "Software Engineer Intern, Google",
        when: "Serious prep from second year",
        did: "Built DSA depth and full-stack projects, entered coding contests and did mock interviews.",
        regret: "Did not focus on system design or interview communication early.",
      },
      {
        from: "CSE, VNIT Nagpur",
        to: "FAANG off-campus internship",
        when: "Final year",
        did: "Built a public GitHub portfolio and did LeetCode and Codeforces contests regularly.",
        regret: "Did not start internship prep in second year.",
      },
      {
        from: "Chemical, VNIT Nagpur",
        to: "Amazon, Bengaluru",
        when: "About 6 months",
        did: "Learned Python and DSA basics, solved two or three problems daily and did mock interviews.",
        regret: "Did not practise enough under time limits or study company-specific patterns early.",
      },
    ],
    faqs: [
      {
        q: "Can I get into Amazon or Google from an NIT?",
        a: "Yes. Several VNIT Nagpur seniors on Atyant joined Amazon or interned at Google, including one who got their FAANG internship off-campus after not getting a big company on campus.",
      },
      {
        q: "How many LeetCode problems should I solve for FAANG?",
        a: "One senior who joined Amazon solved about 300, grouped by pattern and moving from easy to hard. The seniors stress patterns and consistency over a raw count.",
      },
      {
        q: "When should I start system design preparation?",
        a: "Alongside DSA, well before final year. Starting system design late was the most common regret among these seniors.",
      },
      {
        q: "Can a non-CS student crack an SDE interview at Amazon?",
        a: "Yes. A Chemical Engineering senior from VNIT Nagpur joined Amazon after about six months of Python, daily DSA practice and mock interviews.",
      },
    ],
    related: ["dsa-vs-development-what-to-focus-on", "how-to-get-off-campus-internship", "gate-vs-placement-vs-mba"],
  },

  {
    slug: "gate-vs-placement-vs-mba",
    title: "GATE vs Placement vs MBA: How Seniors Decided in 3rd Year",
    description:
      "Torn between GATE, campus placements, CAT and MBA or M.Tech? Real decisions from seniors who took each route, what they would change and how they kept a backup open.",
    h1: "GATE, placement or MBA: deciding in third year",
    intro:
      "You do not have to bet everything on one exam. The Atyant seniors who did best kept campus placements open as a backup while preparing for GATE or a management exam. They also started GATE preparation in third year, not in the last semester.",
    sections: [
      {
        h2: "What each route gives you",
        list: [
          "Campus placement: you start earning right after graduation.",
          "GATE: admission to M.Tech at IITs and NITs, and a route into PSUs that recruit through GATE scores.",
          "CAT and MBA: a move into management, consulting or general business roles.",
          "M.Tech or MS for research: the better fit if you are drawn to research or a PhD.",
        ],
      },
      {
        h2: "Can you prepare for GATE and placements together?",
        paras: [
          "Yes, if you plan it. An Electrical senior from VNIT Nagpur qualified GATE and joined Maruti Suzuki through placements. In an r/GATEtard thread, the top reply to a confused fifth-semester student said the same: GATE preparation also helps with placements, so do not skip them.",
          "The caveat comes from the same senior. They regretted jumping between DSA, AI and GATE at once. Set one or two goals per semester instead.",
        ],
      },
      {
        h2: "When to start GATE preparation",
        paras: [
          "Third year. An ECE senior who reached IIT Kharagpur for VLSI said their biggest mistake was waiting until the last semester. They picked one test series, followed a daily plan and focused on Digital Electronics, VLSI and Analog Circuits.",
        ],
      },
      {
        h2: "Where GATE led these seniors",
        paras: [
          "The ECE senior went from VNIT Nagpur to an M.Tech in VLSI at IIT Kharagpur. An IBM internship there built technical credibility and led to DRDO offers. A Biotechnology student combined undergraduate research internships with competitive exams, joined an M.Tech at NIT Karnataka, and got a pre-placement offer from Enzene Biosciences in the second semester.",
        ],
      },
      {
        h2: "The management route: CAT and MBA",
        paras: [
          "A Mechanical senior spent seventh semester on management-exam preparation and skipped placement interviews. When the exam did not work out, they joined placements in eighth semester and got a role at MNGL. Their lesson: keep a backup open and keep your CGPA steady while you prepare.",
          "A Civil graduate built work experience on an infrastructure project and at Deloitte before getting an IIM Ahmedabad call. They said they should have started CAT preparation earlier and been more structured about it.",
        ],
      },
      {
        h2: "Questions that settle the decision",
        list: [
          "Do you want research or a PhD? Lean towards M.Tech or MS.",
          "Do you need to earn soon? Take placements seriously, even if you are preparing for an exam.",
          "Do you enjoy your core subjects? GATE and PSUs build on them.",
          "Do you want management or consulting? Work experience first helped the senior who got an IIM call.",
        ],
      },
    ],
    stories: [
      {
        from: "ECE, VNIT Nagpur",
        to: "M.Tech VLSI at IIT Kharagpur, IBM internship, DRDO offers",
        when: "Final year to first year of M.Tech",
        did: "Followed a GATE test series and daily plan and built VLSI and embedded projects.",
        regret: "Started GATE preparation in the last semester.",
      },
      {
        from: "Electrical, VNIT Nagpur",
        to: "GATE qualified and Maruti Suzuki",
        when: "Final year",
        did: "Prioritised GATE early on a strict schedule and did core electrical projects.",
        regret: "Tried DSA, AI and GATE all at once.",
      },
      {
        from: "Biotechnology",
        to: "M.Tech at NIT Karnataka, PPO at Enzene Biosciences",
        when: "Internships from first year",
        did: "Did research internships, prepared for GATE and IIT-JAM, and built industry skills.",
        regret: "Would have learned lab tools like HPLC and FTIR earlier.",
      },
      {
        from: "Mechanical, VNIT Nagpur",
        to: "MNGL after a management-exam attempt",
        when: "About one year",
        did: "Fell back on campus placements in eighth semester.",
        regret: "Did not keep placements open from the start.",
      },
      {
        from: "Civil, RGPV Bhopal",
        to: "Deloitte, then an IIM Ahmedabad call",
        when: "After graduation",
        did: "Built infrastructure and consulting experience before applying.",
        regret: "Started CAT preparation late.",
      },
    ],
    faqs: [
      {
        q: "Should I prepare for GATE or sit for placements?",
        a: "You can do both. An Electrical senior qualified GATE and joined Maruti Suzuki through placements. Plan one or two goals per semester so you do not spread yourself thin.",
      },
      {
        q: "When should I start GATE preparation?",
        a: "Third year. A senior who reached IIT Kharagpur for VLSI said waiting until the last semester was their biggest mistake.",
      },
      {
        q: "Is it risky to skip placements for CAT?",
        a: "It can be. A Mechanical senior who skipped interviews for a management exam had to fall back on placements in eighth semester. Keep placements open and your CGPA steady.",
      },
      {
        q: "Is M.Tech worth it after B.Tech?",
        a: "For these seniors it was. One went from an M.Tech at IIT Kharagpur to DRDO offers, and another got a pre-placement offer during an M.Tech at NIT Karnataka. It suits you best if you enjoy your core subjects or research.",
      },
    ],
    related: ["core-branch-jobs-and-psu-placements", "non-cs-branch-to-data-analytics-and-consulting", "dsa-vs-development-what-to-focus-on"],
  },

  {
    slug: "dsa-vs-development-what-to-focus-on",
    title: "DSA vs Development vs AI: What to Focus On First",
    description:
      "Trying DSA, web dev, AI and GATE at once? Seniors who landed Amazon, Google and AI roles explain why they picked one focus at a time, and in what order.",
    h1: "DSA, development, AI or everything? Pick one focus at a time",
    intro:
      "The most repeated mistake across Atyant seniors' stories is trying to learn everything at once. The seniors who got results picked one focus per semester, built projects in it, and only then added the next skill.",
    sections: [
      {
        h2: "Why doing everything at once backfires",
        paras: [
          "An Electrical senior jumped between DSA, web development, reinforcement learning and GATE, and said the confusion cost them depth. A third-year VNIT student ran a startup, AI projects and coursework together and burned out. An ECE senior said trying many things before choosing a focus slowed them down. All three reached good outcomes once they narrowed down.",
        ],
      },
      {
        h2: "DSA or development first?",
        paras: [
          "It depends on your target. For product-company SDE roles, the seniors who reached Amazon and Google built a DSA foundation first and added projects and system design next. For startup internships, a portfolio of real projects did more. The NIT Srinagar senior got a startup internship on the strength of three or four projects.",
          "You eventually need both. DSA gets you through interviews, and projects give you something to talk about in them.",
        ],
      },
      {
        h2: "Where AI and niche skills fit",
        paras: [
          "Two ECE seniors from VNIT Nagpur built careers around a niche. One went deep into DevOps and then agentic AI infrastructure. The other moved from embedded systems into software and AI and now leads AI engineering at a startup. Both warn against chasing every AI trend and collecting certificates instead of building.",
          "Their sequence: Python, SQL, DSA, statistics and ML fundamentals first, then two or three end-to-end projects you can build, deploy and explain, then research or industry roles to turn the work into proof.",
        ],
      },
      {
        h2: "A semester-by-semester way to focus",
        list: [
          "Set one or two goals per semester, such as DSA plus one project, or GATE plus a core project.",
          "Finish one end-to-end project before starting the next skill.",
          "Track progress weekly: problems solved, features shipped, topics revised.",
          "Review every semester whether your focus still matches your target role.",
        ],
      },
    ],
    stories: [
      {
        from: "Electrical, VNIT Nagpur",
        to: "GATE qualified and Maruti Suzuki",
        when: "Final year",
        did: "Settled on GATE plus core projects, with one AI project as a differentiator.",
        regret: "Jumped between DSA, AI and GATE at the same time.",
      },
      {
        from: "ECE, VNIT Nagpur",
        to: "DevOps and AI opportunities",
        when: "From second to fourth year",
        did: "Mastered one niche, built hands-on projects and joined communities in that niche.",
        regret: "Spread across too many things before choosing.",
      },
      {
        from: "ECE, VNIT Nagpur",
        to: "AI engineer at a startup",
        when: "Through college and after",
        did: "Built fundamentals, then real systems, then publications and hackathon wins as proof.",
        regret: "Chased AI trends and collected certificates early on.",
      },
      {
        from: "CSE, VNIT Nagpur",
        to: "SDE, Amazon",
        when: "Final year",
        did: "Mastered the commonly asked DSA topics with a daily routine.",
        regret: "Tried to cover every topic at first.",
      },
      {
        from: "Engineering, VNIT Nagpur",
        to: "Off-campus startup internship",
        when: "Third year",
        did: "Built one core AI project and a GitHub profile, then cold-emailed startups.",
        regret: "Ran too many projects at once and burned out.",
      },
    ],
    faqs: [
      {
        q: "Should I do DSA or development first?",
        a: "For product-company SDE roles, start with a DSA foundation and add projects. For startup internships, lead with projects. You will need both, but focus on one at a time.",
      },
      {
        q: "Is it okay to learn AI alongside DSA in second year?",
        a: "Only if you keep it to one focused project. Seniors who went deep on one niche did well, and those who chased every trend regretted it.",
      },
      {
        q: "How do I stop feeling overwhelmed by too many options?",
        a: "Set one or two goals per semester, finish a project before starting the next skill, and track progress weekly. That is how these seniors broke out of the overwhelm.",
      },
    ],
    related: ["faang-sde-from-non-iit-college", "how-to-get-off-campus-internship", "gate-vs-placement-vs-mba"],
  },
];
