import type { Committee } from './supabase';

export const committees: Committee[] = [
  {
    name: 'DISEC',
    fullName: 'Disarmament and International Security Committee',
    agenda: 'Nuclear Non-Proliferation in the 21st Century',
    executiveBoard: [
      { name: 'Arjun Sharma', role: 'Chair' },
      { name: 'Priya Patel', role: 'Vice-Chair' },
      { name: 'Rahul Singh', role: 'Rapporteur' },
    ],
    studyGuideUrl: '/guides/disec-guide.pdf',
    description: 'The First Committee of the UN General Assembly, DISEC deals with disarmament, global challenges, and threats to peace affecting the international community.',
  },
  {
    name: 'UNHRC',
    fullName: 'United Nations Human Rights Council',
    agenda: 'Protecting the Rights of Refugees in Global Conflict Zones',
    executiveBoard: [
      { name: 'Tanvi Bhatia', role: 'President' },
      { name: 'Siddharth Reddy', role: 'Vice-President' },
      { name: 'Maya Krishnan', role: 'Secretary' },
    ],
    studyGuideUrl: '/guides/unhrc-guide.pdf',
    description: 'The Human Rights Council is responsible for strengthening the promotion and protection of human rights around the globe.',
  },
  {
    name: 'UNCSW',
    fullName: 'United Nations Commission on the Status of Women',
    agenda: 'Advancing Women\u2019s Economic Empowerment in Developing Nations',
    executiveBoard: [
      { name: 'Ananya Iyer', role: 'Chair' },
      { name: 'Vikram Malhotra', role: 'Vice-Chair' },
      { name: 'Sneha Gupta', role: 'Rapporteur' },
    ],
    studyGuideUrl: '/guides/uncsw-guide.pdf',
    description: 'The Commission on the Status of Women is the principal global intergovernmental body dedicated to the promotion of gender equality and the empowerment of women.',
  },
  {
    name: 'IPC',
    fullName: 'International Press Corps',
    agenda: 'The Role of Media in Shaping Global Diplomatic Narratives',
    executiveBoard: [
      { name: 'Karan Mehta', role: 'Editor-in-Chief' },
      { name: 'Divya Nair', role: 'Associate Editor' },
      { name: 'Aditya Joshi', role: 'Photojournalist Lead' },
    ],
    studyGuideUrl: '/guides/ipc-guide.pdf',
    description: 'The International Press Corps simulates global journalism, where delegates report on committee proceedings, conduct press conferences, and shape public opinion.',
  },
  {
    name: 'AIPPM',
    fullName: 'All India Political Party Meet',
    agenda: 'Electoral Reforms and the Future of Indian Democracy',
    executiveBoard: [
      { name: 'Dr. Ishita Rao', role: 'Moderator' },
      { name: 'Rohan Desai', role: 'Co-Moderator' },
      { name: 'Anita Kumar', role: 'Rapporteur' },
    ],
    studyGuideUrl: '/guides/aippm-guide.pdf',
    description: 'A unique Indian committee simulation where delegates represent political leaders and debate domestic policy, governance, and national issues in a parliamentary-style forum.',
  },
];

export const countries = [
  'United States',
  'United Kingdom',
  'France',
  'Germany',
  'China',
  'Russia',
  'India',
  'Brazil',
  'Japan',
  'South Africa',
  'Australia',
  'Canada',
];

export const personalities = [
  'Narendra Modi (BJP)',
  'Rahul Gandhi (INC)',
  'Mamata Banerjee (TMC)',
  'Arvind Kejriwal (AAP)',
  'Nitish Kumar (JDU)',
  'Sharad Pawar (NCP)',
  'Mayawati (BSP)',
  'Akhilesh Yadav (SP)',
  'Uddhav Thackeray (SHS)',
  'M.K. Stalin (DMK)',
  'Y.S. Jagan Mohan Reddy (YSRCP)',
  'Naveen Patnaik (BJD)',
  'H.D. Kumaraswamy (JD(S))',
  'Chandrababu Naidu (TDP)',
  'Sitaram Yechury (CPI(M))',
  'Asaduddin Owaisi (AIMIM)',
  'Parkash Singh Badal (SAD)',
  'Hemant Soren (JMM)',
];

export const committeeNames = ['DISEC', 'UNHRC', 'UNCSW', 'IPC', 'AIPPM'];

export function isPersonalityCommittee(committee: string): boolean {
  return committee === 'AIPPM';
}

export function getOptionsForCommittee(committee: string): string[] {
  return isPersonalityCommittee(committee) ? personalities : countries;
}
