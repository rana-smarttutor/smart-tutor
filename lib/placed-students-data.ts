import { PlacedStudent } from "./types";

/**
 * Placed Students Data
 * Includes both competitive exam results and corporate placements
 */
const rawStudentData = [
  // Competitive Exams & Govt Jobs
  {
    "STUDENT NAME": "Omkar Paturkar",
    "PHOTO  NAME": "Omkar Paturkar.png",
    "EXAM NAME": "MAH MBA CET 2024",
    "MARKS": "95+",
    "Rank": "_"
  },
  {
    "STUDENT NAME": "Mr. Ranjeet",
    "PHOTO  NAME": "Mr. Ranjeet.png",
    "EXAM NAME": "NABARD",
    "MARKS": "_",
    "Rank": "1st"
  },
  {
    "STUDENT NAME": "Ms.  Ritamvara",
    "PHOTO  NAME": "Ms.  Ritamvara.png",
    "EXAM NAME": "SBI PO",
    "MARKS": "_",
    "Rank": "1st"
  },
  {
    "STUDENT NAME": "Ms. Priyanka",
    "PHOTO  NAME": "Ms. Priyanka.png",
    "EXAM NAME": "SBI PO",
    "MARKS": "_",
    "Rank": "1st"
  },
  {
    "STUDENT NAME": "Mr. Darshit",
    "PHOTO  NAME": "Mr.Darshit.png",
    "EXAM NAME": "SBI PO",
    "MARKS": "_",
    "Rank": "1st"
  },
  {
    "STUDENT NAME": "Mr. Vishal",
    "PHOTO  NAME": "Mr.Vishal.png",
    "EXAM NAME": "SSC GD",
    "MARKS": "_",
    "Rank": "1st"
  },
  {
    "STUDENT NAME": "Mr. Kanade",
    "PHOTO  NAME": "Mr.Kanade.png",
    "EXAM NAME": "MAH MBA CET 2024",
    "MARKS": "99.37%",
    "Rank": "_"
  },
  {
    "STUDENT NAME": "Mr. Vaibhava",
    "PHOTO  NAME": "Mr.Vaibhava.png",
    "EXAM NAME": "CLAT(NLU KOLKATA)",
    "MARKS": "_",
    "Rank": "1st"
  },
  {
    "STUDENT NAME": "Mr. Aadesh Gaigawali",
    "PHOTO  NAME": "Mr.AadeshGaigawali.png",
    "EXAM NAME": "MAH MBA CET 2024",
    "MARKS": "99+",
    "Rank": "_"
  },
  {
    "STUDENT NAME": "Mr.Akash",
    "PHOTO  NAME": "Mr.Akash.png",
    "EXAM NAME": "MAHARASHTRA REVENUE OFFICER",
    "MARKS": "_",
    "Rank": "1st"
  },
  {
    "STUDENT NAME": "Mr.Raj Singh",
    "PHOTO  NAME": "RajSingh.png",
    "EXAM NAME": "RBI GRADE B",
    "MARKS": "_",
    "Rank": "1st"
  },
  {
    "STUDENT NAME": "Ms.Riya Kamble",
    "PHOTO  NAME": "RiyaKamble.png",
    "EXAM NAME": "RBI GRADE B",
    "MARKS": "_",
    "Rank": "1st"
  },
  {
    "STUDENT NAME": "Mr.Rupesh Katker",
    "PHOTO  NAME": "RupeshKatkar.png",
    "EXAM NAME": "INDIAN NAVY",
    "MARKS": "_",
    "Rank": "_"
  },
  {
    "STUDENT NAME": "Mr.Aman",
    "PHOTO  NAME": "Mr.Aman.png",
    "EXAM NAME": "SSC CGL(INCOME TAX OFFICER)",
    "MARKS": "_",
    "Rank": "1st"
  },
  {
    "STUDENT NAME": "Mr.Aditya Agarwal",
    "PHOTO  NAME": "AdityaAgarwal.png",
    "EXAM NAME": "IMU CET(MERCHANTNAVY)",
    "MARKS": "_",
    "Rank": "499"
  },
  {
    "STUDENT NAME": "Mr.Alok Singh",
    "PHOTO  NAME": "AlokSingh.png",
    "EXAM NAME": "IMU CET(MERCHANTNAVY)",
    "MARKS": "_",
    "Rank": "394"
  },
  {
    "STUDENT NAME": "Ms.Aditi Sharma",
    "PHOTO  NAME": "AditiSharma.png",
    "EXAM NAME": "IMU CET(MERCHANTNAVY)",
    "MARKS": "_",
    "Rank": "771"
  },

  // Corporate Placements (New Data)
  {
    "STUDENT NAME": "Rohan Patel",
    "PHOTO  NAME": "Rohan Patel.png",
    "EXAM NAME": "Amazon Future Engineers",
    "MARKS": "87.2%",
    "Rank": "Rank 25",
    "COMPANY NAME": "Amazon",
    "DESIGNATION": "Software Development Engineer-I",
    "PACKAGE": "₹22.0 LPA"
  },
  {
    "STUDENT NAME": "Sneha Kulkarni",
    "PHOTO  NAME": "Sneha Kulkarni.png",
    "EXAM NAME": "Infosys InfyTQ Certification",
    "MARKS": "93.1%",
    "Rank": "Rank 8",
    "COMPANY NAME": "Infosys",
    "DESIGNATION": "Systems Engineer",
    "PACKAGE": "₹8.5 LPA"
  },
  {
    "STUDENT NAME": "Aditya Verma",
    "PHOTO  NAME": "Aditya Verma.png",
    "EXAM NAME": "TCS National Qualifier Test",
    "MARKS": "85.7%",
    "Rank": "Rank 34",
    "COMPANY NAME": "Tata Consultancy Services",
    "DESIGNATION": "Assistant System Engineer",
    "PACKAGE": "₹7.8 LPA"
  },
  {
    "STUDENT NAME": "Neha Singh",
    "PHOTO  NAME": "Neha Singh.png",
    "EXAM NAME": "Accenture Placement Assessment",
    "MARKS": "90.3%",
    "Rank": "Rank 15",
    "COMPANY NAME": "Accenture",
    "DESIGNATION": "Application Development Associate",
    "PACKAGE": "₹10.2 LPA"
  },
  {
    "STUDENT NAME": "Karan Deshmukh",
    "PHOTO  NAME": "Karan Deshmukh.png",
    "EXAM NAME": "Wipro Elite National Talent Hunt",
    "MARKS": "88.6%",
    "Rank": "Rank 27",
    "COMPANY NAME": "Wipro",
    "DESIGNATION": "Project Engineer",
    "PACKAGE": "₹7.2 LPA"
  },
  {
    "STUDENT NAME": "Ananya Joshi",
    "PHOTO  NAME": "Ananya Joshi.png",
    "EXAM NAME": "Deloitte Graduate Recruitment",
    "MARKS": "94.5%",
    "Rank": "Rank 5",
    "COMPANY NAME": "Deloitte",
    "DESIGNATION": "Business Technology Analyst",
    "PACKAGE": "₹12.8 LPA"
  }
];

