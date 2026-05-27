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
    "MARKS": "99.37",
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
  }
];

export function generatePlacedStudents(): PlacedStudent[] {
  return rawStudentData.map((s, i) => {
    // Ensure photo name has extension
    let photoName = s["PHOTO  NAME"];
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
