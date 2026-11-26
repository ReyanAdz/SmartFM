// ===== SmartFM core: scenarios + rule-based prediction (no AI) =====

// Folder tree helper: F(name, files, children)
function F(name, files, children) { return { name, files: files || [], children: children || [] }; }

const SCENARIOS = [
  {
    id: 'student', label: 'University student',
    intro: 'You are a university student. Save each file you receive.',
    tree: F('Home', [], [
      F('Downloads', ['setup_installer.exe', 'Screenshot_0311.png']),
      F('Courses', [], [
        F('BIOL 210', [], [
          F('Labs', ['BIOL210_Lab1_Report.pdf', 'BIOL210_Lab2_Report.pdf']),
          F('Lecture Notes', ['BIOL210_Week1_Notes.docx', 'Cell_Structure_Notes.docx'])
        ]),
        F('HIST 105', [], [
          F('Essays', ['HIST105_Essay1_Outline.docx']),
          F('Readings', ['Industrial_Revolution_Reading.pdf', 'HIST105_Ch2_Reading.pdf'])
        ]),
        F('MATH 152', [], [
          F('Assignments', ['MATH152_Assignment1.pdf', 'MATH152_Assignment2.pdf']),
          F('Exam Prep', ['Midterm_Practice_MATH152.pdf'])
        ])
      ]),
      F('Work', [], [
        F('Café Shifts', ['Shift_Schedule_Sept.xlsx']),
        F('Pay Stubs', ['Paystub_2026_09.pdf']),
        F('Resume', ['Resume_2026.docx', 'Cover_Letter_Cafe.docx'])
      ]),
      F('Personal', [], [
        F('Photos', ['IMG_1990.jpg', 'Beach_Day.jpg']),
        F('Travel', ['Flight_Itinerary_Toronto.pdf']),
        F('Finances', ['Budget_2026.xlsx', 'Internet_Bill_Sept.pdf'])
      ])
    ]),
    incoming: [
      ['BIOL210_Lab3_Report.pdf', 'Your third BIOL 210 lab report', 'Courses/BIOL 210/Labs'],
      ['HIST105_Essay2_Draft.docx', 'Draft of your second history essay', 'Courses/HIST 105/Essays'],
      ['MATH152_Assignment3.pdf', 'Math assignment 3', 'Courses/MATH 152/Assignments'],
      ['BIOL210_Week5_Notes.docx', 'Biology lecture notes from week 5', 'Courses/BIOL 210/Lecture Notes'],
      ['Primary_Sources_Reading_HIST105.pdf', 'A reading for your history class', 'Courses/HIST 105/Readings'],
      ['MATH152_Final_Practice.pdf', 'Practice final exam for math', 'Courses/MATH 152/Exam Prep'],
      ['Paystub_2026_10.pdf', 'Your October pay stub from the café', 'Work/Pay Stubs'],
      ['Shift_Schedule_Oct.xlsx', 'Café shift schedule for October', 'Work/Café Shifts'],
      ['Resume_Updated_Nov.docx', 'Your updated resume', 'Work/Resume'],
      ['IMG_2045.jpg', 'A photo from your phone', 'Personal/Photos'],
      ['Phone_Bill_October.pdf', 'Your October phone bill', 'Personal/Finances'],
      ['Hotel_Booking_Vancouver.pdf', 'Hotel confirmation for a weekend trip', 'Personal/Travel']
    ]
  },
  {
    id: 'photographer', label: 'Freelance photographer',
    intro: 'You are a freelance photographer. Save each file you receive.',
    tree: F('Home', [], [
      F('Downloads', ['driver_update.dmg', 'Screenshot_0412.png']),
      F('Clients', [], [
        F('Harbor Bakery', [], [
          F('Shoots', ['HarborBakery_Shoot1_001.jpg', 'HarborBakery_Shoot1_002.jpg']),
          F('Contract', ['HarborBakery_Contract_Draft.pdf'])
        ]),
        F('Lumen Studio', [], [
          F('Product Photos', ['Lumen_Product_Photo_Chair.jpg', 'Lumen_Product_Photo_Vase.jpg']),
          F('Briefs', ['Lumen_Brief_Fall_Catalog.docx'])
        ]),
        F('Pinewood Wedding', [], [
          F('Ceremony', ['Pinewood_Ceremony_001.jpg', 'Pinewood_Ceremony_002.jpg']),
          F('Reception', ['Pinewood_Reception_Toast.jpg'])
        ])
      ]),
      F('Business', [], [
        F('Invoices', ['Invoice_0031.pdf', 'Invoice_0032.pdf']),
        F('Taxes', ['Tax_Receipts_2025.pdf']),
        F('Equipment', ['Camera_Warranty.pdf', 'Lens_Receipt.pdf'])
      ]),
      F('Personal', [], [
        F('Family Photos', ['IMG_3301.jpg', 'Thanksgiving_2025.jpg']),
        F('Car', ['Car_Insurance_2026.pdf', 'Tire_Quote_Spring.pdf']),
        F('Recipes', ['Banana_Bread_Recipe.docx'])
      ])
    ]),
    incoming: [
      ['HarborBakery_Shoot2_014.jpg', 'A photo from your second Harbor Bakery shoot', 'Clients/Harbor Bakery/Shoots'],
      ['HarborBakery_Contract_Signed.pdf', 'The signed Harbor Bakery contract', 'Clients/Harbor Bakery/Contract'],
      ['Lumen_Product_Photo_Lamp.jpg', 'Product photo of a lamp for Lumen Studio', 'Clients/Lumen Studio/Product Photos'],
      ['Lumen_Brief_Winter_Campaign.docx', 'Lumen Studio brief for their winter campaign', 'Clients/Lumen Studio/Briefs'],
      ['Pinewood_Ceremony_Vows_022.jpg', 'Wedding ceremony photo (the vows)', 'Clients/Pinewood Wedding/Ceremony'],
      ['Pinewood_Reception_FirstDance.jpg', 'Wedding reception photo (first dance)', 'Clients/Pinewood Wedding/Reception'],
      ['Invoice_0033.pdf', 'Your latest invoice', 'Business/Invoices'],
      ['Tax_Receipts_2026.pdf', 'Receipts for this year\'s taxes', 'Business/Taxes'],
      ['Equipment_Tripod_Receipt.pdf', 'Receipt for a new tripod', 'Business/Equipment'],
      ['IMG_3478.jpg', 'A photo from your phone', 'Personal/Family Photos'],
      ['Oil_Change_Quote.pdf', 'A quote from the mechanic', 'Personal/Car'],
      ['Weekly_Meal_Plan.docx', 'Your meal plan for the week', 'Personal/Recipes']
    ]
  },
  {
    id: 'organizer', label: 'Community event organizer',
    intro: 'You organize community events. Save each file you receive.',
    tree: F('Home', [], [
      F('Downloads', ['zoom_installer.exe', 'Screenshot_0918.png']),
      F('Events', [], [
        F('Spring Fair', [], [
          F('Vendors', ['SpringFair_Vendor_List.xlsx', 'Vendor_Application_Form.pdf']),
          F('Posters', ['SpringFair_Poster_v1.png', 'SpringFair_Poster_v2.png'])
        ]),
        F('Charity Run', [], [
          F('Routes', ['CharityRun_Route_5K.pdf']),
          F('Registrations', ['CharityRun_Registrations.xlsx', 'Registration_Waiver.pdf'])
        ]),
        F('Book Drive', [], [
          F('Donations', ['BookDrive_Donation_Log.xlsx']),
          F('Flyers', ['BookDrive_Flyer.png'])
        ])
      ]),
      F('Admin', [], [
        F('Meeting Minutes', ['Minutes_Sept_Meeting.docx', 'Minutes_Oct_Meeting.docx']),
        F('Budget', ['Budget_2026.xlsx']),
        F('Sponsors', ['Sponsor_Letter_Template.docx', 'Sponsor_Contacts.xlsx'])
      ]),
      F('Personal', [], [
        F('Photos', ['IMG_5520.jpg', 'Dog_Park.jpg']),
        F('Gym', ['Gym_Membership.pdf']),
        F('Home', ['Lease_Agreement.pdf', 'Hydro_Bill_Sept.pdf'])
      ])
    ]),
    incoming: [
      ['SpringFair_Vendor_Payments.xlsx', 'Payments received from Spring Fair vendors', 'Events/Spring Fair/Vendors'],
      ['SpringFair_Poster_Final.png', 'Final Spring Fair poster', 'Events/Spring Fair/Posters'],
      ['CharityRun_Route_10K.pdf', 'Map of the 10K charity run route', 'Events/Charity Run/Routes'],
      ['CharityRun_Late_Registrations.xlsx', 'Late sign-ups for the charity run', 'Events/Charity Run/Registrations'],
      ['BookDrive_Donations_Nov.xlsx', 'Book drive donations for November', 'Events/Book Drive/Donations'],
      ['BookDrive_Flyer_Library.png', 'Book drive flyer for the library', 'Events/Book Drive/Flyers'],
      ['Minutes_Nov_Meeting.docx', 'Notes from the November meeting', 'Admin/Meeting Minutes'],
      ['Budget_Q4_Update.xlsx', 'Updated Q4 budget', 'Admin/Budget'],
      ['Sponsor_Thank_You_Letter.docx', 'Thank-you letter for a sponsor', 'Admin/Sponsors'],
      ['IMG_5604.jpg', 'A photo from your phone', 'Personal/Photos'],
      ['Internet_Bill_Oct.pdf', 'Your October internet bill', 'Personal/Home'],
      ['Yoga_Class_Schedule.pdf', 'Schedule for your yoga classes', 'Personal/Gym']
    ]
  }
];

