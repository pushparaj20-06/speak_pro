import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Helper to determine if we are in Mock mode
const isMockMode = !db;

export const getUserProfile = async (userId) => {
  if (isMockMode) {
    // Mock Mode: Read from localStorage
    const saved = localStorage.getItem(`profile_${userId}`);
    return saved ? JSON.parse(saved) : null;
  }

  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const saveUserProfile = async (userId, profileData) => {
  if (isMockMode) {
    // Mock Mode: Save to localStorage
    localStorage.setItem(`profile_${userId}`, JSON.stringify(profileData));
    return true;
  }

  try {
    const docRef = doc(db, "users", userId);
    // Use merge: true to avoid overwriting other fields (like email or scores)
    await setDoc(docRef, profileData, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving user profile:", error);
    return false;
  }
};
