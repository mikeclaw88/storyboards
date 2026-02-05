import { useGameStore } from '../stores/gameStore';

export function GameEndModal() {
  const gameComplete = useGameStore((s) => s.gameComplete);
  const practiceHistory = useGameStore((s) => s.practiceHistory);
  const totalScore = useGameStore((s) => s.totalScore);
  const stopPlay = useGameStore((s) => s.stopPlay);

  if (!gameComplete) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-[#4ade80] rounded-lg p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-3xl font-bold text-white text-center mb-6 font-mono">ROUND COMPLETE</h2>
        
        <div className="space-y-4 mb-8">
          <table className="w-full text-left text-sm font-mono">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="pb-2">Shot</th>
                <th className="pb-2">Distance</th>
                <th className="pb-2">To Pin</th>
                <th className="pb-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {practiceHistory.map((shot) => (
                <tr key={shot.shotNumber} className="border-b border-gray-800 text-white">
                  <td className="py-2">{shot.shotNumber}</td>
                  <td className="py-2">{shot.distance}m</td>
                  <td className="py-2">{shot.distanceToHole}m</td>
                  <td className="py-2 text-right text-[#4ade80] font-bold">+{shot.score}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-xl font-bold text-white border-t border-gray-600">
                <td className="pt-4" colSpan={3}>TOTAL</td>
                <td className="pt-4 text-right text-[#4ade80]">{totalScore}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <button
          onClick={stopPlay}
          className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-black font-bold py-3 px-6 rounded transition-colors duration-200 uppercase tracking-widest font-mono"
        >
          Return to Menu
        </button>
      </div>
    </div>
  );
}
