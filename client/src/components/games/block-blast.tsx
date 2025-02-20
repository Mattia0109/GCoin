import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

type BlockType = "normal" | "gold" | "gamecoin" | "empty";

interface Block {
  type: BlockType;
  id: string;
}

interface GameState {
  grid: Block[][];
  score: number;
  gameOver: boolean;
  combo: number;
}

const GRID_SIZE = 10;
const BLOCK_TYPES: BlockType[] = ["normal", "normal", "normal", "gold", "gamecoin"];

export default function BlockBlast() {
  const [gameState, setGameState] = useState<GameState>({
    grid: Array(GRID_SIZE).fill([]).map(() =>
      Array(GRID_SIZE).fill({ type: "empty", id: "" })
    ),
    score: 0,
    gameOver: false,
    combo: 0,
  });
  
  const { toast } = useToast();

  const collectRewardMutation = useMutation({
    mutationFn: async ({ credits, gamecoins }: { credits: number; gamecoins: number }) => {
      const res = await apiRequest("POST", "/api/collect", {
        credits,
        gamecoins,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Ricompensa ottenuta!",
        description: `Hai guadagnato crediti e GameCoin!`,
      });
    },
  });

  const generateBlock = (): Block => {
    const randomType = BLOCK_TYPES[Math.floor(Math.random() * BLOCK_TYPES.length)];
    return {
      type: randomType,
      id: Math.random().toString(36).substr(2, 9),
    };
  };

  const checkLines = () => {
    let completedLines = 0;
    let newGrid = [...gameState.grid];
    let creditsEarned = 0;
    let gamecoinsEarned = 0;

    // Check rows
    for (let i = 0; i < GRID_SIZE; i++) {
      if (newGrid[i].every(block => block.type !== "empty")) {
        // Count special blocks before clearing
        newGrid[i].forEach(block => {
          if (block.type === "gold") creditsEarned += 5;
          if (block.type === "gamecoin") gamecoinsEarned += 1;
        });
        
        // Clear the line
        newGrid[i] = Array(GRID_SIZE).fill({ type: "empty", id: "" });
        completedLines++;
      }
    }

    // Apply combo multiplier
    const comboMultiplier = Math.min(3, 1 + (gameState.combo * 0.5));
    creditsEarned = Math.floor(creditsEarned * comboMultiplier);

    if (completedLines > 0) {
      setGameState(prev => ({
        ...prev,
        grid: newGrid,
        score: prev.score + (completedLines * 100),
        combo: prev.combo + 1,
      }));

      if (creditsEarned > 0 || gamecoinsEarned > 0) {
        collectRewardMutation.mutate({ credits: creditsEarned, gamecoins: gamecoinsEarned });
      }
    } else {
      setGameState(prev => ({ ...prev, combo: 0 }));
    }
  };

  const placeBlock = (row: number, col: number) => {
    if (gameState.grid[row][col].type !== "empty" || gameState.gameOver) return;

    const newBlock = generateBlock();
    const newGrid = [...gameState.grid];
    newGrid[row] = [...newGrid[row]];
    newGrid[row][col] = newBlock;

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
    }));

    // Check if game is over
    const hasEmptyCell = newGrid.some(row => row.some(cell => cell.type === "empty"));
    if (!hasEmptyCell) {
      setGameState(prev => ({ ...prev, gameOver: true }));
      toast({
        title: "Game Over",
        description: `Punteggio finale: ${gameState.score}`,
      });
    }

    checkLines();
  };

  const resetGame = () => {
    setGameState({
      grid: Array(GRID_SIZE).fill([]).map(() =>
        Array(GRID_SIZE).fill({ type: "empty", id: "" })
      ),
      score: 0,
      gameOver: false,
      combo: 0,
    });
  };

  const getBlockColor = (type: BlockType): string => {
    switch (type) {
      case "normal":
        return "bg-primary/20 hover:bg-primary/30";
      case "gold":
        return "bg-yellow-400/20 hover:bg-yellow-400/30";
      case "gamecoin":
        return "bg-blue-500/20 hover:bg-blue-500/30";
      default:
        return "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700";
    }
  };

  const getBlockSymbol = (type: BlockType): string => {
    switch (type) {
      case "normal":
        return "⬜";
      case "gold":
        return "✨";
      case "gamecoin":
        return "💎";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex justify-between w-full max-w-xl mb-4">
        <div>
          <p className="text-lg font-semibold">Punteggio: {gameState.score}</p>
          <p className="text-sm text-muted-foreground">Combo: x{Math.min(3, 1 + (gameState.combo * 0.5)).toFixed(1)}</p>
        </div>
        <Button onClick={resetGame}>Nuova Partita</Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-10 gap-1">
          {gameState.grid.map((row, rowIndex) =>
            row.map((block, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${getBlockColor(
                  block.type
                )} ${block.type === "empty" && !gameState.gameOver ? "cursor-pointer" : "cursor-not-allowed"}`}
                onClick={() => placeBlock(rowIndex, colIndex)}
                disabled={block.type !== "empty" || gameState.gameOver}
              >
                {getBlockSymbol(block.type)}
              </button>
            ))
          )}
        </div>
      </Card>

      {gameState.gameOver && (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Game Over!</h3>
          <p className="text-muted-foreground">Punteggio finale: {gameState.score}</p>
          <Button onClick={resetGame} className="mt-4">
            Gioca ancora
          </Button>
        </div>
      )}
    </div>
  );
}
