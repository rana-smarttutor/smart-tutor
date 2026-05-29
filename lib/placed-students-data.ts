import { PlacedStudent } from "./types";

/**
 * Placed Students Data
 * Source: public/student-photos/studentdata.json
 */
const rawStudentData = [
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
    "STUDENT NAME": "Ms. Darshit",
    "PHOTO  NAME": "Ms.Darshit.png",
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
    "STUDENT NAME": "Ms.Prajakta Jadhav",
    "PHOTO  NAME": "PrajaktaJadhav.png",
    "EXAM NAME": "COMMERCE",
    "MARKS": "97.36%",
    "Rank": "_"
  },
  {
    "STUDENT NAME": "Ms.Shivani Chaudhari",
    "PHOTO  NAME": "shivaniChaudhari.png",
    "EXAM NAME": "SCIENCE",
    "MARKS": "85%",
    "Rank": "_"
  },
  {
    "STUDENT NAME": "Ms.Shruti Kamble",
    "PHOTO  NAME": "ShrutiKamble.png",
    "EXAM NAME": "SCIENCE",
    "MARKS": "87.33%",
    "Rank": "_"
  },
  {
    "STUDENT NAME": "Mr.Arpit Gupta",
    "PHOTO  NAME": "ArpitGupta.png",
    "EXAM NAME": "COMMERCE",
    "MARKS": "79.43%",
    "Rank": "_"
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
    "STUDENT NAME": "Mr.Akshay Patil",
    "PHOTO  NAME": "AkshayPatil.png",
    "EXAM NAME": "SCIENCE",
    "MARKS": "93.67%",
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
  {
    "STUDENT NAME": "Ms.Harshita More",
    "PHOTO  NAME": "HarshitaMore.png",
    "EXAM NAME": "COMMERCE",
    "MARKS": "84.57%",
    "Rank": "_"
  }
];

export function generatePlacedStudents(): PlacedStudent[] {
  return rawStudentData.map((s, i) => {
    // Ensure photo name has extension and handle spaces/formatting
    let photoName = s["PHOTO  NAME"].trim();
    // Only append .png if no extension is present
    if (photoName && !photoName.includes(".")) {
      photoName += ".png";
    }

    return {
      id: `ps-${i + 1}`,
      name: s["STUDENT NAME"],
      location: "Vashi, Navi Mumbai",
      course: s["EXAM NAME"],
      image: `/student-photos/${photoName}`,
      examName: s["EXAM NAME"],
      marks: s["MARKS"] === "_" ? undefined : s["MARKS"],
      rank: s["Rank"] === "_" ? undefined : s["Rank"],
    };
  });
}

export const generatedPlacedStudents = generatePlacedStudents();
