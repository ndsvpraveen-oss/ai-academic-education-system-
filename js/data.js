/**
 * ACADEMIQ OS: PRE-SEEDED ACADEMIC DATA
 * Realistic, university-grade datasets for instant out-of-the-box execution.
 */

window.ACADEMIQ_INITIAL_DATA = {
  profile: {
    fullName: "Alex Vance",
    institution: "Stanford University / MIT EECS",
    major: "Computer Science & Cognitive Neurobiology",
    targetGpa: 3.92,
    currentGpa: 3.84,
    weekdayAvailableHours: 4.5,
    weekendAvailableHours: 7.0,
    preferredSessionMins: 25,
    bufferPercentage: 20
  },

  courses: [
    {
      id: "course-cs410",
      code: "CS-410",
      name: "Advanced Distributed Systems",
      instructor: "Prof. Martin Kleppmann",
      instructorEmail: "kleppmann@cs.univ.edu",
      officeHours: "Tue/Thu 2:00 PM - 4:00 PM (Gates 382)",
      color: "#8b5cf6",
      term: "Fall 2026",
      currentGrade: 93.5,
      gradeWeights: [
        { categoryName: "Distributed KV Capstone Project", weightPercentage: 35.0 },
        { categoryName: "Midterm Exam", weightPercentage: 25.0 },
        { categoryName: "Problem Sets (Raft/Paxos)", weightPercentage: 25.0 },
        { categoryName: "Lab Checkpoints", weightPercentage: 15.0 }
      ],
      syllabusText: `COURSE SYLLABUS: CS-410 Advanced Distributed Systems (Fall 2026)
Instructor: Prof. Martin Kleppmann (kleppmann@cs.univ.edu)
Office Hours: Tue/Thu 14:00-16:00, Gates Hall 382

COURSE OVERVIEW:
Theoretical foundations and practical engineering of modern cloud infrastructure, consensus protocols (Paxos, Raft), Byzantine Fault Tolerance, peer-to-peer systems, and distributed storage engines.

GRADING POLICIES & WEIGHT DISTRIBUTION:
- Distributed Key-Value Store Capstone: 35% (Broken into 3 major checkpoints)
- Midterm Architecture Exam: 25% (In-class closed-book exam on Nov 3)
- Problem Sets (Raft & Paxos proofs): 25% (5 assignments, lowest dropped)
- Weekly Lab Checkpoints: 15% (Strict peer-code review rubric)

LATE SUBMISSION PENALTY:
10% deducted for each 24-hour increment past deadline. Submissions past 72 hours receive a grade of 0.

REQUIRED DELIVERABLES:
1. Pset 1: Raft Consensus Protocol Simulation (Due Oct 2, 23:59)
2. Capstone Checkpoint 1: RPC Wire Protocol & Storage Engine (Due Oct 12, 23:59)
3. Midterm Architecture Exam (Nov 3, In-class)
4. Capstone Checkpoint 2: Replicated State Machine (Nov 24, 23:59)
5. Final Distributed KV Engine Demo & Benchmark (Dec 12, 17:00)`
    },
    {
      id: "course-bio302",
      code: "BIO-302",
      name: "Cognitive Neurobiology & Synapses",
      instructor: "Dr. Catherine Dulac",
      instructorEmail: "dulac@bio.univ.edu",
      officeHours: "Wed 10:00 AM - 12:00 PM",
      color: "#06b6d4",
      term: "Fall 2026",
      currentGrade: 88.0,
      gradeWeights: [
        { categoryName: "Cumulative Final Exam", weightPercentage: 30.0 },
        { categoryName: "Midterm Exam", weightPercentage: 25.0 },
        { categoryName: "Independent Research Term Paper", weightPercentage: 25.0 },
        { categoryName: "Electrophysiology Lab Reports", weightPercentage: 20.0 }
      ],
      syllabusText: `COURSE SYLLABUS: BIO-302 Cognitive Neurobiology (Fall 2026)
Instructor: Dr. Catherine Dulac (dulac@bio.univ.edu)
Office Hours: Wed 10:00-12:00, BioLabs 412

COURSE DESCRIPTION:
Molecular and cellular analysis of neural circuits, long-term potentiation (LTP), dendritic spine dynamics, and cortical computation.

EVALUATION CRITERIA:
- Cumulative Final Exam: 30%
- Midterm Examination: 25%
- Independent Research Term Paper (12-15 pages): 25%
- Electrophysiology Lab Reports: 20%

DEADLINES & MILESTONES:
1. Lab Report 3: Hippocampal LTP Synaptic Plasticity (Due Oct 5, 23:59)
2. Term Paper Thesis & Annotated Bibliography (Due Oct 20, 17:00)
3. Midterm Examination (Nov 8, 10:00 AM)
4. Final Term Paper Submission (Dec 5, 23:59)`
    },
    {
      id: "course-econ201",
      code: "ECON-201",
      name: "Applied Econometrics & Causal Inference",
      instructor: "Prof. Joshua Angrist",
      instructorEmail: "angrist@econ.univ.edu",
      officeHours: "Mon/Fri 11:00 AM - 1:00 PM",
      color: "#10b981",
      term: "Fall 2026",
      currentGrade: 96.0,
      gradeWeights: [
        { categoryName: "Empirical Capstone Paper", weightPercentage: 40.0 },
        { categoryName: "Problem Sets & R Labs", weightPercentage: 30.0 },
        { categoryName: "Final Exam", weightPercentage: 30.0 }
      ],
      syllabusText: `COURSE SYLLABUS: ECON-201 Applied Econometrics (Fall 2026)
Instructor: Prof. Joshua Angrist (angrist@econ.univ.edu)
Empirical microeconomics, instrumental variables, regression discontinuity designs, difference-in-differences, and synthetic controls.`
    }
  ],

  milestones: [
    {
      id: "ms-1",
      courseId: "course-cs410",
      title: "Pset 1: Raft Consensus Implementation",
      description: "Implement leader election and log replication in Go with unit test passes.",
      type: "ASSIGNMENT",
      dueDate: "2026-10-02T23:59:00Z",
      weightPercentage: 5.0,
      isCompleted: false
    },
    {
      id: "ms-2",
      courseId: "course-bio302",
      title: "Lab Report 3: Synaptic Plasticity Analysis",
      description: "Plot patch-clamp voltage data and analyze NMDA/AMPA receptor ratios under high-frequency stimulation.",
      type: "LAB",
      dueDate: "2026-10-05T23:59:00Z",
      weightPercentage: 8.0,
      isCompleted: false
    },
    {
      id: "ms-3",
      courseId: "course-cs410",
      title: "Capstone Checkpoint 1: RPC Wire Protocol",
      description: "Deliver serialization layer, asynchronous network multiplexer, and initial key-value storage benchmark.",
      type: "PROJECT",
      dueDate: "2026-10-12T23:59:00Z",
      weightPercentage: 15.0,
      isCompleted: false
    },
    {
      id: "ms-4",
      courseId: "course-bio302",
      title: "Research Term Paper: Thesis & Literature Review",
      description: "Submit 5-page preliminary literature review mapping optogenetic interventions in episodic memory recall.",
      type: "ESSAY",
      dueDate: "2026-10-20T17:00:00Z",
      weightPercentage: 10.0,
      isCompleted: false
    }
  ],

  executionTasks: [
    {
      id: "task-101",
      milestoneId: "ms-1",
      courseId: "course-cs410",
      title: "Implement Heartbeat RPC & Candidate State Machine in Go",
      instructions: "Implement RequestVote RPC handler in raft.go. Handle randomized election timeout between 150ms and 300ms.",
      scheduledDate: new Date().toISOString().split('T')[0], // Today
      estimatedMinutes: 50,
      actualMinutes: 0,
      cognitiveLoad: "DEEP_FOCUS",
      status: "IN_PROGRESS"
    },
    {
      id: "task-102",
      milestoneId: "ms-2",
      courseId: "course-bio302",
      title: "Filter Electrophysiology Trace Data in MATLAB/Python",
      instructions: "Load .abf electrophysiology recordings, apply 1kHz Bessel low-pass filter, and compute fEPSP slope.",
      scheduledDate: new Date().toISOString().split('T')[0], // Today
      estimatedMinutes: 35,
      actualMinutes: 0,
      cognitiveLoad: "ACTIVE_PRODUCTION",
      status: "PENDING"
    },
    {
      id: "task-103",
      milestoneId: "ms-2",
      courseId: "course-bio302",
      title: "Annotate Kandel Principles of Neural Science (Ch. 14)",
      instructions: "Review molecular mechanisms of CaMKII activation and early vs. late phase LTP consolidation.",
      scheduledDate: new Date().toISOString().split('T')[0], // Today
      estimatedMinutes: 30,
      actualMinutes: 0,
      cognitiveLoad: "PASSIVE_SYNTHESIS",
      status: "PENDING"
    },
    {
      id: "task-104",
      milestoneId: "ms-1",
      courseId: "course-cs410",
      title: "Format BibTeX References & Code Documentation",
      instructions: "Generate godoc documentation and verify package exports adhere to course style guide.",
      scheduledDate: new Date().toISOString().split('T')[0], // Today
      estimatedMinutes: 15,
      actualMinutes: 0,
      cognitiveLoad: "ADMIN_REVIEW",
      status: "COMPLETED"
    },
    // Overdue task to demonstrate real-time Rebalance Engine
    {
      id: "task-099",
      milestoneId: "ms-1",
      courseId: "course-cs410",
      title: "Complete Formal Proof for Split-Vote Prevention",
      instructions: "Demonstrate that randomized election timers eliminate livelocks in odd vs. even cluster node topologies.",
      scheduledDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday (Overdue)
      estimatedMinutes: 45,
      actualMinutes: 0,
      cognitiveLoad: "DEEP_FOCUS",
      status: "OVERDUE"
    },
    // Upcoming
    {
      id: "task-105",
      milestoneId: "ms-3",
      courseId: "course-cs410",
      title: "Benchmark In-Memory LSM-Tree vs. B+ Tree Latency",
      instructions: "Write microbenchmarks using Go standard testing package under concurrent 10,000 req/sec load.",
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      estimatedMinutes: 60,
      actualMinutes: 0,
      cognitiveLoad: "DEEP_FOCUS",
      status: "PENDING"
    }
  ],

  studyDecks: [
    {
      id: "deck-cs410",
      courseId: "course-cs410",
      title: "Consensus, CAP Theorem & Raft Protocol",
      topic: "Distributed Algorithms",
      cards: [
        {
          id: "card-1",
          question: "Explain why Raft requires a majority quorum (N/2 + 1) for both leader election and log commitment.",
          answer: "By the Pigeonhole Principle, any two majorities in a cluster of size N must overlap in at least one node. This ensures that the newly elected leader contains all committed entries from prior terms, preventing Split-Brain and stale state transitions.",
          explanation: "Syllabus Rubric: Master the intersection of leader safety and election restriction theorems.",
          mastery: 2
        },
        {
          id: "card-2",
          question: "What is the key difference between Linearizability and Sequential Consistency?",
          answer: "Linearizability is a strict real-time constraint (operations appear to take effect instantaneously at a point in physical wall-clock time between invocation and response). Sequential consistency only requires an order that preserves program order per process, without physical time constraints.",
          explanation: "Frequently tested in Midterm Architecture exams.",
          mastery: 3
        },
        {
          id: "card-3",
          question: "How does 2-Phase Commit (2PC) differ from Paxos/Raft in terms of fault tolerance?",
          answer: "2PC is an atomic commitment protocol where a single coordinator failure can block all participants indefinitely (non-fault-tolerant). Paxos and Raft are consensus protocols that can make progress as long as a non-faulty majority quorum is reachable.",
          explanation: "Essential distinction for distributed transaction design.",
          mastery: 1
        },
        {
          id: "card-4",
          question: "Why can Paxos or Raft NOT guarantee termination in a purely asynchronous network with fail-stop faults?",
          answer: "Due to the FLP Impossibility Theorem (Fischer, Lynch, Paterson, 1985): No deterministic asynchronous consensus protocol can guarantee termination in the presence of even a single unannounced fail-stop crash.",
          explanation: "Practical protocols use randomized timers or partial synchrony assumptions to bypass FLP.",
          mastery: 4
        }
      ]
    },
    {
      id: "deck-bio302",
      courseId: "course-bio302",
      title: "Synaptic Plasticity & LTP Consolidation",
      topic: "Cellular Neurobiology",
      cards: [
        {
          id: "card-b1",
          question: "Why is the NMDA receptor classified as a molecular coincidence detector?",
          answer: "It requires both presynaptic glutamate binding AND postsynaptic depolarization sufficient to expel the voltage-dependent Mg2+ ion blocking the channel pore, allowing Ca2+ influx.",
          explanation: "Fundamental mechanism underlying Hebbian synaptic learning.",
          mastery: 3
        },
        {
          id: "card-b2",
          question: "What is the biochemical role of CaMKII autophosphorylation at Thr286?",
          answer: "Autophosphorylation at Thr286 locks CaMKII into a constitutively active state that outlasts the initial Ca2+ spike, creating a biochemical molecular memory that drives AMPA receptor insertion into the postsynaptic density.",
          explanation: "Crucial for Early-LTP to Late-LTP transition.",
          mastery: 2
        }
      ]
    }
  ],

  diagnosticQuiz: [
    {
      id: "q-1",
      question: "In the Raft protocol, if a candidate server receives an AppendEntries RPC from another server claiming to be leader with a term LESS than the candidate's current term, what must it do?",
      options: [
        "A) Accept the RPC, step down to follower, and update its term.",
        "B) Reject the RPC and remain in candidate state.",
        "C) Forward the RPC to all neighboring peers.",
        "D) Immediately reset its randomized election timer."
      ],
      correctIndex: 1,
      explanation: "Raft rule: Leaders with stale terms must be rejected to prevent decommissioned or partitioned nodes from overriding active leadership."
    },
    {
      id: "q-2",
      question: "Which of the following conditions is required to trigger Long-Term Depression (LTD) rather than Long-Term Potentiation (LTP) in hippocampal CA1 pyramidal neurons?",
      options: [
        "A) Prolonged low-frequency stimulation (1 Hz) producing modest Ca2+ influx activating calcineurin.",
        "B) High-frequency burst stimulation (100 Hz) producing massive Ca2+ influx.",
        "C) Complete blockade of GABAergic interneurons.",
        "D) Permanent saturation of presynaptic vesicular transporters."
      ],
      correctIndex: 0,
      explanation: "Modest Ca2+ elevations preferentially activate high-affinity protein phosphatases (calcineurin/PP1), which dephosphorylate AMPA receptors and trigger their endocytosis."
    },
    {
      id: "q-3",
      question: "According to Sweller's Cognitive Load Theory, how should deep study sessions be architected to minimize extraneous load?",
      options: [
        "A) Simultaneously review lecture videos while attempting difficult problem set proofs.",
        "B) Isolate complex multi-phase assignments into isolated micro-tasks with clear instructional goals.",
        "C) Prolong study marathons to exceed 8 continuous hours without breaks.",
        "D) Memorize raw formulas without understanding conceptual derivations."
      ],
      correctIndex: 1,
      explanation: "Deconstructing large tasks prevents working memory saturation and eliminates the ambiguity that triggers procrastination."
    },
    {
      id: "q-4",
      question: "Under the CAP theorem, why is a network partition (P) inevitable in real-world distributed architectures?",
      options: [
        "A) Physical hardware cables, routers, and switches can and will experience packet loss and latency spikes.",
        "B) Software bugs can only manifest during concurrent write locks.",
        "C) Database disks cannot write more than 1MB per second.",
        "D) DNS servers only update once every 24 hours."
      ],
      correctIndex: 0,
      explanation: "Because physical networks cannot guarantee 100% zero-latency packet delivery, any distributed system must choose between Consistency (C) and Availability (A) during network partitions."
    },
    {
      id: "q-5",
      question: "In an academic execution triage scenario (Pareto 80/20 Rule), when a student is facing severe cognitive burnout with 3 simultaneous deadlines, which task should be compressed first?",
      options: [
        "A) The 35% weighted capstone project checkpoint.",
        "B) The 25% closed-book midterm examination.",
        "C) A 2% weighted auxiliary discussion board post.",
        "D) The final course laboratory project."
      ],
      correctIndex: 2,
      explanation: "Emergency triage prioritizes deliverables that protect 80%+ of final GPA while compressing or conceding low-yield administrative tasks."
    }
  ]
};
