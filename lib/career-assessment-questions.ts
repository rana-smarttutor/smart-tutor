
import "server-only";

import type {
  AptitudeCategory,
  AptitudeQuestion,
  InterestDimension,
  InterestQuestion,
} from "@/lib/career-assessment";

import {
  validateAssessmentBank,
} from "@/lib/career-assessment";

type RawQuestion = [
  prompt: string,
  answer: number,
  options: [string, string, string, string],
];

function buildAptitude(
  category: AptitudeCategory,
  rows: RawQuestion[],
): AptitudeQuestion[] {
  return rows.map(([prompt, answer, options], index) => ({
    id: `${category}-${String(index + 1).padStart(2, "0")}`,
    category,
    prompt,
    options: options.map((option, optionIndex) => ({
      id: String(optionIndex),
      text: option,
    })),
    correctOptionId: String(answer),
    explanation: "Answer verified against the question.",
  }));
}

const numerical: RawQuestion[] = [
  ["What is 15% of 200?", 1, ["20", "30", "40", "50"]],
  ["Calculate 18 + 27 × 2.", 2, ["90", "54", "72", "81"]],
  ["A product costs ₹800 after a 20% discount. What was its original price?", 2, ["₹900", "₹960", "₹1,000", "₹1,200"]],
  ["Find the next number: 3, 6, 12, 24, __.", 3, ["36", "42", "46", "48"]],
  ["What is the average of 12, 18 and 30?", 0, ["20", "22", "24", "25"]],
  ["Divide 64 in the ratio 3:5. What is the larger share?", 2, ["24", "32", "40", "48"]],
  ["A train covers 150 km in 3 hours. What is its average speed?", 1, ["45 km/h", "50 km/h", "55 km/h", "60 km/h"]],
  ["What is 7 squared minus 5 squared?", 3, ["12", "18", "20", "24"]],
  ["Solve: 4x + 6 = 30.", 1, ["5", "6", "7", "8"]],
  ["What is 3/4 of 80?", 2, ["40", "50", "60", "70"]],
  ["A quantity rises from 50 to 65. What is the percentage increase?", 1, ["25%", "30%", "35%", "40%"]],
  ["Five notebooks cost ₹175. How much do eight cost at the same rate?", 2, ["₹240", "₹260", "₹280", "₹300"]],
  ["What is the lowest common multiple of 6 and 8?", 0, ["24", "32", "36", "48"]],
  ["If 2x = 3y and y = 8, what is x?", 2, ["8", "10", "12", "16"]],
  ["A square has a perimeter of 36 cm. What is its area?", 1, ["64 cm²", "81 cm²", "100 cm²", "144 cm²"]],
];

const verbal: RawQuestion[] = [
  ["Choose the closest meaning of 'brief'.", 0, ["Short", "Heavy", "Loud", "Late"]],
  ["Choose the opposite of 'scarce'.", 2, ["Rare", "Limited", "Abundant", "Small"]],
  ["Complete: She has lived here ___ 2020.", 1, ["for", "since", "from", "by"]],
  ["Which sentence is grammatically correct?", 2, ["He don't like tea.", "He doesn't likes tea.", "He doesn't like tea.", "He not likes tea."]],
  ["Book is to reading as fork is to ___.", 1, ["Drawing", "Eating", "Writing", "Running"]],
  ["Choose the correctly spelled word.", 3, ["Definately", "Definetely", "Definatly", "Definitely"]],
  ["The word 'meticulous' most nearly means ___.", 1, ["Careless", "Very careful", "Very fast", "Easily tired"]],
  ["Complete: Neither of the answers ___ correct.", 0, ["is", "are", "were", "have"]],
  ["Which word does not belong?", 3, ["Rose", "Lily", "Jasmine", "Carrot"]],
  ["Choose the opposite of 'expand'.", 2, ["Increase", "Extend", "Contract", "Enlarge"]],
  ["Which sentence uses the apostrophe correctly?", 1, ["The students books are new.", "The student's book is new.", "The students's book is new.", "The student book's is new."]],
  ["Complete: If I had studied, I ___ passed.", 3, ["will have", "would", "will", "would have"]],
  ["What is the main purpose of a summary?", 2, ["Add new arguments", "Copy every detail", "Present key points briefly", "Replace the original facts"]],
  ["Which word is most similar to 'reliable'?", 0, ["Dependable", "Temporary", "Unusual", "Unclear"]],
  ["Choose the sentence with correct punctuation.", 1, ["Lets eat, Grandma.", "Let's eat, Grandma.", "Lets eat Grandma.", "Let's eat Grandma"]],
];

