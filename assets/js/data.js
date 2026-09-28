/* Hacker Club — sample data.
   Everything here is placeholder content. Later this will come from the backend API. */
(function () {
  const HC = (window.HC = window.HC || {});
  const MIN = 60e3, HOUR = 36e5, DAY = 864e5;
  // Round "now" to the minute so start times look natural
  const NOW = Math.floor(Date.now() / MIN) * MIN;
  HC.time = { MIN, HOUR, DAY, NOW };

  // Seeded random so generated data is stable between page loads
  HC.rng = function (seed) {
    let a = typeof seed === "string" ? [...seed].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0), 1779033703) : seed;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  HC.categories = [
    { id: "algorithms", name: "Algorithms", icon: "λ", desc: "Classic competitive programming: DP, graphs, math, greedy." },
    { id: "ai-ml", name: "AI & ML", icon: "◉", desc: "Build models, tune prompts and beat the benchmark." },
    { id: "web", name: "Web Dev", icon: "</>", desc: "Front-end and full-stack challenges judged on real browsers." },
    { id: "security", name: "Security / CTF", icon: "⚑", desc: "Capture-the-flag: crypto, reversing, web exploitation." },
    { id: "data", name: "Data & SQL", icon: "▦", desc: "Queries, analytics and data-wrangling puzzles." },
    { id: "systems", name: "Systems", icon: "⚙", desc: "Concurrency, performance and low-level optimisation." },
  ];

  HC.countries = [
    ["India", "🇮🇳"], ["United States", "🇺🇸"], ["Brazil", "🇧🇷"], ["Germany", "🇩🇪"], ["Japan", "🇯🇵"],
    ["Nigeria", "🇳🇬"], ["Poland", "🇵🇱"], ["China", "🇨🇳"], ["United Kingdom", "🇬🇧"], ["Canada", "🇨🇦"],
    ["Vietnam", "🇻🇳"], ["Egypt", "🇪🇬"], ["Indonesia", "🇮🇩"], ["France", "🇫🇷"], ["South Korea", "🇰🇷"],
    ["Bangladesh", "🇧🇩"], ["Ukraine", "🇺🇦"], ["Mexico", "🇲🇽"], ["Kenya", "🇰🇪"], ["Australia", "🇦🇺"],
  ];
  HC.flag = (name) => (HC.countries.find((c) => c[0] === name) || ["", "🌍"])[1];

  // ---------------- Problems (runnable in the Arena) ----------------
  HC.problems = [
    {
      id: "two-sum", title: "Two Sum", difficulty: "Easy", points: 100, fn: "twoSum", compare: "sorted",
      statement: `<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return the <b>indices</b> of the two numbers that add up to <code>target</code>.</p>
        <p>Each input has exactly one solution, and you may not use the same element twice. You can return the indices in any order.</p>`,
      examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]", note: "nums[0] + nums[1] = 9" }, { input: "nums = [3,2,4], target = 6", output: "[1,2]" }],
      constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i], target ≤ 10⁹", "Exactly one valid answer exists"],
      tests: [
        { args: [[2, 7, 11, 15], 9], expected: [0, 1] }, { args: [[3, 2, 4], 6], expected: [1, 2] },
        { args: [[3, 3], 6], expected: [0, 1] }, { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
        { args: [[0, 4, 3, 0], 0], expected: [0, 3] }, { args: [[1, 5, 9, 13, 21, 40], 61], expected: [4, 5] },
      ],
      starter: {
        javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  // your code here\n  \n}\n`,
        python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # your code here\n        pass\n`,
        cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // your code here\n    }\n};\n`,
        java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // your code here\n    }\n}\n`,
      },
    },
    {
      id: "valid-brackets", title: "Valid Brackets", difficulty: "Easy", points: 100, fn: "isValid",
      statement: `<p>Given a string <code>s</code> containing only the characters <code>()[]{}</code>, determine if the input string is <b>valid</b>.</p>
        <p>A string is valid if every open bracket is closed by the same type of bracket, and brackets close in the correct order.</p>`,
      examples: [{ input: 's = "()[]{}"', output: "true" }, { input: 's = "(]"', output: "false" }, { input: 's = "{[]}"', output: "true" }],
      constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of brackets only"],
      tests: [
        { args: ["()[]{}"], expected: true }, { args: ["(]"], expected: false }, { args: ["{[]}"], expected: true },
        { args: ["(("], expected: false }, { args: ["]"], expected: false }, { args: ["([{}])[]"], expected: true }, { args: ["([)]"], expected: false },
      ],
      starter: {
        javascript: `/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n  // your code here\n  \n}\n`,
        python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        # your code here\n        pass\n`,
        cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        // your code here\n    }\n};\n`,
        java: `class Solution {\n    public boolean isValid(String s) {\n        // your code here\n    }\n}\n`,
      },
    },
    {
      id: "max-subarray", title: "Maximum Subarray", difficulty: "Medium", points: 200, fn: "maxSubArray",
      statement: `<p>Given an integer array <code>nums</code>, find the contiguous subarray (containing at least one number) which has the <b>largest sum</b> and return that sum.</p>
        <p><i>Follow-up:</i> can you solve it in <code>O(n)</code> time?</p>`,
      examples: [{ input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", note: "[4,-1,2,1] has the largest sum = 6" }, { input: "nums = [5,4,-1,7,8]", output: "23" }],
      constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
      tests: [
        { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 }, { args: [[5, 4, -1, 7, 8]], expected: 23 },
        { args: [[1]], expected: 1 }, { args: [[-3, -1, -2]], expected: -1 }, { args: [[8, -19, 5, -4, 20]], expected: 21 },
      ],
      starter: {
        javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction maxSubArray(nums) {\n  // your code here\n  \n}\n`,
        python: `class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        # your code here\n        pass\n`,
        cpp: `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // your code here\n    }\n};\n`,
        java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        // your code here\n    }\n}\n`,
      },
    },
    {
      id: "longest-unique", title: "Longest Unique Substring", difficulty: "Medium", points: 200, fn: "lengthOfLongestSubstring",
      statement: `<p>Given a string <code>s</code>, find the length of the <b>longest substring</b> without repeating characters.</p>`,
      examples: [{ input: 's = "abcabcbb"', output: "3", note: 'The answer is "abc"' }, { input: 's = "bbbbb"', output: "1" }, { input: 's = "pwwkew"', output: "3" }],
      constraints: ["0 ≤ s.length ≤ 5 · 10⁴", "s consists of English letters, digits, symbols and spaces"],
      tests: [
        { args: ["abcabcbb"], expected: 3 }, { args: ["bbbbb"], expected: 1 }, { args: ["pwwkew"], expected: 3 },
        { args: [""], expected: 0 }, { args: ["dvdf"], expected: 3 }, { args: ["abba"], expected: 2 }, { args: ["hackerclub rocks"], expected: 9 },
      ],
      starter: {
        javascript: `/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n  // your code here\n  \n}\n`,
        python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # your code here\n        pass\n`,
        cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // your code here\n    }\n};\n`,
        java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // your code here\n    }\n}\n`,
      },
    },
    {
      id: "merge-intervals", title: "Merge Intervals", difficulty: "Hard", points: 300, fn: "merge",
      statement: `<p>Given an array of <code>intervals</code> where <code>intervals[i] = [start, end]</code>, merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input, <b>sorted by start</b>.</p>`,
      examples: [{ input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" }, { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]", note: "Touching intervals are considered overlapping" }],
      constraints: ["1 ≤ intervals.length ≤ 10⁴", "0 ≤ start ≤ end ≤ 10⁴"],
      tests: [
        { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] }, { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
        { args: [[[1, 4], [0, 4]]], expected: [[0, 4]] }, { args: [[[1, 4], [2, 3]]], expected: [[1, 4]] },
        { args: [[[5, 7], [1, 2], [3, 4], [2, 3]]], expected: [[1, 4], [5, 7]] },
      ],
      starter: {
        javascript: `/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nfunction merge(intervals) {\n  // your code here\n  \n}\n`,
        python: `class Solution:\n    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n        # your code here\n        pass\n`,
        cpp: `class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // your code here\n    }\n};\n`,
        java: `class Solution {\n    public int[][] merge(int[][] intervals) {\n        // your code here\n    }\n}\n`,
      },
    },
  ];
  HC.problem = (id) => HC.problems.find((p) => p.id === id);

  // ---------------- Contests ----------------
  const allProblems = HC.problems.map((p) => p.id);
  HC.contests = [
    {
      id: "speed-blitz-17", title: "Speed Coding Blitz #17", level: "beginner", category: "algorithms",
      start: NOW - 20 * MIN, durationMin: 60, prize: 300, fee: 5, registered: 2130, capacity: 3000,
      format: "Individual · ICPC scoring", problems: ["two-sum", "valid-brackets", "max-subarray"],
      desc: "Quick-fire problems — fastest correct answers win.",
      about: "The Blitz is our bite-sized weekly contest. Three problems, one hour, and a leaderboard that moves every second. It's the perfect place to warm up, try new languages and earn your first rating points.",
      prizes: [150, 90, 60],
    },
    {
      id: "weekly-sprint-42", title: "Weekly Sprint #42", level: "beginner", category: "algorithms",
      start: NOW + 5 * HOUR + 12 * MIN, durationMin: 90, prize: 500, fee: 5, registered: 1240, capacity: 5000,
      format: "Individual · Points + penalty", problems: ["two-sum", "valid-brackets", "longest-unique", "max-subarray"],
      desc: "4 warm-up problems on arrays, strings and math. Great first contest.",
      about: "Weekly Sprint is our flagship beginner-friendly round. Problems are sorted by difficulty and each one comes with a full editorial once the contest ends, so you learn something whether you win or not.",
      prizes: [250, 150, 100],
    },
    {
      id: "graph-gauntlet", title: "Graph Theory Gauntlet", level: "intermediate", category: "algorithms",
      start: NOW + 1 * DAY + 3 * HOUR, durationMin: 120, prize: 2000, fee: 10, registered: 860, capacity: 3000,
      format: "Individual · Points + penalty", problems: allProblems,
      desc: "BFS, DFS, shortest paths and a twist of union-find.",
      about: "Five problems that take you from simple traversals to tricky shortest-path variants. Expect at least one problem that looks like a graph but isn't.",
      prizes: [1000, 600, 400],
    },
    {
      id: "prompt-wars-3", title: "Prompt Wars III", level: "intermediate", category: "ai-ml",
      start: NOW + 2 * DAY + 8 * HOUR, durationMin: 180, prize: 4000, fee: 15, registered: 1540, capacity: 4000,
      format: "Individual · Benchmark score", problems: allProblems,
      desc: "Engineer prompts and small models to top a hidden evaluation set.",
      about: "You get a task, an API budget and a hidden evaluation set. The best score on the private leaderboard wins. Creativity beats brute force here.",
      prizes: [2000, 1200, 800],
    },
    {
      id: "grandmaster-cup-r1", title: "Grandmaster Cup — Round 1", level: "expert", category: "algorithms",
      start: NOW + 3 * DAY, durationMin: 180, prize: 10000, fee: 25, registered: 412, capacity: 1000,
      format: "Individual · IOI partial scoring", problems: allProblems,
      desc: "6 hard problems. Advanced DP, segment trees and number theory.",
      about: "The first qualifying round of the Grandmaster Cup, our most prestigious event. The top 100 advance to Round 2 and the top 10 of the season meet in the online final.",
      prizes: [5000, 3000, 2000],
    },
    {
      id: "ctf-night-9", title: "CTF Night #9", level: "intermediate", category: "security",
      start: NOW + 4 * DAY + 14 * HOUR, durationMin: 240, prize: 3000, fee: 10, registered: 690, capacity: 2000,
      format: "Teams of up to 3 · Jeopardy style", problems: allProblems,
      desc: "Crypto, reversing, pwn and web exploitation. Capture every flag.",
      about: "A four-hour jeopardy-style CTF. Challenges unlock in waves and first-bloods earn bonus points. All targets are isolated lab environments built for this event.",
      prizes: [1500, 900, 600],
    },
    {
      id: "dp-duel", title: "Dynamic Programming Duel", level: "intermediate", category: "algorithms",
      start: NOW + 5 * DAY + 6 * HOUR, durationMin: 120, prize: 3000, fee: 10, registered: 530, capacity: 3000,
      format: "Individual · Points + penalty", problems: allProblems,
      desc: "Knapsack, intervals, bitmasks — memoize your way to the top.",
      about: "Every single problem in this round is a DP problem. If you've been meaning to get better at dynamic programming, this is your sign.",
      prizes: [1500, 900, 600],
    },
    {
      id: "frontend-faceoff", title: "Frontend Face-off", level: "beginner", category: "web",
      start: NOW + 7 * DAY + 2 * HOUR, durationMin: 150, prize: 1500, fee: 5, registered: 980, capacity: 3000,
      format: "Individual · Visual + test score", problems: allProblems,
      desc: "Rebuild UI components pixel-perfect. Judged in real browsers.",
      about: "You'll get a series of designs to rebuild with HTML, CSS and JavaScript. Submissions are scored on visual accuracy, accessibility and passing interaction tests.",
      prizes: [750, 450, 300],
    },
    {
      id: "sql-showdown", title: "SQL Showdown", level: "beginner", category: "data",
      start: NOW + 8 * DAY + 5 * HOUR, durationMin: 90, prize: 1000, fee: 5, registered: 610, capacity: 2500,
      format: "Individual · Points + time", problems: allProblems,
      desc: "Joins, window functions and gnarly aggregations on real-world datasets.",
      about: "Solve data puzzles by writing SQL against realistic datasets. Great for analysts and backend developers alike.",
      prizes: [500, 300, 200],
    },
    {
      id: "systems-challenge", title: "Systems & Concurrency Challenge", level: "expert", category: "systems",
      start: NOW + 9 * DAY, durationMin: 240, prize: 7500, fee: 20, registered: 205, capacity: 800,
      format: "Individual · Performance score", problems: allProblems,
      desc: "Optimise real-world systems problems under strict time and memory limits.",
      about: "Lock-free queues, cache-friendly data structures and a scheduler that must not starve. Solutions are benchmarked on identical hardware.",
      prizes: [3750, 2250, 1500],
    },
    // Past contests
    {
      id: "weekly-sprint-41", title: "Weekly Sprint #41", level: "beginner", category: "algorithms",
      start: NOW - 6 * DAY - 3 * HOUR, durationMin: 90, prize: 500, fee: 5, registered: 3310, capacity: 5000,
      format: "Individual · Points + penalty", problems: ["two-sum", "valid-brackets", "longest-unique", "max-subarray"],
      desc: "Last week's sprint — editorials now available.", about: "Arrays, strings and a surprisingly tricky sliding window.",
      prizes: [250, 150, 100], winners: ["neon_byte", "algo_ana", "bitwise_bea"],
    },
    {
      id: "ml-mayhem", title: "ML Mayhem", level: "expert", category: "ai-ml",
      start: NOW - 12 * DAY, durationMin: 240, prize: 6000, fee: 20, registered: 870, capacity: 1500,
      format: "Individual · Benchmark score", problems: allProblems,
      desc: "Tabular prediction challenge with a twist of data drift.", about: "Participants built models on shifting data distributions.",
      prizes: [3000, 1800, 1200], winners: ["quantum_qi", "lambda_leo", "heap_hana"],
    },
    {
      id: "ctf-night-8", title: "CTF Night #8", level: "intermediate", category: "security",
      start: NOW - 20 * DAY, durationMin: 240, prize: 3000, fee: 10, registered: 1120, capacity: 2000,
      format: "Teams of up to 3 · Jeopardy style", problems: allProblems,
      desc: "24 challenges, 1,120 hackers, 3 unbroken flags.", about: "A classic night of flags.",
      prizes: [1500, 900, 600], winners: ["null_pointer", "0xnadia", "cipher_cruz"],
    },
  ];
  HC.contest = (id) => HC.contests.find((c) => c.id === id);

  // ---------------- Hackathons ----------------
  HC.hackathons = [
    {
      id: "ai-for-good-2026", title: "AI for Good 2026", theme: "Artificial Intelligence", tagline: "Build AI that makes the world measurably better.",
      start: NOW + 12 * DAY, lengthHrs: 48, prize: 25000, fee: 15, teamSize: "1–4", teams: 312, tags: ["LLMs", "Healthcare", "Climate", "Education"],
      gradient: "linear-gradient(135deg,#0f766e,#22d3ee 60%,#a78bfa)",
      about: "Two days to ship an AI-powered project that tackles a real problem in health, climate or education. Mentors from the AI community will be online throughout to help you scope, build and pitch.",
      tracks: [
        { name: "Health & Wellbeing", desc: "Tools that improve access to care, diagnostics or mental health.", prize: 5000 },
        { name: "Climate & Energy", desc: "Measure, predict or reduce emissions and environmental impact.", prize: 5000 },
        { name: "Learning for All", desc: "Make quality education more accessible and personal.", prize: 5000 },
      ],
      prizes: [{ place: "Grand prize", amount: 6000, extra: "Plus a feature on the Hacker Club blog" }, { place: "Runner-up", amount: 3000 }, { place: "Best newcomer team", amount: 1000 }],
    },
    {
      id: "web3-builders", title: "Web3 Builders Weekend", theme: "Blockchain & Web3", tagline: "Ship decentralised apps people actually want to use.",
      start: NOW + 20 * DAY, lengthHrs: 48, prize: 15000, fee: 10, teamSize: "1–4", teams: 188, tags: ["Smart contracts", "DeFi", "Identity"],
      gradient: "linear-gradient(135deg,#312e81,#7c3aed 55%,#f472b6)",
      about: "Focus on user experience: the best projects will hide the complexity of the chain behind something delightful.",
      tracks: [
        { name: "Consumer dApps", desc: "Apps a non-crypto person could use in 60 seconds.", prize: 4000 },
        { name: "Digital Identity", desc: "Portable, private, user-owned identity.", prize: 3000 },
        { name: "Developer Tooling", desc: "Make building on-chain easier and safer.", prize: 3000 },
      ],
      prizes: [{ place: "Grand prize", amount: 3000 }, { place: "Runner-up", amount: 1500 }, { place: "Community choice", amount: 500 }],
    },
    {
      id: "retro-gamejam", title: "GameJam: Retro Arcade", theme: "Game Development", tagline: "72 hours. One theme. Make it fun.",
      start: NOW + 34 * DAY, lengthHrs: 72, prize: 8000, fee: 10, teamSize: "1–3", teams: 240, tags: ["Pixel art", "WebGL", "Unity", "Godot"],
      gradient: "linear-gradient(135deg,#7c2d12,#f97316 55%,#fbbf24)",
      about: "Build a playable retro-style game in 72 hours. The secret theme is revealed at kickoff. All games must be playable in the browser so the community can vote.",
      tracks: [
        { name: "Best Gameplay", desc: "The most fun to play, full stop.", prize: 2000 },
        { name: "Best Art & Audio", desc: "Pixel-perfect vibes and chiptune bangers.", prize: 1500 },
        { name: "Best Use of Theme", desc: "Most creative interpretation of the secret theme.", prize: 1500 },
      ],
      prizes: [{ place: "Game of the Jam", amount: 2000 }, { place: "Runner-up", amount: 700 }, { place: "Solo dev award", amount: 300 }],
    },
    {
      id: "fintech-global", title: "FinTech Hack Global", theme: "Finance & Payments", tagline: "Reinvent how the world moves and manages money.",
      start: NOW + 45 * DAY, lengthHrs: 48, prize: 20000, fee: 15, teamSize: "2–4", teams: 156, tags: ["Payments", "Open banking", "Security"],
      gradient: "linear-gradient(135deg,#064e3b,#10b981 55%,#39ff88)",
      about: "From cross-border payments to personal finance for the next billion users — build the product you wish your bank had.",
      tracks: [
        { name: "Cross-border Payments", desc: "Cheaper, faster money movement across countries.", prize: 5000 },
        { name: "Financial Inclusion", desc: "Serve the underbanked and first-time users.", prize: 5000 },
        { name: "Fraud & Security", desc: "Detect and prevent fraud in real time.", prize: 4000 },
      ],
      prizes: [{ place: "Grand prize", amount: 4000 }, { place: "Runner-up", amount: 1500 }, { place: "Best pitch", amount: 500 }],
    },
    {
      id: "open-source-sprint", title: "Open Source Sprint", theme: "Open Source", tagline: "Contribute, collaborate and get merged.",
      start: NOW + 58 * DAY, lengthHrs: 96, prize: 6000, fee: 5, teamSize: "1–4", teams: 97, tags: ["Dev tools", "Docs", "Accessibility"],
      gradient: "linear-gradient(135deg,#1e293b,#475569 50%,#39ff88)",
      about: "Four days to build or improve open-source tools that developers love. Every project must be released under an OSI-approved license.",
      tracks: [
        { name: "New Tool", desc: "Start a brand-new open-source project.", prize: 1500 },
        { name: "Accessibility", desc: "Make software usable by everyone.", prize: 1500 },
        { name: "Docs & DX", desc: "Documentation and developer experience.", prize: 1000 },
      ],
      prizes: [{ place: "Grand prize", amount: 1200 }, { place: "Runner-up", amount: 500 }, { place: "First-time contributor", amount: 300 }],
    },
  ];
  HC.hackathon = (id) => HC.hackathons.find((h) => h.id === id);

  HC.judging = [
    { name: "Impact", weight: 30, desc: "Does it solve a real problem for real people?" },
    { name: "Technical execution", weight: 30, desc: "How well is it built? Does it actually work?" },
    { name: "Creativity", weight: 20, desc: "Is the idea or approach original?" },
    { name: "Design & UX", weight: 10, desc: "Is it pleasant and easy to use?" },
    { name: "Presentation", weight: 10, desc: "Clear demo video and pitch." },
  ];

  // ---------------- Hackers (leaderboard) ----------------
  const fixed = ["neon_byte", "kotlin_kai", "rustacean", "algo_ana", "segtree_sam", "0xnadia", "bitwise_bea", "quantum_qi", "lambda_leo", "heap_hana", "null_pointer", "cipher_cruz"];
  const pre = ["byte", "bit", "code", "algo", "stack", "heap", "hash", "loop", "null", "root", "sudo", "ping", "grep", "vector", "kernel", "pixel", "cipher", "turbo", "trie", "xor", "greedy", "async", "mutex", "regex"];
  const suf = ["_ninja", "_wiz", "42", "_x", "master", "_dev", "_kid", "hacker", "_rex", "_ops", "99", "_ace", "_io", "_pro", "_neo", "_zen"];
  const r = HC.rng(42);
  const hackers = [];
  const used = new Set();
  for (let i = 0; i < 240; i++) {
    let name = fixed[i];
    while (!name || used.has(name)) name = pre[(r() * pre.length) | 0] + suf[(r() * suf.length) | 0] + (r() > 0.6 ? ((r() * 90) | 0) + 10 : "");
    used.add(name);
    const rating = Math.round(3450 - i * 9.5 - r() * 20 - (i > 60 ? (i - 60) * 2 : 0));
    const contests = Math.round(20 + r() * 140 - i * 0.2);
    hackers.push({
      name,
      country: HC.countries[(r() * (i < 12 ? HC.countries.length : 8)) | 0][0],
      rating,
      contests,
      wins: Math.max(0, Math.round((240 - i) / 18 + r() * 4 - 2)),
      winnings: Math.max(0, Math.round(((240 - i) ** 1.6) * (1.6 + r()) / 10) * 10),
      solved: Math.round(contests * (3 + r() * 2)),
      season: Math.round((240 - i) * 12 * (0.5 + r())),
      month: Math.round((240 - i) * 3 * (0.3 + r() * 1.4)),
    });
  }
  HC.hackers = hackers;

  HC.tier = function (rating) {
    if (rating >= 3000) return { name: "Legend", color: "#f87171" };
    if (rating >= 2400) return { name: "Grandmaster", color: "#fbbf24" };
    if (rating >= 2000) return { name: "Master", color: "#a78bfa" };
    if (rating >= 1700) return { name: "Expert", color: "#22d3ee" };
    if (rating >= 1400) return { name: "Specialist", color: "#39ff88" };
    return { name: "Newbie", color: "#8aa399" };
  };

  // Hackers looking for a team (hackathon team finder)
  HC.teamSeekers = [
    { name: "pixel_priya", country: "India", role: "Frontend dev", skills: ["React", "Figma", "Tailwind"], note: "Looking for a backend + ML person for the health track." },
    { name: "mutex_marco", country: "Brazil", role: "Backend dev", skills: ["Go", "Postgres", "Docker"], note: "Happy to join any team with a strong idea." },
    { name: "data_dami", country: "Nigeria", role: "ML engineer", skills: ["Python", "PyTorch", "LLMs"], note: "Want to build something for climate. Have a dataset ready!" },
    { name: "ux_yuki", country: "Japan", role: "Designer", skills: ["Figma", "Prototyping", "Motion"], note: "Designer looking for devs who care about polish." },
    { name: "cloud_chen", country: "China", role: "Full-stack", skills: ["TypeScript", "Next.js", "AWS"], note: "Can lead a team. Timezone UTC+8." },
    { name: "sec_sofia", country: "Poland", role: "Security", skills: ["Rust", "Crypto", "Pentesting"], note: "Interested in the fraud & security track." },
  ];

  // Live activity feed messages
  HC.activityTemplates = [
    (h) => `<b>${h.name}</b> ${HC.flag(h.country)} solved <b>${HC.problems[(Math.random() * 5) | 0].title}</b>`,
    (h) => `<b>${h.name}</b> ${HC.flag(h.country)} registered for <b>${HC.contests[1 + ((Math.random() * 8) | 0)].title}</b>`,
    (h) => `<b>${h.name}</b> ${HC.flag(h.country)} joined a team for <b>${HC.hackathons[(Math.random() * 4) | 0].title}</b>`,
    (h) => `<b>${h.name}</b> ${HC.flag(h.country)} reached <b style="color:${HC.tier(h.rating).color}">${HC.tier(h.rating).name}</b>`,
    (h) => `<b>${h.name}</b> ${HC.flag(h.country)} got first blood on <b>Problem ${"ABCDE"[(Math.random() * 5) | 0]}</b>`,
  ];

  HC.faq = [
    ["Who can participate?", "Anyone aged 16+ from anywhere in the world, subject to local laws. Some sponsored events have additional eligibility rules, listed on the event page."],
    ["How are prizes paid out?", "Winners are verified and paid within 7 days via bank transfer, PayPal or other supported methods in 150+ countries. Taxes are the winner's responsibility where applicable."],
    ["How is cheating prevented?", "Submissions run in isolated sandboxes and go through automated plagiarism checks. Winning entries are manually reviewed, and violators are disqualified and banned."],
    ["Can I get a refund on an entry fee?", "Yes — a full refund if you cancel at least 24 hours before an event starts, or if we cancel or reschedule the event."],
    ["Do hackathons require a team?", "No. You can compete solo or in a team. Use the team finder on each hackathon page to meet other participants."],
    ["Which languages can I use?", "40+ languages including Python, JavaScript, C++, Java, Go, Rust, Kotlin and C#. The exact list is shown on each contest page."],
    ["Can my company host an event?", "Yes! We run sponsored and private hackathons and hiring challenges. See the Teams & Companies plan on the pricing page."],
  ];
})();