// ---------- tree helpers ----------
function cloneTree(t) { return { name: t.name, files: t.files.slice(), children: t.children.map(cloneTree) }; }
// Paths are relative to Home, e.g. "Courses/BIOL 210/Labs"; "" is Home.
function allFolders(root) {
  const out = [];
  (function walk(node, path, ancestors) {
    out.push({ node, path, ancestors });
    node.children.forEach(c => walk(c, path ? path + '/' + c.name : c.name, path ? ancestors.concat([node.name]) : []));
  })(root, '', []);
  return out;
}
function getFolder(root, path) {
  if (!path) return root;
  let node = root;
  for (const part of path.split('/')) { node = node.children.find(c => c.name === part); if (!node) return null; }
  return node;
}
function ext(name) { const i = name.lastIndexOf('.'); return i < 0 ? '' : name.slice(i + 1).toLowerCase(); }
function stem(name) { const i = name.lastIndexOf('.'); return i < 0 ? name : name.slice(0, i); }

// ---------- tokenizer ----------
const STOP = new Set(['the', 'and', 'of', 'for', 'to', 'my', 'new', 'final', 'draft', 'updated', 'update', 'v1', 'v2']);
function tokenize(s) {
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Za-z])([0-9])/g, '$1 $2').replace(/([0-9])([A-Za-z])/g, '$1 $2');
  const toks = s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(t => {
    if (/^[a-z]+$/.test(t) && t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
    return t;
  });
  return toks.filter(t => !STOP.has(t) && (/^[0-9]+$/.test(t) ? t.length >= 3 : t.length >= 2));
}

