import Link from "next/link";

const firstSteps = [
  { href: "/captions#caption-feed", number: "01", icon: "↗", title: "See what people are eating", description: "Browse real food photos, honest restaurant reviews and playful AI reactions.", action: "Explore posts", access: "No sign-in needed" },
  { href: "/captions#create-caption", number: "02", icon: "✦", title: "Share my own meal", description: "Upload a photo, write your review, choose an AI voice, preview privately, then publish.", action: "Create a post", access: "Sign-in required" },
  { href: "/eat", number: "03", icon: "⌖", title: "Find a restaurant", description: "Choose a location and food preferences, then compare nearby restaurant ideas.", action: "Find food", access: "Sign-in required" },
  { href: "/meal-coach", number: "04", icon: "☀", title: "Plan my next meal", description: "Show what you have eaten today and get practical ideas for what to eat next.", action: "Plan my meals", access: "Sign-in required" },
];

export function StartHere() {
  return <section id="getting-started" className="start-guide" aria-labelledby="start-heading">
    <div className="start-heading-row"><div><p className="eyebrow">FIRST TIME HERE? START HERE.</p><h2 id="start-heading">What would you like to do?</h2></div><p>Choose one goal. You do not need to learn every feature first.</p></div>
    <div className="start-cards">{firstSteps.map(step => <Link href={step.href} className="start-card" key={step.number}><span className="start-card-number" aria-hidden="true">{step.number} · {step.icon}</span><span className="access-label">{step.access}</span><h3>{step.title}</h3><p>{step.description}</p><strong>{step.action} →</strong></Link>)}</div>
    <p className="guide-note"><strong>Not sure?</strong> Start with <Link href="/captions#caption-feed">Explore posts</Link>. Every page keeps the same top navigation, highlights your current section and gives you a route back to this guide.</p>
  </section>;
}

export function PostingGuide() {
  return <details className="posting-guide" open><summary>New to sharing? Follow these four steps.</summary><ol><li><strong>Upload & describe.</strong><span>Add your food photo, dish, restaurant and honest review.</span></li><li><strong>Choose a character.</strong><span>A fiery chef, your cat or your dog adds a fictional AI reaction.</span></li><li><strong>Preview privately.</strong><span>Nothing is public yet. Open <Link href="/captions?mine=1">My posts</Link> and check both takes.</span></li><li><strong>Publish when ready.</strong><span>Your meal enters the community only after you press Publish.</span></li></ol><p><strong>Two different ratings:</strong> your stars rate the meal; community votes rate the AI reaction.</p></details>;
}
