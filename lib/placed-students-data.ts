import { PlacedStudent } from "./types";

const firstNames = [
  "Aarav", "Vihaan", "Vivaan", "Ananya", "Diya", "Advait", "Ishani", "Kabir", "Myra", "Aaryan",
  "Aavya", "Ishaan", "Saanvi", "Arjun", "Zara", "Sai", "Aria", "Arav", "Kiara", "Krishna",
  "Aditi", "Rohan", "Siddharth", "Prisha", "Aryan", "Aahana", "Reyansh", "Navya", "Ishan", "Shanaya",
  "Amit", "Priya", "Rahul", "Sneha", "Vikram", "Neha", "Aditya", "Pooja", "Sandeep", "Deepika",
  "Abhishek", "Ritu", "Manish", "Anjali", "Suresh", "Kavita", "Rajesh", "Meera", "Sunil", "Anita"
];

const lastNames = [
  "Sharma", "Verma", "Gupta", "Malhotra", "Kapoor", "Khanna", "Mehra", "Goel", "Bansal", "Aggarwal",
  "Patel", "Shah", "Mehta", "Joshi", "Kulkarni", "Deshpande", "Patil", "Deshmukh", "Pawar", "Gaekwad",
  "Iyer", "Iyengar", "Nair", "Menon", "Reddy", "Rao", "Chowdhury", "Basu", "Sengupta", "Chatterjee",
  "Singh", "Kaur", "Gill", "Sandhu", "Dhillon", "Mishra", "Pandey", "Tiwari", "Dubey", "Shukla",
  "Yadav", "Yadav", "Chauhan", "Thakur", "Rathore", "Solanki", "Bhat", "Dhar", "Kaul", "Wanchoo"
];

const primaryLocations = ["Vashi", "Navi Mumbai", "Mumbai", "Thane", "Panvel", "Nerul", "Koparkhairane", "Belapur"];
const otherLocations = ["Bangalore", "Hyderabad", "Pune", "Delhi", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh"];

const courses = [
  "UPSC Foundation", "MPSC Civil Services", "JEE Advanced", "NEET-UG", "Class 10 Board",
  "Class 12 Science", "Class 12 Commerce", "Banking (IBPS/SBI)", "SSC CGL", "Digital Marketing",
  "Data Science", "Spoken English & Personality Dev"
];

const companies = [
  "TCS", "Infosys", "Wipro", "HDFC Bank", "ICICI Bank", "Reliance Industries", "Amazon India",
  "Google India", "Accenture", "Cognizant", "Standard Chartered", "State Bank of India",
  "Income Tax Department", "Maharashtra State Govt", "Central Secretariat", "Deloitte",
  "PwC", "KPMG", "EY"
];

const roles = [
  "Software Engineer", "Data Analyst", "Probationary Officer", "Tax Assistant", "Deputy Collector",
  "Police Sub-Inspector", "Marketing Associate", "Financial Analyst", "Operations Manager",
  "Business Consultant", "Graduate Engineer Trainee"
];

const salaries = ["6.5 LPA", "8.2 LPA", "5.4 LPA", "12.0 LPA", "7.8 LPA", "9.6 LPA", "15.5 LPA", "4.8 LPA", "10.2 LPA"];

function getRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generatePlacedStudents(count: number): PlacedStudent[] {
  const students: PlacedStudent[] = [];
  for (let i = 1; i <= count; i++) {
    const isPrimary = Math.random() < 0.7;
    const location = isPrimary ? getRandom(primaryLocations) : getRandom(otherLocations);
    const firstName = getRandom(firstNames);
    const lastName = getRandom(lastNames);
    const name = `${firstName} ${lastName}`;
    
    // We have 27 images. Let's use them for the first 27 or randomly.
    const image = i <= 27 ? `/images/students/student-${i}.jpg` : undefined;
    
    const isPlaced = Math.random() < 0.6; // 60% are "placed", others are just "students" or toppers
    
    students.push({
      id: `ps-${i}`,
      name,
      location,
      course: getRandom(courses),
      company: isPlaced ? getRandom(companies) : undefined,
      role: isPlaced ? getRandom(roles) : undefined,
      salary: isPlaced ? getRandom(salaries) : undefined,
      image
    });
  }
  return students;
}

export const generatedPlacedStudents = generatePlacedStudents(220);
