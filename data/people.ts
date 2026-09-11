export type Person = {
  id: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  categories: string[];
  accent: "coral" | "lavender";
  profileImage?: string;
  whatsapp?: string;
  facebook?: string;
};

export const people: Person[] = [
  {
    id: "amara",
    name: "Amara",
    age: 24,
    bio: "Always looking for something worth noticing, learning, or creating.",
    interests: ["Photography", "Physics", "Music", "Cinema", "Travel"],
    categories: ["Creative", "Science & Ideas", "Culture", "Exploration"],
    accent: "coral",
    profileImage: "/images/amara.jpg",
    whatsapp: "",
    facebook: "",
  },
  {
    id: "daniel",
    name: "Daniel",
    age: 26,
    bio: "Curious about how things work and how technology can make them better.",
    interests: ["Technology", "Design", "Books", "Programming", "Architecture"],
    categories: ["Technology", "Creative", "Learning", "Science & Ideas"],
    accent: "lavender",
    profileImage: "/images/daniel.jpg",
    whatsapp: "",
    facebook: "",
  },
  {
    id: "maya",
    name: "Maya",
    age: 23,
    bio: "Drawn to art, new places, and conversations that change how you see things.",
    interests: ["Art", "Travel", "Psychology", "Photography", "Writing"],
    categories: ["Creative", "Exploration", "Learning", "Culture"],
    accent: "coral",
    profileImage: "/images/maya.jpg",
    whatsapp: "",
    facebook: "",
  },
  {
    id: "noah",
    name: "Noah",
    age: 27,
    bio: "Engineer by nature, music lover by choice, and permanently curious.",
    interests: ["Engineering", "Music", "Coffee", "Technology", "Space"],
    categories: ["Science & Ideas", "Technology", "Culture", "Everyday interests"],
    accent: "lavender",
    profileImage: "/images/noah.jpg",
    whatsapp: "",
    facebook: "",
  },
  {
    id: "sofia",
    name: "Sofia",
    age: 25,
    bio: "Science, stories, and films that leave you thinking long after they end.",
    interests: ["Science", "Reading", "Film", "Psychology", "History"],
    categories: ["Science & Ideas", "Learning", "Culture", "Creative"],
    accent: "coral",
    profileImage: "/images/sofia.jpg",
    whatsapp: "",
    facebook: "",
  },
  {
    id: "ethan",
    name: "Ethan",
    age: 28,
    bio: "Builds software, reads history, and never gets tired of discovering new things.",
    interests: ["Programming", "History", "Photography", "Books", "Technology"],
    categories: ["Technology", "Learning", "Creative", "Culture"],
    accent: "lavender",
    profileImage: "/images/ethan.jpg",
    whatsapp: "",
    facebook: "",
  },
];