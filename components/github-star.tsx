// "use client";

// import { useEffect, useState } from "react";

// export function GithubStar() {
//   const [stars, setStars] = useState<number | null>(null);

//   useEffect(() => {
//     fetch("https://api.github.com/repos/bhushan4work/replore")
//       .then((r) => r.json())
//       .then((d) => setStars(d.stargazers_count));
//   }, []);

//   return (
//     <a
//       href="https://github.com/bhushan4work/replore"
//       target="_blank"
//       className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md transition hover:bg-white/20"
//     >
//       ⭐ Star

//       {stars !== null && (
//         <span className="font-semibold">
//           {stars.toLocaleString()}
//         </span>
//       )}
//     </a>
//   );
// }