// ---------- prediction (rule-based, inspired by AccessRank's simple scoring) ----------
const W = { own: 3, ancestor: 2, content: 1.5, type: 1, recent1: 0.6, recent2: 0.3, freq: 0.2, freqCap: 0.6, nonLeaf: 0.75 };

// history: array of folder paths the user saved to in this block, most recent last
function predict(root, fileName, history) {
  const ftoks = Array.from(new Set(tokenize(stem(fileName))));
  const fext = ext(fileName);
  const results = [];
  for (const { node, path, ancestors } of allFolders(root)) {
    if (!path) continue; // never suggest Home itself
    const ownToks = new Set(tokenize(node.name));
    const ownJoined = tokenize(node.name).join('');
    const ancToks = new Set(ancestors.flatMap(a => tokenize(a)));
    const contentToks = new Set(node.files.flatMap(f => tokenize(stem(f))));
    let score = 0; const own = [], anc = [], content = [];
    for (const t of ftoks) {
      if (ownToks.has(t) || t === ownJoined) { score += W.own; own.push(t); }
      else if (ancToks.has(t)) { score += W.ancestor; anc.push(t); }
      else if (contentToks.has(t)) { score += W.content; content.push(t); }
    }
    let typeScore = 0;
    if (node.files.length) typeScore = W.type * node.files.filter(f => ext(f) === fext).length / node.files.length;
    score += typeScore;
    let recent = 0;
    if (history.length && history[history.length - 1] === path) recent = W.recent1;
    else if (history.length > 1 && history[history.length - 2] === path) recent = W.recent2;
    score += recent;
    const freq = Math.min(W.freqCap, W.freq * history.filter(h => h === path).length);
    score += freq;
    if (node.children.length) score *= W.nonLeaf;

    // short human-readable reason
    const parts = [];
    if (own.length) parts.push({ w: own.length * W.own, t: 'Name matches “' + own.join('”, “') + '”' });
    if (anc.length) parts.push({ w: anc.length * W.ancestor, t: 'Inside “' + ancestors[ancestors.length - 1] + '”' });
    if (content.length) parts.push({ w: content.length * W.content, t: 'Similar files here' });
    if (typeScore >= 0.5) parts.push({ w: typeScore, t: 'Has other .' + fext + ' files' });
    if (recent) parts.push({ w: recent, t: 'You saved here recently' });
    parts.sort((a, b) => b.w - a.w);
    results.push({ path, score: Math.round(score * 100) / 100, reason: parts.slice(0, 2).map(p => p.t).join(' · ') || 'Closest match' });
  }
  // stable ordering: score, then tree order (allFolders order is fixed)
  return results.map((r, i) => ({ ...r, i })).sort((a, b) => b.score - a.score || a.i - b.i);
}

if (typeof module !== 'undefined') module.exports = { SCENARIOS, predict, cloneTree, getFolder, allFolders, tokenize };
