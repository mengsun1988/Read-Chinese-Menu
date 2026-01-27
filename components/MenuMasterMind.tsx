import React, { useState, useMemo, useEffect } from "react";

// --- 1. 数据结构与题库 ---
interface FoodQuestion {
  id: number;
  literal: string;        // 硬核直译名
  correct: string;        // 实际含义
  options: string[];      // 误导选项
  ingredients: string;    // 食材
  note: string;           // 趣味说明
}

const foodQuestions: FoodQuestion[] = [
  {
    id: 1,
    literal: "Pistol Leg",
    correct: "Fried Whole Chicken Leg",
    options: ["A lethal weapon", "Fried Whole Chicken Leg", "Leg of a horse", "Police equipment"],
    ingredients: "Chicken drumstick, flour, spices",
    note: "It's just a large fried chicken leg shaped like a pistol. No permits required!"
  },
  {
    id: 2,
    literal: "Baba Cake",
    correct: "Sticky Rice Sponge Cake",
    options: ["Baby food", "Something from the toilet", "Sticky Rice Sponge Cake", "A father's gift"],
    ingredients: "Rice flour, sugar, eggs",
    note: "The name comes from the soft texture, but it sounds very 'dangerous' in many other languages!"
  },
  {
    id: 3,
    literal: "Donkey Meat Fire Burn",
    correct: "Donkey Meat Sandwich",
    options: ["Donkey Meat Sandwich", "A donkey caught in a fire", "A very spicy donkey", "A desert survival tool"],
    ingredients: "Donkey meat, crispy pastry",
    note: "It's a legendary crispy sandwich from North China. No donkeys were harmed by fire!"
  },
  {
    id: 4,
    literal: "Line Chicken",
    correct: "Castrated Chicken (Capon)",
    options: ["Chicken with wires", "A thin chicken", "Castrated Chicken (Capon)", "Electronic chicken"],
    ingredients: "Capon chicken, ginger",
    note: "In some dialects, 'Line' is a homophone for 'Castrate' (骟). It refers to a capon, known for its tender meat."
  },
  {
    id: 5,
    literal: "Burn Wheat",
    correct: "Steamed Pork Dumplings",
    options: ["Torched wheat field", "Burned bread", "Steamed Pork Dumplings", "A farm accident"],
    ingredients: "Pork, shrimp, thin flour wrap",
    note: "This is 'Shaomai'. The name literally means 'to sell while hot' or 'burned wheat' depending on the region."
  },
  {
    id: 6,
    literal: "Taste Shrimp",
    correct: "Spicy Crawfish",
    options: ["Shrimp with a soul", "Spicy Crawfish", "Shrimp that can taste", "Philosophical seafood"],
    ingredients: "Crawfish, heavy spices, garlic, chili",
    note: "A superstar street food. It's called 'Taste Shrimp' because the heavy seasoning is the star of the show."
  },
  {
    id: 7,
    literal: "Cat Ears",
    correct: "Ear-shaped Pasta",
    options: ["Snack for cats", "Ear-shaped Pasta", "Fried kitten parts", "A listening device"],
    ingredients: "Wheat flour, water",
    note: "Handmade dough flicked into the shape of tiny cat ears. Very popular in Hangzhou and Shanxi!"
  },
  {
    id: 8,
    literal: "Starch Skin Leans on Meat",
    correct: "Braised Pork with Sheet Jelly",
    options: ["Romantic pork", "Starch Skin Leans on Meat", "Pork hiding under skin", "A sticky accident"],
    ingredients: "Pork belly, wide starch sheets",
    note: "The word 'Kao' (Leans on) is a cooking technique where sauce is simmered down until it clings to the meat."
  },
  {
    id: 9,
    literal: "Gold Coin Belly",
    correct: "Braised Honeycomb Tripe",
    options: ["A wallet made of meat", "Braised Honeycomb Tripe", "Money found in stomach", "Golden pig belly"],
    ingredients: "Beef tripe, soy sauce",
    note: "The honeycomb pattern on the tripe resembles ancient Chinese gold coins."
  },
  {
    id: 10,
    literal: "Pine Flower Egg",
    correct: "Preserved Century Egg",
    options: ["Egg from a pine tree", "Preserved Century Egg", "Egg-shaped flower", "Wood-flavored egg"],
    ingredients: "Duck egg, lime, ash",
    note: "Named after the beautiful pine-branch patterns that naturally form on the egg's surface during curing."
  },
  {
    id: 11,
    literal: "Ants Climbing a Tree",
    correct: "Spicy Noodles with Minced Pork",
    options: ["Insect snack", "Spicy Noodles with Minced Pork", "Tree bark salad", "Forest survival kit"],
    ingredients: "Glass noodles, minced pork",
    note: "The tiny bits of minced pork clinging to the noodles look like ants on tree branches."
  },
  {
    id: 12,
    literal: "Squirrel Mandarin Fish",
    correct: "Sweet and Sour Fried Fish",
    options: ["Squirrel and Fish hybrid", "Sweet and Sour Fried Fish", "Forest meat", "Nut-flavored fish"],
    ingredients: "Mandarin fish, pine nuts",
    note: "The fish is carved to look like a squirrel's tail and 'squeaks' when the hot sauce is poured!"
  },
  {
    id: 13,
    literal: "Lion’s Head",
    correct: "Huge Pork Meatballs",
    options: ["African safari meat", "Huge Pork Meatballs", "A brave man's heart", "Zodiac food"],
    ingredients: "Minced pork, cabbage",
    note: "The giant meatball looks like a lion's head, and the surrounding cabbage mimics its mane."
  },
  {
    id: 14,
    literal: "Phoenix Claws",
    correct: "Dim Sum Braised Chicken Feet",
    options: ["Mythical bird parts", "Dim Sum Braised Chicken Feet", "Golden eagle wings", "Spicy lizard legs"],
    ingredients: "Chicken feet, black bean sauce",
    note: "In Chinese culinary culture, 'Phoenix' is the elegant name for chicken."
  },
  {
    id: 15,
    literal: "Dragon Well Shrimp",
    correct: "Shrimp with Tea Leaves",
    options: ["Shrimp from a deep well", "Shrimp with Tea Leaves", "Fried dragon meat", "Seafood tea"],
    ingredients: "River shrimp, Longjing green tea leaves",
    note: "A Hangzhou specialty using Longjing (Dragon Well) tea leaves. No dragons were found in the well!"
  },
  {
    id: 16,
    literal: "Wife Cake",
    correct: "Sweet Winter Melon Pastry",
    options: ["A gift for wives", "Cake made of wives", "Sweet Winter Melon Pastry", "Marriage certificate cake"],
    ingredients: "Winter melon, flour, sugar",
    note: "Legend says a woman created this to save her father-in-law. No wives were actually cooked!"
  },
  {
    id: 17,
    literal: "Beggar's Chicken",
    correct: "Clay-Baked Whole Chicken",
    options: ["Leftover scraps", "Clay-Baked Whole Chicken", "Homeless style soup", "Cheap chicken wings"],
    ingredients: "Whole chicken, lotus leaves, clay",
    note: "Originally a humble dish baked in mud by a beggar, it's now a famous delicacy."
  },
  {
    id: 18,
    literal: "Donkey Rolls",
    correct: "Bean Flour Rice Rolls",
    options: ["Donkey in the dust", "Braised donkey", "Bean Flour Rice Rolls", "A rolling farm animal"],
    ingredients: "Glutinous rice, soybean flour",
    note: "Named after the way a donkey rolls in the dust, which is represented by the soybean flour."
  },
  {
    id: 19,
    literal: "Couples' Lung Slices",
    correct: "Beef and Offal in Chili Sauce",
    options: ["Human remains", "Beef and Offal in Chili Sauce", "A romantic dinner", "Heart-shaped meat"],
    ingredients: "Sliced beef, tripe, chili oil",
    note: "Created by a famous street-vending couple. It contains beef slices, but zero lungs or couples!"
  },
  {
    id: 20,
    literal: "Virgin Chicken",
    correct: "Steamed Spring Chicken",
    options: ["Pure chicken", "Steamed Spring Chicken", "A very shy bird", "Forbidden meat"],
    ingredients: "Young chicken, ginger",
    note: "A literal translation of 'Tongzi Ji'. It simply refers to a very young, tender spring chicken."
  },
  {
    id: 21,
    literal: "Saliva Chicken",
    correct: "Cold Chicken in Chili Sauce",
    options: ["Mouth-watering chicken", "Unsanitary chicken", "Chicken's spit", "Spicy soup"],
    ingredients: "Chicken, chili oil, sesame",
    note: "The dish is so flavorful that it makes your mouth water (salivate) instantly."
  },
  {
    id: 22,
    literal: "Peeing Beef Balls",
    correct: "Juicy Beef Balls",
    options: ["Dirty beef", "Juicy Beef Balls", "Urine-flavored meat", "Angry meatballs"],
    ingredients: "Minced beef, soup filling",
    note: "Famous in Hong Kong! The hot soup inside squirts out when you bite it, hence the name."
  },
  {
    id: 23,
    literal: "Buddha Jumps Over the Wall",
    correct: "Luxury Seafood Soup",
    options: ["A religious incident", "Luxury Seafood Soup", "A vegan nightmare", "Temple wall repair kit"],
    ingredients: "Abalone, sea cucumber, scallops",
    note: "It's so fragrant that even a vegetarian monk would jump over a wall to taste it!"
  },
  {
    id: 24,
    literal: "Pockmarked Old Lady Tofu",
    correct: "Spicy Tofu with Minced Beef",
    options: ["Skin condition tofu", "Spicy Tofu with Minced Beef", "Old woman's secret", "Grandma's face"],
    ingredients: "Tofu, chili oil, minced beef",
    note: "Named after the inventor, a pockmarked old lady (Mapo) in 19th-century Sichuan."
  },
  {
    id: 25,
    literal: "Water-Boiled Fish",
    correct: "Fish in Spicy Chili Oil",
    options: ["Healthy boiled fish", "Fish in Spicy Chili Oil", "Clear fish soup", "Plain seafood"],
    ingredients: "Fish fillets, dried chili, hot oil",
    note: "A misleading name—it's poached in water first but served in a massive pool of hot chili oil!"
  },
  {
    id: 26,
    literal: "Drunken Shrimp",
    correct: "Live Shrimp in Liquor",
    options: ["Shrimp that drinks", "Live Shrimp in Liquor", "Alcoholic seafood salad", "Tipsy chef's special"],
    ingredients: "Live shrimp, strong Chinese liquor",
    note: "The shrimp are marinated alive in strong alcohol. They are literally tipsy when served."
  },
  {
    id: 27,
    literal: "Stinking Tofu",
    correct: "Fermented Fried Tofu",
    options: ["Rotten garbage", "Fermented Fried Tofu", "Smelly feet snack", "Expired cheese"],
    ingredients: "Tofu, fermented brine",
    note: "Smells like garbage, tastes like heaven. A true benchmark for adventurous foodies."
  },
  {
    id: 28,
    literal: "Wood Ears",
    correct: "Black Fungus Mushroom",
    options: ["Ears from a tree", "Black Fungus Mushroom", "Deaf forest", "Wooden sculpture"],
    ingredients: "Black fungus",
    note: "A mushroom that grows on tree trunks and looks remarkably like a human ear."
  },
  {
    id: 29,
    literal: "Silver Needles",
    correct: "Short Rice Noodles",
    options: ["Metal medical kit", "Short Rice Noodles", "Dangerous soup", "Shiny jewelry"],
    ingredients: "Rice flour",
    note: "These are just short, pointy rice noodles. No sharp objects were used!"
  },
  {
    id: 30,
    literal: "Cold Skin",
    correct: "Savory Cold Noodles",
    options: ["Human skin", "Savory Cold Noodles", "Leather snack", "Refrigerated body part"],
    ingredients: "Wheat flour, chili oil",
    note: "Called 'Liangpi'. It's a refreshing noodle dish. Definitely not actual skin!"
  }
];

