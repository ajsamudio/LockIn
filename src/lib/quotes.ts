export interface Quote {
  text: string
  author: string
}

export const QUOTES: Quote[] = [
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "It is not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
  { text: "Do not go where the path may lead; go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "One must imagine Sisyphus happy.", author: "Albert Camus" },
  { text: "The present moment always will have been.", author: "Epictetus" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "Conquer yourself rather than the world.", author: "René Descartes" },
  { text: "Time you enjoy wasting is not wasted time.", author: "Bertrand Russell" },
  { text: "The discipline of desire is the background of character.", author: "John Locke" },
  { text: "Every artist was first an amateur.", author: "Ralph Waldo Emerson" },
]

export function getRandomQuote(exclude?: Quote): Quote {
  const pool = exclude ? QUOTES.filter(q => q !== exclude) : QUOTES
  return pool[Math.floor(Math.random() * pool.length)]
}