const logical: RawQuestion[] = [
  ["Find the next number: 2, 5, 8, 11, __.", 1, ["13", "14", "15", "16"]],
  ["All roses are flowers. Which statement must be true?", 2, ["All flowers are roses", "No roses are red", "Every rose is a flower", "Every flower has thorns"]],
  ["If A is taller than B and B is taller than C, who is shortest?", 2, ["A", "B", "C", "Cannot determine"]],
  ["Complete the sequence: A, C, E, G, __.", 0, ["I", "H", "J", "K"]],
  ["Which number is different from the others?", 3, ["4", "9", "16", "20"]],
  ["If today is Monday, what day will it be after 10 days?", 1, ["Wednesday", "Thursday", "Friday", "Saturday"]],
  ["All cats are mammals. Some mammals swim. What must follow?", 3, ["All cats swim", "Some cats swim", "No cats swim", "Cats are mammals"]],
  ["Find the missing number: 1, 4, 9, 16, __.", 2, ["20", "24", "25", "36"]],
  ["Which item belongs in the sequence: red, blue, red, blue, __?", 0, ["Red", "Green", "Yellow", "Blue"]],
  ["If P implies Q and P is true, what follows?", 1, ["Q is false", "Q is true", "P is false", "Nothing follows"]],
  ["Find the next number: 81, 27, 9, 3, __.", 2, ["0", "2", "1", "6"]],
  ["Which pair has the same relationship as bird : nest?", 1, ["Fish : tree", "Bee : hive", "Dog : cloud", "Horse : river"]],
  ["Five people stand in a line. A is first and E is last. How many people stand between them?", 2, ["2", "4", "3", "1"]],
  ["Find the odd one out.", 3, ["Triangle", "Square", "Pentagon", "Sphere"]],
  ["If no squares are circles, can a shape be both a square and a circle under that rule?", 0, ["No", "Yes", "Only sometimes", "Not enough information"]],
];

const spatial: RawQuestion[] = [
  ["How many degrees are in a quarter-turn?", 1, ["45°", "90°", "180°", "270°"]],
  ["A shape is reflected in a vertical mirror. What changes?", 2, ["Its area", "Its number of sides", "Left-right orientation", "Its colour"]],
  ["How many faces does a cube have?", 0, ["6", "8", "10", "12"]],
  ["Which shape has exactly three sides?", 2, ["Square", "Pentagon", "Triangle", "Hexagon"]],
  ["A person faces north and turns right. Which direction do they face?", 1, ["West", "East", "South", "North"]],
  ["How many vertices does a rectangle have?", 2, ["2", "3", "4", "6"]],
  ["Which shape can roll smoothly in every direction on a flat floor?", 3, ["Cube", "Pyramid", "Rectangular prism", "Sphere"]],
  ["A clockwise half-turn equals ___.", 0, ["180°", "90°", "45°", "360°"]],
  ["A square is rotated by 90°. What happens to its area?", 1, ["It doubles", "It stays the same", "It halves", "It becomes zero"]],
  ["Which solid has two circular faces and one curved surface?", 2, ["Sphere", "Cone", "Cylinder", "Cube"]],
  ["A person facing south turns left. Which direction do they face?", 1, ["West", "East", "North", "South"]],
  ["How many edges does a cube have?", 3, ["6", "8", "10", "12"]],
  ["A paper rectangle is folded in half along its width. What happens to the visible area?", 0, ["It halves", "It doubles", "It triples", "It stays the same"]],
  ["Which shape is a two-dimensional net of six equal squares commonly folded into?", 2, ["Cone", "Cylinder", "Cube", "Sphere"]],
  ["What is the angle between the hour and minute hands of a clock at 3:00?", 1, ["45°", "90°", "120°", "180°"]],
];