// --- 2. 游戏组件主逻辑 ---
interface MenuMasterMindProps {
  onFinish?: () => void;
  onAwardPoints?: () => void; // 新增：对接奖励
}

export default function MenuMasterMind({ onFinish, onAwardPoints }: MenuMasterMindProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [hasAwarded, setHasAwarded] = useState(false);

  const questions = useMemo(() => {
    return [...foodQuestions].sort(() => Math.random() - 0.5).slice(0, 5);
  }, []);

  const current = questions[index];
  const isFinished = index >= questions.length;

  // 当游戏结束且满分时，触发奖励逻辑
  useEffect(() => {
    if (isFinished && score === 5 && onAwardPoints && !hasAwarded) {
      onAwardPoints();
      setHasAwarded(true);
    }
  }, [isFinished, score, onAwardPoints, hasAwarded]);

  const handleSelect = (option: string) => {
    if (selected) return;
    setSelected(option);
    
    // 简单的震动反馈
    if (window.navigator.vibrate) {
      option === current.correct ? window.navigator.vibrate([10, 30, 10]) : window.navigator.vibrate(80);
    }
    
    if (option === current.correct) setScore(s => s + 1);
    setTimeout(() => setShowResult(true), 200);
  };

  const nextQuestion = () => {
    setSelected(null);
    setShowResult(false);
    setIndex(i => i + 1);
  };

  if (isFinished) {
    const isPerfect = score === 5;
    return (
      <div className="bg-emerald-900 rounded-[2.5rem] p-10 text-center shadow-2xl animate-in zoom-in duration-500 relative">
        <div className="text-6xl mb-4">{isPerfect ? "🏆" : "🎊"}</div>
        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
          {isPerfect ? "Perfect Score!" : "Well Done!"}
        </h3>
        <p className="text-emerald-200/60 text-xs mt-2 mb-4 uppercase tracking-widest font-bold">
          Score: {score} / 5
        </p>
        
        {isPerfect && (
          <div className="mb-8 p-4 bg-emerald-400/10 border border-emerald-400/30 rounded-2xl animate-pulse">
            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              +10 Credits Rewarded
            </p>
          </div>
        )}

        {!isPerfect && (
          <p className="text-emerald-200/40 text-[10px] mb-8 font-bold italic">
            Get 5/5 to earn credits reward!
          </p>
        )}

        <button 
          onClick={onFinish}
          className="w-full bg-emerald-400 text-emerald-950 font-black py-4 rounded-full uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
        >
          Finish Game
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-emerald-100 relative overflow-hidden transition-all duration-500">
      {/* 关闭按钮 */}
      <button 
        onClick={onFinish}
        className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors z-20"
      >
        ✕
      </button>

      {/* 进度条 */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-50">
        <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${((index + 1) / 5) * 100}%` }} />
      </div>

      <div className="mt-4 flex justify-between items-center mb-10 pr-10">
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Menu Master Mind</span>
        <div className="bg-emerald-50 px-3 py-1 rounded-full">
            <span className="text-[10px] font-black text-emerald-500 italic">{index + 1} OF 5</span>
        </div>
      </div>

      <div className="mb-10 text-center px-4">
        <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest mb-3">Literal Translation</p>
        <h4 className="text-3xl md:text-4xl font-black text-slate-900 italic leading-none tracking-tighter">"{current.literal}"</h4>
      </div>

      <div className="grid gap-3">
        {current.options.map((opt) => {
          const isCorrect = opt === current.correct;
          const isSelected = selected === opt;
          let btnStyle = "border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30";
          if (selected) {
            if (isCorrect) btnStyle = "border-emerald-500 bg-emerald-500 text-white scale-[1.02] shadow-lg shadow-emerald-200 z-10";
            else if (isSelected) btnStyle = "border-rose-500 bg-rose-50 text-rose-600 animate-shake";
            else btnStyle = "opacity-20 grayscale border-slate-50";
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={!!selected}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 font-bold text-sm flex justify-between items-center ${btnStyle} active:scale-95`}
            >
              <span className="pr-4">{opt}</span>
              {selected && isCorrect && <span className="text-lg">✨</span>}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="mt-8 p-6 bg-slate-900 rounded-[2rem] text-white animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px]">✓</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 italic">Traveler Insight</span>
          </div>
          <p className="text-xs font-bold leading-relaxed mb-5 text-slate-200 tracking-tight">{current.note}</p>
          <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/5">
            <span className="text-[8px] uppercase text-slate-500 font-black block mb-1 tracking-widest">Core Ingredients</span>
            <span className="text-[11px] font-bold text-emerald-200 leading-tight block">{current.ingredients}</span>
          </div>
          <button
            onClick={nextQuestion}
            className="w-full bg-emerald-500 text-emerald-950 font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] active:bg-emerald-400 transition-colors"
          >
            {index === 4 ? "See Results" : "Next Dish"}
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}} />
    </div>
  );
}