import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";

type MemoryCard = {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const GAME_SYMBOLS = ["🎮", "🎲", "🎯", "🎪", "🎨", "🎭", "🎪", "🎯"];

export default function MemoryGame() {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const { toast } = useToast();

  const collectRewardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/collect", {
        credits: 10,
        gamecoins: 1,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Congratulations!",
        description: "You earned 10 credits and 1 GameCoin!",
      });
    },
  });

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffledCards = [...GAME_SYMBOLS, ...GAME_SYMBOLS]
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledCards);
    setFlippedCards([]);
  };

  const handleCardClick = (id: number) => {
    if (isLocked) return;
    if (flippedCards.length === 2) return;
    if (cards[id].isMatched) return;
    if (flippedCards.includes(id)) return;

    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, isFlipped: true } : card
      )
    );
    setFlippedCards((prev) => [...prev, id]);

    if (flippedCards.length === 1) {
      setIsLocked(true);
      const firstCard = cards[flippedCards[0]];
      const secondCard = cards[id];

      if (firstCard.value === secondCard.value) {
        setCards((prev) =>
          prev.map((card) =>
            card.id === id || card.id === flippedCards[0]
              ? { ...card, isMatched: true }
              : card
          )
        );
        setFlippedCards([]);
        setIsLocked(false);

        // Check if game is complete
        if (cards.filter((card) => !card.isMatched).length === 2) {
          collectRewardMutation.mutate();
        }
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === id || card.id === flippedCards[0]
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className={`w-24 h-24 flex items-center justify-center text-4xl cursor-pointer transition-all duration-300 ${
                card.isMatched ? "opacity-50" : ""
              }`}
              onClick={() => handleCardClick(card.id)}
            >
              {card.isFlipped ? card.value : "❓"}
            </Card>
          </motion.div>
        ))}
      </div>
      <Button onClick={initializeGame}>New Game</Button>
    </div>
  );
}