const dataInterpretation: RawQuestion[] = [
  ["A class has 12 boys and 18 girls. How many students are there?", 2, ["24", "28", "30", "32"]],
  ["Sales were 100 in January and 150 in February. What was the increase?", 0, ["50", "100", "150", "250"]],
  ["A store sold 10, 20 and 30 units over three days. What was the daily average?", 1, ["15", "20", "25", "30"]],
  ["A survey has 40 responses, 10 of which prefer science. What percentage prefer science?", 2, ["10%", "20%", "25%", "40%"]],
  ["A school recorded attendance of 90, 85 and 95. What is the highest value?", 3, ["85", "90", "92", "95"]],
  ["A table shows Monday: 12, Tuesday: 15, Wednesday: 9. Which day was lowest?", 2, ["Monday", "Tuesday", "Wednesday", "All equal"]],
  ["Expenses are ₹200 for travel and ₹300 for food. What share of the total is food?", 1, ["40%", "60%", "50%", "30%"]],
  ["A chart shows 8, 12, 16, 20. What is the range?", 2, ["8", "10", "12", "16"]],
  ["Visitors increased from 200 to 250. What is the percentage growth?", 0, ["25%", "20%", "30%", "50%"]],
  ["A group has scores 5, 7 and 9. What is their median?", 1, ["5", "7", "8", "9"]],
  ["Two departments have 40 and 60 workers. What is their ratio?", 2, ["1:3", "3:2", "2:3", "4:5"]],
  ["A shop's revenue is ₹10,000 and costs are ₹7,500. What is its profit?", 1, ["₹1,500", "₹2,500", "₹3,500", "₹4,500"]],
  ["Of 80 participants, 20 are absent. What is the attendance rate?", 3, ["20%", "25%", "60%", "75%"]],
  ["A graph shows 5 units in April, 8 in May and 6 in June. Which month is highest?", 1, ["April", "May", "June", "All equal"]],
  ["A project completed 45 of 60 tasks. What percentage is complete?", 2, ["60%", "70%", "75%", "80%"]],
];


export const CAREER_APTITUDE_QUESTIONS: AptitudeQuestion[] = [
  ...buildAptitude("numerical", numerical.slice(0, 5)),
  ...buildAptitude("verbal", verbal.slice(0, 5)),
  ...buildAptitude("logical", logical.slice(0, 5)),
  ...buildAptitude("spatial", spatial.slice(0, 5)),
  ...buildAptitude(
    "data-interpretation",
    dataInterpretation.slice(0, 5),
  ),
];


const interestStatements: Record<
  InterestDimension,
  string[]
> = {
  realistic: [
    "I enjoy building or repairing physical objects.",
    "I like learning to use tools or equipment.",
    "I enjoy practical experiments and hands-on tasks.",
    "I like figuring out how machines work.",
    "I enjoy activities that involve making things.",
    "I prefer seeing practical results from my work.",
  ],
  investigative: [
    "I enjoy investigating why things happen.",
    "I like solving unfamiliar problems.",
    "I enjoy analysing evidence before deciding.",
    "I like scientific or technical questions.",
    "I enjoy discovering patterns in information.",
    "I like researching topics in depth.",
  ],
  artistic: [
    "I enjoy drawing, designing or creating.",
    "I like expressing ideas in original ways.",
    "I enjoy writing stories or creative content.",
    "I like creating new visual designs.",
    "I enjoy music, performing or artistic projects.",
    "I prefer tasks with room for imagination.",
  ],
  social: [
    "I enjoy helping others learn.",
    "I like listening to people's concerns.",
    "I enjoy teamwork and supporting classmates.",
    "I like explaining difficult topics to others.",
    "I enjoy volunteering or community activities.",
    "I find satisfaction in helping people improve.",
  ],
  enterprising: [
    "I enjoy organising people around a goal.",
    "I like presenting and persuading others.",
    "I am interested in starting a business.",
    "I enjoy taking initiative in group activities.",
    "I like planning events or projects.",
    "I enjoy making decisions and leading activities.",
  ],
  conventional: [
    "I enjoy keeping information organised.",
    "I like following clear procedures.",
    "I enjoy checking details for accuracy.",
    "I prefer planning tasks with clear deadlines.",
    "I like managing lists, schedules or records.",
    "I feel comfortable working with structured information.",
  ],
};


export const CAREER_INTEREST_QUESTIONS: InterestQuestion[] =
  (
    Object.entries(
      interestStatements,
    ) as Array<[InterestDimension, string[]]>
  ).flatMap(([dimension, prompts]) =>
    prompts.slice(0, 3).map((prompt, index) => ({
      id: `interest-${dimension}-${String(index + 1).padStart(2, "0")}`,
      dimension,
      prompt,
    })),
  );


export const CAREER_QUESTION_BANK_VERSION = 2;

const bankErrors = validateAssessmentBank(
  CAREER_APTITUDE_QUESTIONS,
  CAREER_INTEREST_QUESTIONS,
);

if (bankErrors.length > 0) {
  throw new Error(
    `Invalid Career Assessment question bank:\n${bankErrors.join("\n")}`,
  );
}

export function getPublicAssessmentQuestions() {
  return {
    aptitude: CAREER_APTITUDE_QUESTIONS.map(
      ({ id, category, prompt, options }) => ({
        id,
        category,
        prompt,
        options,
      }),
    ),
    interests: CAREER_INTEREST_QUESTIONS.map(
      ({ id, dimension, prompt }) => ({
        id,
        dimension,
        prompt,
      }),
    ),
  };
}