export function generatePlacedStudents(): PlacedStudent[] {
  const students = rawStudentData.map((s: any, i) => {
    let photoName = s["PHOTO  NAME"] ? s["PHOTO  NAME"].trim() : "";
    if (photoName && !photoName.includes(".")) {
      photoName += ".png";
    }

    // Default image if none provided
    const finalImage = photoName ? `/student-photos/${photoName}` : "/Smart-institue-logo.jpeg";

    // Diverse and impactful quotes
    const quotes = [
      "Smart IQ Institute' mentoring was the key to my success.",
      "The disciplined approach at Smart IQ Institute changed my perspective.",
      "Expert guidance and consistent mock tests made the difference.",
      "I found the perfect learning environment here to excel.",
      "The personalized attention helped me overcome my weaknesses.",
      "Smart IQ Institute provided the momentum I needed for my career.",
      "Grateful for the sharp mentoring and high-quality resources.",
      "The journey from student to professional was seamless here.",
      "Focused preparation and real academic momentum were game-changers.",
      "The expert faculty and study material are truly unmatched.",
      "Achieving my dream wouldn't have been possible without this support.",
      "Best platform for anyone serious about competitive exams.",
      "The mock tests perfectly simulated the real exam environment.",
      "Personalized feedback helped me improve my rank significantly.",
      "A complete ecosystem for academic and professional growth."
    ];

    return {
      id: `ps-${i + 1}`,
      name: s["STUDENT NAME"],
      location: "Vashi, Navi Mumbai",
      course: s["EXAM NAME"],
      image: finalImage,
      examName: s["EXAM NAME"],
      marks: s["MARKS"] === "_" ? undefined : s["MARKS"],
      rank: s["Rank"] === "_" ? undefined : s["Rank"],
      company: s["COMPANY NAME"],
      role: s["DESIGNATION"],
      salary: s["PACKAGE"],
      quote: quotes[i % quotes.length] // Assign unique quote from the list
    };
  });

  // Sort by package (LPA) descending
  return students.sort((a, b) => {
    const getLpaValue = (salary?: string) => {
      if (!salary) return 0;
      // Extract numeric value from "₹22.0 LPA"
      const match = salary.match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[0]) : 0;
    };
    
    return getLpaValue(b.salary) - getLpaValue(a.salary);
  });
}

export const generatedPlacedStudents = generatePlacedStudents();
