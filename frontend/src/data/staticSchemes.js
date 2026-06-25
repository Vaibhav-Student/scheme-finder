export const staticSchemes = [
  {
    id: '1',
    name: 'Post Matric Scholarship for OBC Students',
    ministry: 'Ministry of Social Justice and Empowerment',
    scheme_type: 'Scholarship',
    benefits: 'Financial assistance to OBC students studying at post-matriculation or post-secondary stage.',
    description: 'The objective of the scheme is to provide financial assistance to the OBC students studying at post-matriculation or post-secondary stage to enable them to complete their education. These scholarships shall be available for studies in India only and will be awarded by the Government of State/Union Territory to which the applicant actually belongs.',
    apply_link: 'https://scholarships.gov.in',
    criteria_description: 'Age > 15, Category: OBC, Income < 2,50,000',
    eligibilityCriteria: {
      minAge: 15,
      categories: ['OBC'],
      maxIncome: 250000,
    }
  },
  {
    id: '2',
    name: 'PM Kisan Samman Nidhi',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    scheme_type: 'Financial Assistance',
    benefits: 'Income support of Rs. 6000/- per year in three equal installments will be provided to small and marginal farmer families.',
    description: 'Under the scheme an income support of 6000/- per year in three equal installments will be provided to all land holding farmer families. State Government and UT administration will identify the farmer families which are eligible for support as per scheme guidelines. The fund will be directly transferred to the bank accounts of the beneficiaries.',
    apply_link: 'https://pmkisan.gov.in',
    criteria_description: 'Age >= 18, Any category, Income < 5,00,000',
    eligibilityCriteria: {
      minAge: 18,
      categories: ['General', 'SC', 'ST', 'OBC'],
      maxIncome: 500000,
    }
  },
  {
    id: '3',
    name: 'Pre-Matric Scholarship for SC Students',
    ministry: 'Ministry of Social Justice and Empowerment',
    scheme_type: 'Scholarship',
    benefits: 'Financial assistance to SC students studying in classes IX and X.',
    description: 'The objective of the scheme is to support parents of SC children for education of their wards studying in classes IX and X so that the incidence of drop-out, especially in the transition from the elementary to the secondary stage is minimized, and to improve participation of SC children in classes IX and X of the Pre-Matric stage, so that they perform better and have a better chance of progressing to the Post-Matric stage of education.',
    apply_link: 'https://scholarships.gov.in',
    criteria_description: 'Age between 10 and 16, Category: SC, Income < 2,50,000',
    eligibilityCriteria: {
      minAge: 10,
      maxAge: 16,
      categories: ['SC'],
      maxIncome: 250000,
    }
  },
  {
    id: '4',
    name: 'Atal Pension Yojana',
    ministry: 'Ministry of Finance',
    scheme_type: 'Pension',
    benefits: 'Guaranteed minimum pension of Rs. 1,000/- to 5,000/- per month will be given at the age of 60 years depending on the contributions by the subscribers.',
    description: 'Atal Pension Yojana (APY) is a pension scheme for citizens of India focused on the unorganized sector workers. Under the APY, guaranteed minimum pension of Rs. 1,000/- to 5,000/- per month will be given at the age of 60 years depending on the contributions by the subscribers. The Central Government would also co-contribute 50% of the total contribution or Rs. 1000 per annum, whichever is lower, to each eligible subscriber account, for a period of 5 years.',
    apply_link: 'https://enps.nsdl.com/eNPS/NationalPensionSystem.html',
    criteria_description: 'Age between 18 and 40, Any category',
    eligibilityCriteria: {
      minAge: 18,
      maxAge: 40,
      categories: ['General', 'SC', 'ST', 'OBC'],
      maxIncome: null, // Any income
    }
  },
  {
    id: '5',
    name: 'Sukanya Samriddhi Yojana',
    ministry: 'Ministry of Finance',
    scheme_type: 'Financial Assistance',
    benefits: 'A savings scheme aimed at the betterment of girl children in the country.',
    description: 'Sukanya Samriddhi Yojana (SSY) is a small deposit scheme of the Government of India meant exclusively for a girl child and is launched as a part of Beti Bachao Beti Padhao Campaign. The scheme is meant to meet the education and marriage expenses of a girl child. A Sukanya Samriddhi Account can be opened any time after the birth of a girl till she turns 10, with a minimum deposit of Rs 250.',
    apply_link: 'https://www.indiapost.gov.in/Financial/Pages/Content/Post-Office-Saving-Schemes.aspx',
    criteria_description: 'Gender: Female, Age <= 10',
    eligibilityCriteria: {
      gender: 'Female',
      maxAge: 10,
      categories: ['General', 'SC', 'ST', 'OBC'],
      maxIncome: null,
    }
  }
];

export const checkEligibility = (profile, scheme) => {
  const criteria = scheme.eligibilityCriteria || {
    minAge: scheme.eligibility?.min_age,
    maxAge: scheme.eligibility?.max_age,
    maxIncome: scheme.eligibility?.max_family_income,
    categories: scheme.eligibility?.categories,
    gender: scheme.eligibility?.gender,
  };
  
  if (criteria.minAge && profile.age < criteria.minAge) return false;
  if (criteria.maxAge && profile.age > criteria.maxAge) return false;
  
  if (criteria.maxIncome && profile.family_income > criteria.maxIncome) return false;
  
  if (criteria.categories && !criteria.categories.includes(profile.category)) return false;
  
  if (criteria.gender && profile.gender !== criteria.gender) return false;
  
  return true;
};
