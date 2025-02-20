import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import WalletDisplay from "@/components/wallet/wallet-display";
import MemoryGame from "@/components/game/memory-game";
import { useAuth } from "@/hooks/use-auth";

export default function GamePage() {
  const { logoutMutation } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-background border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost">← Back to Map</Button>
          </Link>
          <div className="flex items-center gap-4">
            <WalletDisplay />
            <Button 
              variant="ghost" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Memory Game</h1>
          <p className="text-muted-foreground mb-8">
            Match pairs of cards to earn credits. Complete the game to earn bonus GameCoins!
          </p>
          <MemoryGame />
        </div>
      </main>
    </div>
  );
}
